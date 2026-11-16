# Project: Smart Agro Crop Disease Detection Pipeline Hardening

## Architecture
Smart Agro is a dual-tier agro-advisory system consisting of:
1. **Frontend Web Interface** (`public/scan.html`, `public/js/scanner.js`):
   Provides leaf photography instructions, file upload/camera capture, crop family selection, and comprehensive Bengali diagnostic presentation (disease name, severity, symptoms, organic/chemical/fertilizer solutions, safety warnings, and audio readout).
2. **Node.js Express Server** (`server.js`, `db.js`, `data/disease_map.js`):
   Listens on port 3000. Handles file uploads via `/api/scan` and `/api/detect`, performs preliminary validation, dispatches requests to the Python AI microservice, looks up authentic Bengali agronomic prescriptions from `data/disease_map.js`, records scan history in PostgreSQL/SQLite, and returns structured JSON responses.
3. **Python Flask AI Microservice** (`ai_service/app.py`, `model/smart_agro_final.keras`):
   Listens on port 5000. Houses a 67-class MobileNetV2 crop disease classifier, secondary ImageNet MobileNetV2 validator for non-leaf object rejection, botanical vegetation index heuristics, crop-family scoped argmax filters, and confidence/margin threshold guards.
4. **End-to-End Test Suite** (`scripts/tests/verify-smart-agro.js`, `test image crop disease/`, `public/uploads/`):
   Rigorous automated test harness testing valid crop leaves across all supported families, negative/out-of-scope non-leaf objects (machinery, potato tubers, fruit, screenshots), unsupported plant species, and corrupted/edge-case files.

---

## Feature Inventory

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Multi-Domain Non-Leaf Filter | Expand ImageNet regex in `ai_service/app.py` to reject machinery, animals, tubers, fruits, foods, and UI screenshots | M1 | Survey (R1) - **DONE** |
| F2 | Botanical Foliage / Vegetation Check | Excess Green Index ($ExG = 2G - R - B$) and HSV foliar chlorophyll check to reject non-foliar objects (tubers, hands, walls) | M1 | Survey (R1) - **DONE** |
| F3 | Unsupported Plant Species Rejection | Explicitly reject unsupported crops (`rice`, `eggplant`, `jute`, `tea`, etc.) with informative Bengali guidance rather than false diagnoses | M1 | Survey (R1) - **DONE** |
| F4 | Two-Tier Confidence & Margin Guard | Enforce minimum confidence (>=35% in auto mode) and margin gap between top candidates to prevent closed-world false positives | M1 | Survey (R2) - **DONE** |
| F5 | Node.js Upload Validation & Magic Bytes | Add strict MIME filter and magic byte buffer inspection in `server.js` (`uploadMemory`) before memory parsing | M2 | Survey (R2) |
| F6 | Non-Blocking Asynchronous Storage | Replace `fs.writeFileSync` with non-blocking I/O and prevent disk pollution by unlinking rejected images | M2 | Survey (R2) |
| F7 | Network Resilience & Retry Logic | Increase axios timeout to 15s, add 1-retry fallback for transient socket drops, and preserve distinct HTTP error codes | M2 | Survey (R2) |
| F8 | Legacy Code Removal & Safe Fallbacks | Remove unused 142-line `diseaseDatabase` in `server.js`; remove silent healthy tomato default in `data/disease_map.js` | M2 | Survey (R3) |
| F9 | Bengali Rejection Messages & Guidance | Ensure 100% grammatically correct, empathetic Bengali rejection messages with instructions on photographing crop leaves | M3 | Survey (R1, R3) |
| F10 | Comprehensive Bengali Diagnostic Remedies | Ensure all 67 supported disease classes have complete, accurate Bengali symptoms, organic/chemical solutions, fertilizer schedules, and PHI warnings | M3 | Survey (R3) |
| F11 | UI Alignment & Guidance Enhancement | Ensure `public/scan.html` displays accurate supported crops and provides clear visual/textual guidance for proper leaf photography | M3 | Survey (R1, R3) |
| F12 | Comprehensive E2E Verification Suite | Upgrade `scripts/tests/verify-smart-agro.js` to assert ground truth diagnoses for `test image crop disease/` and strict rejection for all negatives | M4 | Survey (R4) |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | ML Microservice Hardening | Non-leaf filtering (produce/tubers/machinery), botanical vegetation index check, unsupported species rejection, confidence guards in `ai_service/app.py` | None | **DONE** |
| M2 | Node.js Pipeline & Storage Resilience | Buffer magic byte checks, non-blocking disk persistence, axios timeouts/retries, error code propagation, dead code cleanup in `server.js` | M1 | PLANNED |
| M3 | Bengali Diagnostic & Guidance Quality | Accurate Bengali rejection messages, UI guidance in `public/scan.html`, verification of all 67 Bengali advisories in `data/disease_map.js` | M1, M2 | PLANNED |
| M4 | E2E Verification Across Test Suite | Comprehensive verification across `test image crop disease/` and `public/uploads/` with ground-truth assertions in `verify-smart-agro.js` | M1, M2, M3 | PLANNED |

