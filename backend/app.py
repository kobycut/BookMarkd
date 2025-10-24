import os
from flask import Flask, jsonify
from flask_cors import CORS
from backend.config import config
from backend.extensions import db, jwt
from database import init_db

def create_app(config_name=None):
    """Application factory that configures extensions and routes."""
    app = Flask(__name__)

    env_config = config_name or os.environ.get('FLASK_CONFIG', 'default')
    app_config = config.get(env_config)
    if not app_config:
        raise ValueError(f"Unknown configuration '{env_config}'")
    app.config.from_object(app_config)

    # Allow DATABASE_URL override even if config already sets a default.
    database_uri = os.environ.get('DATABASE_URL')
    if database_uri:
        app.config['SQLALCHEMY_DATABASE_URI'] = database_uri

    # Configure JWT secret; fall back to SECRET_KEY if none provided.
    app.config.setdefault('JWT_SECRET_KEY', os.environ.get('JWT_SECRET_KEY') or app.config.get('SECRET_KEY'))

    CORS(app)
    db.init_app(app)
    jwt.init_app(app)

    # Register Blueprints
    from backend.routes.auth import auth_bp
    from backend.routes.health import health_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(health_bp, url_prefix='/api')
    
    
    # Initialize the Ephemeral DB (create tables + seed)
    init_db(app, seed=True)

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5001)

