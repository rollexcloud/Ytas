// @ts-ignore
import ffmpegPath from 'ffmpeg-static';
// @ts-ignore
import ffmpeg from 'fluent-ffmpeg';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';

import { pipeline } from 'stream/promises';

export async function muxStreams(video: Readable, audio: Readable): Promise<string> {
  const outDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const vidPath = path.join(outDir, `${randomBytes(8).toString('hex')}.mp4`);
  const audPath = path.join(outDir, `${randomBytes(8).toString('hex')}.m4a`);
  const outPath = path.join(outDir, `${randomBytes(8).toString('hex')}.mp4`);

  // Save video & audio to disk first
  await Promise.all([
    pipeline(video, fs.createWriteStream(vidPath)),
    pipeline(audio, fs.createWriteStream(audPath)),
  ]);

  return new Promise<string>((resolve, reject) => {
    ffmpeg()
      .setFfmpegPath(ffmpegPath as string)
      .addInput(vidPath)
      .addInput(audPath)
      .outputOptions('-c copy')
      .save(outPath)
      .on('end', () => {
        // cleanup input files
        fs.unlink(vidPath, () => {});
        fs.unlink(audPath, () => {});
        resolve(outPath);
      })
      .on('error', err => {
        reject(err);
      });
  });
}
