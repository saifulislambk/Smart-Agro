const fs = require('fs');
const path = require('path');
const http = require('http');

async function checkAsset(url) {
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('tel:') || url.startsWith('mailto:') || url.startsWith('#')) {
    return true;
  }
  return new Promise((resolve) => {
    http.get('http://localhost:3000' + url, (res) => {
      resolve(res.statusCode < 400);
    }).on('error', () => resolve(false));
  });
}

async function verifyAllHtmlAssets() {
  const htmlFiles = ['index.html', 'roadmap.html', 'calculator.html', 'history.html'];
  let allOk = true;

  for (const file of htmlFiles) {
    const content = fs.readFileSync(path.join(__dirname, 'public', file), 'utf-8');
    const regex = /(?:src|href)=["']([^"']+)["']/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const target = match[1];
      if (target.startsWith('/') && !target.startsWith('//')) {
        const ok = await checkAsset(target);
        if (!ok) {
          console.error(`❌ Broken link in ${file}: ${target}`);
          allOk = false;
        } else {
          console.log(`  ✓ ${file} -> ${target} (OK)`);
        }
      }
    }
  }

  if (allOk) {
    console.log('\n✅ All internal assets and links across all 4 pages resolved to HTTP 200/300!');
  } else {
    process.exit(1);
  }
}

verifyAllHtmlAssets();
