@echo off
echo Iniciando ngrok en puerto 3000...
echo.
echo Si ngrok se cierra, vereis el mensaje de error abajo.
echo.
ngrok http 3000
echo.
echo --- ngrok termino. Codigo de salida: %ERRORLEVEL% ---
pause
