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
if (currentDistrict === 'ব্রাহ্মণবাড়িয়া') {
  currentDistrict = 'ঢাকা';
  localStorage.setItem('smart_agro_district', 'ঢাকা');
}
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

  const locationLabel = document.getElementById('weather-location-label');
  if (locationLabel && (!locationLabel.innerText || locationLabel.innerText.trim() === 'ব্রাহ্মণবাড়িয়া')) {
    locationLabel.innerText = currentDistrict;
  }

  // Initial fetch with default or cached district
  fetchWeatherData();
  initialWeatherFetched = true;

  // Asynchronously trigger auto-geolocation detection on page load
  autoDetectDistrictOnLoad();
}

// Asynchronous Automatic District Geolocation Detection on Page Load
function autoDetectDistrictOnLoad() {
  if (!navigator.geolocation) {
    console.debug('HTML5 Geolocation not supported by browser. Falling back to Dhaka.');
    fallbackToDhakaIfUnset();
    return;
  }

  try {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          if (isInsideBangladesh(lat, lon)) {
            const matchedDistrict = findNearestDistrictClient(lat, lon);
            console.debug('Auto-detected district from GPS:', matchedDistrict, lat, lon);
            currentLocationCoords = { lat, lon };
            currentDistrict = matchedDistrict;
            localStorage.setItem('smart_agro_district', currentDistrict);

            const districtSelect = document.getElementById('district-select');
            if (districtSelect) districtSelect.value = currentDistrict;

            const locationLabel = document.getElementById('weather-location-label');
            if (locationLabel) locationLabel.innerText = currentDistrict;

            fetchWeatherData();
          } else {
            console.debug('GPS coordinates outside Bangladesh bounds:', lat, lon);
            fallbackToDhakaIfUnset();
          }
        } catch (err) {
          console.debug('Error resolving auto-detected coordinates:', err);
          fallbackToDhakaIfUnset();
        }
      },
      (error) => {
        // PERMISSION_DENIED (1), POSITION_UNAVAILABLE (2), TIMEOUT (3)
        console.debug('Auto-geolocation denied, timed out, or unavailable:', error ? (error.message || error.code) : 'unknown');
        fallbackToDhakaIfUnset();
      },
      { timeout: 6000, enableHighAccuracy: false, maximumAge: 300000 }
    );
  } catch (err) {
    console.debug('Auto-geolocation invocation error:', err);
    fallbackToDhakaIfUnset();
  }
}

// Ensure default fallback district is cleanly set to Dhaka without unhandled errors
function fallbackToDhakaIfUnset() {
  const stored = localStorage.getItem('smart_agro_district');
  if (!stored || stored === 'ব্রাহ্মণবাড়িয়া') {
    currentDistrict = 'ঢাকা';
    localStorage.setItem('smart_agro_district', 'ঢাকা');
    const districtSelect = document.getElementById('district-select');
    if (districtSelect) districtSelect.value = 'ঢাকা';
    const locationLabel = document.getElementById('weather-location-label');
    if (locationLabel) locationLabel.innerText = 'ঢাকা';
  }
  if (!initialWeatherFetched) {
    fetchWeatherData();
    initialWeatherFetched = true;
  }
}

// Select District Programmatically
function selectDistrict(districtName) {
  currentDistrict = districtName || 'ঢাকা';
  currentLocationCoords = null;
  localStorage.setItem('smart_agro_district', currentDistrict);

  const districtSelect = document.getElementById('district-select');
  if (districtSelect) {
    districtSelect.value = currentDistrict;
  }

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

          localStorage.setItem('smart_agro_district', currentDistrict);

          const districtSelect = document.getElementById('district-select');
          if (districtSelect) districtSelect.value = currentDistrict;

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

// Fetch weather from backend API
async function fetchWeatherData() {
  try {
    let url = '/api/weather';
    if (currentLocationCoords) {
      url += `?lat=${currentLocationCoords.lat}&lon=${currentLocationCoords.lon}`;
    } else {
      url += `?district=${encodeURIComponent(currentDistrict || 'ঢাকা')}`;
    }

    const response = await fetch(url);
    const result = await response.json();

    if (result.success && result.weather) {
      currentDistrict = result.weather.location || currentDistrict || 'ঢাকা';
      localStorage.setItem('smart_agro_district', currentDistrict);

      // Sync header dropdown if matches
      const districtSelect = document.getElementById('district-select');
      if (districtSelect) {
        districtSelect.value = currentDistrict;
      }

      renderWeatherUI(result.weather, result.alert, result.spraying);
    } else {
      console.debug('Weather data response was not successful:', result);
    }
  } catch (err) {
    console.debug('Failed to load weather:', err);
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
