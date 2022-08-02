import analyzer.session
import hashlib
import models
import uuid
import os
import re
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, current_user
from app import db
from itertools import combinations, cycle
from random import shuffle

task_api = Blueprint("task_api", __name__)


@task_api.route("new", methods=["POST"])
@jwt_required()
def new():
    if not (current_user.manages_tasks or current_user.manages_apps):
        return jsonify({"msg": 'Not an admin!'}), 401
    new_task = request.json
    task_type = new_task['type']
    if task_type == 0 or task_type == 2:
        # Annotation task:
        task = new_annotation_task(new_task)
    else:  # new_task['type'] == 1:
        # the task type is revision
        task = new_revision_task(new_task)

    for user in new_task['assigned']:
        user_task = models.UserTask(
            id=str(uuid.uuid4()),
            completed=False,
            type=new_task['type']
        )
        if task_type == 0:
            # user annotation task
            user_task.user_id = user['id']
            user_task.annotation_task_id = task.id
        elif task_type == 1:
            # revision task
            user_task.user_id = user['id']
            user_task.revision_task_id = task.id
        else:
            # app annotation task:
            user_task.app_id = user['id']
            user_task.annotation_task_id = task.id

        db.session.add(user_task)

    db.session.commit()
    return jsonify(task.to_dict())


def new_annotation_task(new_task):
    task = models.AnnotationTask(
        project_id=new_task['project_id'],
        name=new_task['name']
    )
    for slide in new_task['slides']:
        m_slide = models.Slide.query.get(slide['id'])
        if m_slide is None:
            properties = analyzer.session.get_slide_properties(slide['file'])
            m_slide = models.Slide(id=slide['id'], name=slide['name'], file=slide['file'], properties=properties)
        task.slides.append(m_slide)
    db.session.add(task)
    db.session.commit()
    return task


def new_revision_task(new_task):
    task = models.RevisionTask(
        project_id=new_task['project_id'],
        name=new_task['name'],
        task_id=new_task['task_id']
    )
    for user_task in new_task['revision']:
        task.revisions.append(models.UserTask.query.get(user_task))
    db.session.add(task)
    db.session.commit()
    return task


@task_api.route("new_batch", methods=["POST"])
@jwt_required()
def new_batch():
    if not current_user.manages_tasks:
        return jsonify({"msg": 'Not an admin!'}), 401
    batch = request.json
    users = batch['assigned']
    files = []
    for folder in batch['folders']:
        for file in os.listdir(folder["id"]):
            full_path = os.path.join(folder["id"], file)
            if os.path.isfile(full_path):
                files.append({
                    "id": hashlib.md5(full_path.encode()).hexdigest(),
                    "name": file,
                    "file": full_path
                })

    # we will combine users into unique groups to assign them to the task:
    users_group = list(combinations(users, batch['concurrent']))
    # we will shuffle the group as to avoid assigning tasks too unfairly (many users for fewer tasks)
    shuffle(users_group)
    only_new = batch['only_new']
    group_slides = batch['group_slides']

    grouped_slides = {}
    idx = 0
    new_task_counter, new_user_task_counter = 0, {user['name']: 0 for user in users}
    for file in files:
        # we will first add the slide to the database, this is important as we may want to skip this
        # item if the file is known and the user selected 'only_new'
        m_slide = models.Slide.query.get(file['id'])
        if m_slide is None:
            properties = analyzer.session.get_slide_properties(file['file'])
            m_slide = models.Slide(id=file['id'], name=file['name'], file=file['file'], properties=properties)
        else:
            # we already know this file, we will skip it entirely if the user selected 'only_new':
            if only_new:
                continue

        # slides can be grouped based on a criteria
        if group_slides:
            # slides should be grouped, we take the first part of the filename
            key = re.search("H\\d+-\\d+", file['name'])

            if key is not None:
                key = key.group()
                if key not in grouped_slides:
                    grouped_slides[key] = []
                grouped_slides[key].append(m_slide)
            else:
                # if match is not found, default to one-slide task
                grouped_slides[idx] = [m_slide]
                idx += 1
        else:
            # if user doesn't want to group slides, then each group will have one slide
            grouped_slides[idx] = [m_slide]
            idx += 1

    # not that the slides has been created and grouped together, we will create the tasks
    for user_group, (g_name, slides) in zip(cycle(users_group), grouped_slides.items()):
        # we will register the new task:
        task = models.AnnotationTask(
            project_id=batch['project_id'],
            name=f"{batch['name']}" if batch['name'] != '' else 'Slide annotation'
        )
        # we will associate each slide of the group to the task:
        for slide in slides:
            task.slides.append(slide)
        db.session.add(task)
        db.session.commit()

        # we will assign the users to this task:
        for user in user_group:
            user_task = models.UserTask(
                id=str(uuid.uuid4()),
                user_id=user['id'],
                completed=False,
                annotation_task_id=task.id,
                type=0
            )
            new_user_task_counter[user['name']] += 1
            db.session.add(user_task)
            # db.session.commit()
        new_task_counter += 1
    db.session.commit()
    return jsonify({"new_tasks": new_task_counter, "user_tasks": new_user_task_counter})


