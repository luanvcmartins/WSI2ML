import os


class Config(object):
    """
    Shared configurations
    """
    SECRET_KEY = '<^>YOUR_SECRET_KEY^>'
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "generic_text")
    JWT_ACCESS_TOKEN_EXPIRES = 60 * 60 * 24

    def __init__(self):
        self.DATABASE = os.environ.get("DATABASE")
        self.MONGO_ADDRESS = os.environ.get("MONGO_ADDRESS", "localhost")
        self.MONGO_USERNAME = os.environ.get("MONGO_USERNAME", None)
        self.MONGO_PASSWORD = os.environ.get("MONGO_PASSWORD", None)


    @property
    def MONGO_URI(self):
        if self.MONGO_USERNAME is not None:
            return f"mongodb://{self.MONGO_USERNAME}:{self.MONGO_PASSWORD}@{self.MONGO_ADDRESS}:27017/{self.DATABASE}"
        return f"mongodb://{self.MONGO_ADDRESS}:27017/{self.DATABASE}"
