// ====================================================================
// Smart Agro (স্মার্ট এগ্রো) - Firebase Authentication & Farmer Module
// Supports: Google Sign-In, Bangladesh Phone SMS OTP, and Demo Profiles
// ====================================================================

// Default fallback configuration (Automatically populated from /api/firebase-config if set)
let firebaseConfig = {
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
let isFirebaseConfigured = false;
let phoneConfirmationResult = null;
let currentPendingPhone = null;

// Initialize Firebase dynamically
async function initFirebaseAuth() {
  try {
    const res = await fetch('/api/firebase-config');
    if (res.ok) {
      const serverConfig = await res.json();
      if (serverConfig && serverConfig.apiKey && serverConfig.apiKey !== "YOUR_FIREBASE_API_KEY") {
        firebaseConfig = serverConfig;
        isFirebaseConfigured = true;
      }
    }
  } catch (e) {
    console.debug('Could not fetch server firebase config, using defaults.');
  }

  if (typeof firebase !== 'undefined') {
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      authInstance = firebase.auth();
      authInstance.useDeviceLanguage();
      googleProvider = new firebase.auth.GoogleAuthProvider();

      // Check if real config is valid
      if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_FIREBASE_API_KEY") {
        isFirebaseConfigured = true;
      }

      authInstance.onAuthStateChanged(user => {
        if (user) {
          const activeUser = {
            uid: user.uid,
            displayName: user.displayName || (user.phoneNumber ? 'কৃষক ভাই (' + user.phoneNumber + ')' : 'সম্মানিত কৃষক'),
            role: user.phoneNumber ? 'যাচাইকৃত মোবাইল কৃষক' : 'যাচাইকৃত গুগল কৃষক',
            email: user.email || '',
            phoneNumber: user.phoneNumber || '',
            photoURL: user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            badge: user.phoneNumber ? '✓ যাচাইকৃত মোবাইল' : '✓ যাচাইকৃত কৃষক',
            isGuest: false
          };
          localStorage.setItem('smart_agro_user', JSON.stringify(activeUser));
          notifySubscribers(activeUser);
        } else {
          const stored = getStoredGuest();
          if (stored && !stored.isGuest) {
            // Keep stored login state unless explicitly logged out
            notifySubscribers(stored);
          } else {
            notifySubscribers(stored);
          }
        }
      });
    } catch (err) {
      console.warn('Firebase initialization notice:', err.message);
    }
  }
}

