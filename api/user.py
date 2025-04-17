import json

from bson import ObjectId
from flask import Blueprint, session, jsonify, request, current_app
from flask_jwt_extended import jwt_required, create_access_token, current_user
from werkzeug.security import check_password_hash, generate_password_hash

from api import db

user_api = Blueprint("user_api", __name__)


@user_api.route("new", methods=['POST'])
@jwt_required()
def new():
    if not current_user["manages_users"]:
        return jsonify({"msg": "Not an admin!"}), 401

    new_user = request.json
    db.users.insert_one({
        "name": new_user['name'],
        "email": new_user['email'],
        "enabled": True,
        "password": generate_password_hash(new_user['password']),
        "manages_apps": new_user['manages_apps'],
        "manages_users": new_user['manages_users'],
        "manages_tasks": new_user['manages_tasks'],
        "manages_projects": new_user['manages_projects'],
        "can_export": new_user['can_export'],
        "access_overview": new_user['access_overview']
    })
    return "", 200


@user_api.route("edit", methods=["POST"])
@jwt_required()
def edit():
    if not current_user["manages_users"]:
        return jsonify({"msg": "Not an admin!"}), 401

    new_user = request.json
    user_id = new_user['_id']
    del new_user['_id']
    if "password" in new_user:
        new_user['password'] = generate_password_hash(new_user['password'])
    db.users.update_one({"_id": ObjectId(user_id)}, {"$set": new_user})

    return "", 200


@user_api.route("list")
@jwt_required()
def _list():
    if not current_user["manages_users"]:
        return jsonify({"msg": "Not an admin!"}), 401

    return jsonify(list(db.users.find({}, {"password": False}).sort([("enabled", -1)])))


@user_api.route("switch_access", methods=["POST"])
@jwt_required()
def switch_access():
    if not current_user["manages_users"]:
        return jsonify({"msg": "Not an admin!"}), 401

    db.users.update_one(
        {"_id": ObjectId(request.json['_id'])},
        [{"$set": {"enabled": { "$not": "$enabled" }}}]
    )

    return jsonify({"success": True})


@user_api.route("change_password", methods=['POST'])
@jwt_required()
def change_password():
    data = request.json
    me = models.User.query.get(current_user.id)
    me.password = data['password']
    db.session.commit()
    return jsonify({"success": True})


@user_api.route("login", strict_slashes=False, methods=["POST"])
def login():
    content = request.json

    user = db['users'].find_one({"email": content["email"], "enabled": True})
    if user is not None and check_password_hash(user['password'], content['password']):
        del user['password']
        token = create_access_token(identity=user['email'])
        print("user", token)
        return json.dumps({
            "token": token,
            "user": user
        }, default=str)
    else:
        return jsonify({"success": False}), 401


@user_api.route("create_admin", methods=["POST"])
def create_admin():
    if db.users.count_documents({}) == 0:
        db.users.insert_one({
            "name": "Admin",
            "email": "admin",
            "password": generate_password_hash("admin"),
            "is_admin": True,
            "manages_apps": True,
            "manages_users": True,
            "manages_tasks": True,
            "manages_projects": True,
            "can_export": True
        })
        return jsonify({})
    return jsonify({"success": False}), 500
