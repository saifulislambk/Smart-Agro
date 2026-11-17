# E2E Test Infra: Smart Agro (স্মার্ট এগ্রো)

## Test Philosophy
- **Opaque-box & Requirement-driven**: Derived strictly from `ORIGINAL_REQUEST.md` and `PROJECT.md § Feature Inventory`.
- **Zero External Dependencies**: Completely self-contained execution without Chrome/Puppeteer or external network services. Boots ephemeral Express server and in-memory mock services as needed.
- **Methodology**: Systematic 4-tier testing hierarchy combining Category-Partition, Boundary Value Analysis (BVA), Pairwise Combinatorial Testing, and Realistic Application Workloads.

## Feature Inventory & Tier Mapping
| # | Feature | Source (Requirement) | Tier 1 (Coverage ≥5) | Tier 2 (Boundary ≥5) | Tier 3 (Pairwise) | Tier 4 (Scenario) |
|---|---------|----------------------|:--------------------:|:--------------------:|:-----------------:|:-----------------:|
| 1 | Profile Dropdown Fix | ORIGINAL_REQUEST §R1 | ≥5 | ≥5 | ✓ | ✓ |
| 2 | Phone Number Removal | ORIGINAL_REQUEST §R1 | ≥5 | ≥5 | ✓ | ✓ |
| 3 | Geolocation District Selection | ORIGINAL_REQUEST §R2 | ≥5 | ≥5 | ✓ | ✓ |
| 4 | District Default to Dhaka | ORIGINAL_REQUEST §R2 | ≥5 | ≥5 | ✓ | ✓ |
| 5 | Scan Page Duplicate Nav Removal | ORIGINAL_REQUEST §R3 | ≥5 | ≥5 | ✓ | ✓ |
| 6 | 7-Page Production Bug Sweep | ORIGINAL_REQUEST §R3 | ≥5 | ≥5 | ✓ | ✓ |
| 7 | Bilingual Code Comments | ORIGINAL_REQUEST §R4 | ≥5 | ≥5 | ✓ | ✓ |
| 8 | Auth & Authorization Hardening | ORIGINAL_REQUEST §R5 | ≥5 | ≥5 | ✓ | ✓ |
| 9 | XSS & Injection Sanitization | ORIGINAL_REQUEST §R5 | ≥5 | ≥5 | ✓ | ✓ |
| 10 | Security Headers & Rate Limiting | ORIGINAL_REQUEST §R5 | ≥5 | ≥5 | ✓ | ✓ |
| 11 | Secure Secrets & Body Limits | ORIGINAL_REQUEST §R5 | ≥5 | ≥5 | ✓ | ✓ |
| 12 | Master Project Guideline PDF | ORIGINAL_REQUEST §R6 | ≥5 | ≥5 | ✓ | ✓ |
| 13 | Git Push & Vercel Verification | ORIGINAL_REQUEST §R6 | ≥5 | ≥5 | ✓ | ✓ |

## Test Architecture
- **Location**: `scripts/tests/verify-e2e-suite.js`
- **Execution Command**: `node scripts/tests/verify-e2e-suite.js` (Optional tier filter: `--tier=1`, `--tier=2`, `--tier=3`, `--tier=4`, `--tier=all`)
- **Pass/Fail Semantics**: 
  - Exit code `0`: All executed tier tests pass with 100% assertions satisfied.
  - Exit code `1`: One or more assertions failed; details logged to stderr/stdout with tier and feature classification.
- **Directory Layout**:
  - `scripts/tests/verify-e2e-suite.js`: Master unified test runner.
  - Ephemeral test server spawned on available non-colliding port (e.g. port 3899 or dynamically discovered open port).
  - Clean lifecycle teardown on process SIGINT, SIGTERM, and test completion.

## Test Tier Definitions

