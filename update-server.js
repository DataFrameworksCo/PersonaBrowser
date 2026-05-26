#!/usr/bin/env node
// Simple static file server for Persona Browser updates
// Run with: npm run updates:serve
// Files served from: ./release/ at http://<ip>:9090/updates/

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = Number(process.env.PORT || 9090);
const HOST = process.env.HOST || '0.0.0.0';
const RELEASE_DIR = path.resolve(process.env.PERSONA_RELEASE_DIR || path.join(__dirname, 'release'));

const MIME = {
  '.dmg': 'application/octet-stream',
  '.exe': 'application/octet-stream',
  '.json': 'application/json',
  '.zip': 'application/zip',
  '.yml': 'text/yaml',
  '.yaml': 'text/yaml',
  '.blockmap': 'application/octet-stream',
};

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const entries of Object.values(interfaces)) {
    if (!entries) continue;
    for (const entry of entries) {
      if (entry.family === 'IPv4' && !entry.internal) {
        return entry.address;
      }
    }
  }

  return '127.0.0.1';
}

const server = http.createServer((req, res) => {
  if (!req.url.startsWith('/updates/')) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const filename = decodeURIComponent(req.url.replace('/updates/', ''));
  const filePath = path.resolve(RELEASE_DIR, filename);

  // Prevent path traversal
  if (filePath !== RELEASE_DIR && !filePath.startsWith(`${RELEASE_DIR}${path.sep}`)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath);
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Content-Length': stat.size,
      'Access-Control-Allow-Origin': '*',
    });

    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, HOST, () => {
  const advertisedUrl = process.env.PERSONA_UPDATE_URL || `http://${getLocalIp()}:${PORT}/updates`;
  console.log(`Persona Browser update server running at ${advertisedUrl}`);
  console.log(`Serving files from: ${RELEASE_DIR}`);
});
