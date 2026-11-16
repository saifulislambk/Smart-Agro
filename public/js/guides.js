// ====================================================================
// Smart Agro (স্মার্ট এগ্রো) - Comprehensive 25 Crops Cultivation Encyclopedia
// ====================================================================

let allCropGuides = [];
let selectedCropId = 'rice';
let currentCategoryFilter = 'all';
let currentSeasonFilter = 'all';
let searchQuery = '';
let currentGalleryType = 'crop';

// Vector Illustration Icons for the 5 Agricultural Stages
const stageIconsSvg = {
  1: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-7 h-7 text-amber-700">
        <path d="M10 17h4V5H2v12h4m4 0a2 2 0 1 0 4 0m-4 0a2 2 0 1 1 4 0M6 17a2 2 0 1 0 4 0M6 17a2 2 0 1 1 4 0"/>
        <path d="M14 9h4l3 3v5h-7"/>
      </svg>`,
  2: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-7 h-7 text-emerald-700">
        <path d="M12 22v-9"/>
        <path d="M12 13c-3-3-3-7 0-9 3 2 3 6 0 9Z"/>
        <path d="M9 16c-2-1-3-3-2-5 2 .5 3 2 2 5Z"/>
        <path d="M15 16c2-1 3-3 2-5-2 .5-3 2-2 5Z"/>
      </svg>`,
  3: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-7 h-7 text-blue-700">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
      </svg>`,
  4: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-7 h-7 text-amber-600">
        <path d="m2 22 1-1h3l9-9"/>
        <path d="M3 21v-3l9-9"/>
        <path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9"/>
        <path d="m9 15 6-6"/>
      </svg>`,
  5: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-7 h-7 text-purple-700">
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
        <path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>
      </svg>`
};

// Initialize Guides Module
async function initGuides() {
  // Check URL parameters or Hash for pre-selected crop
  const urlParams = new URLSearchParams(window.location.search);
  const paramCrop = urlParams.get('crop');
  const hashCrop = window.location.hash ? window.location.hash.substring(1) : null;
  if (paramCrop) {
    window.location.href = `/crop-detail?crop=${encodeURIComponent(paramCrop.toLowerCase())}`;
    return;
  } else if (hashCrop) {
    window.location.href = `/crop-detail?crop=${encodeURIComponent(hashCrop.toLowerCase())}`;
    return;
  }

  setupGuideFilters();
  await loadAllGuides();
}

// Setup Search & Filter Listeners
function setupGuideFilters() {
  const searchInput = document.getElementById('guide-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      applyFilters();
    });
  }

  // Category filter chips
  const categoryButtons = document.querySelectorAll('[data-category-filter]');
  categoryButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      categoryButtons.forEach(b => {
        b.classList.remove('bg-emerald-600', 'text-white', 'shadow-md');
        b.classList.add('bg-slate-100', 'text-slate-700', 'hover:bg-slate-200');
      });
      btn.classList.add('bg-emerald-600', 'text-white', 'shadow-md');
      btn.classList.remove('bg-slate-100', 'text-slate-700', 'hover:bg-slate-200');

      currentCategoryFilter = btn.getAttribute('data-category-filter');
      applyFilters();
    });
  });

  // Season filter chips
  const seasonButtons = document.querySelectorAll('[data-season-filter]');
  seasonButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      seasonButtons.forEach(b => {
        b.classList.remove('bg-emerald-100', 'text-emerald-800', 'border-emerald-300', 'font-black');
        b.classList.add('bg-white', 'text-slate-600', 'border-slate-200', 'font-medium');
      });
      btn.classList.add('bg-emerald-100', 'text-emerald-800', 'border-emerald-300', 'font-black');
      btn.classList.remove('bg-white', 'text-slate-600', 'border-slate-200', 'font-medium');

      currentSeasonFilter = btn.getAttribute('data-season-filter');
      applyFilters();
    });
  });
}

// Fetch crop list from backend
async function loadAllGuides() {
  const gridContainer = document.getElementById('crops-grid-container');
  if (!gridContainer) return;

  gridContainer.innerHTML = `
    <div class="col-span-full py-12 text-center text-emerald-800 glass-panel">
      <div class="inline-block animate-spin text-4xl mb-3">⏳</div>
      <p class="text-sm font-bold text-slate-800">বাংলাদেশের ২৫টি ফসলের সমৃদ্ধ কৃষি বিশ্বকোষ লোড হচ্ছে...</p>
    </div>
  `;

  try {
    const res = await fetch('/api/guides');
    const result = await res.json();

    if (result.success && result.data && result.data.length > 0) {
      allCropGuides = result.data;
      applyFilters();

      // Loaded catalog ready
    } else {
      gridContainer.innerHTML = '<p class="text-center text-rose-600 py-6 font-bold">কোনো গাইড পাওয়া যায়নি।</p>';
    }
  } catch (err) {
    console.error('Error fetching guides:', err);
    gridContainer.innerHTML = '<p class="text-center text-rose-600 py-6 font-bold">গাইড লোড করতে ত্রুটি হয়েছে।</p>';
  }
}

// Filter Crops by Category, Season & Search Query
function applyFilters() {
  let filtered = allCropGuides.filter(crop => {
    // Text Search in BN name, EN name, and Variety Info
    const matchesSearch = !searchQuery || 
      crop.crop_name_bn.toLowerCase().includes(searchQuery) ||
      (crop.crop_name_en && crop.crop_name_en.toLowerCase().includes(searchQuery)) ||
      (crop.variety_info && crop.variety_info.toLowerCase().includes(searchQuery));

    // Category filter
    let matchesCategory = true;
    if (currentCategoryFilter !== 'all') {
      matchesCategory = (crop.category_id === currentCategoryFilter);
    }

    // Season filter
    let matchesSeason = true;
    if (currentSeasonFilter !== 'all') {
      const seasonText = (crop.season || '').toLowerCase();
      if (currentSeasonFilter === 'rabi') matchesSeason = seasonText.includes('রবি') || seasonText.includes('শীত') || seasonText.includes('নভেম্বর');
      else if (currentSeasonFilter === 'kharif') matchesSeason = seasonText.includes('খরিপ') || seasonText.includes('আমন') || seasonText.includes('গ্রীষ্ম');
      else if (currentSeasonFilter === 'allyear') matchesSeason = seasonText.includes('সারা বছর') || seasonText.includes('যেকোনো');
    }

    return matchesSearch && matchesCategory && matchesSeason;
  });

  // Update live count indicator
  const countEl = document.getElementById('filtered-crop-count');
  if (countEl) {
    countEl.innerText = `${filtered.length}টি`;
  }

  renderCropGrid(filtered);
}

// Render Crop Selection Cards in Grid
function renderCropGrid(guides) {
  const gridContainer = document.getElementById('crops-grid-container');
  if (!gridContainer) return;

  if (guides.length === 0) {
    gridContainer.innerHTML = `
      <div class="col-span-full py-10 text-center text-slate-500 glass-panel">
        <span class="text-4xl block mb-2">🔍</span>
        <p class="font-bold text-base text-slate-800">কোনো ফসল খুঁজে পাওয়া যায়নি।</p>
        <p class="text-xs text-slate-500 mt-1">অন্য কোনো নাম বা ক্যাটাগরি দিয়ে চেষ্টা করুন।</p>
      </div>
    `;
    return;
  }

  gridContainer.innerHTML = guides.map(crop => {
    const thumbnail = (crop.gallery && crop.gallery.crop) ? crop.gallery.crop : '/images/crops/rice.jpg';
    
    return `
      <a href="/crop-detail?crop=${crop.crop_id}" 
         class="glass-panel-interactive cursor-pointer p-3 md:p-3.5 rounded-2xl flex flex-col justify-between border-2 transition-all duration-200 group border-slate-200 hover:border-emerald-500 hover:shadow-lg bg-white">
        <div>
          <!-- Thumbnail with Icon Overlay -->
          <div class="w-full h-24 sm:h-28 rounded-xl overflow-hidden border border-emerald-200 shadow-xs relative mb-2.5 bg-slate-100">
            <img src="${thumbnail}" alt="${crop.crop_name_bn}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
            <span class="absolute top-1.5 right-1.5 text-xs bg-white/95 backdrop-blur-sm rounded-md px-1.5 py-0.5 shadow font-bold text-slate-800">
              ${crop.icon || '🌱'}
            </span>
            <span class="absolute bottom-1.5 left-1.5 text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-900/80 text-white backdrop-blur-xs">
              ${crop.category || 'ফসল'}
            </span>
          </div>

          <!-- Title and Variety -->
          <h3 class="text-sm sm:text-base font-black text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
            ${crop.crop_name_bn}
          </h3>
          <p class="text-[11px] text-slate-500 font-semibold truncate mt-0.5">
            ${crop.variety_info || ''}
          </p>
        </div>

        <!-- Duration & Action Link -->
        <div class="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-emerald-800 font-bold">
          <span class="truncate text-slate-500 font-medium">⏱️ ${crop.duration ? crop.duration.split('/')[0].trim() : '৫ ধাপ'}</span>
          <span class="text-emerald-700 font-black group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
            <span>রোডম্যাপ</span>
            <span>→</span>
          </span>
        </div>
      </a>
    `;
  }).join('');
}

// Select a crop - opens dedicated page
function selectCrop(cropId) {
  if (cropId) {
    window.location.href = `/crop-detail?crop=${cropId}`;
  }
}

// Render Crop Timeline (if viewport is present)
function renderCropTimeline(cropId) {
  const timelineContainer = document.getElementById('crop-timeline-viewport');
  if (!timelineContainer) return;

  selectedCropId = cropId || selectedCropId || 'rice';
  const crop = allCropGuides.find(c => c.crop_id === selectedCropId);
  if (!crop) return;

  const steps = typeof crop.steps === 'string' ? JSON.parse(crop.steps) : crop.steps;
  const gallery = crop.gallery || {
    crop: '/images/crops/' + crop.crop_id + '.jpg',
    seed: '/images/seeds/' + crop.crop_id + '_seed.jpg',
    seedling: '/images/seedlings/' + crop.crop_id + '_seedling.jpg',
    harvest: '/images/harvest/' + crop.crop_id + '_harvest.jpg'
  };

  const currentHeroImg = gallery[currentGalleryType] || gallery.crop;

  let timelineHtml = `
    <!-- Dedicated Single-Crop Isolated Printable Container -->
    <div id="printable-crop-roadmap" class="space-y-6">

      <!-- Official BARI / BRRI Certification Header Banner -->
      <div class="print-official-header glass-panel p-6 border-t-4 border-t-emerald-600 shadow-lg">
        <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          
          <div class="flex items-center space-x-4">
            <div class="w-20 h-20 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-md shrink-0 relative bg-emerald-50 cursor-pointer" onclick="SmartAgroGuides.openLightbox('${gallery.crop}', '${crop.crop_name_bn}', 'পরিপক্ক ${crop.crop_name_bn} গাছ ও ফসল')">
              <img id="main-gallery-preview" src="${currentHeroImg}" alt="${crop.crop_name_bn}" class="w-full h-full object-cover">
              <span class="absolute bottom-1 right-1 text-base bg-white/95 rounded-md px-1 shadow">${crop.icon || '🌱'}</span>
            </div>
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="text-2xl md:text-3xl font-black text-slate-900">${crop.crop_name_bn} চাষের সম্পূর্ণ রোডম্যাপ</h2>
                <span class="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  ${crop.category || 'আধুনিক চাষ'}
                </span>
              </div>
              <p class="text-xs md:text-sm text-slate-500 font-semibold italic mt-0.5">
                ${crop.crop_name_en || ''}
              </p>
              <div class="text-xs text-slate-700 font-bold mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                <span>🌾 <strong>অনুমোদিত জাত:</strong> ${crop.variety_info || ''}</span>
                <span>📅 <strong>মৌসুম:</strong> <span class="text-emerald-700">${crop.season || ''}</span></span>
                <span>⏱️ <strong>জীবনকাল:</strong> ${crop.duration || ''}</span>
              </div>
            </div>
          </div>

          <!-- Quick Action Buttons (Hidden on Print) -->
          <div class="flex flex-wrap items-center gap-2 shrink-0 no-print">
            <button onclick="SmartAgroGuides.printIsolatedRoadmap()" 
                    class="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center space-x-2 transition-all shadow-md active:scale-95">
              <span>🖨️</span>
              <span>শুধুমাত্র এই রোডম্যাপ প্রিন্ট করুন</span>
            </button>
            <a href="/calculator?crop=${encodeURIComponent(crop.crop_name_bn.split(' ')[0])}" 
               class="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-2 transition-all shadow-md shadow-emerald-600/25 active:scale-95">
              <span>⚖️</span>
              <span>সার হিসাব করুন</span>
            </a>
            <button onclick="SmartAgroGuides.speakCropOverview('${crop.crop_name_bn}', '${crop.variety_info}', '${crop.duration}')" 
                    title="ভয়েস নির্দেশিকা শুনুন" 
                    class="p-2.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-sm font-bold flex items-center transition-all shadow-xs">
              <span>🔊</span>
            </button>
          </div>

        </div>
      </div>

      <!-- 4-Photo Interactive Agricultural Gallery -->
      <div class="glass-panel p-5 rounded-2xl border border-emerald-200 shadow-sm print-avoid-break">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="text-lg">📷</span>
            <h4 class="text-sm md:text-base font-black text-slate-900">বাস্তব কৃষি ফটো গ্যালারি (৪টি পর্যায়)</h4>
          </div>
          <span class="text-[11px] text-slate-500 font-semibold no-print">যেকোনো ছবিতে ক্লিক করে বড় করে দেখুন</span>
        </div>

        <!-- Web Interactive Gallery Tabs -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 no-print">
          
          <!-- Tab 1: Mature Crop -->
          <div onclick="SmartAgroGuides.switchGalleryTab('crop')" 
               class="gallery-thumbnail p-2 rounded-xl border-2 transition-all bg-white flex items-center space-x-2.5 ${currentGalleryType === 'crop' ? 'active-thumb' : 'border-slate-200'}">
            <img src="${gallery.crop}" alt="পরিপক্ক ফসল" class="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0">
            <div class="min-w-0">
              <span class="text-xs font-black text-slate-900 block truncate">🌿 পরিপক্ক ফসল</span>
              <span class="text-[10px] text-emerald-700 font-bold">গাছ ও ক্ষেত</span>
            </div>
          </div>

          <!-- Tab 2: Seed -->
          <div onclick="SmartAgroGuides.switchGalleryTab('seed')" 
               class="gallery-thumbnail p-2 rounded-xl border-2 transition-all bg-white flex items-center space-x-2.5 ${currentGalleryType === 'seed' ? 'active-thumb' : 'border-slate-200'}">
            <img src="${gallery.seed}" alt="উন্নত বীজ" class="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0">
            <div class="min-w-0">
              <span class="text-xs font-black text-slate-900 block truncate">🌰 উন্নত বীজ</span>
              <span class="text-[10px] text-amber-700 font-bold">শোধনযোগ্য বীজ</span>
            </div>
          </div>

          <!-- Tab 3: Seedling -->
          <div onclick="SmartAgroGuides.switchGalleryTab('seedling')" 
               class="gallery-thumbnail p-2 rounded-xl border-2 transition-all bg-white flex items-center space-x-2.5 ${currentGalleryType === 'seedling' ? 'active-thumb' : 'border-slate-200'}">
            <img src="${gallery.seedling}" alt="চারা বা কলম" class="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0">
            <div class="min-w-0">
              <span class="text-xs font-black text-slate-900 block truncate">🌱 সতেজ চারা</span>
              <span class="text-[10px] text-teal-700 font-bold">নার্সারি / কলম</span>
            </div>
          </div>

          <!-- Tab 4: Harvest -->
          <div onclick="SmartAgroGuides.switchGalleryTab('harvest')" 
               class="gallery-thumbnail p-2 rounded-xl border-2 transition-all bg-white flex items-center space-x-2.5 ${currentGalleryType === 'harvest' ? 'active-thumb' : 'border-slate-200'}">
            <img src="${gallery.harvest}" alt="পাকা ফলন" class="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0">
            <div class="min-w-0">
              <span class="text-xs font-black text-slate-900 block truncate">🧺 পাকা ফলন</span>
              <span class="text-[10px] text-purple-700 font-bold">ফসল সংগ্রহ</span>
            </div>
          </div>

        </div>

        <!-- Print-Only 4-Photo Row -->
        <div class="hidden gallery-print-row">
          <div>
            <img src="${gallery.crop}" alt="পরিপক্ক ফসল">
            <p style="font-size: 8pt; font-weight: bold; text-align: center; margin-top: 2px;">১. পরিপক্ক ফসল</p>
          </div>
          <div>
            <img src="${gallery.seed}" alt="উন্নত বীজ">
            <p style="font-size: 8pt; font-weight: bold; text-align: center; margin-top: 2px;">২. উন্নত বীজ</p>
          </div>
          <div>
            <img src="${gallery.seedling}" alt="স্বাস্থ্যবান চারা">
            <p style="font-size: 8pt; font-weight: bold; text-align: center; margin-top: 2px;">৩. নার্সারি ও চারা</p>
          </div>
          <div>
            <img src="${gallery.harvest}" alt="পাকা ফলন">
            <p style="font-size: 8pt; font-weight: bold; text-align: center; margin-top: 2px;">৪. ফসল সংগ্রহ ও ফলন</p>
          </div>
        </div>

      </div>

      <!-- Comprehensive Agronomic Specifications Grid (৪টি গুরুত্বপূর্ণ নির্দেশিকা) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print-avoid-break">
        
        <!-- Soil & pH -->
        <div class="glass-panel p-4 rounded-2xl border-t-4 border-amber-500 shadow-sm flex flex-col justify-between">
          <div class="flex items-center space-x-2 mb-1.5">
            <span class="text-2xl">🧪</span>
            <h5 class="text-xs md:text-sm font-black text-slate-900">মাটির ধরন ও পিএইচ (pH)</h5>
          </div>
          <p class="text-xs text-slate-700 font-bold leading-relaxed">
            ${crop.soil_spec || 'উর্বর দোআঁশ ও পলি দোআঁশ মাটি উপযোগী। পিএইচ মাত্রা ৬.০ - ৬.৮ উত্তম।'}
          </p>
        </div>

        <!-- Seed Rate -->
        <div class="glass-panel p-4 rounded-2xl border-t-4 border-emerald-500 shadow-sm flex flex-col justify-between">
          <div class="flex items-center space-x-2 mb-1.5">
            <span class="text-2xl">⚖️</span>
            <h5 class="text-xs md:text-sm font-black text-slate-900">বীজের হার (প্রতি শতক)</h5>
          </div>
          <p class="text-xs text-slate-700 font-bold leading-relaxed">
            ${crop.seed_rate_spec || 'প্রতি শতাংশে অনুমোদিত হারে খাঁটি ও শোধিত বীজ ব্যবহার করুন।'}
          </p>
        </div>

        <!-- Spacing -->
        <div class="glass-panel p-4 rounded-2xl border-t-4 border-blue-500 shadow-sm flex flex-col justify-between">
          <div class="flex items-center space-x-2 mb-1.5">
            <span class="text-2xl">📐</span>
            <h5 class="text-xs md:text-sm font-black text-slate-900">রোপণের দূরত্ব (Spacing)</h5>
          </div>
          <p class="text-xs text-slate-700 font-bold leading-relaxed">
            ${crop.spacing_spec || 'সারি থেকে সারি এবং গাছ থেকে গাছের সঠিক দূরত্ব বজায় রাখুন।'}
          </p>
        </div>

        <!-- Yield Potential -->
        <div class="glass-panel p-4 rounded-2xl border-t-4 border-purple-500 shadow-sm flex flex-col justify-between">
          <div class="flex items-center space-x-2 mb-1.5">
            <span class="text-2xl">📈</span>
            <h5 class="text-xs md:text-sm font-black text-slate-900">সম্ভাব্য ফলন (Yield)</h5>
          </div>
          <p class="text-xs text-slate-700 font-bold leading-relaxed">
            ${crop.yield_spec || 'সুষম পরিচর্যা ও কীট ব্যবস্থাপনায় সর্বোচ্চ ফলন পাওয়া সম্ভব।'}
          </p>
        </div>

      </div>

      <!-- Curated Practical YouTube Tutorial Video Embed -->
      ${crop.youtube && crop.youtube.video_id ? `
        <div class="glass-panel p-5 md:p-6 rounded-2xl border border-emerald-200 shadow-sm no-print">
          <div class="flex items-center justify-between mb-3.5">
            <div class="flex items-center space-x-2.5">
              <span class="text-2xl text-rose-600">▶️</span>
              <div>
                <h4 class="text-sm md:text-base font-black text-slate-900">
                  ${crop.youtube.title || `${crop.crop_name_bn} চাষের আধুনিক ভিডিও টিউটোরিয়াল`}
                </h4>
                <p class="text-[11px] text-slate-500 font-bold">
                  উৎস: ${crop.youtube.channel || 'কৃষি তথ্য সার্ভিস (AIS) ও BARI/BRRI'}
                </p>
              </div>
            </div>
            <a href="https://www.youtube.com/watch?v=${crop.youtube.video_id}" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 flex items-center space-x-1 transition-all">
              <span>ইউটিউবে খুলুন</span>
              <span>↗</span>
            </a>
          </div>

          <div class="video-responsive-container shadow-lg">
            <iframe src="https://www.youtube-nocookie.com/embed/${crop.youtube.video_id}?rel=0" 
                    title="${crop.youtube.title || crop.crop_name_bn}" 
                    loading="lazy" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen>
            </iframe>
          </div>
        </div>
      ` : ''}

      <!-- BARC Fertilizer Summary Quick-Table -->
      ${crop.fertilizer_plan ? `
        <div class="glass-panel p-5 md:p-6 rounded-2xl border-t-4 border-t-teal-600 shadow-sm print-avoid-break">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xl">⚖️</span>
                <h4 class="text-base font-black text-slate-900">${crop.crop_name_bn} এর সুষম সার মাত্রা (প্রতি শতকে)</h4>
              </div>
              <p class="text-xs text-slate-500 font-semibold mt-0.5">
                বাংলাদেশ কৃষি গবেষণা কাউন্সিল (BARC) সার সুপারিশ নির্দেশিকা অনুযায়ী
              </p>
            </div>
            <a href="/calculator?crop=${encodeURIComponent(crop.crop_name_bn.split(' ')[0])}" 
               class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-all shadow-xs shrink-0 no-print">
              <span>🧮 আপনার জমির সার হিসাব করুন →</span>
            </a>
          </div>

          <!-- Dose Chips Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-center text-xs font-bold">
            <div class="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <span class="text-[10px] text-emerald-800 font-black block">ইউরিয়া</span>
              <span class="text-sm font-black text-emerald-950 mt-1 block">${crop.fertilizer_plan.urea} কেজি</span>
            </div>
            <div class="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
              <span class="text-[10px] text-amber-800 font-black block">টিএসপি</span>
              <span class="text-sm font-black text-amber-950 mt-1 block">${crop.fertilizer_plan.tsp} কেজি</span>
            </div>
            <div class="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
              <span class="text-[10px] text-rose-800 font-black block">পটাশ (MoP)</span>
              <span class="text-sm font-black text-rose-950 mt-1 block">${crop.fertilizer_plan.mop} কেজি</span>
            </div>
            <div class="p-2.5 rounded-xl bg-sky-50 border border-sky-200">
              <span class="text-[10px] text-sky-800 font-black block">জিপসাম</span>
              <span class="text-sm font-black text-sky-950 mt-1 block">${crop.fertilizer_plan.gypsum} কেজি</span>
            </div>
            <div class="p-2.5 rounded-xl bg-purple-50 border border-purple-200">
              <span class="text-[10px] text-purple-800 font-black block">দস্তা (Zinc)</span>
              <span class="text-sm font-black text-purple-950 mt-1 block">${crop.fertilizer_plan.zinc} কেজি</span>
            </div>
            <div class="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200">
              <span class="text-[10px] text-indigo-800 font-black block">বোরন (Boron)</span>
              <span class="text-sm font-black text-indigo-950 mt-1 block">${crop.fertilizer_plan.boron || '০.০২'} কেজি</span>
            </div>
            <div class="p-2.5 rounded-xl bg-teal-50 border border-teal-200">
              <span class="text-[10px] text-teal-800 font-black block">জৈব সার</span>
              <span class="text-sm font-black text-teal-950 mt-1 block">${crop.fertilizer_plan.organic} কেজি</span>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- 5-Stage Animated Vertical Timeline -->
      <div class="relative timeline-container space-y-8 pt-4">
        <div class="timeline-line"></div>
  `;

  steps.forEach((step, idx) => {
    const stageNum = step.step_number || (idx + 1);
    const stageVector = stageIconsSvg[stageNum] || `<span class="text-2xl">${step.icon || '🌱'}</span>`;
    const checkpoints = step.action_checkpoints || [];

    timelineHtml += `
      <div class="relative group print-avoid-break">
        <!-- Milestone Node with Step Number -->
        <div class="timeline-node">
          <span>${stageNum}</span>
        </div>

        <!-- Step Content Card -->
        <div class="glass-panel p-6 rounded-2xl border border-slate-200 hover:border-emerald-400 transition-all duration-300 shadow-md ml-2 print-avoid-break">
          
          <div class="flex flex-wrap items-center justify-between gap-2.5 mb-3.5">
            <div class="flex items-center space-x-3.5">
              <div class="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                ${stageVector}
              </div>
              <div>
                <h3 class="text-lg md:text-xl font-black text-slate-900">${step.title_bn}</h3>
                <span class="text-[11px] text-emerald-800 font-bold">${step.title_en || ''}</span>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <span class="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                ⏱️ ${step.duration}
              </span>
              <span class="px-2.5 py-1 rounded-lg text-xs bg-slate-100 text-slate-800 font-bold border border-slate-200">
                ${step.badge || `ধাপ ${idx+1}`}
              </span>
            </div>
          </div>

          <!-- Multi-Paragraph Agricultural Stage Description -->
          <div class="text-xs md:text-sm text-slate-700 leading-relaxed font-bengali font-medium space-y-2.5 mb-4">
            ${step.description_bn ? step.description_bn.split('\n\n').map(p => `<p>${p}</p>`).join('') : ''}
          </div>

          <!-- Interactive Action Checkpoints -->
          ${checkpoints.length > 0 ? `
            <div class="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <span class="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <span>📋</span>
                <span>এই ধাপের প্রধান করণীয় চেকলিস্ট (Action Checkpoints):</span>
              </span>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                ${checkpoints.map((cp, cIdx) => `
                  <label class="flex items-start space-x-2.5 p-2 rounded-lg bg-white border border-slate-200 hover:border-emerald-300 transition-colors">
                    <input type="checkbox" id="cp-${crop.crop_id}-${stageNum}-${cIdx}" class="checkpoint-checkbox">
                    <span class="checkpoint-label text-xs font-bold text-slate-800 leading-snug">${cp}</span>
                  </label>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Experienced Farmer Pro-Tip (সোনালী টিপস) -->
          ${step.pro_tip_bn ? `
            <div class="mt-4 p-4 rounded-xl bg-amber-50/90 border border-amber-300 flex items-start space-x-3 shadow-sm">
              <span class="text-2xl mt-0.5">💡</span>
              <div class="text-xs md:text-sm text-slate-800 font-bengali leading-relaxed">
                <span class="font-black text-amber-900 block mb-0.5">কৃষি গবেষক ও অভিজ্ঞ কৃষকের সোনালী পরামর্শ (Pro-Tip):</span> 
                ${step.pro_tip_bn}
              </div>
            </div>
          ` : ''}

        </div>
      </div>
    `;
  });

  timelineHtml += `
      </div>
    </div> <!-- End of #printable-crop-roadmap -->
  `;

  timelineContainer.innerHTML = timelineHtml;
}

// Switch Active Gallery Thumbnail
function switchGalleryTab(type) {
  currentGalleryType = type;
  const crop = allCropGuides.find(c => c.crop_id === selectedCropId);
  if (!crop || !crop.gallery) return;

  const previewEl = document.getElementById('main-gallery-preview');
  if (previewEl && crop.gallery[type]) {
    previewEl.src = crop.gallery[type];
  }

  // Update active class on thumbnails
  const thumbs = document.querySelectorAll('.gallery-thumbnail');
  thumbs.forEach(t => t.classList.remove('active-thumb'));

  const clickedThumb = event ? event.currentTarget : null;
  if (clickedThumb) clickedThumb.classList.add('active-thumb');
}

// Open Lightbox
function openLightbox(src, title, caption) {
  const modal = document.getElementById('image-lightbox-modal');
  const img = document.getElementById('lightbox-image');
  const titleEl = document.getElementById('lightbox-title');
  const captionEl = document.getElementById('lightbox-caption');

  if (modal && img) {
    img.src = src;
    if (titleEl) titleEl.innerText = title;
    if (captionEl) captionEl.innerText = caption;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
}

// Close Lightbox
function closeLightbox() {
  const modal = document.getElementById('image-lightbox-modal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

// Isolated Print: Only print the currently selected crop's roadmap
function printIsolatedRoadmap() {
  const crop = allCropGuides.find(c => c.crop_id === selectedCropId);
  const oldTitle = document.title;
  if (crop) {
    document.title = `${crop.crop_name_bn} চাষের বৈজ্ঞানিক রোডম্যাপ - স্মার্ট এগ্রো`;
  }
  window.print();
  document.title = oldTitle;
}

// Audio speech synthesis overview in Bengali
function speakCropOverview(cropName, variety, duration) {
  if (!('speechSynthesis' in window)) {
    alert('আপনার ব্রাউজারে স্পিচ সিন্থেসিস অডিও সমর্থিত নয়।');
    return;
  }
  window.speechSynthesis.cancel();
  const text = `${cropName} চাষের ৫টি গুরুত্বপূর্ণ পর্যায় রয়েছে। অনুমোদিত জাতসমূহ হলো ${variety}। আনুমানিক জীবনকাল ${duration}। সঠিক মাত্রায় সুষম সার ও পানি নিষ্কাশন নিশ্চিত করুন।`;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'bn-BD';
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}

window.SmartAgroGuides = {
  initGuides,
  selectCrop,
  loadAllGuides,
  applyFilters,
  switchGalleryTab,
  openLightbox,
  closeLightbox,
  printIsolatedRoadmap,
  speakCropOverview
};
