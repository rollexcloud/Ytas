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
  const clientPath = path.join(process.cwd(), "dist/client");
  app.use(express.static(clientPath));
  app.get("*", (req, res) => {
    res.sendFile("index.html", { root: clientPath });
  });
}