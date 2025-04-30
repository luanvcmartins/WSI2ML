from datetime import datetime
import json
import os
from typing import Any
import uuid

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
        annotation["label"]["_id"] = ObjectId(annotation["label"]["_id"])
        db.tasks.update_one(
            {"_id": ObjectId(session_id)},
            {"$push": {"annotations": annotation}}
        )
    else:
        annotation["updated_at"] = datetime.now().isoformat()
        db.tasks.update_one(
            {"_id": ObjectId(session_id), "annotations._id": ObjectId(annotation["_id"])},
            {"$set": {"annotations.$": annotation}}
        )
    return jsonify({"_id": annotation["_id"]})


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


@session_api.route("<string:session_id>/add_region", methods=['POST'])
@jwt_required()
def add_region(session_id):
    current_task = models.UserTask.query.get(session_id)
    if current_user.id != current_task.user_id:
        return jsonify({"msg": "Not allowed"}), 401
    region_data = request.json
    region = models.Annotation(
        user_task_id=session_id,
        slide_id=region_data['slide_id'],
        label_id=region_data['label']['id'],
        data=region_data['geometry'],
        title=get_default(region_data, 'title'),
        description=get_default(region_data, 'description'),
        properties=get_default(region_data, 'properties', {})
    )
    db.session.add(region)
    db.session.commit()
    return jsonify(region.to_dict())


@session_api.route("<string:session_id>/edit_region", methods=['POST'])
@jwt_required()
def edit_region(session_id):
    current_task = models.UserTask.query.get(session_id)
    if current_user.id != current_task.user_id:
        return jsonify({"msg": "Not allowed"}), 401
    region_data = request.json
    region = models.Annotation.query.filter_by(id=region_data['id']).first()
    region.label_id = region_data['label']['id']
    region.data = region_data['geometry']
    if 'title' in region_data:
        region.title = region_data['title']
    if 'description' in region_data:
        region.description = region_data['description']
    if 'properties' in region_data:
        region.properties = region_data['properties']
    db.session.commit()
    return jsonify(region.to_dict())


@session_api.route("<string:session_id>/remove_annotation", methods=['POST'])
@jwt_required()
def remove_annotation(session_id):
    current_task = models.UserTask.query.get(session_id)
    if current_user.id != current_task.user_id:
        return jsonify({"msg": "Not allowed"}), 401
    region_data = request.json
    region = db.session.query(models.Annotation).get(region_data['id'])
    db.session.delete(region)
    db.session.commit()
    return jsonify({"success": True})


@session_api.route("<string:session_id>/annotation_feedback", methods=['POST'])
@jwt_required()
def annotation_feedback(session_id):
    current_task = models.UserTask.query.get(session_id)
    if current_user.id != current_task.user_id:
        return jsonify({"msg": "Not allowed"}), 401
    annotation_data = request.json
    user_task = sessions[session_id].user_task
    if annotation_data['feedback']['id'] is not None:
        # this is a feedback update:
        feedback = models.AnnotationRevised.query.get(annotation_data['feedback']['id'])
        feedback.feedback = annotation_data['feedback']['feedback']
        feedback.label_id = annotation_data['feedback']['label_id']
        feedback.data = annotation_data['feedback']['geometry']
    else:
        # this is a new feedback:
        feedback = models.AnnotationRevised(
            user_task_id=user_task.id,
            annotation_id=annotation_data['id'],
            feedback=annotation_data['feedback']['feedback'],
            label_id=annotation_data['feedback']['label_id'],
            data=annotation_data['feedback']['geometry']
        )
        db.session.add(feedback)
    db.session.commit()
    annotation = models.Annotation.query.get(annotation_data['id'])
    annotation = annotation.to_dict(feedback=feedback, with_feedback=True)
    return jsonify(annotation)


@session_api.route("<string:session_id>/<string:slide_id>/importing", methods=['POST'])
def importing(session_id, slide_id):
    slide_annotations = request.json
    for slide_annotation in slide_annotations:
        db.session.add(models.Annotation(
            user_task_id=session_id,
            title=slide_annotation['title'] if 'title' in slide_annotation else None,
            data=slide_annotation['geometry'],
            properties=slide_annotation['properties'] if 'properties' in slide_annotation else None,
            label_id=slide_annotation['label']['id'],
            slide_id=slide_id
        ))
    db.session.commit()
    return jsonify({"count": len(slide_annotations)})


@session_api.route("<string:session_id>/<string:slide_id>/class_balance", methods=['POST'])
def class_balance(session_id, slide_id):
    if slide_id == 'all':
        annotations = models.Annotation.query.filter_by(user_task_id=session_id).all()
    else:
        annotations = models.Annotation.query.filter_by(user_task_id=session_id, slide_id=slide_id).all()

    counts = annotation_stats(annotations)

    if len(counts) > 0:
        total_area = max([count['area'] for count in counts.values()])
        total_c_area = max([count['certain_area'] for count in counts.values()])
        total_desc = max([count['desc'] for count in counts.values()])
        total_count = max([count['count'] for count in counts.values()])
        for value in counts.values():
            if total_area > 0:
                value['area_perc'] = value['area'] / total_area
                value['area'] = "{:.2f}%".format(100 * (value['area'] / total_area))
            if total_c_area > 0:
                value['certain_area_perc'] = value['certain_area'] / total_c_area
                value['certain_area'] = "{:.2f}%".format(100 * (value['certain_area'] / total_c_area))
            if total_desc > 0:
                value['desc_perc'] = value['desc'] / total_desc
            else:
                value['desc_perc'] = 0
            if total_count > 0:
                value['count_perc'] = value['count'] / total_count
            else:
                value['count_perc'] = 0

    return jsonify(counts)


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
