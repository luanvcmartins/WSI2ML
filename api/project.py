from flask import Blueprint, session, jsonify, request, current_app
import models
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


@project_api.route("list")
def list():
    return jsonify([x.to_json() for x in models.Project.query.all()])