### Tier 1: Feature Coverage (≥5 per feature, 65+ tests)
Enumerate isolated verification checks for every feature:
- F1: `#user-profile-dropdown` element exists in all headers; toggles `.hidden` class; script tag present in `scan.html`; no container `overflow-x-hidden` clipping; `stopPropagation` stops event bubbling.
- F2: Purge of phone inputs in `#account-modal`; purge in `#profile-dropdown`; purge in `#mobile-nav-drawer`; purge in auth API endpoints; purge in client-side auth helpers.
- F3: HTML5 Geolocation API hook present; Haversine coordinate calculation logic; 64-district centroid map; auto-detection invocation on window load; coordinates resolve to correct district (e.g. Bogura, Sylhet, Rangpur).
- F4: Default selection in `index.html` is Dhaka (`ঢাকা`); default in `scan.html`, `crop-detail.html`, `history.html`, `grafting.html`, `roadmap.html`, `calculator.html` is Dhaka; fallback in `weather.js` defaults to Dhaka.
- F5: Verify absence of duplicate bottom navbar in `public/scan.html`; verify `unify-navbar.py` regex does not reintroduce duplication; verify single bottom nav remains active; verify no z-index overlap on scanner floating buttons; verify clean DOM tree.
- F6: Verify all 7 core pages return HTTP 200 without error; verify redirect aliases (`/guides`, `/fertilizer`); verify CSS stylesheet integrity; verify zero broken relative image paths; verify modal dialog open/close markup.
- F7: Verify Bengali and English comments in `server.js`; comments in `public/js/app.js`; comments in `public/js/weather.js`; comments in `ai_service/app.py`; comments in `db.js`.
- F8: Authorization check on `DELETE /api/history/:id`; data isolation on `GET /api/history` (no public scan dump); session/UID validation; invalid token rejection; user profile sync validation.
- F9: `escapeHtml()` utility exists and sanitizes `<script>`, `onerror=`, `onload=`, and quotes; applied on dynamic weather card rendering; applied on diagnosis result rendering; applied on history list rendering; API query parameter rejection/escaping.
- F10: Content-Security-Policy header present; X-Content-Type-Options: nosniff header; X-Frame-Options header; Strict-Transport-Security configured; API rate limiting middleware configured.
- F11: Express JSON body limit restricted to 1MB; OTP is masked/omitted in production response mode; no raw API keys or database passwords committed in public JS; environment variable fallback handles missing credentials gracefully; oversized payloads (>1MB) return HTTP 413.
- F12: Verify PDF generator script `scripts/generators/generate-master-pdf.py` exists; Noto Sans Bengali font loaded; PDF output path `docs/pdfs/Smart_Agro_Master_Project_Guideline.pdf` configured; PDF contains multi-page structure; bilingual content sections validated.
- F13: Git remote points to `https://github.com/saifulislambk/Smart-Agro.git`; `.gitignore` does not ignore `docs/pdfs/Smart_Agro_Master_Project_Guideline.pdf`; Vercel configuration `vercel.json` valid; build scripts in `package.json` run cleanly; branch `main` ready for push.

### Tier 2: Boundary & Corner Cases (≥5 per feature, 65+ tests)
Stress test boundaries and error handling:
- F1: Rapid repeated clicks on profile toggle; document click outside dropdown closes it; Escape key press handling; profile click when user is unauthenticated vs authenticated; window resize handling.
- F2: Legacy localStorage containing old phone numbers gracefully purged or ignored; submission of form without phone fields; empty user profile update; profile sync with null phone; backward compatibility with legacy scan records.
- F3: GPS permission explicitly denied by user; GPS timeout (slow network/satellite); coordinates outside Bangladesh borders (fallback to Dhaka); invalid/NaN coordinates; offline/flight-mode fallback.
- F4: Corrupted localStorage district value falls back to Dhaka; empty query string `?district=` defaults to Dhaka; whitespace-only district input; district selector change persists across reloads; case/spelling mismatch in district names.
- F5: Ultra-wide desktop viewport; ultra-narrow mobile viewport (320px); landscape mobile orientation; rapid page scrolling with sticky footer; dynamic content injection in scan view.
- F6: Missing query parameters on `/api/weather`; malformed crop name on `/api/guides/:crop`; invalid input to `/api/fertilizer-calc`; unauthenticated requests to protected endpoints; 404 handler for nonexistent routes.
- F7: Unicode Bengali characters properly UTF-8 encoded across all files without byte order mark corruption; docstrings adhere to consistent formatting; comments in inline templates; minification compatibility; bilingual keywords coverage.
- F8: Tampered `firebase_uid` in history delete; SQL injection attempt in history ID parameter; path traversal attempt in static file requests; unauthorized user trying to delete another user's record; empty authorization headers.
- F9: XSS vectors: `<img src=x onerror=alert(1)>`, `<svg onload=alert(1)>`, `javascript:void(0)`, nested tags `<<SCRIPT>script>`, encoded entities.
- F10: Rapid burst of 100 requests tests rate limit threshold; CORS preflight `OPTIONS` check from unauthorized origin; custom headers stripping; header size overflow; protocol downgrade prevention.
- F11: Payload exactly 1MB accepted; payload 1.01MB rejected with HTTP 413; invalid JSON syntax handling; null byte injection in request body; empty POST body handling.
- F12: PDF generator runs when target directory does not exist (auto-creates); handles missing font gracefully with fallback; handles large text layout pagination; verifies page count ≥ 5; verifies output file size > 50KB.
- F13: Verification of git status cleanliness; PAT token masking in logs; Vercel serverless function size within limits; static assets cache headers in vercel.json; npm build command exit code.

