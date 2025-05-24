import os
import logging
from flask import Flask, render_template, request, jsonify, send_file, session, redirect, url_for
from utils.youtube import get_video_info, download_video
import tempfile
import shutil
import time
import uuid
import atexit

# Setup logger
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "youtube-downloader-secret")

# Create a temporary directory to store downloads
TEMP_DIR = tempfile.mkdtemp()

# Function to clean up temporary files on application exit
def cleanup_temp_files():
    if os.path.exists(TEMP_DIR):
        shutil.rmtree(TEMP_DIR)

# Register cleanup function
atexit.register(cleanup_temp_files)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get-video-info', methods=['POST'])
def fetch_video_info():
    url = request.form.get('url')
    
    if not url:
        return jsonify({
            'success': False,
            'message': 'URL is required'
        }), 400
    
    try:
        # Get video information
        video_info = get_video_info(url)
        
        if not video_info:
            return jsonify({
                'success': False,
                'message': 'Could not retrieve video information. Please check the URL and try again.'
            }), 400
        
        # Store URL in session for later use
        session['video_url'] = url
        
        return jsonify({
            'success': True,
            'video_info': video_info
        })
    except Exception as e:
        logger.error(f"Error fetching video info: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500

@app.route('/download', methods=['POST'])
def download():
    url = session.get('video_url')
    itag = request.form.get('itag')
    
    if not url:
        return jsonify({
            'success': False,
            'message': 'Video URL not found. Please try again.'
        }), 400
    
    if not itag:
        return jsonify({
            'success': False,
            'message': 'Please select a download quality.'
        }), 400
    
    try:
        # Generate a unique filename
        download_id = str(uuid.uuid4())
        download_path = os.path.join(TEMP_DIR, download_id)
        
        # Download the video
        filename = download_video(url, itag, download_path)
        
        if not filename:
            return jsonify({
                'success': False,
                'message': 'Failed to download video. Please try again.'
            }), 500
        
        # Store the download path in session
        session['download_path'] = os.path.join(download_path, filename)
        session['filename'] = filename
        
        return jsonify({
            'success': True,
            'download_id': download_id,
            'filename': filename
        })
    except Exception as e:
        logger.error(f"Error downloading video: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500

@app.route('/get-file/<download_id>')
def get_file(download_id):
    filename = session.get('filename')
    download_path = session.get('download_path')
    
    if not download_path or not os.path.exists(download_path):
        return redirect(url_for('index'))
    
    try:
        return send_file(
            download_path,
            as_attachment=True,
            download_name=filename
        )
    except Exception as e:
        logger.error(f"Error sending file: {str(e)}")
        return redirect(url_for('index'))

@app.route('/ping')
def ping():
    """Endpoint for health checks to keep the server alive"""
    return jsonify({"status": "alive", "timestamp": time.time()})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
