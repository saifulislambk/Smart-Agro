#!/usr/bin/env python3
"""
Empirical Adversarial Challenge & Stress-Test Suite for Milestone 1 (ai_service/app.py).
Tests:
- Category A: Corrupt, Degenerate & Extreme Boundary Images
- Category B: Non-Plant / Out-of-Scope Objects (Machinery, Produce, Skin, Furniture, Food, Green Objects)
- Category C: Genuine Leaves & Heavily Diseased / Stressed Leaves (Necrosis, Chlorosis, Scoped filters)
- Category D: Unsupported Crop Species Dispatches
"""

import os
import io
import sys
import shutil
import tempfile
import requests
import numpy as np
from PIL import Image, ImageDraw

ENDPOINT = "http://localhost:5000/predict"
TMP_DIR = "/tmp/adversarial_challenge_m1"
os.makedirs(TMP_DIR, exist_ok=True)

results = {
    "passed": 0,
    "failed": 0,
    "total": 0,
    "details": []
}

def record_test(category, name, passed, expected, actual, response_json=None):
    results["total"] += 1
    if passed:
        results["passed"] += 1
        print(f"  ✅ [PASS] [{category}] {name}")
    else:
        results["failed"] += 1
        print(f"  ❌ [FAIL] [{category}] {name} | Expected: {expected} | Actual: {actual}")
    results["details"].append({
        "category": category,
        "name": name,
        "passed": passed,
        "expected": expected,
        "actual": actual,
        "response": response_json
    })

def post_file(file_path_or_bytes, filename="test.jpg", data=None):
    if data is None:
        data = {}
    if isinstance(file_path_or_bytes, bytes):
        files = {"image": (filename, file_path_or_bytes, "image/jpeg")}
    else:
        files = {"image": (filename, open(file_path_or_bytes, "rb"), "image/jpeg")}
    try:
        resp = requests.post(ENDPOINT, files=files, data=data, timeout=10)
        return resp.status_code, resp.json()
    except Exception as e:
        return 500, {"error": str(e)}

# ====================================================================
# CATEGORY A: Corrupt, Degenerate & Extreme Boundary Images
# ====================================================================
print("\n" + "="*60)
print("CATEGORY A: Corrupt, Degenerate & Boundary Images")
print("="*60)

# A1: Zero-byte empty file
status, body = post_file(b"", "empty.jpg")
record_test("A1_Corrupt", "Zero-byte file",
            body.get("is_valid_crop") is False and body.get("error_code") == "NOT_AN_IMAGE",
            "is_valid_crop=False, error_code=NOT_AN_IMAGE",
            f"code={body.get('error_code')}, valid={body.get('is_valid_crop')}", body)

# A2: Corrupted random bytes (50KB of non-image binary data)
status, body = post_file(os.urandom(50000), "random_corrupt.jpg")
record_test("A2_Corrupt", "50KB pseudo-random non-image bytes",
            body.get("is_valid_crop") is False and body.get("error_code") == "NOT_AN_IMAGE",
            "is_valid_crop=False, error_code=NOT_AN_IMAGE",
            f"code={body.get('error_code')}, valid={body.get('is_valid_crop')}", body)

# A3: Truncated JPEG (valid SOI header but truncated data)
truncated_bytes = b"\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xFF\xDB\x00C\x00" + os.urandom(30)
status, body = post_file(truncated_bytes, "truncated.jpg")
record_test("A3_Corrupt", "Truncated partial JPEG bytes",
            body.get("is_valid_crop") is False and body.get("error_code") in ["NOT_AN_IMAGE", "INVALID_IMAGE"],
            "Rejected as invalid image",
            f"code={body.get('error_code')}, valid={body.get('is_valid_crop')}", body)

# A4: Plaintext file with .jpg extension
status, body = post_file(b"This is just a plain text file pretending to be JPEG\nHello World!", "fake.jpg")
record_test("A4_Corrupt", "Plain text file renamed to .jpg",
            body.get("is_valid_crop") is False and body.get("error_code") == "NOT_AN_IMAGE",
            "is_valid_crop=False, error_code=NOT_AN_IMAGE",
            f"code={body.get('error_code')}, valid={body.get('is_valid_crop')}", body)

