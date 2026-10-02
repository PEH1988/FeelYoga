// Print cv-es.html / cv-en.html to ../Pablo-Hidalgo-CV-ES.pdf / -EN.pdf (headless Chromium).
const path = require('path');
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');

(async () => {
  const b = await chromium.launch();
  for (const [code, out] of [['es', 'Pablo-Hidalgo-CV-ES.pdf'], ['en', 'Pablo-Hidalgo-CV-EN.pdf']]) {
    const p = await b.newPage();
    // fetch Google Fonts with curl so it works behind a proxy too
    await p.route(/fonts\.(googleapis|gstatic)\.com/, r => {
      const body = execFileSync('curl', ['-sSL', '-A', 'Mozilla/5.0 Chrome/120', r.request().url()]);
      r.fulfill({ status: 200, body, headers: { 'content-type': r.request().url().includes('css2') ? 'text/css' : 'font/woff2', 'access-control-allow-origin': '*' } });
    });
    await p.goto('file://' + path.join(__dirname, `cv-${code}.html`), { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    await p.pdf({ path: path.join(__dirname, '..', out), format: 'A4', printBackground: true, preferCSSPageSize: true });
    console.log('wrote', out);
  }
  await b.close();
})();
