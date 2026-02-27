@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
set "SRC_BIN=%SCRIPT_DIR%slack-mod.exe"

if exist "%SRC_BIN%" goto copy

set "SRC_BIN=%SCRIPT_DIR%slack-mod"
if exist "%SRC_BIN%" goto copy

echo slack-mod binary not found in: %SCRIPT_DIR%
echo Build first, e.g.:
echo   go build -ldflags "-s -w -H=windowsgui" -o slack-mod.exe
exit /b 1

:copy
set "INSTALL_ROOT=%LOCALAPPDATA%"
if "%INSTALL_ROOT%"=="" set "INSTALL_ROOT=%USERPROFILE%\AppData\Local"
set "INSTALL_DIR=%INSTALL_ROOT%\slack-mod"
set "BIN=%INSTALL_DIR%\slack-mod.exe"

if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
if errorlevel 1 exit /b 1

copy /Y "%SRC_BIN%" "%BIN%" >nul
if errorlevel 1 exit /b 1

if exist "%SCRIPT_DIR%injection\" (
  if not exist "%INSTALL_DIR%\injection\" mkdir "%INSTALL_DIR%\injection"
  if errorlevel 1 exit /b 1
  xcopy "%SCRIPT_DIR%injection\*" "%INSTALL_DIR%\injection\" /E /I /Y >nul
  if errorlevel 4 exit /b 1
)

"%BIN%" --patch-desktop %*
exit /b %ERRORLEVEL%
