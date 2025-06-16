import json
import zipfile
from datetime import datetime

from bson import ObjectId
from flask import Blueprint, jsonify, request, Response, stream_with_context, send_file
from flask_jwt_extended import jwt_required, current_user
from io import BytesIO
from api import db

import_api = Blueprint("import_api", __name__)


@import_api.route("<project_id>/list")
@jwt_required()
def list_ds_versions(project_id):
    if not current_user['can_export']:
        return "", 403
    annotations = db.datasets.find({
        "project": ObjectId(project_id),
        "status": "ready"
    }).sort([("created_at", -1)])
    return jsonify(list(annotations))




@import_api.route("<project_id>/upload", methods=['POST'])
@jwt_required()
def upload_ds_version(project_id):
    if not current_user['can_export']:
        return "", 403
    uploaded = request.data

    return Response(stream_with_context(
        upload_model_results(project_id, uploaded)
    ), content_type="text/event-stream")


def upload_model_results(project_id, upload_file):
    yield f"data: {json.dumps({'step': 0, 'progress': 0, 'msg': 'Starting procedure'})}\n\n"

    try:
        annotated_files = []
        with zipfile.ZipFile(BytesIO(upload_file), 'r') as zip_ref:      
            # metadata
            metadata = zip_ref.getinfo('_metadata.json')
            metadata_data = json.load(zip_ref.open(metadata))
            dataset_id =  ObjectId(metadata_data['dataset']['_id'])
            metadata = {
                'dataset_id': dataset_id,
                "dataset_name": metadata_data['dataset']['title'],
                'enabled': True,
                "model":{
                    '_id': ObjectId(),
                    'name': metadata_data['model']['name'],
                    'type': metadata_data['model']['type'],
                    'description': metadata_data['description'] if 'description' in metadata_data else "",
                },
                'created_at': datetime.now(),
                'created_by': current_user['_id'],
                "project": ObjectId(project_id),
            }
            
            # annotated slides
            total_files = len(zip_ref.infolist())
            for idx, file_info in enumerate(zip_ref.infolist()):
                if file_info.filename != "_metadata.json":
                    with zip_ref.open(file_info) as file:
                        annotations = json.load(file)
                        annotated_files.append({
                            "slide_hash": annotations[0]['slide_hash'],
                            **metadata, 
                            'annotations': [{
                                "_id": ObjectId(),
                                **annotation
                            }  for annotation in annotations]
                        }) 
                    yield f"data: {json.dumps({'step': 1, 'progress': (idx / total_files)*100, 'msg': 'Processing file: ' + file_info.filename})}\n\n"

        yield f"data: {json.dumps({'step': 2, 'progress': 1, 'msg': 'Registering model'})}\n\n"
        # upload list of uploaded models to datasets
        del metadata["enabled"]
        del metadata['dataset_id']
        metadata['_id'] = metadata['model']['_id']
        db.datasets.update_one(
            {"_id": dataset_id }, 
            { "$push": { "model_feedback": metadata }}
        )        
        
        yield f"data: {json.dumps({'step': 2, 'progress': 1, 'msg': 'Cleaning previous annotations'})}\n\n"
        db.model_feedback.delete_many({"version": ObjectId(dataset_id), "model": metadata_data['model'], "created_at": datetime.now()})

        yield f"data: {json.dumps({'step': 3, 'progress': 1, 'msg': 'Registering new data'})}\n\n"
        db.model_feedback.insert_many(annotated_files)
        yield f"data: {json.dumps({'step': 4, 'progress': 1, 'msg': 'Completed'})}\n\n"
    except Exception as e:
        yield f"data: {json.dumps({'step': 6, 'progress': 0, 'msg': str(e)})}\n\n"

@import_api.route('/<model_id>/delete', methods=['POST'])
@jwt_required()
def remove_model(model_id):
    if not current_user['can_export']:
        return "", 403
    # Remove the model from the database
    db.model_feedback.delete_many({"model._id": ObjectId(model_id)})
    db.datasets.update_many(
        {}, 
        {"$pull": {"model_feedback": {"_id": ObjectId(model_id)}}}
    )
    return ""