@task_api.route("list", methods=['GET'])
@jwt_required()
def task_list():
    annotation_tasks = db.session.query(models.AnnotationTask, models.UserTask) \
        .join(models.UserTask, models.UserTask.annotation_task_id == models.AnnotationTask.id) \
        .filter(models.UserTask.user_id == current_user.id) \
        .order_by(models.UserTask.completed).all()
    review_tasks = db.session.query(models.RevisionTask, models.UserTask) \
        .join(models.UserTask, models.UserTask.revision_task_id == models.RevisionTask.id) \
        .filter(models.UserTask.user_id == current_user.id) \
        .order_by(models.UserTask.completed).all()
    annotation_tasks = list(annotation_tasks)
    review_tasks = list(review_tasks)
    next_annotation = {
        **annotation_tasks[0][0].to_dict(),
        **annotation_tasks[0][1].to_dict()
    } if len(annotation_tasks) > 0 else None
    next_revision = {**review_tasks[0][0].to_dict(), **review_tasks[0][1].to_dict()} if len(review_tasks) > 0 else None
    return jsonify({
        "annotation_status": {
            "next": next_annotation,
            "done": len([task for task in annotation_tasks if task[1].completed]),
            "total": len(annotation_tasks)
        },
        "review_status": {
            "next": next_revision,
            "done": len([task for task in review_tasks if task[1].completed]),
            "total": len(review_tasks)
        },
        "annotations": [{**x[0].to_dict(), **x[1].to_dict()} for x in annotation_tasks],
        "review": [{**x[0].to_dict(), **x[1].to_dict()} for x in review_tasks]
    })


@task_api.route("management_list", methods=['GET'])
@jwt_required()
def management_list():
    if current_user.manages_tasks:
        annotation_tasks = db.session.query(models.AnnotationTask).all()
        revision_tasks = db.session.query(models.RevisionTask).all()
        annotations = []
        for annotation in annotation_tasks:
            user_tasks = models.UserTask.query.filter_by(annotation_task_id=annotation.id).all()
            annotations.append({
                **annotation.to_dict(),
                "user_tasks": [user_task.to_dict(skip_task=True) for user_task in user_tasks]
            })

        revisions = []
        for revision in revision_tasks:
            user_tasks = models.UserTask.query.filter_by(revision_task_id=revision.id).all()
            revisions.append({
                **revision.to_dict(),
                "user_tasks": [user_task.to_dict(skip_task=True) for user_task in user_tasks]
            })

        return jsonify({
            0: annotations,
            1: revisions
        })
    return jsonify({"msg": "Not an admin!"}), 401


