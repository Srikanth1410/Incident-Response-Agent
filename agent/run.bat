@echo off
REM PayRecall Agent — Quick Launch Script
REM Runs all three demo scenarios (TXN-1001, TXN-1002, TXN-1003)

cd /d "%~dp0"

IF NOT EXIST ".venv\Scripts\python.exe" (
    echo [ERROR] Virtual environment not found. Run setup first:
    echo   python -m venv .venv
    echo   .venv\Scripts\activate
    echo   pip install -r requirements.txt
    exit /b 1
)

IF NOT EXIST ".env" (
    echo [ERROR] .env file not found. Copy .env.example and fill in your API key:
    echo   copy .env.example .env
    exit /b 1
)

echo PayRecall Agent starting...
.venv\Scripts\python.exe main.py %*
