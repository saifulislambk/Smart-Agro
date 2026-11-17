// ====================================================================
// Smart Agro (স্মার্ট এগ্রো) - AI Crop Disease Scanner Module
// Features:
// 1. Live WebRTC In-Browser Camera Viewfinder with leaf targeting guide
// 2. Client-side fast image pre-processing & instant auto-upload
// 3. Fallback support for mobile native camera (capture="environment")
// 4. MobileNetV2 backend connection with zero fake delays
// 5. Clean medical-grade agro-prescription & speech synthesizer
// ====================================================================

let selectedFile = null;
let currentPreviewDataUrl = '';
let isScanning = false;
let currentPrescriptionText = '';
let cameraStream = null;
let currentFacingMode = 'environment'; // 'environment' (back) or 'user' (front)

// Initialize Scanner Module
function initScanner() {
  const dropzone = document.getElementById('scanner-dropzone');
  const fileInput = document.getElementById('crop-image-input');
  const cameraInput = document.getElementById('crop-camera-input');
  
  const btnOpenCamera = document.getElementById('btn-open-camera');
  const btnOpenGallery = document.getElementById('btn-open-gallery');
  const emptyStateCameraBtn = document.getElementById('empty-state-camera-btn');
  const emptyStateGalleryBtn = document.getElementById('empty-state-gallery-btn');
  
  const cameraCloseBtn = document.getElementById('camera-close-btn');
  const cameraSwitchBtn = document.getElementById('camera-switch-btn');
  const cameraShutterBtn = document.getElementById('camera-shutter-btn');
  const cameraGalleryFallbackBtn = document.getElementById('camera-gallery-fallback-btn');
  
  const resetBtn = document.getElementById('scanner-reset-btn');
  const rescanBtn = document.getElementById('scanner-rescan-btn');
  const newCameraBtn = document.getElementById('scanner-new-camera-btn');
  const scanTriggerBtn = document.getElementById('start-scan-btn');
  const analyzeNowBtn = document.getElementById('scanner-analyze-now-btn');
  const speechBtn = document.getElementById('listen-prescription-btn');

  // Prevent browser from navigating away on accidental drag-and-drop
  window.addEventListener('dragover', (e) => e.preventDefault(), false);
  window.addEventListener('drop', (e) => e.preventDefault(), false);

  // 1. Camera Trigger Buttons
  if (btnOpenCamera) {
    btnOpenCamera.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openLiveCamera();
    });
  }
  if (emptyStateCameraBtn) {
    emptyStateCameraBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openLiveCamera();
    });
  }
  if (newCameraBtn) {
    newCameraBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openLiveCamera();
    });
  }

  // 2. Native Gallery & Dropzone Click Handling
  // Note: btnOpenGallery & emptyStateGalleryBtn are native <label for="crop-image-input"> elements.
  // We do NOT call e.preventDefault() on them, allowing the native browser file picker to open reliably.
  if (dropzone && fileInput) {
    dropzone.addEventListener('click', (e) => {
      // If user clicked the dropzone area directly (not a button or label)
      if (!e.target.closest('button') && !e.target.closest('label')) {
        fileInput.click();
      }
    });
  }

  // 3. Camera Modal Controls
  if (cameraCloseBtn) {
    cameraCloseBtn.addEventListener('click', closeLiveCamera);
  }
  if (cameraSwitchBtn) {
    cameraSwitchBtn.addEventListener('click', switchCamera);
  }
  if (cameraShutterBtn) {
    cameraShutterBtn.addEventListener('click', captureCameraSnapshot);
  }
  if (cameraGalleryFallbackBtn && fileInput) {
    cameraGalleryFallbackBtn.addEventListener('click', () => {
      closeLiveCamera();
      fileInput.click();
    });
  }

  // 4. File Input & Drag & Drop Handling
  if (fileInput) {
    fileInput.addEventListener('click', () => {
      fileInput.value = '';
    });
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFileSelected(e.target.files[0]);
      }
    });
  }

  if (cameraInput) {
    cameraInput.addEventListener('click', () => {
      cameraInput.value = '';
    });
    cameraInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFileSelected(e.target.files[0]);
      }
    });
  }

  if (dropzone) {
    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('border-emerald-500', 'bg-emerald-100/40');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('border-emerald-500', 'bg-emerald-100/40');
      }, false);
    });

    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt ? dt.files : null;
      if (files && files.length > 0) {
        handleFileSelected(files[0]);
      }
    });
  }

  // 5. Action Buttons
  if (analyzeNowBtn) {
    analyzeNowBtn.addEventListener('click', (e) => {
      e.preventDefault();
      executeCropScan();
    });
  }
  if (scanTriggerBtn) {
    scanTriggerBtn.addEventListener('click', (e) => {
      e.preventDefault();
      executeCropScan();
    });
  }
  if (rescanBtn) {
    rescanBtn.addEventListener('click', (e) => {
      e.preventDefault();
      executeCropScan();
    });
  }
  if (resetBtn) {
    resetBtn.addEventListener('click', (e) => {
      e.preventDefault();
      resetScanner();
    });
  }
  if (speechBtn) {
    speechBtn.addEventListener('click', playPrescriptionSpeech);
  }
}

