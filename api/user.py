from flask import Blueprint, session, jsonify, request, current_app
from flask_jwt_extended import jwt_required, create_access_token, current_user
import models
from app import db, jwt

user_api = Blueprint("user_api", __name__)


@user_api.route("new", methods=['POST'])
@jwt_required()
def new():
    if not current_user.is_admin:
        return jsonify({"msg": "Not an admin!"}), 401

    new_user = request.json
    # noinspection PyArgumentList
    user = models.User(
        name=new_user['name'],
        username=new_user['username'],
        password=new_user['password'],
        is_admin=new_user['is_admin']
    )
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_json())


@user_api.route("list")
@jwt_required()
def list():
    logged_user = current_user
    if not logged_user.is_admin:
        return jsonify({"msg": "Not an admin!"}), 401
    return jsonify([x.to_json() for x in models.User.query.all()])


@user_api.route("login", methods=["POST"])
def login():
    data = request.json
    user = models.User.query.filter_by(username=data['username']).first()
    if user is not None and user.verify_password(data['password']):
        # user exists and knows the password:
        token = create_access_token(user)
        return jsonify({
            "user": user.to_json(),
            "token": token
        })
    else:
        return jsonify({"msg": "Unsuccessful login"}), 401
