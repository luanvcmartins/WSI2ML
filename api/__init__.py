from flask import current_app, g
#from flask_pymongo import PyMongo
from pymongo import MongoClient
from werkzeug.local import LocalProxy


def get_db():
    _db = getattr(g, "_database", None)
    if _db is None:
        mongo_uri = current_app.config['MONGO_URI']
        client = MongoClient(mongo_uri, authSource='admin')
        db_name = mongo_uri.rsplit('/', 1)[-1]
        _db = g._database = client[db_name]

    return _db


# Use LocalProxy to read the global db instance with just `db`
db = LocalProxy(get_db)