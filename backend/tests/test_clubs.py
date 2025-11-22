import json
from models import Club, UserClub
from extensions import db


class TestGetClubs:
	"""Tests for GET /api/clubs and /api/clubs/mine endpoints"""
	def test_get_clubs_public(self, client, app):
		# Create a club
		with app.app_context():
			club = Club(club_name='Test Club', slug='test-club')
			db.session.add(club)
			db.session.commit()

		# Anyone can get all clubs
		response = client.get('/api/clubs')
		assert response.status_code == 200
		data = response.get_json()
		assert isinstance(data, list)
		assert any(club['name'] == 'Test Club' for club in data)

	def test_get_my_clubs_authenticated(self, client, sample_user, app):
		# Create a club and add user as member
		with app.app_context():
			club = Club(club_name='My Club', slug='my-club')
			db.session.add(club)
			db.session.commit()
			db.session.add(UserClub(user_id=sample_user, club_id=club.club_id))
			db.session.commit()

		# Login to get token
		login_resp = client.post('/api/auth/login', json={
			'email': 'test@example.com',
			'password': 'password123'
		})
		token = login_resp.get_json()['token']

		# Get user's clubs
		response = client.get('/api/clubs/mine', headers={'Authorization': f'Bearer {token}'})
		assert response.status_code == 200
		data = response.get_json()
		assert isinstance(data, list)
		assert any(club['name'] == 'My Club' for club in data)

	def test_get_my_clubs_requires_auth(self, client):
		response = client.get('/api/clubs/mine')
		assert response.status_code in (401, 422)



class TestCreateClub:
	"""Tests for POST /api/clubs endpoint"""
	def test_create_club_requires_auth(self, client):
		response = client.post('/api/clubs', json={'name': 'NoAuth Club'})
		assert response.status_code in (401, 422)

	def test_create_club_success(self, client, sample_user, app):
		login_resp = client.post('/api/auth/login', json={
			'email': 'test@example.com',
			'password': 'password123'
		})
		token = login_resp.get_json()['token']

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
		login_resp = client.post('/api/auth/login', json={
			'email': 'test@example.com',
			'password': 'password123'
		})
		token = login_resp.get_json()['token']

		response = client.post('/api/clubs',
			json={'description': 'No name'},
			headers={'Authorization': f'Bearer {token}'}
		)
		assert response.status_code == 400
		data = response.get_json()
		assert 'error' in data


class TestClubDetails:
	"""Tests for GET /api/clubs/<slug> endpoint"""
	def test_get_club_by_slug(self, client, app):
		with app.app_context():
			club = Club(club_name='Slug Club', slug='slug-club')
			db.session.add(club)
			db.session.commit()
		response = client.get('/api/clubs/slug-club')
		assert response.status_code == 200
		data = response.get_json()
		assert data['name'] == 'Slug Club'
		assert data['slug'] == 'slug-club'

	def test_get_club_by_slug_not_found(self, client):
		response = client.get('/api/clubs/nonexistent')
		assert response.status_code == 404


class TestJoinClub:
	"""Tests for POST /api/clubs/<slug>/join endpoint"""
	def test_join_club_requires_auth(self, client, app):
		with app.app_context():
			club = Club(club_name='Join Club', slug='join-club')
			db.session.add(club)
			db.session.commit()
		response = client.post('/api/clubs/join-club/join')
		assert response.status_code in (401, 422)

	def test_join_club_success(self, client, sample_user, app):
		with app.app_context():
			club = Club(club_name='Join Club', slug='join-club')
			db.session.add(club)
			db.session.commit()
		login_resp = client.post('/api/auth/login', json={
			'email': 'test@example.com',
			'password': 'password123'
		})
		token = login_resp.get_json()['token']
		response = client.post('/api/clubs/join-club/join', headers={'Authorization': f'Bearer {token}'})
		assert response.status_code == 200
		data = response.get_json()
		assert data['message'] in ('Joined club', 'Already a member')
