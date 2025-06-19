import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const downloads = pgTable("downloads", {
  id: serial("id").primaryKey(),
  videoId: text("video_id").notNull(),
  title: text("title").notNull(),
  thumbnail: text("thumbnail").notNull(),
  duration: text("duration").notNull(),
  channel: text("channel").notNull(),
  views: text("views"),
  description: text("description"),
  formats: text("formats").notNull(), // JSON string of available formats
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertDownloadSchema = createInsertSchema(downloads).pick({
  videoId: true,
  title: true,
  thumbnail: true,
  duration: true,
  channel: true,
  views: true,
  description: true,
  formats: true,
});

export const youtubeUrlSchema = z.object({
  url: z.string().url().refine(
    (url) => url.includes('youtube.com/watch') || url.includes('youtu.be/'),
    { message: "Please enter a valid YouTube URL" }
  ),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertDownload = z.infer<typeof insertDownloadSchema>;
export type Download = typeof downloads.$inferSelect;
export type YoutubeUrl = z.infer<typeof youtubeUrlSchema>;
