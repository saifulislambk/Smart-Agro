// ====================================================================
// Smart Agro (স্মার্ট এগ্রো) - Firebase Authentication & Farmer Module
// Supports: Google Sign-In, Email OTP, and Demo Profiles
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
      googleProvider.addScope('profile');
      googleProvider.addScope('email');
      // Force Google account chooser & consent prompt
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      });
      checkGoogleEmailSignInLink();

      // Check if real config is valid
      if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_FIREBASE_API_KEY") {
        isFirebaseConfigured = true;
      }

      authInstance.onAuthStateChanged(user => {
        if (user) {
          const activeUser = {
            uid: user.uid,
            displayName: user.displayName || 'সম্মানিত কৃষক',
            role: user.role || 'যাচাইকৃত গুগল কৃষক',
            email: user.email || '',
            phoneNumber: '',
            photoURL: user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            badge: '✓ যাচাইকৃত কৃষক',
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
// 1. Google Sign-In Authentication (Real Google Account)
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
        phoneNumber: '',
        photoURL: result.user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        badge: '✓ যাচাইকৃত কৃষক',
        district: 'ব্রাহ্মণবাড়িয়া',
        auth_provider: 'google',
        isGuest: false
      };

      // Sync with Account Database
      try {
        const syncRes = await fetch('/api/user/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firebase_uid: user.uid,
            display_name: user.displayName,
            email: user.email,
            photo_url: user.photoURL,
            district: user.district,
            role: user.role,
            auth_provider: 'google'
          })
        });
        const syncData = await syncRes.json();
        if (syncData.user) {
          if (syncData.user.district) user.district = syncData.user.district;
        }
      } catch (dbErr) {
        console.warn('Account DB sync notice:', dbErr);
      }

      localStorage.setItem('smart_agro_user', JSON.stringify(user));
      closeLoginModal();
      notifySubscribers(user);
      showToast('গুগল অ্যাকাউন্ট যাচাই সফল হয়েছে! স্বাগতম, ' + user.displayName);
      return user;
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      let errMsg = 'গুগল লগইন ত্রুটি: ' + (error.message || 'চেক করুন');
      if (error.code === 'auth/unauthorized-domain') {
        errMsg = '⚠️ ফায়ারবেসে smartagrobd.vercel.app ডোমেইন অনুমোদন করা নেই। Firebase Console > Settings > Authorized Domains-এ ডোমেইনটি যোগ করুন।';
      }
      showToast(errMsg);
      throw error;
    }
  } else {
    throw new Error('ফায়ারবেস কনফিগারেশন সক্রিয় নেই। অনুগ্রহ করে Vercel-এ FIREBASE_API_KEY সেট করুন।');
  }
}