# A5: Tiny image (49x49 < 50x50 resolution threshold)
im_tiny = Image.new("RGB", (49, 49), color=(34, 139, 34))
buf = io.BytesIO(); im_tiny.save(buf, format="JPEG"); buf.seek(0)
status, body = post_file(buf.getvalue(), "tiny_49x49.jpg")
record_test("A5_Resolution", "Below min resolution (49x49 < 50x50)",
            body.get("is_valid_crop") is False and body.get("error_code") == "INVALID_IMAGE",
            "is_valid_crop=False, error_code=INVALID_IMAGE",
            f"code={body.get('error_code')}, msg={body.get('message')[:40] if body.get('message') else ''}", body)

# A6: Sub-50 width (45x200)
im_narrow = Image.new("RGB", (45, 200), color=(34, 139, 34))
buf = io.BytesIO(); im_narrow.save(buf, format="JPEG"); buf.seek(0)
status, body = post_file(buf.getvalue(), "narrow_45x200.jpg")
record_test("A6_Resolution", "Sub-50 width (45x200)",
            body.get("is_valid_crop") is False and body.get("error_code") == "INVALID_IMAGE",
            "is_valid_crop=False, error_code=INVALID_IMAGE",
            f"code={body.get('error_code')}", body)

# A7: Sub-50 height (200x45)
im_short = Image.new("RGB", (200, 45), color=(34, 139, 34))
buf = io.BytesIO(); im_short.save(buf, format="JPEG"); buf.seek(0)
status, body = post_file(buf.getvalue(), "short_200x45.jpg")
record_test("A7_Resolution", "Sub-50 height (200x45)",
            body.get("is_valid_crop") is False and body.get("error_code") == "INVALID_IMAGE",
            "is_valid_crop=False, error_code=INVALID_IMAGE",
            f"code={body.get('error_code')}", body)

# A8: 1x1 single pixel
im_1px = Image.new("RGB", (1, 1), color=(0, 255, 0))
buf = io.BytesIO(); im_1px.save(buf, format="PNG"); buf.seek(0)
status, body = post_file(buf.getvalue(), "pixel_1x1.png")
record_test("A8_Resolution", "1x1 single pixel",
            body.get("is_valid_crop") is False and body.get("error_code") == "INVALID_IMAGE",
            "is_valid_crop=False, error_code=INVALID_IMAGE",
            f"code={body.get('error_code')}", body)

# A9: Extreme Aspect Ratio Tall (50x2500, ratio 1:50) - solid green background
im_extreme_tall = Image.new("RGB", (50, 2500), color=(40, 140, 40))
buf = io.BytesIO(); im_extreme_tall.save(buf, format="JPEG"); buf.seek(0)
status, body = post_file(buf.getvalue(), "extreme_tall_50x2500.jpg")
record_test("A9_AspectRatio", "Extreme aspect ratio tall (50x2500)",
            body.get("is_valid_crop") is False, # Must be rejected (either solid or low confidence/invalid)
            "is_valid_crop=False",
            f"valid={body.get('is_valid_crop')}, code={body.get('error_code')}", body)

# A10: Extreme Aspect Ratio Wide (2500x50, ratio 50:1)
im_extreme_wide = Image.new("RGB", (2500, 50), color=(40, 140, 40))
buf = io.BytesIO(); im_extreme_wide.save(buf, format="JPEG"); buf.seek(0)
status, body = post_file(buf.getvalue(), "extreme_wide_2500x50.jpg")
record_test("A10_AspectRatio", "Extreme aspect ratio wide (2500x50)",
            body.get("is_valid_crop") is False,
            "is_valid_crop=False",
            f"valid={body.get('is_valid_crop')}, code={body.get('error_code')}", body)

# A11: Pure solid black (0, 0, 0)
im_black = Image.new("RGB", (224, 224), color=(0, 0, 0))
buf = io.BytesIO(); im_black.save(buf, format="JPEG"); buf.seek(0)
status, body = post_file(buf.getvalue(), "solid_black.jpg")
record_test("A11_Solid", "Pure solid black RGB(0,0,0)",
            body.get("is_valid_crop") is False and body.get("error_code") == "INVALID_IMAGE",
            "error_code=INVALID_IMAGE",
            f"code={body.get('error_code')}", body)

