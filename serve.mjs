import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp',
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // GET /api/products
  if (req.url === '/api/products' && req.method === 'GET') {
    const filePath = path.join(__dirname, 'products.json');
    fs.readFile(filePath, (err, data) => {
      if (err) return json(res, 500, { error: 'Could not read products' });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(data);
    });
    return;
  }

  // GET /api/content
  if (req.url === '/api/content' && req.method === 'GET') {
    const filePath = path.join(__dirname, 'content.json');
    fs.readFile(filePath, (err, data) => {
      if (err) return json(res, 500, { error: 'Could not read content' });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(data);
    });
    return;
  }

  // POST /api/content — save entire content object
  if (req.url === '/api/content' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const filePath = path.join(__dirname, 'content.json');
      fs.writeFile(filePath, JSON.stringify(body, null, 2), err => {
        if (err) return json(res, 500, { error: 'Could not save content' });
        json(res, 200, { ok: true });
      });
    } catch {
      json(res, 400, { error: 'Invalid JSON' });
    }
    return;
  }

  // POST /api/products — save entire products array
  if (req.url === '/api/products' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const filePath = path.join(__dirname, 'products.json');
      fs.writeFile(filePath, JSON.stringify(body, null, 2), err => {
        if (err) return json(res, 500, { error: 'Could not save products' });
        json(res, 200, { ok: true });
      });
    } catch {
      json(res, 400, { error: 'Invalid JSON' });
    }
    return;
  }

  // POST /api/upload — save base64-encoded image to /uploads/
  if (req.url === '/api/upload' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const { filename, data } = body;
      const uploadsDir = path.join(__dirname, 'uploads');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

      const base64 = data.replace(/^data:[^;]+;base64,/, '');
      const safeFilename = path.basename(filename);
      const filePath = path.join(uploadsDir, safeFilename);
      fs.writeFile(filePath, base64, 'base64', err => {
        if (err) return json(res, 500, { error: 'Could not save file' });
        json(res, 200, { url: `/uploads/${safeFilename}` });
      });
    } catch {
      json(res, 400, { error: 'Invalid upload request' });
    }
    return;
  }

  // Static file serving
  let urlPath = req.url.split('?')[0];
  try { urlPath = decodeURIComponent(urlPath); } catch {}
  if (urlPath === '/') urlPath = '/index.html';

  const filePath = path.join(__dirname, urlPath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin.html`);
});