@task_api.route("app_task_list", methods=['GET'])
@jwt_required()
def app_tasks_list():
    if not current_user.manages_apps:
        return jsonify({"msg": "Not an admin!"}), 401
    user_apps = [app.id for app in models.App.query.filter_by(owner_id=current_user.id).all()]
    if len(user_apps) > 0:
        query_filter = ",".join([f":id{i}" for i in range(len(user_apps))])
        tasks = db.session.execute(
            f"""SELECT annotation_tasks.* FROM user_tasks, annotation_tasks WHERE
            user_tasks.annotation_task_id = annotation_tasks.id AND
            user_tasks.app_id in ({query_filter})
            GROUP BY annotation_tasks.id""", {
                f"id{i}": app for i, app in enumerate(user_apps)
            }
        )
    else:
        tasks = []
    tasks = list(tasks)
    projects_id = set([task[1] for task in tasks])
    projects = models.Project.query.filter(models.Project.id.in_(projects_id))
    app_task_list = {
        "projects": [project.to_dict(include_labels=False) for project in projects],
        "tasks": {}
    }
    for task in tasks:
        task_id, project_id, task_name, task_created, _ = task
        app_tasks = db.session.execute("""SELECT user_tasks.id, user_tasks.completed, user_tasks.created, apps.* 
        FROM user_tasks, annotation_tasks, apps WHERE
        user_tasks.annotation_task_id = annotation_tasks.id AND
        user_tasks.app_id = apps.id AND
        annotation_tasks.id = :task_id""", {"task_id": task_id})
        slides = db.session.execute("""
        SELECT slides.id, slides.name, slides.file from slides, task_slides WHERE slides.id = task_slides.slide_id AND task_slides.task_id = :task_id
        """, {"task_id": task_id})
        if project_id not in app_task_list["tasks"]:
            app_task_list["tasks"][project_id] = []
        project_task_list = app_task_list["tasks"][project_id]
        project_task_list.append({
            "id": task_id,
            "name": task_name,
            "created": task_created,
            "type": 2,
            "slides": [{
                "id": slide[0],
                "name": slide[1],
                "file": slide[2]
            } for slide in slides],
            "app_tasks": [{
                "id": app_task[0],
                "completed": app_task[1],
                "created": app_task[2],
                "app_id": app_task[3],
                "app_name": app_task[4]
            } for app_task in app_tasks]
        })
    return jsonify(app_task_list)


@task_api.route("edit", methods=["POST"])
def edit():
    new_task = request.json
    if new_task['type'] == 0:
        task = db.session.query(models.AnnotationTask).get(new_task['id'])
    else:
        task = db.session.query(models.RevisionTask).get(new_task['id'])
    task.update(new_task)

    old_task_users = set([x.user.id for x in task.assigned])
    new_task_users = set([x['id'] for x in new_task['assigned'] if 'id' in x])

    # new users added to this task:
    for user_id in (new_task_users - old_task_users):
        user_task = models.UserTask(
            id=str(uuid.uuid4()),
            user_id=user_id,
            completed=False,
            type=new_task['type']
        )
        if new_task['type'] == 0:
            user_task.annotation_task_id = new_task['id']
        else:
            user_task.revision_task_id = new_task['id']
        db.session.add(user_task)

    # users removed from this task:
    for removed_task in (old_task_users - new_task_users):
        if new_task['type'] == 0:
            db.session.query(models.UserTask).filter(
                models.UserTask.user_id == removed_task, models.UserTask.annotation_task_id == task.id).delete()
        elif new_task['type'] == 1:
            if new_task['type'] == 0:
                db.session.query(models.UserTask).filter(
                    models.UserTask.user_id == removed_task, models.UserTask.revision_task_id == task.id).delete()
    if new_task['type'] == 0:
        # wwe will only modify the slides if the task is annotation
        new_task_slides = set([x['id'] for x in new_task['slides']])
        old_task_slides = set([x.id for x in task.slides])

        # slides added to task:
        slides = {x['id']: x for x in new_task['slides']}
        for slide_id in (new_task_slides - old_task_slides):
            m_slide = models.Slide.query.get(slide_id)
            if m_slide is None:
                m_slide = models.Slide(id=slide_id, name=slides[slide_id]['name'], file=slides[slide_id]['file'])
            task.slides.append(m_slide)

        # slides removed from task:
        for slide_id in (old_task_slides - new_task_slides):
            task.slides.remove(models.Slide.query.get(slide_id))

    db.session.commit()
    task = models.AnnotationTask.query.get(new_task['id']) if new_task['type'] == 0 else \
        models.RevisionTask.query.get(new_task['id'])
    return jsonify(task.to_dict())


