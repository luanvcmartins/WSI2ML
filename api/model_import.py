import json
import zipfile
from datetime import datetime

from bson import ObjectId
from flask import Blueprint, jsonify, request, Response, stream_with_context, send_file
from flask_jwt_extended import jwt_required, current_user

from api import db

import_api = Blueprint("import_api", __name__)


@import_api.route("<project_id>/list")
@jwt_required()
def list_ds_versions(project_id):
    annotations = db.datasets.find({
        "project": ObjectId(project_id),
        "status": "ready"
    }).sort([("created_at", -1)])
    return jsonify(list(annotations))


@import_api.route("<version_id>/update")
@jwt_required()
def update_ds_version(version_id):
    updated = request.files['file']

    return Response(stream_with_context(
        upload_model_results(version_id, updated)
    ), content_type="text/event-stream")


def upload_model_results(dataset_id, upload_file):
    yield f"data: {json.dumps({'step': 0, 'progress': 0, 'msg': 'Starting procedure'})}\n\n"
    ds_version = db.datasets.find_one({"_id": ObjectId(dataset_id)})
    with zipfile.ZipFile(upload_file, 'r') as zip_ref:
        annotations = {}
        total_files = len(zip_ref.infolist())
        for idx, file_info in enumerate(zip_ref.infolist()):
            with zip_ref.open(file_info) as file:
                annotations[file_info.filename] = json.load(file)
            yield f"data: {json.dumps({'step': 1, 'progress': idx / total_files, 'msg': 'Processing file: ' + file_info.filename})}\n\n"


    yield f"data: {json.dumps({'step': 2, 'progress': 1, 'msg': 'Cleaning previous results'})}\n\n"
    db.model_feedback.delete_many({"ds_version": ObjectId(dataset_id)})

    yield f"data: {json.dumps({'step': 3, 'progress': 1, 'msg': 'Registering new data'})}\n\n"
    db.model_feedback.insert_many([{
        "ds_version": ObjectId(dataset_id),
        "project": ds_version['project'],
        "created_at": datetime.now(),
        **annotation
    } for annotation in annotations])
    yield f"data: {json.dumps({'step': 4, 'progress': 1, 'msg': 'Completed'})}\n\n"
