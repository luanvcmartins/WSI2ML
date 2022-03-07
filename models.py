import json
from app import db, jwt
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.sql import func


class User(UserMixin, db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80))
    email = db.Column(db.Text)
    username = db.Column(db.String(30), unique=True)
    password_hash = db.Column(db.String(128))
    is_admin = db.Column(db.Boolean)
    manages_apps = db.Column(db.Boolean)
    manages_users = db.Column(db.Boolean)
    manages_tasks = db.Column(db.Boolean)
    manages_projects = db.Column(db.Boolean)
    can_export = db.Column(db.Boolean)
    access_overview = db.Column(db.Boolean)
    is_bot = db.Column(db.Boolean)

    @property
    def password(self):
        # no reason to let people read the password field
        raise AttributeError('Password field is unavailable for access.')

    @password.setter
    def password(self, password):
        # when password gets set, we create a hash from the text
        self.password_hash = generate_password_hash(password)

    def update(self, update):
        self.name = update["name"]
        self.is_admin = update["is_admin"]
        self.username = update["username"]
        self.manages_apps = update['manages_apps']
        self.manages_users = update['manages_users']
        self.manages_tasks = update['manages_tasks']
        self.manages_projects = update['manages_projects']
        self.can_export = update['can_export']
        self.access_overview = update['access_overview']
        if 'password' in update:
            self.password = update['password']

    def verify_password(self, password):
        """
        Utility function for checking if the user's password and the provided password matches
        """
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "username": self.username,
            "is_admin": self.is_admin,
            "manages_apps": self.manages_apps,
            "manages_users": self.manages_users,
            "manages_tasks": self.manages_tasks,
            "manages_projects": self.manages_projects,
            'access_overview': self.access_overview,
            "can_export": self.can_export,
            "is_bot": self.is_bot
        }


class App(db.Model):
    __tablename__ = "apps"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(60))
    description = db.Column(db.String(120))
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    owner = db.relationship("User", viewonly=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "owner": self.owner.to_dict()
        }


class Project(db.Model):
    __tablename__ = "projects"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(60))
    description = db.Column(db.String(120))
    folder = db.Column(db.Text)
    labels = db.relationship("Label")

    def to_dict(self, include_labels=True):
        project = {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "folder": self.folder
        }
        if include_labels:
            project["labels"] = [x.to_dict() for x in self.labels]
        return project


class Label(db.Model):
    __tablename__ = "label"
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'))
    name = db.Column(db.String(60))
    label_color = db.Column(db.String(12))

    @property
    def color(self):
        return self.label_color.split(";")

    @color.setter
    def color(self, new_color):
        self.label_color = ";".join(map(str, new_color))

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "color": self.color
        }


task_slides = db.Table(
    'task_slides',
    db.Model.metadata,
    db.Column('id', db.Integer, primary_key=True),
    db.Column('task_id', db.ForeignKey('annotation_tasks.id')),
    db.Column('slide_id', db.ForeignKey('slides.id'))
)

revision_tasks_items = db.Table(
    'revision_task_items',
    db.Model.metadata,
    db.Column('id', db.Integer, primary_key=True),
    db.Column('task_id', db.ForeignKey('revision_tasks.id')),
    db.Column('user_task_id', db.ForeignKey('user_tasks.id'))
)


class UserTask(db.Model):
    __tablename__ = 'user_tasks'
    id = db.Column(db.Text, primary_key=True)
    annotation_task_id = db.Column(db.Integer, db.ForeignKey('annotation_tasks.id', ondelete='CASCADE'))
    revision_task_id = db.Column(db.Integer, db.ForeignKey('revision_tasks.id', ondelete='CASCADE'))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    app_id = db.Column(db.Integer, db.ForeignKey('apps.id'))
    type = db.Column(db.Integer)
    completed = db.Column(db.Boolean)
    locked = db.Column(db.Boolean)
    created = db.Column(db.DateTime(timezone=True), server_default=func.now())
    updated = db.Column(db.DateTime(timezone=True), onupdate=func.now())
    user = db.relationship("User", viewonly=True)
    app = db.relationship("App", viewonly=True)
    annotation_task = db.relationship("AnnotationTask", viewonly=True)
    revision_task = db.relationship("RevisionTask", viewonly=True)

    def to_dict(self, skip_task=False):
        user_task = {
            "id": self.id,
            "type": self.type,
            "completed": self.completed,
            "created": self.created
        }
        if self.type == 2:
            user_task["app"] = self.app.to_dict()
        else:
            user_task["user"] = self.user.to_dict()
        if not skip_task:
            if self.type == 0 or self.type == 2:
                user_task["task"] = self.annotation_task.to_dict()
            else:
                user_task["task"] = self.revision_task.to_dict()
        return user_task


