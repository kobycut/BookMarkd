from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Club, UserClub
from extensions import db
import re

clubs_bp = Blueprint('clubs', __name__)

@clubs_bp.route('/clubs', methods=['GET'])
@jwt_required()
def get_clubs():
    """
    Return all clubs the authenticated user can join (i.e., clubs the user is not already a member of).
    """
    user_id = get_jwt_identity()
    # Get club ids the user already joined
    joined = UserClub.query.filter_by(user_id=user_id).all()
    joined_ids = {u.club_id for u in joined}

    if joined_ids:
        clubs = Club.query.filter(Club.club_id.notin_(joined_ids)).all()
    else:
        clubs = Club.query.all()

    result = []
    for c in clubs:
        result.append({
            "id": c.club_id,
            "name": c.club_name,
            "slug": c.slug,
            "description": c.description,
        })

    return jsonify(result), 200

@clubs_bp.route('/clubs', methods=['POST'])
@jwt_required()
def create_club():
    """
    Create a new club. The creating user becomes a member.

    Expected JSON body: { "name": "Club Name", "description": "optional" }
    """
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    name = (data.get('name') or data.get('club_name') or '').strip()
    description = data.get('description')

    if not name:
        return jsonify({'error': 'Club name is required'}), 400

    # generate a slug from name
    def _slugify(s: str) -> str:
        s = s.strip().lower()
        # replace non-alphanumeric with hyphens
        s = re.sub(r'[^a-z0-9]+', '-', s)
        s = s.strip('-')
        return s or 'club'

    base_slug = _slugify(name)
    slug = base_slug
    # ensure uniqueness by appending suffix if needed
    counter = 1
    while Club.query.filter_by(slug=slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    try:
        club = Club(club_name=name, slug=slug, description=description)
        db.session.add(club)
        db.session.flush()  # get club_id

        # add membership for creator
        membership = UserClub(user_id=int(user_id), club_id=club.club_id)
        db.session.add(membership)
        db.session.commit()

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create club'}), 500

    return jsonify({
        'id': club.club_id,
        'name': club.club_name,
        'slug': club.slug,
        'description': club.description
    }), 201

@clubs_bp.route('/clubs/<slug>', methods=['GET'])
def get_club(slug):
    return

@clubs_bp.route('/clubs/<slug>/join', methods=['POST'])
def join_club(slug):
    return


@clubs_bp.route('/clubs/<slug>/posts', methods=['POST'])
def create_post(slug):
    return

@clubs_bp.route('/clubs/<slug>/feed', methods=['GET'])
def club_feed(slug):
    return

@clubs_bp.route('/posts/<int:post_id>/comments', methods=['GET'])
def add_comment(post_id):
    return