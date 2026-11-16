const fs = require('fs');
const path = require('path');
const existingMod = require('./data/cropGuidesData.js');
const baseCrops = existingMod.allCropGuides;

console.log(`Starting with ${baseCrops.length} existing crops...`);

// Helper to clone base steps with customized titles and tips
function createSteps(cropBn, step1Extra, step2Extra, step3Extra, step4Extra, step5Extra) {
  return [
    {
      step_number: 1,
      title_bn: "মাটি তৈরি ও জমি শোধন",
      title_en: "Soil Preparation & Basal Fertilization",
      duration: "১০ - ১৫ দিন পূর্বে",
      badge: "ভিত্তি পর্যায়",
      icon: "🚜",
      description_bn: `${cropBn} চাষের জন্য জমি ৪-৫ বার আড়াআড়ি গভীর চাষ ও মই দিয়ে আগাছামুক্ত ঝুরঝুরে করতে হবে। শেষ চাষের সময় অনুমোদিত পচা গোবর/ভার্মিকম্পোস্ট, টিএসপি, এমওপি, জিপসাম ও জিংক মাটির সাথে ভালোভাবে মিশিয়ে দিতে হবে। ${step1Extra}`,
      pro_tip_bn: `মাটিতে ট্রাইকোডার্মা ও গোবর সার মিশিয়ে দিলে মাটির ছত্রাক ও ক্ষতিকর ব্যাকটেরিয়া সম্পূর্ণ ধ্বংস হয়।`,
      action_checkpoints: [
        "মাটি ৪-৫ বার গভীর চাষ দিয়ে রোদে শুকাতে দেওয়া",
        "জৈব সার ও মূল সার সমানভাবে প্রয়োগ",
        "উঁচু বেড তৈরি ও নিকাশ নালা খনন"
      ]
    },
    {
      step_number: 2,
      title_bn: "উন্নত বীজ/চারা শোধন ও রোপণ",
      title_en: "Seed Treatment & Transplanting",
      duration: "০ - ৫ দিন",
      badge: "অঙ্কুরোদগম পর্যায়",
      icon: "🌱",
      description_bn: `অনুমোদিত প্রত্যয়িত বীজ বা সুস্থ চারা নির্বাচন করতে হবে। কার্বেনডাজিম বা অটোস্টিন (২ গ্রাম প্রতি কেজি বীজ বা প্রতি লিটার পানিতে) দিয়ে বীজ শোধন করতে হবে। ${step2Extra}`,
      pro_tip_bn: `শোধন ছাড়া চারা রোপণ করলে গোড়া পচা ও ড্যাম্পিং অফ রোগে ৫০% পর্যন্ত চারা মারা যেতে পারে।`,
      action_checkpoints: [
        "ছত্রাকনাশক দিয়ে বীজ/চারা শোধন সম্পন্ন করা",
        "নির্দিষ্ট দূরত্বে সারি ও গর্ত তৈরি",
        "বিকালে চারা রোপণ ও সাথে সাথে হালকা সেচ"
      ]
    },
    {
      step_number: 3,
      title_bn: "সেচ, নিড়ানি ও সুষম উপরিপ্রয়োগ",
      title_en: "Irrigation, Weeding & Nutrient Split",
      duration: "২০ - ৫০ দিন",
      badge: "অঙ্গজ বৃদ্ধি পর্যায়",
      icon: "💧",
      description_bn: `গাছের বয়স অনুযায়ী নির্ধারিত কিস্তিতে ইউরিয়া ও পটাশ সার উপরিপ্রয়োগ করতে হবে। জমিতে কখনোই পানি জমতে দেওয়া যাবে না; সবসময় পরিমিত রস বজায় রাখতে হবে। ${step3Extra}`,
      pro_tip_bn: `দুপুরের রোদে সার ছিটাবেন না; পড়ন্ত বিকেলে সার দিয়ে হালকা সেচ দিলে সারের অপচয় রোধ হয়।`,
      action_checkpoints: [
        "আগাছা পরিষ্কার ও মাটি আলগা করা",
        "নির্ধারিত কিস্তির ইউরিয়া উপরিপ্রয়োগ",
        "প্রয়োজন অনুযায়ী সেচ ও পানি নিষ্কাশন"
      ]
    },
    {
      step_number: 4,
      title_bn: "সমন্বিত বালাই ও রোগ ব্যবস্থাপনা (IPM)",
      title_en: "Integrated Pest & Disease Management",
      duration: "৪০ - ৯০ দিন",
      badge: "সুরক্ষা পর্যায়",
      icon: "🛡️",
      description_bn: `কীট ও ছত্রাক দমনে জৈব পদ্ধতিকে অগ্রাধিকার দিতে হবে। সেক্স ফেরোমন ট্র্যাপ, হলুদ আঠালো ফাঁদ এবং নিম তেলের স্প্রে ব্যবহার করতে হবে। আক্রমণ বেশি হলে অনুমোদিত বালাইনাশক পরিমিত মাত্রায় স্প্রে করতে হবে। ${step4Extra}`,
      pro_tip_bn: `কীটনাশক স্প্রে করার সময় মুখে মাস্ক ব্যবহার করুন এবং ফসলে স্প্রে করার ৭-১০ দিনের মধ্যে ফসল তোলা থেকে বিরত থাকুন (PHI মানুন)।`,
      action_checkpoints: [
        "ক্ষেতে ফেরোমন ও হলুদ ফাঁদ স্থাপন",
        "আক্রান্ত পাতা ও ডগা ছাঁটাই করে ধ্বংস করা",
        "লক্ষণ অনুযায়ী সঠিক মাত্রায় স্প্রে"
      ]
    },
    {
      step_number: 5,
      title_bn: "পরিপক্ক ফসল সংগ্রহ, গ্রেডিং ও সংরক্ষণ",
      title_en: "Harvesting, Grading & Safe Storage",
      duration: "ফসল পরিপক্কতায়",
      badge: "ফলন প্রাপ্তি",
      icon: "📦",
      description_bn: `উপযুক্ত সময়ে সকালের রোদে শুকনা অবস্থায় ফসল তুলতে হবে। দাগমুক্ত ও সুস্থ ফসল বাছাই করে ঠান্ডা ও বায়ু চলাচলযুক্ত স্থানে সংরক্ষণ করতে হবে। ${step5Extra}`,
      pro_tip_bn: `সংগ্রহের পর গ্রেডিং করে বাজারজাত করলে কৃষক ১৫-২০% বেশি দাম পান।`,
      action_checkpoints: [
        "সকালের দিকে উপযুক্ত পরিপক্কতায় ফসল কর্তন",
        "ভালো ও দাগি ফসল আলাদা গ্রেডিং",
        "শুকনা ও ছায়াযুক্ত স্থানে বায়ুরোধী সংরক্ষণ"
      ]
    }
  ];
}

