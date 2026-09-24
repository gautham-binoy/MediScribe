#!/usr/bin/env bash
# ==============================================================================
# MediScribe AI - College Expo / Demo Startup Script (Linux & macOS)
# ==============================================================================

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo "=================================================================="
echo "🩺 MediScribe AI - AI Clinical Documentation & Hospital Copilot"
echo "=================================================================="
echo "Starting application in 100% Offline-Safe DEMO MODE..."
echo ""

# 1. Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: python3 is not installed or not in PATH."
    exit 1
fi

# 2. Check Node
if ! command -v node &> /dev/null; then
    echo "❌ Error: node is not installed or not in PATH."
    exit 1
fi

# 3. Setup Backend venv
cd "$BACKEND_DIR"
if [ ! -d ".venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv .venv
    .venv/bin/pip install --upgrade pip
    .venv/bin/pip install -r requirements.txt
fi

# 4. Seed database
echo "🌱 Initializing and seeding synthetic patient data..."
.venv/bin/python -m app.db.seed

# 5. Setup Frontend
cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

echo ""
echo "🚀 Starting MediScribe AI Services..."
echo "------------------------------------------------------------------"
echo "🌐 Frontend URL:      http://localhost:5173"
echo "🔌 Backend API:       http://localhost:8000"
echo "📚 Swagger API Docs:  http://localhost:8000/docs"
echo "------------------------------------------------------------------"
echo "🔑 Demo Credentials:"
echo "   Doctor:          doctor@demo.com  /  doctor123"
echo "   Hospital Admin:  admin@demo.com   /  admin123"
echo "   Sample Patient:  P1001 (Rahul Nair - Malayalam/Eng Fever Demo)"
echo "------------------------------------------------------------------"
echo "Press Ctrl+C to terminate both servers."
echo ""

# Run backend and frontend concurrently
cleanup() {
    echo ""
    echo "🛑 Shutting down MediScribe AI servers..."
    kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM

cd "$BACKEND_DIR"
.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

cd "$FRONTEND_DIR"
npm run dev -- --host 127.0.0.1 --port 5173 &
FRONTEND_PID=$!

wait
