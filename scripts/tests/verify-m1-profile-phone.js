/**
 * Milestone 1 Verification Suite: Profile Dropdown Fix & Phone Removal
 */
const fs = require('fs');
const path = require('path');
const http = require('http');

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✅ Passed: ${message}`);
  } else {
    console.error(`  ❌ FAILED: ${message}`);
    process.exitCode = 1;
  }
}

const rootDir = path.resolve(__dirname, '../../');
const htmlFiles = [
  'public/index.html',
  'public/scan.html',
  'public/crop-detail.html',
  'public/history.html',
  'public/grafting.html',
  'public/roadmap.html',
  'public/calculator.html'
];

console.log('🧪 1. Testing header overflow-x-hidden removal in all 7 HTML pages...');
htmlFiles.forEach(file => {
  const content = fs.readFileSync(path.join(rootDir, file), 'utf8');
  const headerMatch = content.match(/<header[\s\S]*?<\/header>/);
  assert(headerMatch && !headerMatch[0].includes('overflow-x-hidden'), `No overflow-x-hidden in header of ${file}`);
});

console.log('\n🧪 2. Testing public/scan.html script imports...');
const scanContent = fs.readFileSync(path.join(rootDir, 'public/scan.html'), 'utf8');
assert(scanContent.includes('/js/firebase-config.js'), 'scan.html imports firebase-config.js');
assert(scanContent.includes('/js/weather.js'), 'scan.html imports weather.js');
assert(scanContent.includes('/js/voice-assistant.js'), 'scan.html imports voice-assistant.js');
assert(scanContent.includes('/js/scanner.js'), 'scan.html imports scanner.js');
assert(scanContent.includes('/js/app.js'), 'scan.html imports app.js');

console.log('\n🧪 3. Testing public/js/app.js dropdown toggle & stopPropagation logic...');
const appJsContent = fs.readFileSync(path.join(rootDir, 'public/js/app.js'), 'utf8');
assert(appJsContent.includes('userProfile.addEventListener(\'click\', (e) => {') &&
       appJsContent.includes('e.stopPropagation();') &&
       appJsContent.includes('SmartAgroAuth.toggleProfileDropdown();'),
       'app.js userProfile click listener has e.stopPropagation() and toggles dropdown');
assert(appJsContent.includes('profileDropdown.addEventListener(\'click\''), 'app.js profileDropdown click listener present to prevent accidental close');

console.log('\n🧪 4. Testing navigation drawer text across all 7 pages...');
htmlFiles.forEach(file => {
  const content = fs.readFileSync(path.join(rootDir, file), 'utf8');
  assert(!content.includes('মোবাইল নম্বর ও ইমেইল যুক্ত করুন'), `Drawer text removed in ${file}`);
  assert(content.includes('প্রোফাইল সেটিংস ও ইমেইল যুক্ত করুন'), `Updated drawer text present in ${file}`);
});

console.log('\n🧪 5. Testing complete phone number removal in public/js/firebase-config.js...');
const fbContent = fs.readFileSync(path.join(rootDir, 'public/js/firebase-config.js'), 'utf8');
assert(!fbContent.includes('link-phone-input'), 'link-phone-input removed from firebase-config.js');
assert(!fbContent.includes('sendPhoneOtp'), 'sendPhoneOtp removed from firebase-config.js');
assert(!fbContent.includes('verifyPhoneOtp'), 'verifyPhoneOtp removed from firebase-config.js');
assert(!fbContent.includes('formatBDPhoneNumber'), 'formatBDPhoneNumber removed from firebase-config.js');
assert(!fbContent.includes('validateBDPhoneNumber'), 'validateBDPhoneNumber removed from firebase-config.js');
assert(!fbContent.includes('phoneConfirmationResult'), 'phoneConfirmationResult removed from firebase-config.js');
assert(!fbContent.includes('currentPendingPhone'), 'currentPendingPhone removed from firebase-config.js');
assert(!fbContent.includes('যাচাইকৃত মোবাইল কৃষক'), 'যাচাইকৃত মোবাইল কৃষক role string removed');
assert(!fbContent.includes('phone-auth-step-1'), 'phone-auth-step-1 removed from firebase-config.js');

console.log(`\n===============================================================`);
console.log(`🌾 M1 VERIFICATION SUMMARY: ${passed}/${total} assertions passed.`);
console.log(`===============================================================`);
if (passed === total) {
  console.log('✅ ALL MILESTONE 1 PROFILE & PHONE PURGE CHECKS PASSED.');
} else {
  console.error('❌ SOME CHECKS FAILED.');
  process.exit(1);
}
