import models
import os, os.path
from flask import Blueprint, jsonify, request, current_app
from app import db

project_api = Blueprint("project_api", __name__)


@project_api.route("new", methods=['POST'])
def new():
    new_project = request.json
    # noinspection PyArgumentList
    project = models.Project(
        name=new_project['name'],
        description=new_project['description'],
        folder=new_project['folder']
    )
    db.session.add(project)
    db.session.commit()
    for label in new_project['labels']:
        label_obj = models.Label(
            project_id=project.id,
            name=label['name'],
            color=label['color'],
        )
        db.session.add(label_obj)
    db.session.commit()

    return jsonify(project.to_json())


@project_api.route("edit", methods=["POST"])
def edit():
    new_project = request.json
    db.session.query(models.Project).filter(models.Project.id == new_project['id']).update({
        "id": new_project["id"],
        "name": new_project["name"],
        "description": new_project["description"],
        "folder": new_project["folder"]
    })
    db.session.commit()
    for label in new_project['labels']:
        if 'id' in label:
            # updating label data:
            db.session.query(models.Label).filter(models.Label.id == label['id']).update({
                "id": label["id"],
                "name": label["name"],
                "label_color": ";".join(map(str, label["color"]))
            })
        else:
            db.session.add(models.Label(
                project_id=new_project['id'],
                name=label['name'],
                color=label['color'],
            ))
        db.session.commit()
    return jsonify(models.Project.query.get(new_project['id']).to_json())


@project_api.route("valid_path", methods=["POST"])
def valid_path():
    path = request.json['path']
    return jsonify({
        "valid_path": os.path.exists(path)
    })


@project_api.route("tasks")
def tasks():
    tasks = models.AnnotationTask.query.join(models.UserTask).filter(models.UserTask.completed == True).all()
    resp = []
    for task in tasks:
        user_tasks = models.UserTask.query.filter(
            models.UserTask.annotation_task_id == task.id, models.UserTask.completed == True).all()
        resp.append({
            **task.to_dict("simple"),
            "user_tasks": [x.to_dict() for x in user_tasks]
        })
    return jsonify(resp)


@project_api.route("remove_label", methods=["POST"])
def remove_label():
    label = request.json
    db.session.query(models.Label).filter(models.Label.id == label['id']).delete()
    db.session.commit()
    return jsonify({"success": True})


@project_api.route("list")
def list():
    return jsonify([x.to_json() for x in models.Project.query.all()])
