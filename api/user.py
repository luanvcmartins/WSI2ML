from flask import Blueprint, session, jsonify, request, current_app
from flask_jwt_extended import jwt_required, create_access_token, current_user
import models
from app import db, jwt

user_api = Blueprint("user_api", __name__)


@user_api.route("new", methods=['POST'])
@jwt_required()
def new():
    if not current_user.manages_users:
        return jsonify({"msg": "Not an admin!"}), 401

    new_user = request.json
    # noinspection PyArgumentList
    user = models.User(
        name=new_user['name'],
        username=new_user['username'],
        password=new_user['password'],
        is_admin=new_user['is_admin'],

        manages_apps=new_user['manages_apps'],
        manages_users=new_user['manages_users'],
        manages_tasks=new_user['manages_tasks'],
        manages_projects=new_user['manages_projects'],
        can_export=new_user['can_export']
    )
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_json())


@user_api.route("edit", methods=["POST"])
@jwt_required()
def edit():
    if not current_user.manages_users:
        return jsonify({"msg": "Not an admin!"}), 401

    new_user = request.json
    user = db.session.query(models.User).get(new_user["id"])
    user.update(new_user)
    db.session.commit()
    return jsonify(user.to_json())


@user_api.route("list")
@jwt_required()
def list():
    logged_user = current_user
    if not logged_user.manages_users:
        return jsonify({"msg": "Not an admin!"}), 401
    return jsonify([x.to_json() for x in models.User.query.all()])


@user_api.route("remove")
@jwt_required()
def remove():
    logged_user = current_user
    if not logged_user.manages_users:
        return jsonify({"msg": "Not an admin!"}), 401
    user_id = request.args['user_id']
    models.User.query.filter(models.User.id == user_id).delete()
    db.session.execute("DELETE FROM user_tasks WHERE user_id = :user_id", {"user_id": user_id})
    db.session.commit()
    return jsonify({"success": True})


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
