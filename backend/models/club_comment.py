from extensions import db
from datetime import datetime

class ClubComment(db.Model):
    __tablename__ = "club_comment"

    id = db.Column(db.BigInteger, primary_key=True)
    post_id = db.Column(db.BigInteger, db.ForeignKey("club_posts.id"), nullable=False)
    author_id = db.Column(db.BigInteger, db.ForeignKey("users.id"), nullable=False)
    body = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    post = db.relationship("ClubPost", back_populates="comments")

    def __repr__(self):
        return f"<ClubPost {self.id}>"