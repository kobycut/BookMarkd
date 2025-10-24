from flask import Blueprint, request, jsonify
from models import User
from extensions import db
import re
from sqlalchemy import or_
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

auth_bp = Blueprint('auth', __name__)

def validate_email(email):
    """Basic email validation"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json(silent=True) or {}
    username = (data.get('username') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({'error': 'username, email, and password are required'}), 400
    if not validate_email(email):
        return jsonify({'error': 'email is not valid'}), 400
    
    existing = User.query.filter(
        or_(User.username == username, User.email == email)
    ).first()
    if existing:
        return jsonify({'error': 'username or email already exists'}), 409
    
    try:
        user = User(username=username, email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create user'}), 500
    
    # Store JWT subject as string to satisfy PyJWT's strict subject validation.
    token = create_access_token(identity=str(user.user_id))
    
    return jsonify({
        'message': 'User created successfully',
        'user': {
            'id': user.user_id,
            'username': user.username,
            'email': user.email
        },
        'token': token
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
    
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid email or password'}), 401
    
    token = create_access_token(identity=str(user.user_id))

    return jsonify({
        'message': 'Login successful',
        'user': {
            'id': user.user_id,
            'username': user.username,
            'email': user.email
        },
        'token': token
    }), 200


@auth_bp.route('/logout', methods=['POST'])
def logout():
    # For JWT, logout is handled client-side by deleting the token
    return jsonify({'message': 'Logged out successfully'}), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    # Get user ID from the JWT token
    user_id = get_jwt_identity()
    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        return jsonify({'error': 'Invalid token subject'}), 422
    
    user = db.session.get(User, user_id)
    
    # Handle case where user was deleted but token still valid
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'user': {
            'id': user.user_id,
            'username': user.username,
            'email': user.email,
        }
    }), 200
