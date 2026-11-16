// ====================================================================
// Smart Agro (স্মার্ট এগ্রো) - Grafting, Budding & Nursery Masterclass Module
// Fully Dynamic Interactive Anatomical Propagation Simulator
// Supports: Cleft Grafting, Air Layering, T-Budding, Lotus Tuber Division
// ====================================================================

let currentMethod = 'cleft';
let currentSimStep = 1;
let isSimPlaying = false;
let simInterval = null;

// Multi-method propagation scientific simulation dataset
const methodsData = {
  // ------------------------------------------------------------------
  // 1. জোড় কলম (Solanaceous Cleft Grafting & Wedge Grafting)
  // ------------------------------------------------------------------
  cleft: {
    key: 'cleft',
    name: 'জোড় কলম (Cleft Grafting)',
    subtitle: 'টমেটো, বেগুন, আম ও ফলদ গাছের রোগ-প্রতিরোধী জোড় কলম',
    plantBadge: '🍅 টমেটো ও বেগুন',
    season: 'মে - অক্টোবর (গ্রীষ্ম ও বর্ষা)',
    successRate: '৯৫%',
    steps: [
      {
        step: 1,
        title: "রুটস্টক চারা নির্বাচন ও মসৃণ খাঁজ কর্তন (Rootstock Cut)",
        duration: "সময়কাল: রোপণের পূর্বে",
        desc: "বন্য তিতবেগুন বা সুস্থ বুনো জাতের কাণ্ডের মাটির ৫-৭ সেমি ওপরে ধারালো স্টেরিলাইজড ব্লেড দিয়ে সমান্তরাল বা ৪৫° কোণে মসৃণভাবে কেটে ফেলতে হবে। এরপর মাঝ বরাবর ১.৫-২ সেমি উল্লম্ব খাঁজ (Cleft split) কাটুন। কাণ্ড যেন কোনোভাবেই থেঁতলে না যায়।",
        warning: "ব্লেড অবশ্যই ৭০% আইসোপ্রোপাইল অ্যালকোহল বা গরম পানিতে ফুটিয়ে জীবাণুমুক্ত করে নিতে হবে, নতুবা ব্যাক্টেরিয়া বা ছত্রাক সংক্রমণে জোড় পচে যাবে।",
        svg: `
          <svg viewBox="0 0 460 300" class="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="cleft-pot-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#475569"/>
                <stop offset="100%" stop-color="#1e293b"/>
              </linearGradient>
              <linearGradient id="cleft-soil-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#854d0e"/>
                <stop offset="100%" stop-color="#451a03"/>
              </linearGradient>
              <linearGradient id="cleft-stem-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#15803d"/>
                <stop offset="35%" stop-color="#22c55e"/>
                <stop offset="70%" stop-color="#16a34a"/>
                <stop offset="100%" stop-color="#14532d"/>
              </linearGradient>
              <filter id="cleft-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur"/>
                <feComposite in="SourceGraphic" in2="blur" operator="over"/>
              </filter>
            </defs>
            <style>
              @keyframes bladeDown {
                0% { transform: translate(50px, -45px) rotate(-15deg); opacity: 0; }
                40% { opacity: 1; }
                70% { transform: translate(0px, 0px) rotate(0deg); opacity: 1; }
                100% { transform: translate(0px, 0px) rotate(0deg); opacity: 1; }
              }
              @keyframes cleftExpand {
                0%, 50% { stroke-width: 1.5; stroke: #22c55e; }
                100% { stroke-width: 4; stroke: #eab308; }
              }
              @keyframes sparkPulse {
                0%, 100% { opacity: 0.2; transform: scale(0.8); }
                50% { opacity: 1; transform: scale(1.3); }
              }
              .anim-blade { animation: bladeDown 2.2s cubic-bezier(0.2, 0.8, 0.3, 1) infinite alternate; transform-origin: 230px 125px; }
              .anim-cleft { animation: cleftExpand 2.2s ease-in-out infinite alternate; }
              .anim-spark { animation: sparkPulse 1.2s infinite ease-in-out; transform-origin: 230px 125px; }
            </style>

            <!-- Background & Ruler -->
            <rect width="460" height="300" rx="16" fill="#0f172a" />
            <line x1="40" y1="260" x2="420" y2="260" stroke="#334155" stroke-dasharray="4,4"/>

            <!-- Pot & Root System -->
            <path d="M 170 280 L 180 230 L 280 230 L 290 280 Z" fill="url(#cleft-pot-grad)" stroke="#64748b" stroke-width="2"/>
            <ellipse cx="230" cy="230" rx="50" ry="12" fill="url(#cleft-soil-grad)"/>
            <path d="M 230 235 Q 210 250 200 270 M 230 235 Q 245 255 260 275 M 230 240 Q 225 260 230 278" stroke="#fcd34d" stroke-width="2" stroke-linecap="round" opacity="0.6"/>

            <!-- Rootstock Stem -->
            <path d="M 230 230 L 230 125" stroke="url(#cleft-stem-grad)" stroke-width="18" stroke-linecap="butt"/>
            <ellipse cx="230" cy="125" rx="9" ry="4" fill="#86efac" stroke="#15803d" stroke-width="1.5"/>

            <!-- Vertical Cleft Slit (১.৫ সেমি ফাটল) -->
            <line x1="230" y1="125" x2="230" y2="155" class="anim-cleft" stroke-linecap="round"/>

            <!-- Biological Cambium Rings Indicator -->
            <ellipse cx="230" cy="125" rx="7" ry="3" fill="none" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="2,2"/>

            <!-- Grafting Razor Blade Animation -->
            <g class="anim-blade">
              <polygon points="230,123 310,95 315,110 235,138" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2"/>
              <rect x="310" y="90" width="55" height="25" rx="4" fill="#0284c7" stroke="#38bdf8" stroke-width="1.5"/>
              <text x="337" y="106" fill="#ffffff" font-size="9" font-weight="black" text-anchor="middle" font-family="'Noto Sans Bengali', sans-serif">স্টেরাইল ব্লেড</text>
            </g>

            <!-- Sparks / Cut Indicator -->
            <circle cx="230" cy="125" r="7" fill="#fde047" class="anim-spark" filter="url(#cleft-glow)"/>

            <!-- Measurement & Guides -->
            <line x1="248" y1="125" x2="275" y2="125" stroke="#38bdf8" stroke-width="1.5"/>
            <line x1="248" y1="155" x2="275" y2="155" stroke="#38bdf8" stroke-width="1.5"/>
            <line x1="270" y1="125" x2="270" y2="155" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="2,2"/>
            <text x="282" y="143" fill="#38bdf8" font-size="11" font-weight="bold" font-family="'Noto Sans Bengali', sans-serif">১.৫-২ সেমি ফাটল</text>

            <rect x="25" y="20" width="410" height="34" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
            <text x="230" y="42" fill="#34d399" font-size="13" font-weight="black" text-anchor="middle" font-family="'Noto Sans Bengali', sans-serif">
              ধাপ ১: সুস্থ রুটস্টকে মসৃণ অনুভূমিক কর্তন ও ১.৫ সেমি উল্লম্ব খাঁজ
            </text>
          </svg>
        `
      },
      {
        step: 2,
        title: "সায়নের কীলক বা চোখ তৈরি (Scion Preparation)",
        duration: "সময়কাল: কাটার সাথে সাথে",
        desc: "উন্নত ফলনশীল জাতের (যেমন হাইব্রিড টমেটো বা বারি বেগুন) ডাল থেকে প্রায় একই ব্যাসের সায়ন নিয়ে দুই পাশে ১.৫ সেমি লম্বা মসৃণ ছাঁট দিয়ে কীলক (Wedge) তৈরি করতে হবে।",
        warning: "সায়নের কাটা অংশে কখনোই হাত ছোঁয়ানো যাবে না; হাতের জীবাণু বা ঘাম টিস্যুর জোড়া লাগা নষ্ট করে দেয়।",
        svg: `
          <svg viewBox="0 0 460 300" class="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="scion-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#15803d"/>
                <stop offset="50%" stop-color="#22c55e"/>
                <stop offset="100%" stop-color="#16a34a"/>
              </linearGradient>
              <linearGradient id="wedge-wood" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#fef08a"/>
                <stop offset="100%" stop-color="#facc15"/>
              </linearGradient>
            </defs>
            <style>
              @keyframes knifeShaveL {
                0% { transform: translate(-30px, -20px) rotate(20deg); opacity: 0; }
                40% { opacity: 1; }
                80%, 100% { transform: translate(10px, 20px) rotate(15deg); opacity: 1; }
              }
              @keyframes cambiumPulseLine {
                0%, 100% { stroke: #22c55e; stroke-width: 2; }
                50% { stroke: #4ade80; stroke-width: 3.5; }
              }
              .anim-shave-l { animation: knifeShaveL 2s ease-in-out infinite alternate; }
              .anim-cambium-edge { animation: cambiumPulseLine 1.5s infinite; }
            </style>

            <rect width="460" height="300" rx="16" fill="#0f172a" />

            <!-- Scion Stem with Leaves -->
            <path d="M 230 50 L 230 180" stroke="url(#scion-grad)" stroke-width="16" stroke-linecap="round"/>
            <!-- Healthy upper foliage -->
            <path d="M 230 70 Q 180 40 160 65 Q 190 90 230 80" fill="#22c55e" stroke="#15803d" stroke-width="1.5"/>
            <path d="M 230 95 Q 280 65 300 90 Q 270 115 230 105" fill="#22c55e" stroke="#15803d" stroke-width="1.5"/>
            <path d="M 230 60 Q 210 20 230 10 Q 250 20 230 60" fill="#4ade80"/>

            <!-- Symmetrical V-Wedge (উভয়পাশে ১.৫ সেমি কীলক) -->
            <polygon points="222,180 238,180 230,225" fill="url(#wedge-wood)" stroke="#ca8a04" stroke-width="1.5"/>

            <!-- Exposed Active Cambium Lines on Wedge Edges -->
            <line x1="222" y1="180" x2="230" y2="225" class="anim-cambium-edge" stroke-linecap="round"/>
            <line x1="238" y1="180" x2="230" y2="225" class="anim-cambium-edge" stroke-linecap="round"/>

            <!-- Knife Peeling Action Illustration -->
            <g class="anim-shave-l">
              <polygon points="175,170 215,195 210,205 170,180" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1.5"/>
              <rect x="130" y="150" width="45" height="18" rx="3" fill="#0369a1"/>
            </g>

            <!-- Guide callouts -->
            <rect x="270" y="185" width="165" height="50" rx="8" fill="#1e293b" stroke="#22c55e" stroke-width="1.5"/>
            <text x="352" y="206" fill="#86efac" font-size="11" font-weight="black" text-anchor="middle" font-family="'Noto Sans Bengali', sans-serif">দ্বি-পার্শ্বীয় মসৃণ কীলক</text>
            <text x="352" y="224" fill="#cbd5e1" font-size="10" text-anchor="middle" font-family="'Noto Sans Bengali', sans-serif">উভয় পাশে ১.৫ সেমি ছাঁট</text>
            <path d="M 270 205 L 240 205" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="2,2"/>

            <rect x="25" y="20" width="410" height="34" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
            <text x="230" y="42" fill="#34d399" font-size="13" font-weight="black" text-anchor="middle" font-family="'Noto Sans Bengali', sans-serif">
              ধাপ ২: কাক্সিক্ষত সায়নের দুই পাশে ১.৫ সেমি মসৃণ কীলক তৈরি
            </text>
          </svg>
        `
      },
      {
        step: 3,
        title: "ক্যাম্বিয়াম স্তর সংযোগ (Cambium Alignment)",
        duration: "সময়কাল: অত্যন্ত দ্রুত ও সুনির্দিষ্ট",
        desc: "গ্রাফটিংয়ের আসল রহস্য হলো ক্যাম্বিয়াম লেয়ার মেলানো। রুটস্টকের ফাটলের ভেতরে সায়নের কীলক এমনভাবে ঢোকাতে হবে যাতে অন্তত এক পাশের সবুজ বাকলের নিচের সজীব কোষের স্তর সরাসরি পরস্পরের সংস্পর্শে আসে।",
        warning: "ক্যাম্বিয়াম লেয়ার ফাঁক থাকলে গাছ কখনো খাদ্য ও পানি পরিবহন করতে পারবে না এবং ২-৩ দিনে সায়ন শুকিয়ে যাবে।",
        svg: `
          <svg viewBox="0 0 460 300" class="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="cambium-glow-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#4ade80"/>
                <stop offset="100%" stop-color="#22c55e"/>
              </linearGradient>
            </defs>
            <style>
              @keyframes scionDock {
                0% { transform: translateY(-45px); }
                100% { transform: translateY(0px); }
              }
              @keyframes bioSignal {
                0%, 100% { stroke: #22c55e; stroke-width: 3; opacity: 0.6; }
                50% { stroke: #86efac; stroke-width: 6; opacity: 1; filter: drop-shadow(0 0 6px #22c55e); }
              }
              @keyframes loupePulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.03); }
              }
              .anim-dock { animation: scionDock 2.5s cubic-bezier(0.3, 0, 0.2, 1) infinite alternate; }
              .anim-signal { animation: bioSignal 1.2s infinite ease-in-out; }
              .anim-loupe { animation: loupePulse 2s infinite ease-in-out; transform-origin: 345px 150px; }
            </style>

            <rect width="460" height="300" rx="16" fill="#0f172a" />

            <!-- Main Stem Assembly -->
            <!-- Rootstock Bottom -->
            <path d="M 180 270 L 180 160" stroke="#15803d" stroke-width="20" stroke-linecap="butt"/>
            <!-- Rootstock Cleft Flaps -->
            <path d="M 170 160 L 170 195 M 190 160 L 190 195" stroke="#166534" stroke-width="2.5"/>

            <!-- Scion Docking Inside -->
            <g class="anim-dock">
              <path d="M 180 170 L 180 60" stroke="#22c55e" stroke-width="16" stroke-linecap="round"/>
              <polygon points="172,165 188,165 180,195" fill="#facc15"/>
              <path d="M 180 80 Q 140 60 130 80 Q 155 100 180 90" fill="#34d399"/>
              <path d="M 180 95 Q 220 75 230 95 Q 205 115 180 105" fill="#34d399"/>
            </g>

            <!-- Vascular Cambium Touching Line (Glowing alignment) -->
            <line x1="171" y1="150" x2="171" y2="190" class="anim-signal" stroke-linecap="round"/>

            <!-- High-Res Microscopic Loupe / Cross-Section Zoom View -->
            <g class="anim-loupe">
              <circle cx="345" cy="150" r="65" fill="#020617" stroke="#22c55e" stroke-width="3" filter="drop-shadow(0 0 10px rgba(34,197,94,0.4))"/>
              <text x="345" y="105" fill="#86efac" font-size="10" font-weight="black" text-anchor="middle" font-family="'Noto Sans Bengali', sans-serif">🔬 ক্যাম্বিয়াম ক্রস-সেকশন ভিউ</text>
              
              <!-- Rootstock tissue section -->
              <rect x="295" y="115" width="45" height="60" rx="3" fill="#14532d"/>
              <text x="317" y="145" fill="#86efac" font-size="9" text-anchor="middle">রুটস্টক</text>

              <!-- Scion tissue section -->
              <rect x="350" y="115" width="45" height="60" rx="3" fill="#166534"/>
              <text x="372" y="145" fill="#a7f3d0" font-size="9" text-anchor="middle">সায়ন</text>

              <!-- Active Touching Cambium Ring Cells -->
              <line x1="345" y1="115" x2="345" y2="175" stroke="#4ade80" stroke-width="5" stroke-dasharray="3,3" class="anim-signal"/>
              <circle cx="345" cy="145" r="5" fill="#86efac" class="anim-signal"/>

              <rect x="290" y="185" width="110" height="22" rx="6" fill="#16a34a"/>
              <text x="345" y="200" fill="#ffffff" font-size="10" font-weight="black" text-anchor="middle" font-family="'Noto Sans Bengali', sans-serif">✓ ১০০% সমান্তরাল স্পর্শ</text>
            </g>

            <!-- Connector arrow between joint and loupe -->
            <path d="M 175 168 Q 230 145 280 150" fill="none" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="3,3"/>

            <rect x="25" y="20" width="410" height="34" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
            <text x="230" y="42" fill="#34d399" font-size="13" font-weight="black" text-anchor="middle" font-family="'Noto Sans Bengali', sans-serif">
              ধাপ ৩: সায়ন ও রুটস্টকের ক্যাম্বিয়াম স্তরের নিখুঁত সংযোগ
            </text>
          </svg>
        `
      },
      {
        step: 4,
        title: "প্যারাফিল্ম বন্ধন ও গ্রাফটিং ক্লিপিং (Clip & Tight Seal)",
        duration: "সময়কাল: সংযোগের সাথে সাথে",
        desc: "সংযোগস্থলে সিলিকন গ্রাফটিং ক্লিপ শক্তভাবে বসাতে হবে অথবা প্যারাফিল্ম / বাডিং টেপ দিয়ে নিচ থেকে উপরে বৃত্তাকারে বায়ুরোধীভাবে পেঁচিয়ে বাঁধতে হবে, যাতে বাতাস ও পানি প্রবেশ না করে।",
        warning: "অতিরিক্ত জোরে বাঁধবেন না যাতে কাণ্ড থেঁতলে যায়, আবার ঢিলে রাখবেন না যাতে নড়াচড়া করে।",
        svg: `
          <svg viewBox="0 0 460 300" class="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
            <style>
              @keyframes tapeSpiral {
                0% { stroke-dashoffset: 200; opacity: 0; }
                50% { opacity: 0.9; }
                100% { stroke-dashoffset: 0; opacity: 0.9; }
              }
              @keyframes clipSnapMotion {
                0% { transform: scale(1.3); opacity: 0; }
                70% { transform: scale(0.96); opacity: 1; }
                100% { transform: scale(1); opacity: 1; }
              }
              .anim-tape { stroke-dasharray: 200; animation: tapeSpiral 2.5s ease-out infinite alternate; }
              .anim-clip { animation: clipSnapMotion 2.2s cubic-bezier(0.2, 0.9, 0.3, 1) infinite alternate; transform-origin: 230px 165px; }
            </style>

            <rect width="460" height="300" rx="16" fill="#0f172a" />

            <!-- Grafted Stems -->
            <path d="M 230 270 L 230 165" stroke="#15803d" stroke-width="18"/>
            <path d="M 230 165 L 230 70" stroke="#22c55e" stroke-width="15"/>

            <!-- Transparent Parafilm Tape Spiral Layers -->
            <path d="M 218 185 Q 230 178 242 185 Q 230 170 218 175 Q 230 160 242 165 Q 230 150 218 155 Q 230 142 242 147" 
                  fill="none" stroke="#bae6fd" stroke-width="6" opacity="0.8" class="anim-tape" stroke-linecap="round"/>

            <!-- Medical/Silicone Grafting Spring Clip -->
            <g class="anim-clip">
              <!-- Clip Body -->
              <rect x="206" y="145" width="48" height="42" rx="8" fill="#e11d48" stroke="#be123c" stroke-width="2.5" filter="drop-shadow(0 4px 8px rgba(225,29,72,0.4))"/>
              <!-- Spring Mechanism & Jaws -->
              <circle cx="216" cy="166" r="4" fill="#ffffff"/>
              <circle cx="244" cy="166" r="4" fill="#ffffff"/>
              <path d="M 212 156 Q 230 164 248 156" fill="none" stroke="#ffffff" stroke-width="2"/>
              <path d="M 212 176 Q 230 184 248 176" fill="none" stroke="#ffffff" stroke-width="2"/>
            </g>

            <!-- Quality Badges -->
            <g transform="translate(60, 140)">
              <rect width="120" height="48" rx="8" fill="#1e293b" stroke="#e11d48" stroke-width="1.5"/>
              <text x="60" y="22" fill="#fda4af" font-size="11" font-weight="black" text-anchor="middle" font-family="'Noto Sans Bengali', sans-serif">সিলিকন ক্লিপ লক</text>
              <text x="60" y="38" fill="#cbd5e1" font-size="9" text-anchor="middle" font-family="'Noto Sans Bengali', sans-serif">স্প্রিং টেনশন গ্রিপ</text>
              <line x1="120" y1="24" x2="206" y2="160" stroke="#e11d48" stroke-width="1.5" stroke-dasharray="2,2"/>
            </g>

            <g transform="translate(280, 140)">
              <rect width="130" height="48" rx="8" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5"/>
              <text x="65" y="22" fill="#7dd3fc" font-size="11" font-weight="black" text-anchor="middle" font-family="'Noto Sans Bengali', sans-serif">বায়ুরোধী প্যারাফিল্ম</text>
              <text x="65" y="38" fill="#cbd5e1" font-size="9" text-anchor="middle" font-family="'Noto Sans Bengali', sans-serif">আর্দ্রতারোধী ১০০% সিল</text>
              <line x1="0" y1="24" x2="-25" y2="24" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="2,2"/>
            </g>

            <rect x="25" y="20" width="410" height="34" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
            <text x="230" y="42" fill="#34d399" font-size="13" font-weight="black" text-anchor="middle" font-family="'Noto Sans Bengali', sans-serif">
              ধাপ ৪: বিশেষ গ্রাফটিং ক্লিপ ও বায়ুরোধী প্যারাফিল্ম লক
            </text>
          </svg>
        `
      },
      {
        step: 5,
        title: "হিলিং চেম্বার ও নিবিড় নার্সিং (Healing & Hardening)",
        duration: "সময়কাল: ৪ - ৬ দিন চেম্বারে, ৩ দিন হার্ডেনিং",
        desc: "কলম করা চারা স্বচ্ছ পলিথিনের হিলিং চেম্বারে রাখতে হবে যেখানে আর্দ্রতা ৮৫-৯৫% এবং তাপমাত্রা ২৫-২৮° সেলসিয়াস থাকবে। ৪ দিন অন্ধকার রাখার পর ধীরে ধীরে সকালের হালকা রোদে এনে মূল ক্ষেতে রোপণ করতে হবে।",
        warning: "চেম্বার থেকে বের করেই কড়া দুপুরে সরাসরি রোদে দেবেন না; প্রথমে ২ দিন ছায়ায় রেখে শক্ত (Hardening) করতে হবে।",
        svg: `
          <svg viewBox="0 0 460 300" class="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
            <style>
              @keyframes humidityPulse {
                0%, 100% { opacity: 0.15; transform: scaleY(0.98); }
                50% { opacity: 0.28; transform: scaleY(1.02); }
              }
              @keyframes dropletFall {
                0% { transform: translateY(0); opacity: 0.8; }
                100% { transform: translateY(30px); opacity: 0.1; }
              }
              @keyframes sapSurge {
                0% { stroke-dashoffset: 80; }
                100% { stroke-dashoffset: 0; }
              }
              @keyframes shootBloom {
                0% { transform: scale(0.6) rotate(-8deg); opacity: 0.6; }
                100% { transform: scale(1.1) rotate(0deg); opacity: 1; }
              }
              .anim-dome { animation: humidityPulse 3s infinite ease-in-out; transform-origin: 230px 280px; }
              .anim-drop-1 { animation: dropletFall 2.2s infinite linear; }
              .anim-drop-2 { animation: dropletFall 2.8s infinite linear 0.7s; }
              .anim-sap { stroke-dasharray: 10, 14; animation: sapSurge 1.4s infinite linear; }
              .anim-shoot { animation: shootBloom 2s infinite alternate ease-in-out; transform-origin: 230px 90px; }
            </style>

            <rect width="460" height="300" rx="16" fill="#0f172a" />

            <!-- Healing Moisture Dome / Chamber Structure -->
            <path d="M 110 275 L 110 110 Q 230 40 350 110 L 350 275 Z" fill="#0284c7" class="anim-dome" stroke="#38bdf8" stroke-width="2.5" stroke-dasharray="6,4"/>

            <!-- Condensation Droplets -->
            <circle cx="150" cy="120" r="3.5" fill="#bae6fd" class="anim-drop-1"/>
            <circle cx="310" cy="110" r="3" fill="#bae6fd" class="anim-drop-2"/>
            <circle cx="170" cy="170" r="2.5" fill="#bae6fd" class="anim-drop-2"/>
            <circle cx="290" cy="180" r="3" fill="#bae6fd" class="anim-drop-1"/>

            <!-- Grafted Plant inside -->
            <path d="M 230 275 L 230 160" stroke="#15803d" stroke-width="18"/>
            <rect x="216" y="145" width="28" height="25" rx="4" fill="#e11d48"/>
            <path d="M 230 145 L 230 90" stroke="#22c55e" stroke-width="14"/>

            <!-- Bioluminescent Nutrient & Water Sap Flow Surge -->
            <path d="M 230 275 L 230 90" fill="none" stroke="#67e8f9" stroke-width="4" class="anim-sap" stroke-linecap="round"/>

            <!-- Newly Sprouted Vigorous Shoot -->
            <g class="anim-shoot">
              <path d="M 230 90 Q 260 60 280 68 Q 260 95 230 90" fill="#4ade80" stroke="#16a34a" stroke-width="1.5"/>
              <path d="M 230 85 Q 200 55 180 63 Q 200 90 230 85" fill="#4ade80" stroke="#16a34a" stroke-width="1.5"/>
              <circle cx="230" cy="72" r="5" fill="#86efac"/>
            </g>

            <!-- Digital Telemetry Dashboard -->
            <g transform="translate(145, 230)">
              <rect width="170" height="34" rx="10" fill="#0369a1" stroke="#7dd3fc" stroke-width="1.5"/>
              <text x="85" y="21" fill="#ffffff" font-size="11" font-weight="black" text-anchor="middle" font-family="'Noto Sans Bengali', sans-serif">
                💧 আর্দ্রতা: ৯৫% | 🌡️ ২৬°C
              </text>
            </g>

            <rect x="25" y="20" width="410" height="34" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
            <text x="230" y="42" fill="#34d399" font-size="13" font-weight="black" text-anchor="middle" font-family="'Noto Sans Bengali', sans-serif">
              ধাপ ৫: হিলিং চেম্বারে সফল কোষ সংযোগ ও নতুন পাতার স্ফুরণ
            </text>
          </svg>
        `
      }
    ]
  },

  // ------------------------------------------------------------------
  // 2. গুটি কলম (Air Layering / Marcotting - পেয়ারা, লেবু ও স্থলপদ্ম)
  // ------------------------------------------------------------------
  air: {
    key: 'air',
    name: 'গুটি কলম (Air Layering)',
    subtitle: 'পেয়ারা, লেবু, ডালিম ও স্থলপদ্ম (Land Lotus) এর দ্রুত শিকড় বিস্তার',
    plantBadge: '🍐 পেয়ারা, ডালিম ও স্থলপদ্ম',
    season: 'আষাঢ় - শ্রাবণ (বর্ষাকাল)',
    successRate: '৯৮%',
    steps: [
      {
        step: 1,
        title: "ডাল নির্বাচন ও বলয়াকারে বাকল কর্তন (Girdling)",
        duration: "সময়কাল: কলমের শুরুতে",
        desc: "মাতৃগাছের ১ বছর বয়সী পেন্সিলের মতো মোটা রোদযুক্ত ডাল নির্বাচন করুন। ধারালো ছুরি দিয়ে ৩-৪ সেমি ব্যবধানে দুটি বৃত্তাকার খাঁজ কেটে মাঝের বাকল সম্পূর্ণ তুলে ফেলুন এবং পিচ্ছিল সবুজ ক্যাম্বিয়াম স্তর ভালো করে চেঁছে দিন।",
        warning: "ক্যাম্বিয়াম স্তর না চাঁচলে গাছ আবার বাকল জোড়া লাগিয়ে ফেলবে এবং শিকড় গজাবে না।",
        svg: `
          <svg viewBox="0 0 460 300" class="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
            <style>
              @keyframes peelGirdle {
                0% { stroke-dashoffset: 40; opacity: 0.3; }
                100% { stroke-dashoffset: 0; opacity: 1; }
              }
              .anim-peel { stroke-dasharray: 40; animation: peelGirdle 2s infinite alternate ease-in-out; }
            </style>
            <rect width="460" height="300" rx="16" fill="#0f172a" />
            <!-- Main Branch -->
            <path d="M 60 150 L 400 150" stroke="#78350f" stroke-width="22" stroke-linecap="round"/>
            <path d="M 60 150 L 400 150" stroke="#92400e" stroke-width="18" stroke-linecap="round"/>
            <!-- Girdled Wood Region (৩-৪ সেমি বাকল কাটা) -->
            <rect x="200" y="141" width="60" height="18" fill="#fef08a" stroke="#ca8a04" stroke-width="1.5"/>
            <!-- Cut marks -->
            <line x1="200" y1="135" x2="200" y2="165" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/>
            <line x1="260" y1="135" x2="260" y2="165" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/>
            <!-- Knife -->
            <polygon points="195,120 230,138 220,145 185,125" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1.5"/>
            <rect x="150" y="105" width="45" height="16" rx="3" fill="#0284c7"/>
            <!-- Indicator -->
            <text x="230" y="190" fill="#fef08a" font-size="12" font-weight="black" text-anchor="middle" font-family="'Noto Sans Bengali', sans-serif">
              ৩-৪ সেমি গোল বাকল কর্তন ও ক্যাম্বিয়াম ছাঁচন
            </text>
            <rect x="25" y="20" width="410" height="34" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
            <text x="230" y="42" fill="#34d399" font-size="13" font-weight="black" text-anchor="middle" font-family="'Noto Sans Bengali', sans-serif">
              ধাপ ১: ১ বছর বয়সী ডালে ৩-৪ সেমি বলয়াকারে বাকল কর্তন
            </text>
          </svg>
        `
      },
      {
        step: 2,
        title: "রুটিং হরমোন লেপন ও শুকানো (IBA Application)",
        duration: "সময়কাল: বাকল কাটার পরপর",
        desc: "কাটা অংশের ওপরের প্রান্তে (যেখান থেকে শিকড় জন্মাবে) ইন্ডোল বিউটারিক এসিড (IBA 1000-2000 ppm) বা প্রাকৃতিক অ্যালোভেরা জেল ও দারুচিনির গুঁড়া মেখে ৫ মিনিট শুকিয়ে নিতে হবে।",
        warning: "অতিরিক্ত মাত্রায় রাসায়নিক হরমোন দিলে ডালের টিস্যু পুড়ে মারা যেতে পারে।",
        svg: `
          <svg viewBox="0 0 460 300" class="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
            <style>
              @keyframes hormonePulse {
                0%, 100% { filter: drop-shadow(0 0 2px #facc15); opacity: 0.7; }
                50% { filter: drop-shadow(0 0 8px #facc15); opacity: 1; }
              }
              .anim-hormone { animation: hormonePulse 1.5s infinite; }
            </style>
            <rect width="460" height="300" rx="16" fill="#0f172a" />
            <path d="M 60 150 L 400 150" stroke="#78350f" stroke-width="22" stroke-linecap="round"/>
            <rect x="200" y="141" width="60" height="18" fill="#fef08a"/>
            <!-- Glowing Hormone Layer on upper cut edge -->
            <rect x="196" y="138" width="10" height="24" rx="3" fill="#facc15" class="anim-hormone"/>
            <!-- Brush applying paste -->
            <polygon points="180,105 200,135 190,140 170,110" fill="#b45309"/>
            <rect x="135" y="80" width="55" height="14" rx="3" fill="#d97706" transform="rotate(-30 135 80)"/>
            <text x="200" y="195" fill="#fde047" font-size="12" font-weight="black" text-anchor="middle" font-family="'Noto Sans Bengali', sans-serif">
              🧪 রুটিং হরমোন (IBA) বা অ্যালোভেরা লেপন
            </text>
            <rect x="25" y="20" width="410" height="34" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
            <text x="230" y="42" fill="#34d399" font-size="13" font-weight="black" text-anchor="middle" font-family="'Noto Sans Bengali', sans-serif">
              ধাপ ২: ওপরের কাটা প্রান্তে রুটিং হরমোন প্রয়োগ
            </text>
          </svg>
        `
      },
      {
        step: 3,
        title: "দোআঁশ মাটি ও পচা গোবরের বল তৈরি (Soil Ball)",
        duration: "সময়কাল: হরমোন শুকানোর পর",
        desc: "৫০% দোআঁশ বা এঁটেল দোআঁশ মাটি এবং ৫০% ভালোভাবে পচা গোবর সার বা ভার্মিকম্পোস্ট সামান্য পানি দিয়ে ময়ান করে একটি আর্দ্র বল তৈরি করে ক্ষতস্থানের চারপাশে সমানভাবে চেপে বসিয়ে দিন।",
        warning: "মাটিতে অতিরিক্ত পানি দেবেন না যাতে কাদা গড়িয়ে পড়ে; আবার মাটি যেন শুকনো না থাকে।",
        svg: `
          <svg viewBox="0 0 460 300" class="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
            <rect width="460" height="300" rx="16" fill="#0f172a" />
            <path d="M 60 150 L 400 150" stroke="#78350f" stroke-width="22" stroke-linecap="round"/>
            <!-- Moist Soil Compost Ball Surrounding Girdle -->
            <ellipse cx="230" cy="150" rx="45" ry="38" fill="#713f12" stroke="#a16207" stroke-width="3"/>
            <ellipse cx="230" cy="150" rx="40" ry="32" fill="#451a03"/>
            <!-- Texture Dots -->
            <circle cx="215" cy="140" r="3" fill="#ca8a04"/>
            <circle cx="245" cy="155" r="2.5" fill="#ca8a04"/>
            <circle cx="225" cy="165" r="3" fill="#ca8a04"/>
            <text x="230" y="220" fill="#fef08a" font-size="12" font-weight="black" text-anchor="middle" font-family="'Noto Sans Bengali', sans-serif">
              ৫০% দোআঁশ মাটি + ৫০% পচা গোবর
            </text>
            <rect x="25" y="20" width="410" height="34" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
            <text x="230" y="42" fill="#34d399" font-size="13" font-weight="black" text-anchor="middle" font-family="'Noto Sans Bengali', sans-serif">
              ধাপ ৩: পুষ্টিকর আর্দ্র মাটির বল স্থাপন
            </text>
          </svg>
        `
      },
      {
        step: 4,
        title: "স্বচ্ছ পলিথিন মোড়ানো ও বায়ুরোধী বন্ধন (Airtight Wrap)",
        duration: "সময়কাল: বল বসানোর সাথে সাথে",
        desc: "মাটির বলটিকে স্বচ্ছ পলিথিন দিয়ে বায়ুরোধীভাবে পেঁচিয়ে ওপর ও নিচের উভয় মাথা সুতলি বা তার দিয়ে শক্ত করে বেঁধে দিতে হবে যাতে বৃষ্টির পানি বা বাতাস ঢুকতে না পারে।",
        warning: "স্বচ্ছ পলিথিন ব্যবহার করুন যাতে শিকড় গজানোর অগ্রগতি বাইরে থেকেই দেখা যায়।",
        svg: `
          <svg viewBox="0 0 460 300" class="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
            <rect width="460" height="300" rx="16" fill="#0f172a" />
            <path d="M 60 150 L 400 150" stroke="#78350f" stroke-width="22" stroke-linecap="round"/>
            <ellipse cx="230" cy="150" rx="46" ry="38" fill="#451a03"/>
            <!-- Clear Polyethylene wrap with highlight sheen -->
            <ellipse cx="230" cy="150" rx="48" ry="40" fill="#38bdf8" fill-opacity="0.25" stroke="#7dd3fc" stroke-width="2.5"/>
            <!-- Tight Twine Ties on Both Ends -->
            <rect x="180" y="132" width="10" height="36" rx="3" fill="#ea580c" stroke="#fff" stroke-width="1"/>
            <rect x="270" y="132" width="10" height="36" rx="3" fill="#ea580c" stroke="#fff" stroke-width="1"/>
            <text x="230" y="225" fill="#bae6fd" font-size="12" font-weight="black" text-anchor="middle" font-family="'Noto Sans Bengali', sans-serif">
              পলিথিন দিয়ে বায়ুরোধী সিল ও দুই মাথায় শক্ত গিঁট
            </text>
            <rect x="25" y="20" width="410" height="34" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
            <text x="230" y="42" fill="#34d399" font-size="13" font-weight="black" text-anchor="middle" font-family="'Noto Sans Bengali', sans-serif">
              ধাপ ৪: স্বচ্ছ পলিথিন মোড়ানো ও দুই মুখে বায়ুরোধী বন্ধন
            </text>
          </svg>
        `
      },
      {
        step: 5,
        title: "শিকড়ের ঘন জাল তৈরি ও মূল গাছ থেকে কর্তন (Root Formation)",
        duration: "সময়কাল: ৩৫ - ৪৫ দিন পর",
        desc: "৩৫-৪০ দিন পর পলিথিনের ভেতর দিয়ে অসংখ্য বাদামী ও সাদা শিকড়ের ঘন জাল দেখা যাবে। তখন গুটির ঠিক নিচ দিয়ে ধারালো করাত দিয়ে কেটে ছায়াযুক্ত স্থানে টবে লাগাতে হবে।",
        warning: "গাছ কাটার সাথে সাথে কড়া রোদে রোপণ করবেন না; অন্তত ১৫ দিন নার্সারি শেডে রাখুন।",
        svg: `
          <svg viewBox="0 0 460 300" class="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
            <style>
              @keyframes rootGlow {
                0%, 100% { stroke: #f8fafc; stroke-width: 2.5; }
                50% { stroke: #facc15; stroke-width: 3.5; }
              }
              .anim-root { animation: rootGlow 2s infinite ease-in-out; }
            </style>
            <rect width="460" height="300" rx="16" fill="#0f172a" />
            <path d="M 60 150 L 400 150" stroke="#78350f" stroke-width="22" stroke-linecap="round"/>
            <ellipse cx="230" cy="150" rx="48" ry="40" fill="#451a03" stroke="#7dd3fc" stroke-width="2"/>
            <!-- Dense Root Network Radiating Through Mud Ball -->
            <path d="M 200 145 Q 180 130 160 140 M 200 155 Q 170 170 150 160 M 230 135 Q 240 110 255 105 M 240 165 Q 260 190 280 185 M 220 160 Q 210 185 205 200" 
                  fill="none" class="anim-root" stroke-linecap="round"/>
            <!-- Cut Line Indicator -->
            <line x1="165" y1="125" x2="165" y2="175" stroke="#ef4444" stroke-width="3" stroke-dasharray="4,4"/>
            <text x="145" y="115" fill="#f87171" font-size="10" font-weight="black">✂️ কাটিং পয়েন্ট</text>
            <text x="280" y="230" fill="#4ade80" font-size="12" font-weight="black" text-anchor="middle" font-family="'Noto Sans Bengali', sans-serif">
              🎉 ৩৫ দিনে শিকড়ের ঘন জাল তৈরি
            </text>
            <rect x="25" y="20" width="410" height="34" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
            <text x="230" y="42" fill="#34d399" font-size="13" font-weight="black" text-anchor="middle" font-family="'Noto Sans Bengali', sans-serif">
              ধাপ ৫: শিকড়ের পূর্ণ বিকাশ ও মূল গাছ থেকে আলাদা করণ
            </text>
          </svg>
        `
      }
    ]
  },

  // ------------------------------------------------------------------
  // 3. চোখ কলম (T-Budding / Shield Budding - লেবু, মাল্টা ও গোলাপ)
  // ------------------------------------------------------------------
  bud: {
    key: 'bud',
    name: 'চোখ কলম (T-Budding)',
    subtitle: 'কাগজি লেবু, বারি মাল্টা-১ ও গোলাপের আন্তর্জাতিক চোখ কলম',
    plantBadge: '🍋 লেবু ও মাল্টা',
    season: 'বৈশাখ - আষাঢ় ও কার্তিক',
    successRate: '৯২%',
    steps: [
      {
        step: 1,
        title: "রুটস্টকে 'T' আকৃতির মসৃণ খাঁজ তৈরি (T-Incision)",
        duration: "সময়কাল: কলমের প্রারম্ভে",
        desc: "সুস্থ রুটস্টকের কাণ্ডে মাটির ১০-১৫ সেমি ওপরে একটি অনুভূমিক (১.৫ সেমি) এবং একটি উল্লম্ব (২.৫-৩ সেমি) খাঁজ কেটে ইংরেজি 'T' আকৃতি তৈরি করুন। ছুরির ভোঁতা মাথা দিয়ে ছালের দুই কপাটিকা আলতো করে ফাঁক করুন।",
        warning: "কাঠ যেন কেটে না যায়; কেবল বাইরের বাকল বা ছালটি আলাদা করতে হবে।",
        svg: `
          <svg viewBox="0 0 460 300" class="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
            <rect width="460" height="300" rx="16" fill="#0f172a" />
            <!-- Rootstock Trunk -->
            <path d="M 230 270 L 230 60" stroke="#15803d" stroke-width="32" stroke-linecap="round"/>
            <!-- T-Cut Flaps (English 'T') -->
            <line x1="216" y1="130" x2="244" y2="130" stroke="#facc15" stroke-width="3.5" stroke-linecap="round"/>
            <line x1="230" y1="130" x2="230" y2="185" stroke="#facc15" stroke-width="3.5" stroke-linecap="round"/>
            <!-- Flap Peel effect -->
            <polygon points="220,135 230,135 224,165" fill="#86efac" opacity="0.8"/>
            <polygon points="240,135 230,135 236,165" fill="#86efac" opacity="0.8"/>
            <text x="230" y="225" fill="#fde047" font-size="12" font-weight="black" text-anchor="middle" font-family="'Noto Sans Bengali', sans-serif">
              রুটস্টকের বাকলে 'T' আকৃতির খাঁজ ও কপাটিকা উন্মোচন
            </text>
            <rect x="25" y="20" width="410" height="34" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
            <text x="230" y="42" fill="#34d399" font-size="13" font-weight="black" text-anchor="middle" font-family="'Noto Sans Bengali', sans-serif">
              ধাপ ১: রুটস্টকের বাকলে মসৃণ 'T' খাঁজ তৈরি
            </text>
          </svg>
        `
      },
      {
        step: 2,
        title: "সায়ন ডাল থেকে অক্ষত কুঁড়ি বা চোখ সংগ্রহ (Shield Bud)",
        duration: "সময়কাল: খাঁজ কাটার সাথে সাথে",
        desc: "উন্নত জাতের ডাল থেকে পাতার বোঁটাসহ ঢাল (Shield) আকৃতির একটি স্বাস্থ্যবান কুঁড়ি বা চোখ ধারালো ব্লেড দিয়ে মসৃণভাবে কেটে তুলে আনুন। বোঁটাটি কুঁড়ির সুরক্ষার হাতল হিসেবে কাজ করবে।",
        warning: "কুঁড়ির পেছনের কাঠের অংশ অতিরিক্ত মোটা রাখবেন না; পাতলা বাকলসহ চোখ তুলবেন।",
        svg: `
          <svg viewBox="0 0 460 300" class="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
            <rect width="460" height="300" rx="16" fill="#0f172a" />
            <!-- Scion branch -->
            <path d="M 160 250 L 160 70" stroke="#16a34a" stroke-width="18" stroke-linecap="round"/>
            <!-- Shield Bud Slice -->
            <g transform="translate(100, 20)">
              <ellipse cx="200" cy="130" rx="14" ry="28" fill="#86efac" stroke="#22c55e" stroke-width="2"/>
              <!-- Eye / Bud Center -->
              <circle cx="200" cy="125" r="5" fill="#15803d"/>
              <path d="M 200 130 L 225 145" stroke="#15803d" stroke-width="3" stroke-linecap="round"/>
              <text x="200" y="180" fill="#fde047" font-size="11" font-weight="black" text-anchor="middle" font-family="'Noto Sans Bengali', sans-serif">সায়নের অক্ষত চোখ ও বোঁটা</text>
            </g>
            <rect x="25" y="20" width="410" height="34" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
            <text x="230" y="42" fill="#34d399" font-size="13" font-weight="black" text-anchor="middle" font-family="'Noto Sans Bengali', sans-serif">
              ধাপ ২: বোঁটাসহ সজীব সায়ন কুঁড়ি (Shield Bud) সংগ্রহ
            </text>
          </svg>
        `
      },
      {
        step: 3,
        title: "T-পকেটে কুঁড়ি স্থাপন ও ক্যাম্বিয়াম স্পর্শ (Insertion)",
        duration: "সময়কাল: অতি দ্রুত",
        desc: "কুঁড়িটিকে রুটস্টকের T-খাঁজের ভেতর ওপর থেকে নিচে সাবধানে ঢুকিয়ে দিন যাতে কুঁড়ির ক্যাম্বিয়াম স্তর সরাসরি রুটস্টকের জীবন্ত কাঠের সংস্পর্শে দৃঢ়ভাবে বসে যায়।",
        warning: "চোখ যেন উল্টো দিকে (নিচমুখী) না বসে; কুঁড়ির ডগা অবশ্যই ওপরের দিকে থাকবে।",
        svg: `
          <svg viewBox="0 0 460 300" class="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
            <rect width="460" height="300" rx="16" fill="#0f172a" />
            <path d="M 230 270 L 230 60" stroke="#15803d" stroke-width="32" stroke-linecap="round"/>
            <!-- Bud inserted inside the T slot -->
            <rect x="222" y="140" width="16" height="36" rx="6" fill="#86efac" stroke="#22c55e" stroke-width="2"/>
            <circle cx="230" cy="155" r="4.5" fill="#15803d"/>
            <text x="230" y="225" fill="#4ade80" font-size="12" font-weight="black" text-anchor="middle" font-family="'Noto Sans Bengali', sans-serif">
              ✓ কুঁড়ির ক্যাম্বিয়াম রুটস্টকের কাঠে নিখুঁতভাবে বসল
            </text>
            <rect x="25" y="20" width="410" height="34" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
            <text x="230" y="42" fill="#34d399" font-size="13" font-weight="black" text-anchor="middle" font-family="'Noto Sans Bengali', sans-serif">
              ধাপ ৩: T-পকেটের ভেতর কুঁড়ি স্থাপন
            </text>
          </svg>
        `
      },
      {
        step: 4,
        title: "চোখ উন্মুক্ত রেখে বাডিং টেপ বন্ধন (Tape Wrap, Eye Free)",
        duration: "সময়কাল: স্থাপনের সাথে সাথে",
        desc: "কুঁড়ির চোখের অংশটুকু খোলা রেখে ওপর ও নিচে বাডিং টেপ দিয়ে বায়ুরোধীভাবে পেঁচিয়ে বাঁধতে হবে। চোখ যেন কোনোভাবেই টেপে ঢাকা না পড়ে।",
        warning: "চোখের ওপর টেপ পেঁচালে কুঁড়ি শ্বাস না পেয়ে পচে নষ্ট হয়ে যাবে।",
        svg: `
          <svg viewBox="0 0 460 300" class="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
            <rect width="460" height="300" rx="16" fill="#0f172a" />
            <path d="M 230 270 L 230 60" stroke="#15803d" stroke-width="32" stroke-linecap="round"/>
            <!-- Budding Tape Wrapped Above & Below the Eye -->
            <rect x="210" y="125" width="40" height="20" rx="3" fill="#bae6fd" opacity="0.8" stroke="#38bdf8"/>
            <rect x="210" y="165" width="40" height="25" rx="3" fill="#bae6fd" opacity="0.8" stroke="#38bdf8"/>
            <!-- Exposed Bud Eye in Middle -->
            <circle cx="230" cy="155" r="5" fill="#4ade80" stroke="#15803d" stroke-width="2"/>
            <text x="230" y="225" fill="#fde047" font-size="12" font-weight="black" text-anchor="middle" font-family="'Noto Sans Bengali', sans-serif">
              কুঁড়ির চোখ উন্মুক্ত রেখে বায়ুরোধী টেপ বন্ধন
            </text>
            <rect x="25" y="20" width="410" height="34" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
            <text x="230" y="42" fill="#34d399" font-size="13" font-weight="black" text-anchor="middle" font-family="'Noto Sans Bengali', sans-serif">
              ধাপ ৪: চোখ খোলা রেখে বাডিং টেপ পেঁচানো
            </text>
          </svg>
        `
      },
      {
        step: 5,
        title: "কুঁড়ির স্ফুরণ ও নতুন ডাল বিকাশ (Bud Burst & Shoot)",
        duration: "সময়কাল: ১৫ - ২১ দিন পর",
        desc: "১৫-২০ দিনের মধ্যে পাতার বোঁটা খসে পড়বে এবং চোখ ফুটে নতুন শক্তিশালী ডাল বের হবে। নতুন ডাল ৫-৭ সেমি বড় হলে রুটস্টকের ওপরের অংশ কেটে ফেলতে হবে।",
        warning: "রুটস্টকের নিচ থেকে কোনো বুনো কুশি বের হলে সাথে সাথে ভেঙে ফেলুন।",
        svg: `
          <svg viewBox="0 0 460 300" class="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
            <rect width="460" height="300" rx="16" fill="#0f172a" />
            <path d="M 230 270 L 230 110" stroke="#15803d" stroke-width="32" stroke-linecap="round"/>
            <!-- Pruned Rootstock Top -->
            <line x1="210" y1="110" x2="250" y2="110" stroke="#ef4444" stroke-width="3"/>
            <!-- New Vigorous Shoot Bursting from Bud -->
            <path d="M 230 155 Q 280 140 310 110" stroke="#22c55e" stroke-width="10" stroke-linecap="round"/>
            <path d="M 310 110 Q 330 90 350 100 Q 330 120 310 110" fill="#4ade80"/>
            <text x="230" y="235" fill="#4ade80" font-size="12" font-weight="black" text-anchor="middle" font-family="'Noto Sans Bengali', sans-serif">
              🎉 ২০ দিনে চোখ ফুটে নতুন সতেজ ডাল বিস্তার
            </text>
            <rect x="25" y="20" width="410" height="34" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
            <text x="230" y="42" fill="#34d399" font-size="13" font-weight="black" text-anchor="middle" font-family="'Noto Sans Bengali', sans-serif">
              ধাপ ৫: কুঁড়ির স্ফুরণ ও উন্নত জাতের ডাল তৈরি
            </text>
          </svg>
        `
      }
    ]
  },

  // ------------------------------------------------------------------
  // 4. পদ্ম ও স্থলপদ্ম কলম (Lotus Tuber Division & Hibiscus Cutting)
  // ------------------------------------------------------------------
  lotus: {
    key: 'lotus',
    name: 'পদ্ম ও স্থলপদ্ম কলম (Lotus & Land Lotus)',
    subtitle: 'পানির পদ্ম কন্দ বিভাজন ও স্থলপদ্ম (মাটির পদ্ম) এর শাখা কলম প্রযুক্তি',
    plantBadge: '🪷 পদ্ম ও স্থলপদ্ম',
    season: 'মাঘ - চৈত্র (বসন্ত) ও আষাঢ় - শ্রাবণ (বর্ষা)',
    successRate: '৯৫%',
    steps: [
      {
        step: 1,
        title: "পরিপক্ব সুপ্ত কন্দ ও অক্ষত অগ্রমুকুল নির্বাচন (Tuber Selection)",
        duration: "সময়কাল: বসন্তের শুরুতে (ফেব্রুয়ারি - এপ্রিল)",
        desc: "পানির পদ্ম (Nelumbo nucifera) চাষে সুপ্তাবস্থা শেষে কন্দ তুলে কমপক্ষে ২-৩টি সুস্থ অক্ষত পর্ব (nodes) এবং একটি সতেজ অগ্রমুকুল বা বর্ধনশীল চোখ (Growing Tip) সহ কন্দ নির্বাচন করতে হবে। স্থলপদ্মের ক্ষেত্রে ১ বছর বয়সী পেন্সিল সমান ডাল বাছাই করুন।",
        warning: "পদ্মের কন্দের অগ্রমুকুল অত্যন্ত ভঙ্গুর; এটি ভেঙে গেলে পুরো কন্দটি পচে মারা যাবে।",
        svg: `
          <svg viewBox="0 0 460 300" class="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
            <style>
              @keyframes eyeGlow {
                0%, 100% { stroke: #22c55e; stroke-width: 2; opacity: 0.7; }
                50% { stroke: #86efac; stroke-width: 4; opacity: 1; filter: drop-shadow(0 0 8px #22c55e); }
              }
              .anim-eye { animation: eyeGlow 1.5s infinite; }
            </style>
            <rect width="460" height="300" rx="16" fill="#0f172a" />
            
            <!-- Shallow Water & Mud Background -->
            <rect x="20" y="70" width="420" height="200" rx="12" fill="#1e293b"/>
            <rect x="20" y="190" width="420" height="80" rx="8" fill="#451a03"/>
            <line x1="20" y1="130" x2="440" y2="130" stroke="#38bdf8" stroke-width="2" stroke-dasharray="4,4"/>
            <text x="50" y="120" fill="#38bdf8" font-size="10">পানির স্তর</text>
            <text x="50" y="230" fill="#ca8a04" font-size="10">কাদামাটির তল</text>

            <!-- Lotus Tuber Runner (২-৩ পর্বের কন্দ) -->
            <path d="M 80 210 Q 140 200 200 205 Q 260 210 320 195 Q 360 175 380 150" 
                  fill="none" stroke="#fcd34d" stroke-width="20" stroke-linecap="round"/>
            <path d="M 80 210 Q 140 200 200 205 Q 260 210 320 195 Q 360 175 380 150" 
                  fill="none" stroke="#f59e0b" stroke-width="14" stroke-linecap="round"/>

            <!-- Nodes (কন্দের পর্বসমূহ) -->
            <circle cx="140" cy="202" r="8" fill="#78350f" stroke="#d97706" stroke-width="2"/>
            <circle cx="260" cy="208" r="8" fill="#78350f" stroke="#d97706" stroke-width="2"/>

            <!-- Delicate Terminal Eye (অগ্রমুকুল) Pointing Upward -->
            <path d="M 370 160 L 395 135 L 390 165 Z" fill="#22c55e" class="anim-eye"/>
            <circle cx="395" cy="135" r="5" fill="#86efac" class="anim-eye"/>

            <!-- Highlighting Loupe for Eye -->
            <circle cx="390" cy="140" r="28" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-dasharray="3,3"/>
            <text x="390" y="100" fill="#86efac" font-size="11" font-weight="black" text-anchor="middle" font-family="'Noto Sans Bengali', sans-serif">
              ✓ অক্ষত অগ্রমুকুল (Growing Tip)
            </text>

            <rect x="25" y="20" width="410" height="34" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
            <text x="230" y="42" fill="#34d399" font-size="13" font-weight="black" text-anchor="middle" font-family="'Noto Sans Bengali', sans-serif">
              ধাপ ১: ২-৩টি অক্ষত পর্ব ও সতেজ অগ্রমুকুলসহ পদ্মের কন্দ নির্বাচন
            </text>
          </svg>
        `
      },
      {
        step: 2,
        title: "জীবাণুমুক্ত কাটিং ও ছত্রাকনাশক লেপন (Sterile Sectioning)",
        duration: "সময়কাল: কন্দ কাটার সাথে সাথে",
        desc: "পর্বের ৩ সেমি দূর থেকে ধারালো জীবাণুমুক্ত ছুরি দিয়ে মসৃণভাবে কন্দ কাটতে হবে। কাটা ক্ষতের মুখে সাথে সাথে কার্বেনডাজিম (সাফ) বা কাঠকয়লার ছাই লেপন করে সিল করতে হবে যাতে পানিতে পচন না ধরে।",
        warning: "কাটা কন্দ সরাসরি রোদ বা বাতাসে ফেলে রাখবেন না; ছায়ায় হালকা ভেজা পাটের বস্তায় রাখুন।",
        svg: `
          <svg viewBox="0 0 460 300" class="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
            <rect width="460" height="300" rx="16" fill="#0f172a" />
            <path d="M 120 160 Q 220 155 330 165" stroke="#f59e0b" stroke-width="20" stroke-linecap="round"/>
            <!-- Cut Point (পর্বের ৩ সেমি দূরে) -->
            <line x1="120" y1="135" x2="120" y2="185" stroke="#ef4444" stroke-width="3.5" stroke-linecap="round"/>
            <!-- Antifungal Paste Seal on Wound -->
            <ellipse cx="120" cy="160" rx="6" ry="12" fill="#06b6d4" stroke="#e0f2fe" stroke-width="2"/>
            <text x="140" y="125" fill="#38bdf8" font-size="11" font-weight="bold">ছত্রাকনাশক পেস্ট (কার্বেনডাজিম)</text>
            <text x="230" y="225" fill="#fde047" font-size="12" font-weight="black" text-anchor="middle" font-family="'Noto Sans Bengali', sans-serif">
              পর্বের ৩ সেমি দূরে কর্তন ও ছত্রাকনাশক দিয়ে ক্ষত সিল
            </text>
            <rect x="25" y="20" width="410" height="34" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
            <text x="230" y="42" fill="#34d399" font-size="13" font-weight="black" text-anchor="middle" font-family="'Noto Sans Bengali', sans-serif">
              ধাপ ২: জীবাণুমুক্ত কর্তন ও ছত্রাকনাশক পেস্ট লেপন
            </text>
          </svg>
        `
      },
      {
        step: 3,
        title: "ছিদ্রহীন পাত্রে কাদামাটি ও সার প্রস্তুতি (Nutrient Bed)",
        duration: "সময়কাল: রোপণের পূর্বে",
        desc: "পদ্ম চাষের গামলা বা টবে কোনো ড্রেনেজ হোল (ছিদ্র) থাকা যাবে না। তলায় ৫০% এঁটেল বা এঁটেল দোআঁশ কাদামাটি এবং ৪০% পুরাতন পচা গোবর সার বা ভার্মিকম্পোস্ট ও সামান্য হাড়ের গুঁড়া মিশিয়ে পুষ্টিকর কাদার স্তর বানান।",
        warning: "কাঁচা গোবর দেবেন না; কাঁচা গোবরের তাপে কন্দ পচে যাবে।",
        svg: `
          <svg viewBox="0 0 460 300" class="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
            <rect width="460" height="300" rx="16" fill="#0f172a" />
            <!-- Water Tub (ছিদ্রহীন গামলা) -->
            <path d="M 80 110 L 100 240 L 360 240 L 380 110 Z" fill="#334155" stroke="#64748b" stroke-width="3"/>
            <!-- Bottom Compost Layer -->
            <rect x="100" y="205" width="260" height="35" fill="#451a03"/>
            <text x="230" y="228" fill="#ca8a04" font-size="10" font-weight="bold" text-anchor="middle">৪০% পচা গোবর + ভার্মিকম্পোস্ট</text>
            <!-- Top Clay Loam Layer -->
            <rect x="94" y="160" width="272" height="45" fill="#713f12"/>
            <text x="230" y="188" fill="#fef08a" font-size="10" font-weight="bold" text-anchor="middle">৫০% এঁটেল দোআঁশ কাদামাটি</text>
            <text x="230" y="90" fill="#38bdf8" font-size="12" font-weight="black" text-anchor="middle" font-family="'Noto Sans Bengali', sans-serif">
              ছিদ্রহীন গামলা ও পুষ্টিকর কাদামাটির মিশ্রণ
            </text>
            <rect x="25" y="20" width="410" height="34" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
            <text x="230" y="42" fill="#34d399" font-size="13" font-weight="black" text-anchor="middle" font-family="'Noto Sans Bengali', sans-serif">
              ধাপ ৩: ছিদ্রহীন পাত্রে কাদামাটি ও জৈব সারের বেড তৈরি
            </text>
          </svg>
        `
      },
      {
        step: 4,
        title: "১৫°-২০° কোণে কন্দ স্থাপন ও কাদায় কলার লক (Angled Planting)",
        duration: "সময়কাল: কাদা থিতু হওয়ার পর",
        desc: "কন্দটি কাদার ভেতর অনুভূমিকভাবে ১৫-২০ ডিগ্রি কোণে আড়াআড়ি রাখুন। পেছনের কাটা অংশটি কাদায় আলতো করে চেপে পুঁতে দিন, কিন্তু সজীব অগ্রমুকুলটি অবশ্যই কাদার ওপরে খোলা রাখুন।",
        warning: "অগ্রমুকুল কাদার নিচে সম্পূর্ণ পুঁতে ফেললে শ্বাসরোধ হয়ে নষ্ট হয়ে যাবে।",
        svg: `
          <svg viewBox="0 0 460 300" class="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
            <rect width="460" height="300" rx="16" fill="#0f172a" />
            <!-- Tub & Mud Line -->
            <path d="M 80 110 L 100 240 L 360 240 L 380 110 Z" fill="#1e293b" stroke="#475569" stroke-width="2"/>
            <path d="M 94 175 L 100 240 L 360 240 L 366 175 Z" fill="#713f12"/>
            <!-- Tuber Tilted at 15-20 Degree Angle -->
            <g transform="rotate(-15 220 200)">
              <path d="M 120 200 L 280 200" stroke="#f59e0b" stroke-width="16" stroke-linecap="round"/>
              <path d="M 280 200 L 305 185" stroke="#22c55e" stroke-width="6" stroke-linecap="round"/>
              <circle cx="305" cy="185" r="5" fill="#86efac"/>
            </g>
            <!-- Guide callouts -->
            <text x="140" y="225" fill="#ca8a04" font-size="10">পেছনের অংশ কাদায় ঢাকা</text>
            <text x="310" y="145" fill="#86efac" font-size="11" font-weight="black">অগ্রমুকুল কাদার ওপরে উন্মুক্ত</text>
            <line x1="285" y1="150" x2="260" y2="165" stroke="#86efac" stroke-width="1.5" stroke-dasharray="2,2"/>
            <text x="230" y="270" fill="#fde047" font-size="12" font-weight="black" text-anchor="middle" font-family="'Noto Sans Bengali', sans-serif">
              ১৫°-২০° কোণে রোপণ: অগ্রমুকুল অক্ষত ও উন্মুক্ত
            </text>
            <rect x="25" y="20" width="410" height="34" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
            <text x="230" y="42" fill="#34d399" font-size="13" font-weight="black" text-anchor="middle" font-family="'Noto Sans Bengali', sans-serif">
              ধাপ ৪: ১৫°-২০° কোণে কন্দ স্থাপন ও অগ্রমুকুল উন্মুক্ত রাখা
            </text>
          </svg>
        `
      },
      {
        step: 5,
        title: "পানির স্তর, সূর্যালোক ও প্রথম কয়েন পাতা (Coin Leaf & Bloom)",
        duration: "সময়কাল: ৭ - ১৫ দিন পর পাতা, ৬০-৭৫ দিনে ফুল",
        desc: "কাদার ওপরে শুরুতে মাত্র ২-৩ ইঞ্চি হালকা পানি দিন। পাত্রটি এমন জায়গায় রাখুন যেখানে দৈনিক কমপক্ষে ৬ ঘণ্টা কড়া রোদ পায়। ৭-১০ দিনেই প্রথম গোল কয়েন পাতা পানিতে ভাসবে এবং ৬০-৭৫ দিনে সুদৃশ্য পদ্ম ফুটবে!",
        warning: "শুরুতেই অতিরিক্ত গভীর পানি দেবেন না; পাতা বড় হওয়ার সাথে সাথে পানির গভীরতা বাড়ান।",
        svg: `
          <svg viewBox="0 0 460 300" class="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
            <style>
              @keyframes sunBeams {
                0%, 100% { opacity: 0.3; }
                50% { opacity: 0.7; }
              }
              @keyframes coinLeafFloat {
                0%, 100% { transform: translateY(0px) rotate(0deg); }
                50% { transform: translateY(-3px) rotate(1deg); }
              }
              .anim-sun { animation: sunBeams 2s infinite alternate; }
              .anim-leaf { animation: coinLeafFloat 3s infinite ease-in-out; }
            </style>
            <rect width="460" height="300" rx="16" fill="#0f172a" />
            <!-- Water Body -->
            <path d="M 80 130 L 100 250 L 360 250 L 380 130 Z" fill="#0369a1" fill-opacity="0.4" stroke="#38bdf8" stroke-width="2"/>
            <path d="M 94 195 L 100 250 L 360 250 L 366 195 Z" fill="#713f12"/>
            <line x1="80" y1="130" x2="380" y2="130" stroke="#7dd3fc" stroke-width="2.5"/>

            <!-- Sunlight Beams -->
            <polygon points="40,30 200,30 260,130 120,130" fill="#facc15" fill-opacity="0.15" class="anim-sun"/>

            <!-- Floating Coin Leaf on Water Surface -->
            <g class="anim-leaf" transform="translate(180, 115)">
              <ellipse cx="40" cy="15" rx="35" ry="14" fill="#22c55e" stroke="#86efac" stroke-width="2"/>
              <line x1="15" y1="15" x2="65" y2="15" stroke="#86efac" stroke-width="1.5"/>
              <line x1="40" y1="5" x2="40" y2="25" stroke="#86efac" stroke-width="1.5"/>
              <!-- Stem down to tuber -->
              <path d="M 40 15 Q 35 60 20 85" stroke="#15803d" stroke-width="3" fill="none"/>
            </g>

            <!-- Rising Lotus Flower Bud & Petals -->
            <g transform="translate(260, 60)">
              <path d="M 20 70 L 20 25" stroke="#15803d" stroke-width="4"/>
              <polygon points="10,25 20,0 30,25" fill="#f472b6" stroke="#db2777" stroke-width="1.5"/>
              <polygon points="5,28 15,10 25,28" fill="#f43f5e" opacity="0.8"/>
            </g>

            <text x="230" y="275" fill="#4ade80" font-size="12" font-weight="black" text-anchor="middle" font-family="'Noto Sans Bengali', sans-serif">
              🎉 ৭ দিনে প্রথম কয়েন পাতা ও ৬০-৭৫ দিনে আকর্ষণীয় পদ্ম ফুল!
            </text>
            <rect x="25" y="20" width="410" height="34" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
            <text x="230" y="42" fill="#34d399" font-size="13" font-weight="black" text-anchor="middle" font-family="'Noto Sans Bengali', sans-serif">
              ধাপ ৫: নিয়ন্ত্রিত পানি, পূর্ণ সূর্যালোক ও ভাসমান কয়েন পাতা
            </text>
          </svg>
        `
      }
    ]
  }
};

