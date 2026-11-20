@echo off
title COMECIL Web and Database Server
color 0B
cd /d "%~dp0"

echo =====================================================================
echo                 COMECIL Engineering Platform
echo              Starting Web Server and Database Engine
echo =====================================================================
echo.

:: 1. Detect PHP executable
where php >nul 2>&1
if errorlevel 1 (
    if exist "%LOCALAPPDATA%\Microsoft\WinGet\Packages\PHP.PHP.8.3_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe" (
        set "PATH=%LOCALAPPDATA%\Microsoft\WinGet\Packages\PHP.PHP.8.3_Microsoft.Winget.Source_8wekyb3d8bbwe;%PATH%"
    )
    if exist "C:\laragon\bin\php\php-8.3*\php.exe" (
        for /d %%D in ("C:\laragon\bin\php\php-8.*") do set "PATH=%%D;%PATH%"
    )
    if exist "C:\tools\php\php.exe" (
        set "PATH=C:\tools\php;%PATH%"
    )
    if exist "C:\php\php.exe" (
        set "PATH=C:\php;%PATH%"
    )
    if exist "C:\xampp\php\php.exe" (
        set "PATH=C:\xampp\php;%PATH%"
    )
)

where php >nul 2>&1
if errorlevel 1 (
    color 0C
    echo [ERROR] PHP was not found on your system!
    echo Please install PHP or ensure it is added to your PATH.
    echo.
    pause
    exit /b 1
)

:: 2. Check Database Status
echo [*] Checking database connectivity...
php -c php.ini -r "require 'api/config.php'; getDbConnection(); $info = $GLOBALS['ACTIVE_DB_INFO']; if ($info['driver']==='mysql') { echo '[OK] Connected to MySQL database (' . $info['database'] . ')' . PHP_EOL; } else if ($info['is_fallback']) { echo '[OK] MySQL is offline -> Connected to SQLite database (' . $info['database'] . ')' . PHP_EOL; } else { echo '[OK] Connected to SQLite database (' . $info['database'] . ')' . PHP_EOL; }"

:: 3. Server Info and Launch
echo =====================================================================
echo  Web & Database Server is running:
echo.
echo    - Main Website:   http://localhost:8000/index.html
echo    - Admin Portal:   http://localhost:8000/admin.html
echo.
echo  Default Admin Login:
echo    Email:    admin@comecil.com
echo    Password: comecil2026!
echo.
echo  Database Mode: AUTO (Uses MySQL if online, falls back to SQLite)
echo =====================================================================
echo.
echo [*] Opening Admin Portal in your default web browser...
start http://localhost:8000/admin.html
echo.
echo [*] Server is now listening at http://localhost:8000
echo [*] Keep this window OPEN while using the website.
echo     (To stop the server, press Ctrl+C or close this window)
echo.

php -c php.ini -S localhost:8000
pause
