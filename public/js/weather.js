// ====================================================================
// Smart Agro (স্মার্ট এগ্রো) - Live GPS Weather, Spraying Advisory & Alerts
// ====================================================================

let currentLocationCoords = null;
let currentDistrict = localStorage.getItem('smart_agro_district') || 'ব্রাহ্মণবাড়িয়া';

// 64 Districts Grouped by 8 Divisions for quick modal search
const DIVISIONS_AND_DISTRICTS = [
  { division: 'চট্টগ্রাম বিভাগ', districts: ['ব্রাহ্মণবাড়িয়া', 'কুমিল্লা', 'চট্টগ্রাম', 'কক্সবাজার', 'চাঁদপুর', 'নোয়াখালী', 'ফেনী', 'লক্ষ্মীপুর', 'খাগড়াছড়ি', 'রাঙ্গামাটি', 'বান্দরবান'] },
  { division: 'ঢাকা বিভাগ', districts: ['ঢাকা', 'গাজীপুর', 'নারায়ণগঞ্জ', 'নরসিংদী', 'মুন্সীগঞ্জ', 'মানিকগঞ্জ', 'টাঙ্গাইল', 'কিশোরগঞ্জ', 'ফরিদপুর', 'গোপালগঞ্জ', 'মাদারীপুর', 'রাজবাড়ী', 'শরীয়তপুর'] },
  { division: 'রাজশাহী বিভাগ', districts: ['রাজশাহী', 'বগুড়া', 'পাবনা', 'সিরাজগঞ্জ', 'নওগাঁ', 'নাটোর', 'চাঁপাইনবাবগঞ্জ', 'জয়পুরহাট'] },
  { division: 'রংপুর বিভাগ', districts: ['রংপুর', 'দিনাজপুর', 'গাইবান্ধা', 'কুড়িগ্রাম', 'নীলফামারী', 'লালমনিরহাট', 'পঞ্চগড়', 'ঠাকুরগাঁও'] },
  { division: 'খুলনা বিভাগ', districts: ['খুলনা', 'যশোর', 'বাগেরহাট', 'সাতক্ষীরা', 'ঝিনাইদহ', 'মাগুরা', 'নড়াইল', 'কুষ্টিয়া', 'মেহেরপুর', 'চুয়াডাঙ্গা'] },
  { division: 'বরিশাল বিভাগ', districts: ['বরিশাল', 'পটুয়াখালী', 'ভোলা', 'পিরোজপুর', 'বরগুনা', 'ঝালকাঠি'] },
  { division: 'সিলেট বিভাগ', districts: ['সিলেট', 'মৌলভীবাজার', 'হবিগঞ্জ', 'সুনামগঞ্জ'] },
  { division: 'ময়মনসিংহ বিভাগ', districts: ['ময়মনসিংহ', 'জামালপুর', 'নেত্রকোণা', 'শেরপুর'] }
];

// Initialize Weather Module
async function initWeather() {
  const gpsBtn = document.getElementById('gps-refresh-btn');
  const districtSelect = document.getElementById('district-select');

  if (gpsBtn) {
    gpsBtn.addEventListener('click', openLocationModal);
  }

  if (districtSelect) {
    districtSelect.value = currentDistrict;
    districtSelect.addEventListener('change', (e) => {
      selectDistrict(e.target.value);
    });
  }

  // Initial fetch
  fetchWeatherData();
}

// Select District Programmatically
function selectDistrict(districtName) {
  currentDistrict = districtName;
  currentLocationCoords = null;
  localStorage.setItem('smart_agro_district', districtName);

  const districtSelect = document.getElementById('district-select');
  if (districtSelect) {
    districtSelect.value = districtName;
  }

  fetchWeatherData();
}

// Open Prominent Interactive Geolocation Modal
function openLocationModal() {
  let modal = document.getElementById('gps-location-modal');
  if (!modal) {
    injectLocationModal();
    modal = document.getElementById('gps-location-modal');
  }
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';

    // Reset modal status
    const statusBox = document.getElementById('gps-status-box');
    if (statusBox) statusBox.classList.add('hidden');
  }
}

function closeLocationModal() {
  const modal = document.getElementById('gps-location-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
  }
}