class AnnotationTask(db.Model):
    __tablename__ = "annotation_tasks"
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'))
    name = db.Column(db.String(60))
    created = db.Column(db.DateTime(timezone=True), server_default=func.now())
    updated = db.Column(db.DateTime(timezone=True), onupdate=func.now())
    project = db.relationship("Project")
    assigned = db.relationship("UserTask", passive_deletes=True)
    slides = db.relationship("Slide", secondary=task_slides)

    def to_dict(self, context="default"):
        task = {
            "id": self.id,
            "project_id": self.project_id,
            "name": self.name,
            "created": self.created,
            "type": 0
        }
        if context == "default":
            task = {**task, **{
                "slides": [x.to_dict() for x in self.slides],
                "project": self.project.to_dict(),
                "assigned": [x.user.to_dict() if x.type != 2 else x.app.to_dict() for x in self.assigned],
            }}

        return task

    def update(self, update):
        self.name = update['name']


class RevisionTask(db.Model):
    __tablename__ = "revision_tasks"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.Text)
    created = db.Column(db.DateTime(timezone=True), server_default=func.now())
    updated = db.Column(db.DateTime(timezone=True), onupdate=func.now())
    task_id = db.Column(db.Integer, db.ForeignKey('annotation_tasks.id'))
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'))
    project = db.relationship("Project", viewonly=True)
    task = db.relationship("AnnotationTask", viewonly=True)
    revisions = db.relationship("UserTask", secondary=revision_tasks_items)
    assigned = db.relationship("UserTask")

    def update(self, update):
        self.name = update['name']

    def to_dict(self, include_revisions=True, with_assigned=True):
        item = {
            "id": self.id,
            "name": self.name,
            "task_id": self.task_id,
            "project_id": self.project_id,
            "project": self.project.to_dict(),
            "type": 1
        }
        if self.task is not None:
            item["task"] = self.task.to_dict()
        if with_assigned:
            item["assigned"] = [x.user.to_dict() for x in self.assigned]
        if include_revisions:
            item["revisions"] = [x.to_dict() for x in self.revisions]
        return item


class Slide(db.Model):
    __tablename__ = "slides"
    id = db.Column(db.Text, primary_key=True)
    name = db.Column(db.Text)
    file = db.Column(db.Text)
    properties_json = db.Column(db.Text)

    @property
    def properties(self):
        return json.loads(self.properties_json)

    @properties.setter
    def properties(self, new_value):
        self.properties_json = json.dumps(new_value)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "file": self.file,
            "properties": self.properties
        }


class Annotation(db.Model):
    __tablename__ = "annotations"
    id = db.Column(db.Integer, primary_key=True)
    user_task_id = db.Column(db.Integer, db.ForeignKey("user_tasks.id"))
    slide_id = db.Column(db.Text, db.ForeignKey("slides.id"))
    label_id = db.Column(db.Integer, db.ForeignKey("label.id"))
    title = db.Column(db.Text)
    description = db.Column(db.Text)
    properties_json = db.Column(db.Text())
    created = db.Column(db.DateTime(timezone=True), server_default=func.now())
    updated = db.Column(db.DateTime(timezone=True), onupdate=func.now())
    data_json = db.Column(db.Text)
    label = db.relationship("Label")
    slide = db.relationship("Slide")

    @property
    def data(self):
        return json.loads(self.data_json)

    @data.setter
    def data(self, value):
        self.data_json = json.dumps(value)

    @property
    def properties(self):
        return json.loads(self.properties_json) if self.properties_json is not None else {}

    @properties.setter
    def properties(self, value):
        self.properties_json = json.dumps(value)

    def to_dict(self, feedback=None, with_feedback=False):
        annotation = {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "user_task_id": self.user_task_id,
            "slide_id": self.slide_id,
            "label": self.label.to_dict(),
            "geometry": self.data,
            "meta": {},
            "properties": self.properties
        }
        if with_feedback:
            annotation['feedback'] = feedback.to_dict() if feedback is not None else \
                {"label_id": self.label_id, "geometry": None, "feedback": None}
        return annotation


class AnnotationRevised(db.Model):
    __tablename__ = "annotations_revised"
    id = db.Column(db.Integer, primary_key=True)
    user_task_id = db.Column(db.Integer, db.ForeignKey("user_tasks.id", ondelete='CASCADE'))
    annotation_id = db.Column(db.Integer, db.ForeignKey("annotations.id", ondelete='CASCADE'))
    """
    The review of the user, which may be:
    0 - Correct
    1 - Wrong label, correct region
    2 - Wrong label, wrong region
    """
    feedback = db.Column(db.Integer)
    label_id = db.Column(db.Integer, db.ForeignKey("label.id"))
    data_json = db.Column(db.Text)
    created = db.Column(db.DateTime(timezone=True), server_default=func.now())
    updated = db.Column(db.DateTime(timezone=True), onupdate=func.now())

    @property
    def data(self):
        return json.loads(self.data_json)

    @data.setter
    def data(self, value):
        self.data_json = json.dumps(value)

    def to_dict(self):
        return {
            "id": self.id,
            "label_id": self.label_id,
            "feedback": self.feedback,
            "geometry": self.data
        }
