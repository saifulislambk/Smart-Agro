// ====================================================================
// Smart Agro (স্মার্ট এগ্রো) - Native Mobile Bridge & API Router
// Automatically routes /api/* to live HTTPS backend in Android WebView
// ====================================================================

(function () {
  const LIVE_BACKEND_URL = 'https://smartagrobd.vercel.app';

  // Check if running inside Capacitor Android container or local app shell
  const isCapacitorNative = () => {
    return Boolean(
      (window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform()) ||
      window.location.protocol === 'capacitor:' ||
      (window.location.hostname === 'localhost' && !window.location.port)
    );
  };

  // Safe global fetch wrapper
  if (typeof window !== 'undefined' && window.fetch) {
    const originalFetch = window.fetch;
    window.fetch = function (resource, init) {
      if (isCapacitorNative() && typeof resource === 'string' && resource.startsWith('/api/')) {
        resource = LIVE_BACKEND_URL + resource;
      }
      return originalFetch.call(this, resource, init);
    };
  }

  // Handle Android Hardware Back Button
  document.addEventListener('DOMContentLoaded', () => {
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
      window.Capacitor.Plugins.App.addListener('backButton', ({ canGoBack }) => {
        // If modal is open, close modal first
        const accountModal = document.getElementById('smart-agro-account-modal');
        const loginModal = document.getElementById('login-modal');
        const drawer = document.getElementById('smart-agro-mobile-drawer');

        if (accountModal) {
          accountModal.remove();
          return;
        }
        if (loginModal && !loginModal.classList.contains('hidden')) {
          loginModal.classList.add('hidden');
          return;
        }
        if (drawer && !drawer.classList.contains('hidden')) {
          drawer.classList.add('hidden');
          return;
        }

        if (canGoBack && window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
          window.history.back();
        } else {
          window.Capacitor.Plugins.App.exitApp();
        }
      });
    }
  });

  window.SMART_AGRO_LIVE_URL = LIVE_BACKEND_URL;
  window.isSmartAgroNative = isCapacitorNative;
})();
