from extensions import db

class Book(db.Model):
    __tablename__ = "book"

    book_id = db.Column(db.BigInteger, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    author = db.Column(db.String(120), nullable=False)
    page_count = db.Column(db.Integer)
    genre = db.Column(db.String(50))

    user_books = db.relationship("UserBook", back_populates="book", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Book {self.title}>"