import express from "express";
import path from "path";

// Simple logging function for production
export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit", 
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

// Static file serving for production
export function serveStatic(app: express.Express) {
  const publicPath = path.join(process.cwd(), "dist/public");
  app.use(express.static(publicPath));
  app.get("*", (req, res) => {
    res.sendFile("index.html", { root: publicPath });
  });
}