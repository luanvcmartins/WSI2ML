from bson import ObjectId

import analyzer.session
import hashlib
import uuid
import os
import re
from flask import Blueprint, jsonify, request, Response
from flask_jwt_extended import jwt_required, current_user
from itertools import combinations, cycle
from random import shuffle
from api import db
import openslide

task_api = Blueprint("task_api", __name__)


@task_api.route("list", methods=["GET"])
@jwt_required()
def quick_list():
    tasks = db.tasks.aggregate([
        {"$match": {
            "user._id": current_user["_id"],
            "enabled": True
        }},
        {"$unset": "annotations"},
        {"$group": {
            "_id": "$project",
            "tasks": {"$push": "$$ROOT"},
        }},
        {"$lookup": {
            "from": "projects",
            "localField": "_id",
            "foreignField": "_id",
            "as": "project"
        }},
        {"$unwind": "$project"},
        {"$sort": {"tasks.completed": 1}},
        {"$addFields": {"completed_count": {
            "$size": {"$filter": {
                "input": "$tasks",
                "as": "task",
                "cond": "$$task.completed"
            }}
        }}}
    ])
    return jsonify(list(tasks))


@task_api.route("<project_id>/list", methods=["GET"])
@jwt_required()
def project_list(project_id):
    tasks = db.tasks.aggregate([
        {"$match": {
            "user._id": current_user["_id"],
            "project": ObjectId(project_id),
            "enabled": True
        }},
        {"$unset": "annotations"},
        # {"$lookup": {
        #     "from": "projects",
        #     "localField": "_id",
        #     "foreignField": "_id",
        #     "as": "project"
        # }},
        # {"$unwind": "$project"},
        {"$sort": {"tasks.completed": 1}},
        # {"$addFields": {"completed_count": {
        #     "$size": {"$filter": {
        #         "input": "$tasks",
        #         "as": "task",
        #         "cond": "$$task.completed"
        #     }}
        # }}}
    ])
    return jsonify(list(tasks))


@task_api.route("thumbnail/<session_id>", methods=["GET"])
def thumbnail(session_id):
    task = db.tasks.find_one({"_id": ObjectId(session_id)})
    md5 = hashlib.md5(task['file'].encode()).hexdigest()
    if not os.path.exists(f"./thumbnails/{md5}.jpg"):
        slide = openslide.open_slide(task['file'])
        sthumbnail = slide.get_thumbnail((256, 256))
        os.makedirs("./thumbnails", exist_ok=True)
        sthumbnail.save(f"./thumbnails/{md5}.jpg")

    return Response(open(f"./thumbnails/{md5}.jpg", "rb").read(), mimetype="image/jpg")
