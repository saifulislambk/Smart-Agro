// ====================================================================
// Reviewer M3.2 Comprehensive Verification & Adversarial Test Suite
// Verifies:
// 1. HTTP 400 Rejection Handling (Feature F9) - No swallowed alert, parses JSON
// 2. Dynamic Error Badges & Icons (F9, F11) - All error codes
// 3. Bengali Rejection Messaging & Photography Instructions
// 4. In-Browser Real CDP Interaction with Live Server (Port 3000)
// 5. Adversarial Edge Cases (Malformed JSON, XSS, Null inputs)
// ====================================================================

const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class MinimalCDP {
  constructor(wsUrl) {
    this.wsUrl = new URL(wsUrl);
    this.socket = null;
    this.id = 1;
    this.callbacks = new Map();
  }

  connect() {
    return new Promise((resolve, reject) => {
      const key = crypto.randomBytes(16).toString('base64');
      const req = http.request({
        hostname: this.wsUrl.hostname,
        port: this.wsUrl.port,
        path: this.wsUrl.pathname,
        headers: {
          'Connection': 'Upgrade',
          'Upgrade': 'websocket',
          'Sec-WebSocket-Key': key,
          'Sec-WebSocket-Version': '13'
        }
      });

      req.on('upgrade', (res, socket) => {
        this.socket = socket;
        let buffer = Buffer.alloc(0);

        socket.on('data', (chunk) => {
          buffer = Buffer.concat([buffer, chunk]);
          while (buffer.length >= 2) {
            const firstByte = buffer[0];
            const secondByte = buffer[1];
            const opcode = firstByte & 0x0f;
            let payloadLen = secondByte & 0x7f;
            let offset = 2;

            if (payloadLen === 126) {
              if (buffer.length < 4) break;
              payloadLen = buffer.readUInt16BE(2);
              offset = 4;
            } else if (payloadLen === 127) {
              if (buffer.length < 10) break;
              payloadLen = Number(buffer.readBigUInt64BE(2));
              offset = 10;
            }

            if (buffer.length < offset + payloadLen) break;
            const payload = buffer.slice(offset, offset + payloadLen);
            buffer = buffer.slice(offset + payloadLen);

            if (opcode === 0x1) {
              try {
                const msg = JSON.parse(payload.toString('utf8'));
                if (msg.id && this.callbacks.has(msg.id)) {
                  this.callbacks.get(msg.id)(msg);
                  this.callbacks.delete(msg.id);
                }
              } catch (e) {}
            }
          }
        });

        resolve();
      });

      req.on('error', reject);
      req.end();
    });
  }

  send(method, params = {}) {
    return new Promise((resolve) => {
      const id = this.id++;
      const payload = JSON.stringify({ id, method, params });
      this.callbacks.set(id, resolve);

      const payloadBuf = Buffer.from(payload, 'utf8');
      const frameHeader = Buffer.alloc(payloadBuf.length > 125 ? (payloadBuf.length > 65535 ? 10 : 4) : 2);
      frameHeader[0] = 0x81;
      if (payloadBuf.length <= 125) {
        frameHeader[1] = 0x80 | payloadBuf.length;
      } else if (payloadBuf.length <= 65535) {
        frameHeader[1] = 0x80 | 126;
        frameHeader.writeUInt16BE(payloadBuf.length, 2);
      }
      const maskKey = crypto.randomBytes(4);
      const maskedPayload = Buffer.alloc(payloadBuf.length);
      for (let i = 0; i < payloadBuf.length; i++) {
        maskedPayload[i] = payloadBuf[i] ^ maskKey[i % 4];
      }
      this.socket.write(Buffer.concat([frameHeader.slice(0, frameHeader.length), maskKey, maskedPayload]));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    return res.result && res.result.result ? res.result.result.value : null;
  }
}

async function runM32Verification() {
  console.log('🧪 Starting Reviewer M3.2 Comprehensive Verification & Adversarial Suite...');
  let totalTests = 0;
  let passedTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✅ PASS: ${message}`);
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  const port = 9223;
  const chromeProcess = spawn('google-chrome', [
    '--headless=new',
    '--remote-debugging-port=' + port,
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    'http://localhost:3000/scan'
  ], { stdio: 'ignore' });

  let target = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 300));
    try {
      const res = await new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:${port}/json`, resp => {
          let data = '';
          resp.on('data', chunk => data += chunk);
          resp.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
      });
      target = res.find(t => t.type === 'page' && t.url.includes('/scan'));
      if (target) break;
    } catch(e) {}
  }

  if (!target) throw new Error('Failed to find Chrome scan page target');

  try {
    const cdp = new MinimalCDP(target.webSocketDebuggerUrl);
    await cdp.connect();
    console.log('  🌐 Connected to Chrome via CDP page target');

    await cdp.send('Runtime.enable');
    await cdp.send('Page.enable');

    async function evaluate(expression) {
      const res = await cdp.send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true
      });
      if (res && res.result && res.result.exceptionDetails) {
        console.error('JS Exception in evaluate:', res.result.exceptionDetails);
      }
      if (res && res.result && res.result.result) {
        return res.result.result.value;
      }
      return null;
    }

    // Wait for SmartAgroScanner
    await evaluate(`new Promise((resolve) => {
      if (window.SmartAgroScanner && window.SmartAgroScanner.init) return resolve();
      const check = setInterval(() => {
        if (window.SmartAgroScanner && window.SmartAgroScanner.init) {
          clearInterval(check);
          resolve();
        }
      }, 50);
      setTimeout(() => { clearInterval(check); resolve(); }, 5000);
    })`);

    // Trap window.alert to detect if an alert was triggered
    await evaluate(`
      window.__alertLogs = [];
      window.alert = function(msg) {
        window.__alertLogs.push(msg);
      };
    `);

    // =========================================================================
    // SECTION 1: Dynamic Error Badges & Icons in renderUnidentifiedResult
    // =========================================================================
    console.log('\n--- Section 1: Dynamic Error Badge & Icon Visual Presentation ---');

    const errorCodesToTest = [
      {
        code: 'NON_LEAF_OBJECT',
        expectedIcon: '🚜',
        expectedBadgeText: 'পাতা নয় / অপ্রাসঙ্গিক বস্তু',
        expectedColorClass: 'bg-rose-100 text-rose-800'
      },
      {
        code: 'UNSUPPORTED_CROP_SPECIES',
        expectedIcon: '🌾',
        expectedBadgeText: 'অসমর্থিত ফসল প্রজাতি',
        expectedColorClass: 'bg-amber-100 text-amber-800'
      },
      {
        code: 'LOW_CONFIDENCE',
        expectedIcon: '🔍',
        expectedBadgeText: 'অস্পষ্ট ছবি / অবিশ্বস্ত ফলাফল',
        expectedColorClass: 'bg-amber-100 text-amber-800'
      },
      {
        code: 'CROP_MISMATCH',
        expectedIcon: '⚠️',
        expectedBadgeText: 'নির্বাচিত ফসলের সাথে অমিল',
        expectedColorClass: 'bg-amber-100 text-amber-800'
      },
      {
        code: 'INVALID_IMAGE',
        expectedIcon: '🚫',
        expectedBadgeText: 'অবৈধ ছবির ফরম্যাট',
        expectedColorClass: 'bg-rose-100 text-rose-800'
      },
      {
        code: 'NOT_AN_IMAGE',
        expectedIcon: '🚫',
        expectedBadgeText: 'অবৈধ ছবির ফরম্যাট',
        expectedColorClass: 'bg-rose-100 text-rose-800'
      },
      {
        code: 'UNIDENTIFIED_DISEASE',
        expectedIcon: '❓',
        expectedBadgeText: 'অচেনা রোগ / ডাটাবেজে নেই',
        expectedColorClass: 'bg-slate-100 text-slate-800'
      },
      {
        code: 'CUSTOM_UNKNOWN_CODE',
        expectedIcon: '⚠️',
        expectedBadgeText: 'CUSTOM_UNKNOWN_CODE',
        expectedColorClass: 'bg-amber-100 text-amber-800'
      }
    ];

    for (const item of errorCodesToTest) {
      const renderRes = await evaluate(`
        (function() {
          SmartAgroScanner.renderUnidentifiedResult("পরীক্ষামূলক বার্তা: ${item.code}", "${item.code}");
          const iconEl = document.getElementById('unidentified-error-icon');
          const badgeEl = document.getElementById('unidentified-error-badge');
          const msgEl = document.getElementById('unidentified-reason-message');
          const container = document.getElementById('scan-unidentified-container');
          return {
            icon: iconEl ? iconEl.innerText : null,
            badge: badgeEl ? badgeEl.innerText : null,
            className: badgeEl ? badgeEl.className : null,
            msg: msgEl ? msgEl.innerText : null,
            isVisible: container ? (!container.classList.contains('hidden') && container.style.display !== 'none') : false
          };
        })()
      `);

      assert(renderRes.icon === item.expectedIcon, `Error code ${item.code} rendered icon '${item.expectedIcon}'`);
      assert(renderRes.badge === item.expectedBadgeText, `Error code ${item.code} rendered badge text '${item.expectedBadgeText}'`);
      assert(renderRes.className.includes(item.expectedColorClass.split(' ')[0]), `Error code ${item.code} badge has color class ${item.expectedColorClass}`);
      assert(renderRes.msg === `পরীক্ষামূলক বার্তা: ${item.code}`, `Error code ${item.code} set custom message`);
      assert(renderRes.isVisible === true, `Unidentified container is visible for ${item.code}`);
    }

    // =========================================================================
    // SECTION 2: HTTP 400 Rejection Handling (Live API via executeCropScan)
    // =========================================================================
    console.log('\n--- Section 2: HTTP 400 Rejection Handling (executeCropScan) ---');

    // Test 2.1: Disguised text file (triggers HTTP 400 with INVALID_IMAGE from server magic byte check)
    await evaluate(`
      (function() {
        window.__alertLogs = [];
        // Simulate selecting a fake non-image text file
        const fakeTextContent = "Hello, this is a plain text file pretending to be image.jpg";
        const blob = new Blob([fakeTextContent], { type: "image/jpeg" });
        const file = new File([blob], "fake_leaf.jpg", { type: "image/jpeg" });
        
        // Use SmartAgroScanner internal state
        SmartAgroScanner.handleFileSelected(file);
      })()
    `);

    // Verify preview state before scan
    const previewBeforeScan = await evaluate(`
      ({
        selectedFile: window.__selectedFile ? true : false,
        alerts: window.__alertLogs.length
      })
    `);

    // Trigger executeCropScan()
    await evaluate(`SmartAgroScanner.executeCropScan()`);

    // Wait for fetch & DOM update
    await new Promise(r => setTimeout(r, 1000));

    const scanResultState = await evaluate(`
      ({
        alerts: window.__alertLogs,
        unidentifiedVisible: !document.getElementById('scan-unidentified-container').classList.contains('hidden'),
        badgeText: document.getElementById('unidentified-error-badge').innerText,
        iconText: document.getElementById('unidentified-error-icon').innerText,
        reasonText: document.getElementById('unidentified-reason-message').innerText,
        resultsContainerHidden: document.getElementById('scan-results-container').classList.contains('hidden')
      })
    `);

    console.log('  Live HTTP 400 scan result state:', scanResultState);

    assert(scanResultState.alerts.length === 0, 'HTTP 400 rejection did NOT trigger window.alert() network failure popup');
    assert(scanResultState.unidentifiedVisible === true, 'scan-unidentified-container is visible upon HTTP 400');
    assert(scanResultState.badgeText === 'অবৈধ ছবির ফরম্যাট', 'Badge correctly displays "অবৈধ ছবির ফরম্যাট" for HTTP 400 INVALID_IMAGE');
    assert(scanResultState.iconText === '🚫', 'Icon correctly displays "🚫" for HTTP 400 INVALID_IMAGE');
    assert(scanResultState.reasonText.includes('ছবিটির ফরম্যাট সঠিক নয়'), 'Bengali message from server correctly rendered');
    assert(scanResultState.resultsContainerHidden === true, 'Diagnosis result container remains hidden');

    // =========================================================================
    // SECTION 3: Leaf Photography Guidelines (Do's & Don'ts) & Crop Selector
    // =========================================================================
    console.log('\n--- Section 3: Leaf Photography Guidelines & Crop Selector Alignment ---');

    const uiCheck = await evaluate(`
      ({
        hasDos: document.body.innerText.includes("কী করবেন (Do's)"),
        hasDonts: document.body.innerText.includes("কী করবেন না (Don'ts)"),
        hasSingleLeaf: document.body.innerText.includes("একক পাতার ক্লোজ-আপ"),
        hasDaylight: document.body.innerText.includes("দিনের স্বাভাবিক আলো"),
        hasFocus: document.body.innerText.includes("দাগ স্পষ্ট ফোকাসে"),
        hasNoTubers: document.body.innerText.includes("আলুর কন্দ বা ফলমূল"),
        hasNoMachines: document.body.innerText.includes("যন্ত্রপাতি, হাত বা মাটি"),
        has14CropsShowcase: document.body.innerText.includes("মডেল-সমর্থিত ১৪টি ফসল পরিবার"),
        cropSelectorOptions: Array.from(document.getElementById('crop-type-select').options).map(o => o.value),
        pills: Array.from(document.querySelectorAll('.crop-pill-btn')).map(b => b.getAttribute('data-crop-pill'))
      })
    `);

    assert(uiCheck.hasDos, "Page includes Do's guideline section");
    assert(uiCheck.hasDonts, "Page includes Don'ts guideline section");
    assert(uiCheck.hasSingleLeaf, "Page instructs: একক পাতার ক্লোজ-আপ");
    assert(uiCheck.hasDaylight, "Page instructs: দিনের স্বাভাবিক আলো");
    assert(uiCheck.hasFocus, "Page instructs: দাগ স্পষ্ট ফোকাসে");
    assert(uiCheck.hasNoTubers, "Page warns: আলুর কন্দ বা ফলমূল নয়");
    assert(uiCheck.hasNoMachines, "Page warns: যন্ত্রপাতি, হাত বা মাটি নয়");
    assert(uiCheck.has14CropsShowcase, "Page showcases 14 supported crop families");

    // Verify rice & eggplant are NOT present
    assert(!uiCheck.cropSelectorOptions.includes('rice'), "Dropdown does NOT contain unsupported 'rice'");
    assert(!uiCheck.cropSelectorOptions.includes('eggplant'), "Dropdown does NOT contain unsupported 'eggplant'");
    assert(!uiCheck.pills.includes('rice'), "Pills do NOT contain unsupported 'rice'");
    assert(!uiCheck.pills.includes('eggplant'), "Pills do NOT contain unsupported 'eggplant'");

    // Verify supported crops in dropdown
    const expectedCrops = ['tomato', 'potato', 'cucumber', 'pepper', 'bean', 'cabbage', 'corn', 'citrus', 'papaya', 'apple', 'grape', 'strawberry', 'squash', 'peach', 'auto'];
    for (const crop of expectedCrops) {
      assert(uiCheck.cropSelectorOptions.includes(crop), `Crop dropdown contains supported family '${crop}'`);
    }

    // =========================================================================
    // SECTION 4: Adversarial Stress-Testing
    // =========================================================================
    console.log('\n--- Section 4: Adversarial Stress-Testing & Integrity Checks ---');

    // 4.1 XSS payload in message and errorCode
    const xssTest = await evaluate(`
      (function() {
        const xssMsg = '<img src=x onerror="window.__xssInjected=true"><b>Malicious</b>';
        const xssCode = '<script>window.__xssInjected2=true</script>';
        SmartAgroScanner.renderUnidentifiedResult(xssMsg, xssCode);
        return {
          injected: window.__xssInjected || window.__xssInjected2,
          msgHtml: document.getElementById('unidentified-reason-message').innerHTML,
          badgeHtml: document.getElementById('unidentified-error-badge').innerHTML
        };
      })()
    `);

    assert(!xssTest.injected, 'XSS script injection did NOT execute in renderUnidentifiedResult');
    assert(!xssTest.msgHtml.includes('<img src=x onerror'), 'Raw HTML tag was escaped by innerText');

    // 4.2 Malformed non-JSON HTTP 400 response simulation
    const malformedJsonTest = await evaluate(`
      (async function() {
        window.__alertLogs = [];
        // Temporarily intercept fetch to return HTTP 400 with non-JSON text
        const originalFetch = window.fetch;
        window.fetch = async function() {
          return new Response("<html><body>502 Bad Gateway</body></html>", {
            status: 400,
            headers: { "Content-Type": "text/html" }
          });
        };

        try {
          const fakeBlob = new Blob(["test"], { type: "image/jpeg" });
          SmartAgroScanner.handleFileSelected(new File([fakeBlob], "test.jpg"));
          await SmartAgroScanner.executeCropScan();
        } finally {
          window.fetch = originalFetch;
        }

        return {
          alerts: window.__alertLogs
        };
      })()
    `);

    assert(malformedJsonTest.alerts.length === 1, 'Malformed non-JSON HTTP 400 gracefully caught and displayed alert fallback');

    // 4.3 Null / Undefined arguments to renderUnidentifiedResult
    const nullArgsTest = await evaluate(`
      (function() {
        try {
          SmartAgroScanner.renderUnidentifiedResult(null, null);
          const badge = document.getElementById('unidentified-error-badge').innerText;
          const icon = document.getElementById('unidentified-error-icon').innerText;
          return { ok: true, badge, icon };
        } catch(e) {
          return { ok: false, error: e.message };
        }
      })()
    `);

    assert(nullArgsTest.ok === true, 'renderUnidentifiedResult handles null message and null errorCode without throwing');
    assert(nullArgsTest.badge === 'UNIDENTIFIED_IMAGE', 'Null errorCode cleanly defaults to UNIDENTIFIED_IMAGE');
    assert(nullArgsTest.icon === '⚠️', 'Null errorCode defaults to ⚠️ icon');

    console.log(`\n======================================================`);
    console.log(`🎉 ALL ${passedTests}/${totalTests} M3.2 VERIFICATION ASSERTIONS PASSED!`);
    console.log(`======================================================\n`);

  } finally {
    chromeProcess.kill('SIGKILL');
  }
}

runM32Verification().catch(err => {
  console.error('❌ M3.2 Verification error:', err);
  process.exit(1);
});
