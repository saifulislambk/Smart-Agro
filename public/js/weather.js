// ====================================================================
// Smart Agro (স্মার্ট এগ্রো) - Live GPS Weather, Spraying Advisory & Alerts
// Geolocation District Selection, 64-District Haversine & Dhaka Fallback
// ====================================================================

// HTML escaping utility for XSS defense and safe weather rendering
// এক্সএসএস আক্রমণ ও স্ক্রিপ্ট ইনজেকশন প্রতিরোধে এইচটিএমএল এসকেপ ইউটিলিটি
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

let currentLocationCoords = null;
let currentDistrict = localStorage.getItem('smart_agro_district') || 'ঢাকা';
let initialWeatherFetched = false;

// ====================================================================
// Bangladesh 64 Districts Coordinates Lookup Table (Bengali & English)
// Replicated from server.js for 100% offline-resilient Haversine matching
// ====================================================================
const BD_DISTRICTS_COORDS = [
  // Dhaka Division
  { name: 'ঢাকা', name_en: 'Dhaka', division: 'ঢাকা বিভাগ', lat: 23.8103, lon: 90.4125 },
  { name: 'গাজীপুর', name_en: 'Gazipur', division: 'ঢাকা বিভাগ', lat: 24.0023, lon: 90.4264 },
  { name: 'নারায়ণগঞ্জ', name_en: 'Narayanganj', division: 'ঢাকা বিভাগ', lat: 23.6238, lon: 90.5000 },
  { name: 'নরসিংদী', name_en: 'Narsingdi', division: 'ঢাকা বিভাগ', lat: 23.9193, lon: 90.7176 },
  { name: 'মুন্সীগঞ্জ', name_en: 'Munshiganj', division: 'ঢাকা বিভাগ', lat: 23.5422, lon: 90.5305 },
  { name: 'মানিকগঞ্জ', name_en: 'Manikganj', division: 'ঢাকা বিভাগ', lat: 23.8644, lon: 90.0047 },
  { name: 'টাঙ্গাইল', name_en: 'Tangail', division: 'ঢাকা বিভাগ', lat: 24.2513, lon: 89.9167 },
  { name: 'কিশোরগঞ্জ', name_en: 'Kishoreganj', division: 'ঢাকা বিভাগ', lat: 24.4449, lon: 90.7766 },
  { name: 'ফরিদপুর', name_en: 'Faridpur', division: 'ঢাকা বিভাগ', lat: 23.6070, lon: 89.8429 },
  { name: 'গোপালগঞ্জ', name_en: 'Gopalganj', division: 'ঢাকা বিভাগ', lat: 23.0051, lon: 89.8266 },
  { name: 'মাদারীপুর', name_en: 'Madaripur', division: 'ঢাকা বিভাগ', lat: 23.1641, lon: 90.1897 },
  { name: 'রাজবাড়ী', name_en: 'Rajbari', division: 'ঢাকা বিভাগ', lat: 23.7574, lon: 89.6445 },
  { name: 'শরীয়তপুর', name_en: 'Shariatpur', division: 'ঢাকা বিভাগ', lat: 23.2423, lon: 90.4348 },

  // Chittagong Division
  { name: 'চট্টগ্রাম', name_en: 'Chattogram', division: 'চট্টগ্রাম বিভাগ', lat: 22.3569, lon: 91.7832 },
  { name: 'কক্সবাজার', name_en: "Cox's Bazar", division: 'চট্টগ্রাম বিভাগ', lat: 21.4272, lon: 92.0058 },
  { name: 'কুমিল্লা', name_en: 'Cumilla', division: 'চট্টগ্রাম বিভাগ', lat: 23.4607, lon: 91.1809 },
  { name: 'ব্রাহ্মণবাড়িয়া', name_en: 'Brahmanbaria', division: 'চট্টগ্রাম বিভাগ', lat: 23.9608, lon: 91.1115 },
  { name: 'চাঁদপুর', name_en: 'Chandpur', division: 'চট্টগ্রাম বিভাগ', lat: 23.2333, lon: 90.6667 },
  { name: 'নোয়াখালী', name_en: 'Noakhali', division: 'চট্টগ্রাম বিভাগ', lat: 22.8696, lon: 91.0994 },
  { name: 'ফেনী', name_en: 'Feni', division: 'চট্টগ্রাম বিভাগ', lat: 23.0159, lon: 91.3976 },
  { name: 'লক্ষ্মীপুর', name_en: 'Lakshmipur', division: 'চট্টগ্রাম বিভাগ', lat: 22.9425, lon: 90.8412 },
  { name: 'খাগড়াছড়ি', name_en: 'Khagrachhari', division: 'চট্টগ্রাম বিভাগ', lat: 23.1193, lon: 91.9847 },
  { name: 'রাঙ্গামাটি', name_en: 'Rangamati', division: 'চট্টগ্রাম বিভাগ', lat: 22.7324, lon: 92.2985 },
  { name: 'বান্দরবান', name_en: 'Bandarban', division: 'চট্টগ্রাম বিভাগ', lat: 22.1953, lon: 92.2184 },

  // Rajshahi Division
  { name: 'রাজশাহী', name_en: 'Rajshahi', division: 'রাজশাহী বিভাগ', lat: 24.3745, lon: 88.6042 },
  { name: 'বগুড়া', name_en: 'Bogura', division: 'রাজশাহী বিভাগ', lat: 24.8465, lon: 89.3770 },
  { name: 'পাবনা', name_en: 'Pabna', division: 'রাজশাহী বিভাগ', lat: 24.0064, lon: 89.2372 },
  { name: 'সিরাজগঞ্জ', name_en: 'Sirajganj', division: 'রাজশাহী বিভাগ', lat: 24.4534, lon: 89.7008 },
  { name: 'নওগাঁ', name_en: 'Naogaon', division: 'রাজশাহী বিভাগ', lat: 24.7937, lon: 88.9318 },
  { name: 'নাটোর', name_en: 'Natore', division: 'রাজশাহী বিভাগ', lat: 24.4206, lon: 88.9324 },
  { name: 'চাঁপাইনবাবগঞ্জ', name_en: 'Chapainawabganj', division: 'রাজশাহী বিভাগ', lat: 24.5965, lon: 88.2776 },
  { name: 'জয়পুরহাট', name_en: 'Joypurhat', division: 'রাজশাহী বিভাগ', lat: 25.0968, lon: 89.0227 },

  // Rangpur Division
  { name: 'রংপুর', name_en: 'Rangpur', division: 'রংপুর বিভাগ', lat: 25.7439, lon: 89.2752 },
  { name: 'দিনাজপুর', name_en: 'Dinajpur', division: 'রংপুর বিভাগ', lat: 25.6217, lon: 88.6355 },
  { name: 'গাইবান্ধা', name_en: 'Gaibandha', division: 'রংপুর বিভাগ', lat: 25.3288, lon: 89.5406 },
  { name: 'কুড়িগ্রাম', name_en: 'Kurigram', division: 'রংপুর বিভাগ', lat: 25.8054, lon: 89.6362 },
  { name: 'নীলফামারী', name_en: 'Nilphamari', division: 'রংপুর বিভাগ', lat: 25.9318, lon: 88.8560 },
  { name: 'লালমনিরহাট', name_en: 'Lalmonirhat', division: 'রংপুর বিভাগ', lat: 25.9923, lon: 89.2847 },
  { name: 'পঞ্চগড়', name_en: 'Panchagarh', division: 'রংপুর বিভাগ', lat: 26.3411, lon: 88.5542 },
  { name: 'ঠাকুরগাঁও', name_en: 'Thakurgaon', division: 'রংপুর বিভাগ', lat: 26.0337, lon: 88.4617 },

  // Khulna Division
  { name: 'খুলনা', name_en: 'Khulna', division: 'খুলনা বিভাগ', lat: 22.8456, lon: 89.5403 },
  { name: 'যশোর', name_en: 'Jashore', division: 'খুলনা বিভাগ', lat: 23.1664, lon: 89.2081 },
  { name: 'বাগেরহাট', name_en: 'Bagerhat', division: 'খুলনা বিভাগ', lat: 22.6516, lon: 89.7859 },
  { name: 'সাতক্ষীরা', name_en: 'Satkhira', division: 'খুলনা বিভাগ', lat: 22.7185, lon: 89.0705 },
  { name: 'ঝিনাইদহ', name_en: 'Jhenaidah', division: 'খুলনা বিভাগ', lat: 23.5450, lon: 89.1526 },
  { name: 'মাগুরা', name_en: 'Magura', division: 'খুলনা বিভাগ', lat: 23.4873, lon: 89.4199 },
  { name: 'নড়াইল', name_en: 'Narail', division: 'খুলনা বিভাগ', lat: 23.1725, lon: 89.5127 },
  { name: 'কুষ্টিয়া', name_en: 'Kushtia', division: 'খুলনা বিভাগ', lat: 23.9013, lon: 89.1205 },
  { name: 'মেহেরপুর', name_en: 'Meherpur', division: 'খুলনা বিভাগ', lat: 23.7622, lon: 88.6318 },
  { name: 'চুয়াডাঙ্গা', name_en: 'Chuadanga', division: 'খুলনা বিভাগ', lat: 23.6402, lon: 88.8418 },

  // Barishal Division
  { name: 'বরিশাল', name_en: 'Barishal', division: 'বরিশাল বিভাগ', lat: 22.7010, lon: 90.3535 },
  { name: 'পটুয়াখালী', name_en: 'Patuakhali', division: 'বরিশাল বিভাগ', lat: 22.3596, lon: 90.3299 },
  { name: 'ভোলা', name_en: 'Bhola', division: 'বরিশাল বিভাগ', lat: 22.6859, lon: 90.6481 },
  { name: 'পিরোজপুর', name_en: 'Pirojpur', division: 'বরিশাল বিভাগ', lat: 22.5841, lon: 89.9720 },
  { name: 'বরগুনা', name_en: 'Barguna', division: 'বরিশাল বিভাগ', lat: 22.0953, lon: 90.1121 },
  { name: 'ঝালকাঠি', name_en: 'Jhalokati', division: 'বরিশাল বিভাগ', lat: 22.6406, lon: 90.1987 },

  // Sylhet Division
  { name: 'সিলেট', name_en: 'Sylhet', division: 'সিলেট বিভাগ', lat: 24.8949, lon: 91.8687 },
  { name: 'মৌলভীবাজার', name_en: 'Moulvibazar', division: 'সিলেট বিভাগ', lat: 24.4829, lon: 91.7774 },
  { name: 'হবিগঞ্জ', name_en: 'Habiganj', division: 'সিলেট বিভাগ', lat: 24.3749, lon: 91.4155 },
  { name: 'সুনামগঞ্জ', name_en: 'Sunamganj', division: 'সিলেট বিভাগ', lat: 25.0658, lon: 91.3950 },

  // Mymensingh Division
  { name: 'ময়মনসিংহ', name_en: 'Mymensingh', division: 'ময়মনসিংহ বিভাগ', lat: 24.7471, lon: 90.4203 },
  { name: 'জামালপুর', name_en: 'Jamalpur', division: 'ময়মনসিংহ বিভাগ', lat: 24.9375, lon: 89.9378 },
  { name: 'নেত্রকোণা', name_en: 'Netrokona', division: 'ময়মনসিংহ বিভাগ', lat: 24.8709, lon: 90.7279 },
  { name: 'শেরপুর', name_en: 'Sherpur', division: 'ময়মনসিংহ বিভাগ', lat: 25.0205, lon: 90.0153 }
];

