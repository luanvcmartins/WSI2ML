import models
import uuid
import os
from flask import Blueprint, jsonify, request, make_response
from flask_jwt_extended import jwt_required, current_user
from app import db

task_api = Blueprint("task_api", __name__)


@task_api.route("new", methods=["POST"])
@jwt_required()
def new():
    if not current_user.is_admin:
        return jsonify({"msg": 'Not an admin!'}), 401
    new_task = request.json
    task = models.Task(
        project_id=new_task['project_id'],
        name=new_task['name']
    )
    for slide in new_task['slides']:
        m_slide = models.Slide.query.get(slide['id'])
        if m_slide is None:
            m_slide = models.Slide(id=slide['id'], file=slide['file'])
        task.slides.append(m_slide)
    db.session.add(task)
    db.session.commit()
    for user in new_task['assigned']:
        db.session.add(models.UserTask(
            id=str(uuid.uuid4()),
            task_id=task.id,
            user_id=user['id'],
            completed=False
        ))

    db.session.commit()
    return jsonify(task.to_dict())


@task_api.route("list", methods=['GET'])
@jwt_required()
def list():
    if current_user.is_admin:
        tasks = db.session.query(models.Task).all()
    else:
        tasks = db.session.query(models.Task).join(models.UserTask).filter(
            models.UserTask.user_id == current_user.id).all()
    return jsonify([x.to_dict() for x in tasks])


@task_api.route("files", methods=['GET'])
@jwt_required()
def files():
    project_id = request.args['project_id']
    project = db.session.query(models.Project).filter(models.Project.id == project_id).first()
    return jsonify([{"id": x, "file": os.path.join(project.folder, x)} for x in os.listdir(project.folder)])
