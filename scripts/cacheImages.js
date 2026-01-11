// Download commonly reused images into public/assets using available provider keys
// Prefers Pexels, then Pixabay, then Unsplash

const fs = require('node:fs');
const path = require('node:path');
const https = require('node:https');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const manifestPath = path.resolve(process.cwd(), 'assets-manifest.json');
const PEXELS_KEY = process.env.REACT_APP_PEXELS_API_KEY || '';
const PIXABAY_KEY = process.env.REACT_APP_PIXABAY_API_KEY || '';
const UNSPLASH_KEY = process.env.REACT_APP_UNSPLASH_ACCESS_KEY || '';

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

function downloadToFile(imageUrl, outFile) {
  return new Promise((resolve, reject) => {
    ensureDir(outFile);
    const file = fs.createWriteStream(outFile);
    const req = https.get(imageUrl, res => {
      if (res.statusCode !== 200) {
        reject(new Error(`Download failed ${res.statusCode}: ${imageUrl}`));
        res.resume();
        return;
      }
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve(outFile)));
    });
    req.on('error', reject);
  });
}

async function fetchJson(options) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${options.method || 'GET'} ${options.path}`));
        }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function findImageUrl(query) {
  const encoded = encodeURIComponent(query);
  // Pexels
  if (PEXELS_KEY) {
    try {
      const data = await fetchJson({
        hostname: 'api.pexels.com',
        path: `/v1/search?query=${encoded}&per_page=1&orientation=landscape`,
        method: 'GET',
        headers: { Authorization: PEXELS_KEY }
      });
      const photo = data?.photos?.[0];
      const url = photo?.src?.large || photo?.src?.medium;
      if (url) return url;
    } catch {}
  }
  // Pixabay
  if (PIXABAY_KEY) {
    try {
      const data = await fetchJson({
        hostname: 'pixabay.com',
        path: `/api/?key=${PIXABAY_KEY}&q=${encoded}&image_type=photo&orientation=horizontal&per_page=3&category=travel`,
        method: 'GET'
      });
      const hit = data?.hits?.[0];
      const url = hit?.largeImageURL || hit?.webformatURL;
      if (url) return url;
    } catch {}
  }
  // Unsplash (note API terms restrict persistent storage; use responsibly)
  if (UNSPLASH_KEY) {
    try {
      const data = await fetchJson({
        hostname: 'api.unsplash.com',
        path: `/search/photos?query=${encoded}&orientation=landscape&content_filter=high&per_page=1`,
        method: 'GET',
        headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` }
      });
      const result = data?.results?.[0];
      const url = result?.urls?.regular || result?.urls?.small;
      if (url) return url;
    } catch {}
  }
  return null;
}

async function run() {
  if (!fs.existsSync(manifestPath)) {
    console.error('assets-manifest.json not found');
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  for (const item of manifest.items) {
    const outFile = path.resolve(process.cwd(), item.out);
    if (fs.existsSync(outFile)) {
      console.log(`✔ Skipped (exists): ${item.name}`);
      continue;
    }
    const parts = [];
    if (item.category === 'food') {
      parts.push(item.name, 'food', 'street food', 'dish');
    } else {
      parts.push(item.name, 'travel', 'landmark', 'skyline');
    }
    const query = parts.join(' ');
    const imageUrl = await findImageUrl(query);
    if (!imageUrl) {
      console.warn(`✖ No image found for ${item.name}`);
      continue;
    }
    try {
      await downloadToFile(imageUrl, outFile);
      console.log(`⬇ Saved: ${item.name} → ${item.out}`);
    } catch (e) {
      console.warn(`✖ Failed to save ${item.name}: ${e.message}`);
    }
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
