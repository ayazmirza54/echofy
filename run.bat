@echo off
REM Echofy launcher. Creates a local venv on first run, then starts the app.
setlocal
cd /d "%~dp0"

REM faster-whisper needs Python 3.9-3.12 (no ctranslate2 wheels for 3.13+ yet).
REM Prefer the py launcher pinned to 3.12, fall back to 3.11, then plain python.
set "PY=py -3.12"
%PY% --version >nul 2>&1 || set "PY=py -3.11"
%PY% --version >nul 2>&1 || set "PY=python"

if not exist ".venv\Scripts\python.exe" (
    echo [setup] Creating virtual environment with: %PY%
    %PY% -m venv .venv || goto :err
    call ".venv\Scripts\activate.bat"
    echo [setup] Installing dependencies ^(first run only^)...
    python -m pip install --upgrade pip
    python -m pip install -r requirements.txt || goto :err
) else (
    call ".venv\Scripts\activate.bat"
)

python main.py
goto :eof

:err
echo.
echo [setup] Something went wrong during setup. See the messages above.
pause
