from extensions import db

class PageGoal(db.Model):
    __tablename__ = "page_goal"

    goal_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.user_id"), nullable=False)
    description = db.Column(db.String(255))
    num_pages = db.Column(db.Integer)

    user = db.relationship("User", back_populates="page_goals")

    def __repr__(self):
        return f"<PageGoal {self.description}>"
