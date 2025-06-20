import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { youtubeUrlSchema, insertDownloadSchema } from "@shared/schema";
import fs from 'fs';
import { muxStreams } from './muxer';
import { Readable } from 'stream';
import ytdl from "@distube/ytdl-core";
import { getCachedVideoInfo, setCachedVideoInfo } from './cache';
import { addVideoJob } from './queue';
import { getNextProxy } from './proxyPool';
import { fetchWithPuppeteer } from './puppeteerFetcher';


interface VideoFormat {
  quality: string;
  container: string;
  filesize?: string;
  itag: number;
  type: 'video' | 'audio';
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for Render.com
  app.get("/health", (req, res) => {
    res.json({ status: "ok", message: "YouTube Downloader API is running" });
  });

  // Analyze YouTube video
  // Download and optionally mux video+audio
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  const handleDownload = async (url: string, itagParam: string | number, res: any): Promise<void> => {
    try { url = decodeURIComponent(url); } catch (_) { /* ignore */ }

    const itag = typeof itagParam === 'string' ? parseInt(itagParam, 10) : itagParam;
    if (!ytdl.validateURL(url)) {
      res.status(400).json({ error: 'Invalid YouTube URL' });
      return;
    }
    const info = await ytdl.getInfo(url);
    const format = info.formats.find(f => f.itag === itag);
    if (!format) return res.status(400).json({ error: 'Format not found' });

    // Progressive
    if (format.hasAudio) {
      res.setHeader('Content-Type', 'video/mp4');
      ytdl(url, { quality: itag }).pipe(res);
      return;
    }
    // Need to mux
    const videoStream: Readable = ytdl(url, { quality: itag });
    const audioStream: Readable = ytdl(url, { quality: 140 });
    const filePath = await muxStreams(videoStream, audioStream);
    res.download(filePath, `${info.videoDetails.title}.mp4`, err => {
      if (err) console.error('Download error:', err);
      setTimeout(() => fs.unlink(filePath, () => {}), 60_000);
    });
  };

  app.post('/api/download', async (req, res) => {
    try {
      let { url, itag } = req.body as any;
      // Handle edge cases where body may be stringified JSON or nested
      if (typeof req.body === 'string') {
        try { const parsed = JSON.parse(req.body); url = parsed.url; itag = parsed.itag; } catch(_) {}
      }
      if (!url && req.body?.data) { url = req.body.data.url; itag = req.body.data.itag; }
      // Build URL from videoId if provided
      if (!url && req.body?.videoId) {
        url = `https://www.youtube.com/watch?v=${req.body.videoId}`;
      }
      if (!itag && req.body?.itag) {
        itag = req.body.itag;
      }
      if (!url || !itag) {
        console.warn('/api/download POST missing params. body=', req.body);
        return res.status(400).json({ error: 'Missing url or itag' });
      }
      await handleDownload(url, itag, res);
    } catch (err) {
      console.error('/api/download POST error:', err);
      res.status(500).json({ error: 'Failed to download' });
    }
  });

  // GET variant for easier UI usage: /api/download?url=...&itag=137
  app.get('/api/download', async (req, res) => {
    try {
      let { url, itag, videoId } = req.query as { url?: string; itag?: string; videoId?: string };
      // Allow videoId shortcut
      if (!url && videoId) {
        url = `https://www.youtube.com/watch?v=${videoId}`;
      }
      if (!url) {
        // Attempt to reconstruct raw query part after ?url=
        const raw = req.originalUrl.split('?')[1] || '';
        if (raw.startsWith('url=')) {
          const parts = raw.split('&');
          url = parts[0].substring(4); // remove 'url='
          itag = itag || (parts.find(p=>p.startsWith('itag='))?.split('=')[1]);
        }
      }
      if (!url || !itag) {
        return res.status(400).json({ error: 'Missing url or itag' });
      }
      await handleDownload(url, itag, res);
    } catch (err) {
      console.error('/api/download GET error:', err);
      res.status(500).json({ error: 'Failed to download' });
    }
  });

