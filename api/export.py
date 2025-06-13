import hashlib
import os
import time
from datetime import datetime
from io import BytesIO
import json
import zipfile
import math

import openslide
from bson import ObjectId
from flask import Blueprint, jsonify, request, Response, stream_with_context, send_file
from flask_jwt_extended import jwt_required, current_user

from api import db
export_api = Blueprint("export_api", __name__)


@export_api.route("<project_id>/list")
@jwt_required()
def list_projects(project_id):
    if not current_user['can_export']:
        return "", 403
    ds = db.datasets.find({"project": ObjectId(project_id)}).sort({"created_at": -1})
    return jsonify(list(ds))


@export_api.route("<project_id>/list")
@jwt_required()
def list_version_creation(project_id):
    if not current_user['can_export']:
        return "", 403
    annotations = db.tasks.aggregate([
        {"$match": {"project": ObjectId(project_id)}},
        {"$group": {
            "_id": "$title",
            "file": {"$first": "$file"},
            "annotators": {"$push": {"user": "$user", "_id": "$_id"}}
        }}
    ])
    return jsonify(list(annotations))


@export_api.route("thumbnail/<path>")
def thumbnail(path):
    md5 = hashlib.md5(path.encode()).hexdigest()
    if not os.path.exists(f"./thumbnails/{md5}.jpg"):
        slide = openslide.open_slide(path)
        sthumbnail = slide.get_thumbnail((256, 256))
        os.makedirs("./thumbnails", exist_ok=True)
        sthumbnail.save(f"./thumbnails/{md5}.jpg")

    return Response(open(f"./thumbnails/{md5}.jpg", "rb").read(), mimetype="image/jpg")


@export_api.route("<project_id>/prepare_version")
@jwt_required()
def prepare_version(project_id):
    if not current_user['can_export']:
        return "", 403
    ui = db.tasks.aggregate([
        {"$match": {
            "project": ObjectId(project_id),
            "enabled": True
        }},
        {"$lookup": {
            "from": "users",
            "localField": "users",
            "foreignField": "_id",
            "as": "users"
        }},
        {"$group": {
            "_id": "$project",
            "users": {"$addToSet": "$user"},
            "slides": {"$addToSet": {"title": "$title", "file": "$file"}},
            # "flaggers": {"$addToSet": {"$annotations.$[].flagged"}}
        }}
    ])

    return jsonify(list(ui))


@export_api.route("<project_id>/new", methods=["POST"])
@jwt_required()
def new_version(project_id):
    if not current_user['can_export']:
        return "", 403
    item = db.datasets.insert_one({
        "project": ObjectId(project_id),
        "title": request.json['title'],
        "description": request.json['description'],
        "users": request.json['users'],
        "not_flagged_by": request.json['not_flagged_by'],
        "only_slides": request.json['only_slides'],
        "created_by": ObjectId(current_user['_id']),
        "created_at": datetime.now(),
        "status": 'creating',
        "model_feedback": []
    })

    return Response(stream_with_context(create_dataset_version(item.inserted_id)), content_type="text/event-stream")

@export_api.route("<version_id>", methods=["DELETE"])
@jwt_required()
def delete_version(version_id):
    if not current_user['can_export']:
        return "", 403
    db.datasets.delete_one({"_id": ObjectId(version_id)})
    return ""

@export_api.route("download/<version_id>")
# @jwt_required()
def download(version_id):
    ds_version = db.datasets.find_one({"_id": ObjectId(version_id)})
    if ds_version is None:
        return jsonify({"msg": "No such dataset version"}), 404
    else:
        return send_file(f"./repository/datasets/{ds_version['title']}.zip", as_attachment=True)


