# Secure Rhythm

Keystroke-dynamics authentication demo with:
- `frontend`: React + Vite + TypeScript
- `backend`: Node.js + Express + MongoDB (Mongoose)

## Project Structure

```text
secure-rhythm/
  backend/              # Express + MongoDB API
  src/                  # React frontend
```

## Prerequisites

- Node.js 18+
- MongoDB (local or remote)

## Backend Setup

1. Install backend dependencies:

```bash
cd backend
npm install
```

2. Create backend environment file:

```bash
copy .env.example .env
```

3. Update `.env` as needed. For local manual runs, the included values already point to the workspace-local model file:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/behavioural_biometrics
CLIENT_ORIGIN=http://localhost:8080
AUTH_CONFIDENCE_THRESHOLD=60
JWT_SECRET=dev-insecure-secret-change-in-production
JWT_EXPIRES_IN=7d
ML_MODEL_PATH=c:\Users\chand\OneDrive\Documents\OneDrive\Desktop\behavioural-biometrics\behavioural-biometrics\secure-rhythm\backend\data\keystroke-model.json
DSL_DATASET_PATH=c:\Users\chand\OneDrive\Documents\OneDrive\Desktop\behavioural-biometrics\behavioural-biometrics\secure-rhythm\backend\data\keystroke-model.json
```

4. Start backend from the project root:

```bash
npm run backend:dev
```

## Frontend Setup

1. Install frontend dependencies:

```bash
npm install
```

2. Start frontend from the project root:

```bash
npm run dev
```

## One-click startup

From the project root in PowerShell, run:

```powershell
./start-dev.ps1
```

This opens one terminal for the backend and one for the frontend.

Frontend runs on `http://localhost:8080`.
Backend runs on `http://localhost:5000`.
Vite proxy forwards `/api/*` to backend.

## API Endpoints

- `GET /api/health`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me` (auth required)
- `POST /api/auth/identify`
- `POST /api/auth/fallback`
- `GET /api/analytics/charts`
- `GET /api/analysis/dsl?top=15`
- `POST /api/analysis/dsl/reload` (auth required)
- `GET /api/users/profiles`
- `GET /api/sessions?limit=20&authStatus=authenticated` (auth required)
- `GET /api/sessions/summary` (auth required)

## Notes

- Default seeded demo users: Varsha, Nagendra, Chandra Shekar, Devi.
- Default fallback password for seeded users: `secure123`.
- Login/signup users are stored in MongoDB and receive JWT bearer tokens.
- Analysis page (`/analysis`) renders 10 DSL dataset visualizations from backend aggregates.
