// ====================================================================
// Smart Agro (স্মার্ট এগ্রো) - Bengali Voice Assistant / Text-to-Speech
// ====================================================================

let isSpeaking = false;
let currentUtterance = null;
let currentButtonEl = null;

// Preload available voices
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    try {
      window.speechSynthesis.getVoices();
    } catch (e) {}
  };
}

function initVoiceAssistant() {
  const listenBtn = document.getElementById('listen-prescription-btn');
  if (listenBtn) {
    listenBtn.addEventListener('click', togglePrescriptionSpeech);
  }
}

function togglePrescriptionSpeech() {
  const listenBtn = document.getElementById('listen-prescription-btn');
  if (isSpeaking) {
    stopSpeaking();
    return;
  }

  const diseaseTitle = document.getElementById('result-disease-title')?.innerText || '';
  const confidence = document.getElementById('result-confidence-badge')?.innerText || '';
  const symptoms = document.getElementById('result-symptoms')?.innerText || '';
  const organic = document.getElementById('result-organic')?.innerText || '';
  const chemical = document.getElementById('result-chemical')?.innerText || '';
  const warning = document.getElementById('result-safety-warning')?.innerText || '';

  if (!diseaseTitle) {
    alert('প্রথমে একটি ফসলের রোগ স্ক্যান করুন।');
    return;
  }

  const fullSpeechText = `
    স্মার্ট এগ্রো এআই রোগ শনাক্তকরণ ফলাফল। 
    রোগের নাম: ${diseaseTitle}। 
    নির্ভুলতা: ${confidence}। 
    রোগের প্রধান লক্ষণসমূহ: ${symptoms}। 
    জৈব ও প্রাকৃতিক সমাধান: ${organic}। 
    অনুমোদিত রাসায়নিক বালাইনাশক: ${chemical}। 
    বিশেষ সতর্কতা: ${warning}।
  `.replace(/[•\n\r]/g, ' ').replace(/\s+/g, ' ');

  speakText(fullSpeechText, listenBtn);
}

function speakText(text, btnElement = null) {
  if (!('speechSynthesis' in window)) {
    alert('দুঃখিত, আপনার ব্রাউজারে বাংলা অডিও ভয়েস রিডার সমর্থিত নয়।');
    return;
  }

  // If already speaking and user re-triggers same button, stop
  if (isSpeaking && currentButtonEl === btnElement && btnElement) {
    stopSpeaking();
    return;
  }

  stopSpeaking();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'bn-BD'; // Bengali (Bangladesh)
  utterance.rate = 0.95; // slightly slower for rural clarity
  utterance.pitch = 1.0;

  // Check available voices for Bengali
  const voices = window.speechSynthesis.getVoices();
  const bengaliVoice = voices.find(v => {
    const l = (v.lang || '').toLowerCase();
    const n = (v.name || '').toLowerCase();
    return l.startsWith('bn') || n.includes('bangla') || n.includes('bengali');
  });

  if (bengaliVoice) {
    utterance.voice = bengaliVoice;
  }

  const targetBtn = btnElement || document.getElementById('listen-prescription-btn');
  currentButtonEl = targetBtn;

  utterance.onstart = () => {
    isSpeaking = true;
    if (targetBtn) {
      targetBtn.dataset.originalHtml = targetBtn.innerHTML;
      targetBtn.innerHTML = `
        <span class="inline-block animate-pulse text-rose-600">🔊</span>
        <span>অডিও থামান</span>
      `;
      targetBtn.classList.add('bg-rose-100', 'border-rose-400');
    }
  };

  utterance.onend = () => {
    stopSpeaking();
  };

  utterance.onerror = () => {
    stopSpeaking();
  };

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  isSpeaking = false;

  if (currentButtonEl) {
    if (currentButtonEl.dataset && currentButtonEl.dataset.originalHtml) {
      currentButtonEl.innerHTML = currentButtonEl.dataset.originalHtml;
    } else {
      currentButtonEl.innerHTML = `
        <span>📢</span>
        <span>প্রেসক্রিপশন শুনুন</span>
      `;
    }
    currentButtonEl.classList.remove('bg-rose-100', 'border-rose-400');
    currentButtonEl = null;
  }

  const defaultListenBtn = document.getElementById('listen-prescription-btn');
  if (defaultListenBtn && defaultListenBtn !== currentButtonEl) {
    defaultListenBtn.innerHTML = `
      <span>📢</span>
      <span>প্রেসক্রিপশন শুনুন</span>
    `;
    defaultListenBtn.classList.remove('bg-rose-100', 'border-rose-400');
  }
}

window.SmartAgroVoice = {
  initVoiceAssistant,
  speakText,
  stopSpeaking,
  togglePrescriptionSpeech,
  isSpeaking: () => isSpeaking
};

