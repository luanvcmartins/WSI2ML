import json
from app import db, jwt
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash


class User(UserMixin, db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80))
    username = db.Column(db.String(30), unique=True)
    password_hash = db.Column(db.String(128))
    is_admin = db.Column(db.Boolean)

    @property
    def password(self):
        # no reason to let people read the password field
        raise AttributeError('Password field is unavailable for access.')

    @password.setter
    def password(self, password):
        # when password gets set, we create a hash from the text
        self.password_hash = generate_password_hash(password)

    def verify_password(self, password):
        """
        Utility function for checking if the user's password and the provided password matches
        """
        return check_password_hash(self.password_hash, password)

    def to_json(self):
        return {
            "id": self.id,
            "name": self.name,
            "username": self.username,
            "is_admin": self.is_admin,
        }


class Project(db.Model):
    __tablename__ = "projects"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(60))
    description = db.Column(db.String(120))
    folder = db.Column(db.Text)
    labels = db.relationship("Label")

    def to_json(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "folder": self.folder,
            "labels": [x.to_json() for x in self.labels]
        }


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

    def to_json(self):
        return {
            "id": self.id,
            "name": self.name,
            "color": self.color
        }


task_slides = db.Table(
    'task_slides',
    db.Model.metadata,
    db.Column('id', db.Integer, primary_key=True),
    db.Column('task_id', db.ForeignKey('tasks.id')),
    db.Column('slide_id', db.ForeignKey('slides.id'))
)


class UserTask(db.Model):
    __tablename__ = 'user_tasks'
    id = db.Column(db.Text, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    completed = db.Column(db.Boolean)
    user = db.relationship("User", viewonly=True)
    task = db.relationship("Task", viewonly=True)

    def to_dict(self):
        return {
            "id": self.id,
            "user": self.user.to_json(),
            "task": self.task.to_dict(),
            "completed": self.completed
        }


class Task(db.Model):
    __tablename__ = "tasks"
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'))
    name = db.Column(db.String(60))
    project = db.relationship("Project")
    assigned = db.relationship("UserTask")
    slides = db.relationship("Slide", secondary=task_slides)

    def to_dict(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "slides": [x.to_dict() for x in self.slides],
            "name": self.name,
            "project": self.project.to_json(),
            "assigned": [x.user.to_json() for x in self.assigned]
        }


class Slide(db.Model):
    __tablename__ = "slides"
    id = db.Column(db.Text, primary_key=True)
    file = db.Column(db.Text)

    def to_dict(self):
        return {
            "id": self.id,
            "file": self.file
        }


class RegionsLabelled(db.Model):
    __tablename__ = "regions_labelled"
    id = db.Column(db.Integer, primary_key=True)
    user_task_id = db.Column(db.Integer, db.ForeignKey("user_tasks.id"))
    slide_id = db.Column(db.Text, db.ForeignKey("slides.id"))
    label_id = db.Column(db.Integer, db.ForeignKey("label.id"))
    data_json = db.Column(db.Text)
    label = db.relationship("Label")
    slide = db.relationship("Slide")

    @property
    def data(self):
        return json.loads(self.data_json)

    @data.setter
    def data(self, value):
        self.data_json = json.dumps(value)

    def to_dict(self):
        return {
            "id": self.id,
            "user_task_id": self.user_task_id,
            "slide_id": self.slide_id,
            "label": self.label.to_json(),
            "data": self.data
        }
