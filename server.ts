import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import AdmZip from "adm-zip";
import * as fs from "fs";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Real-Times Streaming Storage in memory
interface StreamClient {
  id: number;
  res: any;
}

let clients: StreamClient[] = [];
let lastFrame: Buffer | null = null;
let lastFrameTime = 0;

// API Route for Raspberry Pi to send detections
// This endpoint would be called by the Python script on the Pi
app.post("/api/detections", (req, res) => {
  const { type, confidence, timestamp, image } = req.body;
  
  console.log(`[PI-DETECTION] ${type} detected with ${confidence}% confidence at ${timestamp}`);
  
  res.json({ status: "received", id: Date.now().toString() });
});

// Endpoint for receiving active camera frames from the Raspberry Pi 4 Camera
app.post("/api/pi/upload-frame", express.raw({ type: "image/jpeg", limit: "8mb" }), (req, res) => {
  if (!req.body || req.body.length === 0) {
    return res.status(400).json({ error: "Empty frame body. Send raw JPEG bytes with Content-Type: image/jpeg" });
  }

  lastFrame = req.body;
  lastFrameTime = Date.now();

  // Push frame to all connected MJPEG clients
  clients.forEach((client) => {
    try {
      client.res.write(`--frame\r\n`);
      client.res.write(`Content-Type: image/jpeg\r\n`);
      client.res.write(`Content-Length: ${req.body.length}\r\n\r\n`);
      client.res.write(req.body);
      client.res.write(`\r\n`);
    } catch (err) {
      // Client probably disconnected or error
    }
  });

  res.json({ success: true, clientsConnected: clients.length });
});

// Endpoint for checking if the RPi4 streaming script is currently active
app.get("/api/pi/status", (req, res) => {
  // If we received a frame in the last 10 seconds, count as online
  const isOnline = Date.now() - lastFrameTime < 10000;
  res.json({
    online: isOnline,
    lastFrameTime,
    clientsConnected: clients.length,
    timestamp: new Date().toISOString()
  });
});

// MJPEG Video Stream endpoint for standard <img> tag integration
app.get("/api/pi/stream-video", (req, res) => {
  res.setHeader("Content-Type", "multipart/x-mixed-replace; boundary=--frame");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  const clientId = Date.now();
  const clientObj = { id: clientId, res };
  clients.push(clientObj);

  console.log(`[STREAM] RPi4 client ${clientId} connected. Total clients: ${clients.length}`);

  // Send the most recent frame if we have one so they don't see a black screen initially
  if (lastFrame) {
    try {
      res.write(`--frame\r\n`);
      res.write(`Content-Type: image/jpeg\r\n`);
      res.write(`Content-Length: ${lastFrame.length}\r\n\r\n`);
      res.write(lastFrame);
      res.write(`\r\n`);
    } catch (err) {
      // Ignore
    }
  }

  req.on("close", () => {
    clients = clients.filter((c) => c.id !== clientId);
    console.log(`[STREAM] RPi4 client ${clientId} disconnected. Total clients: ${clients.length}`);
    res.end();
  });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", system: "PestGuard AI" });
});

// Endpoint block to download project as ZIP directly when UI button fails
app.get("/api/download-zip", (req, res) => {
  try {
    const zip = new AdmZip();
    const workspaceRoot = process.cwd();
    
    const items = fs.readdirSync(workspaceRoot);
    for (const item of items) {
      if (
        item === "node_modules" ||
        item === "dist" ||
        item === ".git" ||
        item === ".env" ||
        item === "package-lock.json"
      ) {
        continue;
      }
      const itemPath = path.join(workspaceRoot, item);
      const stat = fs.statSync(itemPath);
      if (stat.isDirectory()) {
        // addLocalFolder(localPath, zipPath)
        zip.addLocalFolder(itemPath, item);
      } else {
        zip.addLocalFile(itemPath);
      }
    }
    
    const zipBuffer = zip.toBuffer();
    res.setHeader("Content-Disposition", "attachment; filename=PestGuard-AI.zip");
    res.setHeader("Content-Type", "application/zip");
    res.send(zipBuffer);
  } catch (err: any) {
    console.error("Error creating ZIP:", err);
    res.status(500).json({ error: "Failed to generate ZIP", details: err.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Only listen on PORT if not running in Vercel serverless environment
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`PestGuard AI Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
