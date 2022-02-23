import os


class Config(object):
    """
    Shared configurations
    """
    SECRET_KEY = '<^>YOUR_SECRET_KEY^>'
    JWT_SECRET_KEY = "generic_text"
    SQLALCHEMY_DATABASE_URI = 'sqlite:///temp.db'
    JWT_ACCESS_TOKEN_EXPIRES = 60 * 60 * 24
    SQLALCHEMY_TRACK_MODIFICATIONS = True


class DevelopmentConfig(Config):
    """
    Development configurations
    """

    DEBUG = True
    SQLALCHEMY_ECHO = True


class ProductionConfig(Config):
    """
    Production configurations
    """

    DEBUG = False


class DockerProductionConfig(Config):
    """
    Docker configuration
    """
    DEBUG = False
    SQLALCHEMY_ECHO = False
    # SQLALCHEMY_DATABASE_URI = 'sqlite:///db/temp.db'
    SQLALCHEMY_DATABASE_URI = f"postgresql://{os.environ.get('POSTGRES_USER')}:{os.environ.get('POSTGRES_PASSWORD')}@wsi_db:5432/{os.environ.get('POSTGRES_NAME')}"


app_config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'docker': DockerProductionConfig
}