// Default backwards-compatibility pointer for existing test suite
const stepData = methodsData.cleft.steps;

// Initialization function called on DOM load
function initGrafting() {
  setupSimulatorControls();
  renderStep(1);
}

function setupSimulatorControls() {
  const prevBtn = document.getElementById('sim-prev-btn');
  const nextBtn = document.getElementById('sim-next-btn');
  const playBtn = document.getElementById('sim-play-btn');

  if (prevBtn) prevBtn.addEventListener('click', prevStep);
  if (nextBtn) nextBtn.addEventListener('click', nextStep);
  if (playBtn) playBtn.addEventListener('click', toggleAutoPlay);
}

// Select propagation method: 'cleft', 'air', 'bud', 'lotus'
function selectMethod(methodKey) {
  if (!methodsData[methodKey]) return;
  currentMethod = methodKey;

  // Update method buttons UI
  const methodBtns = document.querySelectorAll('.sim-method-btn');
  methodBtns.forEach(btn => {
    btn.className = 'sim-method-btn px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-all shrink-0';
  });
  const activeBtn = document.getElementById(`sim-method-${methodKey}`);
  if (activeBtn) {
    activeBtn.className = 'sim-method-btn px-3.5 py-1.5 rounded-xl text-xs font-black bg-emerald-600 text-white shadow-md transition-all shrink-0';
  }

  // Update simulator title and plant badges
  const simMethodTitle = document.getElementById('sim-method-title');
  const simMethodSub = document.getElementById('sim-method-subtitle');
  const mData = methodsData[methodKey];

  if (simMethodTitle) simMethodTitle.innerText = mData.name;
  if (simMethodSub) simMethodSub.innerText = mData.subtitle;

  // Update step pill labels
  for (let i = 1; i <= 5; i++) {
    const pill = document.getElementById(`step-pill-${i}`);
    if (pill && mData.steps[i - 1]) {
      const stepTitleShort = mData.steps[i - 1].title.split('(')[0].trim();
      pill.innerText = `${i}. ${stepTitleShort}`;
    }
  }

  // Reset to step 1
  stopAutoPlay();
  renderStep(1);
}