// ====================================================================
// Live WebRTC Camera Management
// ====================================================================

async function openLiveCamera() {
  const modal = document.getElementById('camera-modal');
  const video = document.getElementById('camera-video');
  const cameraInput = document.getElementById('crop-camera-input');

  // Check WebRTC browser support
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.warn('WebRTC getUserMedia not supported in this browser. Falling back to native file capture.');
    if (cameraInput) cameraInput.click();
    return;
  }

  if (modal) {
    modal.style.display = 'flex';
  }

  await startCameraStream(currentFacingMode);
}

async function startCameraStream(facingMode) {
  const video = document.getElementById('camera-video');
  const cameraInput = document.getElementById('crop-camera-input');

  // Stop any active stream first
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }

  try {
    const constraints = {
      video: {
        facingMode: { ideal: facingMode },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    };

    cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
    if (video) {
      video.srcObject = cameraStream;
      await video.play();
    }
  } catch (err) {
    console.warn('Primary camera constraints failed, attempting fallback...', err);
    try {
      // Simple fallback without resolution constraints
      cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (video) {
        video.srcObject = cameraStream;
        await video.play();
      }
    } catch (fallbackErr) {
      console.error('Fatal camera error:', fallbackErr);
      closeLiveCamera();
      alert('ক্যামেরা চালু করা সম্ভব হয়নি। অনুগ্রহ করে ব্রাউজারে ক্যামেরার অনুমতি দিন অথবা সরাসরি ছবি নির্বাচন করুন।');
      if (cameraInput) cameraInput.click();
    }
  }
}

function switchCamera() {
  currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
  startCameraStream(currentFacingMode);
}

function closeLiveCamera() {
  const modal = document.getElementById('camera-modal');
  const video = document.getElementById('camera-video');

  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }

  if (video) {
    video.srcObject = null;
  }

  if (modal) {
    modal.style.display = 'none';
  }
}

