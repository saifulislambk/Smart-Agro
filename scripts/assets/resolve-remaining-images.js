const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const targets = [
  {
    dest: 'public/images/seedlings/eggplant_seedling.jpg',
    query: 'eggplant seedling Solanum melongena'
  },
  {
    dest: 'public/images/harvest/eggplant_harvest.jpg',
    query: 'Solanum melongena fruits harvest eggplant'
  },
  {
    dest: 'public/images/seeds/bitter_gourd_seed.jpg',
    query: 'Momordica charantia seeds'
  },
  {
    dest: 'public/images/crops/mustard.jpg',
    query: 'Brassica napus yellow flowers field'
  },
  {
    dest: 'public/images/seeds/mustard_seed.jpg',
    query: 'mustard seeds Brassica'
  },
  {
    dest: 'public/images/crops/lentil.jpg',
    query: 'Lens culinaris field'
  },
  {
    dest: 'public/images/harvest/lentil_harvest.jpg',
    query: 'Lens culinaris red lentils seeds'
  },
  {
    dest: 'public/images/seeds/stem_amaranth_seed.jpg',
    query: 'Amaranthus seeds'
  },
  {
    dest: 'public/images/seeds/rice_seed.jpg',
    query: 'Oryza sativa grain paddy seeds unhusked'
  }
];

function searchCommons(term) {
  return new Promise((resolve) => {
    const url = 'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=' + encodeURIComponent(term) + '&prop=imageinfo&iiprop=url|size|mime&gsrlimit=3&format=json';
    https.get(url, { headers: { 'User-Agent': 'SmartAgroBot/2.0 (contact@smartagro.bd; AgriculturalApp)' } }, res => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(d);
          const pages = Object.values(json.query.pages);
          for (const p of pages) {
            if (p.imageinfo && p.imageinfo[0] && p.imageinfo[0].url) {
              const mime = p.imageinfo[0].mime || '';
              if (mime.includes('image') && !mime.includes('svg')) {
                return resolve(p.imageinfo[0].url);
              }
            }
          }
          resolve(null);
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const fullDest = path.join(__dirname, dest);
    fs.mkdirSync(path.dirname(fullDest), { recursive: true });

    function get(currentUrl, redirects = 0) {
      if (redirects > 5) return reject(new Error('Too many redirects'));
      const client = currentUrl.startsWith('https') ? https : http;
      const req = client.get(currentUrl, {
        headers: { 'User-Agent': 'SmartAgroBot/2.0 (contact@smartagro.bd; AgriculturalApp)' }
      }, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return get(res.headers.location, redirects + 1);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        const file = fs.createWriteStream(fullDest);
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          const sz = fs.statSync(fullDest).size;
          resolve(sz);
        });
      });
      req.on('error', reject);
    }
    get(url);
  });
}

async function main() {
  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    console.log(`[${i + 1}/${targets.length}] Searching Commons for: ${t.query}...`);
    const liveUrl = await searchCommons(t.query);
    if (!liveUrl) {
      console.error(`  ❌ No URL found for: ${t.query}`);
      continue;
    }
    console.log(`  Found URL: ${liveUrl.substring(0, 80)}...`);
    try {
      const sz = await downloadFile(liveUrl, t.dest);
      console.log(`  ✅ Downloaded ${t.dest} (${(sz / 1024).toFixed(1)} KB)`);
    } catch (e) {
      console.error(`  ❌ Download error: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 1200));
  }
}

main();

