const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const items = [
  {
    dest: 'public/images/grafting/veg_cleft_grafting.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Auberginen_Veredelung-2-Josef_Schlaghecken.jpg'
  },
  {
    dest: 'public/images/grafting/air_layering_guava.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Air-layering_on_a_avocado_tree_in_Goa%2C_India.jpg'
  },
  {
    dest: 'public/images/grafting/cleft_graft_tree.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/9/93/CleftGraft2ndYr.JPG'
  },
  {
    dest: 'public/images/grafting/grafting_knife_tools.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/3/36/Victorinox_Pruning_Knife_%288754348826%29.jpg'
  },
  {
    dest: 'public/images/grafting/tomato_graft.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/5/56/JfPlantsSRafaelGrafts666Bulacanfvf.JPG'
  }
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const fullDest = path.join(__dirname, dest);
    fs.mkdirSync(path.dirname(fullDest), { recursive: true });

    function get(u, count = 0) {
      if (count > 5) return reject(new Error('Redirect limit'));
      const c = u.startsWith('https') ? https : http;
      c.get(u, { headers: { 'User-Agent': 'SmartAgroBot/2.0 (saiful_islam_bk@smartagro.bd)' } }, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return get(res.headers.location, count + 1);
        }
        if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
        const stream = fs.createWriteStream(fullDest);
        res.pipe(stream);
        stream.on('finish', () => {
          stream.close();
          resolve(fs.statSync(fullDest).size);
        });
      }).on('error', reject);
    }
    get(url);
  });
}

async function main() {
  for (const item of items) {
    try {
      const sz = await download(item.url, item.dest);
      console.log('✅ Downloaded', item.dest, (sz / 1024 / 1024).toFixed(2), 'MB');
    } catch (e) {
      console.error('❌ Failed', item.dest, e.message);
    }
    await new Promise(r => setTimeout(r, 1200));
  }
}

main();