@task_api.route("new_app_task", methods=['POST'])
@jwt_required()
def new_app_task():
    app_task_request = request.json
    app_task = models.UserTask(
        id=str(uuid.uuid4()),
        annotation_task_id=app_task_request['annotation_id'],
        app_id=app_task_request['app_id'],
        type=2
    )
    db.session.add(app_task)
    annotations = app_task_request['annotations']
    if annotations is None:
        app_task.completed = False
    else:
        for slide_id, slide_annotations in annotations.items():
            for slide_annotation in slide_annotations:
                db.session.add(models.Annotation(
                    user_task_id=app_task.id,
                    title=slide_annotation['title'] if 'title' in slide_annotation else None,
                    data=slide_annotation['geometry'],
                    properties=slide_annotation['properties'] if 'properties' in slide_annotation else None,
                    label_id=slide_annotation['label']['id'],
                    slide_id=slide_id
                ))
        app_task.completed = True
    db.session.commit()
    return jsonify(app_task.to_dict())


@task_api.route("remove", methods=["POST"])
def remove():
    task = request.json
    if task['type'] == 0 or task['type'] == 2:
        user_tasks = db.session.query(models.UserTask).filter(models.UserTask.annotation_task_id == task['id']).all()
        for user_task in user_tasks:
            db.session.query(models.Annotation).filter(models.Annotation.user_task_id == user_task.id).delete()
        db.session.query(models.AnnotationTask).filter(models.AnnotationTask.id == task['id']).delete()
        db.session.execute("DELETE FROM task_slides WHERE task_id = :task_id", {"task_id": task['id']})
        db.session.query(models.UserTask).filter(models.UserTask.annotation_task_id == task['id']).delete()
        for revision in db.session.query(models.RevisionTask).filter(models.RevisionTask.task_id == task['id']).all():
            db.session.query(models.UserTask).filter(models.UserTask.revision_task_id == revision.id).delete()
        db.session.query(models.RevisionTask).filter(models.RevisionTask.task_id == task['id']).delete()
    elif task['type'] == 1:
        db.session.query(models.RevisionTask).filter(models.RevisionTask.id == task['id']).delete()
        db.session.query(models.UserTask).filter(models.UserTask.revision_task_id == task['id']).delete()
    db.session.commit()
    return jsonify({"success": True})


@task_api.route("completed")
def completed():
    _id = request.args["id"]
    completed = request.args["completed"] == "true"
    user_task = models.UserTask.query.get(_id)
    user_task.completed = completed
    db.session.commit()
    return jsonify({"success": True})


def files_within(folder):
    folder_content = []
    for x in os.listdir(folder):
        full_path = os.path.join(folder, x)
        if os.path.isfile(full_path):
            folder_content.append({
                "id": hashlib.md5(full_path.encode()).hexdigest(),
                "name": x,
                "file": full_path
            })
        else:
            folder_content.append({
                "name": x,
                "children": files_within(full_path)
            })
    return folder_content


def is_new_file(full_file_path):
    f_hash = hashlib.md5(full_file_path.encode()).hexdigest()
    return models.Slide.query.get(f_hash) is None


def folders_within(folder):
    folder_content = []
    for x in os.listdir(folder):
        full_path = os.path.join(folder, x)
        if not os.path.isfile(full_path):
            files = [os.path.join(full_path, x) for x in os.listdir(full_path) if
                     os.path.isfile(os.path.join(full_path, x))]
            new_files = sum(map(is_new_file, files))
            folder_content.append({
                "id": full_path,
                "name": x,
                "total": len(files),
                "new": new_files,
                "children": folders_within(full_path)
            })
    return folder_content


@task_api.route("files", methods=['GET'])
@jwt_required()
def files():
    project_id = request.args['project_id']
    project = db.session.query(models.Project).filter(models.Project.id == project_id).first()
    return jsonify(files_within(project.folder))


@task_api.route("folders", methods=["GET"])
def folders():
    project_id = request.args['project_id']
    project = db.session.query(models.Project).filter(models.Project.id == project_id).first()
    files = [os.path.join(project.folder, x) for x in os.listdir(project.folder) if
             os.path.isfile(os.path.join(project.folder, x))]
    return jsonify([{
        "id": project.folder,
        "name": "Project's folder",
        "total": len(files),
        "new": sum(map(is_new_file, files)),
        "children": folders_within(project.folder)
    }])
