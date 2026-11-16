// ====================================================================
// Smart Agro (স্মার্ট এগ্রো) - Fertilizer Calculator Module
// Dual Mode: Land Area (শতাংশ/বিঘা) & Seedling/Plant Count (চারা/গাছ/মাদা)
// ====================================================================

let currentCalcMode = 'land_area'; // 'land_area' | 'seedling_count'

function initFertilizerCalculator() {
  const calcBtn = document.getElementById('calculate-fertilizer-btn');
  if (calcBtn) {
    calcBtn.addEventListener('click', () => calculateFertilizer(true));
  }

  // Setup Calculation Mode Tabs
  const modeLandBtn = document.getElementById('mode-land-btn');
  const modeSeedlingBtn = document.getElementById('mode-seedling-btn');

  if (modeLandBtn && modeSeedlingBtn) {
    modeLandBtn.addEventListener('click', () => setCalculationMode('land_area'));
    modeSeedlingBtn.addEventListener('click', () => setCalculationMode('seedling_count'));
  }

  // Setup Dynamic Preset Buttons
  setupPresetButtons();

  // Responsive instant recalculation on dropdown/input changes
  const cropSelect = document.getElementById('calc-crop-select');
  const unitSelect = document.getElementById('calc-land-unit');
  const amountInput = document.getElementById('calc-land-amount');

  if (cropSelect) {
    cropSelect.addEventListener('change', () => {
      syncCropRecommendations();
      calculateFertilizer(false);
    });
  }
  if (unitSelect) {
    unitSelect.addEventListener('change', () => calculateFertilizer(false));
  }
  if (amountInput) {
    amountInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        calculateFertilizer(true);
      }
    });
    amountInput.addEventListener('change', () => calculateFertilizer(false));
  }

  // Check URL query parameters for pre-selected crop or mode from Roadmap
  const urlParams = new URLSearchParams(window.location.search);
  const paramCrop = urlParams.get('crop');
  const paramMode = urlParams.get('mode');
  const paramAmount = urlParams.get('amount');
  const paramUnit = urlParams.get('unit');

  if (cropSelect && paramCrop) {
    const cleanParam = paramCrop.toLowerCase().trim();
    for (let i = 0; i < cropSelect.options.length; i++) {
      const opt = cropSelect.options[i];
      const optVal = opt.value.toLowerCase();
      const optText = opt.text.toLowerCase();
      if (optVal.includes(cleanParam) || optText.includes(cleanParam)) {
        cropSelect.selectedIndex = i;
        break;
      }
    }
  }

  if (paramMode === 'seedling' || paramMode === 'seedling_count' || paramMode === 'plant') {
    setCalculationMode('seedling_count');
  }

  if (amountInput && paramAmount && parseFloat(paramAmount) > 0) {
    amountInput.value = paramAmount;
  }

  if (unitSelect && paramUnit) {
    unitSelect.value = paramUnit;
  }

  // Auto trigger initial calculation
  setTimeout(() => {
    calculateFertilizer(false);
  }, 200);
}

