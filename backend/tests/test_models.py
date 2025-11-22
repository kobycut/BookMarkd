from models import User, UserClub, Club
from extensions import db

class TestUserModel:
    """Tests for User model"""
    
    def test_create_user(self, app):
        """Test creating a user"""
        with app.app_context():
            user = User(username='testuser', email='test@example.com')
            user.set_password('password123')
            
            assert user.username == 'testuser'
            assert user.email == 'test@example.com'
            assert user.password_hash is not None
            assert user.password_hash != 'password123'
    
    def test_password_hashing(self, app):
        """Test password is properly hashed"""
        with app.app_context():
            user = User(username='testuser', email='test@example.com')
            user.set_password('password123')
            
            assert user.check_password('password123') is True
            assert user.check_password('wrongpassword') is False
    
    def test_user_repr(self, app):
        """Test user string representation"""
        with app.app_context():
            user = User(username='testuser', email='test@example.com')
            assert 'testuser' in repr(user)

class TestUserClubModel:
    def test_create_user_club(self, app):
        """Test creating a UserClub association"""
        with app.app_context():
            user = User(username='userclubuser', email='userclub@example.com')
            user.set_password('password')
            club = Club(club_name='Test Club', slug='test-club')
            db.session.add(user)
            db.session.add(club)
            db.session.commit()

            user_club = UserClub(user_id=user.user_id, club_id=club.club_id)
            db.session.add(user_club)
            db.session.commit()

            assert user_club.user_id == user.user_id
            assert user_club.club_id == club.club_id
            assert str(user_club).startswith('<UserClub user=')