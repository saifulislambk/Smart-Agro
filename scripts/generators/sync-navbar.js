// ====================================================================
// Smart Agro (স্মার্ট এগ্রো) - Automated Navbar Synchronization Engine
// Reads public/components/navbar.html and synchronizes all 7 HTML pages
// ====================================================================

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../..');
const NAVBAR_COMPONENT_PATH = path.join(ROOT_DIR, 'public', 'components', 'navbar.html');
const HTML_FILES = [
  'index.html',
  'scan.html',
  'roadmap.html',
  'calculator.html',
  'crop-detail.html',
  'grafting.html',
  'history.html'
];

const UNIFIED_TAILWIND_CONFIG = `  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            forest: {
              950: '#06261c',
              900: '#0b3b2c',
              800: '#14532d',
              700: '#15803d',
              600: '#16a34a',
              500: '#22c55e',
              100: '#dcfce7',
              50: '#f0fdf4'
            },
            agro: {
              50: '#f4f8f5',
              100: '#e5f0e8',
              200: '#cce2d2',
              300: '#a3ccad',
              400: '#73af82',
              500: '#4e935e',
              600: '#3c774a',
              700: '#315f3c',
              800: '#2a4c32',
              900: '#0b3b2c',
              950: '#052219'
            },
            harvest: {
              50: '#fffbeb',
              100: '#fef3c7',
              500: '#d97706',
              600: '#b45309',
              700: '#92400e'
            }
          },
          fontFamily: {
            bengali: ['"Noto Sans Bengali"', '"Hind Siliguri"', 'sans-serif']
          }
        }
      }
    }
  </script>`;

function syncNavbar() {
  if (!fs.existsSync(NAVBAR_COMPONENT_PATH)) {
    console.error(`❌ Master navbar component missing: ${NAVBAR_COMPONENT_PATH}`);
    process.exit(1);
  }

  const navbarContent = fs.readFileSync(NAVBAR_COMPONENT_PATH, 'utf8');

  // 1. Extract master <header>
  const headerMatch = navbarContent.match(/<header[\s\S]*?<\/header>/i);
  if (!headerMatch) {
    console.error('❌ Could not parse <header> from navbar component.');
    process.exit(1);
  }
  const masterHeader = headerMatch[0];

  // 2. Extract master bottom <nav> (specifically with fixed bottom-)
  const bottomNavMatch = navbarContent.match(/<nav[^>]*fixed\s+bottom-[^>]*>[\s\S]*?<\/nav>/i);
  if (!bottomNavMatch) {
    console.error('❌ Could not parse bottom <nav> from navbar component.');
    process.exit(1);
  }
  const masterBottomNav = bottomNavMatch[0];

  // 3. Extract master mobile drawer
  const drawerMatch = navbarContent.match(/<div id="smart-agro-mobile-drawer"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/i);
  if (!drawerMatch) {
    console.error('❌ Could not parse #smart-agro-mobile-drawer from navbar component.');
    process.exit(1);
  }
  const masterDrawer = drawerMatch[0];

  console.log('🔄 Synchronizing Master Navbar & Palette across all 7 pages...');

  HTML_FILES.forEach(fileName => {
    const filePath = path.join(ROOT_DIR, 'public', fileName);
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ File not found: ${fileName}`);
      return;
    }

    let html = fs.readFileSync(filePath, 'utf8');

    // 1. Unify Tailwind config in <head>
    html = html.replace(/<script>\s*tailwind\.config\s*=[\s\S]*?<\/script>/i, UNIFIED_TAILWIND_CONFIG);

    // 2. Replace <header>...</header>
    html = html.replace(/<header[\s\S]*?<\/header>/i, masterHeader);

    // 3. Clean up any duplicate/stray <nav id="desktop-primary-nav"> in body/footer
    // Keep only the one inside <header>
    const headerEndIndex = html.indexOf('</header>') + 9;
    const bodyPart = html.substring(headerEndIndex);
    const cleanedBodyPart = bodyPart.replace(/<nav id="desktop-primary-nav"[\s\S]*?<\/nav>/gi, '');
    html = html.substring(0, headerEndIndex) + cleanedBodyPart;

    // 4. Clean up any stray old drawer leftovers (e.g., text-agro-900 arrow snippets)
    html = html.replace(/\s*<span class="text-xs text-agro-900 font-bold">➔<\/span>\s*<\/div>\s*<\/div>\s*<\/div>/g, '');

    // 5. Replace or insert bottom <nav>
    if (/<nav[^>]*fixed\s+bottom-[^>]*>[\s\S]*?<\/nav>/i.test(html)) {
      html = html.replace(/<nav[^>]*fixed\s+bottom-[^>]*>[\s\S]*?<\/nav>/i, masterBottomNav);
    } else if (html.includes('<div id="smart-agro-mobile-drawer"')) {
      html = html.replace('<div id="smart-agro-mobile-drawer"', masterBottomNav + '\n\n  <div id="smart-agro-mobile-drawer"');
    } else if (html.includes('</footer>')) {
      html = html.replace('</footer>', '</footer>\n\n  ' + masterBottomNav);
    }

    // 6. Replace mobile drawer
    if (/<div id="smart-agro-mobile-drawer"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/i.test(html)) {
      html = html.replace(/<div id="smart-agro-mobile-drawer"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/i, masterDrawer);
    }

    // 7. Ensure /js/navbar.js is loaded
    if (!html.includes('/js/navbar.js') && !html.includes('js/navbar.js')) {
      if (html.includes('<script src="/js/app.js"></script>')) {
        html = html.replace('<script src="/js/app.js"></script>', '<script src="/js/navbar.js"></script>\n  <script src="/js/app.js"></script>');
      } else if (html.includes('</body>')) {
        html = html.replace('</body>', '  <script src="/js/navbar.js"></script>\n</body>');
      }
    }

    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`   ✅ Synced: ${fileName}`);
  });

  console.log('🎉 Navbar & Palette synchronization completed successfully.');
}

if (require.main === module) {
  syncNavbar();
}

module.exports = { syncNavbar };