function setCalculationMode(mode) {
  currentCalcMode = mode;
  const modeLandBtn = document.getElementById('mode-land-btn');
  const modeSeedlingBtn = document.getElementById('mode-seedling-btn');
  const amountLabel = document.getElementById('calc-amount-label');
  const amountInput = document.getElementById('calc-land-amount');
  const unitSelect = document.getElementById('calc-land-unit');
  const presetsContainer = document.getElementById('calc-presets-container');

  if (!modeLandBtn || !modeSeedlingBtn) return;

  if (mode === 'seedling_count') {
    // Active Seedling Tab
    modeSeedlingBtn.className = 'flex-1 py-2.5 px-4 rounded-xl font-black text-xs md:text-sm transition-all flex items-center justify-center gap-2 bg-emerald-600 text-white shadow-md active:scale-95';
    modeLandBtn.className = 'flex-1 py-2.5 px-4 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2 text-slate-700 hover:text-emerald-900 active:scale-95';

    if (amountLabel) {
      amountLabel.innerHTML = '🌱 চারার সংখ্যা / গাছের সংখ্যা / মাদা:';
    }
    if (amountInput) {
      amountInput.placeholder = 'যেমন: ১০০ বা ৫০০';
      if (!amountInput.value || parseFloat(amountInput.value) <= 33) {
        amountInput.value = '100';
      }
    }
    if (unitSelect) {
      unitSelect.innerHTML = `
        <option value="টি চারা / গাছ" selected>টি চারা / গাছ (Plants/Seedlings)</option>
        <option value="টি মাদা / গর্ত">টি মাদা / গর্ত (Pits/Hills)</option>
        <option value="টি পিলার / খুঁটি">টি পিলার / খুঁটি (Dragon Fruit Poles)</option>
        <option value="টি গুছি">টি গুছি (Rice Clusters)</option>
      `;
    }

    if (presetsContainer) {
      presetsContainer.innerHTML = `
        <button type="button" data-preset-val="25" class="preset-btn px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-600 hover:text-white border border-emerald-300 text-emerald-900 text-xs font-bold transition-all shadow-2xs active:scale-95">২৫ টি</button>
        <button type="button" data-preset-val="50" class="preset-btn px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-600 hover:text-white border border-emerald-300 text-emerald-900 text-xs font-bold transition-all shadow-2xs active:scale-95">৫০ টি</button>
        <button type="button" data-preset-val="100" class="preset-btn px-3 py-1.5 rounded-xl bg-emerald-600 text-white border border-emerald-500 text-xs font-black transition-all shadow-xs active:scale-95">১০০ টি চারা</button>
        <button type="button" data-preset-val="250" class="preset-btn px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-600 hover:text-white border border-emerald-300 text-emerald-900 text-xs font-bold transition-all shadow-2xs active:scale-95">২৫০ টি</button>
        <button type="button" data-preset-val="500" class="preset-btn px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-600 hover:text-white border border-emerald-300 text-emerald-900 text-xs font-bold transition-all shadow-2xs active:scale-95">৫০০ টি চারা</button>
      `;
      setupPresetButtons();
    }
  } else {
    // Active Land Area Tab
    modeLandBtn.className = 'flex-1 py-2.5 px-4 rounded-xl font-black text-xs md:text-sm transition-all flex items-center justify-center gap-2 bg-emerald-600 text-white shadow-md active:scale-95';
    modeSeedlingBtn.className = 'flex-1 py-2.5 px-4 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2 text-slate-700 hover:text-emerald-900 active:scale-95';

    if (amountLabel) {
      amountLabel.innerHTML = '📐 জমির পরিমাণ:';
    }
    if (amountInput) {
      amountInput.placeholder = 'যেমন: ৩৩';
      if (amountInput.value === '100' || parseFloat(amountInput.value) > 200) {
        amountInput.value = '33';
      }
    }
    if (unitSelect) {
      unitSelect.innerHTML = `
        <option value="শতাংশ" selected>শতাংশ / শতক (Decimal)</option>
        <option value="বিঘা">বিঘা (৩৩ শতাংশ)</option>
        <option value="একর">একর (১০০ শতাংশ)</option>
        <option value="কাঠা">কাঠা (১.৬৫ শতাংশ)</option>
        <option value="হেক্টর">হেক্টর (২৪৭.১ শতাংশ)</option>
      `;
    }

    if (presetsContainer) {
      presetsContainer.innerHTML = `
        <button type="button" data-preset-val="10" data-unit-val="শতাংশ" class="preset-btn px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-600 hover:text-white border border-emerald-300 text-emerald-900 text-xs font-bold transition-all shadow-2xs active:scale-95">১০ শতক</button>
        <button type="button" data-preset-val="33" data-unit-val="শতাংশ" class="preset-btn px-3 py-1.5 rounded-xl bg-emerald-600 text-white border border-emerald-500 text-xs font-black transition-all shadow-xs active:scale-95">৩৩ শতক (১ বিঘা)</button>
        <button type="button" data-preset-val="50" data-unit-val="শতাংশ" class="preset-btn px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-600 hover:text-white border border-emerald-300 text-emerald-900 text-xs font-bold transition-all shadow-2xs active:scale-95">৫০ শতক</button>
        <button type="button" data-preset-val="100" data-unit-val="শতাংশ" class="preset-btn px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-600 hover:text-white border border-emerald-300 text-emerald-900 text-xs font-bold transition-all shadow-2xs active:scale-95">১০০ শতক (১ একর)</button>
      `;
      setupPresetButtons();
    }
  }

  // Trigger recalculation with new mode
  calculateFertilizer(false);
}

