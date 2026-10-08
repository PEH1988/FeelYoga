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
    // spread the content over the whole A4 page: grow the spacing unit --s until the
    // content fills the printable area (210x297mm minus @page margins 14/14 x 11/10mm)
    await p.emulateMedia({ media: 'print' });
    await p.setViewportSize({ width: Math.round(182 * 96 / 25.4), height: 1000 });
    const s = await p.evaluate(() => {
      const target = 276 * 96 / 25.4 - 6;
      const fit = v => { document.documentElement.style.setProperty('--s', v + 'px'); return document.body.scrollHeight <= target; };
      // if even the tightest spacing overflows, step the body text down a little
      for (let pt = 9.6; pt >= 8.6; pt -= 0.2) {
        document.body.style.fontSize = pt + 'pt';
        if (!fit(6)) continue;
        let lo = 6, hi = 40;
        for (let i = 0; i < 20; i++) { const m = (lo + hi) / 2; fit(m) ? lo = m : hi = m; }
        fit(lo); return pt.toFixed(1) + 'pt, spacing ' + lo.toFixed(1) + 'px';
      }
      return 'does not fit';
    });
    console.log(code, s);
    await p.pdf({ path: path.join(__dirname, '..', out), format: 'A4', printBackground: true, preferCSSPageSize: true });
    console.log('wrote', out);
  }
  await b.close();
})();
