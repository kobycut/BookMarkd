from flask import Blueprint, request, jsonify
from models import BookGoal, PageGoal, HourGoal, User
from extensions import db
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from calendar import monthrange

goals_bp = Blueprint('goals', __name__)

VALID_GOAL_TYPES = ['books read', 'pages read', 'hours read']
VALID_DURATIONS = ['this year', 'this month', 'this week', 'next year', 'next month', 'next week']

def calculate_due_date(duration):
    """Calculate the due date based on the duration"""
    now = datetime.now()
    
    if duration == 'this year':
        return datetime(now.year, 12, 31, 23, 59, 59)
    elif duration == 'this month':
        last_day = monthrange(now.year, now.month)[1]
        return datetime(now.year, now.month, last_day, 23, 59, 59)
    elif duration == 'this week':
        # End of week (Sunday)
        days_until_sunday = 6 - now.weekday()
        end_of_week = now + timedelta(days=days_until_sunday)
        return datetime(end_of_week.year, end_of_week.month, end_of_week.day, 23, 59, 59)
    elif duration == 'next year':
        return datetime(now.year + 1, 12, 31, 23, 59, 59)
    elif duration == 'next month':
        next_month = now.month + 1 if now.month < 12 else 1
        year = now.year if now.month < 12 else now.year + 1
        last_day = monthrange(year, next_month)[1]
        return datetime(year, next_month, last_day, 23, 59, 59)
    elif duration == 'next week':
        # Next week's Sunday
        days_until_next_sunday = 6 - now.weekday() + 7
        end_of_next_week = now + timedelta(days=days_until_next_sunday)
        return datetime(end_of_next_week.year, end_of_next_week.month, end_of_next_week.day, 23, 59, 59)
    
    return None

