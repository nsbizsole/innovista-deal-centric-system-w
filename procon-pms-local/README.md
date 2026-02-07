# ProCon PMS - Construction Project Management System

## Project Structure
```
procon-pms-local/
├── backend/           # FastAPI Backend
│   ├── server.py      # Main API server
│   ├── requirements.txt
│   └── .env           # Environment variables
└── frontend/          # React Frontend
    ├── src/           # Source code
    ├── package.json   # Dependencies
    └── .env           # Environment variables
```

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB (local or cloud)

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn server:app --reload --port 8001
```

### Frontend Setup
```bash
cd frontend
yarn install
yarn start
```

## Default Login Credentials
- **Email:** admin@pms.com
- **Password:** Admin@123

## Environment Variables

### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=procon_pms
CORS_ORIGINS=http://localhost:3000
JWT_SECRET=your_secret_key_here
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

## Features
- Role-based access control (Admin, PM, Agent, Supervisor, Client)
- Project lifecycle management
- Gantt chart visualization
- Document management with versioning
- Financial tracking
- Change order management
- Progress logging with photos
- Real-time messaging
- Reports & analytics

## API Documentation
Access Swagger docs at: http://localhost:8001/docs
