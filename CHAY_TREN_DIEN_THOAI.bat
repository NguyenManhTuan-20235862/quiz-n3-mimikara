@echo off
chcp 65001 >nul
title May chu Web Quiz N3 - Ket noi dien thoai
cd /d "%~dp0"

echo Dang khoi dong may chu ket noi dien thoai...
python server.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [Loi] Khong the chay python server.py.
    echo Vui long kiem tra lai cai dat Python tren may.
    pause
)