def create_dataset_version(dataset_id):
    ds_version = db.datasets.find_one({"_id": ObjectId(dataset_id)}, {"model_feedback": False, "status": False})
    yield f"data: {json.dumps({'step': 0, 'progress': 0, 'msg': 'Starting procedure'})}\n\n"
    time.sleep(1)

    query = {"project": ds_version['project']}
    if len(ds_version['users']) > 0:
        query["user._id"] = {"$in": [ObjectId(user_id) for user_id in ds_version['users']]}
    if len(ds_version['only_slides']) > 0:
        query["title"] = {"$in": ds_version['only_slides']}
    if len(ds_version['not_flagged_by']) > 0:
        query["annotations.flagged"] = {"$not": {"$elemMatch": {"$in": ds_version['not_flagged_by']}}}

    yield f"data: {json.dumps({'step': 1, 'progress': 0, 'msg': 'Gathering all annotations'})}\n\n"
    time.sleep(1)
    slide_annotations = list(db.tasks.aggregate([
        {"$match": query},
        {"$group": {
            "_id": "$title",
            "file": {"$first": "$file"},
            "slide_hash": {"$first": "$slide_hash"},
            "annotations": {"$push": "$annotations"},
        }},
    ]))
    slide_annotations = {
        slide['_id']: {
            # slide metadata:
            'title': slide['_id'],
            'file': slide['file'],
            'slide_hash': slide['slide_hash'],
            # all annotations for from all users
            'annotations': [annotation for ua in slide['annotations'] for annotation in ua] 
        } for slide in slide_annotations
    }
    
    yield f"data: {json.dumps({'step': 2, 'progress': 0, 'msg': 'Creating geojson file'})}\n\n"
    time.sleep(1)

    total_annotations = 0
    annotation_count = {
        label['name']: 0 for label in db.labels.find({
            "project": ds_version['project'], 
            "enabled": True
        })
    }

    zip_stream = BytesIO()
    with zipfile.ZipFile(zip_stream, 'w') as zf:
        # writing geojson for each slide
        for idx, (slide_title, slide_metadata) in enumerate(slide_annotations.items()):
            annotations = slide_metadata['annotations']
            for annotation in annotations:
                annotation_count[annotation['label']['name']] += 1
            total_annotations += len(annotations)
            info = {
                'step': 3,
                'progress': idx / len(slide_annotations),
                'msg': f'Processing slide: {slide_title}',
                'annotation_count': annotation_count,
                'total_annotations': total_annotations
            }
            yield f"data: {json.dumps(info)}\n\n"
            time.sleep(1)
            file_data = zipfile.ZipInfo(f"{slide_title}.geojson")
            file_data.compress_type = zipfile.ZIP_DEFLATED

            zf.writestr(file_data, json.dumps({
                "type": "FeatureCollection",
                "features": [
                    create_polygon(annotation) for annotation in annotations
                ]
            }, indent=2, default=str))
             
        # writing metadata file
        metadata_file = zipfile.ZipInfo("_metadata.json")
        metadata_file.compress_type = zipfile.ZIP_DEFLATED
        
        metadata_content = {
            "dataset": ds_version,
            "labels": list(db.labels.find({"project": ds_version["project"], "enabled": True}, {
                '_id': True,
                'name': True,
                'color': True
            })),
            "slides": {
                slide_id:  slide_metadata["slide_hash"]
             for slide_id, slide_metadata in slide_annotations.items()}
        }
        zf.writestr(metadata_file, json.dumps(metadata_content, indent=2, default=str))

    yield f"data: {json.dumps({'step': 4, 'progress': 1, 'msg': 'Saving zip file', 'total_annotations': total_annotations, 'annotation_count': annotation_count})}\n\n"
    time.sleep(1)
    os.makedirs("./repository/datasets", exist_ok=True)
    zip_stream.seek(0)
    with open(f"./repository/datasets/{ds_version['title']}.zip", "wb+") as f:
        f.write(zip_stream.read())

    db.datasets.update_one({"_id": ObjectId(dataset_id)}, {
        "$set": {"status": "ready", "annotation_count": annotation_count, "total_annotations": total_annotations}
    })
    yield f"data: {json.dumps({'step': 5, '_id': str(dataset_id), 'progress': 1, 'msg': 'Done.', 'total_annotations': total_annotations, 'annotation_count': annotation_count})}\n\n"
    time.sleep(1)


def create_polygon(annotation):
    if annotation['geometry']["type"] == "rect":
        # casting rect annotation to expected Polygon format
        point1, point2 = annotation['geometry']['points']
        annotation_points = [[point1['x'], point1['y']],
                             [point2['x'], point1['y']],
                             [point2['x'], point2['y']],
                             [point1['x'], point2['y']],
                             [point1['x'], point1['y']]]
    elif annotation['geometry']["type"] == "circle":
        # casting circle annotations to polygons
        point1, point2 = annotation['geometry']['points']
        width, height = point1['x'] - point2['x'], point1['y'] - point2['y']
        radius = height / 2
        sample = lambda t: [radius * math.cos(t) + point1['x'], radius * math.sin(t) + point1['y']]
        sample_points = int(20 + (2 * radius))
        rate = 2 * math.pi / sample_points
        annotation_points = [sample(rate * (t % sample_points)) for t in range(sample_points + 1)]
    else:
        # converting Polygons annotations to the expected format
        annotation_points = [[x['x'], x['y']] for x in annotation['geometry']['points']]
        annotation_points.append([annotation['geometry']['points'][0]['x'], annotation['geometry']['points'][0]['y']])

    return {
        "type": "Feature",
        "geometry": {
            "type": "Polygon",
            "coordinates": [annotation_points]
        },
        "properties": {
            "_id": annotation['_id'],
            "user": annotation['user'],
            "label": annotation['label'],
            "created_at": annotation['created_at'],
            "updated_at": annotation['updated_at'] if 'updated_at' in annotation else None,
        }
    }