// 64 Districts Grouped by 8 Divisions for quick modal search
const DIVISIONS_AND_DISTRICTS = [
  { division: 'ঢাকা বিভাগ', districts: ['ঢাকা', 'গাজীপুর', 'নারায়ণগঞ্জ', 'নরসিংদী', 'মুন্সীগঞ্জ', 'মানিকগঞ্জ', 'টাঙ্গাইল', 'কিশোরগঞ্জ', 'ফরিদপুর', 'গোপালগঞ্জ', 'মাদারীপুর', 'রাজবাড়ী', 'শরীয়তপুর'] },
  { division: 'চট্টগ্রাম বিভাগ', districts: ['চট্টগ্রাম', 'কুমিল্লা', 'ব্রাহ্মণবাড়িয়া', 'কক্সবাজার', 'চাঁদপুর', 'নোয়াখালী', 'ফেনী', 'লক্ষ্মীপুর', 'খাগড়াছড়ি', 'রাঙ্গামাটি', 'বান্দরবান'] },
  { division: 'রাজশাহী বিভাগ', districts: ['রাজশাহী', 'বগুড়া', 'পাবনা', 'সিরাজগঞ্জ', 'নওগাঁ', 'নাটোর', 'চাঁপাইনবাবগঞ্জ', 'জয়পুরহাট'] },
  { division: 'রংপুর বিভাগ', districts: ['রংপুর', 'দিনাজপুর', 'গাইবান্ধা', 'কুড়িগ্রাম', 'নীলফামারী', 'লালমনিরহাট', 'পঞ্চগড়', 'ঠাকুরগাঁও'] },
  { division: 'খুলনা বিভাগ', districts: ['খুলনা', 'যশোর', 'বাগেরহাট', 'সাতক্ষীরা', 'ঝিনাইদহ', 'মাগুরা', 'নড়াইল', 'কুষ্টিয়া', 'মেহেরপুর', 'চুয়াডাঙ্গা'] },
  { division: 'বরিশাল বিভাগ', districts: ['বরিশাল', 'পটুয়াখালী', 'ভোলা', 'পিরোজপুর', 'বরগুনা', 'ঝালকাঠি'] },
  { division: 'সিলেট বিভাগ', districts: ['সিলেট', 'মৌলভীবাজার', 'হবিগঞ্জ', 'সুনামগঞ্জ'] },
  { division: 'ময়মনসিংহ বিভাগ', districts: ['ময়মনসিংহ', 'জামালপুর', 'নেত্রকোণা', 'শেরপুর'] }
];

