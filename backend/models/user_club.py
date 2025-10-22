from extensions import db

class UserClub(db.Model):
    __tablename__ = "user_club"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.user_id"), nullable=False)
    club_id = db.Column(db.Integer, db.ForeignKey("club.club_id"), nullable=False)

    user = db.relationship("User", back_populates="user_clubs")
    club = db.relationship("Club", back_populates="user_clubs")

    def __repr__(self):
        return f"<UserClub user={self.user_id}, club={self.club_id}>"
