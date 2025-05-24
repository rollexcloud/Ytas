import os
import logging
import re
import requests
import json
import yt_dlp

# Setup logger
logger = logging.getLogger(__name__)

def is_valid_youtube_url(url):
    """
    Validate if the provided URL is a valid YouTube URL
    """
    youtube_regex = (
        r'(https?://)?(www\.)?'
        r'(youtube|youtu|youtube-nocookie)\.(com|be)/'
        r'(watch\?v=|embed/|v/|.+\?v=|shorts/)?([^&=%\?]{11})'
    )
    
    youtube_regex_match = re.match(youtube_regex, url)
    return bool(youtube_regex_match)

def get_video_info(url):
    """
    Get video information from a YouTube URL using yt-dlp
    
    Returns a dictionary with video details or None if an error occurs
    """
    if not is_valid_youtube_url(url):
        raise ValueError("Invalid YouTube URL")
    
    try:
        # Set up yt-dlp options
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'skip_download': True,
            'format': 'best',
            'noplaylist': True,
            'extract_flat': True,
            'force_generic_extractor': False,
        }

        # Get video info using yt-dlp
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            # Get formats with both video and audio
            formats = []
            
            # Filter for formats that have both video and audio
            video_formats = [f for f in info.get('formats', []) if 
                            f.get('vcodec', 'none') != 'none' and 
                            f.get('acodec', 'none') != 'none' and 
                            f.get('resolution') != 'audio only']
            
            # Sort by height (resolution)
            video_formats.sort(key=lambda x: (x.get('height', 0) or 0), reverse=True)
            
            # Get audio-only formats
            audio_formats = [f for f in info.get('formats', []) if 
                            f.get('resolution') == 'audio only' or 
                            (f.get('vcodec', 'none') == 'none' and f.get('acodec', 'none') != 'none')]
            
            # Sort audio by quality
            audio_formats.sort(key=lambda x: x.get('quality', 0) or 0, reverse=True)
            
            # Select top formats
            selected_formats = video_formats[:4]  # Top 4 video qualities
            if audio_formats:
                selected_formats.extend(audio_formats[:2])  # Top 2 audio qualities
            
            stream_info = []
            for fmt in selected_formats:
                # Get estimated file size
                filesize = fmt.get('filesize') or fmt.get('filesize_approx') or 0
                size_mb = round(filesize / (1024 * 1024), 2) if filesize else "Unknown"
                
                format_info = {
                    'itag': fmt.get('format_id'),
                    'resolution': fmt.get('resolution') or f"{fmt.get('height', '')}p",
                    'mime_type': fmt.get('ext', 'mp4'),
                    'fps': fmt.get('fps', 30),
                    'size_mb': size_mb
                }
                
                # Add audio bitrate for audio-only formats
                if fmt.get('resolution') == 'audio only' or fmt.get('vcodec') == 'none':
                    format_info['resolution'] = 'Audio only'
                    format_info['abr'] = f"{fmt.get('abr', 0)}kbps"
                
                stream_info.append(format_info)
            
            # Collect video information
            video_info = {
                'title': info.get('title', 'Unknown Title'),
                'author': info.get('uploader', 'Unknown Author'),
                'length_seconds': info.get('duration', 0),
                'views': info.get('view_count', 0),
                'thumbnail_url': info.get('thumbnail', ''),
                'streams': stream_info
            }
            
            return video_info
    
    except Exception as e:
        logger.error(f"Error retrieving video info: {str(e)}")
        return None

def download_video(url, itag, output_path):
    """
    Download a YouTube video using yt-dlp with the specified format id (itag)
    
    Returns the filename of the downloaded video or None if an error occurs
    """
    if not is_valid_youtube_url(url):
        raise ValueError("Invalid YouTube URL")
    
    try:
        # Create output directory if it doesn't exist
        os.makedirs(output_path, exist_ok=True)
        
        # Generate a random filename using the original filename from YouTube
        output_template = os.path.join(output_path, '%(title)s.%(ext)s')
        
        # Setup yt-dlp options
        ydl_opts = {
            'format': itag,
            'outtmpl': output_template,
            'quiet': True,
            'no_warnings': True,
            'noplaylist': True,
            'cookiefile': None,  # No cookies needed
        }
        
        # Download the video
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            # Get the downloaded file path
            if 'requested_downloads' in info:
                # For newer versions of yt-dlp
                downloaded_file = info['requested_downloads'][0]['filepath']
            else:
                # Fallback for older versions
                downloaded_file = ydl.prepare_filename(info)
                # Add extension if not present
                if not os.path.exists(downloaded_file):
                    ext = info.get('ext', 'mp4')
                    downloaded_file = f"{os.path.splitext(downloaded_file)[0]}.{ext}"
            
            # Return just the filename, not the full path
            return os.path.basename(downloaded_file)
    
    except Exception as e:
        logger.error(f"Error downloading video: {str(e)}")
        return None
          
