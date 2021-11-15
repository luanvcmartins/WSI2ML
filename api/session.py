from sqlalchemy import select
import json
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
    # if current_user.id in [x['id'] for x in task['assigned']]:
    # todo different logic for different task types
    if task['type'] == 0:
        user_task = models.UserTask.query.filter_by(annotation_task_id=task['id'], user_id=current_user.id).first()
        slides = task['slides']
    else:
        user_task = models.UserTask.query.filter_by(revision_task_id=task['id'], user_id=current_user.id).first()
        slides = task['task']['slides']

    session_id = user_task.id
    if session_id in sessions:
        new_session = sessions[session_id]
    else:
        new_session = Session(slides, user_task)
        sessions[session_id] = new_session
    session = user_task.to_dict()

    if task['type'] == 1:
        # revision task has the labelled data from all the user_tasks associated with it
        session['revision'] = {}
        for revision_task in task['revisions']:
            # data = db.session.query(models.Annotation, models.AnnotationRevised).filter(
            #     models.Annotation.user_task_id == revision_id['id'],
            #     models.AnnotationRevised.user_task_id == task['id'],
            #     models.Annotation.id == models.AnnotationRevised.annotation_id).all()
            # data = models.Annotation.query.filter_by(user_task_id=revision_id['id']).all()
            user_feedback = db.session.query(models.AnnotationRevised).filter(
                models.AnnotationRevised.user_task_id == user_task.id).subquery()
            data = db.session.query(models.Annotation, user_feedback) \
                .join(user_feedback, user_feedback.c.annotation_id == models.Annotation.id, isouter=True).filter(
                models.Annotation.user_task_id == revision_task['id']).all()
            # db.session.query(models.Annotation, models.AnnotationRevised).select_from(models.Annotation) \
            #     .outerjoin(models.AnnotationRevised) \
            #     .filter(models.Annotation.user_task_id == revision_task['id']).all()
            session['revision'][revision_task['id']] = {
                k['id']: [{
                    **x[0].to_dict(),
                    "feedback": {
                        "id": x[1],
                        "feedback": x[4],
                        "label_id": x[5],
                        "data": json.loads(x[6]) if x[6] is not None else None,
                    }} for x in filter(lambda x: x[0].slide_id == k['id'], data)] for k in task['task']['slides']}
    else:
        # common annotation task, we will put the annotations we have associated with it:
        data = models.Annotation.query.filter_by(user_task_id=session_id).all()
        session['labelled'] = {k['id']: [x.to_dict() for x in filter(lambda x: x.slide_id == k['id'], data)] for k
                               in task['slides']}
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


@session_api.route("<string:session_id>/add_region", methods=['POST'])
def add_region(session_id):
    region_data = request.json
    region = models.Annotation(
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
    region = models.Annotation.query.filter_by(id=region_data['id']).first()
    region.data = region_data['data']
    db.session.commit()
    return jsonify(region.to_dict())


@session_api.route("<string:session_id>/annotation_feedback", methods=['POST'])
def annotation_feedback(session_id):
    annotation_data = request.json
    user_task = sessions[session_id].user_task
    if annotation_data['feedback']['id'] is not None:
        # this is a feedback update:
        feedback = models.AnnotationRevised.query.get(annotation_data['feedback']['id'])
        feedback.feedback = annotation_data['feedback']['feedback']
        feedback.label_id = annotation_data['feedback']['label_id']
        feedback.data = annotation_data['feedback']['data']
    else:
        # this is a new feedback:
        feedback = models.AnnotationRevised(
            user_task_id=user_task.id,
            annotation_id=annotation_data['id'],
            feedback=annotation_data['feedback']['feedback'],
            label_id=annotation_data['feedback']['label_id'],
            data=annotation_data['feedback']['data']
        )
        db.session.add(feedback)
    db.session.commit()
    annotation = models.Annotation.query.get(annotation_data['id'])
    annotation = annotation.to_dict(feedback=feedback, with_feedback=True)
    return jsonify(annotation)


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