  app.post("/api/analyze", async (req, res) => {
    try {
      const { url } = youtubeUrlSchema.parse(req.body);
      
      if (!ytdl.validateURL(url)) {
        return res.status(400).json({ error: "Invalid YouTube URL" });
      }

      // Check if we already have this video cached
      const videoId = ytdl.getVideoID(url);
      // 1. Try Redis cache
      const cached = await getCachedVideoInfo(videoId);
      if (cached) {
        return res.json(cached);
      }
      // 2. Try storage (legacy in-memory)
      const existingDownload = await storage.getDownloadByVideoId(videoId);
      if (existingDownload) {
        const responseData = {
          videoId: existingDownload.videoId,
          title: existingDownload.title,
          thumbnail: existingDownload.thumbnail,
          duration: existingDownload.duration,
          channel: existingDownload.channel,
          views: existingDownload.views,
          description: existingDownload.description,
          formats: JSON.parse(existingDownload.formats),
        };
        await setCachedVideoInfo(videoId, responseData);
        return res.json(responseData);
      }
      // 3. Try queueing a fetch job (throttled, proxy, puppeteer fallback)
      let info;
      let usedPuppeteer = false;
      try {
        try {
          info = await ytdl.getInfo(url);
        } catch (err: any) {
          // If rate-limited or blocked, use Puppeteer with proxy
          usedPuppeteer = true;
          const html = await fetchWithPuppeteer(url);
          // Optionally, parse HTML for video info here or just return fallback
          info = { videoDetails: { title: 'Blocked or rate-limited', thumbnails: [], lengthSeconds: '0', author: { name: '' }, viewCount: '0', description: '' }, formats: [] };
        }
      } catch (err) {
        // If all fails, add to queue for retry
        await addVideoJob({ url, videoId });
        return res.status(429).json({ error: 'Rate limited or blocked. Your request is queued for retry.' });
      }
      if (!info) {
        throw new Error('Failed to retrieve video information after retries');
      }
      const videoDetails = info.videoDetails;
      
      // Extract available formats
      const videoFormats: VideoFormat[] = info.formats
        .filter((format: any) => format.hasVideo)
        .map((format: any) => ({
          quality: format.qualityLabel || format.quality,
          container: format.container,
          filesize: format.contentLength,
          itag: format.itag,
          type: 'video' as const
        }))
        .filter((format: VideoFormat, index: number, self: VideoFormat[]) => 
          index === self.findIndex((f: VideoFormat) => f.quality === format.quality)
        );

      const audioFormats: VideoFormat[] = info.formats
        .filter((format: any) => format.hasAudio && !format.hasVideo)
        .map((format: any) => ({
          quality: format.audioBitrate ? `${format.audioBitrate}kbps` : 'Standard',
          container: 'mp3',
          filesize: format.contentLength,
          itag: format.itag,
          type: 'audio' as const
        }))
        .filter((format: VideoFormat, index: number, self: VideoFormat[]) => 
          index === self.findIndex((f: VideoFormat) => f.quality === format.quality)
        )
        .slice(0, 2); // Limit to 2 audio qualities

      const allFormats = [...videoFormats, ...audioFormats];

      // Format duration
      const duration = parseInt(videoDetails.lengthSeconds);
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      const formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;

      // Format view count
      const viewCount = parseInt(videoDetails.viewCount);
      const formattedViews = viewCount > 1000000 
        ? `${(viewCount / 1000000).toFixed(1)}M views`
        : viewCount > 1000
        ? `${(viewCount / 1000).toFixed(1)}K views`
        : `${viewCount} views`;

      const downloadData = {
        videoId,
        title: videoDetails.title,
        thumbnail: videoDetails.thumbnails[videoDetails.thumbnails.length - 1].url,
        duration: formattedDuration,
        channel: videoDetails.author.name,
        views: formattedViews,
        description: videoDetails.description?.substring(0, 200) + "..." || "",
        formats: JSON.stringify(allFormats),
      };

      // Cache the video info
      await storage.createDownload(downloadData);

      res.json({
        videoId: downloadData.videoId,
        title: downloadData.title,
        thumbnail: downloadData.thumbnail,
        duration: downloadData.duration,
        channel: downloadData.channel,
        views: downloadData.views,
        description: downloadData.description,
        formats: allFormats,
      });

    } catch (error: any) {
      console.error("Error analyzing video:", error);
      
      // Handle specific YouTube API errors
      if (error.statusCode === 429) {
        return res.status(429).json({ 
          error: "YouTube is temporarily limiting requests. Please wait a moment and try again." 
        });
      } else if (error.statusCode === 403) {
        return res.status(403).json({ 
          error: "Access to this video is restricted. It may be private or unavailable in your region." 
        });
      } else if (error.statusCode === 404) {
        return res.status(404).json({ 
          error: "Video not found. Please check the URL and try again." 
        });
      }
      
      res.status(500).json({ 
        error: "Unable to analyze video. Please check the URL and try again." 
      });
    }
  });

  // Download video/audio
  app.post("/api/download", async (req, res) => {
    try {
      const { videoId, itag, format } = req.body;
      
      if (!videoId || !itag) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      const url = `https://www.youtube.com/watch?v=${videoId}`;
      
      if (!ytdl.validateURL(url)) {
        return res.status(400).json({ error: "Invalid video ID" });
      }

      // Get video info for filename
      const info = await ytdl.getInfo(url);
      const title = info.videoDetails.title.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 50);
      const extension = format === 'audio' ? 'mp3' : 'mp4';
      const filename = `${title}.${extension}`;

      // Set headers for download
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', format === 'audio' ? 'audio/mpeg' : 'video/mp4');

      // Stream the video/audio
      const stream = ytdl(url, { 
        quality: itag,
        filter: format === 'audio' ? 'audioonly' : 'audioandvideo'
      });

      stream.pipe(res);

      stream.on('error', (error: any) => {
        console.error("Stream error:", error);
        if (!res.headersSent) {
          res.status(500).json({ error: "Download failed" });
        }
      });

    } catch (error) {
      console.error("Error downloading:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Download failed" });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
