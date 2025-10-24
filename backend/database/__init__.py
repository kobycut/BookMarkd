from extensions import db
from models import User, Book, Club, UserBook, UserClub, BookGoal, PageGoal
from .seed import seed_db

_INIT_GUARD_KEY = "_DB_INITIALIZED"

def init_db(app, seed: bool = True):
    """
    Create all tables and optionally seed.
    Safe to call multiple times (protected from dev reloader).
    """
    with app.app_context():
        if app.config.get(_INIT_GUARD_KEY):
            return

        print("Creating in-memory database tables...")
        db.create_all()

        if seed:
            seed_db()

        app.config[_INIT_GUARD_KEY] = True
        print("✓ Database initialized successfully.")
