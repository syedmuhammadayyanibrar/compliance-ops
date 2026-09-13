@echo off
echo ========================================================
echo  Starting ComplianceOps Backend and Frontend
echo ========================================================

start "ComplianceOps Backend (FastAPI)" cmd /k ".venv\Scripts\uvicorn services.api.main:app --reload --port 8001"

timeout /t 3

cd apps\web
start "ComplianceOps Frontend (Next.js)" cmd /k "npm run dev"

echo.
echo ComplianceOps is starting!
echo Backend API: http://localhost:8001/docs
echo Frontend UI: http://localhost:3000
echo.
pause
