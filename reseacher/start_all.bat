@echo off
echo Starting TrialBridge Backend (FastAPI on http://127.0.0.1:8000)...
start "TrialBridge Backend" cmd /k "cd /d %~dp0backend && call .venv\Scripts\activate.bat && python run.py"

echo Starting TrialBridge Frontend (Vite on http://localhost:5173)...
start "TrialBridge Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo Both services launched in separate windows!
