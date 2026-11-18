// ====================================================================
// Smart Agro (স্মার্ট এগ্রো) - Unified Navbar & Navigation System
// Manages dynamic active link states, mobile drawer, and component sync
// ====================================================================

function initSmartAgroNavbar() {
  const currentPath = window.location.pathname.toLowerCase();
  
  // 1. Highlight Desktop Navigation Item in Main Header
  const desktopNavLinks = document.querySelectorAll('#main-header #desktop-primary-nav a');
  if (desktopNavLinks.length > 0) {
    desktopNavLinks.forEach(link => {
      const linkPath = (link.getAttribute('data-nav-path') || link.getAttribute('href') || '').toLowerCase();
      
      const isHome = (currentPath === '/' || currentPath === '/index.html' || currentPath === '') && (linkPath === '/' || linkPath === '/index.html');
      const isScan = (currentPath.includes('/scan')) && linkPath.includes('/scan');
      const isRoadmap = (currentPath.includes('/roadmap') || currentPath.includes('/crop-detail') || currentPath.includes('/guides')) && linkPath.includes('/roadmap');
      const isCalc = (currentPath.includes('/calculator') || currentPath.includes('/fertilizer')) && linkPath.includes('/calculator');
      const isGraft = (currentPath.includes('/grafting') || currentPath.includes('/nursery')) && linkPath.includes('/grafting');
      const isHist = (currentPath.includes('/history')) && linkPath.includes('/history');

      if (isHome || isScan || isRoadmap || isCalc || isGraft || isHist) {
        link.className = 'nav-active px-2 xl:px-3 py-1.5 rounded-lg text-xs font-black bg-forest-900 text-white shadow-2xs';
        link.style.backgroundColor = '#0b3b2c';
        link.style.color = '#ffffff';
        link.style.fontWeight = '900';
      } else {
        link.className = 'px-2 xl:px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:text-forest-900 hover:bg-slate-100 transition-colors';
        link.style.backgroundColor = '';
        link.style.color = '';
        link.style.fontWeight = '';
      }
    });
  }

  // 2. Highlight Mobile Floating Bottom Navigation
  const bottomNav = document.querySelector('nav.fixed.bottom-2\\.5, nav[class*="fixed bottom-"]');
  if (bottomNav) {
    const homeLink = bottomNav.querySelector('[data-nav-page="home"]');
    const scanContainer = bottomNav.querySelector('[data-nav-page="scanner"]')?.closest('div');
    const scanTitle = scanContainer?.querySelector('span');

    const isScanPage = currentPath.includes('/scan');
    const isHomePage = currentPath === '/' || currentPath === '/index.html' || currentPath === '';

    if (homeLink) {
      if (isHomePage) {
        homeLink.className = 'flex-1 flex flex-col items-center justify-center rounded-xl transition-all text-forest-900 font-black py-1';
      } else {
        homeLink.className = 'flex-1 flex flex-col items-center justify-center rounded-xl transition-all text-slate-600 hover:text-forest-900 font-bold py-1';
      }
    }

    if (scanTitle) {
      if (isScanPage) {
        scanTitle.className = 'text-[10px] mt-0.5 tracking-tight text-forest-900 font-black';
      } else {
        scanTitle.className = 'text-[10px] mt-0.5 tracking-tight text-slate-600 font-bold';
      }
    }
  }

  // 3. Highlight Links in Mobile Drawer
  const drawer = document.getElementById('smart-agro-mobile-drawer');
  if (drawer) {
    const drawerLinks = drawer.querySelectorAll('a[href]');
    drawerLinks.forEach(link => {
      const linkPath = link.getAttribute('href').toLowerCase();
      const isActive = ((currentPath.includes('/roadmap') || currentPath.includes('/crop-detail')) && linkPath.includes('/roadmap')) ||
                       (currentPath.includes('/calculator') && linkPath.includes('/calculator')) ||
                       (currentPath.includes('/grafting') && linkPath.includes('/grafting')) ||
                       (currentPath.includes('/history') && linkPath.includes('/history'));
      
      if (isActive) {
        link.classList.remove('bg-slate-50', 'text-slate-800', 'border-slate-200');
        link.classList.add('bg-emerald-50', 'border-emerald-300', 'text-forest-900', 'font-black');
      }
    });
  }
}

// Global function to toggle mobile bottom drawer
function toggleSmartAgroMobileMenu(forceState) {
  const drawer = document.getElementById('smart-agro-mobile-drawer');
  if (!drawer) return;

  const shouldOpen = forceState !== undefined ? forceState : drawer.classList.contains('hidden');
  if (shouldOpen) {
    drawer.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  } else {
    drawer.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

// Global escape listener for mobile drawer
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    toggleSmartAgroMobileMenu(false);
  }
});

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSmartAgroNavbar);
} else {
  initSmartAgroNavbar();
}

window.SmartAgroNavbar = {
  init: initSmartAgroNavbar,
  toggleMenu: toggleSmartAgroMobileMenu
};
