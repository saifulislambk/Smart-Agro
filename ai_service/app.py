# ====================================================================
# Smart Agro (স্মার্ট এগ্রো) - MobileNetV2 AI Inference Microservice
# Architecture: MobileNetV2 (71k images, 67 classes, 97.5% val accuracy)
# Framework: Flask + TensorFlow / Keras 3.x
# Listening Port: 5000
# ====================================================================

import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # Filter out routine info logs

import io
import json
import re
import unicodedata
from flask import Flask, request, jsonify
from PIL import Image
import numpy as np
import tensorflow as tf
import keras

app = Flask(__name__)
app.json.ensure_ascii = False

# 1. Model Resolution & Initialization
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, '..', 'model', 'smart_agro_final.keras')
CLASS_NAMES_PATH = os.path.join(BASE_DIR, '..', 'data', 'class_names.json')

print(f"🌾 [Smart Agro AI] Loading MobileNetV2 Keras Model from: {MODEL_PATH}")

try:
    model = keras.models.load_model(MODEL_PATH)
    print("✅ [Smart Agro AI] Model loaded successfully!")
    print(f"📊 [Smart Agro AI] Output classes: {model.output_shape[-1]}")
    
    # Warm-up inference on dummy tensor for instant first-hit response
    _dummy_input = np.zeros((1, 224, 224, 3), dtype=np.float32)
    model.predict(_dummy_input, verbose=0)
    print("🔥 [Smart Agro AI] Model warmup completed. Ready for incoming requests on port 5000.")
except Exception as e:
    print(f"❌ [Smart Agro AI] Fatal error loading model: {e}")
    model = None

# Pre-load ImageNet MobileNetV2 for biological non-leaf validation (tractors, vehicles, animals, machinery)
try:
    imagenet_model = tf.keras.applications.MobileNetV2(weights='imagenet')
    _dummy_mb = np.zeros((1, 224, 224, 3), dtype=np.float32)
    imagenet_model.predict(_dummy_mb, verbose=0)
    print("✅ [Smart Agro AI] ImageNet MobileNetV2 loaded for non-leaf object validation.")
except Exception as e:
    print(f"⚠️ [Smart Agro AI] Could not load ImageNet validator: {e}")
    imagenet_model = None

# Multi-Domain ImageNet Non-Leaf Pattern (Feature F1):
# Covers Machinery, Farm Equipment, Vehicles, Tools, UI Screenshots, Electronics,
# Harvested Tubers, Produce, Prepared Foods, Livestock, and Household Objects.
# Specifically excludes: camouflaging insects/reptiles/frogs, plant pots, and acorn_squash.
NON_LEAF_PATTERN = re.compile(
    r'\b('
    # 1. Machinery, Farm Equipment & Vehicles
    r'tractor|plow|plough|harvester|thresher|lawn_mower|snowplow|'
    r'cart|oxcart|horse_cart|shopping_cart|golfcart|wagon|beach_wagon|'
    r'wheelbarrow|forklift|bulldozer|crane|tank|trailer_truck|trailer|'
    r'tow_truck|garbage_truck|fire_engine|pickup|cab|taxicab|minivan|'
    r'jeep|sports_car|passenger_car|freight_car|car_wheel|car_mirror|'
    r'motorcycle|moped|motor_scooter|steam_locomotive|electric_locomotive|'
    r'half_track|submarine|aircraft_carrier|container_ship|speedboat|'
    r'airliner|warplane|airship|'
    # 2. Tools & Hardware
    r'hammer|hatchet|chain_saw|power_drill|screwdriver|anvil|'
    r'sewing_machine|cash_machine|vending_machine|'
    # 3. UI Screenshots, Digital Screens, Displays & Documents
    r'web_site|menu|screen|monitor|television|laptop|notebook|'
    r'window_screen|chain_mail|chain_armor|'
    r'hand-held_computer|cellular_telephone|modem|oscilloscope|binder|'
    r'envelope|comic_book|book_jacket|crossword_puzzle|scoreboard|'
    r'packet|carton|slide_rule|'
    # 4. Harvested Tubers, Produce, Groceries, Bakery, Prepared Food & Dining
    r'banana|spaghetti_squash|butternut_squash|bagel|pretzel|'
    r'mashed_potato|cheeseburger|hotdog|pizza|burrito|meat_loaf|'
    r'potpie|bakery|grocery_store|shopping_basket|plate|soup_bowl|'
    r'tray|ice_cream|espresso|espresso_maker|'
    # 5. Animals, Livestock & Mammals (excluding camouflaging insects/reptiles/frogs)
    r'cow|ox|bull|water_buffalo|bison|horse|zebra|pig|hog|'
    r'sheep|ram|dog|cat|elephant|camel|hippopotamus|brown_bear|'
    r'American_black_bear|ice_bear|sloth_bear|'
    # 6. Household, Clothing, Furniture
    r'suit|jean|jersey|trench_coat|shoe|boot|sandal|'
    r'desk|sofa|'
    # 7. Fabrics, Bedding, Boards, Sports Balls, Bottles & Fasteners
    r'velvet|wool|curtain|pillow|quilt|cushion|rug|carpet|mat|'
    r'chalkboard|blackboard|whiteboard|bulletin_board|'
    r'screw|nail|pin|hook|'
    r'tennis_ball|ping-pong_ball|baseball|football|basketball|croquet_ball|'
    r'water_bottle|pop_bottle|beer_bottle|pill_bottle'
    r')\b',
    re.IGNORECASE
)