# A12: Pure solid white (255, 255, 255)
im_white = Image.new("RGB", (224, 224), color=(255, 255, 255))
buf = io.BytesIO(); im_white.save(buf, format="JPEG"); buf.seek(0)
status, body = post_file(buf.getvalue(), "solid_white.jpg")
record_test("A12_Solid", "Pure solid white RGB(255,255,255)",
            body.get("is_valid_crop") is False and body.get("error_code") == "INVALID_IMAGE",
            "error_code=INVALID_IMAGE",
            f"code={body.get('error_code')}", body)

# A13: Pure solid red (255, 0, 0)
im_red = Image.new("RGB", (224, 224), color=(255, 0, 0))
buf = io.BytesIO(); im_red.save(buf, format="JPEG"); buf.seek(0)
status, body = post_file(buf.getvalue(), "solid_red.jpg")
record_test("A13_Solid", "Pure solid red RGB(255,0,0)",
            body.get("is_valid_crop") is False, # Rejected (either invalid image or non-leaf)
            "is_valid_crop=False",
            f"code={body.get('error_code')}", body)

# A14: Pure solid green (0, 255, 0) - tests that std_dev < 15 catches solid green
im_green = Image.new("RGB", (224, 224), color=(0, 255, 0))
buf = io.BytesIO(); im_green.save(buf, format="JPEG"); buf.seek(0)
status, body = post_file(buf.getvalue(), "solid_green.jpg")
record_test("A14_Solid", "Pure solid green RGB(0,255,0)",
            body.get("is_valid_crop") is False and body.get("error_code") == "INVALID_IMAGE",
            "error_code=INVALID_IMAGE",
            f"code={body.get('error_code')}", body)

# A15: Pure solid gray (128, 128, 128)
im_gray = Image.new("RGB", (224, 224), color=(128, 128, 128))
buf = io.BytesIO(); im_gray.save(buf, format="JPEG"); buf.seek(0)
status, body = post_file(buf.getvalue(), "solid_gray.jpg")
record_test("A15_Solid", "Pure solid gray RGB(128,128,128)",
            body.get("is_valid_crop") is False and body.get("error_code") == "INVALID_IMAGE",
            "error_code=INVALID_IMAGE",
            f"code={body.get('error_code')}", body)

# A16: Pitch-black underexposed (mean < 15, subtle variation with std > 15)
arr_dark = np.random.randint(0, 18, (224, 224, 3), dtype=np.uint8) # mean ~ 9
im_dark = Image.fromarray(arr_dark)
buf = io.BytesIO(); im_dark.save(buf, format="JPEG"); buf.seek(0)
status, body = post_file(buf.getvalue(), "underexposed_dark.jpg")
record_test("A16_Extremes", "Pitch-black underexposed (mean < 15)",
            body.get("is_valid_crop") is False and body.get("error_code") == "INVALID_IMAGE",
            "error_code=INVALID_IMAGE",
            f"code={body.get('error_code')}", body)

# A17: Overexposed whiteout (mean > 248)
arr_bright = np.random.randint(245, 256, (224, 224, 3), dtype=np.uint8) # mean ~ 250
im_bright = Image.fromarray(arr_bright)
buf = io.BytesIO(); im_bright.save(buf, format="JPEG"); buf.seek(0)
status, body = post_file(buf.getvalue(), "overexposed_whiteout.jpg")
record_test("A17_Extremes", "Overexposed whiteout (mean > 248)",
            body.get("is_valid_crop") is False and body.get("error_code") == "INVALID_IMAGE",
            "error_code=INVALID_IMAGE",
            f"code={body.get('error_code')}", body)

# A18: High spatial noise / digital static (diff_spatial > 50)
arr_noise = np.random.randint(0, 256, (224, 224, 3), dtype=np.uint8)
im_noise = Image.fromarray(arr_noise)
buf = io.BytesIO(); im_noise.save(buf, format="JPEG"); buf.seek(0)
status, body = post_file(buf.getvalue(), "digital_static.jpg")
record_test("A18_Noise", "Full-spectrum digital static / spatial noise",
            body.get("is_valid_crop") is False and body.get("error_code") == "INVALID_IMAGE",
            "error_code=INVALID_IMAGE",
            f"code={body.get('error_code')}", body)

