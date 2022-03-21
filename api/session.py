from typing import Any

import json
import models
from analyzer.session import Session
from flask import Blueprint, jsonify, request, make_response
from flask_jwt_extended import current_user, jwt_required
from app import db
from shapely.affinity import scale
from shapely.geometry import Polygon, box, Point

session_api = Blueprint("session_api", __name__)

sessions = {}


@session_api.route("create", methods=['POST'])
@jwt_required()
def create_session():
    task = request.json
    user_task = models.UserTask.query.get(task['id'])
    allowed = current_user.manages_tasks
    if user_task.type == 0:
        if not allowed and user_task.user.id != current_user.id: return jsonify({}), 401
    elif user_task.type == 1:
        if not allowed and user_task.user.id != current_user.id: return jsonify({}), 401
    elif user_task.type == 2:
        if not allowed and user_task.app.id != current_user.id: return jsonify({}), 401

    if user_task.type == 1:
        task = user_task.revision_task
        slides = [slide.to_dict() for slide in user_task.revision_task.task.slides]
    else:
        task = user_task.annotation_task
        slides = [slide.to_dict() for slide in user_task.annotation_task.slides]

    # if task['type'] == 0:
    #     user_task = models.UserTask.query.filter_by(annotation_task_id=task['id'], user_id=current_user.id).first()
    #     slides = user_task.task.slides
    # elif task['type'] == 1:
    #     user_task = models.UserTask.query.filter_by(revision_task_id=task['id'], user_id=current_user.id).first()
    #     slides = user_task.task.slides
    # else:
    #     if "user_task_id" not in task:
    #         user_task = models.UserTask.query.filter_by(annotation_task_id=task['id'], app_id=current_user.id).first()
    #     else:
    #         user_task = models.UserTask.query.filter_by(id=task['user_task_id']).first()
    #     slides = user_task.task.slides

    session_id = user_task.id
    if session_id in sessions:
        new_session = sessions[session_id]
    else:
        new_session = Session(slides, user_task)
        sessions[session_id] = new_session
    session = user_task.to_dict()

    if user_task.type == 1:
        # revision task has the labelled data from all the user_tasks associated with it
        session['revision'] = {}
        for revision_task in task.revisions:
            # data = db.session.query(models.Annotation, models.AnnotationRevised).filter(
            #     models.Annotation.user_task_id == revision_id['id'],
            #     models.AnnotationRevised.user_task_id == task['id'],
            #     models.Annotation.id == models.AnnotationRevised.annotation_id).all()
            # data = models.Annotation.query.filter_by(user_task_id=revision_id['id']).all()
            user_feedback = db.session.query(models.AnnotationRevised).filter(
                models.AnnotationRevised.user_task_id == user_task.id).subquery()
            data = db.session.query(models.Annotation, user_feedback) \
                .join(user_feedback, user_feedback.c.annotation_id == models.Annotation.id, isouter=True).filter(
                models.Annotation.user_task_id == revision_task.id).all()
            # db.session.query(models.Annotation, models.AnnotationRevised).select_from(models.Annotation) \
            #     .outerjoin(models.AnnotationRevised) \
            #     .filter(models.Annotation.user_task_id == revision_task['id']).all()
            session['revision'][revision_task.id] = {
                k['id']: [{
                    **x[0].to_dict(),
                    "feedback": {
                        "id": x[1],
                        "feedback": x[4],
                        "label_id": x[5],
                        "geometry": json.loads(x[6]) if x[6] is not None else None,
                    }} for x in filter(lambda x: x[0].slide_id == k['id'], data)] for k in slides}
    else:
        # common annotation task, we will put the annotations we have associated with it:
        data = models.Annotation.query.filter_by(user_task_id=session_id).all()
        session['labelled'] = {k['id']: [x.to_dict() for x in filter(lambda x: x.slide_id == k['id'], data)] for k
                               in slides}
    session['viewer'] = new_session.get_info()
    return jsonify(session)
    # else:
    #     return jsonify({"msg": "Unavailable"}), 401


@session_api.route("list")
def list_sessions():
    return jsonify([{
        "id": key,
        "data": value.get_info()
    } for key, value in sessions.items()])


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
    region.title = region_data['title']
    region.description = region_data['description']
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


@session_api.route("<string:session_id>/<string:slide_id>/class_balance", methods=['POST'])
def class_balance(session_id, slide_id):
    annotations = models.Annotation.query.filter_by(user_task_id=session_id, slide_id=slide_id).all()
    counts = {}
    for annotation in annotations:
        annotation_label = annotation.label
        annotation_type = annotation.data["type"]
        points = annotation.data["points"]
        if annotation_type == "polygon":
            area = Polygon([(point['x'], point['y']) for point in points]).area
        elif annotation_type == "rect":
            point1, point2 = points
            area = box(point1['x'], point1['y'], point2['x'], point2['y']).area
        elif annotation_type == "circle":
            point1, point2 = points
            circle = Point((point1['x'], point1['y'])).buffer(1)
            circle = scale(circle, point1['x'] - point2['x'], point1['y'] - point2['y'])
            area = circle.area
        else:
            area = 0
        if annotation_label.name not in counts:
            counts[annotation_label.name] = {
                'count': 0,
                'area': 0,
                'certain_area': 0,
                'desc': 0,
                'color': annotation_label.color
            }
        counts[annotation_label.name]['count'] += 1
        counts[annotation_label.name]['area'] += area
        if annotation.description != "" and annotation.description is not None:
            # this annotation has a description, it might not be 100 trustworthy
            counts[annotation_label.name]['desc'] += 1
        else:
            # this annotation has no description, we most likely will be using it
            counts[annotation_label.name]['certain_area'] += area
    total_area = max([count['area'] for count in counts.values()])
    total_c_area = max([count['certain_area'] for count in counts.values()])
    total_desc = max([count['desc'] for count in counts.values()])
    total_count = max([count['count'] for count in counts.values()])
    for value in counts.values():
        if total_area > 0:
            value['area'] = value['area'] / total_area
        if total_c_area > 0:
            value['certain_area'] = value['certain_area'] / total_c_area
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