// Request HTML5 Geolocation with Visual Feedback
function requestGPSLocation() {
  const statusBox = document.getElementById('gps-status-box');
  const statusText = document.getElementById('gps-status-text');
  const gpsActionBtn = document.getElementById('gps-action-btn');

  if (statusBox && statusText) {
    statusBox.classList.remove('hidden', 'bg-rose-50', 'border-rose-300', 'text-rose-800');
    statusBox.classList.add('bg-emerald-50', 'border-emerald-300', 'text-emerald-900');
    statusText.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="inline-block animate-spin text-lg">🛰️</span>
        <span class="font-bold">উপগ্রহের মাধ্যমে আপনার বর্তমান অবস্থান সনাক্ত করা হচ্ছে...</span>
      </div>
    `;
  }

  if (gpsActionBtn) {
    gpsActionBtn.disabled = true;
    gpsActionBtn.classList.add('opacity-70');
  }

  if (!navigator.geolocation) {
    handleGPSFailure('আপনার ব্রাউজারে জিপিএস সনাক্তকরণ সমর্থন করে না। অনুগ্রহ করে নিচের তালিকা থেকে জেলা বেছে নিন।');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      currentLocationCoords = {
        lat: position.coords.latitude,
        lon: position.coords.longitude
      };

      if (statusText) {
        statusText.innerHTML = `
          <div class="flex items-center gap-2 text-emerald-800">
            <span class="text-lg">✅</span>
            <span class="font-bold">জিপিএস অবস্থান সনাক্ত হয়েছে! আবহাওয়া ও বালাই তথ্য লোড হচ্ছে...</span>
          </div>
        `;
      }

      await fetchWeatherData();

      setTimeout(() => {
        closeLocationModal();
        if (window.SmartAgroAuth && SmartAgroAuth.showToast) {
          SmartAgroAuth.showToast(`আপনার বর্তমান অবস্থান সফলভাবে সনাক্ত হয়েছে: ${currentDistrict}`);
        }
      }, 900);

      if (gpsActionBtn) {
        gpsActionBtn.disabled = false;
        gpsActionBtn.classList.remove('opacity-70');
      }
    },
    (error) => {
      console.warn('GPS location error:', error.message);
      let errorMsg = 'লোকেশন এক্সেস পাওয়া যায়নি (অনুমতি দিন অথবা নিচের তালিকা থেকে জেলা বেছে নিন)।';
      if (error.code === error.PERMISSION_DENIED) {
        errorMsg = 'ব্রাউজারে লোকেশন পারমিশন ব্লক করা আছে। নিচে আপনার জেলা নির্বাচন করুন:';
      } else if (error.code === error.TIMEOUT) {
        errorMsg = 'জিপিএস সংযোগে বিলম্ব হচ্ছে। নিচে আপনার জেলা বেছে নিন:';
      }
      handleGPSFailure(errorMsg);
    },
    { timeout: 9000, enableHighAccuracy: true, maximumAge: 30000 }
  );
}

function handleGPSFailure(message) {
  const statusBox = document.getElementById('gps-status-box');
  const statusText = document.getElementById('gps-status-text');
  const gpsActionBtn = document.getElementById('gps-action-btn');

  if (statusBox && statusText) {
    statusBox.classList.remove('hidden', 'bg-emerald-50', 'border-emerald-300', 'text-emerald-900');
    statusBox.classList.add('bg-amber-50', 'border-amber-300', 'text-amber-900');
    statusText.innerHTML = `
      <div class="flex items-start gap-2">
        <span class="text-base">⚠️</span>
        <span class="font-bold text-xs md:text-sm">${message}</span>
      </div>
    `;
  }

  if (gpsActionBtn) {
    gpsActionBtn.disabled = false;
    gpsActionBtn.classList.remove('opacity-70');
  }
}

// Fetch weather from backend API
async function fetchWeatherData() {
  try {
    let url = '/api/weather';
    if (currentLocationCoords) {
      url += `?lat=${currentLocationCoords.lat}&lon=${currentLocationCoords.lon}`;
    } else {
      url += `?district=${encodeURIComponent(currentDistrict)}`;
    }

    const response = await fetch(url);
    const result = await response.json();

    if (result.success && result.weather) {
      currentDistrict = result.weather.location;
      localStorage.setItem('smart_agro_district', currentDistrict);

      // Sync header dropdown if matches
      const districtSelect = document.getElementById('district-select');
      if (districtSelect) {
        districtSelect.value = currentDistrict;
      }

      renderWeatherUI(result.weather, result.alert, result.spraying);
    } else {
      console.error('Weather data error:', result);
    }
  } catch (err) {
    console.error('Failed to load weather:', err);
  }
}

// Render Weather & Agro-Alert in UI with High-Contrast Aesthetics
function renderWeatherUI(weather, alert, spraying) {
  // Update location label
  const locationEl = document.getElementById('weather-location-label');
  const tempEl = document.getElementById('weather-temp');
  const conditionEl = document.getElementById('weather-condition');
  const humidityEl = document.getElementById('weather-humidity');
  const rainProbEl = document.getElementById('weather-rain-prob');
  const windEl = document.getElementById('weather-wind');
  const sprayingEl = document.getElementById('spraying-window-badge');

  if (locationEl) locationEl.innerText = weather.location;
  if (tempEl) tempEl.innerText = `${weather.temp}°সে.`;
  if (conditionEl) conditionEl.innerText = `${weather.condition_bn} (অনুভূত ${weather.feels_like}°সে.)`;
  if (humidityEl) humidityEl.innerText = `${weather.humidity}%`;
  if (rainProbEl) rainProbEl.innerText = `${weather.rain_probability}%`;
  if (windEl) windEl.innerText = `${weather.wind_speed} কিমি/ঘ.`;

  // Spraying Window Advisory
  if (sprayingEl && spraying) {
    sprayingEl.innerText = spraying.window_bn;
    if (spraying.is_safe) {
      sprayingEl.className = 'text-xs md:text-sm font-black px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 block mt-2 shadow-xs';
    } else {
      sprayingEl.className = 'text-xs md:text-sm font-black px-3 py-1.5 rounded-xl bg-rose-100 text-rose-800 border border-rose-300 block mt-2 shadow-xs';
    }
  }

  // Render Agro-Alert Banner with high-contrast daylight styling
  const alertContainer = document.getElementById('agro-alert-container');
  const alertTitle = document.getElementById('agro-alert-title');
  const alertMessage = document.getElementById('agro-alert-message');
  const alertAction = document.getElementById('agro-alert-action');
  const alertBadge = document.getElementById('agro-alert-badge');

  if (alertContainer && alert) {
    if (alertTitle) alertTitle.innerText = alert.title;
    if (alertMessage) alertMessage.innerText = alert.message;
    if (alertAction) alertAction.innerText = alert.actionable_advice;

    // Reset styles while preserving responsive grid layout classes
    alertContainer.className = 'glass-panel p-6 lg:col-span-2 border-l-4 flex flex-col justify-between transition-all duration-300 shadow-md';
    
    if (alert.level === 'danger') {
      alertContainer.classList.add('border-rose-500', 'bg-rose-50/80');
      if (alertBadge) {
        alertBadge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 shrink-0';
        alertBadge.innerText = 'জরুরি সতর্কতা';
      }
    } else if (alert.level === 'warning') {
      alertContainer.classList.add('border-amber-500', 'bg-amber-50/80');
      if (alertBadge) {
        alertBadge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 shrink-0';
        alertBadge.innerText = 'সতর্কবার্তা';
      }
    } else {
      alertContainer.classList.add('border-emerald-500', 'bg-emerald-50/60');
      if (alertBadge) {
        alertBadge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0';
        alertBadge.innerText = 'অনুকূল আবহাওয়া';
      }
    }
  }
}

// Inject Interactive GPS Location Modal
function injectLocationModal() {
  const modalDiv = document.createElement('div');
  modalDiv.id = 'gps-location-modal';
  modalDiv.className = 'fixed inset-0 z-50 hidden items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in';

  modalDiv.innerHTML = `
    <div class="glass-panel p-6 md:p-8 max-w-lg w-full relative bg-white/95 rounded-3xl shadow-2xl border-2 border-emerald-400 max-h-[90vh] overflow-y-auto">
      
      <!-- Close Button -->
      <button onclick="SmartAgroWeather.closeLocationModal()" class="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold text-lg transition-colors">
        ✕
      </button>

      <!-- Modal Header -->
      <div class="text-center space-y-2 mb-6">
        <div class="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/25 border border-white">
          🛰️
        </div>
        <h3 class="text-xl md:text-2xl font-black text-slate-900">লাইভ জিপিএস অবস্থান সনাক্তকরণ</h3>
        <p class="text-xs md:text-sm text-slate-600 font-semibold font-bengali">
          আপনার ফসলের জমির সঠিক তাপমাত্রা, বৃষ্টিপাতের ঝুঁকি ও বালাইনাশক স্প্রে করার উপযুক্ত সময় জানতে অবস্থান অনুমতি দিন।
        </p>
      </div>

      <!-- Live GPS Trigger Button -->
      <div class="space-y-3">
        <button id="gps-action-btn" onclick="SmartAgroWeather.requestGPSLocation()" class="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm md:text-base flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-600/30 transition-all active:scale-95">
          <span class="text-xl">📍</span>
          <span>সরাসরি ব্রাউজার GPS দিয়ে অবস্থান খুঁজুন</span>
        </button>

        <!-- Status Box -->
        <div id="gps-status-box" class="hidden p-3.5 rounded-2xl border text-xs font-bold transition-all">
          <div id="gps-status-text"></div>
        </div>
      </div>

      <!-- Divider -->
      <div class="relative my-6 text-center">
        <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-200"></div></div>
        <span class="relative bg-white px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          অথবা বাংলাদেশ ৬৪ জেলার তালিকা থেকে বেছে নিন
        </span>
      </div>

      <!-- Quick 8 Division Centers -->
      <div class="mb-4">
        <span class="block text-xs font-black text-slate-700 mb-2">৮টি বিভাগীয় শহর (এক-ক্লিকে নির্বাচন):</span>
        <div class="flex flex-wrap gap-1.5">
          ${['ঢাকা', 'চট্টগ্রাম', 'রাজশাহী', 'রংপুর', 'খুলনা', 'বরিশাল', 'সিলেট', 'ময়মনসিংহ', 'ব্রাহ্মণবাড়িয়া'].map(d => `
            <button type="button" onclick="SmartAgroWeather.selectDistrictAndClose('${d}')" class="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 text-xs font-bold transition-all border border-slate-200 shadow-xs">
              📍 ${d}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- 64 District Dropdown -->
      <div>
        <label class="block text-xs font-black text-slate-700 mb-1.5">সকল ৬৪ জেলা:</label>
        <select id="modal-district-select" onchange="SmartAgroWeather.selectDistrictAndClose(this.value)" class="w-full bg-white border-2 border-emerald-300 text-slate-900 text-sm font-bold rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm cursor-pointer">
          ${DIVISIONS_AND_DISTRICTS.map(div => `
            <optgroup label="${div.division}">
              ${div.districts.map(dist => `<option value="${dist}" ${dist === currentDistrict ? 'selected' : ''}>📍 ${dist}</option>`).join('')}
            </optgroup>
          `).join('')}
        </select>
      </div>

      <!-- Footer Note -->
      <div class="mt-6 pt-3 border-t border-slate-100 text-center">
        <p class="text-[11px] text-slate-500 font-semibold">
          💡 অবস্থান পরিবর্তনের সাথে সাথে স্থানীয় আবহাওয়া ও ফসলের স্প্রে পূর্বাভাস স্বয়ংক্রিয়ভাবে আপডেট হয়।
        </p>
      </div>

    </div>
  `;

  document.body.appendChild(modalDiv);
}

function selectDistrictAndClose(districtName) {
  selectDistrict(districtName);
  closeLocationModal();
  if (window.SmartAgroAuth && SmartAgroAuth.showToast) {
    SmartAgroAuth.showToast(`নির্বাচিত জেলা: ${districtName}`);
  }
}

window.SmartAgroWeather = {
  initWeather,
  requestGPSLocation,
  fetchWeatherData,
  openLocationModal,
  closeLocationModal,
  selectDistrict,
  selectDistrictAndClose,
  getCurrentDistrict: () => currentDistrict
};
