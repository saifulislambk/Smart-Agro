// ====================================================================
// Smart Agro (স্মার্ট এগ্রো) - Scan History & Prescription Archive Module
// ====================================================================

let fullHistoryRecords = [];
let currentCropFilter = 'all';
let historySearchQuery = '';

async function initHistoryPage() {
  setupHistoryFilters();
  await loadFullHistory();

  // Refresh history automatically on auth state changes
  if (window.SmartAgroAuth && SmartAgroAuth.onAuthStateChanged) {
    SmartAgroAuth.onAuthStateChanged(() => {
      loadFullHistory();
    });
  }
}

function normalizeBnText(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/\u09AF\u09BC/g, '\u09DF');
}

function setupHistoryFilters() {
  const searchInput = document.getElementById('history-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      historySearchQuery = normalizeBnText(e.target.value.trim());
      applyHistoryFilters();
    });
  }

  const filterButtons = document.querySelectorAll('[data-history-crop]');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => {
        b.classList.remove('bg-emerald-600', 'text-white', 'shadow-md');
        b.classList.add('bg-slate-100', 'text-slate-700', 'hover:bg-slate-200');
      });
      btn.classList.add('bg-emerald-600', 'text-white', 'shadow-md');
      btn.classList.remove('bg-slate-100', 'text-slate-700', 'hover:bg-slate-200');

      currentCropFilter = btn.getAttribute('data-history-crop');
      applyHistoryFilters();
    });
  });
}

async function loadFullHistory() {
  const container = document.getElementById('history-records-grid');
  if (!container) return;

  container.innerHTML = `
    <div class="col-span-full py-12 text-center text-emerald-800 glass-panel">
      <div class="inline-block animate-spin text-4xl mb-3">⏳</div>
      <p class="text-sm font-bold text-slate-800">আপনার সংরক্ষিত প্রেসক্রিপশন ও স্ক্যান ইতিহাস লোড হচ্ছে...</p>
    </div>
  `;

  try {
    const user = window.SmartAgroAuth ? window.SmartAgroAuth.getCurrentUser() : null;
    let url = '/api/history';
    if (user && user.uid) {
      url += `?firebase_uid=${encodeURIComponent(user.uid)}`;
    }

    const res = await fetch(url);
    const result = await res.json();

    if (result.success && result.data) {
      fullHistoryRecords = result.data;
      updateRecordCountBadge(fullHistoryRecords.length);
      applyHistoryFilters();
    } else {
      container.innerHTML = '<p class="text-center text-rose-600 py-6 font-bold">রেকর্ড লোড করতে সমস্যা হয়েছে।</p>';
    }
  } catch (err) {
    console.error('Failed to load history:', err);
    container.innerHTML = '<p class="text-center text-rose-600 py-6 font-bold">সার্ভার থেকে ইতিহাস আনতে ব্যর্থ হয়েছে।</p>';
  }
}

function updateRecordCountBadge(count) {
  const badge = document.getElementById('history-count-badge');
  if (badge) {
    badge.innerText = `মোট ${count}টি প্রেসক্রিপশন সংরক্ষিত`;
  }
}

function applyHistoryFilters() {
  const normalizedCropFilter = normalizeBnText(currentCropFilter);

  let filtered = fullHistoryRecords.filter(item => {
    const itemCrop = normalizeBnText(item.crop_name);
    const itemDisease = normalizeBnText(item.disease_bn);
    const itemDiseaseEn = (item.disease_en || '').toLowerCase();
    const itemDistrict = normalizeBnText(item.district);

    const matchesSearch = !historySearchQuery ||
      itemDisease.includes(historySearchQuery) ||
      itemDiseaseEn.includes(historySearchQuery) ||
      itemCrop.includes(historySearchQuery) ||
      itemDistrict.includes(historySearchQuery);

    const matchesCrop = currentCropFilter === 'all' || 
      itemCrop.includes(normalizedCropFilter);

    return matchesSearch && matchesCrop;
  });

  renderHistoryCards(filtered);
}

