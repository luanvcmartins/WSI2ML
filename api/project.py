import os, os.path
from glob import glob
from mimetypes import knownfiles

from bson import ObjectId
from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, current_user
# from analyzer.stats import annotation_stats
from api import db
import openslide

project_api = Blueprint("project_api", __name__)


@project_api.route("new", methods=['POST'])
@jwt_required()
def new():
    if not current_user["manages_projects"]:
        return jsonify({"msg": "Not allowed"}), 401
    new_project = request.json

    db.projects.insert_one({
        "name": new_project["name"],
        "description": new_project["description"],
        "folder": new_project["folder"],
        "labels": new_project["labels"],
        "revision_strategy": new_project["revision_strategy"],
        "enabled": True
    })

    return "", 200


@project_api.route("list")
@jwt_required()
def list_projects():
    if not current_user["manages_projects"]:
        return jsonify({"msg": "Not allowed"}), 401

    projects = db.projects.aggregate([
        {
            "$lookup": {
                "from": "labels",
                "localField": "labels",
                "foreignField": "_id",
                "as": "labels",
                "pipeline": [
                    {"$match": {"enabled": True}}
                ]
            }
        }
    ])

    return jsonify(list(projects))

@project_api.route("quick_list")
@jwt_required()
def quick_list():
    return jsonify(list(db.projects.find({"enabled": True})))


@project_api.route("edit", methods=['POST'])
@jwt_required()
def edit():
    if not current_user["manages_projects"]:
        return jsonify({"msg": "Not allowed"}), 401
    project = request.json
    project_id = project["_id"]

    db.projects.update_one({"_id": ObjectId(project_id)}, {"$set": {
        "name": project["name"],
        "description": project["description"],
        "folder": project["folder"],
        "revision_strategy": project["revision_strategy"],
    }})

    return "", 200


@project_api.route("switch_status", methods=['POST'])
@jwt_required()
def switch_status():
    if not current_user["manages_projects"]:
        return jsonify({"msg": "Not allowed"}), 401

    db.projects.update_one(
        {"_id": ObjectId(request.json["_id"])},
        [{"$set": {"enabled": {"$not": "$enabled"}}}]
    )
    return "", 200


@project_api.route("label/new", methods=['POST'])
@jwt_required()
def new_label():
    if not current_user["manages_projects"]:
        return jsonify({"msg": "Not allowed"}), 401
    item = db.labels.insert_one({
        "name": request.json["name"],
        "project": ObjectId(request.json["project"]),
        "color": request.json["color"],
        "enabled": True,
        "description": request.json["description"],
    })
    db.projects.update_one(
        {"_id": ObjectId(request.json["project"])},
        {"$push": {"labels": item.inserted_id}}
    )
    return jsonify({
        "_id": item.inserted_id,
        "name": request.json["name"],
        "project": request.json["project"],
        "color": request.json["color"],
        "enabled": True,
        "description": request.json["description"],
    }), 200


@project_api.route("label/edit", methods=['POST'])
@jwt_required()
def edit_label():
    if not current_user["manages_projects"]:
        return jsonify({"msg": "Not allowed"}), 401
    label = {
        "name": request.json["name"],
        "project": request.json["project"],
        "color": request.json["color"],
        "description": request.json["description"],
    }
    db.labels.update_one({"_id": ObjectId(request.json["_id"])}, {"$set": label})

    # now we will also update all information on the annotations
    label['_id'] = ObjectId(request.json["_id"])
    db.tasks.update_many(
        {},
        {"$set": {"annotations.$[element].label": label}},
        array_filters=[{"element.label._id": ObjectId(request.json["_id"])}]
    )
    return "", 200


@project_api.route("label/switch_status", methods=['POST'])
@jwt_required()
def switch_label_status():
    if not current_user["manages_projects"]:
        return jsonify({"msg": "Not allowed"}), 401

    db.labels.update_one(
        {"_id": ObjectId(request.json["_id"])},
        [{"$set": {"enabled": {"$not": "$enabled"}}}]
    )
    return "", 200


@project_api.route("valid_path", methods=["POST"])
@jwt_required()
def valid_path():
    if not current_user["manages_projects"]:
        return jsonify({"msg": "Not allowed"}), 401
    path = request.json['path']
    return jsonify({
        "valid_path": os.path.exists(path)
    })


@project_api.route("<project_id>/tasks")
@jwt_required()
def _tasks(project_id):
    if not current_user["manages_projects"]:
        return jsonify({"msg": "Not allowed"}), 401

    project_id = ObjectId(project_id)
    project = db.projects.find_one({"_id": project_id})
    tasks = list(db.tasks.aggregate([
        {"$match": {"project": project_id}},
        {"$group": {"_id": "$title", "slide_hash": {"$first": "$slide_hash"}, "enabled": {"$first": "$enabled"}, "tasks": {"$push": "$$ROOT"}}},
        {"$sort": {"enabled": -1}}
    ]))
    users = list(db.users.find({}, {"_id": True, "email": True, "name": True}))

    used_slides = list(db.tasks.aggregate([
        {"$match": {"project": project_id}},
        {"$group": {"_id": "", "files": {"$addToSet": "$file"}}},
        {"$project": {"_id": 0, "files": 1}}
    ]))

    known_files = list(used_slides)[0] if len(used_slides) > 0 else []

    return jsonify({
        "project": project,
        "tasks": tasks,
        "users": users,
        "files": glob(os.path.join(project["folder"], "**"), recursive=True),
        "known_files": known_files
    })

@project_api.route("<project_id>/task/switch_status", methods=["POST"])
@jwt_required()
def switch_task_status(project_id):
    if not current_user['manages_projects']:
        return "", 401
    db.tasks.update_many(
        {"slide_hash": request.json["slide_hash"]}, 
        [{"$set": {"enabled": {"$not": "$enabled"}}}]
    )
    return ""



@project_api.route("<project_id>/task/create", methods=["POST"])
@jwt_required()
def create_project_tasks(project_id):
    if not current_user["manages_projects"]:
        return jsonify({"msg": "Not allowed"}), 401
    
    
    files = {file: {
        'file': file, 
        'slide_hash': openslide.open_slide(file).properties.get('openslide.quickhash-1', file)
    } for file in request.json['files']}

    db.tasks.insert_many([{
        "project": ObjectId(project_id),
        "file": file['file'],
        "slide_hash": file['slide_hash'],
        "title": os.path.splitext(os.path.basename(file['file']))[0],
        "user": {
            **user,
            "_id": ObjectId(user['_id'])
        },
        "annotations": [],
        "completed": False,
        "enabled": True
    } for user in request.json["users"] for file in files.values()])

    return "", 200