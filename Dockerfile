# Use an official Python runtime as a parent image
FROM python:3.9-slim-bullseye

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Install system dependencies required by yt-dlp and ffmpeg
# ffmpeg is crucial for yt-dlp to combine video and audio streams for many videos
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container at /app
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
# Using --no-cache-dir to reduce image size
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code into the container at /app
COPY . .

# Make port 8000 available to the world outside this container
# Render.com will typically use this or provide its own port via PORT env variable
EXPOSE 8000

# Define the command to run the application using Gunicorn
# Render.com will use the PORT environment variable it provides.
# We bind to 0.0.0.0 to accept connections from any IP.
# The number of workers can be adjusted based on your Render plan's resources.
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "2", "app:app"]
