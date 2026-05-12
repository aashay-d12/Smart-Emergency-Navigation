"use strict";

const http = require("http");
const fs   = require("fs");
const path = require("path");
const { SmartCitySimulation } = require("./src/simulation");

const PORT       = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path.join(__dirname, "public");
const simulation = new SmartCitySimulation();
const clients    = new Set();

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".js":   "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg":  "image/svg+xml",
  ".png":  "image/png",
  ".webp": "image/webp"
};

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => { body += chunk; if (body.length > 1e6) { req.socket.destroy(); reject(new Error("Too large")); } });
    req.on("end", () => { if (!body) return resolve({}); try { resolve(JSON.parse(body)); } catch (e) { reject(e); } });
  });
}

function serveStatic(req, res) {
  const urlPath  = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
  const safePath = urlPath === "/" ? "/index.html" : urlPath;
  const filePath = path.normalize(path.join(PUBLIC_DIR, safePath));
  if (!filePath.startsWith(PUBLIC_DIR)) { res.writeHead(403); res.end("Forbidden"); return; }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end("Not found"); return; }
    res.writeHead(200, { "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream" });
    res.end(data);
  });
}

function broadcastState() {
  const state   = simulation.step();
  const payload = `data: ${JSON.stringify(state)}\n\n`;
  for (const client of clients) client.write(payload);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // ── GET /api/state ──────────────────────────────────────────────────────
  if (url.pathname === "/api/state" && req.method === "GET") {
    return sendJson(res, 200, simulation.getState());
  }

  // ── POST /api/request  (legacy) ─────────────────────────────────────────
  if (url.pathname === "/api/request" && req.method === "POST") {
    try { const body = await readBody(req); return sendJson(res, 200, simulation.requestEmergency(body)); }
    catch { return sendJson(res, 400, { error: "Invalid payload" }); }
  }

  // ── POST /api/dispatch  (new — supports explicit origin + destination) ──
  if (url.pathname === "/api/dispatch" && req.method === "POST") {
    try {
      const body = await readBody(req);
      return sendJson(res, 200, simulation.requestEmergency({ type: body.type, start: body.origin, destination: body.destination }));
    } catch { return sendJson(res, 400, { error: "Invalid dispatch payload" }); }
  }

  // ── GET /api/incidents ──────────────────────────────────────────────────
  if (url.pathname === "/api/incidents" && req.method === "GET") {
    const state = simulation.getState();
    return sendJson(res, 200, { incidents: state.incidentSites, active: state.activeIncident });
  }

  // ── GET /api/events  (SSE) ──────────────────────────────────────────────
  if (url.pathname === "/api/events" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive", "Access-Control-Allow-Origin": "*" });
    res.write(`data: ${JSON.stringify(simulation.getState())}\n\n`);
    clients.add(res);
    req.on("close", () => clients.delete(res));
    return;
  }

  serveStatic(req, res);
});

// 800 ms tick for smoother animation
const interval = setInterval(broadcastState, 800);

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n  ✖  Port ${PORT} is already in use.`);
    console.error(`     Run this to free it:  npx kill-port ${PORT}`);
    console.error(`     Or on Windows:  Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT} | Select -Expand OwningProcess) -Force\n`);
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, () => {
  console.log(`\n  ┌─────────────────────────────────────────────────────┐`);
  console.log(`  │  EOC Dashboard  →  http://localhost:${PORT}           │`);
  console.log(`  │  IIIT Pune Emergency Navigation System               │`);
  console.log(`  └─────────────────────────────────────────────────────┘\n`);
});

process.on("SIGINT", () => { clearInterval(interval); server.close(() => process.exit(0)); });
