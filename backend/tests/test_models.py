from models import User
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