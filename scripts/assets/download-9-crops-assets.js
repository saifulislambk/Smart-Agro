const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const downloads = [
  // 1. Paddy / Rice
  {
    dest: 'public/images/crops/rice.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/b/b4/Rice_paddy_taken_closely.jpg'
  },
  {
    dest: 'public/images/seedlings/rice_seedling.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/2/29/%E0%A6%A7%E0%A6%BE%E0%A6%A8_%E0%A6%97%E0%A6%BE%E0%A6%9B%E0%A7%87%E0%A6%B0_%E0%A6%9A%E0%A6%BE%E0%A6%B0%E0%A6%BE.jpg'
  },
  {
    dest: 'public/images/harvest/rice_harvest.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/3/32/Rice_panicle_in_Bangladesh.jpg'
  },

  // 2. Eggplant
  {
    dest: 'public/images/crops/eggplant.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/7/76/Solanum_melongena_24_08_2012_%281%29.JPG'
  },
  {
    dest: 'public/images/seeds/eggplant_seed.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/3/31/Solanum_melongena_seeds.jpg'
  },
  {
    dest: 'public/images/seedlings/eggplant_seedling.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/7/74/Four_solanum_melongena_seedlings_in_pots.jpg'
  },
  {
    dest: 'public/images/harvest/eggplant_harvest.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/d/dd/Three_eggplant_fruits_harvest.jpg'
  },

  // 3. Bitter Gourd
  {
    dest: 'public/images/crops/bitter_gourd.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Momordica_charantia_%28Bitter_Melon%29_vine_on_a_fence.jpg'
  },
  {
    dest: 'public/images/seeds/bitter_gourd_seed.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/1/14/Momordica_charantia_seeds.jpg'
  },
  {
    dest: 'public/images/harvest/bitter_gourd_harvest.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Momordica_charantia_pic.jpg'
  },

  // 4. Sweet Gourd / Pumpkin
  {
    dest: 'public/images/crops/sweet_gourd.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/6/69/Cucurbita_2011_G1.jpg'
  },
  {
    dest: 'public/images/seeds/sweet_gourd_seed.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/4/4f/Pumpkin_Seeds_macro_1.jpg'
  },
  {
    dest: 'public/images/harvest/sweet_gourd_harvest.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/8/84/Pumpkin_festival_-_Ludwigsburg_2024_-_28.jpg'
  },

  // 5. Mustard
  {
    dest: 'public/images/crops/mustard.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/3/3f/Lecture%2C_%22How_God_made_the_soil_fertile%22_-_mustard_field.jpg'
  },
  {
    dest: 'public/images/seeds/mustard_seed.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/3/3a/%E0%AE%95%E0%AE%9F%E0%AF%81%E0%AE%95%E0%AF%81_%28Mustard_seeds%29.jpg'
  },
  {
    dest: 'public/images/harvest/mustard_harvest.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/9/90/Rapsfeld_Rapeseed_Brassica_napus.jpg'
  },

  // 6. Lentil
  {
    dest: 'public/images/crops/lentil.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/2/21/Lygus_bugs_and_seed_quality_on_lentils_Lens_culinaris_plant.jpg'
  },
  {
    dest: 'public/images/seeds/lentil_seed.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Lentils_red_and_brown.jpg'
  },
  {
    dest: 'public/images/harvest/lentil_harvest.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Principles_and_practices_of_pulse_production_-_red_lentils.jpg'
  },

  // 7. Ginger
  {
    dest: 'public/images/crops/ginger.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/2/23/Ingwer_%28Zingiber_officinale%29_Freiland_Anbau_Pflanze-2-Josef_Schlaghecken.jpg'
  },
  {
    dest: 'public/images/seeds/ginger_seed.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/f/fb/Fresh_ginger_rhizome_01.jpg'
  },
  {
    dest: 'public/images/harvest/ginger_harvest.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/f/fb/Fresh_ginger_rhizome_01.jpg'
  },

  // 8. Turmeric
  {
    dest: 'public/images/crops/turmeric.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/7/7f/A_vibrant_inflorescence_of_a_Curcuma_longa_plant%2C_locally_known_as_Haldhi_Phool_in_Assam%2C_blooming_amidst_lush_green_foliage.jpg'
  },
  {
    dest: 'public/images/seeds/turmeric_seed.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/5/5b/Curcuma_longa_roots.jpg'
  },
  {
    dest: 'public/images/harvest/turmeric_harvest.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/5/5b/Curcuma_longa_roots.jpg'
  },

  // 9. Data Shak / Stem Amaranth
  {
    dest: 'public/images/crops/stem_amaranth.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/2/20/Amaranthus_viridis_25042014_1.jpg'
  },
  {
    dest: 'public/images/seeds/stem_amaranth_seed.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/6/68/Amaranthus_hybridus_seeds.jpg'
  },
  {
    dest: 'public/images/seedlings/stem_amaranth_seedling.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Amaranthus_viridis_22052014.jpg'
  },
  {
    dest: 'public/images/harvest/stem_amaranth_harvest.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/2/20/Amaranthus_viridis_25042014_1.jpg'
  }
];

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const fullDest = path.join(__dirname, dest);
    fs.mkdirSync(path.dirname(fullDest), { recursive: true });

    function get(currentUrl, redirects = 0) {
      if (redirects > 5) return reject(new Error('Too many redirects'));
      
      const client = currentUrl.startsWith('https') ? https : http;
      const req = client.get(currentUrl, {
        headers: {
          'User-Agent': 'SmartAgroBot/2.0 (saiful_islam_bk@smartagro.bd; AgriculturalEducation)'
        }
      }, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return get(res.headers.location, redirects + 1);
        }

        if (res.statusCode !== 200) {
          return reject(new Error(`Failed with HTTP ${res.statusCode}`));
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

async function run() {
  console.log(`Starting download of ${downloads.length} targeted agricultural images...`);
  for (let i = 0; i < downloads.length; i++) {
    const item = downloads[i];
    console.log(`[${i + 1}/${downloads.length}] Downloading ${item.dest}...`);
    try {
      const sz = await downloadFile(item.url, item.dest);
      console.log(`  ✅ Success: ${item.dest} (${(sz / 1024 / 1024).toFixed(2)} MB)`);
    } catch (e) {
      console.error(`  ❌ Failed: ${item.dest} - ${e.message}`);
    }
    // Respect rate limits with 1.2s delay
    await new Promise(r => setTimeout(r, 1200));
  }
  console.log('Finished downloading all targeted images!');
}

run();

