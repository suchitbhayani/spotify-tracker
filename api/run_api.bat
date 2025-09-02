@echo off
REM Build the Docker image
docker build -t spotify-api .

REM Run the container exposing port 8000
docker run --rm -p 8000:8000 spotify-api