---

## Interface Contracts

### Python Flask Microservice (`/predict`) ↔ Node.js (`server.js`)
- **Request**:
  - `POST /predict` (multipart/form-data)
  - `image`: Binary image file (JPEG, PNG, WebP)
  - `crop_type` or `crop_name` (optional): Crop family string in English or Bengali (e.g. `'tomato'`, `'টমেটো'`, `'potato'`, `'আলু'`, `'rice'`, `'ধান'`)
- **Response — Valid Leaf (HTTP 200)**:
  ```json
  {
    "success": true,
    "is_valid_crop": true,
    "class_index": 59,
    "class_name": "bean_rust",
    "confidence": 99.6,
    "margin": 99.38,
    "mode": "auto",
    "top_candidates": [...]
  }
  ```
- **Response — Rejected / Non-Leaf / Out-of-Scope (HTTP 200)**:
  ```json
  {
    "success": true,
    "is_valid_crop": false,
    "is_unidentified": true,
    "error_code": "NON_LEAF_OBJECT" | "UNSUPPORTED_CROP_SPECIES" | "INVALID_IMAGE" | "LOW_CONFIDENCE" | "CROP_MISMATCH",
    "message": "<Bengali explanation with photography guidance>"
  }
  ```
- **Response — Error (HTTP 400 / 500)**:
  ```json
  {
    "success": false,
    "error": "<Error message in Bengali/English>"
  }
  ```

### Node.js Server (`/api/scan`, `/api/detect`) ↔ Frontend Client
- **Response — Valid Diagnosis (HTTP 200)**:
  ```json
  {
    "success": true,
    "message": "এআই সফলভাবে রোগ শনাক্ত করেছে!",
    "class_index": 59,
    "confidence": 99.6,
    "crop_name": "Bean",
    "crop_name_bn": "শিম ও বরবটি",
    "disease_name": "Bean Rust",
    "disease_name_bn": "শিমের মরিচা রোগ (রাস্ট)",
    "severity": "High",
    "severity_bn": "মাঝারি থেকে তীব্র",
    "agro_advisory_bn": "...",
    "symptoms": "...",
    "organic_solution": "...",
    "chemical_solution": "...",
    "fertilizer_solution": "...",
    "safety_warning": "...",
    "image_path": "/uploads/crop-..."
  }
  ```
- **Response — Rejection / Unidentified (HTTP 200)**:
  ```json
  {
    "success": true,
    "is_unidentified": true,
    "error_code": "NON_LEAF_OBJECT" | "UNSUPPORTED_CROP_SPECIES" | "INVALID_IMAGE" | "LOW_CONFIDENCE" | "CROP_MISMATCH",
    "message": "<Clear Bengali explanation with step-by-step photography instructions>"
  }
  ```

---

## Code Layout
- `ai_service/`:
  - `app.py`: Flask microservice entry point, pre/post-processing, validation pipelines, prediction route.
  - `requirements.txt`: Python runtime dependencies.
- `data/`:
  - `class_names.json`: 67 model class label names.
  - `disease_map.js`: Authentic Bengali agricultural advisory database for all 67 classes.
- `public/`:
  - `scan.html`: Leaf scanner user interface.
  - `js/scanner.js`: Frontend scanner controller, image preview, API client, speech synthesis.
  - `uploads/`: Temporary image storage for processed scans.
- `scripts/tests/`:
  - `verify-smart-agro.js`: Core verification test suite (155+ assertions).
  - `browser-scanner-test.js`: Headless browser UI and camera integration tests.
  - `adversarial_challenge.py`: 52-test empirical challenge suite.
  - `adversarial_challenge_m1.py`: 171-assertion stress test suite.
- `test image crop disease/`:
  - Positive evaluation images (`images.jpeg`, `images (1).jpeg`, `images (2).jpeg`, `images (3).jpeg`).
- `server.js`: Node.js Express server entry point, routes, middleware, and microservice proxy.
- `db.js`: Database layer (PostgreSQL connection with in-memory fallback).
