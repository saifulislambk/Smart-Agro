// ====================================================================
// Smart Agro (স্মার্ট এগ্রো) - Dedicated Single Crop Cultivation Roadmap Module
// ====================================================================

let allCropGuides = [];
let currentCrop = null;
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

async function initCropDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  let cropId = urlParams.get('crop');

  // Also support clean path /roadmap/:cropId
  const pathParts = window.location.pathname.split('/');
  if (!cropId && pathParts.length >= 3 && pathParts[1] === 'roadmap' && pathParts[2]) {
    cropId = pathParts[2];
  }

  if (!cropId) {
    cropId = 'rice';
  }

  try {
    const res = await fetch('/api/guides');
    const result = await res.json();

    if (result.success && result.data && result.data.length > 0) {
      allCropGuides = result.data;
      setupCropSwitcher(cropId);

      const found = allCropGuides.find(c => c.crop_id.toLowerCase() === cropId.toLowerCase());
      if (found) {
        renderCropDetail(found);
      } else {
        renderCropDetail(allCropGuides[0]);
      }
    } else {
      document.getElementById('crop-detail-viewport').innerHTML = `
        <div class="py-12 text-center text-rose-600 glass-panel font-bold">
          ফসলের তথ্য পাওয়া যায়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।
        </div>
      `;
    }
  } catch (err) {
    console.error('Error loading crop detail:', err);
    document.getElementById('crop-detail-viewport').innerHTML = `
      <div class="py-12 text-center text-rose-600 glass-panel font-bold">
        তথ্য লোড করতে সমস্যা হয়েছে।
      </div>
    `;
  }
}

// Populate the quick crop switcher dropdown
function setupCropSwitcher(selectedId) {
  const switcher = document.getElementById('quick-crop-switcher');
  if (!switcher) return;

  switcher.innerHTML = allCropGuides.map(c => `
    <option value="${c.crop_id}" ${c.crop_id.toLowerCase() === selectedId.toLowerCase() ? 'selected' : ''}>
      ${c.icon || '🌱'} ${c.crop_name_bn}
    </option>
  `).join('');

  switcher.addEventListener('change', (e) => {
    const newCropId = e.target.value;
    window.location.href = `/crop-detail?crop=${newCropId}`;
  });
}

