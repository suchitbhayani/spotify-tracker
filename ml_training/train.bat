@echo off
REM Build the Docker image
docker build -t lightfm-train .

REM Run the container with mounted volumes
docker run --rm ^
  -v "C:\Users\ritac\Projects\spotify-tracker\ml_training:/app" ^
  -v "C:\Users\ritac\Projects\spotify-tracker\data\:/data" ^
  lightfm-train
