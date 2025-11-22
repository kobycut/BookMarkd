from extensions import db
from datetime import datetime

class ClubPost(db.Model):
    __tablename__ = "club_post"

    id = db.Column(db.BigInteger, primary_key=True)
    club_id = db.Column(db.BigInteger, db.ForeignKey("clubs.id"), nullable=False)
    author_id = db.Column(db.BigInteger, db.ForeignKey("users.id"), nullable=False)
    body = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    club = db.relationship("Club", back_populates="posts")

    def __repr__(self):
        return f"<ClubPost {self.id}>"