from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models.book import Book
from models.user_book import UserBook

books_bp = Blueprint("books", __name__)


def calculate_status(page_progress, total_pages):
    """
    Calculate book status based on page progress.
    
    Returns:
        - "wishlist" if page_progress is 0
        - "reading" if 0 < page_progress < total_pages
        - "read" if page_progress >= total_pages
    """
    if page_progress == 0:
        return "wishlist"
    
    if total_pages and page_progress >= total_pages:
        return "read"
    
    return "reading"


@books_bp.route("/books", methods=["POST"])
@jwt_required()
def create_book():
    """
    Create a new book for the authenticated user.
    
    Required params: title, author, page_progress
    Optional params: open_library_id, total_pages
    
    Returns: title, author, status, open_library_id, page_progress, total_pages
    """
    user_id = get_jwt_identity()
    data = request.get_json()
    
    # Validate required fields
    if not data:
        return jsonify({"error": "Request body is required"}), 400
    
    title = data.get("title")
    author = data.get("author")
    page_progress = data.get("page_progress")
    open_library_id = data.get("open_library_id")
    total_pages = data.get("total_pages")
    
    if not title:
        return jsonify({"error": "Title is required"}), 400
    if not author:
        return jsonify({"error": "Author is required"}), 400
    if page_progress is None:
        return jsonify({"error": "Page progress is required"}), 400
    
    # Validate types
    try:
        page_progress = int(page_progress)
        if page_progress < 0:
            return jsonify({"error": "Page progress must be non-negative"}), 400
    except (ValueError, TypeError):
        return jsonify({"error": "Page progress must be a valid number"}), 400
    
    if total_pages is not None:
        try:
            total_pages = int(total_pages)
            if total_pages < 0:
                return jsonify({"error": "Total pages must be non-negative"}), 400
        except (ValueError, TypeError):
            return jsonify({"error": "Total pages must be a valid number"}), 400
    
    # Check if book already exists by OpenLibrary ID (if provided)
    book = None
    if open_library_id:
        book = Book.query.filter_by(open_library_id=open_library_id).first()
    
    if not book:
        # Create new book
        book = Book(
            title=title,
            author=author,
            page_count=total_pages,
            open_library_id=open_library_id
        )
        db.session.add(book)
        db.session.flush()  # Get book_id without committing
    
    # Check if user already has this book
    existing_user_book = UserBook.query.filter_by(
        user_id=user_id,
        book_id=book.book_id
    ).first()
    
    if existing_user_book:
        return jsonify({"error": "Book already in your library"}), 400
    
    # Create UserBook relationship
    user_book = UserBook(
        user_id=user_id,
        book_id=book.book_id,
        page_progress=page_progress
    )
    db.session.add(user_book)
    db.session.commit()
    
    # Calculate status
    status = calculate_status(page_progress, total_pages)
    
    return jsonify({
        "id": book.book_id,
        "title": book.title,
        "author": book.author,
        "status": status,
        "open_library_id": book.open_library_id,
        "page_progress": user_book.page_progress,
        "total_pages": book.page_count
    }), 201


@books_bp.route("/books", methods=["GET"])
@jwt_required()
def get_books():
    """
    Get all books in the authenticated user's library.
    
    Returns: Array of books with title, author, status, open_library_id, page_progress, total_pages, rating
    """
    user_id = get_jwt_identity()
    
    # Get all user's books with their relationship data
    user_books = UserBook.query.filter_by(user_id=user_id).all()
    
    books_list = []
    for user_book in user_books:
        book = user_book.book
        status = calculate_status(user_book.page_progress, book.page_count)
        
        books_list.append({
            "id": book.book_id,
            "title": book.title,
            "author": book.author,
            "status": status,
            "open_library_id": book.open_library_id,
            "page_progress": user_book.page_progress,
            "total_pages": book.page_count,
            "rating": user_book.user_rating
        })
    
    return jsonify(books_list), 200


@books_bp.route("/books/<int:book_id>", methods=["DELETE"])
@jwt_required()
def delete_book(book_id):
    """
    Delete a book from the authenticated user's library.
    
    Params: book_id (in URL)
    Returns: Success message
    """
    user_id = get_jwt_identity()
    
    # Find the user's book relationship
    user_book = UserBook.query.filter_by(
        user_id=user_id,
        book_id=book_id
    ).first()
    
    if not user_book:
        return jsonify({"error": "Book not found in your library"}), 404
    
    # Delete the user-book relationship
    db.session.delete(user_book)
    db.session.commit()
    
    return jsonify({"message": "Book removed from library"}), 200


@books_bp.route("/books/<int:book_id>/progress", methods=["PUT"])
@jwt_required()
def update_book_progress(book_id):
    """
    Update the reading progress for a book.
    
    Params: book_id (in URL), page_progress (in body)
    Returns: All book details with updated status
    """
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "Request body is required"}), 400
    
    page_progress = data.get("page_progress")
    
    if page_progress is None:
        return jsonify({"error": "Page progress is required"}), 400
    
    # Validate type
    try:
        page_progress = int(page_progress)
        if page_progress < 0:
            return jsonify({"error": "Page progress must be non-negative"}), 400
    except (ValueError, TypeError):
        return jsonify({"error": "Page progress must be a valid number"}), 400
    
    # Find the user's book relationship
    user_book = UserBook.query.filter_by(
        user_id=user_id,
        book_id=book_id
    ).first()
    
    if not user_book:
        return jsonify({"error": "Book not found in your library"}), 404
    
    # Update progress
    user_book.page_progress = page_progress
    db.session.commit()
    
    # Get book details and calculate status
    book = user_book.book
    status = calculate_status(user_book.page_progress, book.page_count)
    
    return jsonify({
        "id": book.book_id,
        "title": book.title,
        "author": book.author,
        "status": status,
        "open_library_id": book.open_library_id,
        "page_progress": user_book.page_progress,
        "total_pages": book.page_count,
        "rating": user_book.user_rating
    }), 200


@books_bp.route("/books/<int:book_id>/rating", methods=["PUT"])
@jwt_required()
def update_book_rating(book_id):
    """
    Update the rating for a completed book.
    
    Params: book_id (in URL), rating (in body, 0-5)
    Returns: All book details with updated rating
    """
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "Request body is required"}), 400
    
    rating = data.get("rating")
    
    if rating is None:
        return jsonify({"error": "Rating is required"}), 400
    
    # Validate type and range
    try:
        rating = float(rating)
        if rating < 0 or rating > 5:
            return jsonify({"error": "Rating must be between 0 and 5"}), 400
    except (ValueError, TypeError):
        return jsonify({"error": "Rating must be a valid number"}), 400
    
    # Find the user's book relationship
    user_book = UserBook.query.filter_by(
        user_id=user_id,
        book_id=book_id
    ).first()
    
    if not user_book:
        return jsonify({"error": "Book not found in your library"}), 404
    
    # Get book details and check if book is completed
    book = user_book.book
    status = calculate_status(user_book.page_progress, book.page_count)
    
    if status != "read":
        return jsonify({"error": "Can only rate books with 'read' status"}), 400
    
    # Update rating
    user_book.user_rating = rating
    db.session.commit()
    
    return jsonify({
        "id": book.book_id,
        "title": book.title,
        "author": book.author,
        "status": status,
        "open_library_id": book.open_library_id,
        "page_progress": user_book.page_progress,
        "total_pages": book.page_count,
        "rating": user_book.user_rating
    }), 200
