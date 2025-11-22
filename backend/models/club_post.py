from extensions import db
from datetime import datetime

class ClubPost(db.Model):
    __tablename__ = "club_post"

    id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey("club.club_id"), nullable=False)
    author_id = db.Column(db.Integer, db.ForeignKey("user.user_id"), nullable=False)
    body = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    club = db.relationship("Club", back_populates="posts")
    comments = db.relationship("ClubComment", back_populates="post", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ClubPost {self.id}>"