function setupPresetButtons() {
  const presetBtns = document.querySelectorAll('.preset-btn, [data-land-preset], [data-preset-val]');
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      presetBtns.forEach(b => {
        b.className = 'preset-btn px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-600 hover:text-white border border-emerald-300 text-emerald-900 text-xs font-bold transition-all shadow-2xs active:scale-95';
      });
      btn.className = 'preset-btn px-3 py-1.5 rounded-xl bg-emerald-600 text-white border border-emerald-500 text-xs font-black transition-all shadow-xs active:scale-95';

      const val = btn.getAttribute('data-preset-val') || btn.getAttribute('data-land-preset');
      const unit = btn.getAttribute('data-unit-val') || btn.getAttribute('data-unit-preset');
      
      const amountInput = document.getElementById('calc-land-amount');
      const unitSelect = document.getElementById('calc-land-unit');

      if (amountInput && val) amountInput.value = val;
      if (unitSelect && unit) unitSelect.value = unit;

      calculateFertilizer(true);
    });
  });
}

function syncCropRecommendations() {
  const cropSelect = document.getElementById('calc-crop-select');
  if (!cropSelect) return;
  const val = cropSelect.value.toLowerCase();

  // If user picks orchard / fruit tree / pit crop and currently in land mode, recommend or offer seedling mode
  const isTreeOrPit = ['আম', 'পেয়ারা', 'পেঁপে', 'লেবু', 'ড্রাগন', 'মাল্টা', 'লাউ', 'মিষ্টি কুমড়া', 'পটল'].some(k => val.includes(k));
  const hintEl = document.getElementById('crop-mode-hint');
  if (hintEl) {
    if (isTreeOrPit && currentCalcMode === 'land_area') {
      hintEl.classList.remove('hidden');
      hintEl.innerHTML = `💡 <b>টিপস:</b> ${cropSelect.value}-এর জন্য চারা/গাছ বা মাদাপ্রতি হিসাব আরও নির্ভুল। আপনি উপরে <b>"🌱 চারা / গাছ সংখ্যা অনুযায়ী"</b> ট্যাবে ক্লিক করে হিসাব করতে পারেন।`;
    } else {
      hintEl.classList.add('hidden');
    }
  }
}

async function calculateFertilizer(shouldScroll = false) {
  const cropSelect = document.getElementById('calc-crop-select');
  const amountInput = document.getElementById('calc-land-amount');
  const unitSelect = document.getElementById('calc-land-unit');
  const calcBtn = document.getElementById('calculate-fertilizer-btn');

  if (!amountInput || !amountInput.value || parseFloat(amountInput.value) <= 0) {
    alert('অনুগ্রহ করে সঠিক সংখ্যা বা পরিমাণ লিখুন।');
    if (amountInput) amountInput.focus();
    return;
  }

  const crop = cropSelect ? cropSelect.value : 'ধান';
  const amount = parseFloat(amountInput.value);
  const unit = unitSelect ? unitSelect.value : (currentCalcMode === 'seedling_count' ? 'টি চারা' : 'শতাংশ');

  if (calcBtn) {
    calcBtn.disabled = true;
    calcBtn.innerHTML = `
      <div class="inline-block animate-spin mr-2">⚙️</div>
      <span>সারের বৈজ্ঞানিক মাত্রা হিসাব করা হচ্ছে...</span>
    `;
  }

  try {
    const user = window.SmartAgroAuth ? window.SmartAgroAuth.getCurrentUser() : null;
    const firebaseUid = user ? user.uid : 'guest';

    const payload = {
      calc_mode: currentCalcMode,
      crop_name: crop,
      firebase_uid: firebaseUid
    };

    if (currentCalcMode === 'seedling_count') {
      payload.seedling_count = amount;
      payload.plant_unit = unit;
      payload.land_amount = amount;
      payload.land_unit = unit;
    } else {
      payload.land_amount = amount;
      payload.land_unit = unit;
    }

    const response = await fetch('/api/fertilizer-calc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.success && result.data) {
      renderFertilizerResults(result.data, shouldScroll);
    } else {
      alert(result.message || 'হিসাব করতে সমস্যা হয়েছে।');
    }
  } catch (err) {
    console.error('Fertilizer calculation error:', err);
    alert('সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে।');
  } finally {
    if (calcBtn) {
      calcBtn.disabled = false;
      calcBtn.innerHTML = `
        <span class="text-xl">⚖️</span>
        <span>সারের সঠিক পরিমাণ হিসাব করুন</span>
      `;
    }
  }
}

