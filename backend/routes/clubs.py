from flask import Blueprint, request, jsonify
from models import Club, UserClub, ClubPost, ClubComment
from extensions import db

bp = Blueprint('clubs', __name__)

@bp.get("/clubs")
def get_clubs():
    return

@bp.post("/clubs")
def create_club():
    return

@bp.get("/clubs/<slug>")
def get_club(slug):
    return

@bp.post("/clubs/<slug>/join")
def join_club(slug):
    return


@bp.post("/clubs/<slug>/posts")
def create_post(slug):
    return

@bp.get("/clubs/<slug>/feed")
def club_feed(slug):
    return

@bp.post("/posts/<int:post_id>/comments")
def add_comment(post_id):
    return