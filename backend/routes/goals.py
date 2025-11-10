from flask import Blueprint, request, jsonify
from models import BookGoal, PageGoal, HourGoal, User
from extensions import db
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta

goals_bp = Blueprint('goals', __name__)

VALID_GOAL_TYPES = ['books read', 'pages read', 'hours read']
VALID_DURATIONS = ['this year', 'this month', 'this week', 'next year', 'next month', 'next week']

def calculate_duration_description(duration):
    """Generate a description based on the duration"""
    now = datetime.now()
    
    if duration == 'this year':
        return f"for {now.year}"
    elif duration == 'this month':
        return f"for {now.strftime('%B %Y')}"
    elif duration == 'this week':
        # Calculate week start and end
        start = now - timedelta(days=now.weekday())
        end = start + timedelta(days=6)
        return f"for week of {start.strftime('%b %d')} - {end.strftime('%b %d, %Y')}"
    elif duration == 'next year':
        return f"for {now.year + 1}"
    elif duration == 'next month':
        next_month = now.month + 1 if now.month < 12 else 1
        year = now.year if now.month < 12 else now.year + 1
        next_month_date = datetime(year, next_month, 1)
        return f"for {next_month_date.strftime('%B %Y')}"
    elif duration == 'next week':
        # Calculate next week start and end
        start = now - timedelta(days=now.weekday()) + timedelta(days=7)
        end = start + timedelta(days=6)
        return f"for week of {start.strftime('%b %d')} - {end.strftime('%b %d, %Y')}"
    
    return duration

@goals_bp.route('/goals', methods=['POST'])
@jwt_required()
def create_goal():
    """Create a new goal for the authenticated user"""
    user_id = get_jwt_identity()
    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        return jsonify({'error': 'Invalid token subject'}), 422
    
    # Verify user exists
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Get request data
    data = request.get_json(silent=True) or {}
    amount = data.get('amount')
    goal_type = data.get('type', '').lower()
    duration = data.get('duration', '').lower()
    
    # Validate required fields
    if not amount:
        return jsonify({'error': 'amount is required'}), 400
    
    if not goal_type:
        return jsonify({'error': 'type is required'}), 400
    
    if not duration:
        return jsonify({'error': 'duration is required'}), 400
    
    # Validate amount is a positive integer
    try:
        amount = int(amount)
        if amount <= 0:
            return jsonify({'error': 'amount must be a positive integer'}), 400
    except (TypeError, ValueError):
        return jsonify({'error': 'amount must be a valid integer'}), 400
    
    # Validate goal type
    if goal_type not in VALID_GOAL_TYPES:
        return jsonify({
            'error': f'Invalid goal type. Must be one of: {", ".join(VALID_GOAL_TYPES)}'
        }), 400
    
    # Validate duration
    if duration not in VALID_DURATIONS:
        return jsonify({
            'error': f'Invalid duration. Must be one of: {", ".join(VALID_DURATIONS)}'
        }), 400
    
    # Generate description based on type, amount, and duration
    duration_desc = calculate_duration_description(duration)
    description = f"Read {amount} {goal_type.replace(' read', '')} {duration_desc}"
    
    # Create the appropriate goal based on type
    try:
        if goal_type == 'books read':
            goal = BookGoal(
                user_id=user_id,
                num_books=amount,
                description=description
            )
        elif goal_type == 'pages read':
            goal = PageGoal(
                user_id=user_id,
                num_pages=amount,
                description=description
            )
        elif goal_type == 'hours read':
            goal = HourGoal(
                user_id=user_id,
                num_hours=amount,
                description=description
            )
        
        db.session.add(goal)
        db.session.commit()
        
        # Prepare response based on goal type
        goal_data = {
            'id': goal.goal_id,
            'user_id': goal.user_id,
            'description': goal.description,
            'type': goal_type,
            'duration': duration
        }
        
        # Add the specific amount field
        if goal_type == 'books read':
            goal_data['num_books'] = goal.num_books
        elif goal_type == 'pages read':
            goal_data['num_pages'] = goal.num_pages
        elif goal_type == 'hours read':
            goal_data['num_hours'] = goal.num_hours
        
        return jsonify({
            'message': 'Goal created successfully',
            'goal': goal_data
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create goal: {str(e)}'}), 500
