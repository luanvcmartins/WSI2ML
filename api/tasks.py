import analyzer.session
import hashlib
import models
import uuid
import os
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, current_user
from app import db
from itertools import combinations, cycle
from random import shuffle

task_api = Blueprint("task_api", __name__)


@task_api.route("new", methods=["POST"])
@jwt_required()
def new():
    if not current_user.is_admin:
        return jsonify({"msg": 'Not an admin!'}), 401
    new_task = request.json
    if new_task['type'] == 0:
        # Annotation task:
        task = new_annotation_task(new_task)
    else:  # if new_task['type'] == 1:
        # the task type is revision
        task = new_revision_task(new_task)

    for user in new_task['assigned']:
        user_task = models.UserTask(
            id=str(uuid.uuid4()),
            user_id=user['id'],
            completed=False,
            type=new_task['type']
        )
        if new_task['type'] == 0:
            user_task.annotation_task_id = task.id
        else:
            user_task.revision_task_id = task.id
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
    if not current_user.is_admin:
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

    new_task_counter, new_user_task_counter = 0, {user['name']: 0 for user in users}
    for user_group, file in zip(cycle(users_group), files):
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
        # we will register the new task and associate the slide to it:
        task = models.AnnotationTask(
            project_id=batch['project_id'],
            name=f"{batch['name']} - {file['name']}" if batch['name'] != '' else ''
        )
        task.slides.append(m_slide)
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
        new_task_counter += 1
    db.session.commit()
    return jsonify({"new_tasks": new_task_counter, "user_tasks": new_user_task_counter})


@task_api.route("list", methods=['GET'])
@jwt_required()
def task_list():
    annotation_tasks = db.session.query(models.AnnotationTask, models.UserTask) \
        .join(models.UserTask, models.UserTask.annotation_task_id == models.AnnotationTask.id) \
        .filter(models.UserTask.user_id == current_user.id).all()
    review_tasks = db.session.query(models.RevisionTask, models.UserTask) \
        .join(models.UserTask, models.UserTask.revision_task_id == models.RevisionTask.id) \
        .filter(models.UserTask.user_id == current_user.id).all()
    return jsonify({
        "annotations": [{**x[1].to_dict(), **x[0].to_dict()} for x in annotation_tasks],
        "review": [{**x[1].to_dict(), **x[0].to_dict()} for x in review_tasks]
    })


@task_api.route("management_list", methods=['GET'])
@jwt_required()
def management_list():
    if current_user.manages_tasks:
        annotations = db.session.query(models.AnnotationTask).all()
        revisions = db.session.query(models.RevisionTask).all()
        return jsonify({
            0: [x.to_dict() for x in annotations],
            1: [x.to_dict() for x in revisions]
        })
    return jsonify({"msg": "Not an admin!"}), 401


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


@task_api.route("remove", methods=["POST"])
def remove():
    task = request.json
    if task['type'] == 0:
        db.session.query(models.AnnotationTask).filter(models.AnnotationTask.id == task['id']).delete()
        db.session.execute("DELETE FROM task_slides WHERE task_id = :task_id", {"task_id": task['id']})
        db.session.query(models.UserTask).filter(models.UserTask.annotation_task_id == task['id']).delete()
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