function renderStep(stepNum) {
  currentSimStep = stepNum;
  const activeMethodData = methodsData[currentMethod] || methodsData.cleft;
  const data = activeMethodData.steps[stepNum - 1];
  if (!data) return;

  // Update SVG canvas
  const viewport = document.getElementById('grafting-anim-viewport');
  if (viewport) {
    viewport.innerHTML = data.svg;
  }

  // Update text fields
  const stageBadge = document.getElementById('anim-stage-badge');
  const stepNumber = document.getElementById('detail-step-number');
  const stepDuration = document.getElementById('detail-step-duration');
  const stepTitle = document.getElementById('detail-step-title');
  const stepDesc = document.getElementById('detail-step-desc');
  const stepWarning = document.getElementById('detail-step-warning');

  if (stageBadge) stageBadge.innerText = `ধাপ ${stepNum}/৫: ${data.title.split('(')[0]}`;
  if (stepNumber) stepNumber.innerText = `ধাপ ০${stepNum}`;
  if (stepDuration) stepDuration.innerText = data.duration;
  if (stepTitle) stepTitle.innerText = data.title;
  if (stepDesc) stepDesc.innerText = data.desc;
  if (stepWarning) stepWarning.innerText = data.warning;

  // Update Pill Tabs
  for (let i = 1; i <= 5; i++) {
    const pill = document.getElementById(`step-pill-${i}`);
    if (pill) {
      if (i === stepNum) {
        pill.className = 'p-2.5 rounded-xl border-2 transition-all border-emerald-500 bg-emerald-50 text-emerald-900 font-black shadow-xs';
      } else {
        pill.className = 'p-2.5 rounded-xl border-2 transition-all border-slate-200 bg-white text-slate-600 hover:bg-slate-50';
      }
    }
  }
}

