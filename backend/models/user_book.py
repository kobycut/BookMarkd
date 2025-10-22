from extensions import db

class UserBook(db.Model):
    __tablename__ = "user_book"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.user_id"), nullable=False)
    book_id = db.Column(db.BigInteger, db.ForeignKey("book.book_id"), nullable=False)
    add_date = db.Column(db.Date)
    user_rating = db.Column(db.Float)

    user = db.relationship("User", back_populates="user_books")
    book = db.relationship("Book", back_populates="user_books")

    def __repr__(self):
        return f"<UserBook user={self.user_id}, book={self.book_id}>"