# Probability thresholds:
# Top-1 threshold: catches distinct non-leaf objects even if other predictions are low
TOP1_NON_LEAF_THRESHOLD = 0.10
# Cumulative threshold: catches distributed non-leaf predictions (e.g. produce/tuber rinds)
CUMULATIVE_NON_LEAF_THRESHOLD = 0.12

def check_non_leaf_object(img_array: np.ndarray) -> tuple[bool, str]:
    """
    Checks whether the input image contains non-leaf / man-made / animal / vehicle objects
    using an ImageNet-trained MobileNetV2 classifier with dual top-1 and cumulative probability thresholds.
    """
    if imagenet_model is None:
        return False, "Validator offline"
    
    try:
        x = tf.keras.applications.mobilenet_v2.preprocess_input(np.expand_dims(img_array.copy(), axis=0))
        preds = imagenet_model.predict(x, verbose=0)
        decoded = tf.keras.applications.mobilenet_v2.decode_predictions(preds, top=5)[0]
        
        top1_code, top1_label, top1_prob = decoded[0]
        top1_prob = float(top1_prob)
        top1_hit = bool(NON_LEAF_PATTERN.search(top1_label))
        
        non_leaf_hits = []
        total_prob = 0.0
        for code, label, prob in decoded:
            if NON_LEAF_PATTERN.search(label):
                non_leaf_hits.append(label.replace('_', ' '))
                total_prob += float(prob)
                
        # Dual-threshold evaluation:
        if top1_hit and top1_prob >= TOP1_NON_LEAF_THRESHOLD:
            return True, "ছবিতে পাতার পরিবর্তে স্পষ্ট বস্তু শনাক্ত হয়েছে"
            
        if total_prob >= CUMULATIVE_NON_LEAF_THRESHOLD:
            return True, "ছবিতে পাতার পরিবর্তে অন্যান্য বস্তু শনাক্ত হয়েছে"
            
    except Exception as err:
        print(f"⚠️ Non-leaf check error: {err}")
        
    return False, "Valid"

# Optional class names loader if provided by user
class_names = []
if os.path.exists(CLASS_NAMES_PATH):
    try:
        with open(CLASS_NAMES_PATH, 'r', encoding='utf-8') as f:
            class_names = json.load(f)
        print(f"📋 [Smart Agro AI] Loaded {len(class_names)} custom class names from class_names.json")
    except Exception as e:
        print(f"⚠️ [Smart Agro AI] Could not parse class_names.json: {e}")

# ====================================================================
# Two-Tier Confidence & Margin Guard Constants (Feature F4)
# ====================================================================
CONFIDENCE_AUTO_MIN = 35.0     # Minimum confidence required for Auto-detect mode (>= 35.0%)
MARGIN_AUTO_MIN = 4.0          # Minimum margin gap (top1 - top2) for Auto-detect mode (>= 4.0%)
CONFIDENCE_SCOPED_MIN = 25.0   # Minimum confidence required within scoped family (>= 25.0%)
RAW_CROP_SUM_MIN = 0.020       # Minimum raw probability sum for selected crop family (2.0%)

