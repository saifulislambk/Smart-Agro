const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const newCropSearches = [
  { crop: 'guava', query: 'Psidium guajava tree fruit' },
  { crop: 'lemon', query: 'Citrus limon lemon tree fruit' },
  { crop: 'mango', query: 'Mangifera indica tree fruit' },
  { crop: 'dragon_fruit', query: 'Hylocereus undatus dragon fruit' },
  { crop: 'malta', query: 'Citrus sinensis orange tree' },
  { crop: 'pointed_gourd', query: 'Trichosanthes dioica' },
  { crop: 'malabar_spinach', query: 'Basella alba plant' },
  { crop: 'water_spinach', query: 'Ipomoea aquatica water spinach' },
  { crop: 'taro_loti', query: 'Colocasia esculenta plant taro' },
  { crop: 'snake_gourd', query: 'Trichosanthes cucumerina snake gourd' },
  { crop: 'ridge_gourd', query: 'Luffa acutangula ridge gourd' },
  { crop: 'ash_gourd', query: 'Benincasa hispida ash gourd' }
];

function searchCommons(term) {
  return new Promise((resolve) => {
    const url = 'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=' + encodeURIComponent(term + ' filetype:bitmap') + '&prop=imageinfo&iiprop=url|size|mime&gsrlimit=3&format=json';
    https.get(url, { headers: { 'User-Agent': 'SmartAgroBot/2.0 (contact@smartagro.bd; Education)' } }, res => {
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

    function get(currentUrl, count = 0) {
      if (count > 5) return reject(new Error('Redirect limit'));
      const client = currentUrl.startsWith('https') ? https : http;
      client.get(currentUrl, {
        headers: { 'User-Agent': 'SmartAgroBot/2.0 (contact@smartagro.bd)' }
      }, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return get(res.headers.location, count + 1);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        const file = fs.createWriteStream(fullDest);
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(fs.statSync(fullDest).size);
        });
      }).on('error', reject);
    }
    get(url);
  });
}

async function main() {
  console.log('Downloading images for new crops...');
  for (const item of newCropSearches) {
    const destCrop = `public/images/crops/${item.crop}.jpg`;
    const destHarvest = `public/images/harvest/${item.crop}_harvest.jpg`;
    const destSeed = `public/images/seeds/${item.crop}_seed.jpg`;
    const destSeedling = `public/images/seedlings/${item.crop}_seedling.jpg`;

    console.log(`Searching for: ${item.crop}...`);
    const url = await searchCommons(item.query);
    if (url) {
      try {
        const sz = await downloadFile(url, destCrop);
        console.log(`  ✅ Downloaded ${destCrop} (${(sz/1024).toFixed(0)} KB)`);
        // Copy to other folders for completeness
        fs.copyFileSync(destCrop, destHarvest);
        fs.copyFileSync(destCrop, destSeed);
        fs.copyFileSync(destCrop, destSeedling);
      } catch (err) {
        console.error(`  ❌ Error downloading ${item.crop}:`, err.message);
      }
    } else {
      console.warn(`  ⚠️ No URL found for ${item.crop}`);
    }
    await new Promise(r => setTimeout(r, 1200));
  }
  console.log('Finished downloading new crops images!');
}

main();

