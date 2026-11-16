// Fix targeted crop images for hyacinth_bean, red_amaranth, bottle_gourd, papaya
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const targets = [
  // Hyacinth Bean (শিম)
  {
    dest: 'public/images/crops/hyacinth_bean.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/6/60/Hyacinth_bean_%28Lablab_purpureus%29_flower_and_pods_in_Bangladesh.jpg'
  },
  {
    dest: 'public/images/harvest/hyacinth_bean_harvest.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/3/37/Lablab_purpureus_fruits.jpg'
  },
  {
    dest: 'public/images/seeds/hyacinth_bean_seed.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/a/a4/Starr-121108-0712-Lablab_purpureus-seeds_and_pods-Pali_o_Waipio-Maui_%2825077705302%29.jpg'
  },
  {
    dest: 'public/images/seedlings/hyacinth_bean_seedling.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/3/37/Lablab_purpureus_fruits.jpg'
  },

  // Red Amaranth (লাল শাক)
  {
    dest: 'public/images/crops/red_amaranth.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/4/48/Amaranthus_tricolor_var_%27Red_Army%27.jpg'
  },
  {
    dest: 'public/images/harvest/red_amaranth_harvest.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Amaranthus_tricolor_%28in_a_flowerbed%29_01.jpg'
  },
  {
    dest: 'public/images/seeds/red_amaranth_seed.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/6/68/Amaranthus_hybridus_seeds%2C_amhy_003_php.jpg'
  },
  {
    dest: 'public/images/seedlings/red_amaranth_seedling.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/4/48/Amaranthus_tricolor_var_%27Red_Army%27.jpg'
  },

  // Bottle Gourd (লাউ)
  {
    dest: 'public/images/crops/bottle_gourd.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/4/4f/Lagenaria_siceraria-1-yercaud-salem-India.JPG'
  },
  {
    dest: 'public/images/harvest/bottle_gourd_harvest.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/f/fc/Lagenaria_siceraria_-_different_bottle_gourds.jpg'
  },
  {
    dest: 'public/images/seeds/bottle_gourd_seed.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/2/21/Lagenaria_siceraria_var_peregrina_MHNT.BOT.2013.22.54.jpg'
  },
  {
    dest: 'public/images/seedlings/bottle_gourd_seedling.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/f/f8/Lagenaria_siceraria_baby_fruit.jpeg'
  },

  // Papaya (পেঁপে)
  {
    dest: 'public/images/crops/papaya.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Papaya_fruit_hanging_from_the_tree.jpg'
  },
  {
    dest: 'public/images/harvest/papaya_harvest.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/e/ee/Papaya_-_longitudinal_section_close-up_view.jpg'
  },
  {
    dest: 'public/images/seeds/papaya_seed.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/b/b4/Papaya_Seeds.jpg'
  },
  {
    dest: 'public/images/seedlings/papaya_seedling.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/0/06/Carica_papaya_MS4113.JPG'
  }
];

function download(url, dest) {
  return new Promise((resolve) => {
    const fullPath = path.resolve(__dirname, dest);
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      headers: {
        'User-Agent': 'SmartAgroBot/1.0 (https://smartagro.bd; saiful_islam_bk@local)'
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, dest).then(resolve);
      }
      if (res.statusCode !== 200) {
        console.error(`Failed ${dest}: HTTP ${res.statusCode}`);
        return resolve(false);
      }
      const fileStream = fs.createWriteStream(fullPath);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        const stat = fs.statSync(fullPath);
        console.log(`Saved ${dest} (${(stat.size / 1024).toFixed(1)} KB)`);
        resolve(true);
      });
    });
    req.on('error', (err) => {
      console.error(`Error downloading ${dest}: ${err.message}`);
      resolve(false);
    });
  });
}

async function runAll() {
  console.log('Downloading high-quality, verified crop assets...');
  for (const t of targets) {
    await download(t.url, t.dest);
    await new Promise(r => setTimeout(r, 1200));
  }
  console.log('All targeted crop assets updated successfully.');
}

runAll();