# ====================================================================
# Authoritative Supported Crop Catalog (15 Families covering 67 Classes) (Feature F3)
# ====================================================================
SUPPORTED_CROP_CATALOG = {
    'tomato': {
        'bn_name': 'টমেটো',
        'en_name': 'Tomato',
        'aliases': ['tomato', 'টমেটো', 'টমেটোর পাতা', 'lycopersicon'],
        'keywords': ['tomato', 'septoria']
    },
    'potato': {
        'bn_name': 'আলু',
        'en_name': 'Potato',
        'aliases': ['potato', 'আলু', 'গোল আলু', 'আলুর পাতা', 'solanum tuberosum'],
        'keywords': ['potato']
    },
    'pepper': {
        'bn_name': 'মরিচ ও ক্যাপসিকাম',
        'en_name': 'Pepper / Chilli',
        'aliases': ['pepper', 'chili', 'chilli', 'capsicum', 'মরিচ', 'কাঁচামরিচ', 'কাঁচা মরিচ', 'ক্যাপসিকাম'],
        'keywords': ['pepper', 'chili', 'chilli']
    },
    'corn': {
        'bn_name': 'ভুট্টা',
        'en_name': 'Corn / Maize',
        'aliases': ['corn', 'maize', 'ভুট্টা', 'ভুট্টা গাছ', 'zea mays'],
        'keywords': ['corn']
    },
    'cucumber': {
        'bn_name': 'শসা, ক্ষীরা ও কুমড়া',
        'en_name': 'Cucumber / Cucurbits',
        'aliases': [
            'cucumber', 'শসা', 'শশা', 'ক্ষীরা', 'খিরা', 'কাকুড়',
            'লাউ', 'কদু', 'bottle gourd', 'কুমড়া', 'কুমড়ো', 'মিষ্টি কুমড়া', 'মিষ্টি কুমড়ো', 'pumpkin'
        ],
        'keywords': ['cucumber', 'downy', 'belly', 'gummy', 'pythium', 'angular_leaf_spot']
    },
    'squash': {
        'bn_name': 'স্কোয়াশ',
        'en_name': 'Squash',
        'aliases': ['squash', 'স্কোয়াশ', 'স্কোয়াশ', 'zucchini'],
        'keywords': ['squash']
    },
    'bean': {
        'bn_name': 'শিম ও বরবটি',
        'en_name': 'Bean',
        'aliases': ['bean', 'beans', 'শিম', 'সীম', 'বরবটি', 'hyacinth bean', 'yardlong bean'],
        'keywords': ['bean_rust', 'white mold']
    },
    'cabbage': {
        'bn_name': 'বাঁধাকপি ও ফুলকপি',
        'en_name': 'Cabbage / Cauliflower',
        'aliases': ['cabbage', 'cauliflower', 'বাঁধাকপি', 'বাধাকপি', 'ফুলকপি', 'পাতাকপি', 'কপি'],
        'keywords': ['cabbage', 'club root', 'black rot']
    },
    'citrus': {
        'bn_name': 'লেবু ও সাইট্রাস',
        'en_name': 'Citrus (Lemon / Orange / Malta)',
        'aliases': ['citrus', 'lemon', 'lime', 'orange', 'লেবু', 'কাগজি লেবু', 'কমলা', 'মাল্টা', 'বাতাবি লেবু', 'জাম্বুরা'],
        'keywords': ['citrus', 'orange', 'grenning']
    },
    'apple': {
        'bn_name': 'আপেল',
        'en_name': 'Apple',
        'aliases': ['apple', 'আপেল', 'আপেল গাছ'],
        'keywords': ['apple']
    },
    'grape': {
        'bn_name': 'আঙুর',
        'en_name': 'Grape',
        'aliases': ['grape', 'grapes', 'আঙুর', 'আঙ্গুর'],
        'keywords': ['grape']
    },
    'strawberry': {
        'bn_name': 'স্ট্রবেরি',
        'en_name': 'Strawberry',
        'aliases': ['strawberry', 'স্ট্রবেরি', 'স্ট্রবেরী'],
        'keywords': ['strawberry']
    },
    'peach': {
        'bn_name': 'পীচ',
        'en_name': 'Peach',
        'aliases': ['peach', 'পীচ', 'পিচ ফল'],
        'keywords': ['peach']
    },
    'papaya': {
        'bn_name': 'পেঁপে',
        'en_name': 'Papaya',
        'aliases': ['papaya', 'পেঁপে', 'পেপে'],
        'keywords': ['papaya', 'ring spot']
    },
    'soybean': {
        'bn_name': 'সয়াবিন',
        'en_name': 'Soybean',
        'aliases': ['soybean', 'soya', 'সয়াবিন', 'সয়াবিন'],
        'keywords': ['soybean']
    }
}

