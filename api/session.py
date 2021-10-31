import json
import os.path
import uuid
from operator import attrgetter

import models
from analyzer.session import Session
from flask import Blueprint, jsonify, request, make_response
from flask_jwt_extended import current_user, jwt_required
from app import db
from itertools import groupby

session_api = Blueprint("session_api", __name__)

sessions = {}


@session_api.route("create", methods=['POST'])
@jwt_required()
def create_session():
    task = request.json
    if current_user.id in [x['id'] for x in task['assigned']]:
        user_task = models.UserTask.query.filter_by(task_id=task['id'], user_id=current_user.id).first()
        session_id = user_task.id
        data = models.RegionsLabelled.query.filter_by(user_task_id=session_id).all()
        if session_id in sessions:
            new_session = sessions[session_id]
        else:
            new_session = Session(task['slides'])
            sessions[session_id] = new_session
        session = user_task.to_dict()

        session['labelled'] = {k['id']: [x.to_dict() for x in filter(lambda x: x.slide_id == k['id'], data)] for k in
                               task['slides']}
        session['viewer'] = new_session.get_info()
        return jsonify(session)
    else:
        return jsonify({"msg": "Unavailable"}), 401


@session_api.route("list")
def list_sessions():
    return jsonify([{
        "id": key,
        "data": value.get_info()
    } for key, value in sessions.items()])


@session_api.route("<string:session_id>/add_region", methods=['POST'])
def add_region(session_id):
    region_data = request.json
    region = models.RegionsLabelled(
        user_task_id=session_id,
        slide_id=region_data['slide_id'],
        label_id=region_data['label']['id'],
        data=region_data['data']
    )
    db.session.add(region)
    db.session.commit()
    return jsonify(region.to_dict())


@session_api.route("<string:session_id>/edit_region", methods=['POST'])
def edit_region(session_id):
    region_data = request.json
    region = models.RegionsLabelled.query.filter_by(id=region_data['id']).first()
    region.data = region_data['data']
    db.session.commit()
    return jsonify(region.to_dict())


# region TILE MANAGEMENT
@session_api.route('<string:session_id>/<slug>_files/<int:level>/<int:col>_<int:row>.<format>')
def tile(session_id, slug, level, col, row, format):
    session: Session = sessions[session_id]
    image_buffered = session.get_slide_tile(slug, level, (col, row), format.lower())
    resp = make_response(image_buffered.getvalue())
    resp.mimetype = 'image/%s' % format
    return resp


@session_api.route('<string:session_id>/<slug>.dzi')
def dzi(session_id, slug):
    session = sessions[session_id]
    resp = make_response(session.get_slide_info(slug))
    resp.mimetype = 'application/xml'
    return resp
# endregion
