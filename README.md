# BookMarkd

BookMarkd is an all-in-one book enjoyer's website. This app is much like Letterboxd but for books. Rate books, share books with friends, receive book recommendations, join online book clubs, or set personal reading goals are some of BookMarkd's features.

## Wiki

Wiki for this project is maintained in the class wiki repo here: [Wiki Repo](https://github.com/cs428TAs/f2025/wiki/Incentive-Book-Club)

## Project Structure

```
BookMarkd/
├── backend/          # Flask REST API
├── frontend/         # React application
└── README.md         # This file
```

## Tech Stack

- **Frontend**: React
- **Backend**: Flask (Python)
- **Database**: MySQL/RDS

## Quick Start

### Using the Setup Script (Recommended)

```bash
./setup.sh
```

This script will automatically set up both the backend and frontend.

### Using Docker Compose (Easiest)

```bash
docker-compose up
```

This will start:

- MySQL database on port 3306
- Flask backend on port 5001
- React frontend on port 3000

### Manual Setup

#### Prerequisites

- Python 3.8+
- Node.js 14+
- MySQL

### Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Create a virtual environment and activate it:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Configure environment:

```bash
cp .env.example .env
# Edit .env with your database credentials
```

5. Initialize the database:

```bash
python -c "from app import app, db; app.app_context().push(); db.create_all()"
```

6. Start the backend server:

```bash
python app.py
```

The API will be running at `http://localhost:5001`

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment:

```bash
cp .env.example .env
# Edit .env if needed (default points to http://localhost:5001)
```

4. Start the development server:

```bash
npm start
```

The application will be running at `http://localhost:3000`

## API Endpoints

- `GET /api/health` - Health check endpoint
- `GET /api/books` - Get all books

## Database Configuration

The application uses MySQL. Update the `DATABASE_URL` in `backend/.env`:

```
DATABASE_URL=mysql://username:password@host:port/database
```

For AWS RDS, use the RDS endpoint:

```
DATABASE_URL=mysql://username:password@your-rds-endpoint.region.rds.amazonaws.com:3306/database
```

## Development

- Backend runs on port 5001
- Frontend runs on port 3000
- CORS is enabled for local development

## Project Features (Planned)

- 📚 Rate and review books
- 👥 Share books with friends
- 🤖 Receive personalized book recommendations
- 📖 Join online book clubs
- 🎯 Set and track reading goals
- 📊 View reading statistics

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details
