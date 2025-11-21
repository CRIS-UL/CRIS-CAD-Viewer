// scripts/download-lfs-object.js
// Usage:
//   node scripts/download-lfs-object.js --repo owner/repo --pointer path/to/pointer --out downloaded.bin
// Environment:
//   GITHUB_TOKEN (required) OR pass --token <token>
// Notes: Run on a server or locally (do NOT put token in client-side code).

import fs from 'fs';
import fsPromises from 'fs/promises';
import { pipeline } from 'stream/promises';
import { argv, env, exit } from 'process';

async function getFetch() {
  if (typeof globalThis.fetch === 'function') return globalThis.fetch;
  // dynamic import node-fetch if needed
  try {
    const pkg = await import('node-fetch');
    return pkg.default;
  } catch (err) {
    throw new Error('No global fetch and failed to import node-fetch. Install node-fetch or run on Node 18+.');
  }
}

function parseArgs() {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const val = argv[i+1] && !argv[i+1].startsWith('--') ? argv[++i] : true;
      args[key] = val;
    }
  }
  return args;
}

function parseLfsPointer(text) {
  const oidMatch = text.match(/oid sha256:([0-9a-f]{64})/);
  const sizeMatch = text.match(/size (\d+)/);
  if (!oidMatch) throw new Error('Not an LFS pointer (missing oid)');
  return { oid: oidMatch[1], size: Number(sizeMatch ? sizeMatch[1] : 0) };
}

async function requestBatch(fetch, owner, repo, token, oid, size) {
  const url = `https://github.com/${owner}/${repo}.git/info/lfs/objects/batch`;
  const body = {
    operation: 'download',
    transfers: ['basic'],
    objects: [{ oid, size }]
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'application/vnd.git-lfs+json',
      'Content-Type': 'application/vnd.git-lfs+json',
      'Authorization': `token ${token}`
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`LFS batch request failed ${res.status} ${res.statusText}: ${txt}`);
  }
  return res.json();
}

async function downloadFromHref(fetch, href, headers, outPath) {
  const res = await fetch(href, { headers, redirect: 'follow' });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Download failed ${res.status} ${res.statusText}: ${txt}`);
  }
  // stream to file
  const dest = fs.createWriteStream(outPath);
  // res.body should be a Node Readable stream in Node 18+ or node-fetch
  await pipeline(res.body, dest);
}

(async () => {
  try {
    const args = parseArgs();
    const fetch = await getFetch();

    const repoArg = args.repo || env.GITHUB_REPO;
    if (!repoArg) throw new Error('Repository not specified. Use --repo owner/repo or set GITHUB_REPO.');
    const [owner, repo] = repoArg.split('/');
    if (!owner || !repo) throw new Error('Invalid repo format. Use owner/repo');

    const token = args.token || env.GITHUB_TOKEN;
    if (!token) throw new Error('Missing GITHUB_TOKEN. Set env GITHUB_TOKEN or pass --token.');

    const pointerPath = args.pointer || 'models/model.bin';
    const outPath = args.out || 'downloaded-model.bin';

    const pointerText = await fsPromises.readFile(pointerPath, 'utf8');
    const { oid, size } = parseLfsPointer(pointerText);

    console.log(`Requesting LFS object oid=${oid} size=${size} for ${owner}/${repo}...`);
    const batch = await requestBatch(fetch, owner, repo, token, oid, size);

    const obj = batch.objects && batch.objects[0];
    if (!obj || !obj.actions || !obj.actions.download) {
      console.error('Batch response did not include a download action:', JSON.stringify(batch, null, 2));
      throw new Error('No download action available for object (maybe unauthorized or object missing).');
    }

    const { href, header } = obj.actions.download;
    const headers = header || {};
    console.log(`Downloading object from: ${href}`);
    await downloadFromHref(fetch, href, headers, outPath);
    console.log(`Saved to ${outPath}`);
  } catch (err) {
    console.error('Error:', err.message || err);
    exit(1);
  }
})();