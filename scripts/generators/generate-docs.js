// ====================================================================
// Smart Agro (স্মার্ট এগ্রো) - Automated Multi-Guide PDF Generator
// Uses Headless Google Chrome to render pixel-perfect printable A4 PDFs
// Keeps all generated PDF manuals in docs/pdfs/ (excluded from deployment)
// ====================================================================

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

async function generateAllDocumentationPDFs() {
  console.log('📄 [Smart Agro Docs] Starting PDF Guides Generation...');

  const projectRoot = path.resolve(__dirname, '..', '..');
  const pdfOutputDir = path.join(projectRoot, 'docs', 'pdfs');

  if (!fs.existsSync(pdfOutputDir)) {
    fs.mkdirSync(pdfOutputDir, { recursive: true });
  }

  // Find Chrome / Chromium executable
  let chromePath = null;
  const candidates = [
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    'google-chrome',
    'chromium'
  ];

  for (const c of candidates) {
    try {
      execSync(`which ${c}`, { stdio: 'ignore' });
      chromePath = c;
      break;
    } catch (e) {
      // continue
    }
  }

  if (!chromePath) {
    console.error('❌ Google Chrome or Chromium not found on system.');
    process.exit(1);
  }

  console.log(`🔍 Found Chrome engine: ${chromePath}`);

  const guides = [
    {
      name: 'Smart Agro Developer & Architecture Guide',
      sourceHtml: path.join(projectRoot, 'docs', 'html', 'developer-guide.html'),
      targetPdf: path.join(pdfOutputDir, 'Smart_Agro_Developer_Guide.pdf')
    },
    {
      name: 'Trained AI Disease Diagnosis Model Setup & Implementation Guide',
      sourceHtml: path.join(projectRoot, 'docs', 'html', 'ai-model-setup.html'),
      targetPdf: path.join(pdfOutputDir, 'AI_Model_Integration_Guide.pdf')
    },
    {
      name: 'Production Deployment & Cloud Hosting Manual',
      sourceHtml: path.join(projectRoot, 'docs', 'html', 'deployment-hosting.html'),
      targetPdf: path.join(pdfOutputDir, 'Deployment_and_Hosting_Guide.pdf')
    }
  ];

  for (const guide of guides) {
    console.log(`\n⚙️ Rendering [${guide.name}]...`);
    if (!fs.existsSync(guide.sourceHtml)) {
      console.error(`❌ Source HTML not found at: ${guide.sourceHtml}`);
      continue;
    }

    try {
      const fileUrl = `file://${guide.sourceHtml}`;
      const cmd = `${chromePath} --headless --disable-gpu --no-sandbox --print-to-pdf="${guide.targetPdf}" --print-to-pdf-no-header --no-pdf-header-footer "${fileUrl}"`;
      
      execSync(cmd, { stdio: 'pipe' });

      if (fs.existsSync(guide.targetPdf)) {
        const stats = fs.statSync(guide.targetPdf);
        console.log(`✅ Generated: ${path.basename(guide.targetPdf)} (${(stats.size / 1024).toFixed(1)} KB)`);
      } else {
        console.error(`❌ PDF not created for: ${guide.name}`);
      }
    } catch (err) {
      console.error(`❌ Error rendering ${guide.name}:`, err.message);
    }
  }

  console.log('\n🎉 [Smart Agro Docs] All documentation PDFs processed successfully in docs/pdfs/\n');
}

if (require.main === module) {
  generateAllDocumentationPDFs();
}

module.exports = { generateAllDocumentationPDFs };