// Render the complete dedicated crop roadmap
function renderCropDetail(crop) {
  currentCrop = crop;
  currentGalleryType = 'crop';

  document.title = `${crop.crop_name_bn} চাষের সম্পূর্ণ রোডম্যাপ ও বৈজ্ঞানিক নির্দেশিকা - স্মার্ট এগ্রো`;

  const breadcrumbEl = document.getElementById('breadcrumb-crop-name');
  if (breadcrumbEl) {
    breadcrumbEl.innerText = `${crop.crop_name_bn} চাষের রোডম্যাপ`;
  }

  const viewport = document.getElementById('crop-detail-viewport');
  if (!viewport) return;

  const steps = typeof crop.steps === 'string' ? JSON.parse(crop.steps) : crop.steps;
  const gallery = crop.gallery || {
    crop: '/images/crops/' + crop.crop_id + '.jpg',
    seed: '/images/seeds/' + crop.crop_id + '_seed.jpg',
    seedling: '/images/seedlings/' + crop.crop_id + '_seedling.jpg',
    harvest: '/images/harvest/' + crop.crop_id + '_harvest.jpg'
  };

  const currentHeroImg = gallery[currentGalleryType] || gallery.crop;

  // Video embed validation
  const hasVideo = crop.youtube && crop.youtube.video_id;

  let html = `
    <!-- Dedicated Single-Crop Isolated Printable Container -->
    <div id="printable-crop-roadmap" class="space-y-6">

      <!-- Official BARI / BRRI Certification Header Banner -->
      <div class="print-official-header glass-panel p-6 border-t-4 border-t-emerald-600 shadow-lg">
        <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          
          <div class="flex items-center space-x-4">
            <div class="w-20 h-20 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-md shrink-0 relative bg-emerald-50 cursor-pointer" 
                 onclick="SmartAgroCropDetail.openLightbox('${gallery.crop}', '${crop.crop_name_bn}', 'পরিপক্ক ${crop.crop_name_bn} গাছ ও ফসল')">
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
            <button onclick="SmartAgroCropDetail.printGuide()" 
                    class="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center space-x-2 transition-all shadow-md active:scale-95">
              <span>🖨️</span>
              <span>শুধুমাত্র এই রোডম্যাপ প্রিন্ট করুন</span>
            </button>
            <a href="/calculator?crop=${encodeURIComponent(crop.crop_name_bn.split(' ')[0])}" 
               class="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-2 transition-all shadow-md shadow-emerald-600/25 active:scale-95">
              <span>⚖️</span>
              <span>সার হিসাব করুন</span>
            </a>
            <button onclick="SmartAgroCropDetail.speakCropOverview('${crop.crop_name_bn}', '${crop.variety_info}', '${crop.duration}')" 
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
          <div onclick="SmartAgroCropDetail.switchGalleryTab('crop')" 
               class="gallery-thumbnail p-2 rounded-xl border-2 transition-all bg-white flex items-center space-x-2.5 active-thumb">
            <img src="${gallery.crop}" alt="পরিপক্ক ফসল" class="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0">
            <div class="min-w-0">
              <span class="text-xs font-black text-slate-900 block truncate">🌿 পরিপক্ক ফসল</span>
              <span class="text-[10px] text-emerald-700 font-bold">গাছ ও ক্ষেত</span>
            </div>
          </div>

          <!-- Tab 2: Seed -->
          <div onclick="SmartAgroCropDetail.switchGalleryTab('seed')" 
               class="gallery-thumbnail p-2 rounded-xl border-2 transition-all bg-white flex items-center space-x-2.5 border-slate-200">
            <img src="${gallery.seed}" alt="উন্নত বীজ" class="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0">
            <div class="min-w-0">
              <span class="text-xs font-black text-slate-900 block truncate">🌰 উন্নত বীজ</span>
              <span class="text-[10px] text-amber-700 font-bold">শোধনযোগ্য বীজ</span>
            </div>
          </div>

          <!-- Tab 3: Seedling -->
          <div onclick="SmartAgroCropDetail.switchGalleryTab('seedling')" 
               class="gallery-thumbnail p-2 rounded-xl border-2 transition-all bg-white flex items-center space-x-2.5 border-slate-200">
            <img src="${gallery.seedling}" alt="চারা বা কলম" class="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0">
            <div class="min-w-0">
              <span class="text-xs font-black text-slate-900 block truncate">🌱 সতেজ চারা</span>
              <span class="text-[10px] text-teal-700 font-bold">নার্সারি / কলম</span>
            </div>
          </div>

          <!-- Tab 4: Harvest -->
          <div onclick="SmartAgroCropDetail.switchGalleryTab('harvest')" 
               class="gallery-thumbnail p-2 rounded-xl border-2 transition-all bg-white flex items-center space-x-2.5 border-slate-200">
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

      <!-- Compact, Elegantly Sized Practical YouTube Tutorial Video Embed -->
      ${hasVideo ? `
        <div class="video-compact-card glass-panel p-4 md:p-5 rounded-2xl border border-emerald-200 shadow-sm no-print">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center space-x-2.5">
              <span class="text-xl text-rose-600">▶️</span>
              <div>
                <h4 class="text-xs md:text-sm font-black text-slate-900">
                  ${crop.youtube.title || `${crop.crop_name_bn} চাষের আধুনিক ভিডিও টিউটোরিয়াল`}
                </h4>
                <p class="text-[10px] text-slate-500 font-bold">
                  উৎস: ${crop.youtube.channel || 'কৃষি তথ্য সার্ভিস (AIS) ও BARI/BRRI'}
                </p>
              </div>
            </div>
            <a href="https://www.youtube.com/watch?v=${crop.youtube.video_id}" target="_blank" rel="noopener noreferrer" 
               class="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] border border-rose-200 flex items-center space-x-1 transition-all shrink-0">
              <span>ইউটিউবে খুলুন ↗</span>
            </a>
          </div>

          <div class="video-responsive-container shadow-md">
            <iframe src="https://www.youtube-nocookie.com/embed/${crop.youtube.video_id}?rel=0" 
                    title="${crop.youtube.title || crop.crop_name_bn}" 
                    loading="lazy" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen>
            </iframe>
          </div>
        </div>
      ` : `
        <!-- Minimized State when no video is available -->
        <div class="max-w-md mx-auto p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 font-semibold no-print">
          <span>🎥 এই ফসলের অনুমোদিত ভিডিও টিউটোরিয়াল অচিরেই যুক্ত করা হবে।</span>
        </div>
      `}

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

    html += `
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

  html += `
      </div>
    </div> <!-- End of #printable-crop-roadmap -->
  `;

  viewport.innerHTML = html;
}

// Switch Active Gallery Thumbnail
function switchGalleryTab(type) {
  currentGalleryType = type;
  if (!currentCrop || !currentCrop.gallery) return;

  const previewEl = document.getElementById('main-gallery-preview');
  if (previewEl && currentCrop.gallery[type]) {
    previewEl.src = currentCrop.gallery[type];
  }

  // Update active class on thumbnails
  const thumbs = document.querySelectorAll('.gallery-thumbnail');
  thumbs.forEach(t => t.classList.remove('active-thumb'));

  const clickedThumb = event ? event.currentTarget : null;
  if (clickedThumb) clickedThumb.classList.add('active-thumb');
}

// Open Lightbox Modal
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

// Close Lightbox Modal
function closeLightbox() {
  const modal = document.getElementById('image-lightbox-modal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

// Isolated Print: Only prints this specific crop's roadmap with slim side margins
function printGuide() {
  const oldTitle = document.title;
  if (currentCrop) {
    document.title = `${currentCrop.crop_name_bn} চাষের বৈজ্ঞানিক রোডম্যাপ - স্মার্ট এগ্রো`;
  }
  window.print();
  document.title = oldTitle;
}

// Bengali Voice Overview
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

// Auto-initialize when loaded
document.addEventListener('DOMContentLoaded', () => {
  initCropDetail();
});

window.SmartAgroCropDetail = {
  initCropDetail,
  switchGalleryTab,
  openLightbox,
  closeLightbox,
  printGuide,
  speakCropOverview
};

