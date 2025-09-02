# Use an official Python image
FROM python:3.10-slim

# Set working directory inside container
WORKDIR /app

# Install system dependencies required by LightFM
RUN apt-get update && apt-get install -y \
    build-essential \
    libopenblas-dev \
    libomp-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install them
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy your training script
COPY training.py .

# Run training.py by default
CMD ["python", "training.py"]
