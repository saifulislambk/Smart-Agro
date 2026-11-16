// ====================================================================
// Smart Agro (স্মার্ট এগ্রো) - BARI & BARC Standard Seedling & Per-Plant
// Fertilizer Dosage Specifications (চারা ও মাদাপ্রতি সার সুপারিশ ডেটাবেস)
// ====================================================================

const plantFertilizerSpecs = {
  // 1. টমেটো (Tomato)
  tomato: {
    crop_id: 'tomato',
    crop_name_bn: 'টমেটো',
    is_transplanted: true,
    plant_unit_label: 'টি চারা / গাছ',
    density_per_decimal: 170, // ১৬০-১৮০ চারা প্রতি শতাংশ
    dose_per_plant: {
      urea_g: 8.0,
      tsp_g: 5.0,
      mop_g: 7.0,
      gypsum_g: 3.0,
      zinc_g: 0.3,
      boron_g: 0.3,
      organic_g: 1200 // ১.২ কেজি
    },
    planting_advice: 'প্রতি মাদায় ১টি করে সুস্থ ও সবল চারা ৬০x৪০ সেমি দূরত্বে রোপণ করুন।',
    split_instructions: [
      {
        stage: 'মাদা তৈরি ও রোপণকালে (Basal / Pit Prep)',
        fertilizers: 'প্রতি চারার গর্তে ১.২ কেজি পচা গোবর/ভার্মিকম্পোস্ট, ৫ গ্রাম টিএসপি, ৩ গ্রাম জিপসাম, ০.৩ গ্রাম জিংক ও ০.৩ গ্রাম বোরন মাটির সাথে ভালোভাবে মিশিয়ে চারা রোপণ করুন।'
      },
      {
        stage: '১ম কিস্তি (চারা রোপণের ১৫ দিন পর)',
        fertilizers: 'প্রতি চারার গোড়া থেকে ৮-১০ সেমি দূরে রিং আকারে ৪ গ্রাম ইউরিয়া ও ৩.৫ গ্রাম পটাশ সার দিয়ে মাটি তুলে সেচ দিন।'
      },
      {
        stage: '২য় কিস্তি (ফুল আসার সময় / ৩০-৩৫ দিন)',
        fertilizers: 'প্রতি চারার গোড়ায় অবশিষ্ট ৪ গ্রাম ইউরিয়া ও ৩.৫ গ্রাম পটাশ সার রিং পদ্ধতিতে প্রয়োগ করুন।'
      }
    ]
  },

  // 2. বেগুন (Eggplant - Round, Long, Bt, Green)
  eggplant: {
    crop_id: 'eggplant',
    crop_name_bn: 'বেগুন',
    is_transplanted: true,
    plant_unit_label: 'টি চারা / গাছ',
    density_per_decimal: 90, // ৮০-১০০ চারা প্রতি শতাংশ
    dose_per_plant: {
      urea_g: 13.0,
      tsp_g: 8.0,
      mop_g: 10.0,
      gypsum_g: 4.0,
      zinc_g: 0.5,
      boron_g: 0.4,
      organic_g: 1800 // ১.৮ কেজি
    },
    planting_advice: '৭৫x৬০ সেমি দূরত্বে চারা রোপণ করুন। রোপণের পর গোড়ায় হালকা সেচ দিন।',
    split_instructions: [
      {
        stage: 'মাদা তৈরি ও চারা রোপণকালে (Basal)',
        fertilizers: 'প্রতি মাদায় ১.৮ কেজি গোবর, ৮ গ্রাম টিএসপি, ৪ গ্রাম জিপসাম, ০.৫ গ্রাম জিংক ও ০.৪ গ্রাম বোরন মাটির সাথে মিশিয়ে নিন।'
      },
      {
        stage: '১ম কিস্তি (রোপণের ২০ দিন পর)',
        fertilizers: 'প্রতি চারার চারপাশের মাটিতে ৬.৫ গ্রাম ইউরিয়া ও ৫ গ্রাম পটাশ সার দিয়ে নিড়ানি দিয়ে মাটি আলগা করে দিন।'
      },
      {
        stage: '২য় কিস্তি (ফুল আসার সময় / ৪০-৪৫ দিন)',
        fertilizers: 'প্রতি চারায় অবশিষ্ট ৬.৫ গ্রাম ইউরিয়া ও ৫ গ্রাম পটাশ সার রিং আকারে প্রয়োগ করুন।'
      }
    ]
  },

  // 3. পেঁপে (Papaya)
  papaya: {
    crop_id: 'papaya',
    crop_name_bn: 'পেঁপে',
    is_transplanted: true,
    plant_unit_label: 'টি গাছ / চারা',
    density_per_decimal: 9, // ৮-১০ গাছ প্রতি শতাংশ
    dose_per_plant: {
      urea_g: 500,
      tsp_g: 500,
      mop_g: 500,
      gypsum_g: 250,
      zinc_g: 20,
      boron_g: 20,
      organic_g: 15000 // ১৫ কেজি
    },
    planting_advice: '২মি x ২মি দূরত্বে ৬০x৬০x৬০ সেমি গর্ত তৈরি করে ১৫ দিন রোদে শুকিয়ে চারা রোপণ করুন।',
    split_instructions: [
      {
        stage: 'গর্ত প্রস্তুতি (রোপণের ১০-১৫ দিন পূর্বে)',
        fertilizers: 'প্রতি গর্তে ১৫ কেজি পচা গোবর, ৫০০ গ্রাম টিএসপি, ২৫০ গ্রাম জিপসাম, ২০ গ্রাম জিংক ও ২০ গ্রাম বোরন মাটির সাথে মিশিয়ে গর্ত ভরাট করে সেচ দিন।'
      },
      {
        stage: 'চারা লেগে যাওয়ার পর (১ম কিস্তি - ৩০ দিন পর)',
        fertilizers: 'প্রতি গাছে ৫০ গ্রাম ইউরিয়া ও ৫০ গ্রাম পটাশ সার কাণ্ড থেকে ৩০-৪০ সেমি দূরে রিং আকারে দিয়ে মাটি চাপা দিন।'
      },
      {
        stage: 'বৃদ্ধিকালীন কিস্তি (প্রতি ৩০-৪০ দিন অন্তর অন্তর)',
        fertilizers: 'অবশিষ্ট ইউরিয়া ও পটাশ সার সমান ভাগে প্রতি মাসে বা দেড় মাস পর পর রিং পদ্ধতিতে প্রয়োগ করতে হবে।'
      }
    ]
  },

  // 4. পেয়ারা (Guava)
  guava: {
    crop_id: 'guava',
    crop_name_bn: 'পেয়ারা',
    is_transplanted: true,
    plant_unit_label: 'টি গাছ / চারা',
    density_per_decimal: 4.5,
    dose_per_plant: {
      urea_g: 300,
      tsp_g: 300,
      mop_g: 300,
      gypsum_g: 100,
      zinc_g: 15,
      boron_g: 15,
      organic_g: 15000 // ১৫ কেজি
    },
    planting_advice: '৩মি x ৩মি দূরত্বে গর্ত তৈরি করে উন্নত জাতের কলম চারা রোপণ করুন।',
    split_instructions: [
      {
        stage: 'গর্ত প্রস্তুতি ও চারা রোপণে',
        fertilizers: 'প্রতি গর্তে ১৫ কেজি গোবর, ৩০০ গ্রাম টিএসপি, ১০০ গ্রাম জিপসাম, ১৫ গ্রাম জিংক ও ১৫ গ্রাম বোরন মিশিয়ে দিন।'
      },
      {
        stage: '১ম কিস্তি (ফেব্রুয়ারি-মার্চ মাসে)',
        fertilizers: 'প্রতি গাছে ১৫০ গ্রাম ইউরিয়া ও ১৫০ গ্রাম পটাশ সার গাছের ছাউনির নিচে রিং আকারে মাটিতে মিশিয়ে সেচ দিন।'
      },
      {
        stage: '২য় কিস্তি (বর্ষার পর সেপ্টেম্বর-অক্টোবর মাসে)',
        fertilizers: 'প্রতি গাছে ১৫০ গ্রাম ইউরিয়া ও ১৫০ গ্রাম পটাশ সার একইভাবে প্রয়োগ করুন।'
      }
    ]
  },

  // 5. লেবু (Lemon / Lime)
  lemon: {
    crop_id: 'lemon',
    crop_name_bn: 'লেবু',
    is_transplanted: true,
    plant_unit_label: 'টি গাছ / চারা',
    density_per_decimal: 5,
    dose_per_plant: {
      urea_g: 250,
      tsp_g: 250,
      mop_g: 200,
      gypsum_g: 75,
      zinc_g: 10,
      boron_g: 10,
      organic_g: 12000 // ১২ কেজি
    },
    planting_advice: 'সুনিষ্কাশিত উঁচু স্থানে ৩মি x ৩মি দূরত্বে গুটি কলম চারা রোপণ করুন।',
    split_instructions: [
      {
        stage: 'গর্ত প্রস্তুতি (Basal)',
        fertilizers: 'প্রতি গর্তে ১২ কেজি গোবর, ২৫০ গ্রাম টিএসপি, ৭৫ গ্রাম জিপসাম, ১০ গ্রাম জিংক ও ১০ গ্রাম বোরন মাটির সাথে মিশিয়ে দিন।'
      },
      {
        stage: '১ম কিস্তি (বর্ষার শুরুতে - মে/জুন)',
        fertilizers: 'প্রতি গাছে ১২৫ গ্রাম ইউরিয়া ও ১০০ গ্রাম পটাশ সার গাছের গোড়া থেকে ৫০ সেমি দূরে রিং করে দিন।'
      },
      {
        stage: '২য় কিস্তি (বর্ষার শেষে - সেপ্টেম্বর/অক্টোবর)',
        fertilizers: 'প্রতি গাছে ১২৫ গ্রাম ইউরিয়া ও ১০০ গ্রাম পটাশ সার পুনরায় প্রয়োগ করে সেচ দিন।'
      }
    ]
  },

  // 6. আম (Mango)
  mango: {
    crop_id: 'mango',
    crop_name_bn: 'আম',
    is_transplanted: true,
    plant_unit_label: 'টি গাছ / কলম চারা',
    density_per_decimal: 2,
    dose_per_plant: {
      urea_g: 500,
      tsp_g: 450,
      mop_g: 400,
      gypsum_g: 150,
      zinc_g: 20,
      boron_g: 15,
      organic_g: 25000 // ২৫ কেজি
    },
    planting_advice: 'গর্ত ১x১x১ মিটার করে ১৫ দিন রোদে শুকিয়ে সার দিয়ে ভরুন।',
    split_instructions: [
      {
        stage: 'গর্ত তৈরি ও রোপণকালে',
        fertilizers: 'প্রতি গর্তে ২৫ কেজি পচা গোবর, ৪৫০ গ্রাম টিএসপি, ১৫০ গ্রাম জিপসাম, ২০ গ্রাম জিংক ও ১৫ গ্রাম বোরন মাটির সাথে মিশিয়ে দিন।'
      },
      {
        stage: '১ম কিস্তি (বর্ষার শুরুতে মে-জুন)',
        fertilizers: 'প্রতি গাছে ২৫০ গ্রাম ইউরিয়া ও ২০০ গ্রাম পটাশ সার গাছের ছাউনির নিচে নালা কেটে দিন।'
      },
      {
        stage: '২য় কিস্তি (বর্ষার শেষে সেপ্টেম্বর-অক্টোবর)',
        fertilizers: 'প্রতি গাছে অবশিষ্ট ২৫০ গ্রাম ইউরিয়া ও ২০০ গ্রাম পটাশ সার প্রয়োগ করুন।'
      }
    ]
  },

  // 7. ড্রাগন ফল (Dragon Fruit)
  dragon_fruit: {
    crop_id: 'dragon_fruit',
    crop_name_bn: 'ড্রাগন ফল',
    is_transplanted: true,
    plant_unit_label: 'টি পিলার (খুঁটি)',
    density_per_decimal: 5.5,
    dose_per_plant: {
      urea_g: 250,
      tsp_g: 200,
      mop_g: 250,
      gypsum_g: 100,
      zinc_g: 15,
      boron_g: 15,
      organic_g: 25000 // ২৫ কেজি পিলারপ্রতি
    },
    planting_advice: 'প্রতিটি সিমেন্টের খুঁটি বা পিলারে ৪টি করে কাটিং চারা রোপণ করুন।',
    split_instructions: [
      {
        stage: 'পিলার বেড প্রস্তুতি ও রোপণে',
        fertilizers: 'প্রতি পিলারের গোড়ায় ২৫ কেজি ভার্মিকম্পোস্ট/গোবর, ২০০ গ্রাম টিএসপি, ১০০ গ্রাম জিপসাম, ১৫ গ্রাম জিংক ও ১৫ গ্রাম বোরন মিশিয়ে দিন।'
      },
      {
        stage: '১ম কিস্তি (রোপণের ৪০ দিন পর)',
        fertilizers: 'প্রতি পিলারে ৮০ গ্রাম ইউরিয়া ও ৮০ গ্রাম পটাশ সার গোড়ার চারিদিকে ছিটিয়ে দিন।'
      },
      {
        stage: '২য় ও ৩য় কিস্তি (ফুল ও ফল আসার মৌসুমে)',
        fertilizers: 'অবশিষ্ট ইউরিয়া ও পটাশ সার দুই কিস্তিতে প্রতি পিলারের চারধারে রিং আকারে প্রয়োগ করুন।'
      }
    ]
  },

  // 8. মাল্টা (Malta / Sweet Orange)
  malta: {
    crop_id: 'malta',
    crop_name_bn: 'বারি মাল্টা-১',
    is_transplanted: true,
    plant_unit_label: 'টি গাছ / চারা',
    density_per_decimal: 3.5,
    dose_per_plant: {
      urea_g: 300,
      tsp_g: 300,
      mop_g: 250,
      gypsum_g: 100,
      zinc_g: 15,
      boron_g: 10,
      organic_g: 20000 // ২০ কেজি
    },
    planting_advice: '৩.৫মি x ৩.৫মি দূরত্বে ৭৫x৭৫ সেমি গর্তে কলম চারা রোপণ করুন।',
    split_instructions: [
      {
        stage: 'গর্ত প্রস্তুতি ও রোপণে',
        fertilizers: 'প্রতি গর্তে ২০ কেজি গোবর, ৩০০ গ্রাম টিএসপি, ১০০ গ্রাম জিপসাম, ১৫ গ্রাম জিংক ও ১০ গ্রাম বোরন মিশিয়ে দিন।'
      },
      {
        stage: '১ম কিস্তি (মে-জুন)',
        fertilizers: 'প্রতি গাছে ১৫০ গ্রাম ইউরিয়া ও ১২৫ গ্রাম পটাশ সার রিং আকারে প্রয়োগ করুন।'
      },
      {
        stage: '২য় কিস্তি (সেপ্টেম্বর-অক্টোবর)',
        fertilizers: 'প্রতি গাছে ১৫০ গ্রাম ইউরিয়া ও ১২৫ গ্রাম পটাশ সার প্রয়োগ করে সেচ দিন।'
      }
    ]
  },

  // 9. লাউ (Bottle Gourd)
  bottle_gourd: {
    crop_id: 'bottle_gourd',
    crop_name_bn: 'লাউ',
    is_transplanted: true,
    plant_unit_label: 'টি মাদা (প্রতি মাদায় ২-৩টি চারা)',
    density_per_decimal: 7,
    dose_per_plant: {
      urea_g: 175,
      tsp_g: 130,
      mop_g: 120,
      gypsum_g: 50,
      zinc_g: 10,
      boron_g: 8,
      organic_g: 12000 // ১২ কেজি
    },
    planting_advice: '২.৫x২.৫ মিটার দূরত্বে মাদা তৈরি করে চারা রোপণ করুন।',
    split_instructions: [
      {
        stage: 'মাদা তৈরি ও চারা রোপণে (Basal)',
        fertilizers: 'প্রতি মাদায় ১২ কেজি পচা গোবর, ১৩০ গ্রাম টিএসপি, ৫০ গ্রাম জিপসাম, ১০ গ্রাম জিংক, ৮ গ্রাম বোরন ও ৪০ গ্রাম পটাশ সার মাটির সাথে মিশিয়ে নিন।'
      },
      {
        stage: '১ম কিস্তি (লতা বাড়ার সময় / ২০-২৫ দিন)',
        fertilizers: 'প্রতি মাদায় ৬০ গ্রাম ইউরিয়া ও ৪০ গ্রাম পটাশ সার মাদার কিনারায় রিং আকারে দিন।'
      },
      {
        stage: '২য় কিস্তি (ফুল আসার সময় / ৪০-৪৫ দিন)',
        fertilizers: 'প্রতি মাদায় ৬০ গ্রাম ইউরিয়া সার মাটির সাথে মিশিয়ে সেচ দিন।'
      },
      {
        stage: '৩য় কিস্তি (ফল ধরার পর / ৬০-৬৫ দিন)',
        fertilizers: 'প্রতি মাদায় অবশিষ্ট ৫৫ গ্রাম ইউরিয়া ও ৪০ গ্রাম পটাশ সার প্রয়োগ করুন।'
      }
    ]
  },

  // 10. মিষ্টি কুমড়া (Sweet Gourd)
  sweet_gourd: {
    crop_id: 'sweet_gourd',
    crop_name_bn: 'মিষ্টি কুমড়া',
    is_transplanted: true,
    plant_unit_label: 'টি মাদা (প্রতি মাদায় ২-৩টি চারা)',
    density_per_decimal: 7,
    dose_per_plant: {
      urea_g: 160,
      tsp_g: 120,
      mop_g: 110,
      gypsum_g: 50,
      zinc_g: 10,
      boron_g: 8,
      organic_g: 12000 // ১২ কেজি
    },
    planting_advice: 'প্রতি মাদায় ৩টি করে সুস্থ চারা রোপণ করুন।',
    split_instructions: [
      {
        stage: 'মাদা তৈরি ও চারা রোপণে',
        fertilizers: 'প্রতি মাদায় ১২ কেজি পচা গোবর, ১২০ গ্রাম টিএসপি, ৫০ গ্রাম জিপসাম, ১০ গ্রাম জিংক, ৮ গ্রাম বোরন ও ৩৫ গ্রাম পটাশ সার মিশিয়ে নিন।'
      },
      {
        stage: '১ম কিস্তি (লতা বিস্তারের সময়)',
        fertilizers: 'প্রতি মাদায় ৫০ গ্রাম ইউরিয়া ও ৩৫ গ্রাম পটাশ সার প্রয়োগ করে সেচ দিন।'
      },
      {
        stage: '২য় ও ৩য় কিস্তি (ফুল ও ফল বৃদ্ধির সময়)',
        fertilizers: 'প্রতি মাদায় অবশিষ্ট ১১০ গ্রাম ইউরিয়া ও ৪০ গ্রাম পটাশ সার দুই কিস্তিতে প্রয়োগ করুন।'
      }
    ]
  },

  // 11. মরিচ (Chilli)
  chilli: {
    crop_id: 'chilli',
    crop_name_bn: 'মরিচ',
    is_transplanted: true,
    plant_unit_label: 'টি চারা / গাছ',
    density_per_decimal: 190,
    dose_per_plant: {
      urea_g: 6.0,
      tsp_g: 4.0,
      mop_g: 5.0,
      gypsum_g: 2.0,
      zinc_g: 0.2,
      boron_g: 0.2,
      organic_g: 800
    },
    planting_advice: '৫০x৪০ সেমি দূরত্বে চারা রোপণ করুন।',
    split_instructions: [
      {
        stage: 'জমি তৈরি ও রোপণকালে',
        fertilizers: 'প্রতি চারার গর্তে ৮০০ গ্রাম গোবর, ৪ গ্রাম টিএসপি, ২ গ্রাম জিপসাম ও বোরন/জিংকের প্রাথমিক মাত্রা দিন।'
      },
      {
        stage: '১ম কিস্তি (২৫ দিন পর)',
        fertilizers: 'প্রতি চারার গোড়ায় ৩ গ্রাম ইউরিয়া ও ২.৫ গ্রাম পটাশ সার রিং আকারে প্রয়োগ করুন।'
      },
      {
        stage: '২য় কিস্তি (ফুল আসার সময়)',
        fertilizers: 'প্রতি চারার গোড়ায় ৩ গ্রাম ইউরিয়া ও ২.৫ গ্রাম পটাশ সার প্রয়োগ করে সেচ দিন।'
      }
    ]
  },

  // 12. ফুলকপি (Cauliflower)
  cauliflower: {
    crop_id: 'cauliflower',
    crop_name_bn: 'ফুলকপি',
    is_transplanted: true,
    plant_unit_label: 'টি চারা',
    density_per_decimal: 150,
    dose_per_plant: {
      urea_g: 10.0,
      tsp_g: 6.0,
      mop_g: 8.0,
      gypsum_g: 3.0,
      zinc_g: 0.3,
      boron_g: 0.5,
      organic_g: 1200
    },
    planting_advice: '৬০x৪৫ সেমি দূরত্বে চারা রোপণ করুন।',
    split_instructions: [
      {
        stage: 'জমি তৈরি ও রোপণকালে',
        fertilizers: 'প্রতি চারার নিচে ১.২ কেজি গোবর, ৬ গ্রাম টিএসপি, ৩ গ্রাম জিপসাম, ০.৫ গ্রাম বোরন মাটির সাথে মিশিয়ে দিন।'
      },
      {
        stage: '১ম কিস্তি (১৫ দিন পর)',
        fertilizers: 'প্রতি চারায় ৫ গ্রাম ইউরিয়া ও ৪ গ্রাম পটাশ সার রিং আকারে দিন।'
      },
      {
        stage: '২য় কিস্তি (৩০ দিন পর)',
        fertilizers: 'প্রতি চারায় ৫ গ্রাম ইউরিয়া ও ৪ গ্রাম পটাশ সার প্রয়োগ করে গোড়ায় মাটি তুলে দিন।'
      }
    ]
  },

  // 13. বাঁধাকপি (Cabbage)
  cabbage: {
    crop_id: 'cabbage',
    crop_name_bn: 'বাঁধাকপি',
    is_transplanted: true,
    plant_unit_label: 'টি চারা',
    density_per_decimal: 150,
    dose_per_plant: {
      urea_g: 10.0,
      tsp_g: 6.0,
      mop_g: 8.0,
      gypsum_g: 3.0,
      zinc_g: 0.3,
      boron_g: 0.4,
      organic_g: 1200
    },
    planting_advice: '৬০x৪৫ সেমি দূরত্বে চারা রোপণ করুন।',
    split_instructions: [
      {
        stage: 'জমি তৈরি ও রোপণকালে',
        fertilizers: 'প্রতি চারার নিচে ১.২ কেজি গোবর, ৬ গ্রাম টিএসপি, ৩ গ্রাম জিপসাম ও বোরন মিশিয়ে দিন।'
      },
      {
        stage: '১ম কিস্তি (১৫ দিন পর)',
        fertilizers: 'প্রতি চারায় ৫ গ্রাম ইউরিয়া ও ৪ গ্রাম পটাশ সার দিয়ে সেচ দিন।'
      },
      {
        stage: '২য় কিস্তি (৩০-৩৫ দিন পর)',
        fertilizers: 'প্রতি চারায় ৫ গ্রাম ইউরিয়া ও ৪ গ্রাম পটাশ সার প্রয়োগ করে গোড়ায় মাটি তুলে দিন।'
      }
    ]
  },

  // 14. শসা (Cucumber)
  cucumber: {
    crop_id: 'cucumber',
    crop_name_bn: 'শসা',
    is_transplanted: true,
    plant_unit_label: 'টি মাদা (প্রতি মাদায় ২-৩টি চারা)',
    density_per_decimal: 22,
    dose_per_plant: {
      urea_g: 40,
      tsp_g: 30,
      mop_g: 35,
      gypsum_g: 15,
      zinc_g: 2,
      boron_g: 2,
      organic_g: 5000
    },
    planting_advice: '১.৫x১.২ মিটার দূরত্বে মাদা তৈরি করুন।',
    split_instructions: [
      {
        stage: 'মাদা তৈরি ও রোপণে',
        fertilizers: 'প্রতি মাদায় ৫ কেজি গোবর, ৩০ গ্রাম টিএসপি, ১৫ গ্রাম জিপসাম ও প্রাথমিক পটাশ মিশিয়ে নিন।'
      },
      {
        stage: '১ম কিস্তি (২০ দিন পর)',
        fertilizers: 'প্রতি মাদায় ২০ গ্রাম ইউরিয়া ও ১৫ গ্রাম পটাশ সার রিং আকারে প্রয়োগ করুন।'
      },
      {
        stage: '২য় কিস্তি (ফুল আসার সময়)',
        fertilizers: 'প্রতি মাদায় ২০ গ্রাম ইউরিয়া ও ২০ গ্রাম পটাশ সার প্রয়োগ করুন।'
      }
    ]
  },

  // 15. করলা / উচ্ছে (Bitter Gourd)
  bitter_gourd: {
    crop_id: 'bitter_gourd',
    crop_name_bn: 'করলা / উচ্ছে',
    is_transplanted: true,
    plant_unit_label: 'টি মাদা (প্রতি মাদায় ২-৩টি চারা)',
    density_per_decimal: 22,
    dose_per_plant: {
      urea_g: 45,
      tsp_g: 35,
      mop_g: 35,
      gypsum_g: 15,
      zinc_g: 2,
      boron_g: 2,
      organic_g: 5000
    },
    planting_advice: '১.৫x১.২ মিটার দূরত্বে মাদা তৈরি করুন।',
    split_instructions: [
      {
        stage: 'মাদা তৈরি ও রোপণে',
        fertilizers: 'প্রতি মাদায় ৫ কেজি গোবর, ৩৫ গ্রাম টিএসপি, ১৫ গ্রাম জিপসাম মিশিয়ে নিন।'
      },
      {
        stage: '১ম কিস্তি (২০ দিন পর)',
        fertilizers: 'প্রতি মাদায় ২২ গ্রাম ইউরিয়া ও ১৫ গ্রাম পটাশ সার দিন।'
      },
      {
        stage: '২য় কিস্তি (ফুল আসার সময়)',
        fertilizers: 'প্রতি মাদায় ২৩ গ্রাম ইউরিয়া ও ২০ গ্রাম পটাশ সার প্রয়োগ করুন।'
      }
    ]
  },

  // 16. পটল (Pointed Gourd)
  pointed_gourd: {
    crop_id: 'pointed_gourd',
    crop_name_bn: 'পটল',
    is_transplanted: true,
    plant_unit_label: 'টি মাদা / লতা গোড়া',
    density_per_decimal: 22,
    dose_per_plant: {
      urea_g: 50,
      tsp_g: 40,
      mop_g: 40,
      gypsum_g: 20,
      zinc_g: 2,
      boron_g: 2,
      organic_g: 5000
    },
    planting_advice: 'লতা কুন্ডলী পাকিয়ে মাদায় রোপণ করুন।',
    split_instructions: [
      {
        stage: 'মাদা তৈরি ও রোপণে',
        fertilizers: 'প্রতি মাদায় ৫ কেজি গোবর, ৪০ গ্রাম টিএসপি, ২০ গ্রাম জিপসাম মিশিয়ে দিন।'
      },
      {
        stage: '১ম কিস্তি (লতা বৃদ্ধির সময়)',
        fertilizers: 'প্রতি মাদায় ২৫ গ্রাম ইউরিয়া ও ২০ গ্রাম পটাশ সার দিন।'
      },
      {
        stage: '২য় কিস্তি (ফুল ও ফল আসার সময়)',
        fertilizers: 'প্রতি মাদায় ২৫ গ্রাম ইউরিয়া ও ২০ গ্রাম পটাশ সার দিন।'
      }
    ]
  },

  // 17. শিম (Hyacinth Bean)
  hyacinth_bean: {
    crop_id: 'hyacinth_bean',
    crop_name_bn: 'শিম',
    is_transplanted: true,
    plant_unit_label: 'টি মাদা (প্রতি মাদায় ৩টি চারা)',
    density_per_decimal: 8,
    dose_per_plant: {
      urea_g: 70,
      tsp_g: 80,
      mop_g: 80,
      gypsum_g: 30,
      zinc_g: 4,
      boron_g: 4,
      organic_g: 7000
    },
    planting_advice: 'মাদা থেকে মাদার দূরত্ব ২.৫ মিটার রাখুন।',
    split_instructions: [
      {
        stage: 'মাদা তৈরি ও বীজ/চারা রোপণে',
        fertilizers: 'প্রতি মাদায় ৭ কেজি গোবর, ৮০ গ্রাম টিএসপি, ৩০ গ্রাম জিপসাম ও ৪০ গ্রাম পটাশ সার দিন।'
      },
      {
        stage: '১ম কিস্তি (লতা বাড়ার সময়)',
        fertilizers: 'প্রতি মাদায় ৩৫ গ্রাম ইউরিয়া ও ২০ গ্রাম পটাশ সার দিন।'
      },
      {
        stage: '২য় কিস্তি (ফুল আসার সময়)',
        fertilizers: 'প্রতি মাদায় ৩৫ গ্রাম ইউরিয়া ও ২০ গ্রাম পটাশ সার দিন।'
      }
    ]
  },

  // 18. চিচিঙ্গা (Snake Gourd)
  snake_gourd: {
    crop_id: 'snake_gourd',
    crop_name_bn: 'চিচিঙ্গা',
    is_transplanted: true,
    plant_unit_label: 'টি মাদা',
    density_per_decimal: 10,
    dose_per_plant: {
      urea_g: 50,
      tsp_g: 40,
      mop_g: 40,
      gypsum_g: 20,
      zinc_g: 3,
      boron_g: 3,
      organic_g: 6000
    },
    planting_advice: '২x২ মিটার দূরত্বে মাদা তৈরি করে চারা রোপণ করুন।',
    split_instructions: [
      {
        stage: 'মাদা তৈরি ও রোপণে',
        fertilizers: 'প্রতি মাদায় ৬ কেজি গোবর, ৪০ গ্রাম টিএসপি, ২০ গ্রাম জিপসাম ও ২০ গ্রাম পটাশ সার মিশিয়ে দিন।'
      },
      {
        stage: '১ম কিস্তি (লতা বাড়ার সময়)',
        fertilizers: 'প্রতি মাদায় ২৫ গ্রাম ইউরিয়া ও ১০ গ্রাম পটাশ সার দিন।'
      },
      {
        stage: '২য় কিস্তি (ফুল আসার সময়)',
        fertilizers: 'প্রতি মাদায় ২৫ গ্রাম ইউরিয়া ও ১০ গ্রাম পটাশ সার দিন।'
      }
    ]
  },

  // 19. ঝিঙা (Ridge Gourd)
  ridge_gourd: {
    crop_id: 'ridge_gourd',
    crop_name_bn: 'ঝিঙা',
    is_transplanted: true,
    plant_unit_label: 'টি মাদা',
    density_per_decimal: 10,
    dose_per_plant: {
      urea_g: 50,
      tsp_g: 40,
      mop_g: 40,
      gypsum_g: 20,
      zinc_g: 3,
      boron_g: 3,
      organic_g: 6000
    },
    planting_advice: '২x২ মিটার দূরত্বে মাদা তৈরি করে চারা রোপণ করুন।',
    split_instructions: [
      {
        stage: 'মাদা তৈরি ও রোপণে',
        fertilizers: 'প্রতি মাদায় ৬ কেজি গোবর, ৪০ গ্রাম টিএসপি, ২০ গ্রাম জিপসাম ও ২০ গ্রাম পটাশ সার মিশিয়ে দিন।'
      },
      {
        stage: '১ম কিস্তি (লতা বাড়ার সময়)',
        fertilizers: 'প্রতি মাদায় ২৫ গ্রাম ইউরিয়া ও ১০ গ্রাম পটাশ সার দিন।'
      },
      {
        stage: '২য় কিস্তি (ফুল আসার সময়)',
        fertilizers: 'প্রতি মাদায় ২৫ গ্রাম ইউরিয়া ও ১০ গ্রাম পটাশ সার দিন।'
      }
    ]
  },

  // 20. চাল কুমড়া (Ash Gourd)
  ash_gourd: {
    crop_id: 'ash_gourd',
    crop_name_bn: 'চাল কুমড়া',
    is_transplanted: true,
    plant_unit_label: 'টি মাদা',
    density_per_decimal: 7,
    dose_per_plant: {
      urea_g: 150,
      tsp_g: 120,
      mop_g: 110,
      gypsum_g: 50,
      zinc_g: 10,
      boron_g: 8,
      organic_g: 10000
    },
    planting_advice: 'প্রতি মাদায় ৩টি করে সুস্থ চারা রোপণ করুন।',
    split_instructions: [
      {
        stage: 'মাদা তৈরি ও চারা রোপণে',
        fertilizers: 'প্রতি মাদায় ১০ কেজি পচা গোবর, ১২০ গ্রাম টিএসপি, ৫০ গ্রাম জিপসাম, ১০ গ্রাম জিংক ও ৮ গ্রাম বোরন মিশিয়ে নিন।'
      },
      {
        stage: '১ম কিস্তি (লতা বৃদ্ধির সময়)',
        fertilizers: 'প্রতি মাদায় ৫০ গ্রাম ইউরিয়া ও ৩৫ গ্রাম পটাশ সার দিন।'
      },
      {
        stage: '২য় কিস্তি (ফুল ও ফল আসার সময়)',
        fertilizers: 'প্রতি মাদায় ১০০ গ্রাম ইউরিয়া ও ৭৫ গ্রাম পটাশ সার দিন।'
      }
    ]
  },

  // 21. কচুর লতি (Taro Stolon / Loti)
  taro_loti: {
    crop_id: 'taro_loti',
    crop_name_bn: 'কচুর লতি',
    is_transplanted: true,
    plant_unit_label: 'টি চারা / গাছ',
    density_per_decimal: 160,
    dose_per_plant: {
      urea_g: 8.0,
      tsp_g: 5.0,
      mop_g: 8.0,
      gypsum_g: 3.0,
      zinc_g: 0.3,
      boron_g: 0.3,
      organic_g: 1000
    },
    planting_advice: '৬০x৪৫ সেমি দূরত্বে চারা রোপণ করুন।',
    split_instructions: [
      {
        stage: 'জমি তৈরি ও রোপণে',
        fertilizers: 'প্রতি চারার গর্তে ১ কেজি গোবর, ৫ গ্রাম টিএসপি, ৩ গ্রাম জিপসাম মিশিয়ে দিন।'
      },
      {
        stage: '১ম কিস্তি (২৫ দিন পর)',
        fertilizers: 'প্রতি গাছে ৪ গ্রাম ইউরিয়া ও ৪ গ্রাম পটাশ সার দিন।'
      },
      {
        stage: '২য় কিস্তি (লতি বের হওয়ার সময়)',
        fertilizers: 'প্রতি গাছে ৪ গ্রাম ইউরিয়া ও ৪ গ্রাম পটাশ সার দিন।'
      }
    ]
  },

  // 22. ঢেঁড়শ (Okra)
  okra: {
    crop_id: 'okra',
    crop_name_bn: 'ঢেঁড়শ',
    is_transplanted: true,
    plant_unit_label: 'টি গাছ / চারা',
    density_per_decimal: 110,
    dose_per_plant: {
      urea_g: 9.0,
      tsp_g: 5.0,
      mop_g: 6.0,
      gypsum_g: 3.0,
      zinc_g: 0.3,
      boron_g: 0.3,
      organic_g: 160
    },
    planting_advice: '৪৫x৩০ সেমি দূরত্বে চারা বা বীজ বপন করুন।',
    split_instructions: [
      {
        stage: 'জমি তৈরি ও রোপণে',
        fertilizers: 'প্রতি গাছে ১৬০ গ্রাম গোবর, ৫ গ্রাম টিএসপি, ৩ গ্রাম জিপসাম মিশিয়ে দিন।'
      },
      {
        stage: '১ম কিস্তি (২০ দিন পর)',
        fertilizers: 'প্রতি গাছে ৪.৫ গ্রাম ইউরিয়া ও ৩ গ্রাম পটাশ সার দিন।'
      },
      {
        stage: '২য় কিস্তি (ফুল আসার সময়)',
        fertilizers: 'প্রতি গাছে ৪.৫ গ্রাম ইউরিয়া ও ৩ গ্রাম পটাশ সার দিন।'
      }
    ]
  },

  // 23. ধান (Rice - রোপা ধান গুছিভিত্তিক)
  rice: {
    crop_id: 'rice',
    crop_name_bn: 'ধান (রোপা গুছি)',
    is_transplanted: true,
    plant_unit_label: 'টি গুছি (Hill Clusters)',
    density_per_decimal: 900,
    dose_per_plant: {
      urea_g: 1.1,
      tsp_g: 0.45,
      mop_g: 0.65,
      gypsum_g: 0.38,
      zinc_g: 0.05,
      boron_g: 0.03,
      organic_g: 16.0
    },
    planting_advice: 'প্রতি গুছিতে ২-৩টি সুস্থ চারা ২০x১৫ সেমি দূরত্বে রোপণ করুন।',
    split_instructions: [
      {
        stage: 'শেষ চাষের সময় (Basal)',
        fertilizers: 'প্রতি ১০০ গুছির হিসেবে ৪৫ গ্রাম টিএসপি, ৪০ গ্রাম পটাশ, ৩৮ গ্রাম জিপসাম ও ১.৬ কেজি গোবর কাদায় মিশিয়ে দিন।'
      },
      {
        stage: '১ম কিস্তি (১৫-২০ দিন পর - কুশি পর্যায়)',
        fertilizers: 'প্রতি ১০০ গুছির জন্য ৩৫ গ্রাম ইউরিয়া উপরিপ্রয়োগ করুন।'
      },
      {
        stage: '২য় কিস্তি (৩০-৩৫ দিন পর - সর্বোচ্চ কুশি)',
        fertilizers: 'প্রতি ১০০ গুছির জন্য ৩৫ গ্রাম ইউরিয়া উপরিপ্রয়োগ করুন।'
      },
      {
        stage: '৩য় কিস্তি (কাইচ থোড় আসার ৫-৭ দিন আগে)',
        fertilizers: 'প্রতি ১০০ গুছির জন্য ৩৫ গ্রাম ইউরিয়া ও ২৫ গ্রাম পটাশ সার প্রয়োগ করুন।'
      }
    ]
  }
};

// Aliases for varieties
['rice_boro', 'rice_aman', 'rice_aus', 'rice_aromatic'].forEach(id => {
  plantFertilizerSpecs[id] = plantFertilizerSpecs.rice;
});
['eggplant_round', 'eggplant_long', 'eggplant_bt', 'eggplant_green'].forEach(id => {
  plantFertilizerSpecs[id] = plantFertilizerSpecs.eggplant;
});

function getPlantSpec(cropKey) {
  if (!cropKey) return null;
  const clean = cropKey.toLowerCase().trim();
  
  // Direct ID check
  if (plantFertilizerSpecs[clean]) return plantFertilizerSpecs[clean];

  // Match Bengali or English keywords
  for (const [key, spec] of Object.entries(plantFertilizerSpecs)) {
    if (spec.crop_name_bn.includes(clean) || clean.includes(spec.crop_name_bn) || key.includes(clean)) {
      return spec;
    }
  }

  return null;
}

module.exports = {
  plantFertilizerSpecs,
  getPlantSpec
};