# ====================================================================
# Explicit Unsupported Agricultural Species Catalog (Feature F3)
# ====================================================================
UNSUPPORTED_CROP_CATALOG = {
    'rice': {
        'bn_name': 'ধান',
        'en_name': 'Rice / Paddy',
        'aliases': ['rice', 'paddy', 'ধান', 'চাল', 'বোরো', 'আমন', 'আউশ', 'ধানের পাতা', 'ধান গাছ']
    },
    'eggplant': {
        'bn_name': 'বেগুন',
        'en_name': 'Eggplant / Brinjal',
        'aliases': ['eggplant', 'brinjal', 'aubergine', 'বেগুন', 'তালবেগুন', 'বেগুনের পাতা', 'বেগুন গাছ']
    },
    'jute': {
        'bn_name': 'পাট',
        'en_name': 'Jute',
        'aliases': ['jute', 'পাট', 'তোষা পাট', 'দেশি পাট', 'মেস্তা', 'পাটের পাতা']
    },
    'tea': {
        'bn_name': 'চা',
        'en_name': 'Tea',
        'aliases': ['tea', 'চা', 'চা পাতা', 'চা গাছ']
    },
    'mango': {
        'bn_name': 'আম',
        'en_name': 'Mango',
        'aliases': ['mango', 'আম', 'আম গাছ', 'আম পাতা']
    },
    'wheat': {
        'bn_name': 'গম',
        'en_name': 'Wheat',
        'aliases': ['wheat', 'গম', 'গমের পাতা', 'গম গাছ']
    },
    'mustard': {
        'bn_name': 'সরিষা',
        'en_name': 'Mustard',
        'aliases': ['mustard', 'সরিষা', 'সর্ষে', 'রাই সরিষা']
    },
    'onion': {
        'bn_name': 'পেঁয়াজ',
        'en_name': 'Onion',
        'aliases': ['onion', 'পেঁয়াজ', 'পেঁয়াজ', 'পেয়াজ', 'পিয়াজ']
    },
    'garlic': {
        'bn_name': 'রসুন',
        'en_name': 'Garlic',
        'aliases': ['garlic', 'রসুন']
    },
    'ginger': {
        'bn_name': 'আদা',
        'en_name': 'Ginger',
        'aliases': ['ginger', 'আদা']
    },
    'turmeric': {
        'bn_name': 'হলুদ',
        'en_name': 'Turmeric',
        'aliases': ['turmeric', 'হলুদ']
    },
    'banana': {
        'bn_name': 'কলা',
        'en_name': 'Banana',
        'aliases': ['banana', 'কলা', 'কলা গাছ', 'কলা পাতা']
    },
    'guava': {
        'bn_name': 'পেয়ারা',
        'en_name': 'Guava',
        'aliases': ['guava', 'পেয়ারা', 'পেয়ারা']
    },
    'betel': {
        'bn_name': 'পান',
        'en_name': 'Betel Leaf',
        'aliases': ['betel', 'betel leaf', 'পান', 'পান পাতা']
    },
    'okra': {
        'bn_name': 'ঢেঁড়শ',
        'en_name': 'Okra / Ladyfinger',
        'aliases': ['okra', 'ladyfinger', 'ladys finger', 'ঢেঁড়শ', 'ঢেঁড়শ', 'ঢেঁড়স', 'ভেন্ডি']
    },
    'pointed_gourd': {
        'bn_name': 'পটল',
        'en_name': 'Pointed Gourd',
        'aliases': ['pointed gourd', 'pointed_gourd', 'পটল']
    },
    'bitter_gourd': {
        'bn_name': 'করলা / উচ্ছে',
        'en_name': 'Bitter Gourd',
        'aliases': ['bitter gourd', 'bitter_gourd', 'করলা', 'উচ্ছে']
    },
    'snake_gourd': {
        'bn_name': 'চিচিঙ্গা',
        'en_name': 'Snake Gourd',
        'aliases': ['snake gourd', 'snake_gourd', 'চিচিঙ্গা']
    },
    'ridge_gourd': {
        'bn_name': 'ঝিঙা',
        'en_name': 'Ridge Gourd',
        'aliases': ['ridge gourd', 'ridge_gourd', 'ঝিঙা', 'ঝিঙ্গা']
    },
    'taro': {
        'bn_name': 'কচু / কচুর লতি',
        'en_name': 'Taro',
        'aliases': ['taro', 'taro loti', 'কচু', 'কচুর লতি', 'মুখীকচু']
    },
    'lentil': {
        'bn_name': 'মসুর ডাল',
        'en_name': 'Lentil',
        'aliases': ['lentil', 'মসুর', 'মসুর ডাল', 'ডাল']
    },
    'cotton': {
        'bn_name': 'তুলা',
        'en_name': 'Cotton',
        'aliases': ['cotton', 'তুলা']
    },
    'sugarcane': {
        'bn_name': 'আখ',
        'en_name': 'Sugarcane',
        'aliases': ['sugarcane', 'আখ', 'কুশার']
    }
}