# A19: Salt and pepper binary impulse noise
arr_sp = np.zeros((224, 224, 3), dtype=np.uint8)
mask_sp = np.random.rand(224, 224) > 0.5
arr_sp[mask_sp] = 255
im_sp = Image.fromarray(arr_sp)
buf = io.BytesIO(); im_sp.save(buf, format="JPEG"); buf.seek(0)
status, body = post_file(buf.getvalue(), "salt_pepper_noise.jpg")
record_test("A19_Noise", "Salt and pepper binary impulse noise",
            body.get("is_valid_crop") is False and body.get("error_code") == "INVALID_IMAGE",
            "error_code=INVALID_IMAGE",
            f"code={body.get('error_code')}", body)

# ====================================================================
# CATEGORY B: Non-Plant / Out-of-Scope Objects
# ====================================================================
print("\n" + "="*60)
print("CATEGORY B: Non-Plant / Out-of-Scope Objects")
print("="*60)

# B1: Farm Machinery (Tractor)
status, body = post_file("public/uploads/tractor_test.jpg", "tractor.jpg")
record_test("B1_NonPlant", "Machinery: tractor_test.jpg",
            body.get("is_valid_crop") is False and body.get("error_code") == "NON_LEAF_OBJECT",
            "is_valid_crop=False, error_code=NON_LEAF_OBJECT",
            f"code={body.get('error_code')}, valid={body.get('is_valid_crop')}", body)

# B2: Potato Tuber (Harvested produce)
status, body = post_file("public/uploads/potato_tuber_test.jpg", "potato_tuber.jpg")
record_test("B2_NonPlant", "Harvested tuber: potato_tuber_test.jpg",
            body.get("is_valid_crop") is False and body.get("error_code") == "NON_LEAF_OBJECT",
            "is_valid_crop=False, error_code=NON_LEAF_OBJECT",
            f"code={body.get('error_code')}, valid={body.get('is_valid_crop')}", body)

# B3: Potato Tuber Duplicate (sample_potato.jpg)
status, body = post_file("public/uploads/sample_potato.jpg", "sample_potato.jpg", data={"crop_type": "potato"})
record_test("B3_NonPlant", "Harvested tuber with crop=potato: sample_potato.jpg",
            body.get("is_valid_crop") is False and body.get("error_code") == "NON_LEAF_OBJECT",
            "is_valid_crop=False, error_code=NON_LEAF_OBJECT",
            f"code={body.get('error_code')}, valid={body.get('is_valid_crop')}", body)

# B4: Synthesized Skin Tones (Hand / Face proxy: warm tones R~200, G~140, B~110 with organic gradient)
arr_skin = np.zeros((224, 224, 3), dtype=np.uint8)
for y in range(224):
    for x in range(224):
        # Varying Fitzpatrick skin tone palette
        r = int(np.clip(210 + np.sin(x/30)*15, 0, 255))
        g = int(np.clip(150 + np.cos(y/30)*15, 0, 255))
        b = int(np.clip(115 + np.sin((x+y)/40)*10, 0, 255))
        arr_skin[y, x] = [r, g, b]
im_skin = Image.fromarray(arr_skin)
buf = io.BytesIO(); im_skin.save(buf, format="JPEG"); buf.seek(0)
status, body = post_file(buf.getvalue(), "skin_tone.jpg")
record_test("B4_NonPlant", "Human skin tone texture (hand/face proxy)",
            body.get("is_valid_crop") is False and body.get("error_code") == "NON_LEAF_OBJECT",
            "error_code=NON_LEAF_OBJECT",
            f"code={body.get('error_code')}, valid={body.get('is_valid_crop')}", body)

