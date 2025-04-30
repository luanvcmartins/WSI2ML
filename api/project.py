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
        "revision_strategy": new_project["revision_strategy"]
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
        {"$group": {"_id": "$file", "tasks": {"$push": "$$ROOT"}}}
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


# @project_api.route("tasks")
# @jwt_required()
# def tasks():
#     if not current_user.manages_tasks:
#         return jsonify({"msg": "Not allowed"}), 401
#     project_id = request.args['project_id']
#     tasks = models.AnnotationTask.query.join(models.UserTask).filter(models.UserTask.completed == True,
#                                                                      models.AnnotationTask.project_id == project_id).all()
#     resp = []
#     for task in tasks:
#         user_tasks = models.UserTask.query.filter(
#             models.UserTask.annotation_task_id == task.id, models.UserTask.completed == True).all()
#         resp.append({
#             **task.to_dict(include_project=False, include_assigned=False),
#             "user_tasks": [x.to_dict() for x in user_tasks]
#         })
#     return jsonify(resp)


@project_api.route("remove_label", methods=["POST"])
@jwt_required()
def remove_label():
    if not current_user.manages_projects:
        return jsonify({"msg": "Not allowed"}), 401
    label = request.json
    db.session.query(models.Label).filter(models.Label.id == label['id']).delete()
    db.session.commit()
    return jsonify({"success": True})


def gen_progress_query():
    if db.engine.name == 'sqlite':
        count_filter = "COUNT(CASE WHEN completed=1 THEN 1 END)"
    else:
        count_filter = "count(*) FILTER (WHERE completed=TRUE)"

    project_progress = f"""SELECT annotation_tasks.id, {count_filter} as completed, count(annotation_tasks.id) as total 
               FROM user_tasks, annotation_tasks 
               WHERE user_tasks.annotation_task_id = annotation_tasks.id 
               AND project_id = :project_id GROUP BY annotation_tasks.id"""
    user_progress = f"""SELECT users.name, {count_filter} as completed, count(*) as total 
               FROM user_tasks, annotation_tasks, users WHERE 
               user_tasks.annotation_task_id = annotation_tasks.id 
               AND users.id = user_tasks.user_id 
               AND annotation_tasks.project_id = :project_id GROUP BY user_tasks.user_id, users.name"""
    return project_progress, user_progress


@project_api.route("progress")
@jwt_required()
def general_progress():
    if not current_user.access_overview:
        return jsonify({"msg": "Not allowed"}), 401

    progress = []
    projects = models.Project.query.all()
    for project in projects:
        project_query, user_query = gen_progress_query()
        project_progress = list(db.session.execute(project_query, {"project_id": project.id}))
        users_progress = list(db.session.execute(user_query, {"project_id": project.id}))
        completed_tasks = len([x for x in project_progress if x[1] == x[2]])
        progress.append({
            "id": project.id,
            "name": project.name,
            "general": {
                "completed": completed_tasks,
                "total": len(project_progress),
            },
            "user": {
                "completed": sum([x[1] for x in project_progress]),
                "total": sum([x[2] for x in project_progress])
            },
            "individual": [{
                "name": user[0],
                "completed": user[1],
                "total": user[2]
            } for user in users_progress]
        })

    return jsonify(progress)


@project_api.route("<int:project_id>/annotation_stats")
@jwt_required()
def general_annotation_stats(project_id):
    if not current_user.access_overview:
        return jsonify({}), 401

    counts = {}
    user_tasks = db.session.query(models.UserTask, models.AnnotationTask).filter(
        models.UserTask.annotation_task_id == models.AnnotationTask.id,
        models.AnnotationTask.project_id == project_id
    ).all()
    for user_task in user_tasks:
        annotations = models.Annotation.query.filter_by(user_task_id=user_task[0].id).all()
        task_stats = annotation_stats(annotations)
        for label, values in task_stats.items():
            if label not in counts:
                counts[label] = {}
            for attr, attr_value in values.items():
                if isinstance(attr_value, list):
                    counts[label][attr] = attr_value
                else:
                    if attr not in counts[label]:
                        counts[label][attr] = 0
                    counts[label][attr] += attr_value

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
