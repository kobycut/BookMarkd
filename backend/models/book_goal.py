from extensions import db

class BookGoal(db.Model):
    __tablename__ = "book_goal"

    goal_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.user_id"), nullable=False)
    description = db.Column(db.String(255))
    num_books = db.Column(db.Integer)

    user = db.relationship("User", back_populates="book_goals")

    def __repr__(self):
        return f"<BookGoal {self.description}>"