def normalize_crop_name(text: str) -> str:
    """Normalizes English and Bengali crop strings for robust matching."""
    if not text:
        return ""
    text = unicodedata.normalize('NFC', text)
    text = text.lower().strip()
    text = re.sub(r'[\-_/\\,;:!|]+', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def resolve_crop_request(raw_crop: str) -> tuple[str, dict | None, list[int]]:
    """
    Parses and validates the crop requested by the caller.
    Returns:
      (status, info_dict, matching_indices)
      status: 'AUTO' | 'SUPPORTED' | 'UNSUPPORTED'
    """
    norm = normalize_crop_name(raw_crop)
    if not norm or norm in ['auto', 'all', 'none', 'any', 'default', 'সব', 'সকল', 'অটো']:
        return 'AUTO', None, []

    tokens = set(norm.split())

    # 1. Exact match against Supported aliases
    for family_key, data in SUPPORTED_CROP_CATALOG.items():
        for alias in data['aliases']:
            norm_alias = normalize_crop_name(alias)
            if norm == norm_alias:
                indices = [i for i, c in enumerate(class_names) if any(kw in c.lower() for kw in data['keywords'])]
                return 'SUPPORTED', {'family': family_key, 'bn_name': data['bn_name'], 'en_name': data['en_name']}, indices

    # 2. Exact match against Unsupported aliases
    for crop_key, data in UNSUPPORTED_CROP_CATALOG.items():
        for alias in data['aliases']:
            norm_alias = normalize_crop_name(alias)
            if norm == norm_alias:
                return 'UNSUPPORTED', {'crop_key': crop_key, 'bn_name': data['bn_name'], 'en_name': data.get('en_name', ''), 'raw': raw_crop}, []

    # 3. Token match against Supported
    for family_key, data in SUPPORTED_CROP_CATALOG.items():
        for alias in data['aliases']:
            norm_alias = normalize_crop_name(alias)
            if norm_alias in tokens or (' ' in norm_alias and norm_alias in norm):
                indices = [i for i, c in enumerate(class_names) if any(kw in c.lower() for kw in data['keywords'])]
                return 'SUPPORTED', {'family': family_key, 'bn_name': data['bn_name'], 'en_name': data['en_name']}, indices

    # 4. Token match against Unsupported
    for crop_key, data in UNSUPPORTED_CROP_CATALOG.items():
        for alias in data['aliases']:
            norm_alias = normalize_crop_name(alias)
            if norm_alias in tokens or (' ' in norm_alias and norm_alias in norm):
                return 'UNSUPPORTED', {'crop_key': crop_key, 'bn_name': data['bn_name'], 'en_name': data.get('en_name', ''), 'raw': raw_crop}, []

    # 5. Substring match (alias in user text, minimum length >= 3)
    for family_key, data in SUPPORTED_CROP_CATALOG.items():
        for alias in data['aliases']:
            norm_alias = normalize_crop_name(alias)
            if len(norm_alias) >= 3 and norm_alias in norm:
                indices = [i for i, c in enumerate(class_names) if any(kw in c.lower() for kw in data['keywords'])]
                return 'SUPPORTED', {'family': family_key, 'bn_name': data['bn_name'], 'en_name': data['en_name']}, indices

    for crop_key, data in UNSUPPORTED_CROP_CATALOG.items():
        for alias in data['aliases']:
            norm_alias = normalize_crop_name(alias)
            if len(norm_alias) >= 3 and norm_alias in norm:
                return 'UNSUPPORTED', {'crop_key': crop_key, 'bn_name': data['bn_name'], 'en_name': data.get('en_name', ''), 'raw': raw_crop}, []

    # 6. Any other unlisted crop parameter is unsupported
    return 'UNSUPPORTED', {'crop_key': 'unknown', 'bn_name': raw_crop, 'en_name': raw_crop, 'raw': raw_crop}, []

def get_unsupported_crop_message(crop_display_name: str) -> str:
    """Generates polite, comprehensive Bengali guidance for unsupported crop species."""
    return (
        f"দুঃখিত, '{crop_display_name}' ফসলটি বর্তমানে স্মার্ট এগ্রো এআই ডায়াগনসিস সিস্টেমে সমর্থিত নয়।\n\n"
        "🌾 বর্তমানে আমাদের সিস্টেমে ১৫টি প্রধান ফসলের ৬৭টি রোগ ও সুস্থ পাতা শনাক্ত করা সম্ভব:\n"
        "• সবজি ও দানাশস্য: টমেটো, আলু, মরিচ, ক্যাপসিকাম, ভুট্টা, শসা, মিষ্টি কুমড়া, লাউ, স্কোয়াশ, শিম, বরবটি, বাঁধাকপি, ফুলকপি।\n"
        "• ফলমূল ও অন্যান্য: লেবু, কমলা, মাল্টা, পেঁপে, আপেল, আঙুর, স্ট্রবেরি, পীচ ও সয়াবিন।\n\n"
        "📷 সঠিক রোগ নির্ণয়ের জন্য পরামর্শ:\n"
        "১. শুধুমাত্র উপরোক্ত সমর্থিত ফসলের আক্রান্ত পাতার ছবি তুলুন।\n"
        "২. ক্যামেরার ফোকাস সরাসরি পাতার আক্রান্ত দাগের উপর রাখুন।\n"
        "৩. পর্যাপ্ত দিনের আলোতে পরিষ্কার ও ঝকঝকে ক্লোজ-আপ ছবি তুলুন।\n"
        "৪. পাতা ব্যতীত অন্য কোনো বস্তু (ফল, কন্দ, মাটি বা যন্ত্রপাতি) ছবিতে রাখবেন না।"
    )

def validate_leaf_image(image: Image.Image) -> tuple[bool, str, str]:
    """
    Validates whether the uploaded image resembles a biological crop leaf (Feature F2).
    Filters out:
    - Insufficient resolution (< 50x50)
    - Solid blank colors, overexposed whiteouts, underexposed darkness
    - Extreme digital noise / corrupted sensor patterns
    - Non-foliar objects (potato tubers, fruit, machinery, hands/skin, wood, walls, screenshots)
      via vectorized Excess Green Index (ExG), Green Dominance, and HSV foliar chlorophyll validation.
    Preserves leaves with severe rust, blight, scorch, or chlorosis lesions.

    Returns:
        tuple: (is_valid: bool, validation_msg: str, error_code: str)
               where error_code is 'OK', 'INVALID_IMAGE', or 'NON_LEAF_OBJECT'.
    """
    # 1. Resolution & Aspect Ratio Check
    if image.width < 50 or image.height < 50:
        return False, "ছবিটির আকার খুব ছোট (কমপক্ষে ৫০x৫০ পিক্সেল প্রয়োজন)", "INVALID_IMAGE"

    aspect_ratio = max(image.width, image.height) / max(min(image.width, image.height), 1)
    if aspect_ratio > 4.5:
        return False, "ছবিটির আকার অস্বাভাবিক লম্বা বা সরু", "INVALID_IMAGE"

    # Downsample to a standardized analysis size (224x224) for blazing-fast vectorized computation (<12ms)
    eval_w, eval_h = 224, 224
    if image.width != eval_w or image.height != eval_h:
        img_eval = image.resize((eval_w, eval_h), Image.Resampling.BILINEAR)
    else:
        img_eval = image

    np_img = np.array(img_eval, dtype=np.float32)

    # 2. Check spatial standard deviation per channel (detect blank, solid color or flat uniform canvas)
    spatial_std = float(np.mean(np.std(np_img, axis=(0, 1))))
    is_green_dominant = float(np.mean((np_img[:, :, 1] > np_img[:, :, 0]) & (np_img[:, :, 1] > np_img[:, :, 2]))) > 0.50
    if spatial_std < 6.0 or (spatial_std < 12.0 and is_green_dominant):
        return False, "ছবিটি সম্পূর্ণ একরঙা বা ফাঁকা", "INVALID_IMAGE"

    # 3. Check brightness extremes
    mean_val = np.mean(np_img)
    if mean_val < 15.0:
        return False, "ছবিটি অত্যন্ত অন্ধকার", "INVALID_IMAGE"
    if mean_val > 248.0:
        return False, "ছবিটি অতিরিক্ত উজ্জ্বল বা ঝাপসা", "INVALID_IMAGE"

    # 4. Check spatial noise / random static pattern
    diff_spatial = (np.mean(np.abs(np.diff(np_img, axis=0))) + np.mean(np.abs(np.diff(np_img, axis=1)))) / 2.0
    if diff_spatial > 50.0:
        return False, "ছবিটিতে অতিরিক্ত ডিজিটাল নয়েজ বা ত্রুটি রয়েছে", "INVALID_IMAGE"

    # 5. Botanical Foliage & Vegetation Index Validation
    R = np_img[:, :, 0]
    G = np_img[:, :, 1]
    B = np_img[:, :, 2]

    # A. Excess Green Index ExG = 2G - R - B
    exg = 2.0 * G - R - B

    # B. HSV Foliar Chlorophyll Spectrum
    hsv_arr = np.array(img_eval.convert('HSV'), dtype=np.float32)
    H_deg = hsv_arr[:, :, 0] * (360.0 / 255.0)  # Hue: 0° to 360°
    S = hsv_arr[:, :, 1] / 255.0                # Saturation: 0.0 to 1.0
    V = hsv_arr[:, :, 2] / 255.0                # Brightness/Value: 0.0 to 1.0

    # (i) Active Chlorophyll Green Foliage:
    # Foliar hue 45° to 160°, saturation >= 0.15, value >= 0.15, G > R, G > B, ExG > 5.0
    mask_true_green = (
        (H_deg >= 45.0) & (H_deg <= 160.0) &
        (S >= 0.15) & (V >= 0.15) &
        (G > R) & (G > B) &
        (exg > 5.0)
    )
    pct_true_green = float(np.mean(mask_true_green) * 100.0)

    # (ii) Chlorotic / Yellowing Foliar Tissue (Mosaic virus, leaf curl, nitrogen deficiency):
    # Hue: 32° to 50°, well-saturated (S >= 0.20), bright (V >= 0.25), absorbing blue (G > B + 15)
    mask_chlorotic_yellow = (
        (H_deg >= 32.0) & (H_deg < 50.0) &
        (S >= 0.20) & (V >= 0.25) &
        (G > B + 15.0) &
        (exg >= -15.0)
    )
    pct_chlorotic_yellow = float(np.mean(mask_chlorotic_yellow) * 100.0)

    # (iii) Green-Dominant Pixels across the image (G > R and G > B)
    pct_green_dom = float(np.mean((G > R) & (G > B) & (V >= 0.15) & (S >= 0.10)) * 100.0)

    # (iv) Total Active Foliar Coverage
    pct_foliar_veg = pct_true_green + pct_chlorotic_yellow

    # (v) Excess Green Positive Coverage
    pct_exg_pos = float(np.mean(exg > 5.0) * 100.0)

    # Vegetation Discrimination Rule:
    # Real crop leaves (even with severe necrosis/rust/scorch) possess 40% to 88% green foliage.
    # Non-foliar objects (potato tubers, skin, wood, walls, screenshots) have 0.0% to 0.5% green.
    has_foliage = (
        (pct_true_green >= 8.0 or (pct_true_green >= 4.0 and pct_foliar_veg >= 12.0)) and
        (pct_green_dom >= 6.0) and
        (pct_exg_pos >= 10.0)
    )

    if not has_foliage:
        return (
            False,
            f"ছবিটিতে ফসলের পাতার কোনো প্রাকৃতিক বৈশিষ্ট্য বা ক্লোরোফিলের উপস্থিতি পাওয়া যায়নি (সবুজ পাতার উপস্থিতি মাত্র {pct_true_green:.1f}%)। এটি আলু, ফলমূল, কন্দ, মাটি বা অন্য কোনো অপ্রাসঙ্গিক বস্তু হতে পারে",
            "NON_LEAF_OBJECT"
        )

    return True, "Valid", "OK"

# 2. Healthcheck Endpoint
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'smart_agro_ai_microservice',
        'model_loaded': model is not None,
        'framework': 'TensorFlow/Keras',
        'num_classes': 67,
        'has_custom_class_names': len(class_names) == 67
    }), 200