// ====================================================================
// Client-side Haversine Distance & Bounding Box Utilities
// ====================================================================

// Haversine formula calculates great-circle distance between two GPS points in kilometers
function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's mean radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Bounding box check for Bangladesh (20.5 <= lat <= 26.7, 88.0 <= lon <= 92.7)
function isInsideBangladesh(lat, lon) {
  return typeof lat === 'number' && typeof lon === 'number' &&
    !isNaN(lat) && !isNaN(lon) &&
    lat >= 20.5 && lat <= 26.7 &&
    lon >= 88.0 && lon <= 92.7;
}

// Match GPS coordinates to nearest of 64 districts using client-side Haversine formula
function findNearestDistrictClient(lat, lon) {
  if (!isInsideBangladesh(lat, lon)) {
    console.debug('Coordinates outside Bangladesh bounds or invalid:', lat, lon);
    return 'ঢাকা';
  }
  let closest = BD_DISTRICTS_COORDS[0];
  let minDistance = Infinity;
  for (const d of BD_DISTRICTS_COORDS) {
    const dist = haversineDistanceKm(lat, lon, d.lat, d.lon);
    if (dist < minDistance) {
      minDistance = dist;
      closest = d;
    }
  }
  return closest.name;
}

// Initialize Weather Module
async function initWeather() {
  const gpsBtn = document.getElementById('gps-refresh-btn');
  const districtSelects = document.querySelectorAll('#district-select');

  if (gpsBtn) {
    gpsBtn.addEventListener('click', openLocationModal);
  }

  districtSelects.forEach(sel => {
    sel.value = currentDistrict;
    sel.addEventListener('change', (e) => {
      selectDistrict(e.target.value);
    });
  });

  const locationLabel = document.getElementById('weather-location-label');
  if (locationLabel && !locationLabel.innerText) {
    locationLabel.innerText = currentDistrict;
  }

  // Initial fetch with default or cached district
  fetchWeatherData();
  initialWeatherFetched = true;

  // Asynchronously trigger auto-geolocation detection on page load (if user hasn't chosen manually)
  autoDetectDistrictOnLoad();
}