### Tier 3: Cross-Feature Combinations (Pairwise, ≥13 tests)
Test interactions between interconnected subsystems:
- C1: Profile Dropdown (F1) + Auth Hardening (F8) — State sync between authenticated user and dropdown display.
- C2: Geolocation (F3) + District Default (F4) + Weather API (F6) — GPS coordinate resolution seamlessly triggers weather alert update.
- C3: Phone Purge (F2) + Auth Hardening (F8) — Account creation and profile update operate end-to-end without phone requirements.
- C4: XSS Sanitization (F9) + 7-Page Bug Sweep (F6) — User input across all 7 page forms and search inputs gets sanitized before DOM insertion.
- C5: Security Headers (F10) + Static Routes (F6) — All 7 page responses contain full set of security headers.
- C6: Body Limits (F11) + Image Scan Proxy (F6) — Scan endpoint enforces size limits while permitting valid crop images.
- C7: Geolocation (F3) + Master PDF (F12) — District coordinate mapping accurately documented in Master Guideline PDF.
- C8: Scan Nav Removal (F5) + 7-Page Bug Sweep (F6) — Mobile navigation behaves identically across scan and other 6 pages.
- C9: Bilingual Comments (F7) + Security Middleware (F10) — Security middleware functions are fully commented in Bengali and English.
- C10: Rate Limiting (F10) + Auth Endpoints (F8) — Repeated auth attempts trigger rate limiting.
- C11: Git Push (F13) + Master PDF (F12) — Master PDF file is tracked in git and not ignored by `.gitignore`.
- C12: District Default (F4) + History Page (F6) — History records correctly associate with selected district.
- C13: Auth Hardening (F8) + History API (F6) — User scan history retrieval enforces strict user-level isolation.

### Tier 4: Real-World Application Scenarios (≥7 scenarios)
Full end-to-end user journeys mirroring actual farmer workflows in Bangladesh:
- S1: **First-Time Farmer Onboarding**: User opens app in Bogura, GPS prompt accepted -> auto-resolves to Bogura district -> weather cards display Bogura agro-alerts -> opens profile dropdown -> verifies clean interface without phone prompts.
- S2: **Remote Farmer with Location Denied**: User opens app in rural area, denies GPS -> system gracefully defaults to Dhaka without console errors -> user selects Barishal from dropdown -> weather updates to Barishal.
- S3: **Crop Disease Diagnosis & Treatment Flow**: Farmer visits `/scan` -> navigates clean UI without duplicate navbars -> uploads crop leaf image -> mock AI diagnoses disease -> results rendered safely (XSS-sanitized) -> farmer views treatment guidelines.
- S4: **Fertilizer Calculation & Recommendation Flow**: Farmer navigates to `/calculator` -> inputs land size and crop -> receives BARC-compliant fertilizer dosage -> switches language/view -> data persists cleanly.
- S5: **Adversarial / Malicious User Attack Flow**: Attacker attempts XSS injection in query parameters and forms, fires burst of rapid requests, and attempts IDOR deletion on `/api/history/999` -> system blocks attacks with security headers, sanitization, and auth errors.
- S6: **Offline / Low-Connectivity Resilience Flow**: Farmer loses connection or AI microservice is temporarily down -> app serves cached/in-memory fallback data without crashing.
- S7: **Production Release & Documentation Verification Flow**: Team builds Master Project Guideline PDF with bilingual documentation -> verifies all 7 pages load -> verifies git commit status and Vercel deployment readiness.

## Minimum Coverage Summary
- **Tier 1**: 13 features × 5 tests = **65 tests**
- **Tier 2**: 13 features × 5 tests = **65 tests**
- **Tier 3**: 13 pairwise combinations = **13 tests**
- **Tier 4**: 7 realistic user journeys = **7 tests**
- **Total Minimum**: **150 tests**
