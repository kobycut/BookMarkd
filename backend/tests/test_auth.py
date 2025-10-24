import json
from models import User
from extensions import db

class TestRegister:
    """Tests for /auth/register endpoint"""
    
    def test_register_success(self, client):
        """Test successful user registration"""
        response = client.post('/api/auth/register', 
            json={
                'username': 'newuser',
                'email': 'new@example.com',
                'password': 'password123'
            }
        )
        
        assert response.status_code == 201
        data = response.get_json()
        assert data['message'] == 'User created successfully'
        assert data['user']['username'] == 'newuser'
        assert data['user']['email'] == 'new@example.com'
        assert 'token' in data
    
    def test_register_missing_fields(self, client):
        """Test registration with missing fields"""
        response = client.post('/api/auth/register', 
            json={'username': 'newuser'}
        )
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data
    
    def test_register_duplicate_email(self, client, sample_user):
        """Test registration with existing email"""
        response = client.post('/api/auth/register', 
            json={
                'username': 'anotheruser',
                'email': 'test@example.com',  # Same as sample_user
                'password': 'password123'
            }
        )
        
        assert response.status_code == 409
        data = response.get_json()
        assert 'already' in data['error'].lower()
    
    def test_register_duplicate_username(self, client, sample_user):
        """Test registration with existing username"""
        response = client.post('/api/auth/register', 
            json={
                'username': 'testuser',  # Same as sample_user
                'email': 'different@example.com',
                'password': 'password123'
            }
        )
        
        assert response.status_code == 409
        data = response.get_json()
        assert 'already' in data['error'].lower()
    
    def test_register_invalid_email(self, client):
        """Test registration with invalid email format"""
        response = client.post('/api/auth/register', 
            json={
                'username': 'newuser',
                'email': 'not-an-email',
                'password': 'password123'
            }
        )
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'email' in data['error'].lower()


class TestLogin:
    """Tests for /auth/login endpoint"""
    
    def test_login_success(self, client, sample_user):
        """Test successful login"""
        response = client.post('/api/auth/login', 
            json={
                'email': 'test@example.com',
                'password': 'password123'
            }
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['message'] == 'Login successful'
        assert data['user']['email'] == 'test@example.com'
        assert 'token' in data
    
    def test_login_wrong_password(self, client, sample_user):
        """Test login with wrong password"""
        response = client.post('/api/auth/login', 
            json={
                'email': 'test@example.com',
                'password': 'wrongpassword'
            }
        )
        
        assert response.status_code == 401
        data = response.get_json()
        assert 'invalid' in data['error'].lower()
    
    def test_login_nonexistent_user(self, client):
        """Test login with non-existent email"""
        response = client.post('/api/auth/login', 
            json={
                'email': 'doesnotexist@example.com',
                'password': 'password123'
            }
        )
        
        assert response.status_code == 401
        data = response.get_json()
        assert 'invalid' in data['error'].lower()
    
    def test_login_missing_fields(self, client):
        """Test login with missing fields"""
        response = client.post('/api/auth/login', 
            json={'email': 'test@example.com'}
        )
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'required' in data['error'].lower()


class TestGetCurrentUser:
    """Tests for /auth/me endpoint"""
    
    def test_get_me_success(self, client, sample_user, app):
        """Test getting current user info with valid token"""
        # First login to get token
        login_response = client.post('/api/auth/login', 
            json={
                'email': 'test@example.com',
                'password': 'password123'
            }
        )
        token = login_response.get_json()['token']
        
        # Now call /me with token
        response = client.get('/api/auth/me',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['user']['username'] == 'testuser'
        assert data['user']['email'] == 'test@example.com'
    
    def test_get_me_no_token(self, client):
        """Test /me without authorization token"""
        response = client.get('/api/auth/me')
        
        assert response.status_code == 401
    
    def test_get_me_invalid_token(self, client):
        """Test /me with invalid token"""
        response = client.get('/api/auth/me',
            headers={'Authorization': 'Bearer invalid-token-here'}
        )
        
        assert response.status_code == 422


class TestLogout:
    """Tests for /auth/logout endpoint"""
    
    def test_logout_success(self, client):
        """Test logout endpoint"""
        response = client.post('/api/auth/logout')
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'success' in data['message'].lower()