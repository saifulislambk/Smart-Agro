#!/usr/bin/env python3
# ====================================================================
# Smart Agro (স্মার্ট এগ্রো) - Milestone 1 Adversarial Stress Test Suite
# Tests: Crop parameter fuzzing, injection resilience, unsupported species
#        rejection, cross-crop mismatch guards, and two-tier confidence/margin guards.
# Target: Python AI Microservice (http://localhost:5000/predict)
# ====================================================================

import io
import os
import sys
import json
import unicodedata
import requests
import numpy as np
from PIL import Image, ImageFilter

BASE_URL = os.environ.get('AI_SERVICE_URL', 'http://localhost:5000/predict')
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

passed = 0
failed = 0
total_tests = 0

def assert_test(cond, title, detail=""):
    global passed, failed, total_tests
    total_tests += 1
    if cond:
        print(f"  ✅ [PASS] {title}")
        passed += 1
    else:
        print(f"  ❌ [FAIL] {title} - {detail}")
        failed += 1

def make_test_image(mode='valid_leaf'):
    """Generates synthetic test images or loads benchmark images."""
    if mode == 'valid_bean':
        p = os.path.join(PROJECT_ROOT, 'test image crop disease', 'images (1).jpeg')
        if os.path.exists(p):
            with open(p, 'rb') as f:
                return f.read(), 'bean.jpg'
    elif mode == 'valid_cucumber':
        p = os.path.join(PROJECT_ROOT, 'test image crop disease', 'images (3).jpeg')
        if os.path.exists(p):
            with open(p, 'rb') as f:
                return f.read(), 'cucumber.jpg'
    elif mode == 'valid_tomato':
        p = os.path.join(PROJECT_ROOT, 'public', 'uploads', 'sample_tomato.jpg')
        if os.path.exists(p):
            with open(p, 'rb') as f:
                return f.read(), 'tomato.jpg'
    elif mode == 'tractor':
        p = os.path.join(PROJECT_ROOT, 'public', 'uploads', 'tractor_test.jpg')
        if os.path.exists(p):
            with open(p, 'rb') as f:
                return f.read(), 'tractor.jpg'
    elif mode == 'tuber':
        p = os.path.join(PROJECT_ROOT, 'public', 'uploads', 'potato_tuber_test.jpg')
        if os.path.exists(p):
            with open(p, 'rb') as f:
                return f.read(), 'tuber.jpg'

    # Fallback: synthesize valid green foliar leaf image
    img = Image.new('RGB', (224, 224), (34, 139, 34)) # Forest Green
    # Add texture/variation to have std_dev > 15
    arr = np.array(img, dtype=np.uint8)
    noise = np.random.randint(-20, 20, arr.shape, dtype=np.int16)
    arr = np.clip(arr.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    img = Image.fromarray(arr)
    buf = io.BytesIO()
    img.save(buf, format='JPEG')
    return buf.getvalue(), 'synthetic_leaf.jpg'

print("====================================================================")
print("🧪 SMART AGRO - MILESTONE 1 EMPIRICAL ADVERSARIAL STRESS TEST SUITE")
print("Target endpoint:", BASE_URL)
print("====================================================================\n")

leaf_bytes, leaf_name = make_test_image('valid_bean')

# ====================================================================
# 1. Parameter Key Fuzzing & Field Name Resilience
# ====================================================================
print("--- 1. Parameter Key Fuzzing (crop_type, crop_filter, crop_name) ---")

# A. crop_type field
res = requests.post(BASE_URL, files={'image': (leaf_name, leaf_bytes, 'image/jpeg')}, data={'crop_type': 'bean'})
d = res.json()
assert_test(d.get('success') and d.get('is_valid_crop') and d.get('mode') == 'scoped',
            "Accepts 'crop_type' parameter and scopes prediction", str(d))

# B. crop_filter field
res = requests.post(BASE_URL, files={'image': (leaf_name, leaf_bytes, 'image/jpeg')}, data={'crop_filter': 'bean'})
d = res.json()
assert_test(d.get('success') and d.get('is_valid_crop') and d.get('mode') == 'scoped',
            "Accepts 'crop_filter' parameter and scopes prediction", str(d))

# C. crop_name field
res = requests.post(BASE_URL, files={'image': (leaf_name, leaf_bytes, 'image/jpeg')}, data={'crop_name': 'bean'})
d = res.json()
assert_test(d.get('success') and d.get('is_valid_crop') and d.get('mode') == 'scoped',
            "Accepts 'crop_name' parameter and scopes prediction", str(d))

# D. Omitted crop parameter defaults to auto
res = requests.post(BASE_URL, files={'image': (leaf_name, leaf_bytes, 'image/jpeg')})
d = res.json()
assert_test(d.get('success') and d.get('is_valid_crop') and d.get('mode') == 'auto',
            "Omitted crop parameter defaults safely to 'auto' mode", str(d))

# E. Empty string or whitespace-only crop parameter defaults to auto
for empty_val in ['', '   ', '\t\n\r  ']:
    res = requests.post(BASE_URL, files={'image': (leaf_name, leaf_bytes, 'image/jpeg')}, data={'crop_type': empty_val})
    d = res.json()
    assert_test(d.get('success') and d.get('is_valid_crop') and d.get('mode') == 'auto',
                f"Whitespace-only crop parameter {repr(empty_val)} defaults safely to 'auto'", str(d))

# F. Explicit auto aliases
for auto_alias in ['auto', 'all', 'none', 'any', 'default', 'সব', 'সকল', 'অটো']:
    res = requests.post(BASE_URL, files={'image': (leaf_name, leaf_bytes, 'image/jpeg')}, data={'crop_type': auto_alias})
    d = res.json()
    assert_test(d.get('success') and d.get('is_valid_crop') and d.get('mode') == 'auto',
                f"Auto alias {repr(auto_alias)} correctly resolves to 'auto' mode", str(d))


# ====================================================================
# 2. Case, Whitespace, Punctuation & Unicode Normalization Fuzzing
# ====================================================================
print("\n--- 2. Case, Whitespace, Punctuation & Unicode Normalization ---")

# A. Uppercase & Mixed Case
for case_variant in ['BEAN', 'Bean', 'bEaN', 'TOMATO', 'ToMaTo', 'POTATO']:
    res = requests.post(BASE_URL, files={'image': (leaf_name, leaf_bytes, 'image/jpeg')}, data={'crop_type': case_variant})
    d = res.json()
    # bean will match scoped, others will trigger mismatch against bean leaf, but neither should crash or return UNSUPPORTED
    assert_test(d.get('success') and d.get('error_code') != 'UNSUPPORTED_CROP_SPECIES',
                f"Casing variation {repr(case_variant)} parsed without syntax failure", str(d))

# B. Leading / trailing / interior whitespace
for ws_variant in ['   bean   ', '\n\tbean\r\n', 'hyacinth   bean', '  শিম  ']:
    res = requests.post(BASE_URL, files={'image': (leaf_name, leaf_bytes, 'image/jpeg')}, data={'crop_type': ws_variant})
    d = res.json()
    assert_test(d.get('success') and d.get('is_valid_crop') and d.get('mode') == 'scoped',
                f"Whitespace-padded parameter {repr(ws_variant)} cleanly resolved to bean family", str(d))

# C. Punctuation & Special characters
for punct_variant in ['bean!!!', 'bean_rust', 'bean-leaf', 'bean/legume', 'bean, green']:
    res = requests.post(BASE_URL, files={'image': (leaf_name, leaf_bytes, 'image/jpeg')}, data={'crop_type': punct_variant})
    d = res.json()
    assert_test(d.get('success') and d.get('is_valid_crop') and d.get('mode') == 'scoped',
                f"Punctuation-padded parameter {repr(punct_variant)} cleanly resolved", str(d))

# D. Unicode Normalization (NFC vs NFD)
bengali_words = ['টমেটো', 'আলু', 'মরিচ', 'শিম', 'পেঁপে', 'বেগুন', 'ধান', 'পেঁয়াজ']
for word in bengali_words:
    nfc = unicodedata.normalize('NFC', word)
    nfd = unicodedata.normalize('NFD', word)
    res_nfc = requests.post(BASE_URL, files={'image': (leaf_name, leaf_bytes, 'image/jpeg')}, data={'crop_type': nfc})
    res_nfd = requests.post(BASE_URL, files={'image': (leaf_name, leaf_bytes, 'image/jpeg')}, data={'crop_type': nfd})
    d_nfc = res_nfc.json()
    d_nfd = res_nfd.json()
    assert_test(d_nfc.get('error_code') == d_nfd.get('error_code') and d_nfc.get('is_valid_crop') == d_nfd.get('is_valid_crop'),
                f"Unicode NFC vs NFD consistency for Bengali word: {word} (NFC len={len(nfc)}, NFD len={len(nfd)})",
                f"NFC: {d_nfc.get('error_code')}, NFD: {d_nfd.get('error_code')}")

# E. Zero-width characters & diacritics
for zw_variant in ['bean\u200b', 'bean\u200c', 'bean\u200d', 'শিম\u200c']:
    res = requests.post(BASE_URL, files={'image': (leaf_name, leaf_bytes, 'image/jpeg')}, data={'crop_type': zw_variant})
    d = res.json()
    assert_test(d.get('success'),
                f"Zero-width character variant {repr(zw_variant)} handled cleanly without 500 error", str(d))

# F. Mixed Bengali and English
for mixed in ['bean শিম', 'tomato টমেটো', 'আলু potato']:
    res = requests.post(BASE_URL, files={'image': (leaf_name, leaf_bytes, 'image/jpeg')}, data={'crop_type': mixed})
    d = res.json()
    assert_test(d.get('success') and d.get('error_code') != 'UNSUPPORTED_CROP_SPECIES',
                f"Bilingual parameter {repr(mixed)} resolved to supported family", str(d))


# ====================================================================
# 3. Adversarial Security Injection Attacks
# ====================================================================
print("\n--- 3. Adversarial Security Injection Attacks ---")

injection_payloads = [
    ("SQL Injection 1", "' OR '1'='1"),
    ("SQL Injection 2", "tomato'; DROP TABLE disease; --"),
    ("Command Injection 1", "bean; rm -rf /"),
    ("Command Injection 2", "$(whoami)"),
    ("Command Injection 3", "tomato && cat /etc/passwd"),
    ("XSS / Script Tag", "<script>alert('pwned')</script>"),
    ("HTML Injection", "<img src=x onerror=alert(1)>"),
    ("Directory Traversal", "../../../../etc/shadow"),
    ("Format String", "%s%s%s%s%x%n"),
    ("Buffer Fuzzing (10,000 chars)", "A" * 10000),
    ("Bengali Buffer Fuzzing (5,000 chars)", "ধান" * 5000),
    ("Null byte injection", "tomato\x00malicious")
]

for name, payload in injection_payloads:
    try:
        res = requests.post(BASE_URL, files={'image': (leaf_name, leaf_bytes, 'image/jpeg')}, data={'crop_type': payload}, timeout=10)
        assert_test(res.status_code == 200, f"Injection '{name}' responded HTTP 200 without crash", f"HTTP {res.status_code}")
        d = res.json()
        assert_test(d.get('success') is True, f"Injection '{name}' returned valid JSON schema", str(d.get('error_code')))
    except Exception as exc:
        assert_test(False, f"Injection '{name}' crashed microservice: {exc}")


# ====================================================================
# 4. Explicit Unsupported Agricultural Species Rejection (Feature F3)
# ====================================================================
print("\n--- 4. Unsupported Agricultural Species Rejection ---")

unsupported_species = [
    # English names
    ('rice', 'Rice'),
    ('paddy', 'Paddy'),
    ('eggplant', 'Eggplant'),
    ('brinjal', 'Brinjal'),
    ('aubergine', 'Aubergine'),
    ('jute', 'Jute'),
    ('tea', 'Tea'),
    ('mango', 'Mango'),
    ('wheat', 'Wheat'),
    ('mustard', 'Mustard'),
    ('onion', 'Onion'),
    ('garlic', 'Garlic'),
    ('ginger', 'Ginger'),
    ('turmeric', 'Turmeric'),
    ('banana', 'Banana'),
    ('guava', 'Guava'),
    ('betel', 'Betel'),
    ('betel leaf', 'Betel Leaf'),
    ('okra', 'Okra'),
    ('ladyfinger', 'Ladyfinger'),
    ('pointed gourd', 'Pointed Gourd'),
    ('bitter gourd', 'Bitter Gourd'),
    ('snake gourd', 'Snake Gourd'),
    ('ridge gourd', 'Ridge Gourd'),
    ('taro', 'Taro'),
    ('lentil', 'Lentil'),
    ('cotton', 'Cotton'),
    ('sugarcane', 'Sugarcane'),
    # Bengali names
    ('ধান', 'ধান'),
    ('চাল', 'চাল'),
    ('বোরো', 'বোরো'),
    ('আমন', 'আমন'),
    ('আউশ', 'আউশ'),
    ('ধানের পাতা', 'ধানের পাতা'),
    ('ধান গাছ', 'ধান গাছ'),
    ('বেগুন', 'বেগুন'),
    ('তালবেগুন', 'তালবেগুন'),
    ('বেগুনের পাতা', 'বেগুনের পাতা'),
    ('বেগুন গাছ', 'বেগুন গাছ'),
    ('পাট', 'পাট'),
    ('তোষা পাট', 'তোষা পাট'),
    ('দেশি পাট', 'দেশি পাট'),
    ('চা', 'চা'),
    ('চা পাতা', 'চা পাতা'),
    ('আম', 'আম'),
    ('আম গাছ', 'আম গাছ'),
    ('আম পাতা', 'আম পাতা'),
    ('গম', 'গম'),
    ('সরিষা', 'সরিষা'),
    ('সর্ষে', 'সর্ষে'),
    ('পেঁয়াজ', 'পেঁয়াজ'),
    ('পেঁয়াজ', 'পেঁয়াজ'),
    ('রসুন', 'রসুন'),
    ('আদা', 'আদা'),
    ('হলুদ', 'হলুদ'),
    ('কলা', 'কলা'),
    ('পেয়ারা', 'পেয়ারা'),
    ('পান', 'পান'),
    ('পান পাতা', 'পান পাতা'),
    ('ঢেঁড়শ', 'ঢেঁড়শ'),
    ('ঢেঁড়শ', 'ঢেঁড়শ'),
    ('ভেন্ডি', 'ভেন্ডি'),
    ('পটল', 'পটল'),
    ('করলা', 'করলা'),
    ('উচ্ছে', 'উচ্ছে'),
    ('চিচিঙ্গা', 'চিচিঙ্গা'),
    ('ঝিঙা', 'ঝিঙা'),
    ('কচু', 'কচু'),
    ('মসুর ডাল', 'মসুর ডাল'),
    ('তুলা', 'তুলা'),
    ('আখ', 'আখ'),
    # Random / Unknown crops
    ('unknown_crop_123', 'unknown_crop_123'),
    ('dragonfruit', 'dragonfruit'),
    ('cactus', 'cactus'),
    ('rose', 'rose'),
    ('bamboo', 'bamboo')
]

for crop_input, label in unsupported_species:
    res = requests.post(BASE_URL, files={'image': (leaf_name, leaf_bytes, 'image/jpeg')}, data={'crop_type': crop_input})
    d = res.json()
    is_rejected = (
        d.get('success') is True and
        d.get('is_valid_crop') is False and
        d.get('is_unidentified') is True and
        d.get('error_code') == 'UNSUPPORTED_CROP_SPECIES' and
        'সমর্থিত নয়' in d.get('message', '') and
        'সঠিক রোগ নির্ণয়ের জন্য পরামর্শ' in d.get('message', '')
    )
    assert_test(is_rejected,
                f"Unsupported crop '{crop_input}' rejected with UNSUPPORTED_CROP_SPECIES and Bengali advice",
                f"Got: is_valid={d.get('is_valid_crop')}, err={d.get('error_code')}")


# ====================================================================
# 5. Cross-Crop Mismatch Attacks (Feature F4)
# ====================================================================
print("\n--- 5. Cross-Crop Mismatch Attacks ---")

cucumber_bytes, cucumber_name = make_test_image('valid_cucumber')
tomato_bytes, tomato_name = make_test_image('valid_tomato')

cross_crop_attacks = [
    # (image_bytes, image_name, leaf_desc, spoofed_crop)
    (leaf_bytes, leaf_name, "Bean leaf", "potato"),
    (leaf_bytes, leaf_name, "Bean leaf", "tomato"),
    (leaf_bytes, leaf_name, "Bean leaf", "corn"),
    (leaf_bytes, leaf_name, "Bean leaf", "apple"),
    (leaf_bytes, leaf_name, "Bean leaf", "citrus"),
    (leaf_bytes, leaf_name, "Bean leaf", "grape"),
    (leaf_bytes, leaf_name, "Bean leaf", "peach"),
    (cucumber_bytes, cucumber_name, "Cucumber leaf", "potato"),
    (cucumber_bytes, cucumber_name, "Cucumber leaf", "tomato"),
    (cucumber_bytes, cucumber_name, "Cucumber leaf", "apple"),
    (cucumber_bytes, cucumber_name, "Cucumber leaf", "citrus"),
    (cucumber_bytes, cucumber_name, "Cucumber leaf", "strawberry"),
    (tomato_bytes, tomato_name, "Tomato leaf", "potato"),
    (tomato_bytes, tomato_name, "Tomato leaf", "apple"),
    (tomato_bytes, tomato_name, "Tomato leaf", "corn"),
    (tomato_bytes, tomato_name, "Tomato leaf", "grape")
]

for img_b, img_n, leaf_desc, spoofed_crop in cross_crop_attacks:
    res = requests.post(BASE_URL, files={'image': (img_n, img_b, 'image/jpeg')}, data={'crop_type': spoofed_crop})
    d = res.json()
    # Must NOT diagnose the spoofed crop as valid
    is_safe = (
        d.get('is_valid_crop') is False and
        d.get('error_code') in ['CROP_MISMATCH', 'LOW_CONFIDENCE', 'NON_LEAF_OBJECT']
    )
    assert_test(is_safe,
                f"Mismatch attack: {leaf_desc} uploaded with spoofed crop='{spoofed_crop}' caught by guard",
                f"Got: is_valid={d.get('is_valid_crop')}, err={d.get('error_code')}, class={d.get('class_name')}")


# ====================================================================
# 6. Two-Tier Confidence & Margin Guard Stress-Testing (Auto Mode) (Feature F4)
# ====================================================================
print("\n--- 6. Two-Tier Confidence & Margin Guards (Auto Mode) ---")

im_cuc = Image.open(os.path.join(PROJECT_ROOT, 'test image crop disease', 'images (2).jpeg')).convert('RGB').resize((224, 224))
im_ins = Image.open(os.path.join(PROJECT_ROOT, 'test image crop disease', 'images.jpeg')).convert('RGB').resize((224, 224))

# Scenario 1: Low Confidence (< 35.0%)
# Synthesize blend that produces top confidence < 35%
b_low_conf = Image.blend(im_cuc, im_ins, 0.10)
buf1 = io.BytesIO()
b_low_conf.save(buf1, format='JPEG')
res = requests.post(BASE_URL, files={'image': ('low_conf.jpg', buf1.getvalue(), 'image/jpeg')})
d1 = res.json()

assert_test(d1.get('is_valid_crop') is False and d1.get('error_code') == 'LOW_CONFIDENCE' and d1.get('confidence') < 35.0,
            f"Confidence guard triggered when confidence < 35.0% (got: {d1.get('confidence')}%)",
            str(d1))

# Scenario 2: Low Margin (< 4.0%) with High Confidence (> 35.0%)
# Synthesize blend that produces margin < 4.0% while confidence is 51.2%
b_low_margin = Image.blend(im_cuc, im_ins, 0.70)
buf2 = io.BytesIO()
b_low_margin.save(buf2, format='JPEG')
res = requests.post(BASE_URL, files={'image': ('low_margin.jpg', buf2.getvalue(), 'image/jpeg')})
d2 = res.json()

assert_test(d2.get('is_valid_crop') is False and d2.get('error_code') == 'LOW_CONFIDENCE' and d2.get('margin') < 4.0 and d2.get('confidence') >= 35.0,
            f"Margin guard triggered when margin < 4.0% even with conf >= 35.0% (conf: {d2.get('confidence')}%, margin: {d2.get('margin')}%)",
            str(d2))

# Scenario 3: Valid High-Confidence & High-Margin Leaf
# Bean leaf: conf 99.6%, margin 99.38%
res = requests.post(BASE_URL, files={'image': (leaf_name, leaf_bytes, 'image/jpeg')})
d3 = res.json()
assert_test(d3.get('is_valid_crop') is True and d3.get('confidence') >= 35.0 and d3.get('margin') >= 4.0,
            f"Valid leaf passes guards with high confidence and margin (conf: {d3.get('confidence')}%, margin: {d3.get('margin')}%)",
            str(d3))


# ====================================================================
# 7. Non-Leaf & Malformed Image Inputs
# ====================================================================
print("\n--- 7. Non-Leaf & Malformed Image Inputs ---")

# A. Tractor machinery rejection
tractor_bytes, tractor_name = make_test_image('tractor')
res = requests.post(BASE_URL, files={'image': (tractor_name, tractor_bytes, 'image/jpeg')})
d = res.json()
assert_test(d.get('is_valid_crop') is False and d.get('error_code') == 'NON_LEAF_OBJECT',
            "Tractor / farm machinery rejected as NON_LEAF_OBJECT", str(d))

# B. Potato tuber produce rejection
tuber_bytes, tuber_name = make_test_image('tuber')
res = requests.post(BASE_URL, files={'image': (tuber_name, tuber_bytes, 'image/jpeg')})
d = res.json()
assert_test(d.get('is_valid_crop') is False and d.get('error_code') == 'NON_LEAF_OBJECT',
            "Potato tuber harvested produce rejected as NON_LEAF_OBJECT", str(d))

# C. 0-byte corrupt image
res = requests.post(BASE_URL, files={'image': ('empty.jpg', b'', 'image/jpeg')})
assert_test(res.status_code == 200 and res.json().get('error_code') == 'NOT_AN_IMAGE',
            "0-byte empty file rejected with NOT_AN_IMAGE", str(res.json()))

# D. Corrupted text file masquerading as .jpg
res = requests.post(BASE_URL, files={'image': ('fake.jpg', b'This is plain text pretending to be JPEG', 'image/jpeg')})
assert_test(res.status_code == 200 and res.json().get('error_code') == 'NOT_AN_IMAGE',
            "Text file masquerading as image rejected with NOT_AN_IMAGE", str(res.json()))

# E. Tiny 10x10 image (< 50x50 resolution threshold)
tiny_img = Image.new('RGB', (10, 10), (0, 255, 0))
buf_tiny = io.BytesIO()
tiny_img.save(buf_tiny, format='JPEG')
res = requests.post(BASE_URL, files={'image': ('tiny.jpg', buf_tiny.getvalue(), 'image/jpeg')})
assert_test(res.status_code == 200 and res.json().get('error_code') == 'INVALID_IMAGE',
            "Tiny 10x10 image rejected as INVALID_IMAGE (<50x50)", str(res.json()))

# F. Solid white overexposed image (brightness > 248)
white_img = Image.new('RGB', (224, 224), (255, 255, 255))
buf_white = io.BytesIO()
white_img.save(buf_white, format='JPEG')
res = requests.post(BASE_URL, files={'image': ('white.jpg', buf_white.getvalue(), 'image/jpeg')})
assert_test(res.status_code == 200 and res.json().get('error_code') == 'INVALID_IMAGE',
            "Solid white overexposed image rejected as INVALID_IMAGE", str(res.json()))

# G. Solid black underexposed image (brightness < 15)
black_img = Image.new('RGB', (224, 224), (0, 0, 0))
buf_black = io.BytesIO()
black_img.save(buf_black, format='JPEG')
res = requests.post(BASE_URL, files={'image': ('black.jpg', buf_black.getvalue(), 'image/jpeg')})
assert_test(res.status_code == 200 and res.json().get('error_code') == 'INVALID_IMAGE',
            "Solid black underexposed image rejected as INVALID_IMAGE", str(res.json()))

print("\n====================================================================")
print(f"📊 SUMMARY: Total Assertions: {total_tests} | Passed: {passed} | Failed: {failed}")
print("====================================================================")

if failed > 0:
    sys.exit(1)
sys.exit(0)