function captureCameraSnapshot() {
  const video = document.getElementById('camera-video');
  const canvas = document.getElementById('camera-canvas') || document.createElement('canvas');

  if (!video || !video.videoWidth) {
    alert('ক্যামেরা ফ্রেম লোড হচ্ছে, এক সেকেন্ড পর পুনরায় চেষ্টা করুন।');
    return;
  }

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Shutter flash effect
  const shutterBtn = document.getElementById('camera-shutter-btn');
  if (shutterBtn) {
    shutterBtn.classList.add('scale-75', 'bg-emerald-300');
    setTimeout(() => shutterBtn.classList.remove('scale-75', 'bg-emerald-300'), 150);
  }

  canvas.toBlob((blob) => {
    if (blob) {
      const file = new File([blob], `camera_leaf_${Date.now()}.jpg`, { type: 'image/jpeg' });
      closeLiveCamera();
      handleFileSelected(file);
    } else {
      alert('ছবি ধারণ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    }
  }, 'image/jpeg', 0.92);
}

// ====================================================================
// Client-side File Handling & Instant Scanning
// ====================================================================

function handleFileInputChange(input) {
  if (input && input.files && input.files.length > 0) {
    handleFileSelected(input.files[0]);
  }
}

function handleFileSelected(file) {
  if (!file) return;

  console.log('📁 [Smart Agro] File selected:', file.name, 'Size:', file.size, 'Type:', file.type);
  selectedFile = file;

  const previewImg = document.getElementById('scanner-preview-img');
  const emptyState = document.getElementById('scanner-empty-state');
  const previewState = document.getElementById('scanner-preview-state');
  const scanTriggerBtn = document.getElementById('start-scan-btn');
  const analyzeNowBtn = document.getElementById('scanner-analyze-now-btn');
  const resultsContainer = document.getElementById('scan-results-container');
  const unidentifiedContainer = document.getElementById('scan-unidentified-container');
  const fileNameEl = document.getElementById('preview-file-name');
  const fileSizeEl = document.getElementById('preview-file-size');

  // 1. Instant Zero-Latency Preview (renders synchronously via URL.createObjectURL)
  try {
    if (previewImg) {
      previewImg.src = URL.createObjectURL(file);
    }
  } catch (err) {
    console.warn('URL.createObjectURL fallback to FileReader:', err);
  }

  if (fileNameEl) {
    fileNameEl.textContent = file.name || 'নির্বাচিত পাতা.jpg';
  }
  if (fileSizeEl) {
    const sizeKb = file.size ? (file.size / 1024).toFixed(1) : '০';
    fileSizeEl.textContent = `(${sizeKb} KB)`;
  }

  // 2. Direct Display State Switching (immune to Tailwind CSS class specificity)
  if (emptyState) {
    emptyState.style.display = 'none';
    emptyState.classList.add('hidden');
  }
  if (previewState) {
    previewState.style.display = 'flex';
    previewState.classList.remove('hidden');
  }
  if (resultsContainer) {
    resultsContainer.style.display = 'none';
    resultsContainer.classList.add('hidden');
  }
  if (unidentifiedContainer) {
    unidentifiedContainer.style.display = 'none';
    unidentifiedContainer.classList.add('hidden');
  }

  // 3. Enable Analyze Buttons
  if (scanTriggerBtn) {
    scanTriggerBtn.disabled = false;
    scanTriggerBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    scanTriggerBtn.classList.add('hover:bg-emerald-500', 'cursor-pointer');
    scanTriggerBtn.innerHTML = `<span>🔍</span> <span>রোগ নির্ণয় ও সমাধান জানুন</span>`;
  }
  if (analyzeNowBtn) {
    analyzeNowBtn.disabled = false;
    analyzeNowBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    analyzeNowBtn.classList.add('cursor-pointer');
    analyzeNowBtn.innerHTML = `<span>🔍</span> <span>এই পাতার রোগ নির্ণয় করুন</span>`;
  }

  // 4. Smoothly scroll preview box into view
  const dropzone = document.getElementById('scanner-dropzone');
  if (dropzone) {
    dropzone.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // 5. Read Base64 DataURL asynchronously for prescription card persistence
  const reader = new FileReader();
  reader.onload = function (e) {
    currentPreviewDataUrl = e.target.result;
    if (previewImg && (!previewImg.src || !previewImg.src.startsWith('blob:'))) {
      previewImg.src = currentPreviewDataUrl;
    }
  };
  reader.readAsDataURL(file);
}

// Load Sample Leaf Preset for 1-Click Testing
async function loadSampleLeaf(cropType) {
  const sampleMap = {
    rice: 'sample_rice.jpg',
    tomato: 'sample_tomato.jpg',
    potato: 'sample_potato.jpg',
    eggplant: 'sample_eggplant.jpg'
  };

  const fileName = sampleMap[cropType];
  if (!fileName) return;

  const cropSelectEl = document.getElementById('crop-type-select');
  if (cropSelectEl && cropSelectEl.querySelector(`option[value="${cropType}"]`)) {
    cropSelectEl.value = cropType;
  }
  updateCropPillStyles(cropType);

  try {
    const res = await fetch(`/uploads/${fileName}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const file = new File([blob], fileName, { type: 'image/jpeg' });
    handleFileSelected(file);
  } catch (err) {
    console.error('Error loading sample leaf:', err);
    alert('নমুনা ছবি লোড করতে ব্যর্থ হয়েছে।');
  }
}

// Crop Filter Controller
function setCropFilter(crop) {
  const selectEl = document.getElementById('crop-type-select');
  if (selectEl) {
    selectEl.value = crop;
  }
  updateCropPillStyles(crop);
  if (selectedFile) {
    executeCropScan();
  }
}

function onCropSelectChange(crop) {
  updateCropPillStyles(crop);
  if (selectedFile) {
    executeCropScan();
  }
}

function updateCropPillStyles(activeCrop) {
  const pills = document.querySelectorAll('.crop-pill-btn');
  pills.forEach(pill => {
    const pillCrop = pill.getAttribute('data-crop-pill');
    if (pillCrop === activeCrop) {
      pill.className = 'crop-pill-btn px-3.5 py-1.5 rounded-xl text-xs font-black transition-all bg-emerald-600 text-white shadow-xs border border-emerald-600';
    } else {
      pill.className = 'crop-pill-btn px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all bg-white text-slate-700 hover:bg-emerald-50 border border-slate-200';
    }
  });
}

function rescanWithCrop(crop) {
  setCropFilter(crop);
}

// Reset Scanner View
function resetScanner() {
  selectedFile = null;
  currentPreviewDataUrl = '';
  isScanning = false;
  currentPrescriptionText = '';

  const fileInput = document.getElementById('crop-image-input');
  const cameraInput = document.getElementById('crop-camera-input');
  if (fileInput) fileInput.value = '';
  if (cameraInput) cameraInput.value = '';

  const emptyState = document.getElementById('scanner-empty-state');
  const previewState = document.getElementById('scanner-preview-state');
  const previewImg = document.getElementById('scanner-preview-img');
  const resultsContainer = document.getElementById('scan-results-container');
  const unidentifiedContainer = document.getElementById('scan-unidentified-container');
  const scanTriggerBtn = document.getElementById('start-scan-btn');
  const analyzeNowBtn = document.getElementById('scanner-analyze-now-btn');
  const scanningOverlay = document.getElementById('preview-scanning-overlay');

  if (previewImg) previewImg.src = '';
  const resultLeafPreview = document.getElementById('result-leaf-preview-img');
  if (resultLeafPreview) resultLeafPreview.src = '';
  const unidentifiedLeafPreview = document.getElementById('unidentified-leaf-preview-img');
  if (unidentifiedLeafPreview) unidentifiedLeafPreview.src = '';

  if (scanningOverlay) {
    scanningOverlay.style.display = 'none';
    scanningOverlay.classList.add('hidden');
  }
  if (emptyState) {
    emptyState.style.display = 'flex';
    emptyState.classList.remove('hidden');
  }
  if (previewState) {
    previewState.style.display = 'none';
    previewState.classList.add('hidden');
  }
  if (resultsContainer) {
    resultsContainer.style.display = 'none';
    resultsContainer.classList.add('hidden');
  }
  if (unidentifiedContainer) {
    unidentifiedContainer.style.display = 'none';
    unidentifiedContainer.classList.add('hidden');
  }

  if (scanTriggerBtn) {
    scanTriggerBtn.disabled = true;
    scanTriggerBtn.classList.add('opacity-50', 'cursor-not-allowed');
    scanTriggerBtn.classList.remove('hover:bg-emerald-500', 'cursor-pointer');
    scanTriggerBtn.innerHTML = `<span>🔍</span> <span>রোগ নির্ণয় ও সমাধান জানুন</span>`;
  }
  if (analyzeNowBtn) {
    analyzeNowBtn.disabled = false;
    analyzeNowBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    analyzeNowBtn.innerHTML = `<span>🔍</span> <span>এই পাতার রোগ নির্ণয় করুন</span>`;
  }

  const dropzone = document.getElementById('scanner-dropzone');
  if (dropzone) {
    dropzone.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

// Execute AI Disease Scan
async function executeCropScan() {
  if (!selectedFile || isScanning) return;

  isScanning = true;
  const scanTriggerBtn = document.getElementById('start-scan-btn');
  const analyzeNowBtn = document.getElementById('scanner-analyze-now-btn');
  const rescanBtn = document.getElementById('scanner-rescan-btn');
  const resultsContainer = document.getElementById('scan-results-container');
  const unidentifiedContainer = document.getElementById('scan-unidentified-container');
  const scanningOverlay = document.getElementById('preview-scanning-overlay');
  const statusIndicator = document.getElementById('scanner-status-indicator');

  if (resultsContainer) resultsContainer.classList.add('hidden');
  if (unidentifiedContainer) unidentifiedContainer.classList.add('hidden');
  if (scanningOverlay) scanningOverlay.classList.remove('hidden');

  if (statusIndicator) {
    statusIndicator.innerHTML = `
      <svg class="animate-spin h-4 w-4 text-emerald-700 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
      </svg>
      <span>এআই নিউরাল মডেল দ্বারা গভীর বিশ্লেষণ চলছে...</span>
    `;
    statusIndicator.className = 'mt-3 flex items-center justify-center gap-2 text-xs font-bold text-emerald-900 bg-emerald-100 px-4 py-2 rounded-xl border border-emerald-300 animate-pulse';
  }

  if (scanTriggerBtn) {
    scanTriggerBtn.disabled = true;
    scanTriggerBtn.innerHTML = `
      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
      </svg>
      <span>এআই মডেল দ্বারা বিশ্লেষণ চলছে...</span>
    `;
  }

  if (analyzeNowBtn) {
    analyzeNowBtn.disabled = true;
    analyzeNowBtn.innerHTML = `
      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
      </svg>
      <span>বিশ্লেষণ চলছে...</span>
    `;
  }

  const districtEl = document.getElementById('district-select');
  const district = districtEl ? districtEl.value : 'ঢাকা';

  const cropSelectEl = document.getElementById('crop-type-select');
  const cropType = cropSelectEl ? cropSelectEl.value : 'auto';

  const user = window.SmartAgroAuth ? window.SmartAgroAuth.getCurrentUser() : null;
  const firebaseUid = user ? user.uid : 'guest';
  const userName = user ? user.displayName : 'কৃষক ভাই';

  const formData = new FormData();
  formData.append('image', selectedFile);
  formData.append('district', district);
  formData.append('crop_type', cropType);
  formData.append('firebase_uid', firebaseUid);
  formData.append('user_name', userName);

  console.log('🚀 [Smart Agro] Sending image to /api/scan:', selectedFile.name || 'unnamed', selectedFile.size, 'bytes');

  try {
    const response = await fetch('/api/scan', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errText = await response.text();
      let errJson = null;
      try { errJson = JSON.parse(errText); } catch(e) {}
      if (errJson && (errJson.is_unidentified || errJson.error_code)) {
        renderUnidentifiedResult(errJson.message, errJson.error_code);
        return;
      }
      throw new Error((errJson && errJson.message) || `HTTP Error ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ [Smart Agro] Scan response received:', result);

    if (result.is_unidentified) {
      // Unidentified / Invalid Image State
      renderUnidentifiedResult(result.message, result.error_code);
    } else if (result.success && result.data) {
      // Valid Diagnostic Report
      renderScanResults(result.data);
    } else {
      alert(result.message || 'রোগ শনাক্তকরণ সার্ভারে কোনো ত্রুটি দেখা দিয়েছে।');
    }
  } catch (err) {
    console.error('Scan error:', err);
    alert('সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে। পাইথন এআই মাইক্রোসার্ভিস (Port 5000) ও নোড সার্ভার সচল আছে কিনা নিশ্চিত করুন।');
  } finally {
    isScanning = false;
    if (scanningOverlay) scanningOverlay.classList.add('hidden');
    if (statusIndicator) {
      statusIndicator.className = 'mt-3 flex items-center justify-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200';
      statusIndicator.innerHTML = `<span>✅ বিশ্লেষণ সমাপ্ত</span>`;
    }
    if (scanTriggerBtn) {
      scanTriggerBtn.disabled = false;
      scanTriggerBtn.innerHTML = `<span>🔍 রোগ নির্ণয় ও সমাধান জানুন</span>`;
    }
    if (analyzeNowBtn) {
      analyzeNowBtn.disabled = false;
      analyzeNowBtn.innerHTML = `<span>🔍</span> <span>এই পাতার রোগ নির্ণয় করুন</span>`;
    }
  }
}

// Render Clean Diagnostic Results
function renderScanResults(data) {
  const container = document.getElementById('scan-results-container');
  const unidentifiedContainer = document.getElementById('scan-unidentified-container');
  if (!container) return;

  if (unidentifiedContainer) unidentifiedContainer.classList.add('hidden');

  // Display uploaded leaf preview photo in prescription card
  const leafPreviewImg = document.getElementById('result-leaf-preview-img');
  if (leafPreviewImg) {
    leafPreviewImg.src = currentPreviewDataUrl || data.image_path || '';
  }

  const titleEl = document.getElementById('result-disease-title');
  const titleEnEl = document.getElementById('result-disease-en');
  const confEl = document.getElementById('result-confidence-badge');
  const cropBadgeEl = document.getElementById('result-crop-badge');
  const severityBadgeEl = document.getElementById('result-severity-badge');

  const symptomsEl = document.getElementById('result-symptoms');
  const organicEl = document.getElementById('result-organic');
  const chemicalEl = document.getElementById('result-chemical');
  const fertilizerEl = document.getElementById('result-fertilizer');
  const warningEl = document.getElementById('result-safety-warning');

  if (titleEl) titleEl.innerText = data.disease_bn;
  if (titleEnEl) titleEnEl.innerText = data.disease_en || '';
  if (confEl) confEl.innerText = `${data.confidence}% নিশ্চিত`;
  if (cropBadgeEl) cropBadgeEl.innerText = `ফসল: ${data.crop_name}`;
  
  if (severityBadgeEl) {
    const sev = data.severity_bn || 'মাঝারি';
    severityBadgeEl.innerText = `ক্ষতির মাত্রা: ${sev}`;
    if (sev === 'মারাত্মক' || sev === 'উচ্চ') {
      severityBadgeEl.className = 'px-2.5 py-0.5 rounded-md text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200';
    } else if (sev === 'নীরোগ') {
      severityBadgeEl.className = 'px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200';
    } else {
      severityBadgeEl.className = 'px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200';
    }
  }

  // Format Text Content Cleanly
  if (symptomsEl) symptomsEl.innerHTML = formatBulletList(data.symptoms);
  if (organicEl) organicEl.innerHTML = formatBulletList(data.organic_solution || data.organic_cure);
  if (chemicalEl) chemicalEl.innerHTML = formatBulletList(data.chemical_solution || data.chemical_cure);
  if (fertilizerEl) {
    const fert = data.fertilizer_solution || data.fertilizer_cure || 'রোগাক্রান্ত অবস্থায় নাইট্রোজেন (ইউরিয়া) সীমিত রাখুন। রোগ প্রতিরোধ ক্ষমতা বাড়াতে প্রতি শতকে ৩০০-৪০০ গ্রাম পটাশ (MOP) সার দিন এবং নতুন সুস্থ পাতা গজানোর জন্য সলুবর বোরন ১.৫ গ্রাম ও চিলেটেড জিংক ০.৫ গ্রাম স্প্রে করুন।';
    fertilizerEl.innerHTML = formatBulletList(fert);
  }
  if (warningEl && data.safety_warning) {
    warningEl.innerText = data.safety_warning;
  }

  // Set up speech prescription text
  currentPrescriptionText = `ফসলের নাম: ${data.crop_name}। রোগ: ${data.disease_bn}। ক্ষতির মাত্রা: ${data.severity_bn}। লক্ষণ: ${data.symptoms}। জৈব সমাধান: ${data.organic_solution || ''}। রাসায়নিক সমাধান: ${data.chemical_solution || ''}।`;

  // Roadmap link
  const roadmapLinkEl = document.getElementById('result-roadmap-link');
  if (roadmapLinkEl) {
    const cropNameToId = {
      'ধান': 'rice', 'গম': 'wheat', 'ভুট্টা': 'maize', 'আলু': 'potato',
      'টমেটো': 'tomato', 'বেগুন': 'eggplant', 'মরিচ': 'chilli', 'সরিষা': 'mustard',
      'পেঁয়াজ': 'onion', 'পেঁয়াজ': 'onion', 'রসুন': 'garlic', 'লাউ': 'bottle_gourd',
      'শিম': 'hyacinth_bean', 'পেঁপে': 'papaya', 'তুলা': 'cotton', 'আখ': 'sugarcane'
    };
    const targetCropId = cropNameToId[data.crop_name] || 'rice';
    roadmapLinkEl.href = `/crop-detail?crop=${targetCropId}`;
  }

  if (unidentifiedContainer) {
    unidentifiedContainer.style.display = 'none';
    unidentifiedContainer.classList.add('hidden');
  }

  container.style.display = 'block';
  container.classList.remove('hidden');
  container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Render Unidentified / Invalid Image View
function renderUnidentifiedResult(customMessage, errorCode) {
  const container = document.getElementById('scan-results-container');
  const unidentifiedContainer = document.getElementById('scan-unidentified-container');
  const msgEl = document.getElementById('unidentified-reason-message');
  const unidentifiedLeafImg = document.getElementById('unidentified-leaf-preview-img');
  const previewImg = document.getElementById('scanner-preview-img');
  const badgeEl = document.getElementById('unidentified-error-badge');
  const iconEl = document.getElementById('unidentified-error-icon');

  if (container) {
    container.style.display = 'none';
    container.classList.add('hidden');
  }
  if (unidentifiedContainer) {
    if (unidentifiedLeafImg) {
      unidentifiedLeafImg.src = currentPreviewDataUrl || (previewImg ? previewImg.src : '') || '';
    }
    if (msgEl && customMessage) {
      msgEl.innerText = customMessage;
    }

    // Dynamic color-coded badge & icon mapping based on errorCode
    if (badgeEl && iconEl) {
      const code = (errorCode || 'UNIDENTIFIED_IMAGE').toUpperCase();
      switch (code) {
        case 'NON_LEAF_OBJECT':
          iconEl.innerText = '🚜';
          badgeEl.innerText = 'পাতা নয় / অপ্রাসঙ্গিক বস্তু';
          badgeEl.className = 'px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-200';
          break;
        case 'UNSUPPORTED_CROP_SPECIES':
          iconEl.innerText = '🌾';
          badgeEl.innerText = 'অসমর্থিত ফসল প্রজাতি';
          badgeEl.className = 'px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200';
          break;
        case 'LOW_CONFIDENCE':
          iconEl.innerText = '🔍';
          badgeEl.innerText = 'অস্পষ্ট ছবি / অবিশ্বস্ত ফলাফল';
          badgeEl.className = 'px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200';
          break;
        case 'CROP_MISMATCH':
          iconEl.innerText = '⚠️';
          badgeEl.innerText = 'নির্বাচিত ফসলের সাথে অমিল';
          badgeEl.className = 'px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200';
          break;
        case 'INVALID_IMAGE':
        case 'NOT_AN_IMAGE':
          iconEl.innerText = '🚫';
          badgeEl.innerText = 'অবৈধ ছবির ফরম্যাট';
          badgeEl.className = 'px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-200';
          break;
        case 'UNIDENTIFIED_DISEASE':
          iconEl.innerText = '❓';
          badgeEl.innerText = 'অচেনা রোগ / ডাটাবেজে নেই';
          badgeEl.className = 'px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-100 text-slate-800 border border-slate-200';
          break;
        default:
          iconEl.innerText = '⚠️';
          badgeEl.innerText = code;
          badgeEl.className = 'px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200';
          break;
      }
    }

    unidentifiedContainer.style.display = 'block';
    unidentifiedContainer.classList.remove('hidden');
    unidentifiedContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// Clean bullet point formatter
function formatBulletList(text) {
  if (!text) return '<p class="text-slate-500">কোনো তথ্য পাওয়া যায়নি।</p>';
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  if (lines.length === 1) {
    return `<p class="leading-relaxed">${lines[0]}</p>`;
  }
  return lines.map(line => `<div class="flex items-start gap-1.5"><span class="text-emerald-600 font-bold">•</span><span>${line.trim()}</span></div>`).join('');
}

// Bengali Text-to-Speech
function playPrescriptionSpeech() {
  if (!currentPrescriptionText) return;
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentPrescriptionText);
    utterance.lang = 'bn-BD';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  } else {
    alert('আপনার ব্রাউজারে ভয়েস স্পিচ সাপোর্ট করে না।');
  }
}

// Export module to global scope
window.SmartAgroScanner = {
  init: initScanner,
  handleFileInputChange,
  handleFileSelected,
  openLiveCamera,
  closeLiveCamera,
  switchCamera,
  captureCameraSnapshot,
  loadSampleLeaf,
  setCropFilter,
  onCropSelectChange,
  rescanWithCrop,
  resetScanner,
  executeCropScan,
  renderUnidentifiedResult
};

// Auto-initialize when script loads if document is already ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScanner);
  } else {
    initScanner();
  }
}
