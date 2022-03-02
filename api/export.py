from io import BytesIO

import models
import json
import zipfile
import math
from flask import Blueprint, jsonify, request, current_app, Response
from app import db

export_api = Blueprint("export_api", __name__)


@export_api.route("list")
def list_projects():
    projects = models.Project.query.all()
    return jsonify([x.to_json() for x in projects])


@export_api.route("list/by_task")
def list_task():
    project_id = request.args['project_id']
    export_tasks = []
    tasks = models.AnnotationTask.query.filter(models.AnnotationTask.project_id == project_id).all()
    for task in tasks:
        annotations = db.session.execute(
            """SELECT user_tasks.id, users.name, annotation_tasks.name, count(annotations.id)
            FROM user_tasks, users, annotation_tasks, annotations
            WHERE user_tasks.user_id = users.id AND annotation_tasks.id = user_tasks.annotation_task_id
            AND annotations.user_task_id = user_tasks.id
            AND user_tasks.annotation_task_id = :task_id
            GROUP BY user_tasks.id, users.name,annotation_tasks.name""",
            {"task_id": task.id}).all()
        export_tasks.append({
            "id": task.id,
            "name": task.name,
            "slides": [x.to_dict() for x in task.slides],
            "annotated": [{
                "user_task_id": x[0],
                "user_name": x[1],
                "task_name": x[2],
                "annotation_count": x[3]
            } for x in annotations],
        })
    return jsonify(export_tasks)


@export_api.route("list/by_slides")
def list_slide():
    project_id = request.args['project_id']

    project_slides = db.session.execute("""SELECT slides.*
        FROM slides, annotation_tasks, task_slides
        WHERE annotation_tasks.project_id = :project_id 
        AND task_slides.task_id = annotation_tasks.id 
        and slides.id = task_slides.slide_id 
        group by slides.id""", {"project_id": project_id}).all()
    slides = []
    for slide in project_slides:
        annotations = db.session.execute(
            """SELECT user_tasks.id, users.name, annotation_tasks.name, count(annotations.id) 
            FROM user_tasks, users, task_slides, annotation_tasks, annotations 
            WHERE user_tasks.user_id = users.id AND annotation_tasks.id = user_tasks.annotation_task_id
            AND annotations.slide_id =:slide_id AND annotations.user_task_id = user_tasks.id 
            AND task_slides.slide_id = :slide_id AND annotation_tasks.project_id = :project_id 
            GROUP BY user_tasks.id""",
            {"project_id": project_id, "slide_id": slide[0]}).all()
        slides.append({
            "id": slide[0],
            "name": slide[2],
            "file": slide[1],
            "properties": slide[3],
            "annotated": [{
                "user_task_id": x[0],
                "user_name": x[1],
                "task_name": x[2],
                "annotation_count": x[3]
            } for x in annotations],
            "exporting": {
                "selected": [],
                "filter": {},
                "count": 0,
            }
        })

    return jsonify(slides)


@export_api.route("reviews/by_slide")
def reviews_slide():
    params = {"user_task_id": request.args['user_task_id'], "slide_id": request.args['slide_id']}
    revisions = db.session.execute("""
        SELECT user_tasks.id, users.name, count(*)
        FROM revision_tasks, user_tasks, users, annotations, annotations_revised
        WHERE user_tasks.revision_task_id = revision_tasks.id
          AND annotations.user_task_id = :user_task_id
          AND users.id = user_tasks.user_id AND annotations.slide_id = :slide_id
          AND annotations_revised.annotation_id = annotations.id
          AND annotations_revised.user_task_id = user_tasks.id
        GROUP BY users.id
    """, params).all()
    return jsonify([{
        "revision_user_task_id": x[0],
        "revision_by_name": x[1],
        "revision_count": x[2]
    } for x in revisions])


@export_api.route("review/by_task")
def review_by_task():
    user_task_id = request.args['user_task_id']
    revisions = db.session.execute("""
            SELECT user_tasks.id, users.name, count(*)
            FROM revision_tasks, user_tasks, users, annotations, annotations_revised
            WHERE user_tasks.revision_task_id = revision_tasks.id
              AND annotations.user_task_id = :user_task_id
              AND users.id = user_tasks.user_id 
              AND annotations_revised.annotation_id = annotations.id
              AND annotations_revised.user_task_id = user_tasks.id
            GROUP BY users.id, user_tasks.id
        """, {"user_task_id": user_task_id}).all()

    return jsonify([{
        "revision_user_task_id": x[0],
        "revision_by_name": x[1],
        "revision_count": x[2]
    } for x in revisions])


def create_polygon(annotation):
    if annotation.data["type"] == "rect":
        # casting rect annotation to expected Polygon format
        point1, point2 = annotation.data['points']
        annotation_points = [[point1['x'], point1['y']],
                             [point2['x'], point1['y']],
                             [point2['x'], point2['y']],
                             [point1['x'], point2['y']],
                             [point1['x'], point1['y']]]
    elif annotation.data["type"] == "circle":
        # casting circle annotations to polygons
        point1, point2 = annotation.data['points']
        width, height = point1['x'] - point2['x'], point1['y'] - point2['y']
        radius = height / 2
        sample = lambda t: [radius * math.cos(t) + point1['x'], radius * math.sin(t) + point1['y']]
        sample_points = int(20 + (2 * radius))
        rate = 2 * math.pi / sample_points
        annotation_points = [sample(rate * (t % sample_points)) for t in range(sample_points + 1)]
    else:
        # converting Poygons annotations to the expected format
        annotation_points = [[x['x'], x['y']] for x in annotation.data['points']]
        annotation_points.append([annotation.data['points'][0]['x'], annotation.data['points'][0]['y']])

    return {
        "type": "Feature",
        "geometry": {
            "type": "Polygon",
            "coordinates": [annotation_points]
        },
        "properties": {
            "name": annotation.title,
            "description": annotation.description,
            "slide": annotation.slide.to_dict(),
            "label_id": annotation.label_id,
            "label": annotation.label.to_json()
        }
    }


