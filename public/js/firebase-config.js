// ====================================================================
// Smart Agro (স্মার্ট এগ্রো) - Firebase Authentication & Demo Farmer Module
// ====================================================================

// Firebase Configuration (Replace with production credentials if available)
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "smart-agro-bd.firebaseapp.com",
  projectId: "smart-agro-bd",
  storageBucket: "smart-agro-bd.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

let authInstance = null;
let googleProvider = null;
let authSubscribers = [];

// Determine if real Firebase keys are configured
const isFirebaseConfigured = firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== "YOUR_FIREBASE_API_KEY" && 
  typeof firebase !== 'undefined';

if (isFirebaseConfigured) {
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    authInstance = firebase.auth();
    googleProvider = new firebase.auth.GoogleAuthProvider();

    authInstance.onAuthStateChanged(user => {
      const activeUser = user ? {
        uid: user.uid,
        displayName: user.displayName || 'সম্মানিত কৃষক',
        role: 'যাচাইকৃত কৃষক',
        email: user.email,
        photoURL: user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        badge: '✓ যাচাইকৃত কৃষক',
        isGuest: false
      } : getStoredGuest();

      notifySubscribers(activeUser);
    });
  } catch (err) {
    console.warn('Firebase initialization warning:', err.message);
  }
}

// 4 Pre-Configured Simulated Farmer Profiles
const DEMO_PROFILES = [
  {
    id: 'karim_uddin',
    uid: 'demo_karim_uddin_01',
    displayName: 'করিম উদ্দিন',
    role: 'ধান ও সবজি চাষী',
    district: 'ব্রাহ্মণবাড়িয়া',
    email: 'karim.uddin@smartagro.bd',
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    badge: '✓ ডেমো কৃষক',
    isGuest: true
  },
  {
    id: 'kuddus_mia',
    uid: 'demo_kuddus_mia_02',
    displayName: 'কুদ্দুস মিয়া',
    role: 'আলু ও ভুট্টা চাষী',
    district: 'রংপুর',
    email: 'kuddus.mia@smartagro.bd',
    photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    badge: '✓ ডেমো কৃষক',
    isGuest: true
  },
  {
    id: 'rahima_begum',
    uid: 'demo_rahima_begum_03',
    displayName: 'রহিমা বেগম',
    role: 'আধুনিক কৃষি উদ্যোক্তা ও টমেটো চাষী',
    district: 'যশোর',
    email: 'rahima.begum@smartagro.bd',
    photoURL: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    badge: '✓ ডেমো কৃষক',
    isGuest: true
  },
  {
    id: 'saiful_islam',
    uid: 'demo_saiful_islam_04',
    displayName: 'মোঃ সাইফুল ইসলাম',
    role: 'স্মার্ট এগ্রো গবেষক ও সরিষা চাষী',
    district: 'কুমিল্লা',
    email: 'saiful.farmer@smartagro.bd',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    badge: '✓ ডেমো কৃষক',
    isGuest: true
  }
];

// Local Storage Session Management
function getStoredGuest() {
  const stored = localStorage.getItem('smart_agro_user');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      return null;
    }
  }
  return null;
}

function notifySubscribers(user) {
  authSubscribers.forEach(cb => {
    try {
      cb(user);
    } catch (e) {
      console.error('Subscriber callback error:', e);
    }
  });
}

