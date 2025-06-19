import { users, downloads, type User, type InsertUser, type Download, type InsertDownload } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getDownload(id: number): Promise<Download | undefined>;
  getDownloadByVideoId(videoId: string): Promise<Download | undefined>;
  createDownload(download: InsertDownload): Promise<Download>;
  getRecentDownloads(limit?: number): Promise<Download[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private downloads: Map<number, Download>;
  private currentUserId: number;
  private currentDownloadId: number;

  constructor() {
    this.users = new Map();
    this.downloads = new Map();
    this.currentUserId = 1;
    this.currentDownloadId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getDownload(id: number): Promise<Download | undefined> {
    return this.downloads.get(id);
  }

  async getDownloadByVideoId(videoId: string): Promise<Download | undefined> {
    return Array.from(this.downloads.values()).find(
      (download) => download.videoId === videoId,
    );
  }

  async createDownload(insertDownload: InsertDownload): Promise<Download> {
    const id = this.currentDownloadId++;
    const download: Download = { 
      id,
      videoId: insertDownload.videoId,
      title: insertDownload.title,
      thumbnail: insertDownload.thumbnail,
      duration: insertDownload.duration,
      channel: insertDownload.channel,
      views: insertDownload.views ?? null,
      description: insertDownload.description ?? null,
      formats: insertDownload.formats,
      createdAt: new Date()
    };
    this.downloads.set(id, download);
    return download;
  }

  async getRecentDownloads(limit: number = 10): Promise<Download[]> {
    const allDownloads = Array.from(this.downloads.values());
    return allDownloads
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
