from datetime import datetime
from typing import Any
import json
import os

from bson import ObjectId

from analyzer.session import Session
from flask import Blueprint, jsonify, request, make_response
from flask_jwt_extended import current_user, jwt_required

# from analyzer.stats import annotation_stats
from api import db

session_api = Blueprint("session_api", __name__)

sessions = {}

def get_session(session_id, force_reload=True):
    if force_reload or session_id not in sessions:
        task = list(db.tasks.aggregate([
            {"$match": {"_id": ObjectId(session_id)}},
            {"$lookup": {
                "from": "projects",
                "localField": "project",
                "foreignField": "_id",
                "as": "project",
                "pipeline": [
                    {"$lookup": {
                        "from": "labels",
                        "localField": "labels",
                        "foreignField": "_id",
                        "as": "labels",
                    }}
                ]
            }},
            {"$unwind": "$project"}
        ]))
        if len(task) == 0:
            return None
        print(task)
        task = task[0]
        if session_id in sessions:
            sessions[session_id]['task'] = task
        else:
            sessions[session_id] = {
                "_id": session_id,
                "task": task,
                "file": Session(task["file"])
            }
    return sessions[session_id]


@session_api.route("<session_id>/slide_list", methods=["GET"])
@jwt_required()
def quick_list(session_id):
    session = get_session(session_id, force_reload=False)
    tasks = db.tasks.find({
        "user._id": ObjectId(current_user["_id"]),
        "enabled": True,
        "project":session['task']['project']['_id']
    }, {"file": True, "_id": True, "title": True})
    return jsonify(list(tasks))


@session_api.route("<session_id>", methods=['GET'])
@jwt_required()
def create_session(session_id):
    session = get_session(session_id)

    return jsonify({
        **session['task']
    }), 200


@session_api.route("<session_id>/completed", methods=['POST'])
@jwt_required()
def complete_session(session_id):
    db.tasks.update_one(
        {'_id': ObjectId(session_id)},
        {'$set': {'completed': request.json['completed']}}
    )
    return ""


@session_api.route("<string:session_id>/annotation", methods=["POST"])
@jwt_required()
def annotate(session_id):
    annotation = request.json
    if annotation["_id"] is None:
        # creating a pseudo id and additional metadata
        annotation["_id"] = ObjectId()
        annotation["user"] = ObjectId(current_user["_id"])
        annotation["created_at"] = datetime.now().isoformat()
        annotation['flagged'] = []
        annotation["label"] = { 
            "_id": ObjectId(annotation["label"]["_id"]), 
            "name": annotation["label"]["name"], 
            "color": annotation["label"]["color"] 
        }

        db.tasks.update_one(
            {"_id": ObjectId(session_id)},
            {"$push": {"annotations": annotation}}
        )
    else:
        db.tasks.update_one(
            {"_id": ObjectId(session_id), "annotations._id": ObjectId(annotation["_id"])},
            {"$set": {
                "annotations.$.label": annotation['label'],
                "annotations.$.geometry": annotation['geometry'],
                "annotations.$.updated_at": datetime.now().isoformat()
            }}
        )
    return jsonify({
        "_id": annotation["_id"], 
        "created_at": annotation["created_at"] if "created_at" in annotation else "",
        "updated_at": annotation["updated_at"] if "updated_at" in annotation else "",
    })

@session_api.route("<string:session_id>/annotation", methods=["DELETE"])
@jwt_required()
def remove_annotation(session_id):
    annotation = request.json
    db.tasks.update_one(
        {"_id": ObjectId(session_id)},
        {"$pull": {"annotations": {"_id": ObjectId(annotation['_id'])}}},
    )
    return ""

@session_api.route("list")
def list_sessions():
    return jsonify([{
        "id": key,
        "data": value.get_info()
    } for key, value in sessions.items()])


@session_api.route("<string:session_id>/colleagues", methods=['GET'])
@jwt_required()
def list_colleagues_annotations(session_id):
    session = get_session(session_id)
    file = session["task"]["file"]
    project = session["task"]["project"]
    tasks = db.tasks.find({
        "file": file,
        "project": ObjectId(project['_id']),
        "user._id": {"$ne": ObjectId(current_user["_id"])}
    })
    return jsonify(list(tasks))

@session_api.route("<string:session_id>/models", methods=['GET'])
@jwt_required()
def list_models_annotations(session_id):
    session = get_session(session_id)
    slide_hash = session["task"]["slide_hash"]
    models = db.model_feedback.find({
        "slide_hash": slide_hash,
        "project": session["task"]["project"]['_id'],        
    })
    return jsonify(list(models))
    
    

@session_api.route("<string:session_id>/flag", methods=['POST'])
@jwt_required()
def flag(session_id):
    annotation = request.json
    db.tasks.update_one(
        {"_id": ObjectId(session_id), "annotations._id": ObjectId(annotation["_id"])},
        {"$addToSet" if annotation['flag'] else "$pull": {"annotations.$.flagged": ObjectId(current_user["_id"])}}
    )
    return jsonify({"_id": annotation["_id"]})

def get_default(item, key, default: Any = ""):
    return item[key] if key in item else default


# region TILE MANAGEMENT
@session_api.route('<string:session_id>_files/<int:level>/<int:col>_<int:row>.<format>')
def tile(session_id, level, col, row, format):
    session = get_session(session_id, force_reload=False)
    image_buffered = session["file"].get_slide_tile("default", level, (col, row), format.lower())
    resp = make_response(image_buffered.getvalue())
    resp.mimetype = 'image/%s' % format
    return resp


@session_api.route('<string:session_id>.dzi')
def dzi(session_id):
    session = get_session(session_id, force_reload=False)
    resp = make_response(session["file"].get_slide_info())
    resp.mimetype = 'application/xml'
    return resp
# endregion
