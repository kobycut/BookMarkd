from extensions import db

class HourGoal(db.Model):
    __tablename__ = "hour_goal"

    goal_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.user_id"), nullable=False)
    description = db.Column(db.String(255))
    num_hours = db.Column(db.Integer)

    user = db.relationship("User", back_populates="hour_goals")

    def __repr__(self):
        return f"<HourGoal {self.description}>"
