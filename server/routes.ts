import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { youtubeUrlSchema, insertDownloadSchema } from "@shared/schema";
import ytdl from "@distube/ytdl-core";

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
  app.post("/api/analyze", async (req, res) => {
    try {
      const { url } = youtubeUrlSchema.parse(req.body);
      
      if (!ytdl.validateURL(url)) {
        return res.status(400).json({ error: "Invalid YouTube URL" });
      }

      // Check if we already have this video cached
      const videoId = ytdl.getVideoID(url);
      const existingDownload = await storage.getDownloadByVideoId(videoId);
      
      if (existingDownload) {
        return res.json({
          videoId: existingDownload.videoId,
          title: existingDownload.title,
          thumbnail: existingDownload.thumbnail,
          duration: existingDownload.duration,
          channel: existingDownload.channel,
          views: existingDownload.views,
          description: existingDownload.description,
          formats: JSON.parse(existingDownload.formats),
        });
      }

      // Get video info with retry logic for rate limiting
      let info: any;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount <= maxRetries) {
        try {
          info = await ytdl.getInfo(url);
          break;
        } catch (error: any) {
          if (error?.statusCode === 429 && retryCount < maxRetries) {
            retryCount++;
            // Wait with exponential backoff: 2s, 4s, 8s
            await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
            continue;
          }
          throw error;
        }
      }
      
      if (!info) {
        throw new Error('Failed to retrieve video information after retries');
      }
      const videoDetails = info.videoDetails;
      
      // Extract available formats
      const videoFormats: VideoFormat[] = info.formats
        .filter((format: any) => format.hasVideo && format.hasAudio)
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
