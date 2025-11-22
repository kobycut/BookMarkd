import json
from models import Club, UserClub
from extensions import db

class TestGetClubs:
	"""Tests for GET /clubs endpoint"""
	def test_get_clubs_requires_auth(self, client):
		response = client.get('/api/clubs')
		assert response.status_code in (401, 422)  # 401 if no token, 422 if bad token

	def test_get_clubs_success(self, client, sample_user, app):
		# Create a club
		with app.app_context():
			club = Club(club_name='Test Club', slug='test-club')
			db.session.add(club)
			db.session.commit()

		# Login to get token
		login_resp = client.post('/api/auth/login', json={
			'email': 'test@example.com',
			'password': 'password123'
		})
		token = login_resp.get_json()['token']

		# Get clubs
		response = client.get('/api/clubs', headers={'Authorization': f'Bearer {token}'})
		assert response.status_code == 200
		data = response.get_json()
		assert isinstance(data, list)
		assert any(club['name'] == 'Test Club' for club in data)


class TestCreateClub:
	"""Tests for POST /clubs endpoint"""
	def test_create_club_requires_auth(self, client):
		response = client.post('/api/clubs', json={'name': 'NoAuth Club'})
		assert response.status_code in (401, 422)

	def test_create_club_success(self, client, sample_user, app):
		# Login to get token
		login_resp = client.post('/api/auth/login', json={
			'email': 'test@example.com',
			'password': 'password123'
		})
		token = login_resp.get_json()['token']

		# Create club
		response = client.post('/api/clubs',
			json={'name': 'My Club', 'description': 'A test club.'},
			headers={'Authorization': f'Bearer {token}'}
		)
		assert response.status_code == 201
		data = response.get_json()
		assert data['name'] == 'My Club'
		assert data['description'] == 'A test club.'
		assert 'slug' in data

	def test_create_club_missing_name(self, client, sample_user, app):
		# Login to get token
		login_resp = client.post('/api/auth/login', json={
			'email': 'test@example.com',
			'password': 'password123'
		})
		token = login_resp.get_json()['token']

		# Try to create club with no name
		response = client.post('/api/clubs',
			json={'description': 'No name'},
			headers={'Authorization': f'Bearer {token}'}
		)
		assert response.status_code == 400
		data = response.get_json()
		assert 'error' in data