def filter_annotations(user_task_filters, annotations):
    annotations_remarks, allowed_annotations = {}, {}
    if len(user_task_filters) > 0:
        for review in user_task_filters:
            rev_anns = models.AnnotationRevised.query.filter(models.AnnotationRevised.user_task_id == review).all()
            for rev_ann in rev_anns:
                # this review doesn't concern an annotation we are exporting, skip it
                if rev_ann.annotation_id not in annotations: continue

                # creating the counting for this new annotation
                if rev_ann.annotation_id not in annotations_remarks:
                    annotations_remarks[rev_ann.annotation_id] = {
                        "correct": 0,  # number of people who assign 'correct'
                        "wrong": {}  # label and the number of people who assigned each label
                    }
                if rev_ann.feedback == 0:
                    # this person has reviewed this annotation and marked it as correct
                    annotations_remarks[rev_ann.annotation_id]["correct"] += 1
                else:
                    # this person marked this annotation as incorrect
                    wrong_remarks = annotations_remarks[rev_ann.annotation_id]["wrong"]
                    if rev_ann.label_id not in wrong_remarks:
                        wrong_remarks[rev_ann.label_id] = 1
                    else:
                        # we are counting the number of people who marked each label as correct
                        wrong_remarks[rev_ann.label_id] += 1
        for annotation_id, remarks in annotations_remarks.items():
            if remarks["correct"] == len(user_task_filters):
                # everyone reviewed marked this annotation as correct
                allowed_annotations[annotation_id] = None
            elif len(remarks["wrong"].keys()) == 1 and list(remarks["wrong"].values())[0] == len(user_task_filters):
                # everyone reviewed marked this annotation as wrong, BUT, they all agree upon the same label
                allowed_annotations[annotation_id] = list(remarks["wrong"].keys())[0]
    return allowed_annotations


@export_api.route("by_task", methods=["POST"])
def export_task():
    exp_annotation = request.json
    only_revised = request.args['only_revised'] == 'true'
    geojson = {}
    for user_task_id, user_task_filters in exp_annotation.items():
        filtering_annotations = len(user_task_filters) > 0 or only_revised
        ut_annotations = models.Annotation.query.filter(models.Annotation.user_task_id == user_task_id).all()
        allowed_annotations = filter_annotations(user_task_filters,
                                                 set(x.id for x in ut_annotations)) if filtering_annotations else None

        for ut_annotation in ut_annotations:
            if ut_annotation.slide.name not in geojson:
                geojson[ut_annotation.slide.name] = []
            if filtering_annotations:
                if ut_annotation.id in allowed_annotations:
                    if allowed_annotations[ut_annotation.id] is None:
                        geojson[ut_annotation.slide.name].append(create_polygon(ut_annotation))
                    else:
                        geojson[ut_annotation.slide.name].append({
                            **create_polygon(ut_annotation),
                            "label_id": allowed_annotations[ut_annotation.id]
                        })
            else:
                geojson[ut_annotation.slide.name].append(create_polygon(ut_annotation))

    zip_stream = BytesIO()
    with zipfile.ZipFile(zip_stream, 'w') as zf:
        for slide, slide_geojson in geojson.items():
            final_geojson = {
                "type": "FeatureCollection",
                "features": slide_geojson
            }
            file_data = zipfile.ZipInfo(f"{slide.replace('.svs', '')}.geojson")
            file_data.compress_type = zipfile.ZIP_DEFLATED
            zf.writestr(file_data, json.dumps(final_geojson, indent=2))
    zip_stream.seek(0)

    return Response(zip_stream,
                    mimetype='application/json',
                    headers={'Content-Disposition': 'attachment;filename=annotations.zip'})


"""
        ut_annotations = models.Annotation.query.filter(models.Annotation.user_task_id == user_task_id).all()
        for ut_annotation in ut_annotations:
            if filtering_annotations:
                if ut_annotation.id in allowed_annotations:
                    if allowed_annotations[ut_annotation.id] is None:
                        geojson.append(create_polygon(ut_annotation))
                    else:
                        geojson.append({
                            **create_polygon(ut_annotation),
                            "label_id": allowed_annotations[ut_annotation.id]
                        })
            else:
                geojson.append(create_polygon(ut_annotation))
"""


@export_api.route("count", methods=['POST'])
def count():
    exp_annotation = request.json
    only_revised = request.args['only_revised'] == 'true'
    counting = {}
    for user_task_id, user_task_filters in exp_annotation.items():
        allowed_annotations = set(
            x.id for x in models.Annotation.query.filter(models.Annotation.user_task_id == user_task_id).all())
        if len(user_task_filters) > 0 or only_revised:
            allowed_annotations = set(filter_annotations(user_task_filters, allowed_annotations).keys())
        counting[user_task_id] = len(allowed_annotations)
    return jsonify(counting)
