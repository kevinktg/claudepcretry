@echo off
echo Starting Agent.exe setup...

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo Error installing dependencies
        pause
        exit /b 1
    )
)

echo Starting Agent.exe...
call npm start
if errorlevel 1 (
    echo Error starting Agent.exe
    pause
    exit /b 1
)

pause