// Asynchronous Automatic District Geolocation Detection on Page Load
function autoDetectDistrictOnLoad() {
  // If user has explicitly selected a district manually, do not override with GPS
  if (localStorage.getItem('smart_agro_district_manual') === 'true') {
    return;
  }

  if (!navigator.geolocation) {
    fallbackToDhakaIfUnset();
    return;
  }

  try {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        try {
          // Double-check user hasn't selected manually while GPS was resolving
          if (localStorage.getItem('smart_agro_district_manual') === 'true') {
            return;
          }
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          if (isInsideBangladesh(lat, lon)) {
            const matchedDistrict = findNearestDistrictClient(lat, lon);
            currentLocationCoords = { lat, lon };
            currentDistrict = matchedDistrict;
            localStorage.setItem('smart_agro_district', currentDistrict);

            document.querySelectorAll('#district-select').forEach(sel => {
              sel.value = currentDistrict;
            });

            const locationLabel = document.getElementById('weather-location-label');
            if (locationLabel) locationLabel.innerText = currentDistrict;

            fetchWeatherData();
          } else {
            fallbackToDhakaIfUnset();
          }
        } catch (err) {
          fallbackToDhakaIfUnset();
        }
      },
      (error) => {
        fallbackToDhakaIfUnset();
      },
      { timeout: 6000, enableHighAccuracy: false, maximumAge: 300000 }
    );
  } catch (err) {
    fallbackToDhakaIfUnset();
  }
}

