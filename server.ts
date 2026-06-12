import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import AdmZip from "adm-zip";
import * as fs from "fs";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// API Route for Raspberry Pi to send detections
// This endpoint would be called by the Python script on the Pi
app.post("/api/detections", (req, res) => {
  const { type, confidence, timestamp, image } = req.body;
  
  console.log(`[PI-DETECTION] ${type} detected with ${confidence}% confidence at ${timestamp}`);
  
  // In a real scenario, we'd save this to Firestore here if using Admin SDK,
  // or just broadcast it via WebSockets.
  // For now, we'll just acknowledge.
  res.json({ status: "received", id: Date.now().toString() });
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
