// ====================================================================
// Smart Agro (স্মارت এগ্রো) - Master Frontend Application Coordinator
// ====================================================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Auth and Profile UI on All Pages
  setupAuthUI();

  // 2. Initialize Weather & Live Location Tracking on All Pages
  if (window.SmartAgroWeather) {
    SmartAgroWeather.initWeather();
  }

  // 3. Initialize Bengali Voice Assistant
  if (window.SmartAgroVoice) {
    SmartAgroVoice.initVoiceAssistant();
  }

  // 4. Highlight Active Navigation Links based on Current URL
  highlightActiveNavigation();

  // 5. Page-Specific Module Initialization
  const currentPath = window.location.pathname.toLowerCase();

  if (currentPath.includes('crop-detail') || currentPath.includes('crop-guide')) {
    if (window.SmartAgroCropDetail) SmartAgroCropDetail.initCropDetail();
  } else if (currentPath.includes('grafting') || currentPath.includes('nursery') || currentPath.includes('kalom')) {
    if (window.SmartAgroGrafting) SmartAgroGrafting.initGrafting();
  } else if (currentPath.includes('roadmap') || currentPath.includes('guides')) {
    if (window.SmartAgroGuides) SmartAgroGuides.initGuides();
  } else if (currentPath.includes('calculator') || currentPath.includes('fertilizer')) {
    if (window.SmartAgroFertilizer) SmartAgroFertilizer.initFertilizerCalculator();
  } else if (currentPath.includes('history')) {
    if (window.SmartAgroHistory) SmartAgroHistory.initHistoryPage();
  } else if (currentPath.includes('scan') || currentPath.includes('scanner')) {
    if (window.SmartAgroScanner && window.SmartAgroScanner.init) SmartAgroScanner.init();
  }
});

// Highlight Current Page in Navigation Dock & Mobile Bottom Bar
function highlightActiveNavigation() {
  const currentPath = window.location.pathname.toLowerCase();
  let activeKey = 'home';

  if (currentPath.includes('scan') || currentPath.includes('scanner')) {
    activeKey = 'scanner';
  } else if (currentPath.includes('grafting') || currentPath.includes('nursery') || currentPath.includes('kalom')) {
    activeKey = 'grafting';
  } else if (currentPath.includes('roadmap') || currentPath.includes('guides') || currentPath.includes('crop-detail') || currentPath.includes('crop-guide')) {
    activeKey = 'roadmap';
  } else if (currentPath.includes('calculator') || currentPath.includes('fertilizer')) {
    activeKey = 'calculator';
  } else if (currentPath.includes('history')) {
    activeKey = 'history';
  }

  const navLinks = document.querySelectorAll('[data-nav-page]');
  navLinks.forEach(link => {
    const pageKey = link.getAttribute('data-nav-page');
    const isMobile = link.hasAttribute('data-mobile-nav');

    if (pageKey === activeKey) {
      if (isMobile) {
        link.className = 'flex flex-col items-center justify-center py-2 rounded-xl bg-emerald-600 text-white font-black text-xs transition-all shadow-md';
      } else {
        link.className = 'px-6 py-3 rounded-xl font-black text-sm transition-all duration-300 bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 flex items-center space-x-2';
      }
    } else {
      if (isMobile) {
        link.className = 'flex flex-col items-center justify-center py-2 rounded-xl text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 font-bold text-xs transition-all';
      } else {
        link.className = 'px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 flex items-center space-x-2';
      }
    }
  });
}

// Auth UI Coordinator across all pages
function setupAuthUI() {
  const loginBtn = document.getElementById('auth-login-btn');
  const userProfile = document.getElementById('user-profile-widget');
  const userAvatar = document.getElementById('user-avatar');
  const userName = document.getElementById('user-name');
  const userRole = document.getElementById('user-role');
  const profileDropdown = document.getElementById('user-profile-dropdown');

  // Trigger login modal
  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      if (window.SmartAgroAuth) {
        SmartAgroAuth.openLoginModal();
      }
    });
  }

  // Toggle user profile dropdown
  if (userProfile) {
    userProfile.addEventListener('click', (e) => {
      // Don't toggle if clicked directly on logout inside dropdown
      if (e.target.id !== 'auth-logout-btn' && !e.target.closest('#auth-logout-btn')) {
        if (window.SmartAgroAuth) {
          SmartAgroAuth.toggleProfileDropdown();
        }
      }
    });
  }

  // Dropdown actions
  const dropdownLogoutBtn = document.getElementById('dropdown-logout-btn');
  if (dropdownLogoutBtn) {
    dropdownLogoutBtn.addEventListener('click', () => {
      if (window.SmartAgroAuth) {
        SmartAgroAuth.signOutUser();
      }
    });
  }

  const dropdownSwitchBtn = document.getElementById('dropdown-switch-btn');
  if (dropdownSwitchBtn) {
    dropdownSwitchBtn.addEventListener('click', () => {
      if (window.SmartAgroAuth) {
        SmartAgroAuth.closeProfileDropdown();
        SmartAgroAuth.openLoginModal();
      }
    });
  }

  // Subscribe to auth state updates
  if (window.SmartAgroAuth) {
    SmartAgroAuth.onAuthStateChanged(user => {
      if (user) {
        if (loginBtn) loginBtn.classList.add('hidden');
        if (userProfile) userProfile.classList.remove('hidden');
        if (userName) userName.innerText = user.displayName;
        if (userRole) userRole.innerText = user.badge || user.role || 'কৃষক সদস্য';
        if (userAvatar) userAvatar.src = user.photoURL || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150';

        // Update dropdown details if elements exist
        const menuName = document.getElementById('menu-user-name');
        const menuEmail = document.getElementById('menu-user-email');
        const menuRole = document.getElementById('menu-user-role');
        const menuAvatar = document.getElementById('menu-user-avatar');

        if (menuName) menuName.innerText = user.displayName;
        if (menuEmail) menuEmail.innerText = user.email || 'farmer@smartagro.bd';
        if (menuRole) menuRole.innerText = user.role || 'যাচাইকৃত কৃষক';
        if (menuAvatar) menuAvatar.src = user.photoURL || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150';
      } else {
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (userProfile) userProfile.classList.add('hidden');
        if (profileDropdown) profileDropdown.classList.add('hidden');
      }
    });
  }
}