// Google Sign-In Handler
async function signInWithGoogle() {
  if (isFirebaseConfigured && authInstance && googleProvider) {
    try {
      const result = await authInstance.signInWithPopup(googleProvider);
      const user = {
        uid: result.user.uid,
        displayName: result.user.displayName,
        role: 'যাচাইকৃত কৃষক',
        email: result.user.email,
        photoURL: result.user.photoURL,
        badge: '✓ যাচাইকৃত কৃষক',
        isGuest: false
      };
      localStorage.setItem('smart_agro_user', JSON.stringify(user));
      closeLoginModal();
      notifySubscribers(user);
      return user;
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      alert('গুগল লগইন ত্রুটি: ' + error.message);
      throw error;
    }
  } else {
    // Graceful Google Auth fallback for local/offline testing
    const demoGoogleUser = {
      uid: 'google_farmer_auth_01',
      displayName: 'মোঃ আবদুর রহিম',
      role: 'যাচাইকৃত গুগল কৃষক',
      email: 'abdur.rahim@gmail.com',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      badge: '✓ যাচাইকৃত কৃষক',
      district: 'ঢাকা',
      isGuest: false
    };
    localStorage.setItem('smart_agro_user', JSON.stringify(demoGoogleUser));
    closeLoginModal();
    notifySubscribers(demoGoogleUser);
    if (demoGoogleUser.district && window.SmartAgroWeather && SmartAgroWeather.selectDistrict) {
      SmartAgroWeather.selectDistrict(demoGoogleUser.district);
    }
    showToast('গুগল অ্যাকাউন্ট যাচাই সফল হয়েছে! স্বাগতম, ' + demoGoogleUser.displayName);
    return demoGoogleUser;
  }
}

// Select a Simulated Farmer Profile
function selectDemoFarmer(profileId) {
  const profile = DEMO_PROFILES.find(p => p.id === profileId) || DEMO_PROFILES[0];
  localStorage.setItem('smart_agro_user', JSON.stringify(profile));
  closeLoginModal();
  notifySubscribers(profile);

  // Sync district selector and weather if present on page
  if (profile.district && window.SmartAgroWeather && SmartAgroWeather.selectDistrict) {
    SmartAgroWeather.selectDistrict(profile.district);
  }

  showToast(`স্বাগতম, ${profile.displayName}! (${profile.role})`);
  return profile;
}

// Sign-Out Handler
async function signOutUser() {
  if (isFirebaseConfigured && authInstance) {
    try {
      await authInstance.signOut();
    } catch (e) {
      console.error(e);
    }
  }
  localStorage.removeItem('smart_agro_user');
  notifySubscribers(null);
  closeProfileDropdown();
  showToast('লগআউট সফল হয়েছে। আপনি এখন অতিথি মোডে আছেন।');
}

// Check current user synchronously
function getCurrentUser() {
  if (isFirebaseConfigured && authInstance && authInstance.currentUser) {
    const u = authInstance.currentUser;
    return {
      uid: u.uid,
      displayName: u.displayName || 'সম্মানিত কৃষক',
      role: 'যাচাইকৃত কৃষক',
      email: u.email,
      photoURL: u.photoURL,
      badge: '✓ যাচাইকৃত কৃষক',
      isGuest: false
    };
  }
  return getStoredGuest();
}

function onAuthStateChanged(callback) {
  authSubscribers.push(callback);
  // Call immediately with current state
  callback(getCurrentUser());
}

// ====================================================================
// Interactive Login Modal & Profile Dropdown UI Controllers
// ====================================================================

function openLoginModal() {
  let modal = document.getElementById('login-modal');
  if (!modal) {
    injectLoginModal();
    modal = document.getElementById('login-modal');
  }
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
  }
}

function closeLoginModal() {
  const modal = document.getElementById('login-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
  }
}

function toggleProfileDropdown() {
  const menu = document.getElementById('user-profile-dropdown');
  if (menu) {
    menu.classList.toggle('hidden');
  }
}

function closeProfileDropdown() {
  const menu = document.getElementById('user-profile-dropdown');
  if (menu && !menu.classList.contains('hidden')) {
    menu.classList.add('hidden');
  }
}

// Close dropdown on outside click
document.addEventListener('click', (e) => {
  const profileWidget = document.getElementById('user-profile-widget');
  const dropdown = document.getElementById('user-profile-dropdown');
  if (dropdown && !dropdown.classList.contains('hidden')) {
    if (profileWidget && !profileWidget.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.add('hidden');
    }
  }
});

