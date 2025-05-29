# YouTube Video Downloader

This web application allows users to download YouTube videos directly to their browser.

## Features

- Enter a YouTube video URL.
- Download the video in MP4 format.

## Tech Stack

- **Backend**: Python (Flask), yt-dlp
- **Frontend**: HTML, CSS, JavaScript

## Setup and Run

1.  **Clone the repository (or create the files as described).**

2.  **Create a virtual environment:**
    ```bash
    python -m venv venv
    ```

3.  **Activate the virtual environment:**
    -   Windows:
        ```bash
        .\venv\Scripts\activate
        ```
    -   macOS/Linux:
        ```bash
        source venv/bin/activate
        ```

4.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
    *Note: `yt-dlp` also requires `ffmpeg` to be installed and in your system's PATH for merging formats. If you only download pre-merged formats, ffmpeg might not be strictly necessary for all videos, but it's highly recommended for best compatibility.*

5.  **Run the Flask application:**
    ```bash
    python app.py
    ```

6.  Open your web browser and go to `http://127.0.0.1:5000`.

## How it Works

The application uses Flask as the web framework. When a user submits a YouTube URL:
1. The frontend sends the URL to the `/download` endpoint on the backend.
2. The backend uses the `yt-dlp` library to fetch the video information and then the video stream.
3. The video is streamed directly to the user's browser, prompting a download.