// --------------------------------------------------------------------
// 2. Demo Profiles & Utilities
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
      displayName: u.displayName || 'সম্মানিত কৃষক',
      role: 'যাচাইকৃত কৃষক',
      email: u.email || '',
      phoneNumber: '',
      photoURL: u.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      badge: '✓ যাচাইকৃত কৃষক',
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
    // Reset email view to step 1
    const stepEmail = document.getElementById('email-auth-step-1');
    const stepOtp = document.getElementById('email-auth-step-2');
    const emailError = document.getElementById('email-auth-error');
    if (stepEmail) stepEmail.classList.remove('hidden');
    if (stepOtp) stepOtp.classList.add('hidden');
    if (emailError) {
      emailError.innerText = '';
      emailError.classList.add('hidden');
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

// UI Event Handlers for Email Auth (Google Email Link & Email OTP)
let currentPendingEmail = '';

// Check if page was loaded via a Google Passwordless Email Sign-In Link
async function checkGoogleEmailSignInLink() {
  if (typeof firebase === 'undefined' || !authInstance) return;
  try {
    if (authInstance.isSignInWithEmailLink(window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        email = window.prompt('অনুগ্রহ করে নিশ্চিতকরণের জন্য আপনার ইমেইল ঠিকানা দিন:');
      }
      if (email) {
        showToast('⏳ গুগল ইমেইল লিংক যাচাই করা হচ্ছে...');
        const result = await authInstance.signInWithEmailLink(email.trim().toLowerCase(), window.location.href);
        window.localStorage.removeItem('emailForSignIn');
        window.history.replaceState({}, document.title, window.location.pathname);
        
        const fbUser = result.user;
        const activeUser = {
          uid: fbUser.uid,
          displayName: fbUser.displayName || email.split('@')[0],
          role: 'যাচাইকৃত গুগল ইমেইল কৃষক',
          email: fbUser.email || email,
          phoneNumber: '',
          photoURL: fbUser.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(email)}`,
          badge: '✓ যাচাইকৃত গুগল ইমেইল',
          isGuest: false,
          authProvider: 'google_email_link'
        };

        try {
          await fetch('/api/user/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              firebase_uid: activeUser.uid,
              display_name: activeUser.displayName,
              email: activeUser.email,
              role: activeUser.role,
              auth_provider: 'google_email_link'
            })
          });
        } catch(e){}

        localStorage.setItem('smart_agro_user', JSON.stringify(activeUser));
        notifySubscribers(activeUser);
        showToast(`🎉 গুগল থেকে সফলভাবে যাচাই ও লগইন সম্পন্ন হয়েছে (${email})!`);
      }
    }
  } catch (err) {
    console.error('Google Email Sign-In Check Error:', err);
    showToast('⚠️ গুগল ইমেইল লিংকের মেয়াদ শেষ বা লিংকটি সঠিক নয়।');
  }
}

// Google Native Passwordless Email Link Auth (Sent directly by Google noreply@...firebaseapp.com)
async function sendGoogleEmailLink() {
  const emailInput = document.getElementById('farmer-email-input');
  const googleLinkBtn = document.getElementById('btn-send-google-link');
  const errorDiv = document.getElementById('email-auth-error');
  if (!emailInput) return;

  const rawEmail = emailInput.value.trim().toLowerCase();
  if (errorDiv) {
    errorDiv.innerText = '';
    errorDiv.classList.add('hidden');
  }

  if (!rawEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
    if (errorDiv) {
      errorDiv.innerText = 'অনুগ্রহ করে একটি সঠিক ইমেইল ঠিকানা দিন (যেমন: farmer@gmail.com)।';
      errorDiv.classList.remove('hidden');
    }
    return;
  }

  if (googleLinkBtn) {
    googleLinkBtn.disabled = true;
    googleLinkBtn.innerText = '⏳ গুগল লিংক পাঠানো হচ্ছে...';
  }

  try {
    if (!authInstance) {
      throw new Error('গুগল ফায়ারবেস সার্ভিস প্রস্তুত নয়।');
    }
    const actionCodeSettings = {
      url: window.location.origin + '/?emailSignIn=true',
      handleCodeInApp: true
    };

    await authInstance.sendSignInLinkToEmail(rawEmail, actionCodeSettings);
    window.localStorage.setItem('emailForSignIn', rawEmail);
    showToast(`📩 গুগল থেকে (${rawEmail}) ঠিকানায় ১-ক্লিক সাইন-ইন লিংক পাঠানো হয়েছে! ইনবক্স চেক করুন।`);
    if (errorDiv) {
      errorDiv.innerText = `✅ গুগল সরাসরি ${rawEmail} ঠিকানায় সাইন-ইন লিংক পাঠিয়েছে। আপনার জিমেইল ইনবক্স বা স্প্যাম ফোল্ডারে গিয়ে লিংকে ক্লিক করলেই স্বয়ংক্রিয়ভাবে লগইন হয়ে যাবে!`;
      errorDiv.className = 'p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-xs font-bold text-emerald-800 text-center block mb-4';
    }
  } catch (err) {
    console.error('Google Send Email Link Error:', err);
    let msg = err.message || 'গুগল ইমেইল লিংক পাঠাতে সমস্যা হয়েছে।';
    if (err.code === 'auth/unauthorized-domain') {
      msg = '⚠️ ফায়ারবেস কনসোলে smartagrobd.vercel.app ডোমেইনটি অনুমোদিত নয়।';
    } else if (err.code === 'auth/operation-not-allowed') {
      msg = '⚠️ ফায়ারবেসে Email Link Auth অন করা নেই। Firebase Console > Authentication > Email/Password > Email link toggle অন করুন।';
    }
    if (errorDiv) {
      errorDiv.innerText = msg;
      errorDiv.className = 'p-3 rounded-xl bg-rose-50 border border-rose-300 text-xs font-bold text-rose-800 text-center block mb-4';
    }
  } finally {
    if (googleLinkBtn) {
      googleLinkBtn.disabled = false;
      googleLinkBtn.innerText = '🔗 গুগল থেকে সরাসরি সাইন-ইন লিংক পাঠান';
    }
  }
}

async function handleSendEmailOtp() {
  const emailInput = document.getElementById('farmer-email-input');
  const sendBtn = document.getElementById('btn-send-email-otp');
  const errorDiv = document.getElementById('email-auth-error');
  if (!emailInput) return;

  const rawEmail = emailInput.value.trim().toLowerCase();
  if (errorDiv) {
    errorDiv.innerText = '';
    errorDiv.classList.add('hidden');
  }

  if (!rawEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
    if (errorDiv) {
      errorDiv.innerText = 'অনুগ্রহ করে একটি সঠিক ইমেইল ঠিকানা লিখুন (যেমন: farmer@gmail.com)।';
      errorDiv.classList.remove('hidden');
    }
    return;
  }

  if (sendBtn) {
    sendBtn.disabled = true;
    sendBtn.innerText = '⏳ ওটিপি পাঠানো হচ্ছে...';
  }

  try {
    const res = await fetch('/api/auth/send-email-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: rawEmail })
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'ইমেইল পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    }

    currentPendingEmail = rawEmail;

    const step1 = document.getElementById('email-auth-step-1');
    const step2 = document.getElementById('email-auth-step-2');
    const displayEmail = document.getElementById('otp-sent-email-display');

    if (displayEmail) displayEmail.innerText = rawEmail;
    if (step1) step1.classList.add('hidden');
    if (step2) step2.classList.remove('hidden');

    const otpInput = document.getElementById('farmer-email-otp-input');
    if (otpInput) {
      otpInput.value = ''; // Always empty; farmer must enter OTP code manually
      otpInput.focus();
    }

    const simNotice = document.getElementById('otp-simulation-notice');
    if (data.simulated) {
      if (simNotice) {
        simNotice.innerHTML = `ℹ️ <strong>পরীক্ষামূলক ওটিপি:</strong> সার্ভারে সরাসরি SMTP সেট না থাকায় জিমেইলে পাঠানো যায়নি। টেস্টের জন্য আপনার ওটিপি: <strong class="text-emerald-800 text-sm tracking-widest bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 select-all">${data.otp}</strong>। কোডটি নিচের ঘরে লিখে লগইন করুন।`;
        simNotice.classList.remove('hidden');
      }
    } else {
      if (simNotice) simNotice.classList.add('hidden');
    }

    showToast(data.message || `ইমেইলে ওটিপি পাঠানো হয়েছে (${rawEmail})`);
  } catch (err) {
    if (errorDiv) {
      errorDiv.innerText = err.message || 'ত্রুটি ঘটেছে। আবার চেষ্টা করুন।';
      errorDiv.classList.remove('hidden');
    }
  } finally {
    if (sendBtn) {
      sendBtn.disabled = false;
      sendBtn.innerText = '📩 ইমেইলে ওটিপি কোড পাঠান';
    }
  }
}

async function handleVerifyEmailOtp() {
  const otpInput = document.getElementById('farmer-email-otp-input');
  const verifyBtn = document.getElementById('btn-verify-email-otp');
  const errorDiv = document.getElementById('email-auth-error');
  if (!otpInput) return;

  const code = otpInput.value.trim();
  if (errorDiv) {
    errorDiv.innerText = '';
    errorDiv.classList.add('hidden');
  }

  if (!code || code.length < 6) {
    if (errorDiv) {
      errorDiv.innerText = 'অনুগ্রহ করে ৬ সংখ্যার ওটিপি কোড দিন।';
      errorDiv.classList.remove('hidden');
    }
    return;
  }

  if (verifyBtn) {
    verifyBtn.disabled = true;
    verifyBtn.innerText = '⏳ যাচাই করা হচ্ছে...';
  }

  try {
    const res = await fetch('/api/auth/verify-email-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: currentPendingEmail, otp: code })
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'ভুল বা মেয়াদোত্তীর্ণ ওটিপি কোড।');
    }

    const activeUser = data.user;
    localStorage.setItem('smart_agro_user', JSON.stringify(activeUser));
    notifySubscribers(activeUser);
    showToast(`স্বাগতম, ${activeUser.displayName}! লগইন সফল হয়েছে।`);
    closeLoginModal();
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

function resetEmailInputStep() {
  const step1 = document.getElementById('email-auth-step-1');
  const step2 = document.getElementById('email-auth-step-2');
  const errorDiv = document.getElementById('email-auth-error');
  if (step1) step1.classList.remove('hidden');
  if (step2) step2.classList.add('hidden');
  if (errorDiv) {
    errorDiv.innerText = '';
    errorDiv.classList.add('hidden');
  }
  const emailInput = document.getElementById('farmer-email-input');
  if (emailInput) emailInput.focus();
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
          গুগল বা আপনার ইমেইল দিয়ে সহজে লগইন করুন।
        </p>
      </div>

      <!-- Error Banner -->
      <div id="email-auth-error" class="hidden mb-4 p-3 rounded-xl bg-rose-50 border border-rose-300 text-xs font-bold text-rose-800 text-center"></div>

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
          অথবা ইমেইল ওটিপি (Email OTP)
        </span>
      </div>

      <!-- Email Authentication Form -->
      <div class="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3.5">
        
        <!-- Step 1: Input Email -->
        <div id="email-auth-step-1" class="space-y-3">
          <label class="block text-xs font-bold text-slate-700">
            ✉️ আপনার ইমেইল ঠিকানা দিন:
          </label>
          <div class="flex items-center rounded-xl bg-white border-2 border-emerald-300 focus-within:border-emerald-600 transition-colors overflow-hidden shadow-xs">
            <span class="px-3 py-2.5 bg-emerald-100 text-emerald-900 font-black text-xs border-r border-emerald-200 select-none">
              📧
            </span>
            <input type="email" id="farmer-email-input" placeholder="farmer@gmail.com"
                   class="w-full px-3 py-2.5 text-sm font-bold text-slate-800 bg-transparent focus:outline-none"
                   onkeydown="if(event.key === 'Enter') SmartAgroAuth.handleSendEmailOtp()">
          </div>
          <div class="space-y-2 pt-1">
            <button id="btn-send-google-link" onclick="SmartAgroAuth.sendGoogleEmailLink()"
                    class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs md:text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2">
              <span>📨</span>
              <span>গুগল থেকে সরাসরি সাইন-ইন লিংক পাঠান</span>
            </button>
            <button id="btn-send-email-otp" onclick="SmartAgroAuth.handleSendEmailOtp()"
                    class="w-full py-2 px-3 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold text-xs shadow-2xs active:scale-95 transition-all flex items-center justify-center gap-2">
              <span>🔢</span>
              <span>অথবা ৬ ডিজিটের ওটিপি কোড দিয়ে লগইন</span>
            </button>
          </div>
        </div>

        <!-- Step 2: Input OTP Verification Code -->
        <div id="email-auth-step-2" class="hidden space-y-3 animate-fade-in">
          <div id="otp-simulation-notice" class="hidden p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 leading-relaxed font-bengali"></div>
          <div class="flex items-center justify-between">
            <label class="block text-xs font-bold text-slate-700">
              🔑 ওটিপি কোড লিখুন:
            </label>
            <button onclick="SmartAgroAuth.resetEmailInputStep()" class="text-[11px] font-bold text-emerald-700 hover:underline">
              ইমেইল পরিবর্তন ✕
            </button>
          </div>
          <p class="text-[11px] text-slate-500 font-semibold">
            <span id="otp-sent-email-display" class="font-bold text-slate-800"></span> ঠিকানায় পাঠানো ৬ সংখ্যার কোড দিন।
          </p>
          <input type="text" id="farmer-email-otp-input" placeholder="123456" maxlength="6"
                 class="w-full px-4 py-2.5 text-center text-lg font-black tracking-widest text-slate-900 bg-white border-2 border-emerald-400 rounded-xl focus:outline-none focus:border-emerald-600 shadow-xs"
                 onkeydown="if(event.key === 'Enter') SmartAgroAuth.handleVerifyEmailOtp()">
          <button id="btn-verify-email-otp" onclick="SmartAgroAuth.handleVerifyEmailOtp()"
                  class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs md:text-sm shadow-md active:scale-95 transition-all">
            ✓ কোড যাচাই ও লগইন করুন
          </button>
          <div class="text-center pt-1">
            <button onclick="SmartAgroAuth.handleSendEmailOtp()" class="text-[11px] font-bold text-slate-500 hover:text-emerald-700">
              🔄 কোড পাননি? পুনরায় পাঠান
            </button>
          </div>
        </div>

      </div>

      <!-- Direct Photo & Profile Settings Access (No Login Required) -->
      <div class="mt-4 p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 text-center space-y-2.5">
        <div class="flex items-center justify-center gap-2 text-xs font-black text-emerald-950">
          <span class="text-base">📷</span>
          <span>ছবি, জেলা বা নাম পরিবর্তন করতে চান?</span>
        </div>
        <p class="text-[11px] text-slate-600 font-medium">লগইন ছাড়াই নিজের পছন্দমতো প্রোফাইল ছবি, নিজ জেলা ও পদবী সেট করুন।</p>
        <button onclick="SmartAgroAuth.closeLoginModal(); SmartAgroAuth.openAccountSettingsModal();" 
                class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs md:text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2">
          <span>📷</span>
          <span>প্রোফাইল ছবি ও সেটিংস খুলুন</span>
        </button>
      </div>

      <!-- 1-Click Demo Farmer Switcher -->
      <div class="mt-4 pt-3 border-t border-slate-200 text-center">
        <p class="text-[11px] font-bold text-slate-600 mb-2">অথবা ১-ক্লিকে যেকোনো নমুনা প্রোফাইল বাছুন:</p>
        <div class="grid grid-cols-2 gap-2">
          ${DEMO_PROFILES.map(p => `
            <button onclick="SmartAgroAuth.selectDemoFarmer('${p.id}')" 
                    class="p-2 rounded-xl border border-slate-200 hover:border-emerald-500 bg-white hover:bg-emerald-50 flex items-center gap-2 transition-all text-left group">
              <img src="${p.photoURL}" class="w-8 h-8 rounded-full object-cover border-2 border-emerald-400 group-hover:scale-105 transition-transform shrink-0">
              <div class="min-w-0 flex-1">
                <div class="text-[11px] font-bold text-slate-800 truncate">${p.displayName}</div>
                <div class="text-[9px] text-emerald-700 font-semibold truncate">${p.district} • ${p.role}</div>
              </div>
            </button>
          `).join('')}
        </div>
      </div>

    </div>
  `;

  document.body.appendChild(modalDiv);
}

// Simple Toast Notification (Positioned at bottom center, never covering header)
function showToast(message) {
  let toast = document.getElementById('smart-agro-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'smart-agro-toast';
    toast.className = 'fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-slate-900/95 backdrop-blur-md text-white text-xs md:text-sm font-bold shadow-2xl flex items-center gap-2 border border-emerald-400 transform transition-all duration-300 opacity-0 translate-y-4 pointer-events-none whitespace-nowrap max-w-[90vw]';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<span>🌾</span> <span>${message}</span>`;
  toast.classList.remove('opacity-0', 'translate-y-4', 'pointer-events-none');
  toast.classList.add('opacity-100', 'translate-y-0');

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none');
    toast.classList.remove('opacity-100', 'translate-y-0');
  }, 3500);
}

// --------------------------------------------------------------------
// 3. Account Settings & Profile Linking (Email, Photo, District & Role Updates)
// --------------------------------------------------------------------

const BANGLADESH_DIVISIONS_DISTRICTS = [
  { division: 'ঢাকা বিভাগ', districts: ['ঢাকা', 'গাজীপুর', 'নারায়ণগঞ্জ', 'নরসিংদী', 'মুন্সীগঞ্জ', 'মানিকগঞ্জ', 'টাঙ্গাইল', 'কিশোরগঞ্জ', 'ফরিদপুর', 'গোপালগঞ্জ', 'মাদারীপুর', 'রাজবাড়ী', 'শরীয়তপুর'] },
  { division: 'চট্টগ্রাম বিভাগ', districts: ['চট্টগ্রাম', 'কুমিল্লা', 'ব্রাহ্মণবাড়িয়া', 'কক্সবাজার', 'চাঁদপুর', 'নোয়াখালী', 'ফেনী', 'লক্ষ্মীপুর', 'খাগড়াছড়ি', 'রাঙ্গামাটি', 'বান্দরবান'] },
  { division: 'রাজশাহী বিভাগ', districts: ['রাজশাহী', 'বগুড়া', 'পাবনা', 'সিরাজগঞ্জ', 'নওগাঁ', 'নাটোর', 'চাঁপাইনবাবগঞ্জ', 'জয়পুরহাট'] },
  { division: 'রংপুর বিভাগ', districts: ['রংপুর', 'দিনাজপুর', 'গাইবান্ধা', 'কুড়িগ্রাম', 'নীলফামারী', 'লালমনিরহাট', 'পঞ্চগড়', 'ঠাকুরগাঁও'] },
  { division: 'খুলনা বিভাগ', districts: ['খুলনা', 'যশোর', 'বাগেরহাট', 'সাতক্ষীরা', 'ঝিনাইদহ', 'মাগুরা', 'নড়াইল', 'কুষ্টিয়া', 'মেহেরপুর', 'চুয়াডাঙ্গা'] },
  { division: 'বরিশাল বিভাগ', districts: ['বরিশাল', 'পটুয়াখালী', 'ভোলা', 'পিরোজপুর', 'বরগুনা', 'ঝালকাঠি'] },
  { division: 'সিলেট বিভাগ', districts: ['সিলেট', 'মৌলভীবাজার', 'হবিগঞ্জ', 'সুনামগঞ্জ'] },
  { division: 'ময়মনসিংহ বিভাগ', districts: ['ময়মনসিংহ', 'জামালপুর', 'নেত্রকোণা', 'শেরপুর'] }
];

const PRESET_AVATARS = [
  { label: '👨‍🌾 কৃষক ভাই', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { label: '👩‍🌾 কিষাণী আপা', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80' },
  { label: '🧑‍💼 কৃষি কর্মকর্তা', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
  { label: '🔬 গবেষক', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' }
];

const ROLE_OPTIONS = [
  { value: 'কৃষক', label: 'কৃষক (সাধারণ ফসল চাষী)' },
  { value: 'কৃষি উদ্যোক্তা', label: 'কৃষি উদ্যোক্তা (বাণিজ্যিক খামার ও নার্সারি)' },
  { value: 'উপ-সহকারী কৃষি কর্মকর্তা (SAAO)', label: 'উপ-সহকারী কৃষি কর্মকর্তা (SAAO)' },
  { value: 'শিক্ষার্থী / কৃষি গবেষক', label: 'শিক্ষার্থী / কৃষি গবেষক' },
  { value: 'ধান ও সবজি চাষী', label: 'ধান ও সবজি চাষী' },
  { value: 'ফল ও বাগান চাষী', label: 'ফল ও বাগান চাষী' }
];

let currentSelectedPhotoURL = null;

function handleProfilePhotoUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showToast('⚠️ অনুগ্রহ করে একটি সঠিক ছবি ফাইল নির্বাচন করুন।');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      try {
        const canvas = document.createElement('canvas');
        const size = 160;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Center crop to square
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;

        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        currentSelectedPhotoURL = dataUrl;

        const previewImg = document.getElementById('account-modal-avatar-preview');
        if (previewImg) previewImg.src = dataUrl;

        document.querySelectorAll('.preset-avatar-btn').forEach(btn => {
          btn.classList.remove('ring-4', 'ring-emerald-500', 'scale-110');
        });
        showToast('📷 ছবি সফলভাবে নির্বাচন করা হয়েছে! সংরক্ষণে ক্লিক করুন।');
      } catch (err) {
        console.error('Image compression error:', err);
        showToast('ছবি প্রসেস করতে সমস্যা হয়েছে।');
      }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function selectProfilePresetAvatar(url, btnElement) {
  currentSelectedPhotoURL = url;
  const previewImg = document.getElementById('account-modal-avatar-preview');
  if (previewImg) previewImg.src = url;

  document.querySelectorAll('.preset-avatar-btn').forEach(btn => {
    btn.classList.remove('ring-4', 'ring-emerald-500', 'scale-110');
  });
  if (btnElement) {
    btnElement.classList.add('ring-4', 'ring-emerald-500', 'scale-110');
  }
}

function openAccountSettingsModal() {
  let currentUser = getCurrentUser();
  if (!currentUser) {
    currentUser = {
      uid: 'farmer_guest_' + Date.now(),
      displayName: 'কৃষক ভাই',
      role: 'কৃষক',
      district: localStorage.getItem('smart_agro_district') || 'ঢাকা',
      email: '',
      photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      badge: '✓ কৃষক সদস্য',
      isGuest: true
    };
    localStorage.setItem('smart_agro_user', JSON.stringify(currentUser));
    notifySubscribers(currentUser);
  }

  const existing = document.getElementById('smart-agro-account-modal');
  if (existing) existing.remove();

  currentSelectedPhotoURL = currentUser.photoURL || null;
  const userPhoto = currentUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
  const hasEmail = Boolean(currentUser.email && currentUser.email.includes('@'));
  const userDistrict = currentUser.district || localStorage.getItem('smart_agro_district') || 'ঢাকা';
  const userRole = currentUser.role || 'কৃষক';

  const districtOptionsHtml = BANGLADESH_DIVISIONS_DISTRICTS.map(group => `
    <optgroup label="${group.division}">
      ${group.districts.map(dist => `
        <option value="${dist}" ${dist === userDistrict ? 'selected' : ''}>${dist}</option>
      `).join('')}
    </optgroup>
  `).join('');

  const roleOptionsHtml = ROLE_OPTIONS.map(opt => `
    <option value="${opt.value}" ${opt.value === userRole ? 'selected' : ''}>${opt.label}</option>
  `).join('');

  const presetAvatarsHtml = PRESET_AVATARS.map((p, idx) => `
    <button type="button" 
            onclick="SmartAgroAuth.selectProfilePresetAvatar('${p.url}', this)"
            title="${p.label}"
            class="preset-avatar-btn group relative w-10 h-10 rounded-full overflow-hidden border-2 border-slate-200 hover:border-emerald-500 focus:outline-none transition-all ${userPhoto === p.url ? 'ring-4 ring-emerald-500 scale-110' : ''}">
      <img src="${p.url}" alt="${p.label}" class="w-full h-full object-cover">
    </button>
  `).join('');

  const modalDiv = document.createElement('div');
  modalDiv.id = 'smart-agro-account-modal';
  modalDiv.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in font-bengali';

  modalDiv.innerHTML = `
    <div class="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border-2 border-emerald-400 p-6 md:p-7 overflow-y-auto max-h-[92vh]">
      
      <!-- Close Button -->
      <button onclick="SmartAgroAuth.closeAccountSettingsModal()" 
              class="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-sm font-bold transition-colors">
        ✕
      </button>

      <!-- Header & Title -->
      <div class="text-center mb-5">
        <h3 class="text-lg md:text-xl font-black text-slate-900">👤 প্রোফাইল ও সেটিংস</h3>
        <p class="text-xs text-slate-500 font-semibold mt-0.5">আপনার ছবি, নিজ জেলা, পদবী ও যোগাযোগের তথ্য আপডেট করুন</p>
      </div>

      <!-- Photo Edit Section -->
      <div class="flex flex-col items-center pb-5 mb-5 border-b border-slate-100">
        <div class="relative group">
          <div class="w-20 h-20 rounded-full border-4 border-emerald-500 shadow-md overflow-hidden bg-slate-100 flex items-center justify-center">
            <img id="account-modal-avatar-preview" 
                 src="${userPhoto}" 
                 alt="${currentUser.displayName}" 
                 class="w-full h-full object-cover">
          </div>
          <button type="button" 
                  onclick="document.getElementById('link-photo-file').click()" 
                  class="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center text-xs shadow-md border-2 border-white transition-all hover:scale-110"
                  title="ছবি পরিবর্তন করুন">
            📷
          </button>
        </div>

        <input type="file" id="link-photo-file" accept="image/*" class="hidden" onchange="SmartAgroAuth.handleProfilePhotoUpload(event)">
        
        <div class="mt-3 flex items-center gap-2">
          <button type="button" 
                  onclick="document.getElementById('link-photo-file').click()" 
                  class="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all">
            <span>📷</span>
            <span>ছবি আপলোড / ক্যামেরা</span>
          </button>
        </div>

        <!-- Preset Avatars -->
        <div class="mt-3 text-center">
          <div class="text-[11px] font-bold text-slate-500 mb-1.5">অথবা নমুনা ছবি নির্বাচন করুন:</div>
          <div class="flex items-center justify-center gap-2.5">
            ${presetAvatarsHtml}
          </div>
        </div>
      </div>

      <!-- Form Fields -->
      <div class="space-y-4">
        
        <div id="account-settings-msg" class="hidden p-2.5 rounded-xl text-xs font-bold text-center"></div>

        <!-- Display Name -->
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">
            ✍️ আপনার নাম
          </label>
          <input id="link-name-input" type="text" value="${currentUser.displayName || ''}" 
                 placeholder="যেমন: মোঃ সাইফুল ইসলাম"
                 class="w-full px-3.5 py-2.5 border-2 border-slate-200 focus:border-emerald-500 rounded-xl text-xs font-bold outline-none transition-colors">
        </div>

        <!-- Role Selector -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="block text-xs font-bold text-slate-700">
              🏷️ পদবী / ভূমিকা (Role)
            </label>
            <span class="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              প্রোফাইল ব্যাজ
            </span>
          </div>
          <select id="link-role-input" 
                  class="w-full px-3.5 py-2.5 border-2 border-slate-200 focus:border-emerald-500 rounded-xl text-xs font-bold outline-none bg-white text-slate-800 cursor-pointer transition-colors">
            ${roleOptionsHtml}
          </select>
          <p class="text-[10px] text-slate-400 mt-1">
            💡 অ্যাপে আপনার প্রোফাইল ব্যাজ ও সদস্য পরিচয় হিসেবে এটি প্রদর্শিত হবে।
          </p>
        </div>

        <!-- District Selector (64 Districts by Division) -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="block text-xs font-bold text-slate-700">
              📍 নিজ জেলা (District)
            </label>
            <span class="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              ৬৪ জেলা সাপোর্ট
            </span>
          </div>
          <select id="link-district-input" 
                  class="w-full px-3.5 py-2.5 border-2 border-slate-200 focus:border-emerald-500 rounded-xl text-xs font-bold outline-none bg-white text-slate-800 cursor-pointer transition-colors">
            ${districtOptionsHtml}
          </select>
          <p class="text-[10px] text-slate-400 mt-1">
            🌤️ জেলা পরিবর্তনের সাথে সাথে স্থানীয় লাইভ আবহাওয়া ও স্প্রে সতর্কতাও আপডেট হবে।
          </p>
        </div>

        <!-- Email Section -->
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">
            📧 ইমেইল ঠিকানা
          </label>
          ${hasEmail ? `
            <div class="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
              <span class="text-xs font-bold text-emerald-900 truncate">📧 ${currentUser.email}</span>
              <span class="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-full shrink-0">✓ সংযুক্ত</span>
            </div>
          ` : `
            <input id="link-email-input" type="email" placeholder="আপনার ইমেইল (যেমন: farmer@gmail.com)" 
                   class="w-full px-3.5 py-2.5 border-2 border-slate-200 focus:border-emerald-500 rounded-xl text-xs font-bold outline-none transition-colors">
            <p class="text-[10px] text-slate-400 mt-1">ইমেইল যোগ করলে গুগল ও ওটিপি দিয়ে ব্যাকআপ লগইন পাবেন।</p>
          `}
        </div>

        <!-- Action Button -->
        <button id="save-account-settings-btn" onclick="SmartAgroAuth.saveAccountContactInfo()" 
                class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs md:text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2">
          <span>💾</span>
          <span>তথ্য সংরক্ষণ ও প্রোফাইল আপডেট করুন</span>
        </button>

      </div>

    </div>
  `;

  document.body.appendChild(modalDiv);
}

function closeAccountSettingsModal() {
  const modal = document.getElementById('smart-agro-account-modal');
  if (modal) modal.remove();
}

async function saveAccountContactInfo() {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  const btn = document.getElementById('save-account-settings-btn');
  const msgDiv = document.getElementById('account-settings-msg');

  const emailInput = document.getElementById('link-email-input');
  const nameInput = document.getElementById('link-name-input');
  const distInput = document.getElementById('link-district-input');
  const roleInput = document.getElementById('link-role-input');

  const newEmail = emailInput ? emailInput.value.trim() : (currentUser.email || '');
  const newName = nameInput ? nameInput.value.trim() : (currentUser.displayName || 'কৃষক ভাই');
  const newDist = distInput ? distInput.value.trim() : (currentUser.district || 'ঢাকা');
  const newRole = roleInput ? roleInput.value.trim() : (currentUser.role || 'কৃষক');
  const newPhoto = currentSelectedPhotoURL || currentUser.photoURL || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150';

  if (btn) {
    btn.disabled = true;
    btn.innerText = '⏳ সংরক্ষণ হচ্ছে...';
  }

  try {
    const res = await fetch('/api/user/link-contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firebase_uid: currentUser.uid || ('farmer_' + Date.now()),
        display_name: newName,
        email: newEmail,
        district: newDist,
        photo_url: newPhoto,
        role: newRole
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'সংরক্ষণ ব্যর্থ হয়েছে।');
    }

    // Update local state
    currentUser.displayName = newName;
    if (newEmail) currentUser.email = newEmail;
    currentUser.district = newDist;
    currentUser.role = newRole;
    currentUser.photoURL = newPhoto;
    currentUser.badge = '✓ ' + newRole;

    localStorage.setItem('smart_agro_user', JSON.stringify(currentUser));
    localStorage.setItem('smart_agro_district', newDist);

    // Sync live weather if weather component is loaded
    if (window.SmartAgroWeather && SmartAgroWeather.selectDistrict) {
      SmartAgroWeather.selectDistrict(newDist);
    }

    notifySubscribers(currentUser);
    closeAccountSettingsModal();
    showToast('✅ প্রোফাইল, ছবি ও জেলা সফলভাবে সংরক্ষিত হয়েছে!');
  } catch (err) {
    if (msgDiv) {
      msgDiv.innerText = err.message || 'ত্রুটি ঘটেছে।';
      msgDiv.className = 'p-2.5 rounded-xl text-xs font-bold text-center bg-rose-50 text-rose-700 border border-rose-200';
      msgDiv.classList.remove('hidden');
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerText = '💾 তথ্য সংরক্ষণ ও প্রোফাইল আপডেট করুন';
    }
  }
}

window.SmartAgroAuth = {
  signInWithGoogle,
  sendGoogleEmailLink,
  handleSendEmailOtp,
  handleVerifyEmailOtp,
  resetEmailInputStep,
  selectDemoFarmer,
  signOutUser,
  getCurrentUser,
  onAuthStateChanged,
  openLoginModal,
  closeLoginModal,
  openAccountSettingsModal,
  closeAccountSettingsModal,
  saveAccountContactInfo,
  handleProfilePhotoUpload,
  selectProfilePresetAvatar,
  toggleProfileDropdown,
  closeProfileDropdown,
  showToast,
  DEMO_PROFILES,
  isFirebaseConfigured: () => isFirebaseConfigured
};