function prevStep() {
  if (currentSimStep > 1) {
    renderStep(currentSimStep - 1);
  } else {
    renderStep(5);
  }
}

function nextStep() {
  if (currentSimStep < 5) {
    renderStep(currentSimStep + 1);
  } else {
    renderStep(1);
  }
}

function goToStep(stepNum) {
  stopAutoPlay();
  renderStep(stepNum);
}

function toggleAutoPlay() {
  if (isSimPlaying) {
    stopAutoPlay();
  } else {
    startAutoPlay();
  }
}

function startAutoPlay() {
  isSimPlaying = true;
  const playIcon = document.getElementById('sim-play-icon');
  const playText = document.getElementById('sim-play-text');
  if (playIcon) playIcon.innerText = '⏸️';
  if (playText) playText.innerText = 'পজ';

  simInterval = setInterval(() => {
    nextStep();
  }, 3500);
}

function stopAutoPlay() {
  isSimPlaying = false;
  if (simInterval) clearInterval(simInterval);
  simInterval = null;
  const playIcon = document.getElementById('sim-play-icon');
  const playText = document.getElementById('sim-play-text');
  if (playIcon) playIcon.innerText = '▶️';
  if (playText) playText.innerText = 'অটো প্লে';
}

// Method filtering (All, Vegetable, Air Layering, Budding, Lotus)
function filterMethods(category) {
  const cards = document.querySelectorAll('#grafting-methods-grid [data-method-cat]');
  const filterBtns = document.querySelectorAll('.method-filter-btn');

  filterBtns.forEach(btn => {
    btn.className = 'method-filter-btn px-3.5 py-2 rounded-xl font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shrink-0';
  });

  if (window.event && window.event.currentTarget) {
    window.event.currentTarget.className = 'method-filter-btn px-3.5 py-2 rounded-xl font-black bg-emerald-600 text-white shadow-md shrink-0';
  }

  cards.forEach(card => {
    const cat = card.getAttribute('data-method-cat');
    if (category === 'all' || cat === category || cat === 'all') {
      card.classList.remove('hidden');
    } else {
      card.classList.add('hidden');
    }
  });
}

window.SmartAgroGrafting = {
  initGrafting,
  goToStep,
  prevStep,
  nextStep,
  toggleAutoPlay,
  filterMethods,
  selectMethod,
  methodsData
};
