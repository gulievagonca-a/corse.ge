import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  const filePath = path.join(__dirname, '..', 'content.json');

  if (req.method === 'GET') {
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      res.setHeader('Content-Type', 'application/json');
      res.status(200).send(data);
    } catch {
      res.status(500).json({ error: 'Could not read content' });
    }
    return;
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      fs.writeFileSync(filePath, JSON.stringify(body, null, 2));
      res.status(200).json({ ok: true });
    } catch {
      res.status(400).json({ error: 'Invalid JSON' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
