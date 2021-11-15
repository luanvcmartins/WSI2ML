from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from config import app_config
from flask_migrate import Migrate
import os
import sys

db = SQLAlchemy()
jwt = JWTManager()
migrate = Migrate()


def create_app(context="development"):
    app = Flask(__name__,
                static_folder="./client/dist/static",
                template_folder="./client/dist")
    app.config.from_object(app_config[context])
    app.config.from_pyfile('config.py')

    print("Starting server in context:", context)
    from api.user import user_api
    from api.session import session_api
    from api.project import project_api
    from api.tasks import task_api
    CORS(app, supports_credentials=True)
    app.register_blueprint(user_api, url_prefix="/api/user")
    app.register_blueprint(session_api, url_prefix="/api/session")
    app.register_blueprint(project_api, url_prefix="/api/project")
    app.register_blueprint(task_api, url_prefix="/api/task")

    db.init_app(app)
    jwt.init_app(app)

    @app.route("/")
    def index():
        return render_template("index.html")

    migrate.init_app(app, db)

    import models

    @jwt.user_lookup_loader
    def load_user(_jwt_header, jwt_data):
        username = jwt_data["sub"]
        return models.User.query.filter_by(username=username).first()

    @jwt.user_identity_loader
    def gen_user_id(user):
        return user.username

    return app


if __name__ == '__main__':
    app = create_app("development" if len(sys.argv) == 1 else sys.argv[1])
    app.run(port=2000, host="0.0.0.0")
