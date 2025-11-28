@echo off
echo ========================================
echo     Multiplayer Keno Game Launcher
echo ========================================
echo.

:: Check if Node.js is installed
echo [1/4] Checking for Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js is not installed or not in PATH
    echo.
    echo ========================================
    echo           Node.js Required
    echo ========================================
    echo.
    echo Please install Node.js to continue:
    echo.
    echo 1. Download Node.js from: https://nodejs.org/
    echo    - Recommended: LTS version (14.x or higher)
    echo.
    echo 2. Install Node.js (includes npm)
    echo.
    echo 3. Restart your computer after installation
    echo.
    echo 4. Run this start.bat file again
    echo.
    echo Alternative: If Node.js is installed but not in PATH,
    echo add the Node.js installation directory to your PATH
    echo environment variable.
    echo.
    pause
    exit /b 1
)

:: Display Node.js version
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo Found Node.js version: %NODE_VERSION%
echo.

:: Check if npm is available
echo [2/4] Checking npm availability...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not available
    echo Please ensure Node.js was installed correctly
    pause
    exit /b 1
)

:: Display npm version
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo Found npm version: %NPM_VERSION%
echo.

:: Check if package.json exists
if not exist "package.json" (
    echo ERROR: package.json not found in current directory
    echo Please ensure you're in the project root directory
    pause
    exit /b 1
)

:: Install/Update dependencies
echo [3/4] Installing/updating project dependencies...
echo This may take a few moments on first run...
echo.

npm install
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to install dependencies
    echo Please check your internet connection and try again
    pause
    exit /b 1
)

echo.
echo Dependencies installed successfully!
echo.

:: Start the server
echo [4/4] Starting the Multiplayer Keno server...
echo.
echo ========================================
echo      Server Starting - Good Luck!
echo ========================================
echo.
echo Server will be available at: http://localhost:3000
echo Press Ctrl+C to stop the server
echo.
echo Initializing game server...
echo.

:: Start the server using npm start (as defined in package.json)
npm start

:: This line will only be reached if the server stops
echo.
echo Server has stopped.
pause