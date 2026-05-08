import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = 'gulievagonca-a';
const GITHUB_REPO  = 'corse.ge';
const FILE_PATH    = 'products.json';

async function getFileSha() {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`, {
    headers: { Authorization: `token ${GITHUB_TOKEN}`, 'User-Agent': 'corse-admin' }
  });
  const data = await res.json();
  return data.sha;
}

async function commitFile(content, sha) {
  const body = {
    message: 'admin: update products',
    content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'),
    sha,
  };
  const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`, {
    method: 'PUT',
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'corse-admin',
    },
    body: JSON.stringify(body),
  });
  return res.ok;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  if (req.method === 'GET') {
    try {
      const filePath = path.join(__dirname, '..', 'products.json');
      const data = fs.readFileSync(filePath, 'utf8');
      res.setHeader('Content-Type', 'application/json');
      res.status(200).send(data);
    } catch {
      res.status(500).json({ error: 'Could not read products' });
    }
    return;
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const sha = await getFileSha();
      const ok  = await commitFile(body, sha);
      if (ok) {
        res.status(200).json({ ok: true });
      } else {
        res.status(500).json({ error: 'GitHub commit failed' });
      }
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
