import numpy as np
from bson import ObjectId
from flask import Flask, render_template, jsonify, request
from flask.json.provider import DefaultJSONProvider
from werkzeug.security import check_password_hash
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from config import Config
jwt = JWTManager()


def create_app():    
    app = Flask(__name__,
                static_folder="./client/dist/static",
                template_folder="./client/dist")

    app.config.from_object(Config())
    app.config.from_pyfile('config.py')
    from api import db


    class MongoJSONProvider(DefaultJSONProvider):
        def default(self, o):
            if isinstance(o, np.ndarray):
                return o.tolist()
            if isinstance(o, ObjectId):
                return str(o)
            return super().default(o)

    app.json = MongoJSONProvider(app)

    jwt.init_app(app)
    CORS(app, origins=["http://localhost:*", "https://imgsig.accamargo.org.br"], supports_credentials=True)
    #CORS(app)

    from api.user import user_api
    from api.session import session_api
    from api.project import project_api
    from api.tasks import task_api
    from api.export import export_api
    from api.model_import import import_api
    app.register_blueprint(user_api, url_prefix="/api/user")
    app.register_blueprint(session_api, url_prefix="/api/session")
    app.register_blueprint(project_api, url_prefix="/api/project")
    app.register_blueprint(task_api, url_prefix="/api/task")
    app.register_blueprint(export_api, url_prefix="/api/export")
    app.register_blueprint(import_api, url_prefix="/api/import")

    @app.route("/")
    def index():
        return render_template("index.html")


    @jwt.user_lookup_loader
    def load_user(_jwt_header, jwt_data):
        identification = jwt_data["sub"]
        return db.users.find_one({"email": identification})

    @app.after_request
    def add_security_headers(resp):
        resp.headers['Content-Security-Policy'] = 'default-src \'self\' fonts.gstatic.com cdn.jsdelivr.net; style-src * \'unsafe-inline\';'
        resp.headers['X-Frame-Options'] = 'SAMEORIGIN'
        resp.headers['X-Content-Type-Options'] = 'nosniff'
        resp.headers['Strict-Transport-Security'] = 'max-age=14400'

        return resp


    return app


if __name__ == '__main__':
    app = create_app()

    from waitress import serve
    serve(app, host="0.0.0.0", port=2005)
