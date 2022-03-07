import datetime

from flask import Blueprint, session, jsonify, request, current_app
from flask_jwt_extended import jwt_required, create_access_token, current_user
import models
from app import db, jwt

apps_api = Blueprint("apps_api", __name__)


@apps_api.route("new", methods=['POST'])
@jwt_required()
def new():
    if not current_user.manages_apps:
        return jsonify({"msg": "Can't manage apps"}), 401

    app = request.json
    new_app = models.App(
        name=app['name'],
        description=app['description'],
        owner_id=current_user.id
    )
    db.session.add(new_app)
    db.session.commit()
    return jsonify({
        "success": True
    })


@apps_api.route("list")
@jwt_required()
def list_apps():
    if not current_user.manages_apps:
        return jsonify({"msg": "Can't manage apps"}), 401

    apps = models.App.query.filter_by(owner_id=current_user.id).all()
    return jsonify([
        app.to_dict() for app in apps
    ])


@apps_api.route("token", methods=['POST'])
@jwt_required()
def token():
    if not current_user.manages_apps:
        return jsonify({"msg": "Can't manage apps"}), 401
    app_data = request.json
    app = models.App.query.get(app_data['id'])
    if app is not None and app.owner_id == current_user.id:
        expiration = datetime.timedelta(days=1)
        return jsonify({
            "token": create_access_token(app, expires_delta=expiration)
        })
    else:
        return jsonify({"msg": "Can't access this app"}), 401