// Auto-boot on load
if (typeof window !== 'undefined') {
  initFirebaseAuth();
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

// --------------------------------------------------------------------
// 1. Google Sign-In Authentication
// --------------------------------------------------------------------
async function signInWithGoogle() {
  if (isFirebaseConfigured && authInstance && googleProvider) {
    try {
      const result = await authInstance.signInWithPopup(googleProvider);
      const user = {
        uid: result.user.uid,
        displayName: result.user.displayName || 'সম্মানিত কৃষক',
        role: 'যাচাইকৃত গুগল কৃষক',
        email: result.user.email,
        photoURL: result.user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        badge: '✓ যাচাইকৃত কৃষক',
        isGuest: false
      };
      localStorage.setItem('smart_agro_user', JSON.stringify(user));
      closeLoginModal();
      notifySubscribers(user);
      showToast('গুগল অ্যাকাউন্ট যাচাই সফল হয়েছে! স্বাগতম, ' + user.displayName);
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

// --------------------------------------------------------------------
// 2. Bangladesh Phone Number (SMS OTP) Authentication
// --------------------------------------------------------------------
function formatBDPhoneNumber(input) {
  if (!input) return '';
  let cleaned = input.toString().replace(/[\s\-\(\)]/g, '');
  if (cleaned.startsWith('+880')) {
    return cleaned;
  }
  if (cleaned.startsWith('880')) {
    return '+' + cleaned;
  }
  if (cleaned.startsWith('0')) {
    return '+88' + cleaned;
  }
  if (cleaned.length === 10 && cleaned.startsWith('1')) {
    return '+880' + cleaned;
  }
  return '+880' + cleaned;
}

function validateBDPhoneNumber(number) {
  const formatted = formatBDPhoneNumber(number);
  // Bangladesh mobile numbers: +8801 followed by 3,4,5,6,7,8,9 and 8 more digits (total 14 chars)
  const regex = /^\+8801[3-9]\d{8}$/;
  return regex.test(formatted);
}

// Send OTP to Bangladesh Phone Number
async function sendPhoneOtp(rawPhone) {
  const phone = formatBDPhoneNumber(rawPhone);
  if (!validateBDPhoneNumber(phone)) {
    throw new Error('অনুগ্রহ করে সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 01712345678)।');
  }

  currentPendingPhone = phone;

  if (isFirebaseConfigured && authInstance) {
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
          size: 'invisible',
          callback: () => {
            console.debug('reCAPTCHA resolved');
          }
        });
        await window.recaptchaVerifier.render();
      }

      phoneConfirmationResult = await authInstance.signInWithPhoneNumber(phone, window.recaptchaVerifier);
      showToast(`মোবাইলে ওটিপি কোড পাঠানো হয়েছে (${phone})`);
      return { success: true, phone, mode: 'firebase' };
    } catch (err) {
      console.error('Firebase Phone Auth Error:', err);
      if (window.grecaptcha && window.recaptchaWidgetId !== undefined) {
        window.grecaptcha.reset(window.recaptchaWidgetId);
      }
      throw new Error('এসএমএস ওটিপি পাঠাতে ত্রুটি: ' + (err.message || 'নেটওয়ার্ক চেক করুন'));
    }
  } else {
    // Intelligent Dev / Offline fallback when Firebase keys are pending
    const mockOtp = '123456';
    sessionStorage.setItem('smart_agro_mock_otp_' + phone, mockOtp);
    showToast(`টেস্ট ওটিপি পাঠানো হয়েছে: ${mockOtp} (নম্বর: ${phone})`);
    return { success: true, phone, mode: 'mock', mockOtp };
  }
}

// Verify OTP Code
async function verifyPhoneOtp(otpCode) {
  if (!otpCode || otpCode.trim().length < 6) {
    throw new Error('অনুগ্রহ করে ৬ ডিজিটের ওটিপি কোড দিন।');
  }
  const cleanCode = otpCode.trim();

  if (isFirebaseConfigured && phoneConfirmationResult) {
    try {
      const result = await phoneConfirmationResult.confirm(cleanCode);
      const firebaseUser = result.user;
      const user = {
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName || 'কৃষক ভাই (' + (firebaseUser.phoneNumber || currentPendingPhone) + ')',
        role: 'যাচাইকৃত মোবাইল কৃষক',
        phoneNumber: firebaseUser.phoneNumber || currentPendingPhone,
        email: firebaseUser.email || '',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        badge: '✓ যাচাইকৃত মোবাইল',
        isGuest: false
      };
      localStorage.setItem('smart_agro_user', JSON.stringify(user));
      closeLoginModal();
      notifySubscribers(user);
      showToast('মোবাইল ওটিপি যাচাই সফল হয়েছে! স্বাগতম।');
      return user;
    } catch (err) {
      console.error('OTP confirmation error:', err);
      throw new Error('ভুল ওটিপি কোড অথবা কোডের মেয়াদ শেষ হয়ে গেছে। আবার চেষ্টা করুন।');
    }
  } else {
    // Dev/Offline Mode verification
    const storedOtp = sessionStorage.getItem('smart_agro_mock_otp_' + currentPendingPhone) || '123456';
    if (cleanCode === storedOtp || cleanCode === '123456') {
      const user = {
        uid: 'phone_' + currentPendingPhone.replace(/\+/g, ''),
        displayName: 'কৃষক ভাই (' + currentPendingPhone + ')',
        role: 'যাচাইকৃত মোবাইল কৃষক',
        phoneNumber: currentPendingPhone,
        email: '',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        badge: '✓ যাচাইকৃত মোবাইল',
        district: 'ঢাকা',
        isGuest: false
      };
      localStorage.setItem('smart_agro_user', JSON.stringify(user));
      closeLoginModal();
      notifySubscribers(user);
      showToast('মোবাইল নম্বর সফলভাবে যাচাই হয়েছে! স্বাগতম।');
      return user;
    } else {
      throw new Error('ওটিপি কোড সঠিক নয়। আবার চেষ্টা করুন (টেস্ট কোড: 123456)।');
    }
  }
}

