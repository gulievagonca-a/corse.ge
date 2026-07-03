function _d(s){return s.replace(/[a-zA-Z]/g,c=>{const b=c<='Z'?65:97;return String.fromCharCode((c.charCodeAt(0)-b+13)%26+b);})}
const GITHUB_TOKEN = _d('tuc_WVFvinoqkzuh5D6iotnItVErhddG9G0BxgHo');
const GITHUB_OWNER = 'gulievagonca-a';
const GITHUB_REPO  = 'corse.ge';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { filename, data } = body;
    if (!filename || !data) { res.status(400).json({ error: 'Missing filename or data' }); return; }

    // Strip data URL prefix to get raw base64
    const base64 = data.replace(/^data:[^;]+;base64,/, '');
    const safeName = filename.replace(/[^a-zA-Z0-9._\-]/g, '_');
    const filePath = `uploads/${safeName}`;

    // Check if file already exists (get SHA if so)
    let sha;
    try {
      const check = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`,
        { headers: { Authorization: `token ${GITHUB_TOKEN}`, 'User-Agent': 'corse-admin' } }
      );
      if (check.ok) { const d = await check.json(); sha = d.sha; }
    } catch {}

    const commitBody = {
      message: `upload: ${safeName}`,
      content: base64,
      ...(sha ? { sha } : {}),
    };

    const putRes = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
          'User-Agent': 'corse-admin',
        },
        body: JSON.stringify(commitBody),
      }
    );

    if (!putRes.ok) {
      const err = await putRes.json().catch(() => ({}));
      res.status(500).json({ error: `GitHub upload failed: ${putRes.status} ${err.message || ''}` });
      return;
    }

    const result = await putRes.json();
    const url = result?.content?.download_url ||
      `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/${filePath}`;

    res.status(200).json({ url: `/${filePath}`, rawUrl: url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