const additionalCrops = [
  // 1. Boro Rice
  {
    crop_id: "rice_boro",
    crop_name_bn: "বোরো ধান (Boro Rice)",
    crop_name_en: "Boro Irrigated Winter Rice (Oryza sativa)",
    category: "দানা শস্য ও খাদ্যশস্য",
    category_id: "cereal",
    variety_info: "ব্রি ধান-২৮, ব্রি ধান-২৯, ব্রি ধান-৮৯, ব্রি ধান-৯২, ব্রি ধান-১০০ (বঙ্গবন্ধু ধান)",
    season: "রবি / শীতকালীন (কার্তিক - বৈশাখ / নভেম্বর - মে)",
    duration: "১৪০ - ১৬০ দিন",
    icon: "🌾",
    hero_color: "from-amber-600 to-yellow-600",
    soil_spec: "উর্বর এঁটেল ও এঁটেল-দোআঁশ মাটি। মাটিতে পর্যাপ্ত জৈব পদার্থ ও সেচ সুবিধা থাকতে হবে।",
    seed_rate_spec: "প্রতি শতকে ৩০০-৪০০ গ্রাম বীজতলা। একর প্রতি ১৫-১৮ কেজি বীজ।",
    spacing_spec: "সারি থেকে সারি ২৫ সেমি, গোছা থেকে গোছা ১৫ সেমি। প্রতি গোছায় ২-৩টি সুস্থ চারা।",
    yield_spec: "উফশী জাতে হেক্টর প্রতি ৬.৫ - ৮.০ টন (বিঘায় ২৫-৩০ মণ ধান)।",
    youtube: {
      video_id: "0mbxILpnHnw",
      title: "বোরো ধান চাষের আধুনিক প্রযুক্তি, চারা রোপণ ও সেচ ব্যবস্থাপনা",
      channel: "বাংলাদেশ ধান গবেষণা ইনস্টিটিউট (BRRI)"
    },
    fertilizer_plan: {
      urea: "১.২ কেজি / শতাংশ", tsp: "০.৮ কেজি / শতাংশ", mop: "০.৭ কেজি / শতাংশ",
      gypsum: "০.৫ কেজি / শতাংশ", zinc: "০.১ কেজি / শতাংশ", boron: "০.০৫ কেজি / শতাংশ", organic: "২০ কেজি / শতাংশ"
    },
    steps: createSteps("বোরো ধান", "বীজতলায় ২৫-৩০ দিন বয়সের চারা ব্যবহার করতে হবে।", "ঠান্ডা কমলে চারা রোপণ করতে হবে।", "কুশি আসার সময় ১ম ও থোড় আসার আগে ২য় কিস্তি ইউরিয়া দিতে হবে।", "মাজরা ও ব্লাস্ট রোগের জন্য ট্রাইসাইক্লাজল স্প্রে করুন।", "৮০% ধান সোনালী হলে কেটে মাড়াই করুন।"),
    gallery: {
      crop: "/images/crops/rice_boro.jpg",
      seed: "/images/seeds/rice_boro_seed.jpg",
      seedling: "/images/seedlings/rice_boro_seedling.jpg",
      harvest: "/images/harvest/rice_boro_harvest.jpg"
    }
  },

  // 2. Aman Rice
  {
    crop_id: "rice_aman",
    crop_name_bn: "রোপা আমন ধান (Aman Rice)",
    crop_name_en: "Transplanted Aman Monsoon Rice",
    category: "দানা শস্য ও খাদ্যশস্য",
    category_id: "cereal",
    variety_info: "ব্রি ধান-৪৯, ব্রি ধান-৭৫, ব্রি ধান-৮৭, বিনা ধান-৭, স্বর্ণা, বিআর-১১",
    season: "খরিপ-২ / বর্ষাকালীন (আষাঢ় - অগ্রহায়ণ / জুলাই - ডিসেম্বর)",
    duration: "১১০ - ১৩৫ দিন",
    icon: "🌾",
    hero_color: "from-emerald-700 to-teal-700",
    soil_spec: "মাঝারি উঁচু থেকে মাঝারি নিচু জমি। দোআঁশ ও পলিমাটি আদর্শ।",
    seed_rate_spec: "শতকে ৩০০ গ্রাম বীজ। বিঘা প্রতি ৪-৫ কেজি বীজ।",
    spacing_spec: "সারি থেকে সারি ২০ সেমি, গোছা থেকে গোছা ১৫ সেমি।",
    yield_spec: "হেক্টর প্রতি ৫.০ - ৬.৫ টন (বিঘায় ১৮-২২ মণ)।",
    youtube: {
      video_id: "0mbxILpnHnw",
      title: "রোপা আমন ধানের অধিক ফলনের আধুনিক চাষ প্রযুক্তি",
      channel: "কৃষি তথ্য সার্ভিস (AIS)"
    },
    fertilizer_plan: {
      urea: "১.০ কেজি / শতাংশ", tsp: "০.৭ কেজি / শতাংশ", mop: "০.৬ কেজি / শতাংশ",
      gypsum: "০.৪ কেজি / শতাংশ", zinc: "০.০৮ কেজি / শতাংশ", boron: "০.০৩ কেজি / শতাংশ", organic: "১৫ কেজি / শতাংশ"
    },
    steps: createSteps("রোপা আমন ধান", "বর্ষার পানিতে কাদা তৈরি করে চারা রোপণ করতে হবে।", "২৫-৩০ দিন বয়সের তাজা চারা রোপণ করুন।", "বৃষ্টির পানির সর্বোত্তম ব্যবহার নিশ্চিত করুন।", "বাদামি গাছফড়িং (কারেন্ট পোকা) ও পাতা পোড়া রোগ নজরদারিতে রাখুন।", "ধানে আর্দ্রতা ১৪% নিচে নামিয়ে সংরক্ষণ করুন।"),
    gallery: {
      crop: "/images/crops/rice_aman.jpg",
      seed: "/images/seeds/rice_aman_seed.jpg",
      seedling: "/images/seedlings/rice_aman_seedling.jpg",
      harvest: "/images/harvest/rice_aman_harvest.jpg"
    }
  },

  // 3. Aus Rice
  {
    crop_id: "rice_aus",
    crop_name_bn: "উফশী আউশ ধান (Aus Rice)",
    crop_name_en: "Aus Upland Summer Rice",
    category: "দানা শস্য ও খাদ্যশস্য",
    category_id: "cereal",
    variety_info: "ব্রি ধান-৪৮, ব্রি ধান-৮২, ব্রি ধান-৮৫, ব্রি ধান-৯৮, বিনা ধান-১৯, নেরিকা",
    season: "খরিপ-১ / গ্রীষ্মকালীন (চৈত্র - শ্রাবণ / এপ্রিল - আগস্ট)",
    duration: "১০০ - ১১৫ দিন",
    icon: "🌾",
    hero_color: "from-lime-600 to-emerald-600",
    soil_spec: "উঁচু ও মাঝারি উঁচু দোআঁশ ও বেলে-দোআঁশ মাটি।",
    seed_rate_spec: "রোপা আউশে বিঘায় ৪ কেজি, সরাসরি ছিটালে বিঘায় ৭-৮ কেজি।",
    spacing_spec: "সারি ২০ সেমি, চারা ১৫ সেমি।",
    yield_spec: "হেক্টর প্রতি ৪.৫ - ৫.৫ টন।",
    youtube: {
      video_id: "0mbxILpnHnw",
      title: "আউশ ধান চাষে স্বল্প খরচে বাম্পার ফলন পাওয়ার কৌশল",
      channel: "কৃষি সম্প্রসারণ অধিদপ্তর"
    },
    fertilizer_plan: {
      urea: "০.৯ কেজি / শতাংশ", tsp: "০.৬ কেজি / শতাংশ", mop: "০.৫ কেজি / শতাংশ",
      gypsum: "০.৩ কেজি / শতাংশ", zinc: "০.০৭ কেজি / শতাংশ", boron: "০.০২ কেজি / শতাংশ", organic: "১২ কেজি / শতাংশ"
    },
    steps: createSteps("আউশ ধান", "খরাপ্রবণ এলাকায় বৃষ্টির শুরুতে জমি প্রস্তুত করুন।", "২০-২৫ দিনের কচি চারা রোপণ করতে হবে।", "আগাছা দ্রুত বাড়ে, তাই ১৫ ও ৩৫ দিনে নিড়ানি দিন।", "গান্ধী পোকা ও পামরি পোকা দমন করুন।", "বৃষ্টির মৌসুমে ধান তোলার পর দ্রুত শুকিয়ে নিন।"),
    gallery: {
      crop: "/images/crops/rice_aus.jpg",
      seed: "/images/seeds/rice_aus_seed.jpg",
      seedling: "/images/seedlings/rice_aus_seedling.jpg",
      harvest: "/images/harvest/rice_aus_harvest.jpg"
    }
  },

  // 4. Aromatic Rice
  {
    crop_id: "rice_aromatic",
    crop_name_bn: "সুগন্ধি ও পোলাও ধান (Aromatic Rice)",
    crop_name_en: "Fine & Aromatic Rice (Chinigura, Kalijira)",
    category: "দানা শস্য ও খাদ্যশস্য",
    category_id: "cereal",
    variety_info: "চিনিগুঁড়া, কালোজিরা, ব্রি ধান-৩৪, দিনাজপুরের কাটারিভোগ, ব্রি ধান-৭০",
    season: "আমন মৌসুম (শ্রাবণ - অগ্রহায়ণ)",
    duration: "১৩০ - ১৪৫ দিন",
    icon: "🌾",
    hero_color: "from-amber-700 to-amber-900",
    soil_spec: "মাঝারি উঁচু বেলে-দোআঁশ ও দোআঁশ মাটি।",
    seed_rate_spec: "বিঘায় ৩-৩.৫ কেজি বীজ।",
    spacing_spec: "সারি ২০ সেমি, চারা ১৫ সেমি।",
    yield_spec: "হেক্টর প্রতি ৩.০ - ৩.৮ টন (বাজারে দ্বিগুণ দাম)।",
    youtube: {
      video_id: "0mbxILpnHnw",
      title: "সুগন্ধি চিনিগুঁড়া ও ব্রি ধান-৩৪ চাষ প্রযুক্তি ও অধিক মুনাফা",
      channel: "মাটি ও মানুষ"
    },
    fertilizer_plan: {
      urea: "০.৮ কেজি / শতাংশ", tsp: "০.৫ কেজি / শতাংশ", mop: "০.৬ কেজি / শতাংশ",
      gypsum: "০.৩ কেজি / শতাংশ", zinc: "০.০৫ কেজি / শতাংশ", boron: "০.০২ কেজি / শতাংশ", organic: "২৫ কেজি / শতাংশ"
    },
    steps: createSteps("সুগন্ধি ধান", "অতিরিক্ত ইউরিয়া দিলে সুগন্ধ কমে যায়, তাই জৈব সার বেশি দিন।", "৩০-৩৫ দিনের সুস্থ চারা রোপণ করুন।", "মাটিতে সবসময় ৩-৫ সেমি পানি ধরে রাখুন।", "শীষ ব্লাস্ট রোগ প্রতিরোধে ফুল আসার সময় ট্রুপার বা নাটিভো স্প্রে করুন।", "বাতাস চলাচলযুক্ত শীতল স্থানে সংরক্ষণ করুন।"),
    gallery: {
      crop: "/images/crops/rice_aromatic.jpg",
      seed: "/images/seeds/rice_aromatic_seed.jpg",
      seedling: "/images/seedlings/rice_aromatic_seedling.jpg",
      harvest: "/images/harvest/rice_aromatic_harvest.jpg"
    }
  },

  // 5. Round Eggplant
  {
    crop_id: "eggplant_round",
    crop_name_bn: "গোল তাল বেগুন (Round Eggplant)",
    crop_name_en: "Round Purple Table Eggplant",
    category: "বাণিজ্যিক সবজি",
    category_id: "vegetable",
    variety_info: "বারি বেগুন-১ উত্তরা, বারি বেগুন-৩ নয়নতারা, সুফলা গোল বেগুন",
    season: "শীত ও গ্রীষ্মকালীন (সারা বছর)",
    duration: "১২০ - ১৫০ দিন",
    icon: "🍆",
    hero_color: "from-purple-700 to-indigo-800",
    soil_spec: "সুনিষ্কাশিত বেলে-দোআঁশ ও পলি-দোআঁশ মাটি।",
    seed_rate_spec: "শতকে ২.৫-৩ গ্রাম বীজ। একরে ১২০-১৫০ গ্রাম।",
    spacing_spec: "সারি থেকে সারি ৭৫ সেমি, গাছ থেকে গাছ ৬০ সেমি।",
    yield_spec: "হেক্টর প্রতি ৩৫ - ৪৫ টন।",
    youtube: {
      video_id: "Y6Hw8jD4v4s",
      title: "গোল তাল বেগুন চাষ ও ডগা-ফল ছিদ্রকারী পোকা দমন",
      channel: "দীপ্ত কৃষি"
    },
    fertilizer_plan: {
      urea: "১.১ কেজি / শতাংশ", tsp: "০.৮ কেজি / শতাংশ", mop: "০.৯ কেজি / শতাংশ",
      gypsum: "০.৪ কেজি / শতাংশ", zinc: "০.১ কেজি / শতাংশ", boron: "০.০৫ কেজি / শতাংশ", organic: "৩০ কেজি / শতাংশ"
    },
    steps: createSteps("গোল তাল বেগুন", "জমি গভীরভাবে চাষ দিয়ে উঁচু বেড তৈরি করুন।", "৩৫-৪০ দিন বয়সের সবল চারা বিকেলে রোপণ করুন।", "গাছের গোড়ায় মাটি তুলে দিন এবং মরা ডাল ছাঁটাই করুন।", "সেক্স ফেরোমন ট্র্যাপ ও নিমতেল স্প্রে করুন।", "চকচকে উজ্জ্বল থাকা অবস্থায় বোঁটাসহ বেগুন কাটুন।"),
    gallery: {
      crop: "/images/crops/eggplant_round.jpg",
      seed: "/images/seeds/eggplant_round_seed.jpg",
      seedling: "/images/seedlings/eggplant_round_seedling.jpg",
      harvest: "/images/harvest/eggplant_round_harvest.jpg"
    }
  },

  // 6. Long Purple Eggplant
  {
    crop_id: "eggplant_long",
    crop_name_bn: "লম্বা শিংনাথ বেগুন (Long Purple Eggplant)",
    crop_name_en: "Long Purple Brinjal",
    category: "বাণিজ্যিক সবজি",
    category_id: "vegetable",
    variety_info: "বারি বেগুন-৮, শিংনাথ হাইব্রিড, বারোমাসী লম্বা বেগুন",
    season: "সারা বছর চাষযোগ্য",
    duration: "১৩০ - ১৬০ দিন",
    icon: "🍆",
    hero_color: "from-purple-800 to-violet-900",
    soil_spec: "জৈব পদার্থ সমৃদ্ধ হালকা দোআঁশ মাটি।",
    seed_rate_spec: "শতকে ২.৫ গ্রাম বীজ।",
    spacing_spec: "সারি ৭০ সেমি, গাছ ৫০ সেমি।",
    yield_spec: "হেক্টর প্রতি ৪০ - ৫০ টন।",
    youtube: {
      video_id: "Y6Hw8jD4v4s",
      title: "লম্বা শিংনাথ বেগুন চাষে বাম্পার লাভ",
      channel: "কৃষি তথ্য সার্ভিস"
    },
    fertilizer_plan: {
      urea: "১.২ কেজি / শতাংশ", tsp: "০.৮ কেজি / শতাংশ", mop: "০.৮৫ কেজি / শতাংশ",
      gypsum: "০.৪৫ কেজি / শতাংশ", zinc: "০.১ কেজি / শতাংশ", boron: "০.০৫ কেজি / শতাংশ", organic: "৩০ কেজি / শতাংশ"
    },
    steps: createSteps("লম্বা শিংনাথ বেগুন", "উঁচু বেড তৈরি করে সেচ নালা রাখুন।", "চারা রোপণের পর গোড়ায় হালকা পানি দিন।", "প্রতি কিস্তি সারের পর গোড়ায় মাটি তুলে দিন।", "ডগা ছিদ্রকারী পোকা আক্রান্ত ডগা কেটে ধ্বংস করুন।", "পরিমিত সাইজ হলে নিয়মিত প্রতি সপ্তাহে তুলুন।"),
    gallery: {
      crop: "/images/crops/eggplant_long.jpg",
      seed: "/images/seeds/eggplant_long_seed.jpg",
      seedling: "/images/seedlings/eggplant_long_seedling.jpg",
      harvest: "/images/harvest/eggplant_long_harvest.jpg"
    }
  },

  // 7. Bt Brinjal
  {
    crop_id: "eggplant_bt",
    crop_name_bn: "বারি বিটি বেগুন (Bt Brinjal)",
    crop_name_en: "Bt Brinjal (Pest-Resistant GM Eggplant)",
    category: "বাণিজ্যিক সবজি",
    category_id: "vegetable",
    variety_info: "বারি বিটি বেগুন-১ (উত্তরা), বারি বিটি বেগুন-২ (কাজলা), বারি বিটি বেগুন-৩ (নয়নতারা), বারি বিটি বেগুন-৪",
    season: "রবি ও খরিপ (অক্টোবর - মে)",
    duration: "১৪০ - ১৮০ দিন",
    icon: "🍆",
    hero_color: "from-indigo-600 to-emerald-700",
    soil_spec: "পানি নিষ্কাশনযুক্ত উর্বর দোআঁশ মাটি।",
    seed_rate_spec: "শতকে ২.৫ গ্রাম সরকারি প্রত্যয়িত বীজ।",
    spacing_spec: "সারি ৭৫ সেমি, গাছ ৬০ সেমি। চারিদিকে নন-বিটি বর্ডার লাইন আবশ্যক।",
    yield_spec: "হেক্টর প্রতি ৪০ - ৫৫ টন (কীটনাশক খরচ ৮০% সাশ্রয়)।",
    youtube: {
      video_id: "Y6Hw8jD4v4s",
      title: "বিটি বেগুন চাষ প্রযুক্তি ও কীটনাশকমুক্ত নিরাপদ সবজি উৎপাদন",
      channel: "বাংলাদেশ কৃষি গবেষণা ইনস্টিটিউট (BARI)"
    },
    fertilizer_plan: {
      urea: "১.২ কেজি / শতাংশ", tsp: "০.৮৫ কেজি / শতাংশ", mop: "০.৯ কেজি / শতাংশ",
      gypsum: "০.৫ কেজি / শতাংশ", zinc: "০.১২ কেজি / শতাংশ", boron: "০.০৬ কেজি / শতাংশ", organic: "৩৫ কেজি / শতাংশ"
    },
    steps: createSteps("বারি বিটি বেগুন", "জমির সীমানায় ২০% সাধারণ নন-বিটি বেগুন বর্ডার ক্রপ হিসেবে লাগাতে হবে।", "সরকারি নার্সারি বা বিএডিসি থেকে প্রত্যয়িত চারা আনুন।", "সুষম সার ও নিয়মিত ড্রেনেজ নিশ্চিত করুন।", "ডগা ও ফল ছিদ্রকারী পোকা আক্রমণ করে না; কেবল লাল মাকড় ও জাবপোকা নজরদারিতে রাখুন।", "নিরাপদ কীটনাশকমুক্ত প্রিমিয়াম বেগুন হিসেবে বাজারজাত করুন।"),
    gallery: {
      crop: "/images/crops/eggplant_bt.jpg",
      seed: "/images/seeds/eggplant_bt_seed.jpg",
      seedling: "/images/seedlings/eggplant_bt_seedling.jpg",
      harvest: "/images/harvest/eggplant_bt_harvest.jpg"
    }
  },

  // 8. Green & Striped Eggplant
  {
    crop_id: "eggplant_green",
    crop_name_bn: "সবুজ ও ডোরা বেগুন (Green & Striped Eggplant)",
    crop_name_en: "Green Local Brinjal (Islampuri / Kajla)",
    category: "বাণিজ্যিক সবজি",
    category_id: "vegetable",
    variety_info: "ইসলামপুরী বেগুন, লাফা বেগুন, কাজলা ডোরাকাটা বেগুন",
    season: "রবি ও খরিপ",
    duration: "১২০ - ১৪৫ দিন",
    icon: "🍆",
    hero_color: "from-emerald-600 to-teal-800",
    soil_spec: "পলি-দোআঁশ মাটি।",
    seed_rate_spec: "শতকে ২.৫-৩ গ্রাম।",
    spacing_spec: "সারি ৭০ সেমি, গাছ ৫০ সেমি।",
    yield_spec: "হেক্টর প্রতি ৩৫ - ৪৫ টন।",
    youtube: {
      video_id: "Y6Hw8jD4v4s",
      title: "ইসলামপুরী ও সবুজ বেগুন চাষের প্রযুক্তি",
      channel: "কৃষি বায়োস্কোপ"
    },
    fertilizer_plan: {
      urea: "১.০ কেজি / শতাংশ", tsp: "০.৭৫ কেজি / শতাংশ", mop: "০.৮ কেজি / শতাংশ",
      gypsum: "০.৪ কেজি / শতাংশ", zinc: "০.১ কেজি / শতাংশ", boron: "০.০৫ কেজি / শতাংশ", organic: "২৫ কেজি / শতাংশ"
    },
    steps: createSteps("সবুজ বেগুন", "জমি তৈরি করে ছাই ও গোবর মিশিয়ে দিন।", "সুস্থ চারা বিকেলে লাগান।", "গোড়ায় আগাছা জমতে দেবেন না।", "পাতার নিচে পোকা আক্রমণ ঠেকাতে হালকা সাবান পানি স্প্রে করুন।", "সবুজ চকচকে কোমল থাকা অবস্থায় তুলুন।"),
    gallery: {
      crop: "/images/crops/eggplant_green.jpg",
      seed: "/images/seeds/eggplant_green_seed.jpg",
      seedling: "/images/seedlings/eggplant_green_seedling.jpg",
      harvest: "/images/harvest/eggplant_green_harvest.jpg"
    }
  },

  // 9. Pointed Gourd (পটল)
  {
    crop_id: "pointed_gourd",
    crop_name_bn: "পটল (Pointed Gourd)",
    crop_name_en: "Pointed Gourd (Trichosanthes dioica)",
    category: "বাণিজ্যিক সবজি",
    category_id: "vegetable",
    variety_info: "বারি পটল-১, বারি পটল-২, বিন্দী পটল",
    season: "আশ্বিন - কার্তিক (অক্টোবর - নভেম্বর) রোপণ, মার্চ থেকে অক্টোবর ফলন",
    duration: "বহুবর্ষজীবী (৮ - ৯ মাস ফলন)",
    icon: "🥒",
    hero_color: "from-emerald-600 to-green-700",
    soil_spec: "উঁচু ও মাঝারি উঁচু বন্যা-মুক্ত বেলে-দোআঁশ ও পলিমাটি। পানি নিষ্কাশন অত্যাবশ্যক।",
    seed_rate_spec: "লতা কাটিং: শতকে ৬০-৭০টি কন্দমূল বা লতা কাটিং। (১০টি স্ত্রী গাছের জন্য ১টি পুরুষ গাছ আবশ্যক)।",
    spacing_spec: "সারি ১.৫ মিটার, গাছ ১.২ মিটার। মাটির ওপরে মাচা বা জাংলা তৈরি করতে হবে।",
    yield_spec: "হেক্টর প্রতি ২০ - ৩০ টন (বিঘায় ৮০-১০০ মণ)।",
    youtube: {
      video_id: "XYWvcJ13PjQ",
      title: "পটল চাষ পদ্ধতি, কৃত্রিম পরাগায়ন ও মাচা ব্যবস্থাপনা",
      channel: "কৃষি তথ্য সার্ভিস"
    },
    fertilizer_plan: {
      urea: "১.০ কেজি / শতাংশ", tsp: "০.৮ কেজি / শতাংশ", mop: "০.৭৫ কেজি / শতাংশ",
      gypsum: "০.৪ কেজি / শতাংশ", zinc: "০.০৮ কেজি / শতাংশ", boron: "০.০৪ কেজি / শতাংশ", organic: "৩০ কেজি / শতাংশ"
    },
    steps: createSteps("পটল", "মাটির উঁচু ঢিবি বা মাদা তৈরি করতে হবে।", "লতার কাটিং রিং বানিয়ে মাটিতে পুঁতে দিন।", "সকালে স্ত্রী ফুলে পুরুষ ফুলের পরাগরেণু ঘষে কৃত্রিম পরাগায়ন করুন।", "লতার গোড়া পচা ও ফল পচা রোগে রিডোমিল গোল্ড স্প্রে করুন।", "৩-৪ দিন পর পর কচি পটল সংগ্রহ করুন।"),
    gallery: {
      crop: "/images/crops/pointed_gourd.jpg",
      seed: "/images/seeds/pointed_gourd_seed.jpg",
      seedling: "/images/seedlings/pointed_gourd_seedling.jpg",
      harvest: "/images/harvest/pointed_gourd_harvest.jpg"
    }
  },

  // 10. Malabar Spinach (পুঁইশাক)
  {
    crop_id: "malabar_spinach",
    crop_name_bn: "পুঁইশাক (Malabar Spinach)",
    crop_name_en: "Malabar Spinach (Basella alba)",
    category: "শাক, তৈল ও ডালবীজ",
    category_id: "leafy_pulse",
    variety_info: "বারি পুঁইশাক-১ (চিত্রা), বারি পুঁইশাক-২, লাল পুঁইশাক",
    season: "সারা বছর (গ্রীষ্ম ও বর্ষায় সর্বোত্তম)",
    duration: "৬০ - ৯০ দিন",
    icon: "🌱",
    hero_color: "from-green-700 to-emerald-800",
    soil_spec: "সব ধরনের মাটিতেই জন্মে; তবে উর্বর দোআঁশ মাটিতে বাড়-বাড়ন্ত বেশি।",
    seed_rate_spec: "শতকে ৪০-৫০ গ্রাম বীজ।",
    spacing_spec: "সারি ৫০ সেমি, গাছ ৩০ সেমি। মাচা বা কঞ্চির খুঁটি দিলে ডগা বড় হয়।",
    yield_spec: "হেক্টর প্রতি ৪০ - ৫০ টন।",
    youtube: {
      video_id: "DYcCDKmowGA",
      title: "পুঁইশাক চাষের সহজ নিয়ম ও বহুবার পাতা কাটার কৌশল",
      channel: "মাটি ও মানুষ"
    },
    fertilizer_plan: {
      urea: "০.৮ কেজি / শতাংশ", tsp: "০.৫ কেজি / শতাংশ", mop: "০.৫ কেজি / শতাংশ",
      gypsum: "০.৩ কেজি / শতাংশ", zinc: "০.০৫ কেজি / শতাংশ", boron: "০.০২ কেজি / শতাংশ", organic: "২৫ কেজি / শতাংশ"
    },
    steps: createSteps("পুঁইশাক", "গোবর সার বেশি দিয়ে মাটি ঝুরঝুরে করুন।", "বীজ পানিতে ১২ ঘণ্টা ভিজিয়ে বপন করুন।", "প্রতিবার ডগা কাটার পর সামান্য ইউরিয়া ও পানি দিন।", "পাতার দাগ রোগে ম্যানকোজেব স্প্রে করুন।", "ডগার নরম অংশ কেটে বারবার সংগ্রহ করুন।"),
    gallery: {
      crop: "/images/crops/malabar_spinach.jpg",
      seed: "/images/seeds/malabar_spinach_seed.jpg",
      seedling: "/images/seedlings/malabar_spinach_seedling.jpg",
      harvest: "/images/harvest/malabar_spinach_harvest.jpg"
    }
  },

  // 11. Guava (পেয়ারা)
  {
    crop_id: "guava",
    crop_name_bn: "উন্নত জাতের পেয়ারা (Guava)",
    crop_name_en: "Guava (Psidium guajava)",
    category: "ফলমূল ও বাগান",
    category_id: "fruit_orchard",
    variety_info: "বারি পেয়ারা-২, থাই পেয়ারা-৭, কাজী পেয়ারা",
    season: "জ্যৈষ্ঠ - ভাদ্র (মে - সেপ্টেম্বর) প্রধান কলম রোপণ",
    duration: "বহুবর্ষজীবী (রোপণের ১ বছরেই ফলন)",
    icon: "🍐",
    hero_color: "from-lime-600 to-green-700",
    soil_spec: "গভীর সুনিষ্কাশিত বেলে-দোআঁশ ও এঁটেল-দোআঁশ মাটি।",
    seed_rate_spec: "শতকে ৩-৪টি কলমের চারা (প্রতি একরে ৩০০-৩৫০টি গাছ)।",
    spacing_spec: "৩ মিটার × ৩ মিটার দূরত্বে ৬০×৬০×৬০ সেমি গর্ত তৈরি।",
    yield_spec: "গাছ প্রতি ৩০ - ৫০ কেজি (হেক্টরে ২৫-৩০ টন)।",
    youtube: {
      video_id: "mYM0_DQLbyk",
      title: "থাই পেয়ারা বাগান সৃজন, প্রুনিং ও ফল মাছি পোকা দমন",
      channel: "মাটি ও মানুষ"
    },
    fertilizer_plan: {
      urea: "০.৫ কেজি / গাছ / বছর", tsp: "০.৪ কেজি / গাছ", mop: "০.৪ কেজি / গাছ",
      gypsum: "০.২ কেজি / গাছ", zinc: "০.০৫ কেজি / গাছ", boron: "০.০৩ কেজি / গাছ", organic: "২০ কেজি / গাছ"
    },
    steps: createSteps("পেয়ারা", "গর্ত করে মাটি রোদে শুকিয়ে গোবর, টিএসপি মিশিয়ে ১৫ দিন রেখে দিন।", "সুস্থ গুটি কলম বা জোড় কলমের চারা গর্তের মাঝে সোজা করে লাগান।", "শাখা ছাঁটাই (প্রুনিং) করে নতুন কুশি বের করুন।", "মার্বেল সাইজ হলে ফ্রুট ব্যাগিং করুন (কীটনাশক লাগে না)।", "হালকা হলুদাভ সবুজ হলে হাত দিয়ে সাবধানে তুলুন।"),
    gallery: {
      crop: "/images/crops/guava.jpg",
      seed: "/images/seeds/guava_seed.jpg",
      seedling: "/images/seedlings/guava_seedling.jpg",
      harvest: "/images/harvest/guava_harvest.jpg"
    }
  },

  // 12. Lemon (লেবু)
  {
    crop_id: "lemon",
    crop_name_bn: "কাগজি ও সিডলেস লেবু (Lemon / Lime)",
    crop_name_en: "Acid Lime & Seedless Lemon",
    category: "ফলমূল ও বাগান",
    category_id: "fruit_orchard",
    variety_info: "বারি লেবু-১, সিডলেস চায়না লেবু, কলম্বো লেবু",
    season: "বৈশাখ - আষাঢ় (মে - জুলাই) রোপণ, সারা বছর ফলন",
    duration: "বহুবর্ষজীবী",
    icon: "🍋",
    hero_color: "from-yellow-500 to-lime-600",
    soil_spec: "পানি জমে না এমন উঁচু দোআঁশ ও পলিমাটি। পিএইচ ৫.৫ - ৬.৫।",
    seed_rate_spec: "শতকে ৪-৫টি গুটি কলম বা চোখ কলমের চারা।",
    spacing_spec: "২.৫ মিটার × ২.৫ মিটার দূরত্ব।",
    yield_spec: "পূর্ণবয়স্ক গাছে বছরে ২০০ - ৫০০টি লেবু।",
    youtube: {
      video_id: "mYM0_DQLbyk",
      title: "বারোমাসী কাগজি ও সিডলেস লেবু চাষের বাণিজ্যিক প্রযুক্তি",
      channel: "দীপ্ত কৃষি"
    },
    fertilizer_plan: {
      urea: "০.৩ কেজি / গাছ", tsp: "০.২৫ কেজি / গাছ", mop: "০.৩ কেজি / গাছ",
      gypsum: "০.১৫ কেজি / গাছ", zinc: "০.০৩ কেজি / গাছ", boron: "০.০২ কেজি / গাছ", organic: "১৫ কেজি / গাছ"
    },
    steps: createSteps("লেবু", "বর্ষার পূর্বে উঁচু জমিতে ড্রেনেজ লাইনসহ গর্ত করুন।", "উন্নত চোখ কলম বা গুটি কলম লাগান।", "শীতের শেষে পুরানো কাঁটাযুক্ত ও রোগাক্রান্ত ডাল ছাঁটুন।", "ক্যানকার ও ক্যাটারপিলার পোকা দমনে কপার অক্সিক্লোরাইড স্প্রে করুন।", "রসে টইটম্বুর চকচকে সবুজাবস্থায় সংগ্রহ করুন।"),
    gallery: {
      crop: "/images/crops/lemon.jpg",
      seed: "/images/seeds/lemon_seed.jpg",
      seedling: "/images/seedlings/lemon_seedling.jpg",
      harvest: "/images/harvest/lemon_harvest.jpg"
    }
  },

  // 13. Mango (আম)
  {
    crop_id: "mango",
    crop_name_bn: "উন্নত জাতের আম (Commercial Mango)",
    crop_name_en: "Commercial Mango (Mangifera indica)",
    category: "ফলমূল ও বাগান",
    category_id: "fruit_orchard",
    variety_info: "আম্রপালি, হিমসাগর, হাড়িভাঙা, বারি আম-৪, ফজলি",
    season: "আষাঢ় - শ্রাবণ (জুলাই - আগস্ট) চারা রোপণ",
    duration: "বহুবর্ষজীবী (৩য় বছর থেকে বাণিজ্যিকভাবে ফলন)",
    icon: "🥭",
    hero_color: "from-amber-500 to-orange-600",
    soil_spec: "গভীর সুনিষ্কাশিত পলি-দোআঁশ ও দোআঁশ মাটি।",
    seed_rate_spec: "আম্রপালির ক্ষেত্রে শতকে ২-৩টি কলম (ঘন রোপণ পদ্ধতিতে একরে ৩০০-৪০০ গাছ)।",
    spacing_spec: "আম্রপালি: ৫ মি × ৫ মি; সাধারণ আম: ৮ মি × ৮ মি।",
    yield_spec: "হেক্টর প্রতি ১৫ - ২০ টন।",
    youtube: {
      video_id: "mYM0_DQLbyk",
      title: "আম্রপালি আম বাগানের সফল পরিচর্যা ও হপার পোকা দমন",
      channel: "চ্যানেল আই"
    },
    fertilizer_plan: {
      urea: "০.৮ কেজি / গাছ", tsp: "০.৫ কেজি / গাছ", mop: "০.৭ কেজি / গাছ",
      gypsum: "০.৩ কেজি / গাছ", zinc: "০.০৫ কেজি / গাছ", boron: "০.০৩ কেজি / গাছ", organic: "৪০ কেজি / গাছ"
    },
    steps: createSteps("উন্নত আম", "১মি × ১মি × ১মি গর্ত তৈরি করে সার ও মাটি ভরুন।", "উন্নত ভিনিয়ার বা জোড় কলম লাগান।", "মুকুল আসার পূর্বে সেচ বন্ধ রাখুন, মটরদানার পর সেচ দিন।", "মুকুল আসার সময় ও গুটি বাঁধলে হপার পোকার স্প্রে করুন।", "বোঁটায় কষ শুকাতে দিয়ে সাবধানে হার্ভেস্ট করুন।"),
    gallery: {
      crop: "/images/crops/mango.jpg",
      seed: "/images/seeds/mango_seed.jpg",
      seedling: "/images/seedlings/mango_seedling.jpg",
      harvest: "/images/harvest/mango_harvest.jpg"
    }
  },

  // 14. Dragon Fruit (ড্রাগন ফল)
  {
    crop_id: "dragon_fruit",
    crop_name_bn: "ড্রাগন ফল (Dragon Fruit)",
    crop_name_en: "Dragon Fruit / Pitahaya (Hylocereus undatus)",
    category: "ফলমূল ও বাগান",
    category_id: "fruit_orchard",
    variety_info: "বারি ড্রাগন ফল-১ (লাল শাঁস), ভিয়েতনামি রেড ড্রাগন",
    season: "বর্ষাকাল (জুন - সেপ্টেম্বর) কাটিং রোপণ",
    duration: "বহুবর্ষজীবী (২০ - ২৫ বছর বাঁচে)",
    icon: "🐉",
    hero_color: "from-rose-600 to-pink-700",
    soil_spec: "পানি নিষ্কাশনযুক্ত উর্বর বেলে-দোআঁশ মাটি। পিএইচ ৬.০ - ৭.০।",
    seed_rate_spec: "প্রতি কংক্রিট পিলারে ৪টি করে চারা। একরে ৫০০ পিলার = ২০০০ চারা।",
    spacing_spec: "পিলার থেকে পিলার ২.৫ মি × ২.৫ মি। মাথায় গাড়ির টায়ার বাঁধা।",
    yield_spec: "পিলার প্রতি ২০ - ৩৫ কেজি (একরে ৮-১০ টন)।",
    youtube: {
      video_id: "mYM0_DQLbyk",
      title: "বাণিজ্যিক ড্রাগন চাষ ও পিলার মাচা পদ্ধতি",
      channel: "হৃদয়ে মাটি ও মানুষ"
    },
    fertilizer_plan: {
      urea: "০.৪ কেজি / পিলার", tsp: "০.৩ কেজি / পিলার", mop: "০.৪ কেজি / পিলার",
      gypsum: "০.১৫ কেজি / পিলার", zinc: "০.০২ কেজি / পিলার", boron: "০.০২ কেজি / পিলার", organic: "২৫ কেজি / পিলার"
    },
    steps: createSteps("ড্রাগন ফল", "কংক্রিট পিলার পুঁতে মাথায় গোলাকার টায়ার সেট করুন।", "পরিপক্ক কাটিং ছত্রাকনাশকে চুবিয়ে পিলারের গোড়ায় লাগান।", "ডাল বড় হলে টায়ারের উপর তুলে দিন এবং নিবিড় প্রুনিং করুন।", "অ্যানথ্রাকনোজ ও কাণ্ড পচা রোগে ম্যানকোজেব স্প্রে করুন।", "খোসার রং লালচে-গোলাপি হলে বোঁটাসহ কেটে সংগ্রহ করুন।"),
    gallery: {
      crop: "/images/crops/dragon_fruit.jpg",
      seed: "/images/seeds/dragon_fruit_seed.jpg",
      seedling: "/images/seedlings/dragon_fruit_seedling.jpg",
      harvest: "/images/harvest/dragon_fruit_harvest.jpg"
    }
  },

  // 15. Malta (বারি মাল্টা-১)
  {
    crop_id: "malta",
    crop_name_bn: "বারি মাল্টা-১ (Sweet Orange / Malta)",
    crop_name_en: "Bari Malta-1 (Citrus sinensis)",
    category: "ফলমূল ও বাগান",
    category_id: "fruit_orchard",
    variety_info: "বারি মাল্টা-১ (মিষ্টি ও রসালো পয়সা মাল্টা)",
    season: "জুন - আগস্ট কলম রোপণ",
    duration: "বহুবর্ষজীবী",
    icon: "🍊",
    hero_color: "from-orange-500 to-amber-600",
    soil_spec: "উঁচু পাহাড়ি ও সমতলের সুনিষ্কাশিত বেলে-দোআঁশ মাটি।",
    seed_rate_spec: "শতকে ৪টি টি-বাডিং কলমের চারা।",
    spacing_spec: "৩ মিটার × ৩ মিটার।",
    yield_spec: "গাছ প্রতি ১৫০ - ২৫০টি মিষ্টি ফল।",
    youtube: {
      video_id: "mYM0_DQLbyk",
      title: "বারি মাল্টা-১ চাষে বছরে লাখ টাকা লাভ ও রোগ প্রতিকার",
      channel: "কৃষি তথ্য সার্ভিস"
    },
    fertilizer_plan: {
      urea: "০.৪ কেজি / গাছ", tsp: "০.৩ কেজি / গাছ", mop: "০.৩৫ কেজি / গাছ",
      gypsum: "০.২ কেজি / গাছ", zinc: "০.০৪ কেজি / গাছ", boron: "০.০২ কেজি / গাছ", organic: "২০ কেজি / গাছ"
    },
    steps: createSteps("বারি মাল্টা-১", "উঁচু বেডে ড্রেনেজ লাইনসহ মাদা তৈরি করুন।", "প্রত্যয়িত চোখ কলম চারা সোজা করে লাগান।", "বর্ষা ও শীতের শুরুতে বছরে দুইবার সুষম সার দিন।", "ডাইব্যাক ও ফল ছিদ্রকারী পোকা দমন করুন।", "ডগায় পয়সার ছাপ দৃশ্যমান হলে মিষ্টি রসে ভরা ফল তুলুন।"),
    gallery: {
      crop: "/images/crops/malta.jpg",
      seed: "/images/seeds/malta_seed.jpg",
      seedling: "/images/seedlings/malta_seedling.jpg",
      harvest: "/images/harvest/malta_harvest.jpg"
    }
  }
];

// Combine base and additional crops
const allExpanded = [...baseCrops, ...additionalCrops];

console.log(`Writing expanded dataset with ${allExpanded.length} crops & varieties...`);

const outputContent = `// ====================================================================
// Smart Agro (স্মার্ট এগ্রো) - Comprehensive 40+ Crops & Varieties Encyclopedia
// BARI, BRRI & DAE Standard Agronomic Specifications
// ====================================================================

const allCropGuides = ${JSON.stringify(allExpanded, null, 2)};

function getAllCrops() {
  return allCropGuides;
}

function getCropById(cropId) {
  if (!cropId) return null;
  return allCropGuides.find(c => c.crop_id.toLowerCase() === cropId.toLowerCase()) || null;
}

module.exports = {
  allCropGuides,
  getAllCrops,
  getCropById
};
`;

fs.writeFileSync(path.join(__dirname, 'data/cropGuidesData.js'), outputContent, 'utf8');
console.log('Successfully updated data/cropGuidesData.js!');