function renderFertilizerResults(data, shouldScroll = false) {
  const container = document.getElementById('fertilizer-results-container');
  if (!container) return;

  const summaryEl = document.getElementById('fert-summary-title');
  if (summaryEl) {
    if (data.calc_mode === 'seedling_count') {
      summaryEl.innerHTML = `🌱 <b>${data.land_amount} ${data.land_unit}</b> ${data.crop_name}-এর মোট সার সুপারিশ <span class="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full ml-1">আনুমানিক ${data.decimals} শতাংশ জমি</span>`;
    } else {
      summaryEl.innerHTML = `📐 <b>${data.land_amount} ${data.land_unit}</b> (${data.decimals} শতাংশ) জমিতে ${data.crop_name} চাষের সার সুপারিশ:`;
    }
  }

  // Render or Update Dedicated Seedling / Per-Plant Highlight Card
  renderSeedlingHighlightCard(data);

  // Update dynamic roadmap link for this crop
  const roadmapBtn = document.getElementById('fert-roadmap-link');
  if (roadmapBtn && data.crop_name) {
    const cropNameToId = {
      'ধান': 'rice', 'বোরো': 'rice_boro', 'আমন': 'rice_aman', 'আউশ': 'rice_aus',
      'গম': 'wheat', 'ভুট্টা': 'maize', 'আলু': 'potato',
      'টমেটো': 'tomato', 'বেগুন': 'eggplant', 'মরিচ': 'chilli', 'সরিষা': 'mustard',
      'পেঁয়াজ': 'onion', 'পেঁয়াজ': 'onion', 'রসুন': 'garlic', 'লাউ': 'bottle_gourd',
      'শিম': 'hyacinth_bean', 'পেঁপে': 'papaya', 'ফুলকপি': 'cauliflower', 'বাঁধাকপি': 'cabbage',
      'মিষ্টি কুমড়া': 'sweet_gourd', 'মিষ্টি কুমড়া': 'sweet_gourd', 'শসা': 'cucumber',
      'করলা': 'bitter_gourd', 'উচ্ছে': 'bitter_gourd', 'ঢেঁড়শ': 'okra', 'ঢেঁড়শ': 'okra',
      'আদা': 'ginger', 'হলুদ': 'turmeric', 'মসুর ডাল': 'lentil', 'মসুর': 'lentil',
      'লালশাক': 'red_amaranth', 'পালং শাক': 'spinach', 'ডাঁটাশাক': 'stem_amaranth',
      'পেয়ারা': 'guava', 'পেয়ারা': 'guava', 'লেবু': 'lemon', 'আম': 'mango',
      'ড্রাগন ফল': 'dragon_fruit', 'ড্রাগন': 'dragon_fruit', 'মাল্টা': 'malta',
      'পটল': 'pointed_gourd', 'পুঁইশাক': 'malabar_spinach', 'চিচিঙ্গা': 'snake_gourd',
      'ঝিঙা': 'ridge_gourd', 'চাল কুমড়া': 'ash_gourd', 'কচুর লতি': 'taro_loti'
    };
    const cleanCropName = data.crop_name.split(' ')[0].trim();
    const targetCropId = cropNameToId[cleanCropName] || cropNameToId[data.crop_name] || 'rice';
    roadmapBtn.href = `/crop-detail?crop=${targetCropId}`;
    roadmapBtn.innerHTML = `<span>🌾</span> <span>${data.crop_name} চাষাবাদ রোডম্যাপ</span>`;
  }

  // Inject exact KG badges for nutrients
  const ureaEl = document.getElementById('fert-urea-val');
  const tspEl = document.getElementById('fert-tsp-val');
  const mopEl = document.getElementById('fert-mop-val');
  const gypsumEl = document.getElementById('fert-gypsum-val');
  const zincEl = document.getElementById('fert-zinc-val');
  const boronEl = document.getElementById('fert-boron-val');
  const organicEl = document.getElementById('fert-organic-val');

  if (ureaEl) ureaEl.innerText = `${data.urea_kg} কেজি`;
  if (tspEl) tspEl.innerText = `${data.tsp_kg} কেজি`;
  if (mopEl) mopEl.innerText = `${data.mop_kg} কেজি`;
  if (gypsumEl) gypsumEl.innerText = `${data.gypsum_kg} কেজি`;
  if (zincEl) {
    if (data.zinc_kg < 0.2) {
      zincEl.innerText = `${Math.round(data.zinc_kg * 1000)} গ্রাম`;
    } else {
      zincEl.innerText = `${data.zinc_kg} কেজি`;
    }
  }

  if (boronEl) {
    const boronVal = parseFloat(data.boron_kg || 0);
    if (boronVal === 0) {
      boronEl.innerText = `প্রয়োজন নেই`;
    } else if (boronVal < 0.2) {
      const grams = Math.round(boronVal * 1000);
      boronEl.innerText = `${grams} গ্রাম`;
    } else {
      boronEl.innerText = `${boronVal} কেজি`;
    }
  }

  if (organicEl) {
    if (data.organic_kg >= 1000) {
      organicEl.innerText = `${(data.organic_kg / 1000).toFixed(1)} টন (${data.organic_kg} কেজি)`;
    } else {
      organicEl.innerText = `${data.organic_kg} কেজি`;
    }
  }

  // Application Split Calendar
  const splitContainer = document.getElementById('fert-split-schedule');
  if (splitContainer && data.split_instructions) {
    splitContainer.innerHTML = data.split_instructions.map((item, idx) => {
      return `
        <div class="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-start space-x-3.5 shadow-xs">
          <span class="w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
            ${idx + 1}
          </span>
          <div>
            <span class="font-black text-slate-900 text-xs md:text-sm block">${item.stage}</span>
            <p class="text-xs md:text-sm text-slate-700 font-semibold mt-1 leading-relaxed">${item.fertilizers}</p>
          </div>
        </div>
      `;
    }).join('');
  }

  container.classList.remove('hidden');
  if (shouldScroll) {
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function renderSeedlingHighlightCard(data) {
  let plantCard = document.getElementById('fert-plant-summary-card');
  if (!plantCard) {
    const summaryHeader = document.querySelector('#fertilizer-results-container > div:first-child');
    if (summaryHeader) {
      plantCard = document.createElement('div');
      plantCard.id = 'fert-plant-summary-card';
      plantCard.className = 'glass-panel p-5 rounded-2xl border-2 border-emerald-400 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-white shadow-md space-y-4';
      summaryHeader.insertAdjacentElement('afterend', plantCard);
    }
  }

  if (!plantCard) return;

  const info = data.seedling_info;
  if (!info || !info.per_plant) {
    plantCard.classList.add('hidden');
    return;
  }

  plantCard.classList.remove('hidden');
  const p = info.per_plant;
  const unitLabel = p.unit_label || info.plant_unit_label || 'প্রতিটি চারা / মাদায়';

  // Format organic unit (g vs kg)
  let organicText = `${p.organic_g} গ্রাম`;
  if (p.organic_g >= 1000) {
    organicText = `${(p.organic_g / 1000).toFixed(1)} কেজি`;
  }

  plantCard.innerHTML = `
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200 pb-3">
      <div class="flex items-center gap-2">
        <span class="text-2xl">🌱</span>
        <div>
          <h4 class="font-black text-slate-900 text-sm md:text-base">
            ${unitLabel} প্রয়োগের সুনির্দিষ্ট মাত্রা (Per Plant / Pit Dose)
          </h4>
          <p class="text-[11px] text-emerald-800 font-bold">
            ${data.calc_mode === 'seedling_count' ? `মোট ${data.seedling_count}টি চারার জন্য হিসাবকৃত` : `জমির ক্ষেত্রফল অনুযায়ী চারা/মাদাপ্রতি সরাসরি প্রয়োগ নির্দেশিকা`}
          </p>
        </div>
      </div>
      <div class="text-right">
        <span class="text-xs font-black px-3 py-1 rounded-full bg-emerald-600 text-white shadow-xs">
          ${data.calc_mode === 'seedling_count' ? `আনুমানিক জমি: ${data.decimals} শতক` : `সম্ভাব্য চারা: ~${info.seedling_count} টি`}
        </span>
      </div>
    </div>

    <!-- Per Plant Nutrient Pills -->
    <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-1 text-center font-bengali">
      <div class="p-2.5 rounded-xl bg-white/90 border border-emerald-200 shadow-2xs">
        <span class="text-[10px] text-slate-500 font-bold block">ইউরিয়া</span>
        <span class="text-sm font-black text-emerald-700">${p.urea_g} গ্রাম</span>
      </div>
      <div class="p-2.5 rounded-xl bg-white/90 border border-amber-200 shadow-2xs">
        <span class="text-[10px] text-slate-500 font-bold block">টিএসপি</span>
        <span class="text-sm font-black text-amber-700">${p.tsp_g} গ্রাম</span>
      </div>
      <div class="p-2.5 rounded-xl bg-white/90 border border-rose-200 shadow-2xs">
        <span class="text-[10px] text-slate-500 font-bold block">পটাশ (MOP)</span>
        <span class="text-sm font-black text-rose-700">${p.mop_g} গ্রাম</span>
      </div>
      <div class="p-2.5 rounded-xl bg-white/90 border border-sky-200 shadow-2xs">
        <span class="text-[10px] text-slate-500 font-bold block">জিপসাম</span>
        <span class="text-sm font-black text-sky-700">${p.gypsum_g} গ্রাম</span>
      </div>
      <div class="p-2.5 rounded-xl bg-white/90 border border-purple-200 shadow-2xs">
        <span class="text-[10px] text-slate-500 font-bold block">দস্তা (Zinc)</span>
        <span class="text-sm font-black text-purple-700">${p.zinc_g} গ্রাম</span>
      </div>
      <div class="p-2.5 rounded-xl bg-white/90 border border-indigo-200 shadow-2xs">
        <span class="text-[10px] text-slate-500 font-bold block">বোরন</span>
        <span class="text-sm font-black text-indigo-700">${p.boron_g} গ্রাম</span>
      </div>
      <div class="p-2.5 rounded-xl bg-white/90 border border-teal-200 shadow-2xs col-span-2 sm:col-span-1">
        <span class="text-[10px] text-slate-500 font-bold block">গোবর সার</span>
        <span class="text-sm font-black text-teal-700">${organicText}</span>
      </div>
    </div>

    ${info.planting_advice ? `
      <div class="p-3 rounded-xl bg-emerald-50/90 border border-emerald-300 text-xs text-slate-800 font-medium flex items-center gap-2">
        <span class="text-base shrink-0">💡</span>
        <span><b>সতর্কতা ও প্রয়োগ নিয়ম:</b> ${info.planting_advice} সারের প্রয়োগ সবসময় কাণ্ড থেকে ৫-১০ সেমি দূরে রিং আকারে করতে হবে।</span>
      </div>
    ` : ''}
  `;
}

window.SmartAgroFertilizer = {
  initFertilizerCalculator,
  calculateFertilizer,
  setCalculationMode
};
