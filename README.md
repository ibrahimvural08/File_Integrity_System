# File Integrity System

A secure file upload and integrity verification system using SHA-256 hashing. This project ensures every uploaded file stays completely safe and unchanged by automatically checking file integrity.## Contribution

## Contribution

This project was developed as a team project.  
I contributed to backend development, database integration and documentation improvements.



## Features

- **User Authentication**: Secure registration and login with JWT tokens
- **File Upload**: Upload files with automatic SHA-256 hash generation
- **Integrity Verification**: Verify file integrity on every download
- **Dashboard**: Overview of all files and integrity check history
- **Real-time Status**: Visual indicators for verified vs corrupted files

## Technology Stack

### Backend
- **Python** with **FastAPI** - High-performance API framework
- **PostgreSQL** - Reliable database storage
- **SQLAlchemy** - ORM for database operations
- **JWT** - Secure authentication tokens
- **SHA-256** - Cryptographic hashing for file integrity

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Zustand** - Lightweight state management
- **Lucide React** - Beautiful icons

## Project Structure

```
file-integrity-system/
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── auth.py       # Authentication endpoints
│   │   │   └── files.py      # File management endpoints
│   │   ├── config.py         # Application settings
│   │   ├── database.py       # Database connection
│   │   ├── file_utils.py     # File handling utilities
│   │   ├── main.py           # FastAPI application
│   │   ├── models.py         # SQLAlchemy models
│   │   ├── schemas.py        # Pydantic schemas
│   │   └── security.py       # Authentication utilities
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js pages
│   │   ├── components/       # React components
│   │   └── lib/              # Utilities and API
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 20+
- PostgreSQL 15+ (or use Docker)

### Option 1: Using Docker (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd file-integrity-system
```

2. Start all services:
```bash
docker-compose up -d
```

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Option 2: Manual Setup

#### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
pip install aiofiles
```

4. Configure environment:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

5. Start the server:
```bash
uvicorn app.main:app --reload
```

#### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get token
- `GET /api/auth/me` - Get current user info

### Files
- `POST /api/files/upload` - Upload a file
- `GET /api/files/` - List all user files
- `GET /api/files/{id}` - Get file details
- `GET /api/files/{id}/download` - Download file (with integrity check)
- `POST /api/files/{id}/verify` - Manually verify file integrity
- `GET /api/files/{id}/history` - Get integrity check history
- `DELETE /api/files/{id}` - Delete a file
- `GET /api/files/dashboard/stats` - Get dashboard statistics

## How Integrity Verification Works

1. **Upload**: When a file is uploaded, the system:
   - Saves the file to secure storage
   - Computes SHA-256 hash of the file content
   - Stores the hash in the database
   - Logs the upload as an integrity check

2. **Download**: When a file is downloaded, the system:
   - Recalculates SHA-256 hash of the stored file
   - Compares with the original hash
   - If hashes match: File is verified as authentic
   - If hashes differ: File is flagged as corrupted/tampered

3. **Manual Verification**: Users can manually verify any file's integrity at any time

## Security Features

- **Password Hashing**: bcrypt for secure password storage
- **JWT Authentication**: Secure, stateless authentication
- **Input Validation**: Pydantic schemas for all inputs
- **File Size Limits**: 10MB maximum file size
- **CORS Configuration**: Controlled cross-origin access
- **SHA-256 Hashing**: Cryptographic integrity verification

## Environment Variables

### Backend
| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | postgresql://postgres:postgres@localhost:5432/file_integrity_db |
| SECRET_KEY | JWT signing key | (change in production) |
| ALGORITHM | JWT algorithm | HS256 |
| ACCESS_TOKEN_EXPIRE_MINUTES | Token expiry | 30 |
| UPLOAD_DIR | File storage directory | uploads |
| MAX_FILE_SIZE | Max upload size in bytes | 10485760 |
| FRONTEND_URL | Frontend URL for CORS | http://localhost:3000 |

### Frontend
| Variable | Description | Default |
|----------|-------------|---------|
| NEXT_PUBLIC_API_URL | Backend API URL | http://localhost:8000 |

## License

MIT License
