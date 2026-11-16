const http = require('http');
const crypto = require('crypto');
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
                if (msg.method === 'Runtime.consoleAPICalled') {
                  console.log('🌐 BROWSER CONSOLE:', msg.params.args.map(a => a.value || a.description).join(' '));
                }
                if (msg.method === 'Runtime.exceptionThrown') {
                  console.error('💥 BROWSER JS EXCEPTION:', msg.params.exceptionDetails);
                }
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
      const mask = crypto.randomBytes(4);
      let header;

      if (payloadBuf.length < 126) {
        header = Buffer.alloc(6);
        header[0] = 0x81;
        header[1] = payloadBuf.length | 0x80;
        mask.copy(header, 2);
      } else if (payloadBuf.length <= 65535) {
        header = Buffer.alloc(8);
        header[0] = 0x81;
        header[1] = 126 | 0x80;
        header.writeUInt16BE(payloadBuf.length, 2);
        mask.copy(header, 4);
      } else {
        header = Buffer.alloc(14);
        header[0] = 0x81;
        header[1] = 127 | 0x80;
        header.writeBigUInt64BE(BigInt(payloadBuf.length), 2);
        mask.copy(header, 10);
      }

      const masked = Buffer.alloc(payloadBuf.length);
      for (let i = 0; i < payloadBuf.length; i++) {
        masked[i] = payloadBuf[i] ^ mask[i % 4];
      }

      this.socket.write(Buffer.concat([header, masked]));
    });
  }

  close() {
    if (this.socket) this.socket.destroy();
  }
}

async function testNativeFileInput() {
  const port = 9444;
  const chrome = spawn('google-chrome', [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    `--remote-debugging-port=${port}`,
    'http://localhost:3000/scan'
  ], { stdio: 'ignore' });

  try {
    let target = null;
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 300));
      try {
        const res = await new Promise((resolve, reject) => {
          http.get(`http://127.0.0.1:${port}/json`, (resp) => {
            let data = '';
            resp.on('data', chunk => data += chunk);
            resp.on('end', () => resolve(JSON.parse(data)));
          }).on('error', reject);
        });
        target = res.find(t => t.type === 'page' && t.url.includes('/scan'));
        if (target) break;
      } catch (e) {}
    }

    const cdp = new MinimalCDP(target.webSocketDebuggerUrl);
    await cdp.connect();

    await cdp.send('Runtime.enable');
    await cdp.send('DOM.enable');

    async function evaluate(expression) {
      const res = await cdp.send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true
      });
      return res.result && res.result.result ? res.result.result.value : null;
    }

    await new Promise(r => setTimeout(r, 1000));

    console.log('📌 Getting input objectId via Runtime.evaluate...');
    const inputObj = await cdp.send('Runtime.evaluate', {
      expression: "document.getElementById('crop-image-input')",
      returnByValue: false
    });
    console.log('inputObj:', inputObj.result.result.objectId);

    const testImagePath = path.resolve('public/uploads/sample_tomato.jpg');
    console.log('📌 Setting file input files to:', testImagePath);

    const setRes = await cdp.send('DOM.setFileInputFiles', {
      objectId: inputObj.result.result.objectId,
      files: [testImagePath]
    });
    console.log('setFileInputFiles response:', setRes);

    console.log('📌 Waiting 1000ms for change event & FileReader...');
    await new Promise(r => setTimeout(r, 1000));

    const checkInput = await evaluate(`(() => {
      const input = document.getElementById('crop-image-input');
      return {
        hasInput: !!input,
        filesLen: input ? input.files.length : null,
        firstFileName: input && input.files[0] ? input.files[0].name : null,
        isScannerDefined: typeof window.SmartAgroScanner !== 'undefined'
      };
    })()`);
    console.log('checkInput:', checkInput);

    const state = await evaluate(`(() => {
      const emptyState = document.getElementById('scanner-empty-state');
      const previewState = document.getElementById('scanner-preview-state');
      const previewImg = document.getElementById('scanner-preview-img');
      const fileNameEl = document.getElementById('preview-file-name');
      const fileSizeEl = document.getElementById('preview-file-size');

      return {
        emptyHidden: emptyState ? emptyState.classList.contains('hidden') : null,
        emptyDisplay: emptyState ? window.getComputedStyle(emptyState).display : null,
        previewHidden: previewState ? previewState.classList.contains('hidden') : null,
        previewDisplay: previewState ? window.getComputedStyle(previewState).display : null,
        previewImgSrc: previewImg ? previewImg.src.substring(0, 50) : null,
        previewImgRenderedWidth: previewImg ? previewImg.offsetWidth : null,
        previewImgRenderedHeight: previewImg ? previewImg.offsetHeight : null,
        fileName: fileNameEl ? fileNameEl.textContent : null,
        fileSize: fileSizeEl ? fileSizeEl.textContent : null
      };
    })()`);

    console.log('State after native file input:', JSON.stringify(state, null, 2));

    cdp.close();
    chrome.kill('SIGTERM');
  } catch (err) {
    console.error('Test error:', err);
    chrome.kill('SIGTERM');
  }
}

testNativeFileInput();
