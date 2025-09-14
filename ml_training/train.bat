@echo off
REM Build the Docker image
docker build -t lightfm-train .

REM Run the container with mounted volumes
REM %~dp0 to get directory of batch file. That way it can work on all our pcs
docker run --rm ^
  -v "%~dp0:/app" ^
  -v "%~dp0..\data\:/data" ^
  -v "%~dp0..\api\:/api" ^
  lightfm-train