// Ensure default fallback district is cleanly set to Dhaka without unhandled errors
function fallbackToDhakaIfUnset() {
  const stored = localStorage.getItem('smart_agro_district');
  if (!stored) {
    currentDistrict = 'ঢাকা';
    localStorage.setItem('smart_agro_district', 'ঢাকা');
    document.querySelectorAll('#district-select').forEach(sel => {
      sel.value = 'ঢাকা';
    });
    const locationLabel = document.getElementById('weather-location-label');
    if (locationLabel) locationLabel.innerText = 'ঢাকা';
  }
  if (!initialWeatherFetched) {
    fetchWeatherData();
    initialWeatherFetched = true;
  }
}

// Select District Programmatically (Instant Reactive Weather Update)
function selectDistrict(districtName) {
  currentDistrict = districtName || 'ঢাকা';
  currentLocationCoords = null; // Clear GPS coords so the selected district's coords are used!
  localStorage.setItem('smart_agro_district', currentDistrict);
  localStorage.setItem('smart_agro_district_manual', 'true'); // Flag manual selection to preserve on reload

  document.querySelectorAll('#district-select').forEach(sel => {
    sel.value = currentDistrict;
  });

  const locationLabel = document.getElementById('weather-location-label');
  if (locationLabel) {
    locationLabel.innerText = currentDistrict;
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

// Request HTML5 Geolocation with Visual Feedback (Manual GPS Modal Button)
function requestGPSLocation() {
  const statusBox = document.getElementById('gps-status-box');
  const statusText = document.getElementById('gps-status-text');
  const gpsActionBtn = document.getElementById('gps-action-btn');

  if (statusBox && statusText) {
    statusBox.classList.remove('hidden', 'bg-rose-50', 'border-rose-300', 'text-rose-800', 'bg-amber-50', 'border-amber-300', 'text-amber-900');
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
    handleGPSFailure('আপনার ব্রাউজারে জিপিএস সনাক্তকরণ সমর্থন করে না। ঢাকা জেলা বা নিচের তালিকা থেকে জেলা বেছে নিন।');
    return;
  }

  try {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          currentLocationCoords = { lat, lon };

          if (isInsideBangladesh(lat, lon)) {
            const matchedDistrict = findNearestDistrictClient(lat, lon);
            currentDistrict = matchedDistrict;
          } else {
            console.debug('Manual GPS coordinates outside Bangladesh:', lat, lon);
            currentDistrict = 'ঢাকা';
          }

          localStorage.removeItem('smart_agro_district_manual'); // Explicit GPS request overrides previous manual override
          localStorage.setItem('smart_agro_district', currentDistrict);

          document.querySelectorAll('#district-select').forEach(sel => {
            sel.value = currentDistrict;
          });

          const locationLabel = document.getElementById('weather-location-label');
          if (locationLabel) locationLabel.innerText = currentDistrict;

          if (statusText) {
            statusText.innerHTML = `
              <div class="flex items-center gap-2 text-emerald-800">
                <span class="text-lg">✅</span>
                <span class="font-bold">জিপিএস অবস্থান সনাক্ত হয়েছে (${currentDistrict})! আবহাওয়া ও বালাই তথ্য লোড হচ্ছে...</span>
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
        } catch (err) {
          console.debug('Error in manual GPS location processing:', err);
          handleGPSFailure('অবস্থান বিশ্লেষণে সমস্যা হয়েছে। অনুগ্রহ করে তালিকা থেকে জেলা বেছে নিন।');
        } finally {
          if (gpsActionBtn) {
            gpsActionBtn.disabled = false;
            gpsActionBtn.classList.remove('opacity-70');
          }
        }
      },
      (error) => {
        console.debug('Manual GPS location error:', error ? (error.message || error.code) : 'unknown');
        let errorMsg = 'লোকেশন এক্সেস পাওয়া যায়নি (অনুমতি দিন অথবা নিচের তালিকা থেকে জেলা বেছে নিন)।';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = 'ব্রাউজারে লোকেশন পারমিশন ব্লক করা আছে। নিচে আপনার জেলা নির্বাচন করুন:';
        } else if (error.code === error.TIMEOUT) {
          errorMsg = 'জিপিএস সংযোগে বিলম্ব হচ্ছে। নিচে আপনার জেলা বেছে নিন:';
        }
        handleGPSFailure(errorMsg);
      },
      { timeout: 6000, enableHighAccuracy: true, maximumAge: 30000 }
    );
  } catch (err) {
    console.debug('Manual GPS location invocation error:', err);
    handleGPSFailure('জিপিএস অনুরোধ ব্যর্থ হয়েছে। নিচে আপনার জেলা বেছে নিন:');
  }
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

// Fetch weather from backend API or Direct Live Global Satellite API
async function fetchWeatherData() {
  const districtName = currentDistrict || 'ঢাকা';

  // 1. Give immediate visual feedback that weather is actively updating
  const tempEl = document.getElementById('weather-temp');
  const conditionEl = document.getElementById('weather-condition');
  const humidityEl = document.getElementById('weather-humidity');
  const rainProbEl = document.getElementById('weather-rain-prob');
  const windEl = document.getElementById('weather-wind');

  if (tempEl) tempEl.style.opacity = '0.4';
  if (conditionEl) conditionEl.style.opacity = '0.4';

  let coords = currentLocationCoords;
  if (!coords) {
    const found = BD_DISTRICTS_COORDS.find(d => d.name === districtName) || BD_DISTRICTS_COORDS[0];
    coords = { lat: found.lat, lon: found.lon };
  }

  // 1. Try Backend High-Precision Weather API first (powered by WeatherAPI ground station key)
  try {
    let url = '/api/weather';
    if (currentLocationCoords) {
      url += `?lat=${currentLocationCoords.lat}&lon=${currentLocationCoords.lon}`;
    } else {
      url += `?district=${encodeURIComponent(districtName)}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.weather) {
        currentDistrict = result.weather.location || districtName;
        localStorage.setItem('smart_agro_district', currentDistrict);

        document.querySelectorAll('#district-select').forEach(sel => {
          sel.value = currentDistrict;
        });

        renderWeatherUI(result.weather, result.alert, result.spraying);

        if (result.forecast && Array.isArray(result.forecast)) {
          renderDailyForecastUI(result.forecast, currentDistrict);
        }

        if (tempEl) tempEl.style.opacity = '1';
        if (conditionEl) conditionEl.style.opacity = '1';
        return;
      }
    }
  } catch (backendErr) {
    console.debug('Backend weather API notice, falling back to client-side Open-Meteo:', backendErr.message);
  }

  // 2. Client-side Direct Live Open-Meteo Fallback (100% Real-time ECMWF Satellite Data, Instant & CORS-enabled)
  try {
    const omUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum&models=ecmwf_ifs025&timezone=Asia%2FDhaka`;
    const omRes = await fetch(omUrl);
    if (omRes.ok) {
      const omData = await omRes.json();
      if (omData && omData.current) {
        const cur = omData.current;
        const currentHour = new Date().getHours();
        const isDay = currentHour >= 6 && currentHour <= 18;
        const wCode = cur.weather_code || 0;

        let conditionBn = 'পরিষ্কার ও রৌদ্রোজ্জ্বল';
        let icon = isDay ? '01d' : '01n';
        let rainProb = 10;
        if (wCode === 0) { conditionBn = 'আকাশ সম্পূর্ণ পরিষ্কার'; icon = isDay ? '01d' : '01n'; rainProb = 5; }
        else if (wCode <= 3) { conditionBn = 'আংশিক মেঘলা'; icon = isDay ? '02d' : '02n'; rainProb = 20; }
        else if (wCode === 45 || wCode === 48) { conditionBn = 'কুয়াশাচ্ছন্ন পরিবেশ'; icon = '50d'; rainProb = 15; }
        else if (wCode >= 51 && wCode <= 55) { conditionBn = 'হালকা গুঁড়ি গুঁড়ি বৃষ্টি'; icon = '10d'; rainProb = 65; }
        else if (wCode >= 61 && wCode <= 65) { conditionBn = 'মাঝারি থেকে ভারী বৃষ্টিপাত'; icon = '10d'; rainProb = 85; }
        else if (wCode >= 80 && wCode <= 82) { conditionBn = 'বর্ষণমুখর বৃষ্টি'; icon = '09d'; rainProb = 90; }
        else if (wCode >= 95) { conditionBn = 'বজ্রঝড় ও শিলাবৃষ্টির ঝুঁকি'; icon = '11d'; rainProb = 95; }

        if (cur.precipitation > 0) rainProb = Math.max(rainProb, 80);

        const temp = Math.round(cur.temperature_2m);
        const feelsLike = Math.round(cur.apparent_temperature);
        const humidity = Math.round(cur.relative_humidity_2m);
        const windSpeed = Math.round(cur.wind_speed_10m);

        const isSafeToSpray = rainProb < 40 && windSpeed <= 15;
        const spraying = {
          is_safe: isSafeToSpray,
          window_bn: isSafeToSpray ? 'কীটনাশক স্প্রে করার উপযুক্ত সময়' : 'বৃষ্টি বা বাতাসের ঝুঁকি: স্প্রে করা থেকে বিরত থাকুন'
        };

        let alertLevel = 'success';
        let alertTitle = 'অনুকূল আবহাওয়া';
        let alertMsg = 'ফসলের বৃদ্ধির জন্য স্বাভাবিক ও অনুকূল আবহাওয়া বিরাজ করছে।';
        let alertAction = 'নিয়মিত সেচ ও জমিতে আগাছা পরিষ্কার অব্যাহত রাখুন।';

        if (rainProb >= 70 || cur.precipitation > 2) {
          alertLevel = 'danger';
          alertTitle = 'ভারী বৃষ্টির সতর্কতা';
          alertMsg = `${districtName} অঞ্চলে বৃষ্টির সম্ভাবনা বেশি। জমিতে অতিরিক্ত পানি নিষ্কাশনের ব্যবস্থা নিন।`;
          alertAction = 'পানি নিষ্কাশন নালা পরিষ্কার রাখুন এবং সার দেওয়া সাময়িক স্থগিত রাখুন।';
        } else if (temp >= 35) {
          alertLevel = 'warning';
          alertTitle = 'তীব্র তাপপ্রবাহ';
          alertMsg = `${districtName} অঞ্চলে তাপমাত্রা বেশি। ফসলে আর্দ্রতার ঘাটতি হতে পারে।`;
          alertAction = 'সকালে বা বিকেলে জমিতে হালকা সেচ দিন।';
        } else if (temp <= 14) {
          alertLevel = 'warning';
          alertTitle = 'শৈত্যপ্রবাহ ও কুয়াশা';
          alertMsg = `${districtName} অঞ্চলে ঠান্ডা আবহাওয়া। ব্লাইট ও ছত্রাকের ঝুঁকি রয়েছে।`;
          alertAction = 'আলু ও টমেটোতে আগাম ছত্রাকনাশক স্প্রে করুন।';
        }

        const alert = {
          level: alertLevel,
          title: alertTitle,
          message: alertMsg,
          actionable_advice: alertAction
        };

        const weather = {
          source: 'Open-Meteo Live Satellite',
          location: districtName,
          temp: temp,
          feels_like: feelsLike,
          humidity: humidity,
          wind_speed: windSpeed,
          rain_probability: rainProb,
          condition_bn: conditionBn,
          icon: icon,
          is_day: isDay
        };

        renderWeatherUI(weather, alert, spraying);

        // Parse and render 5-day daily precision agro-forecast from Open-Meteo satellite
        if (omData.daily && omData.daily.time) {
          const banglaDays = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
          const banglaMonths = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];
          const toBnNum = (n) => String(n).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]);
          const d = omData.daily;
          const forecastList = [];
          for (let i = 0; i < Math.min(5, d.time.length); i++) {
            const dObj = new Date(d.time[i] + 'T00:00:00');
            let dayName = banglaDays[dObj.getDay()];
            if (i === 0) dayName = 'আজ';
            else if (i === 1) dayName = 'আগামীকাল';

            const maxTemp = Math.round(d.temperature_2m_max[i]);
            const minTemp = Math.round(d.temperature_2m_min[i]);
            const rainP = Math.round(d.precipitation_probability_max ? (d.precipitation_probability_max[i] || 0) : 0);
            const wC = d.weather_code ? (d.weather_code[i] || 0) : 0;

            let fIcon = '☀️';
            let fCond = 'রৌদ্রোজ্জ্বল';
            if (wC === 0) { fIcon = '☀️'; fCond = 'রৌদ্রোজ্জ্বল'; }
            else if (wC <= 3) { fIcon = '⛅'; fCond = 'আংশিক মেঘলা'; }
            else if (wC === 45 || wC === 48) { fIcon = '🌫️'; fCond = 'কুয়াশাচ্ছন্ন'; }
            else if (wC >= 51 && wC <= 65) { fIcon = '🌧️'; fCond = 'বৃষ্টিপাত'; }
            else if (wC >= 80 && wC <= 82) { fIcon = '🌧️'; fCond = 'বর্ষণমুখর বৃষ্টি'; }
            else if (wC >= 95) { fIcon = '⛈️'; fCond = 'বজ্রঝড়'; }

            forecastList.push({
              day_bn: dayName,
              date_bn: `${toBnNum(dObj.getDate())} ${banglaMonths[dObj.getMonth()]}`,
              temp_max: maxTemp,
              temp_min: minTemp,
              rain_prob: rainP,
              icon: fIcon,
              condition: fCond
            });
          }
          renderDailyForecastUI(forecastList, districtName);
        }

        if (tempEl) tempEl.style.opacity = '1';
        if (conditionEl) conditionEl.style.opacity = '1';
        return;
      }
    }
  } catch (clientOmErr) {
    console.debug('Direct Open-Meteo notice:', clientOmErr.message);
  } finally {
    if (tempEl) tempEl.style.opacity = '1';
    if (conditionEl) conditionEl.style.opacity = '1';
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

// Render 5-Day Precision Daily Agro-Weather Forecast
function renderDailyForecastUI(forecastList, locationName) {
  const container = document.getElementById('daily-forecast-cards');
  const locNameEl = document.getElementById('forecast-location-name');
  if (locNameEl && locationName) {
    locNameEl.innerText = escapeHtml(locationName);
  }

  if (!container) return;

  if (!Array.isArray(forecastList) || forecastList.length === 0) {
    return;
  }

  const toBnNum = (n) => String(n).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]);

  container.innerHTML = forecastList.map((item, idx) => {
    const isToday = idx === 0;
    const isTomorrow = idx === 1;
    const dayLabel = item.day_bn || (isToday ? 'আজ' : (isTomorrow ? 'আগামীকাল' : 'দিন ' + toBnNum(idx + 1)));
    const dateLabel = item.date_bn || '';
    const tempMaxBn = toBnNum(item.temp_max !== undefined ? item.temp_max : 28);
    const tempMinBn = toBnNum(item.temp_min !== undefined ? item.temp_min : 18);
    const rainProb = item.rain_prob !== undefined ? item.rain_prob : 0;
    const rainProbBn = toBnNum(rainProb);
    const icon = item.icon || '☀️';
    const condition = item.condition || 'পরিষ্কার';

    let rainBadgeColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (rainProb >= 60) {
      rainBadgeColor = 'text-rose-700 bg-rose-50 border-rose-200';
    } else if (rainProb >= 30) {
      rainBadgeColor = 'text-amber-700 bg-amber-50 border-amber-200';
    }

    return `
      <div class="p-3.5 rounded-xl border ${isToday ? 'bg-forest-50/50 border-emerald-300 ring-1 ring-emerald-300/40' : 'bg-white border-slate-200 hover:border-slate-300'} flex flex-col justify-between transition-all duration-200 shadow-2xs">
        <div>
          <div class="flex items-center justify-between gap-1 mb-1.5">
            <span class="text-xs font-black ${isToday ? 'text-forest-900' : 'text-slate-800'}">${escapeHtml(dayLabel)}</span>
            <span class="text-[10px] text-slate-400 font-medium">${escapeHtml(dateLabel)}</span>
          </div>
          <div class="flex items-center gap-2 my-2">
            <span class="text-2xl">${icon}</span>
            <span class="text-[11px] font-bold text-slate-600 line-clamp-1">${escapeHtml(condition)}</span>
          </div>
        </div>

        <div class="space-y-1.5 pt-2 border-t border-slate-100">
          <div class="flex items-baseline justify-between text-xs font-black">
            <span class="text-slate-900 text-sm">${tempMaxBn}°</span>
            <span class="text-slate-400 font-bold text-[11px]">${tempMinBn}° সে.</span>
          </div>
          <div class="flex items-center justify-between text-[10px] px-1.5 py-0.5 rounded-md border ${rainBadgeColor} font-bold">
            <span>🌧️ বৃষ্টি:</span>
            <span>${rainProbBn}%</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
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
          ${['ঢাকা', 'চট্টগ্রাম', 'রাজশাহী', 'রংপুর', 'খুলনা', 'বরিশাল', 'সিলেট', 'ময়মনসিংহ'].map(d => `
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
  autoDetectDistrictOnLoad,
  requestGPSLocation,
  fetchWeatherData,
  renderDailyForecastUI,
  openLocationModal,
  closeLocationModal,
  selectDistrict,
  selectDistrictAndClose,
  findNearestDistrictClient,
  isInsideBangladesh,
  haversineDistanceKm,
  BD_DISTRICTS_COORDS,
  getCurrentDistrict: () => currentDistrict
};