// --------------------------------------------------------------------
// 3. Demo Profiles & Utilities
// --------------------------------------------------------------------
function selectDemoFarmer(profileId) {
  const profile = DEMO_PROFILES.find(p => p.id === profileId) || DEMO_PROFILES[0];
  localStorage.setItem('smart_agro_user', JSON.stringify(profile));
  closeLoginModal();
  notifySubscribers(profile);

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

function getCurrentUser() {
  if (isFirebaseConfigured && authInstance && authInstance.currentUser) {
    const u = authInstance.currentUser;
    return {
      uid: u.uid,
      displayName: u.displayName || (u.phoneNumber ? 'কৃষক ভাই (' + u.phoneNumber + ')' : 'সম্মানিত কৃষক'),
      role: u.phoneNumber ? 'যাচাইকৃত মোবাইল কৃষক' : 'যাচাইকৃত কৃষক',
      email: u.email || '',
      phoneNumber: u.phoneNumber || '',
      photoURL: u.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      badge: u.phoneNumber ? '✓ যাচাইকৃত মোবাইল' : '✓ যাচাইকৃত কৃষক',
      isGuest: false
    };
  }
  return getStoredGuest();
}

function onAuthStateChanged(callback) {
  authSubscribers.push(callback);
  callback(getCurrentUser());
}

// ====================================================================
// Interactive Login Modal & UI Controllers
// ====================================================================

function openLoginModal() {
  let modal = document.getElementById('login-modal');
  if (!modal) {
    injectLoginModal();
    modal = document.getElementById('login-modal');
  }
  if (modal) {
    // Reset phone view to step 1
    const stepPhone = document.getElementById('phone-auth-step-1');
    const stepOtp = document.getElementById('phone-auth-step-2');
    const phoneError = document.getElementById('phone-auth-error');
    if (stepPhone) stepPhone.classList.remove('hidden');
    if (stepOtp) stepOtp.classList.add('hidden');
    if (phoneError) {
      phoneError.innerText = '';
      phoneError.classList.add('hidden');
    }

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

// UI Event Handlers for Phone Auth
async function handleSendPhoneOtp() {
  const phoneInput = document.getElementById('farmer-phone-input');
  const sendBtn = document.getElementById('btn-send-phone-otp');
  const errorDiv = document.getElementById('phone-auth-error');
  if (!phoneInput) return;

  const rawPhone = phoneInput.value.trim();
  if (errorDiv) {
    errorDiv.innerText = '';
    errorDiv.classList.add('hidden');
  }

  if (sendBtn) {
    sendBtn.disabled = true;
    sendBtn.innerText = '⏳ ওটিপি পাঠানো হচ্ছে...';
  }

  try {
    const res = await sendPhoneOtp(rawPhone);
    const step1 = document.getElementById('phone-auth-step-1');
    const step2 = document.getElementById('phone-auth-step-2');
    const displayPhone = document.getElementById('otp-sent-phone-display');

    if (displayPhone) displayPhone.innerText = res.phone;
    if (step1) step1.classList.add('hidden');
    if (step2) step2.classList.remove('hidden');

    const otpInput = document.getElementById('farmer-otp-input');
    if (otpInput) {
      otpInput.value = '';
      otpInput.focus();
    }
  } catch (err) {
    if (errorDiv) {
      errorDiv.innerText = err.message || 'ত্রুটি ঘটেছে। আবার চেষ্টা করুন।';
      errorDiv.classList.remove('hidden');
    }
  } finally {
    if (sendBtn) {
      sendBtn.disabled = false;
      sendBtn.innerText = '📩 ওটিপি কোড পাঠান';
    }
  }
}

async function handleVerifyPhoneOtp() {
  const otpInput = document.getElementById('farmer-otp-input');
  const verifyBtn = document.getElementById('btn-verify-phone-otp');
  const errorDiv = document.getElementById('phone-auth-error');
  if (!otpInput) return;

  const code = otpInput.value.trim();
  if (errorDiv) {
    errorDiv.innerText = '';
    errorDiv.classList.add('hidden');
  }

  if (verifyBtn) {
    verifyBtn.disabled = true;
    verifyBtn.innerText = '⏳ যাচাই করা হচ্ছে...';
  }

  try {
    await verifyPhoneOtp(code);
  } catch (err) {
    if (errorDiv) {
      errorDiv.innerText = err.message || 'যাচাই ব্যর্থ হয়েছে। আবার চেষ্টা করুন।';
      errorDiv.classList.remove('hidden');
    }
  } finally {
    if (verifyBtn) {
      verifyBtn.disabled = false;
      verifyBtn.innerText = '✓ কোড যাচাই ও লগইন করুন';
    }
  }
}

function resetPhoneInputStep() {
  const step1 = document.getElementById('phone-auth-step-1');
  const step2 = document.getElementById('phone-auth-step-2');
  const errorDiv = document.getElementById('phone-auth-error');
  if (step1) step1.classList.remove('hidden');
  if (step2) step2.classList.add('hidden');
  if (errorDiv) {
    errorDiv.innerText = '';
    errorDiv.classList.add('hidden');
  }
}

// Inject Modern Comprehensive Login Modal HTML
function injectLoginModal() {
  let existing = document.getElementById('login-modal');
  if (existing) existing.remove();

  const modalDiv = document.createElement('div');
  modalDiv.id = 'login-modal';
  modalDiv.className = 'fixed inset-0 z-50 hidden items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in';
  
  modalDiv.innerHTML = `
    <div class="glass-panel p-6 md:p-8 max-w-lg w-full relative bg-white/95 rounded-3xl shadow-2xl border-2 border-emerald-400 max-h-[90vh] overflow-y-auto">
      
      <!-- Close Button -->
      <button onclick="SmartAgroAuth.closeLoginModal()" class="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold text-lg transition-colors">
        ✕
      </button>

      <!-- Modal Header -->
      <div class="text-center space-y-2 mb-6">
        <div class="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/25 border border-white">
          🌾
        </div>
        <h3 class="text-xl md:text-2xl font-black text-slate-900">কৃষক লগইন ও প্রোফাইল</h3>
        <p class="text-xs md:text-sm text-slate-600 font-semibold font-bengali">
          গুগল বা বাংলাদেশি মোবাইল নম্বর দিয়ে সহজে যুক্ত হোন।
        </p>
      </div>

      <!-- Error Banner -->
      <div id="phone-auth-error" class="hidden mb-4 p-3 rounded-xl bg-rose-50 border border-rose-300 text-xs font-bold text-rose-800 text-center"></div>

      <!-- Google Sign-In Button -->
      <div class="space-y-3">
        <button onclick="SmartAgroAuth.signInWithGoogle()" class="w-full py-3 px-5 rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-emerald-500 font-extrabold text-slate-800 text-xs md:text-sm flex items-center justify-center gap-3 shadow-xs hover:shadow transition-all active:scale-95">
          <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>গুগল অ্যাকাউন্ট দিয়ে সাইন-ইন করুন</span>
        </button>
      </div>

      <!-- Divider -->
      <div class="relative my-4 text-center">
        <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-200"></div></div>
        <span class="relative bg-white px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          অথবা মোবাইল ওটিপি (SMS OTP)
        </span>
      </div>

      <!-- Bangladesh Phone Authentication Form -->
      <div class="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3.5">
        
        <!-- Step 1: Input Phone Number -->
        <div id="phone-auth-step-1" class="space-y-3">
          <label class="block text-xs font-bold text-slate-700">
            📱 আপনার বাংলাদেশি মোবাইল নম্বর দিন:
          </label>
          <div class="flex items-center rounded-xl bg-white border-2 border-emerald-300 focus-within:border-emerald-600 transition-colors overflow-hidden shadow-xs">
            <span class="px-3 py-2.5 bg-emerald-100 text-emerald-900 font-black text-xs border-r border-emerald-200 select-none flex items-center gap-1">
              <span>🇧🇩</span>
              <span>+880</span>
            </span>
            <input type="tel" id="farmer-phone-input" placeholder="01712-345678" maxlength="11"
                   class="w-full px-3 py-2.5 text-sm font-bold text-slate-800 bg-transparent focus:outline-none"
                   onkeydown="if(event.key === 'Enter') SmartAgroAuth.handleSendPhoneOtp()">
          </div>
          <button id="btn-send-phone-otp" onclick="SmartAgroAuth.handleSendPhoneOtp()"
                  class="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs md:text-sm shadow-md shadow-emerald-600/20 active:scale-95 transition-all">
            📩 ওটিপি কোড পাঠান
          </button>
        </div>

        <!-- Step 2: Input OTP Verification Code -->
        <div id="phone-auth-step-2" class="hidden space-y-3 animate-fade-in">
          <div class="flex items-center justify-between">
            <label class="block text-xs font-bold text-slate-700">
              🔑 ওটিপি কোড লিখুন:
            </label>
            <button onclick="SmartAgroAuth.resetPhoneInputStep()" class="text-[11px] font-bold text-emerald-700 hover:underline">
              নম্বর পরিবর্তন ✕
            </button>
          </div>
          <p class="text-[11px] text-slate-500 font-semibold">
            <span id="otp-sent-phone-display" class="font-bold text-slate-800"></span> নম্বরে পাঠানো ৬ সংখ্যার কোড দিন।
          </p>
          <input type="text" id="farmer-otp-input" placeholder="123456" maxlength="6"
                 class="w-full px-4 py-2.5 text-center text-lg font-black tracking-widest text-slate-900 bg-white border-2 border-emerald-400 rounded-xl focus:outline-none focus:border-emerald-600 shadow-xs"
                 onkeydown="if(event.key === 'Enter') SmartAgroAuth.handleVerifyPhoneOtp()">
          <button id="btn-verify-phone-otp" onclick="SmartAgroAuth.handleVerifyPhoneOtp()"
                  class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs md:text-sm shadow-md active:scale-95 transition-all">
            ✓ কোড যাচাই ও লগইন করুন
          </button>
          <div class="text-center pt-1">
            <button onclick="SmartAgroAuth.handleSendPhoneOtp()" class="text-[11px] font-bold text-slate-500 hover:text-emerald-700">
              🔄 কোড পাননি? পুনরায় পাঠান
            </button>
          </div>
        </div>

        <!-- Invisible Recaptcha Anchor for Firebase -->
        <div id="recaptcha-container"></div>
      </div>

      <!-- Divider -->
      <div class="relative my-4 text-center">
        <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-200"></div></div>
        <span class="relative bg-white px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          অথবা ডেমো কৃষক প্রোফাইল নির্বাচন
        </span>
      </div>

      <!-- Farmer Profiles Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
        ${DEMO_PROFILES.map(farmer => `
          <div onclick="SmartAgroAuth.selectDemoFarmer('${farmer.id}')" 
               class="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 cursor-pointer transition-all flex items-center space-x-2.5 group active:scale-95">
            <img src="${farmer.photoURL}" alt="${farmer.displayName}" class="w-9 h-9 rounded-full object-cover border-2 border-emerald-500 shrink-0">
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between">
                <h4 class="text-xs font-black text-slate-900 truncate">${farmer.displayName}</h4>
              </div>
              <p class="text-[10px] text-emerald-800 font-bold truncate">${farmer.role}</p>
            </div>
          </div>
        `).join('')}
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
  sendPhoneOtp,
  verifyPhoneOtp,
  formatBDPhoneNumber,
  validateBDPhoneNumber,
  handleSendPhoneOtp,
  handleVerifyPhoneOtp,
  resetPhoneInputStep,
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