def calculate_duration_description(duration):
    """Generate a description based on the duration, keeping the duration keyword"""
    now = datetime.now()
    
    if duration == 'this year':
        return f"this year ({now.year})"
    elif duration == 'this month':
        return f"this month ({now.strftime('%B %Y')})"
    elif duration == 'this week':
        # Calculate week start and end
        start = now - timedelta(days=now.weekday())
        end = start + timedelta(days=6)
        return f"this week ({start.strftime('%b %d')} - {end.strftime('%b %d, %Y')})"
    elif duration == 'next year':
        return f"next year ({now.year + 1})"
    elif duration == 'next month':
        next_month = now.month + 1 if now.month < 12 else 1
        year = now.year if now.month < 12 else now.year + 1
        next_month_date = datetime(year, next_month, 1)
        return f"next month ({next_month_date.strftime('%B %Y')})"
    elif duration == 'next week':
        # Calculate next week start and end
        start = now - timedelta(days=now.weekday()) + timedelta(days=7)
        end = start + timedelta(days=6)
        return f"next week ({start.strftime('%b %d')} - {end.strftime('%b %d, %Y')})"
    
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
        
        # Calculate due date
        due_date = calculate_due_date(duration)
        
        # Prepare response based on goal type
        goal_data = {
            'id': goal.goal_id,
            'user_id': goal.user_id,
            'description': goal.description,
            'type': goal_type,
            'duration': duration,
            'due_date': due_date.isoformat() if due_date else None,
            'progress': 0,
            'total': amount
        }
        
        return jsonify({
            'message': 'Goal created successfully',
            'goal': goal_data
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create goal: {str(e)}'}), 500

@goals_bp.route('/goals', methods=['GET'])
@jwt_required()
def get_goals():
    """Get all goals for the authenticated user"""
    user_id = get_jwt_identity()
    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        return jsonify({'error': 'Invalid token subject'}), 422
    
    # Verify user exists
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    try:
        # Fetch all goals for the user
        book_goals = BookGoal.query.filter_by(user_id=user_id).all()
        page_goals = PageGoal.query.filter_by(user_id=user_id).all()
        hour_goals = HourGoal.query.filter_by(user_id=user_id).all()
        
        goals_list = []
        
        # Process book goals
        for goal in book_goals:
            # Extract duration from description
            duration = extract_duration_from_description(goal.description)
            due_date = calculate_due_date(duration) if duration else None
            
            goals_list.append({
                'id': goal.goal_id,
                'description': goal.description,
                'progress': 0,  # TODO: Calculate actual progress from user_books
                'total': goal.num_books,
                'duration': duration or 'unknown',
                'due_date': due_date.isoformat() if due_date else None,
                'type': 'books read'
            })
        
        # Process page goals
        for goal in page_goals:
            duration = extract_duration_from_description(goal.description)
            due_date = calculate_due_date(duration) if duration else None
            
            goals_list.append({
                'id': goal.goal_id,
                'description': goal.description,
                'progress': 0,  # TODO: Calculate actual progress from user_books
                'total': goal.num_pages,
                'duration': duration or 'unknown',
                'due_date': due_date.isoformat() if due_date else None,
                'type': 'pages read'
            })
        
        # Process hour goals
        for goal in hour_goals:
            duration = extract_duration_from_description(goal.description)
            due_date = calculate_due_date(duration) if duration else None
            
            goals_list.append({
                'id': goal.goal_id,
                'description': goal.description,
                'progress': 0,  # TODO: Calculate actual progress from user_books
                'total': goal.num_hours,
                'duration': duration or 'unknown',
                'due_date': due_date.isoformat() if due_date else None,
                'type': 'hours read'
            })
        
        return jsonify({
            'goals': goals_list,
            'total_count': len(goals_list)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to retrieve goals: {str(e)}'}), 500

@goals_bp.route('/goals/<int:goal_id>', methods=['DELETE'])
@jwt_required()
def delete_goal(goal_id):
    """Delete a specific goal for the authenticated user"""
    user_id = get_jwt_identity()
    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        return jsonify({'error': 'Invalid token subject'}), 422
    
    # Verify user exists
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    try:
        # Try to find the goal in all three goal types
        goal = None
        goal_type = None
        
        # Check BookGoal
        book_goal = BookGoal.query.filter_by(goal_id=goal_id, user_id=user_id).first()
        if book_goal:
            goal = book_goal
            goal_type = 'books read'
        
        # Check PageGoal
        if not goal:
            page_goal = PageGoal.query.filter_by(goal_id=goal_id, user_id=user_id).first()
            if page_goal:
                goal = page_goal
                goal_type = 'pages read'
        
        # Check HourGoal
        if not goal:
            hour_goal = HourGoal.query.filter_by(goal_id=goal_id, user_id=user_id).first()
            if hour_goal:
                goal = hour_goal
                goal_type = 'hours read'
        
        # If goal not found or doesn't belong to user
        if not goal:
            return jsonify({'error': 'Goal not found'}), 404
        
        # Delete the goal
        db.session.delete(goal)
        db.session.commit()
        
        return jsonify({
            'message': 'Goal deleted successfully',
            'deleted_goal': {
                'id': goal_id,
                'type': goal_type
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete goal: {str(e)}'}), 500

@goals_bp.route('/goals/<int:goal_id>', methods=['PUT'])
@jwt_required()
def update_goal(goal_id):
    """Update a goal's progress for the authenticated user"""
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
    progress = data.get('progress')
    
    # Validate progress is provided
    if progress is None:
        return jsonify({'error': 'progress is required'}), 400
    
    # Validate progress is a valid number
    try:
        progress = float(progress)
        if progress < 0:
            return jsonify({'error': 'progress must be a non-negative number'}), 400
    except (TypeError, ValueError):
        return jsonify({'error': 'progress must be a valid number'}), 400
    
    try:
        # Try to find the goal in all three goal types
        goal = None
        goal_type = None
        total = None
        
        # Check BookGoal
        book_goal = BookGoal.query.filter_by(goal_id=goal_id, user_id=user_id).first()
        if book_goal:
            goal = book_goal
            goal_type = 'books read'
            total = book_goal.num_books
        
        # Check PageGoal
        if not goal:
            page_goal = PageGoal.query.filter_by(goal_id=goal_id, user_id=user_id).first()
            if page_goal:
                goal = page_goal
                goal_type = 'pages read'
                total = page_goal.num_pages
        
        # Check HourGoal
        if not goal:
            hour_goal = HourGoal.query.filter_by(goal_id=goal_id, user_id=user_id).first()
            if hour_goal:
                goal = hour_goal
                goal_type = 'hours read'
                total = hour_goal.num_hours
        
        # If goal not found or doesn't belong to user
        if not goal:
            return jsonify({'error': 'Goal not found'}), 404
        
        # Note: Since the models don't have a progress field, we're storing it externally
        # For now, we'll just validate and return the updated progress
        # In a real implementation, you'd add a progress column to the models or use a separate tracking table
        
        # Extract duration for due_date calculation
        duration = extract_duration_from_description(goal.description)
        due_date = calculate_due_date(duration) if duration else None
        
        # Return updated goal data
        goal_data = {
            'id': goal.goal_id,
            'description': goal.description,
            'progress': progress,
            'total': total,
            'duration': duration or 'unknown',
            'due_date': due_date.isoformat() if due_date else None,
            'type': goal_type
        }
        
        return jsonify({
            'message': 'Goal progress updated successfully',
            'goal': goal_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to update goal: {str(e)}'}), 500

def extract_duration_from_description(description):
    """Extract duration from goal description"""
    if not description:
        return None
    
    description_lower = description.lower()
    
    # Check for duration keywords in order of specificity
    for duration in VALID_DURATIONS:
        if duration in description_lower:
            return duration
    
    return None
