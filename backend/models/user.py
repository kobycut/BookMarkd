from backend.extensions import db
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    __tablename__ = "user"  # match ERD naming

    user_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

    # Relationships (so you can do user.book_goals, user.user_books, etc.)
    book_goals = db.relationship("BookGoal", back_populates="user", cascade="all, delete-orphan")
    page_goals = db.relationship("PageGoal", back_populates="user", cascade="all, delete-orphan")
    user_books = db.relationship("UserBook", back_populates="user", cascade="all, delete-orphan")
    user_clubs = db.relationship("UserClub", back_populates="user", cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password, method="pbkdf2:sha256")

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f"<User {self.username}>"