function findRecordById(id) {
  const numericId = parseInt(id, 10);
  return fullHistoryRecords.find(r => r.id === numericId) || fullHistoryRecords.find(r => r.id == id) || null;
}

function renderHistoryCards(records) {
  const container = document.getElementById('history-records-grid');
  if (!container) return;

  if (records.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center glass-panel border border-dashed border-slate-300 rounded-3xl">
        <span class="text-5xl block mb-3">📜</span>
        <h3 class="text-lg font-black text-slate-800">কোনো স্ক্যান রেকর্ড পাওয়া যায়নি</h3>
        <p class="text-xs md:text-sm text-slate-500 font-semibold mt-1 max-w-sm mx-auto">
          আপনার ফসলের আক্রান্ত পাতার ছবি আপলোড করে রোগ নির্ণয় করুন। ফলাফল এখানে সংরক্ষিত থাকবে।
        </p>
        <div class="mt-6">
          <a href="/" class="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs md:text-sm inline-flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition-all">
            <span>📷</span>
            <span>নতুন রোগ স্ক্যান করুন</span>
          </a>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = records.map((item) => {
    const d = new Date(item.created_at || Date.now());
    const formattedDate = d.toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const imageSrc = item.image_path || '/uploads/sample_rice.jpg';

    return `
      <div class="glass-panel p-5 md:p-6 rounded-2xl border border-slate-200 hover:border-emerald-400 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between group">
        <div>
          
          <!-- Top Row: Confidence & Date -->
          <div class="flex items-center justify-between gap-2 mb-3">
            <span class="text-xs px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black border border-emerald-300">
              ${item.confidence}% নিশ্চিত
            </span>
            <span class="text-[11px] text-slate-400 font-bold">
              🕒 ${formattedDate}
            </span>
          </div>

          <!-- Content Row: Thumbnail & Info -->
          <div class="flex items-start space-x-4">
            <div class="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner shrink-0 relative">
              <img src="${imageSrc}" alt="${item.disease_bn}" class="w-full h-full object-cover group-hover:scale-105 transition-transform" onerror="this.src='/uploads/sample_rice.jpg'">
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="font-black text-slate-900 text-base md:text-lg leading-snug line-clamp-2">${item.disease_bn}</h4>
              <p class="text-xs text-emerald-700 italic font-bold mt-0.5">${item.disease_en || ''}</p>
              <div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600 font-semibold">
                <span class="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 font-bold text-slate-800">🌾 ${item.crop_name}</span>
                <span class="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 font-bold text-slate-800">📍 ${item.district || 'বাংলাদেশ'}</span>
              </div>
            </div>
          </div>

          <!-- Snippet -->
          <div class="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium line-clamp-2">
            ${(item.symptoms || '').split('\n')[0] || 'লক্ষণ ও সমাধান দেখতে প্রেসক্রিপশন খুলুন।'}
          </div>

        </div>

        <!-- Card Actions -->
        <div class="mt-5 pt-3.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center space-x-2">
            <button onclick="SmartAgroHistory.openPrescriptionModal(${item.id})" class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95">
              <span>📋</span>
              <span>প্রেসক্রিপশন দেখুন</span>
            </button>
            <button onclick="SmartAgroHistory.speakRecordAudio(${item.id}, this)" class="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold transition-all" title="প্রেসক্রিপশন শুনুন">
              📢
            </button>
          </div>
          <button onclick="SmartAgroHistory.deleteRecord(${item.id})" class="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors text-xs" title="রেকর্ড মুছে ফেলুন">
            🗑️
          </button>
        </div>

      </div>
    `;
  }).join('');
}

// Speak Record Audio using SpeechSynthesis
function speakRecordAudio(recordId, btnEl) {
  const item = findRecordById(recordId);
  if (!item) return;

  const fullText = `
    স্মার্ট এগ্রো সংরক্ষিত প্রেসক্রিপশন।
    রোগের নাম: ${item.disease_bn}।
    ফসল: ${item.crop_name}।
    নির্ভুলতা: ${item.confidence} শতাংশ।
    প্রধান লক্ষণ: ${item.symptoms}।
    জৈব সমাধান: ${item.organic_solution}।
    রাসায়নিক বালাইনাশক: ${item.chemical_solution}।
    সতর্কতা: ${item.safety_warning || 'ফসল কাটার অন্তত ১৫ দিন পূর্বে রাসায়নিক স্প্রে বন্ধ রাখুন।'}।
  `.replace(/[•\n\r]/g, ' ').replace(/\s+/g, ' ');

  if (window.SmartAgroVoice && SmartAgroVoice.speakText) {
    SmartAgroVoice.speakText(fullText, btnEl);
  }
}

// Open Full Prescription Modal
function openPrescriptionModal(recordId) {
  const item = findRecordById(recordId);
  if (!item) return;

  let modal = document.getElementById('prescription-detail-modal');
  if (!modal) {
    injectPrescriptionModal();
    modal = document.getElementById('prescription-detail-modal');
  }

  // Populate data
  document.getElementById('modal-presc-title').innerText = item.disease_bn;
  document.getElementById('modal-presc-en').innerText = item.disease_en || '';
  document.getElementById('modal-presc-conf').innerText = `${item.confidence}% নিশ্চিত`;
  document.getElementById('modal-presc-crop').innerText = `ফসল: ${item.crop_name} • অবস্থান: ${item.district || 'বাংলাদেশ'}`;

  const d = new Date(item.created_at || Date.now());
  document.getElementById('modal-presc-date').innerText = d.toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  // Format Sections
  document.getElementById('modal-presc-symptoms').innerHTML = (item.symptoms || '').split('\n').filter(l => l.trim()).map(line => `
    <div class="flex items-start space-x-2.5 my-1.5 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs md:text-sm font-semibold text-slate-800">
      <span class="text-amber-600 font-bold shrink-0 text-base">⚠️</span>
      <span>${line.trim()}</span>
    </div>
  `).join('');

  document.getElementById('modal-presc-organic').innerHTML = (item.organic_solution || '').split('\n').filter(l => l.trim()).map((line, i) => `
    <div class="flex items-start space-x-2.5 my-1.5 p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs md:text-sm font-semibold text-slate-800">
      <span class="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">${i + 1}</span>
      <span>${line.replace(/^[০-৯\d]+[\.\:\)]\s*/, '').trim()}</span>
    </div>
  `).join('');

  document.getElementById('modal-presc-chemical').innerHTML = (item.chemical_solution || '').split('\n').filter(l => l.trim()).map((line, i) => `
    <div class="flex items-start space-x-2.5 my-1.5 p-2.5 rounded-xl bg-rose-50/80 border border-rose-200 text-xs md:text-sm font-semibold text-slate-800">
      <span class="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">${i + 1}</span>
      <span>${line.replace(/^[০-৯\d]+[\.\:\)]\s*/, '').trim()}</span>
    </div>
  `).join('');

  const warningEl = document.getElementById('modal-presc-warning');
  if (warningEl) {
    warningEl.innerText = item.safety_warning || 'বালাইনাশক স্প্রে করার সময় মুখে মাস্ক পরিধান করুন। ফসল তোলার অন্তত ১৫ দিন পূর্বে রাসায়নিক স্প্রে বন্ধ রাখুন।';
  }

  // Audio button
  const audioBtn = document.getElementById('modal-presc-audio-btn');
  if (audioBtn) {
    audioBtn.onclick = () => speakRecordAudio(item.id, audioBtn);
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.style.overflow = 'hidden';
}

function closePrescriptionModal() {
  const modal = document.getElementById('prescription-detail-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
  }
}

// Delete Record
async function deleteRecord(id) {
  if (!confirm('আপনি কি নিশ্চিত যে এই প্রেসক্রিপশন রেকর্ডটি মুছে ফেলতে চান?')) {
    return;
  }

  try {
    const res = await fetch(`/api/history/${id}`, { method: 'DELETE' });
    const result = await res.json();
    if (result.success) {
      if (window.SmartAgroAuth && SmartAgroAuth.showToast) {
        SmartAgroAuth.showToast('প্রেসক্রিপশন রেকর্ড মুছে ফেলা হয়েছে।');
      }
      await loadFullHistory();
    } else {
      alert(result.message || 'রেকর্ড মোছা সম্ভব হয়নি।');
    }
  } catch (err) {
    console.error('Delete error:', err);
    alert('সার্ভারে যোগাযোগ করতে সমস্যা হয়েছে।');
  }
}

// Inject Prescription Detail Modal
function injectPrescriptionModal() {
  const modalDiv = document.createElement('div');
  modalDiv.id = 'prescription-detail-modal';
  modalDiv.className = 'fixed inset-0 z-50 hidden items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in';

  modalDiv.innerHTML = `
    <div class="glass-panel p-6 md:p-8 max-w-3xl w-full relative bg-white/95 rounded-3xl shadow-2xl border-2 border-emerald-400 max-h-[90vh] overflow-y-auto">
      
      <!-- Close Button -->
      <button onclick="SmartAgroHistory.closePrescriptionModal()" class="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold text-lg transition-colors">
        ✕
      </button>

      <!-- Prescription Header -->
      <div class="pb-4 border-b border-slate-200 mb-6">
        <div class="flex flex-wrap items-center gap-2 mb-2">
          <span id="modal-presc-conf" class="px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm"></span>
          <span id="modal-presc-crop" class="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300"></span>
          <span id="modal-presc-date" class="text-xs text-slate-500 font-semibold"></span>
        </div>
        <h3 id="modal-presc-title" class="text-2xl md:text-3xl font-black text-slate-900"></h3>
        <p id="modal-presc-en" class="text-xs md:text-sm text-emerald-700 italic mt-0.5 font-bold"></p>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap items-center gap-2.5 mb-6">
        <button id="modal-presc-audio-btn" class="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all">
          <span>📢</span>
          <span>প্রেসক্রিপশন শুনুন</span>
        </button>
        <button onclick="window.print()" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all">
          <span>🖨️ প্রিন্ট করুন</span>
        </button>
      </div>

      <!-- 3 Core Sections -->
      <div class="space-y-5">
        
        <!-- Section 1: Symptoms -->
        <div class="p-4 rounded-2xl bg-amber-50/50 border-l-4 border-amber-500">
          <h4 class="text-base font-black text-slate-900 mb-2 flex items-center gap-2">
            <span>🔍</span>
            <span>লক্ষণ ও বিস্তার</span>
          </h4>
          <div id="modal-presc-symptoms"></div>
        </div>

        <!-- Section 2: Organic Solution -->
        <div class="p-4 rounded-2xl bg-emerald-50/50 border-l-4 border-emerald-500">
          <h4 class="text-base font-black text-slate-900 mb-2 flex items-center gap-2">
            <span>🌱</span>
            <span>জৈব ও প্রাকৃতিক প্রতিকার</span>
          </h4>
          <div id="modal-presc-organic"></div>
        </div>

        <!-- Section 3: Chemical Solution -->
        <div class="p-4 rounded-2xl bg-rose-50/50 border-l-4 border-rose-500">
          <h4 class="text-base font-black text-slate-900 mb-2 flex items-center gap-2">
            <span>🧪</span>
            <span>অনুমোদিত রাসায়নিক বালাইনাশক</span>
          </h4>
          <div id="modal-presc-chemical"></div>
        </div>

        <!-- Safety Warning -->
        <div class="p-3.5 rounded-xl bg-rose-100/70 border border-rose-300 text-xs md:text-sm font-semibold text-rose-900 flex items-start gap-2">
          <span class="text-base shrink-0">🚨</span>
          <span id="modal-presc-warning"></span>
        </div>

      </div>

    </div>
  `;

  document.body.appendChild(modalDiv);
}

window.SmartAgroHistory = {
  initHistoryPage,
  loadFullHistory,
  openPrescriptionModal,
  closePrescriptionModal,
  speakRecordAudio,
  deleteRecord
};