# 3. Prediction Endpoint (/predict)
@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({
            'success': False,
            'error': 'AI Model not loaded or unavailable on server'
        }), 503

    # Accept either 'image' or 'file' key in multipart form
    file = request.files.get('image') or request.files.get('file')
    if not file or file.filename == '':
        return jsonify({
            'success': False,
            'error': 'কোনো ছবি পাওয়া যায়নি (No image file uploaded)'
        }), 400

    try:
        # A. Read image bytes with PIL
        raw_bytes = file.read()
        try:
            image = Image.open(io.BytesIO(raw_bytes))
            image.load()
            if image.mode != 'RGB':
                image = image.convert('RGB')
        except Exception as img_read_err:
            return jsonify({
                'success': True,
                'is_valid_crop': False,
                'error_code': 'NOT_AN_IMAGE',
                'message': 'ফাইলটি কোনো বৈধ ছবি নয় অথবা ফাইলটি ক্ষতিগ্রস্ত হয়েছে। অনুগ্রহ করে একটি পরিষ্কার JPG/PNG ছবি আপলোড করুন।'
            }), 200

        # B. Read and validate requested crop parameter (Feature F3)
        raw_crop = (request.form.get('crop_type') or request.form.get('crop_filter') or request.form.get('crop_name') or '').strip()
        crop_status, crop_info, matching_indices = resolve_crop_request(raw_crop)

        # F3: Reject unsupported crop species immediately before neural prediction
        if crop_status == 'UNSUPPORTED':
            crop_display = crop_info['bn_name'] if crop_info else raw_crop
            return jsonify({
                'success': True,
                'is_valid_crop': False,
                'is_unidentified': True,
                'error_code': 'UNSUPPORTED_CROP_SPECIES',
                'crop_requested': crop_display,
                'message': get_unsupported_crop_message(crop_display)
            }), 200

        # C. Validate image quality and biological features (Feature F2)
        is_valid, validation_msg, error_code = validate_leaf_image(image)
        if not is_valid:
            return jsonify({
                'success': True,
                'is_valid_crop': False,
                'is_unidentified': True,
                'error_code': error_code,
                'message': f"ছবিটি শনাক্ত করা সম্ভব হয়নি: {validation_msg}। রোগ নির্ণয়ের জন্য ক্যামেরার কাছে এনে শুধুমাত্র আক্রান্ত পাতার একটি পরিষ্কার ক্লোজ-আপ ছবি তুলুন।"
            }), 200

        # D. Resize to exact MobileNetV2 input dimensions (224x224)
        image = image.resize((224, 224), Image.Resampling.LANCZOS)

        # E. Convert PIL image to NumPy array and expand batch dimension
        img_array = keras.preprocessing.image.img_to_array(image)

        # F. Non-leaf / Machinery / Vehicle / Animal / Produce Filter (Feature F1)
        is_non_leaf, non_leaf_msg = check_non_leaf_object(img_array)
        if is_non_leaf:
            return jsonify({
                'success': True,
                'is_valid_crop': False,
                'is_unidentified': True,
                'error_code': 'NON_LEAF_OBJECT',
                'message': "ছবিটি শনাক্ত করা সম্ভব হয়নি: এটি কোনো ফসলের পাতার ছবি নয় (ছবিতে যন্ত্রপাতি, যানবাহন বা অপ্রাসঙ্গিক বস্তু শনাক্ত হয়েছে)। রোগ নির্ণয়ের জন্য ক্যামেরার কাছে এনে শুধুমাত্র আক্রান্ত পাতার একটি পরিষ্কার ক্লোজ-আপ ছবি তুলুন।"
            }), 200

        img_batch = tf.expand_dims(img_array, axis=0)

        # G. Forward pass inference
        predictions = model.predict(img_batch, verbose=0)[0]

        if crop_status == 'SUPPORTED' and matching_indices and len(matching_indices) > 0:
            # ====================================================================
            # Tier 2: Scoped Mode (Crop-specific restricted prediction) (Feature F4)
            # ====================================================================
            sub_preds = np.array([predictions[i] for i in matching_indices])
            raw_crop_sum = float(np.sum(sub_preds))
            raw_crop_max = float(np.max(sub_preds))

            # Cross-Crop Mismatch Dominance Guard (Feature F4)
            top_global_idx = int(np.argmax(predictions))
            top_global_prob = float(predictions[top_global_idx])
            top_global_name = class_names[top_global_idx] if (class_names and top_global_idx < len(class_names)) else ""

            is_global_in_family = (
                top_global_idx in matching_indices or
                (crop_info['family'] == 'tomato' and 'pepper' in top_global_name.lower()) or
                (crop_info['family'] == 'pepper' and 'tomato' in top_global_name.lower())
            )

            is_mismatch = (
                raw_crop_sum < 0.020 or
                (not is_global_in_family and top_global_prob >= 0.25 and top_global_prob > 2.5 * raw_crop_sum)
            )

            if is_mismatch:
                c_name = class_names[top_global_idx] if (class_names and top_global_idx < len(class_names)) else f"Class_{top_global_idx}"
                return jsonify({
                    'success': True,
                    'is_valid_crop': False,
                    'is_unidentified': True,
                    'error_code': 'CROP_MISMATCH',
                    'crop_selected': crop_info['bn_name'],
                    'global_detected': c_name,
                    'raw_crop_confidence': round(raw_crop_sum * 100.0, 4),
                    'message': (
                        f"নির্বাচিত ফসলের ('{crop_info['bn_name']}') সাথে ছবির পাতার কোনো মিল পাওয়া যায়নি "
                        f"(সম্ভাবনা মাত্র {round(raw_crop_sum * 100.0, 2)}%)। "
                        "অনুগ্রহ করে নির্বাচিত ফসলের আক্রান্ত পাতার সঠিক ছবি আপলোড করুন।"
                    )
                }), 200

            sub_probs = sub_preds / (raw_crop_sum + 1e-9)
            best_local = int(np.argmax(sub_probs))
            top_idx = matching_indices[best_local]
            confidence = round(float(sub_probs[best_local]) * 100.0, 2)

            # Sort remaining candidates within family
            top_family_locals = np.argsort(sub_probs)[::-1]
            top_candidates = []
            for rank in range(min(3, len(top_family_locals))):
                idx = matching_indices[top_family_locals[rank]]
                c_name = class_names[idx] if (class_names and idx < len(class_names)) else f"Class_{idx}"
                top_candidates.append({
                    'class_index': idx,
                    'class_name': c_name,
                    'confidence': round(float(sub_probs[top_family_locals[rank]]) * 100.0, 2)
                })
            second_confidence = round(float(sub_probs[top_family_locals[1]]) * 100.0, 2) if len(top_family_locals) > 1 else 0.0
            margin = round(confidence - second_confidence, 2)

            # F4: Scoped Mode Confidence Guard (>= 25.0%)
            if confidence < CONFIDENCE_SCOPED_MIN:
                return jsonify({
                    'success': True,
                    'is_valid_crop': False,
                    'is_unidentified': True,
                    'error_code': 'LOW_CONFIDENCE',
                    'confidence': confidence,
                    'margin': margin,
                    'mode': 'scoped',
                    'crop_family': crop_info['bn_name'],
                    'message': (
                        f"নির্বাচিত ফসলের ('{crop_info['bn_name']}') জন্য ছবিটি পর্যাপ্ত স্পষ্ট নয় "
                        f"অথবা রোগের লক্ষণ নিশ্চিত করা সম্ভব হয়নি (কনফিডেন্স: {confidence}%)। "
                        "অনুগ্রহ করে পর্যাপ্ত আলোতে আক্রান্ত পাতার একটি পরিষ্কার ক্লোজ-আপ ছবি আপলোড করুন।"
                    )
                }), 200

        else:
            # ====================================================================
            # Tier 1: Auto-Detect Mode (Global 67-class argmax) (Feature F4)
            # ====================================================================
            top_indices = np.argsort(predictions)[::-1]
            top_idx = int(top_indices[0])
            confidence = round(float(predictions[top_idx]) * 100.0, 2)
            second_confidence = round(float(predictions[top_indices[1]]) * 100.0, 2)
            margin = round(confidence - second_confidence, 2)

            top_candidates = []
            for i in range(min(3, len(top_indices))):
                idx = int(top_indices[i])
                c_name = class_names[idx] if (class_names and idx < len(class_names)) else f"Class_{idx}"
                top_candidates.append({
                    'class_index': idx,
                    'class_name': c_name,
                    'confidence': round(float(predictions[idx]) * 100.0, 2)
                })

            # F4: Auto-Detect Mode Two-Tier Confidence & Margin Guard (Confidence >= 35.0%, Margin >= 4.0%)
            if confidence < CONFIDENCE_AUTO_MIN or margin < MARGIN_AUTO_MIN:
                return jsonify({
                    'success': True,
                    'is_valid_crop': False,
                    'is_unidentified': True,
                    'error_code': 'LOW_CONFIDENCE',
                    'confidence': confidence,
                    'second_confidence': second_confidence,
                    'margin': margin,
                    'mode': 'auto',
                    'top_candidates': top_candidates,
                    'message': (
                        f"ছবিটি কোনো সমর্থিত পরিচিত ফসলের সাথে নিশ্চিতভাবে মিলছে না "
                        f"(কনফিডেন্স: {confidence}%, ব্যবধান: {margin}%)। "
                        "সঠিক রোগ নির্ণয়ের জন্য অনুগ্রহ করে পর্যাপ্ত আলোতে আক্রান্ত পাতার একটি স্পষ্ট ও বড় ক্লোজ-আপ ছবি তুলুন।"
                    )
                }), 200

        c_name_primary = class_names[top_idx] if (class_names and top_idx < len(class_names)) else f"Class_{top_idx}"

        return jsonify({
            'success': True,
            'is_valid_crop': True,
            'class_index': top_idx,
            'class_name': c_name_primary,
            'confidence': confidence,
            'margin': margin,
            'mode': 'scoped' if crop_status == 'SUPPORTED' else 'auto',
            'top_candidates': top_candidates
        }), 200

    except (Image.UnidentifiedImageError, IOError) as img_err:
        return jsonify({
            'success': True,
            'is_valid_crop': False,
            'error_code': 'NOT_AN_IMAGE',
            'message': 'ফাইলটি কোনো বৈধ ছবি নয় অথবা ফাইলটি নষ্ট হয়ে গেছে। অনুগ্রহ করে একটি পরিষ্কার JPG/PNG ছবি আপলোড করুন।'
        }), 200
    except Exception as err:
        print(f"❌ [Smart Agro AI] Inference error: {err}")
        return jsonify({
            'success': False,
            'error': str(err)
        }), 500

if __name__ == '__main__':
    # Dynamic port binding (default 5000, or 7860 for Hugging Face Spaces / cloud environments)
    port = int(os.environ.get('PORT', 5000))
    print(f"🚀 [Smart Agro AI] Starting microservice on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=False)