# B5: Furniture / Wood texture (Desk / Table proxy: brown hues R~150, G~95, B~55)
arr_wood = np.zeros((224, 224, 3), dtype=np.uint8)
for y in range(224):
    grain = int(np.sin(y / 4.0) * 20)
    arr_wood[y, :] = [np.clip(140 + grain, 0, 255), np.clip(90 + grain, 0, 255), np.clip(50 + grain//2, 0, 255)]
im_wood = Image.fromarray(arr_wood)
buf = io.BytesIO(); im_wood.save(buf, format="JPEG"); buf.seek(0)
status, body = post_file(buf.getvalue(), "wood_furniture.jpg")
record_test("B5_NonPlant", "Wood grain furniture / table proxy",
            body.get("is_valid_crop") is False and body.get("error_code") == "NON_LEAF_OBJECT",
            "error_code=NON_LEAF_OBJECT",
            f"code={body.get('error_code')}, valid={body.get('is_valid_crop')}", body)

# B6: Red Brick Wall / Masonry (R~175, G~70, B~60)
arr_brick = np.zeros((224, 224, 3), dtype=np.uint8)
for y in range(224):
    for x in range(224):
        # Brick pattern with mortar lines
        if y % 28 in [0, 1] or (x + (30 if (y//28)%2 else 0)) % 60 in [0, 1]:
            arr_brick[y, x] = [200, 200, 195] # Mortar
        else:
            arr_brick[y, x] = [170 + (x%15), 65 + (y%10), 55]
im_brick = Image.fromarray(arr_brick)
buf = io.BytesIO(); im_brick.save(buf, format="JPEG"); buf.seek(0)
status, body = post_file(buf.getvalue(), "brick_wall.jpg")
record_test("B6_NonPlant", "Red brick masonry wall",
            body.get("is_valid_crop") is False and body.get("error_code") == "NON_LEAF_OBJECT",
            "error_code=NON_LEAF_OBJECT",
            f"code={body.get('error_code')}, valid={body.get('is_valid_crop')}", body)

# B7: Prepared Food / Pizza proxy (dough crust R~210, G~160, B~90; cheese R~240, G~200, B~80; sauce R~180, G~40, B~30)
im_pizza = Image.new("RGB", (224, 224), color=(220, 180, 110))
draw = ImageDraw.Draw(im_pizza)
draw.ellipse([20, 20, 204, 204], fill=(240, 195, 75), outline=(190, 80, 30), width=8)
# Add red pepperoni discs
for cx, cy in [(60, 60), (160, 70), (110, 110), (70, 150), (150, 155)]:
    draw.ellipse([cx-18, cy-18, cx+18, cy+18], fill=(160, 35, 25))
buf = io.BytesIO(); im_pizza.save(buf, format="JPEG"); buf.seek(0)
status, body = post_file(buf.getvalue(), "pizza_food.jpg")
record_test("B7_NonPlant", "Prepared food (pizza proxy)",
            body.get("is_valid_crop") is False and body.get("error_code") == "NON_LEAF_OBJECT",
            "error_code=NON_LEAF_OBJECT",
            f"code={body.get('error_code')}, valid={body.get('is_valid_crop')}", body)

# B8: Document / UI Screenshot with text lines
im_doc = Image.new("RGB", (224, 224), color=(250, 250, 250))
draw = ImageDraw.Draw(im_doc)
draw.rectangle([10, 10, 214, 30], fill=(60, 100, 180)) # Title bar
for row_y in range(45, 210, 14):
    draw.line([(20, row_y), (200, row_y)], fill=(50, 50, 50), width=3) # Text lines
buf = io.BytesIO(); im_doc.save(buf, format="JPEG"); buf.seek(0)
status, body = post_file(buf.getvalue(), "document_screenshot.jpg")
record_test("B8_NonPlant", "Document / UI screenshot with text lines",
            body.get("is_valid_crop") is False and body.get("error_code") == "NON_LEAF_OBJECT",
            "error_code=NON_LEAF_OBJECT",
            f"code={body.get('error_code')}, valid={body.get('is_valid_crop')}", body)

# B9: Blue sky with clouds (R~120, G~170, B~240)
arr_sky = np.zeros((224, 224, 3), dtype=np.uint8)
for y in range(224):
    for x in range(224):
        cloud = int(np.clip(np.sin(x/25) * np.cos(y/20) * 40, 0, 80))
        arr_sky[y, x] = [120 + cloud, 170 + cloud, 240]
im_sky = Image.fromarray(arr_sky)
buf = io.BytesIO(); im_sky.save(buf, format="JPEG"); buf.seek(0)
status, body = post_file(buf.getvalue(), "blue_sky.jpg")
record_test("B9_NonPlant", "Blue sky and clouds",
            body.get("is_valid_crop") is False and body.get("error_code") == "NON_LEAF_OBJECT",
            "error_code=NON_LEAF_OBJECT",
            f"code={body.get('error_code')}, valid={body.get('is_valid_crop')}", body)

# B10: Concrete / asphalt roadway (uniform gray texture)
arr_road = np.random.randint(90, 120, (224, 224, 3), dtype=np.uint8)
im_road = Image.fromarray(arr_road)
buf = io.BytesIO(); im_road.save(buf, format="JPEG"); buf.seek(0)
status, body = post_file(buf.getvalue(), "concrete_road.jpg")
record_test("B10_NonPlant", "Concrete / asphalt road texture",
            body.get("is_valid_crop") is False,
            "is_valid_crop=False (rejected)",
            f"code={body.get('error_code')}, valid={body.get('is_valid_crop')}", body)

# B11: Adversarial Green Non-Plant: Green Chalkboard
# Matte dark green surface with slight chalk dust texture (R=45, G=85, B=55)
arr_board = np.zeros((224, 224, 3), dtype=np.uint8)
dust = np.random.randint(-15, 15, (224, 224))
arr_board[:, :, 0] = np.clip(45 + dust, 0, 255)
arr_board[:, :, 1] = np.clip(85 + dust, 0, 255)
arr_board[:, :, 2] = np.clip(55 + dust, 0, 255)
im_board = Image.fromarray(arr_board)
buf = io.BytesIO(); im_board.save(buf, format="JPEG"); buf.seek(0)
status, body = post_file(buf.getvalue(), "green_chalkboard.jpg")
# Because it's not a leaf, it should either be caught by foliage rules or low confidence
record_test("B11_AdversarialGreen", "Green chalkboard matte texture",
            body.get("is_valid_crop") is False,
            "is_valid_crop=False (rejected)",
            f"valid={body.get('is_valid_crop')}, code={body.get('error_code')}", body)

# B12: Adversarial Green Non-Plant: Green Dollar Bill Pattern
# Highly detailed green currency note pattern
arr_bill = np.zeros((224, 224, 3), dtype=np.uint8)
for y in range(224):
    for x in range(224):
        pat = int(np.sin(x/5) * np.sin(y/5) * 30)
        arr_bill[y, x] = [np.clip(60 + pat, 0, 255), np.clip(120 + pat, 0, 255), np.clip(70 + pat, 0, 255)]
im_bill = Image.fromarray(arr_bill)
buf = io.BytesIO(); im_bill.save(buf, format="JPEG"); buf.seek(0)
status, body = post_file(buf.getvalue(), "green_dollar_bill.jpg")
record_test("B12_AdversarialGreen", "Green dollar bill / currency note pattern",
            body.get("is_valid_crop") is False,
            "is_valid_crop=False (rejected)",
            f"valid={body.get('is_valid_crop')}, code={body.get('error_code')}", body)

# ====================================================================
# CATEGORY C: Genuine Leaves & Heavily Diseased / Stressed Leaves
# ====================================================================
print("\n" + "="*60)
print("CATEGORY C: Genuine Crop Leaves & Heavily Diseased Leaves")
print("="*60)

# C1: Existing Positive Leaf 1 (images.jpeg)
status, body = post_file("test image crop disease/images.jpeg", "images.jpeg")
record_test("C1_RealLeaf", "Genuine leaf: test image crop disease/images.jpeg",
            body.get("is_valid_crop") is True and body.get("confidence", 0) >= 35.0,
            "is_valid_crop=True, confidence >= 35.0",
            f"valid={body.get('is_valid_crop')}, class={body.get('class_name')}, conf={body.get('confidence')}%", body)

# C2: Existing Positive Leaf 2 (images (1).jpeg - Bean Rust)
status, body = post_file("test image crop disease/images (1).jpeg", "images (1).jpeg")
record_test("C2_RealLeaf", "Genuine leaf: test image crop disease/images (1).jpeg",
            body.get("is_valid_crop") is True and body.get("class_name") == "bean_rust",
            "is_valid_crop=True, class=bean_rust",
            f"valid={body.get('is_valid_crop')}, class={body.get('class_name')}, conf={body.get('confidence')}%", body)

# C3: Existing Positive Leaf 3 (images (2).jpeg - Downy Mildew)
status, body = post_file("test image crop disease/images (2).jpeg", "images (2).jpeg")
record_test("C3_RealLeaf", "Genuine leaf: test image crop disease/images (2).jpeg",
            body.get("is_valid_crop") is True and body.get("class_name") == "Downy Mildew",
            "is_valid_crop=True, class=Downy Mildew",
            f"valid={body.get('is_valid_crop')}, class={body.get('class_name')}, conf={body.get('confidence')}%", body)

# C4: Existing Positive Leaf 4 (images (3).jpeg - Downy Mildew)
status, body = post_file("test image crop disease/images (3).jpeg", "images (3).jpeg")
record_test("C4_RealLeaf", "Genuine leaf: test image crop disease/images (3).jpeg",
            body.get("is_valid_crop") is True and body.get("class_name") == "Downy Mildew",
            "is_valid_crop=True, class=Downy Mildew",
            f"valid={body.get('is_valid_crop')}, class={body.get('class_name')}, conf={body.get('confidence')}%", body)

# C5: Existing Positive Leaf 5 (sample_tomato.jpg - Tomato Early Blight with crop=tomato)
status, body = post_file("public/uploads/sample_tomato.jpg", "sample_tomato.jpg", data={"crop_type": "tomato"})
record_test("C5_RealLeaf", "Genuine leaf: sample_tomato.jpg (crop=tomato)",
            body.get("is_valid_crop") is True and body.get("class_name") == "Tomato___Early_blight",
            "is_valid_crop=True, class=Tomato___Early_blight",
            f"valid={body.get('is_valid_crop')}, class={body.get('class_name')}, conf={body.get('confidence')}%", body)

# Synthesize Stress-Test Leaves from sample_tomato.jpg
base_tomato_img = Image.open("public/uploads/sample_tomato.jpg").convert("RGB").resize((224, 224))
base_tomato_arr = np.array(base_tomato_img, dtype=np.float32)

# C6: Severe Necrotic Lesion Stress (40% Dark Brown/Black Necrosis Blight in Auto-detect Mode)
# Blend 40% of the leaf with dark necrotic scorch lesions (R~70, G~45, B~25)
arr_necrosis_40 = base_tomato_arr.copy()
# Create necrotic mask covering 40% of the area (patches)
mask_40 = np.zeros((224, 224), dtype=bool)
for cy, cx in [(60, 60), (140, 70), (90, 150), (160, 160)]:
    y, x = np.ogrid[:224, :224]
    dist = (x - cx)**2 + (y - cy)**2
    mask_40 |= (dist <= 35**2)
arr_necrosis_40[mask_40] = arr_necrosis_40[mask_40] * 0.2 + np.array([75, 45, 25], dtype=np.float32) * 0.8
im_necrosis_40 = Image.fromarray(np.clip(arr_necrosis_40, 0, 255).astype(np.uint8))
buf = io.BytesIO(); im_necrosis_40.save(buf, format="JPEG"); buf.seek(0)
status, body = post_file(buf.getvalue(), "necrosis_40pct.jpg") # Auto-detect mode
record_test("C6_StressNecrosis", "Severe 40% necrotic blight on leaf (Auto mode)",
            body.get("is_valid_crop") is True, # Genuine leaf must NOT be falsely rejected
            "is_valid_crop=True (accepted)",
            f"valid={body.get('is_valid_crop')}, class={body.get('class_name')}, code={body.get('error_code')}", body)

# C7: Severe Necrotic Lesion Stress (55% Necrosis / Late Blight Scorch)
arr_necrosis_55 = base_tomato_arr.copy()
mask_55 = np.zeros((224, 224), dtype=bool)
for cy, cx in [(50, 50), (140, 60), (80, 140), (150, 150), (110, 100)]:
    y, x = np.ogrid[:224, :224]
    dist = (x - cx)**2 + (y - cy)**2
    mask_55 |= (dist <= 38**2)
arr_necrosis_55[mask_55] = arr_necrosis_55[mask_55] * 0.15 + np.array([70, 40, 20], dtype=np.float32) * 0.85
im_necrosis_55 = Image.fromarray(np.clip(arr_necrosis_55, 0, 255).astype(np.uint8))
buf = io.BytesIO(); im_necrosis_55.save(buf, format="JPEG"); buf.seek(0)
status, body = post_file(buf.getvalue(), "necrosis_55pct.jpg") # Auto mode
record_test("C7_StressNecrosis", "Heavy 55% necrotic scorch on leaf (Auto mode)",
            body.get("is_valid_crop") is True, # Should preserve diseased leaf
            "is_valid_crop=True (accepted)",
            f"valid={body.get('is_valid_crop')}, class={body.get('class_name')}, code={body.get('error_code')}", body)

# C8: Chlorosis / Yellow Mosaic Stress (60% Yellowing Foliar Tissue in Auto mode)
arr_chlorosis = base_tomato_arr.copy()
mask_chlorosis = np.zeros((224, 224), dtype=bool)
for cy, cx in [(70, 70), (150, 70), (70, 150), (150, 150), (110, 110)]:
    y, x = np.ogrid[:224, :224]
    dist = (x - cx)**2 + (y - cy)**2
    mask_chlorosis |= (dist <= 40**2)
# Yellow foliar tissue: H ~ 40°, well-saturated (R~205, G~195, B~45)
arr_chlorosis[mask_chlorosis] = arr_chlorosis[mask_chlorosis] * 0.2 + np.array([205, 195, 45], dtype=np.float32) * 0.8
im_chlorosis = Image.fromarray(np.clip(arr_chlorosis, 0, 255).astype(np.uint8))
buf = io.BytesIO(); im_chlorosis.save(buf, format="JPEG"); buf.seek(0)
status, body = post_file(buf.getvalue(), "chlorosis_60pct.jpg") # Auto mode
record_test("C8_StressChlorosis", "Severe 60% chlorosis/mosaic yellowing (Auto mode)",
            body.get("is_valid_crop") is True,
            "is_valid_crop=True (accepted as foliar)",
            f"valid={body.get('is_valid_crop')}, class={body.get('class_name')}", body)

# C9: Scoped Family Mismatch Guard (Tomato leaf uploaded with crop=potato)
status, body = post_file("public/uploads/sample_tomato.jpg", "sample_tomato.jpg", data={"crop_type": "potato"})
record_test("C9_ScopedMismatch", "Tomato leaf with crop_type=potato (Scoped mismatch)",
            (body.get("is_valid_crop") is False and body.get("error_code") == "CROP_MISMATCH") or
            (body.get("is_valid_crop") is False and body.get("error_code") == "LOW_CONFIDENCE"),
            "Rejected as CROP_MISMATCH or LOW_CONFIDENCE",
            f"code={body.get('error_code')}, valid={body.get('is_valid_crop')}", body)

# ====================================================================
# CATEGORY D: Unsupported Crop Species Requests
# ====================================================================
print("\n" + "="*60)
print("CATEGORY D: Unsupported Crop Species Handling")
print("="*60)

unsupported_species = [
    ("rice", "ধান (Rice/Paddy)"),
    ("ধান", "ধান (Rice/Paddy)"),
    ("eggplant", "বেগুন (Eggplant/Brinjal)"),
    ("বেগুন", "বেগুন (Eggplant/Brinjal)"),
    ("jute", "পাট (Jute)"),
    ("পাট", "পাট (Jute)"),
    ("tea", "চা (Tea)"),
    ("চা", "চা (Tea)"),
    ("mango", "আম (Mango)"),
    ("wheat", "গম (Wheat)"),
    ("mustard", "সরিষা (Mustard)"),
    ("unknown_alien_crop", "unknown_alien_crop")
]

for crop_input, expected_crop_name in unsupported_species:
    status, body = post_file("test image crop disease/images.jpeg", "images.jpeg", data={"crop_type": crop_input})
    is_rejected = (
        body.get("is_valid_crop") is False and
        body.get("is_unidentified") is True and
        body.get("error_code") == "UNSUPPORTED_CROP_SPECIES" and
        "সমর্থিত নয়" in body.get("message", "")
    )
    record_test("D_UnsupportedCrop", f"Crop filter: '{crop_input}'",
                is_rejected,
                "error_code=UNSUPPORTED_CROP_SPECIES with Bengali explanation",
                f"code={body.get('error_code')}, valid={body.get('is_valid_crop')}, crop_req={body.get('crop_requested')}", body)

# ====================================================================
# SUMMARY
# ====================================================================
print("\n" + "="*60)
print(f"TEST EXECUTION SUMMARY: Total={results['total']} | Passed={results['passed']} | Failed={results['failed']}")
print("="*60)

# Save test report JSON for handoff
report_path = "/tmp/adversarial_challenge_m1/test_report.json"
with open(report_path, "w", encoding="utf-8") as f:
    import json
    json.dump(results, f, ensure_ascii=False, indent=2)
print(f"Detailed JSON results written to {report_path}")

sys.exit(0 if results["failed"] == 0 else 1)