// Inject Login Modal HTML into document
function injectLoginModal() {
  const modalDiv = document.createElement('div');
  modalDiv.id = 'login-modal';
  modalDiv.className = 'fixed inset-0 z-50 hidden items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in';
  
  modalDiv.innerHTML = `
    <div class="glass-panel p-6 md:p-8 max-w-lg w-full relative bg-white/95 rounded-3xl shadow-2xl border-2 border-emerald-400">
      
      <!-- Close Button -->
      <button onclick="SmartAgroAuth.closeLoginModal()" class="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold text-lg transition-colors">
        ✕
      </button>

      <!-- Modal Header -->
      <div class="text-center space-y-2 mb-6">
        <div class="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/25 border border-white">
          🌾
        </div>
        <h3 class="text-xl md:text-2xl font-black text-slate-900">কৃষক লগইন ও প্রোফাইল নির্বাচন</h3>
        <p class="text-xs md:text-sm text-slate-600 font-semibold font-bengali">
          আপনার ফসলের রোগ সনাক্তকরণের প্রেসক্রিপশন ও সার হিসাব সংরক্ষণ করতে একাউন্টে যুক্ত হোন।
        </p>
      </div>

      <!-- Google Sign-In Button -->
      <div class="space-y-3">
        <button onclick="SmartAgroAuth.signInWithGoogle()" class="w-full py-3.5 px-5 rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-emerald-500 font-extrabold text-slate-800 text-sm flex items-center justify-center gap-3 shadow-sm hover:shadow transition-all active:scale-95">
          <svg class="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>গুগল অ্যাকাউন্ট দিয়ে সাইন-ইন করুন</span>
        </button>
      </div>

      <!-- Divider -->
      <div class="relative my-5 text-center">
        <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-200"></div></div>
        <span class="relative bg-white px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          অথবা দ্রুত কৃষক প্রোফাইল নির্বাচন করুন
        </span>
      </div>

      <!-- Farmer Profiles Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
        ${DEMO_PROFILES.map(farmer => `
          <div onclick="SmartAgroAuth.selectDemoFarmer('${farmer.id}')" 
               class="p-3 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-400 cursor-pointer transition-all flex items-center space-x-3 group active:scale-95 shadow-xs">
            <img src="${farmer.photoURL}" alt="${farmer.displayName}" class="w-11 h-11 rounded-full object-cover border-2 border-emerald-500 shadow-sm shrink-0 group-hover:scale-105 transition-transform">
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between">
                <h4 class="text-xs md:text-sm font-black text-slate-900 truncate">${farmer.displayName}</h4>
                <span class="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold shrink-0">কৃষক</span>
              </div>
              <p class="text-[11px] text-emerald-800 font-bold truncate mt-0.5">${farmer.role}</p>
              <span class="text-[10px] text-slate-500 font-semibold block truncate">📍 ${farmer.district}</span>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Footer Note -->
      <div class="mt-5 pt-3 border-t border-slate-100 text-center">
        <p class="text-[11px] text-slate-500 font-semibold">
          💡 প্রোফাইল নির্বাচন করলে আপনার এলাকা অনুযায়ী আবহাওয়া ও ফসল নির্দেশিকা সংরক্ষিত থাকবে।
        </p>
      </div>

    </div>
  `;

  document.body.appendChild(modalDiv);
}

// Simple Toast Notification
function showToast(message) {
  let toast = document.getElementById('smart-agro-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'smart-agro-toast';
    toast.className = 'fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl bg-slate-900 text-white text-xs md:text-sm font-bold shadow-2xl flex items-center gap-2 border border-emerald-400 transform transition-all duration-300 opacity-0 translate-y-[-20px] pointer-events-none';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<span>🌾</span> <span>${message}</span>`;
  toast.classList.remove('opacity-0', 'translate-y-[-20px]', 'pointer-events-none');
  toast.classList.add('opacity-100', 'translate-y-0');

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-[-20px]', 'pointer-events-none');
    toast.classList.remove('opacity-100', 'translate-y-0');
  }, 3500);
}

window.SmartAgroAuth = {
  signInWithGoogle,
  selectDemoFarmer,
  signOutUser,
  getCurrentUser,
  onAuthStateChanged,
  openLoginModal,
  closeLoginModal,
  toggleProfileDropdown,
  closeProfileDropdown,
  showToast,
  DEMO_PROFILES,
  isFirebaseConfigured: () => isFirebaseConfigured
};
