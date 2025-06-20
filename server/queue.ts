import { Queue, Worker, Job } from 'bullmq';
// If you need repeatable/delayed jobs reliability, uncomment the next line:
// import { QueueScheduler } from 'bullmq';
import { redis, setCachedVideoInfo } from './cache';
import ytdl from '@distube/ytdl-core';
import { fetchWithPuppeteer } from './puppeteerFetcher';
import { getNextProxy } from './proxyPool';
import { storage } from './storage';

export const videoQueue = redis ? new Queue('videoQueue', { connection: (redis as any).options }) : null;
// new QueueScheduler('videoQueue', { connection: redis.options }); // Uncomment if needed for delayed/repeatable jobs

export function addVideoJob(data: any) {
  if (!videoQueue) {
    console.warn('[queue] Redis not available, skipping addVideoJob.');
    return;
  }
  return videoQueue.add('fetch', data, { removeOnComplete: true, removeOnFail: true });
}

export function startQueueWorker() {
  if (!videoQueue) {
    console.warn('[queue] Redis not available, not starting queue worker.');
    return;
  }
  return new Worker('videoQueue', async (job: Job) => {
    const { url, videoId } = job.data;
    let info;
    let usedPuppeteer = false;
    try {
      try {
        info = await ytdl.getInfo(url);
      } catch (err: any) {
        usedPuppeteer = true;
        const html = await fetchWithPuppeteer(url);
        info = { videoDetails: { title: 'Blocked or rate-limited', thumbnails: [], lengthSeconds: '0', author: { name: '' }, viewCount: '0', description: '' }, formats: [] };
      }
      if (!info) throw new Error('No info fetched');
      const videoDetails = info.videoDetails;
      const videoFormats = info.formats
        ? info.formats.filter((format: any) => format.hasVideo).map((format: any) => ({
            quality: format.qualityLabel || format.quality,
            container: format.container,
            filesize: format.contentLength,
            itag: format.itag,
            type: 'video' as const
          }))
        : [];
      const audioFormats = info.formats
        ? info.formats.filter((format: any) => format.hasAudio && !format.hasVideo).map((format: any) => ({
            quality: format.audioBitrate ? `${format.audioBitrate}kbps` : 'Standard',
            container: 'mp3',
            filesize: format.contentLength,
            itag: format.itag,
            type: 'audio' as const
          }))
        : [];
      const allFormats = [...videoFormats, ...audioFormats];
      const duration = parseInt(videoDetails.lengthSeconds || '0');
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      const formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      const viewCount = parseInt(videoDetails.viewCount || '0');
      const formattedViews = viewCount > 1000000 
        ? `${(viewCount / 1000000).toFixed(1)}M views`
        : viewCount > 1000
        ? `${(viewCount / 1000).toFixed(1)}K views`
        : `${viewCount} views`;
      const downloadData = {
        videoId,
        title: videoDetails.title,
        thumbnail: videoDetails.thumbnails?.[videoDetails.thumbnails.length - 1]?.url || '',
        duration: formattedDuration,
        channel: videoDetails.author?.name || '',
        views: formattedViews,
        description: videoDetails.description?.substring(0, 200) + '...' || '',
        formats: JSON.stringify(allFormats),
      };
      await setCachedVideoInfo(videoId, {
        videoId: downloadData.videoId,
        title: downloadData.title,
        thumbnail: downloadData.thumbnail,
        duration: downloadData.duration,
        channel: downloadData.channel,
        views: downloadData.views,
        description: downloadData.description,
        formats: allFormats,
      });
      await storage.createDownload(downloadData);
      console.log(`[queue] Successfully processed job for ${videoId}${usedPuppeteer ? ' (puppeteer)' : ''}`);
      return true;
    } catch (err) {
      console.error('[queue] Failed to process job:', err);
      throw err;
    }
  }, { connection: redis.options, concurrency: 2 });
}
