# YouTube Downloader Pro

A modern, fast YouTube video downloader web application built with React and Express.js. Download YouTube videos in MP4 format or extract audio as MP3 files.

## Features

- 🎬 Download YouTube videos in multiple qualities (720p, 1080p)
- 🎵 Extract audio as MP3 files
- ⚡ Fast video analysis and processing
- 💾 Built-in caching for improved performance
- 📱 Responsive design for all devices
- 🔒 Safe and secure - no ads, no tracking

## Deployment on Render.com

### Prerequisites
- A Render.com account
- GitHub repository with this code

### Quick Deploy

1. **Fork or clone this repository** to your GitHub account

2. **Connect to Render.com:**
   - Go to [Render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

3. **Configure the service:**
   - **Name:** `youtube-downloader` (or your preferred name)
   - **Environment:** `Docker`
   - **Region:** Choose closest to your users
   - **Branch:** `main`
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`

4. **Environment Variables:**
   - `NODE_ENV` = `production`
   - `PORT` = `10000` (Render automatically sets this)

5. **Deploy:**
   - Click "Create Web Service"
   - Wait for deployment to complete (usually 3-5 minutes)

### Alternative: Using render.yaml

This repository includes a `render.yaml` file for automatic deployment:

1. Push your code to GitHub
2. Go to Render Dashboard → "New +" → "Blueprint"
3. Connect your repository
4. Render will automatically deploy using the configuration

### Manual Docker Deployment

If you prefer to build and deploy manually:

```bash
# Build the Docker image
docker build -t youtube-downloader .

# Run locally to test
docker run -p 5000:5000 youtube-downloader

# Deploy to your preferred cloud platform
```

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

- `NODE_ENV` - Set to `production` for production deployment
- `PORT` - Port number (default: 5000)

## API Endpoints

- `GET /` - Health check
- `POST /api/analyze` - Analyze YouTube video
- `POST /api/download` - Download video/audio

## Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS
- **Backend:** Express.js, Node.js
- **Video Processing:** @distube/ytdl-core
- **Build Tools:** Vite, esbuild

## Legal Notice

This tool is for educational purposes. Please respect YouTube's Terms of Service and copyright laws. Only download content you have permission to download.

## Support

For issues and questions, please create an issue in the GitHub repository.