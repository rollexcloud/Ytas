import os
from flask import Flask, render_template, request, send_file, Response
import yt_dlp
import io
import re # For sanitizing filenames

app = Flask(__name__)

# Ensure the 'static' directory exists for CSS
if not os.path.exists(os.path.join(app.root_path, 'static')):
    os.makedirs(os.path.join(app.root_path, 'static'))

# Ensure the 'templates' directory exists for HTML
if not os.path.exists(os.path.join(app.root_path, 'templates')):
    os.makedirs(os.path.join(app.root_path, 'templates'))

def sanitize_filename(filename):
    """
    Sanitizes a string to be a valid filename.
    Removes or replaces characters that are not allowed in Windows filenames.
    """
    # Remove characters that are definitely invalid on Windows
    filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
    # Remove control characters
    filename = re.sub(r'[\x00-\x1f\x7f]', '', filename)
    # Replace sequences of underscores with a single underscore
    filename = re.sub(r'_+', '_', filename)
    # Remove leading/trailing underscores or spaces
    filename = filename.strip('_ ')
    # Limit length (optional, but good practice)
    if len(filename) > 200: # Max path length issues can also cause Errno 22
        filename = filename[:200]
    if not filename: # If filename becomes empty after sanitization
        filename = "downloaded_video"
    return filename

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/download', methods=['POST'])
def download_video():
    video_url = request.form.get('url')
    if not video_url:
        return "Error: No URL provided", 400

    try:
        ydl_opts = {
            'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            'outtmpl': '-',  # Output to stdout
            'logtostderr': True # Log errors to stderr for debugging
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=False)
            original_title = info.get('title', 'video')
            video_title = sanitize_filename(original_title) # Use the new sanitize function
            
            temp_filename = f"{video_title}.mp4"
            
            ydl_opts_file = {
                'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
                'outtmpl': temp_filename,
                'logtostderr': True,
                'nopart': True,
                'quiet': True,
                # 'progress_hooks': [lambda d: print(d)] # For debugging progress
            }

            with yt_dlp.YoutubeDL(ydl_opts_file) as ydl_file:
                ydl_file.download([video_url])
            
            # Stream the downloaded file
            def generate():
                try:
                    with open(temp_filename, 'rb') as f:
                        while True:
                            chunk = f.read(4096) # Read in chunks
                            if not chunk:
                                break
                            yield chunk
                finally:
                    # Ensure cleanup even if streaming is interrupted or an error occurs during generation
                    if os.path.exists(temp_filename):
                        try:
                            os.remove(temp_filename)
                            app.logger.info(f"Successfully removed temp file: {temp_filename}")
                        except Exception as e_remove:
                            app.logger.error(f"Error removing temp file {temp_filename}: {e_remove}")
                    else:
                        app.logger.warning(f"Temp file {temp_filename} not found for removal during generate cleanup.")

            return Response(generate(),
                            mimetype='video/mp4',
                            headers={'Content-Disposition': f'attachment;filename="{video_title}.mp4"'})

    except yt_dlp.utils.DownloadError as e:
        app.logger.error(f"yt-dlp DownloadError: {e}")
        error_text = str(e).lower() # Convert to lowercase for easier matching
        user_friendly_message = "An error occurred while trying to process the video."

        if "unsupported url" in error_text:
            user_friendly_message = "Error: The provided URL is not supported or is not a valid video URL."
        elif "video unavailable" in error_text or \
             "content isn’t available" in error_text or \
             "isn't available anymore" in error_text or \
             "private video" in error_text or \
             "video is private" in error_text:
            user_friendly_message = "Error: This video is unavailable. It might be private, deleted, or restricted in your region."
        elif "age restricted" in error_text or "age-restricted" in error_text:
             user_friendly_message = "Error: This video is age-restricted and cannot be downloaded without authentication, which this service does not support."
        elif "copyright" in error_text:
            user_friendly_message = "Error: This video cannot be downloaded due to copyright restrictions."
        else:
            # Try to extract a cleaner message from yt-dlp's output
            # yt-dlp errors often start with "ERROR: "
            if error_text.startswith("error: "):
                extracted_error = str(e)[len("ERROR: "):].strip()
                user_friendly_message = f"Error: {extracted_error}"
            else:
                 user_friendly_message = f"Error processing video. Please try a different URL or check the video's availability."

        return user_friendly_message, 500
    except Exception as e:
        app.logger.error(f"General Error: {e}")
        return f"An unexpected error occurred: {e}", 500

if __name__ == '__main__':
    # For local development, Gunicorn will handle port in Docker/Render
    # Get port from environment variable if available, otherwise default to 5000 for local dev.
    # Gunicorn in the Dockerfile explicitly uses port 8000.
    port = int(os.environ.get('PORT', 5000))
    # Bind to 0.0.0.0 to be accessible if run directly with 'python app.py' locally.
    app.run(host='0.0.0.0', port=port, debug=True)
