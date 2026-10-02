/* ------------------------------------------------------------------
 * Pablo Hidalgo — CV · shared behaviour for every page
 *  - builds nav, mobile menu and footer
 *  - ES/EN switch (Spanish lives in the HTML, English below)
 *  - accordions, reveal-on-scroll, scroll-scrubbed video background
 *  - home only: name cut out of the veil while scrolling
 * ------------------------------------------------------------------ */
(function () {
  var PAGES = [
    { href: 'index.html', es: 'Inicio', en: 'Home' },
    { href: 'experiencia.html', es: 'Experiencia', en: 'Experience' },
    { href: 'habilidades.html', es: 'Habilidades', en: 'Skills' },
    { href: 'portfolio.html', es: 'Portfolio', en: 'Portfolio' },
    { href: 'contacto.html', es: 'Contacto', en: 'Contact' }
  ];

  /* English copy. Keys match data-i18n attributes in the pages. */
  var EN = {
    /* home */
    'home.sub': 'Business &amp; Data Analyst | Account Management',
    'home.tag': 'Remote · Argentina · <em>GMT-3</em>',
    'home.cue': 'Scroll down, or tap Menu to get to know me',

    /* experience */
    'exp.k': 'Experience',
    'exp.h': 'I grow accounts and measure it with <em>data.</em>',
    'exp.lead': '8+ years managing corporate accounts, brokers and commercial partners in insurance, healthcare and media. I build long-term relationships, spot growth opportunities and use KPIs to turn insights into concrete actions.',
    'exp.omint.t': 'Account Manager, SMB – Health Benefits',
    'exp.omint.i': 'Health Benefits',
    'exp.omint.d': 'Jun 2026 — Present',
    'exp.omint.1': 'Built a custom React CRM to log, segment and track the SMB account pipeline.',
    'exp.omint.2': 'Designed a web quoting tool (landing page) for individual and corporate plans.',
    'exp.omint.3': 'Manage the SMB portfolio and its renewals.',
    'exp.america.t': 'Account Manager – Media',
    'exp.america.i': 'Media',
    'exp.america.d': 'May 2025 — Jun 2026',
    'exp.america.1': 'Managed a portfolio of corporate accounts as main point of contact.',
    'exp.america.2': 'Analyzed results and tracked commercial KPIs to spot opportunities and risks across the portfolio.',
    'exp.america.3': 'Direct support to corporate clients and follow-up on their satisfaction.',
    'exp.america.4': 'Prospected new accounts through social media and cold outreach, and grew existing ones through upselling and cross-selling.',
    'chip.social': 'Social media prospecting', 'chip.cold': 'Cold outreach',
    'chip.aitrain': 'AI Training', 'chip.llmeval': 'LLM Evaluation', 'chip.genai': 'Generative AI',
    'chip.analysis': 'Data Analysis', 'chip.qa': 'Quality Assurance',
    'exp.outlier.t': 'Data Analyst – AI Training &amp; Evaluation',
    'exp.outlier.d': 'Jul 2024 — Apr 2025',
    'exp.outlier.1': 'Evaluated and rated LLM outputs for accuracy, coherence and language quality.',
    'exp.outlier.2': 'Data quality control: validated interactions and flagged errors and inconsistencies.',
    'exp.outlier.3': 'Applied evaluation criteria and rubrics to improve model responses.',
    'exp.fp.t': 'Business Analyst → Workers’ Compensation Operations Manager',
    'exp.fp.i': 'Insurance',
    'exp.fp.d': 'Nov 2015 — Jan 2023',
    'exp.fp.note': 'ART is Argentina’s workers’ compensation system for occupational risks.',
    'exp.fp.1': 'Analyzed claims and portfolio data in Oracle BI (by region, product and risk) to set commercial and underwriting policies.',
    'exp.fp.2': 'Built management reports on portfolio, retention and collections KPIs, with account tracking in Microsoft Dynamics 365 CRM.',
    'exp.fp.3': 'Led the regional ART unit, coordinating Collections, Claims and Prevention to retain the portfolio, recover receivables and set up payment plans.',
    'tools': 'Tools', 'softs': 'Soft skills',
    'ss.nego': 'Negotiation', 'ss.rel': 'Relationship Building', 'ss.prob': 'Problem Solving',
    'ss.comm': 'Communication', 'ss.cust': 'Customer Focus', 'ss.adapt': 'Adaptability',
    'ss.crit': 'Critical Thinking', 'ss.detail': 'Attention to Detail', 'ss.time': 'Time Management',
    'ss.lead': 'Leadership', 'ss.anal': 'Analytical Thinking', 'ss.stake': 'Stakeholder Management', 'tool.excel': 'Advanced Excel',

    /* skills */
    'sk.k': 'Skills',
    'sk.h': 'Commercial mindset, <em>analytical thinking.</em>',
    'sk.lead': 'I understand what the client needs, measure how the account performs and turn what I find into concrete actions.',
    'sk.a1': 'Portfolio & key account management', 'sk.a2': 'Long-term relationships & retention',
    'sk.a3': 'Upselling & cross-selling', 'sk.a7': 'Debt recovery & payment plans', 'sk.a4': 'Proposals, negotiation & closing',
    'sk.a5': 'B2B prospecting (hunter)', 'sk.a6': 'Pipeline & CRM', 'sk.a6s': 'Learning',
    'sk.b1': 'KPI & performance tracking', 'sk.b2': 'Dashboards & reporting', 'sk.b3': 'Advanced Excel',
    'sk.b4': 'ETL & data modelling', 'sk.b5': 'Data storytelling',
    'sk.l': 'Leadership & languages',
    'sk.l1': 'Leading sales teams', 'sk.l2': 'Broker & channel management', 'sk.l3': 'Coordination with Collections, Claims & Prevention',
    'sk.es': 'Spanish', 'sk.native': 'Native', 'sk.en': 'English',
    'sk.mision': 'I combine a strong commercial drive with data analysis. Having lived in Australia, Spain and Argentina, I adapt fast and work well with diverse teams.',
    'sk.mision.s': 'Proactive · hands-on · results-driven',
    'sk.edu': 'Education',
    'sk.edu1.t': 'Data Analyst',
    'sk.edu2.t': 'Associate Degree in Marketing & Sales',
    'sk.edu3.t': 'Google Project Management',
    'sk.edu3.d': 'In progress',

    /* portfolio */
    'pf.k': 'Portfolio',
    'pf.lead': 'Two perspectives, one goal: growing accounts. I take care of the client relationship and use data to decide what to do next.',
    'pf.am.w': 'years managing B2B accounts',
    'pf.am.t': 'Corporate and strategic accounts, brokers and commercial partners in insurance, healthcare and media. Long-term relationships, retention, debt recovery, upselling and cross-selling.',
    'pf.ba.w': 'records analysed in a single dashboard',
    'pf.ba.t': 'KPIs, dashboards and performance analysis in Power BI, Qlik Sense and SQL. I turn complex numbers into clear recommendations.',
    'pf.p1.w': 'IT support tickets analysed',
    'pf.p1.1': 'The IT team wanted to know where to improve its service. I built an interactive report with operational KPIs in DAX (satisfaction, days open, tickets per agent), a star schema and filters by year, month and agent.',
    'pf.live': 'View live dashboard →',
    'pf.p2.t': 'Sleep hygiene',
    'pf.p2.w': 'of 374 people have a sleep disorder',
    'pf.p2.1': 'More weight, less sleep? I cleaned and modelled the data and crossed weight, stress and work to find what keeps us awake. Spoiler: women suffer twice as many disorders (55.7% vs 27.5%) and stress is the main enemy.',
    'pf.case': 'Read the analysis →',
    'pf.crm.1': 'React/JSX CRM to manage the B2B pipeline: logging, segmentation and follow-up of accounts and opportunities.',
    'pf.crm.link': 'View live demo →',
    'pf.quote.t': 'Pricing &amp; Quoting Tool – Individuals &amp; Companies',
    'pf.quote.1': 'Web quoting tool for individuals and companies: based on employment status or headcount, it compares several plans and generates a personalized PDF for the client. It flags plans that don’t apply for the headcount. Time per quote: 1 to 2 minutes.',
    'pf.quote.link': 'Try the demo with mock data →',
    'pf.land.t': 'Landing Page &amp; Lead Generation',
    'pf.land.1': 'Lead-capture landing page for health insurance: customer profiles, quote form, plan comparison and FAQ, with enquiries routed to WhatsApp and email.',
    'pf.quote.tool': 'Web landing page',
    'pf.all': 'See full data portfolio →',

    /* contact */
    'ct.k': 'Contact',
    'ct.h': 'Shall we grow your accounts? <em>Let’s talk.</em>',
    'ct.lead': 'If your team needs someone who looks after the client relationship and backs it with numbers, let’s talk. I’m based in Mendoza and work in Spanish and English.',
    'ct.cv': 'Download CV (PDF)',
    'ct.mail': 'Write me',
    'ct.phone': 'Phone',

    /* shared */
    'more': 'Read more', 'less': 'Read less',
    'next': 'Next', 'menu': 'Menu', 'close': 'Close', 'scroll': 'Scroll', 'invert': 'Invert colors', 'normal': 'Original colors'
  };

  var ES_UI = { more: 'Ver más', less: 'Ver menos', next: 'Siguiente', menu: 'Menú', close: 'Cerrar', scroll: 'Scroll', invert: 'Invertir colores', normal: 'Colores originales' };
  // bump when the CV PDFs are regenerated, so browsers and the host never serve an old copy
  var CV_VERSION = '20261025';
  var MODE_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M12 2.5a9.5 9.5 0 0 1 0 19z" fill="currentColor"/></svg>';
  var GLOBE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19M12 2.5c3 3.2 3 15.8 0 19M12 2.5c-3 3.2-3 15.8 0 19"/></svg>';

  var lang = 'es';
  try { lang = localStorage.getItem('lang') === 'en' ? 'en' : 'es'; } catch (e) {}

  var here = location.pathname.split('/').pop() || 'index.html';
  var idx = Math.max(0, PAGES.findIndex(function (p) { return p.href === here; }));

  function isDark() { return document.documentElement.dataset.mode === 'dark'; }
  function modeAttrs() {
    var label = ui(isDark() ? 'normal' : 'invert');
    return 'type="button" aria-pressed="' + isDark() + '" aria-label="' + label + '" title="' + label + '"';
  }
  function ui(key) { return lang === 'en' ? EN[key] : ES_UI[key]; }
  function cur(p) { return p.href === PAGES[idx].href ? ' aria-current="page"' : ''; }

  /* ---- chrome: nav, overlay, next, footer ---- */
  function build() {
    var other = lang === 'es' ? 'EN' : 'ES';
    var nav = document.getElementById('nav');
    nav.innerHTML =
      '<a class="wm" href="index.html">Pablo Hidalgo</a><ul>' +
      PAGES.map(function (p) { return '<li><a href="' + p.href + '"' + cur(p) + '>' + p[lang] + '</a></li>'; }).join('') +
      '<li class="li-lang"><button class="mode" data-mode-toggle ' + modeAttrs() + '>' + MODE_ICON + '</button><button class="lang" data-lang-toggle>' + GLOBE + other + '</button></li></ul>' +
      '<button class="mode m-only" data-mode-toggle ' + modeAttrs() + '>' + MODE_ICON + '</button>' +
      '<button class="menu" data-open>' + ui('menu') + '</button>';

    var ov = document.getElementById('ov');
    ov.innerHTML =
      '<button class="x label" data-close>' + ui('close') + '</button>' +
      PAGES.map(function (p) { return '<a class="disp" href="' + p.href + '"' + cur(p) + '>' + p[lang] + '</a>'; }).join('') +
      '<button class="lang" data-lang-toggle>' + GLOBE + (lang === 'es' ? 'English' : 'Español') + '</button>' +
      '<button class="mode" data-mode-toggle ' + modeAttrs() + '>' + MODE_ICON + '<span>' + ui(isDark() ? 'normal' : 'invert') + '</span></button>';

    var next = document.getElementById('next');
    if (next) {
      var n = PAGES[(idx + 1) % PAGES.length];
      next.innerHTML = '<span class="label">' + ui('next') + '</span><a class="disp" href="' + n.href + '">' + n[lang] + ' →</a>';
    }

    var ft = document.getElementById('footer');
    if (ft) ft.innerHTML = '<span>Pablo Hidalgo · Mendoza, Argentina</span><span>© ' + new Date().getFullYear() + '</span>';

    document.querySelectorAll('[data-ui]').forEach(function (el) { el.textContent = ui(el.dataset.ui); });
    document.querySelectorAll('.row').forEach(function (r) {
      var m = r.querySelector('.more');
      if (m) m.textContent = ui(r.classList.contains('is-open') ? 'less' : 'more');
    });
  }

  /* ---- translations ---- */
  var ES = {};
  document.querySelectorAll('[data-i18n]').forEach(function (el) { ES[el.dataset.i18n] = el.innerHTML; });

  function apply() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.dataset.i18n, v = lang === 'en' ? EN[k] : ES[k];
      if (v != null) el.innerHTML = v;
    });
    build();
    // CV download follows the page language
    document.querySelectorAll('[data-cv]').forEach(function (a) { a.href = 'Pablo-Hidalgo-CV-' + (lang === 'en' ? 'EN' : 'ES') + '.pdf?v=' + CV_VERSION; });
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-lang-toggle]')) {
      lang = lang === 'es' ? 'en' : 'es';
      try { localStorage.setItem('lang', lang); } catch (err) {}
      apply();
      return;
    }
    if (e.target.closest('[data-mode-toggle]')) {
      var dark = !isDark();
      if (dark) document.documentElement.dataset.mode = 'dark'; else delete document.documentElement.dataset.mode;
      try { localStorage.setItem('mode', dark ? 'dark' : 'light'); } catch (err) {}
      build();
      return;
    }
    if (e.target.closest('[data-open]')) document.getElementById('ov').classList.add('on');
    if (e.target.closest('[data-close]')) document.getElementById('ov').classList.remove('on');

    var row = e.target.closest('.row:not(.flat)');
    if (row && !e.target.closest('a')) {
      var open = row.classList.toggle('is-open');
      row.querySelector('.more').textContent = ui(open ? 'less' : 'more');
      row.setAttribute('aria-expanded', open);
    }
  });
  document.addEventListener('keydown', function (e) {
    var row = e.target.closest && e.target.closest('.row:not(.flat)');
    if (row && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); row.click(); }
  });
  document.querySelectorAll('.row:not(.flat)').forEach(function (r) {
    r.tabIndex = 0; r.setAttribute('role', 'button'); r.setAttribute('aria-expanded', 'false');
  });

  apply();

  /* nav background once scrolled */
  function navState() { var n = document.getElementById('nav'); if (n) n.classList.toggle('solid', scrollY > 40); }
  addEventListener('scroll', navState, { passive: true }); navState();

  /* ---- reveal on scroll ---- */
  var els = [].slice.call(document.querySelectorAll('.r'));
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } });
    }, { rootMargin: '0px 0px -10% 0px', threshold: .08 });
    els.forEach(function (e) { io.observe(e); });
  } else els.forEach(function (e) { e.classList.add('in'); });

  /* ---- scroll-driven video background ----
   * The clip lives as a WebP frame sequence (assets/frames/f001…f120).
   * Scroll position across the whole page picks the frame; frames load
   * coarse-to-fine so something sensible is always on screen. */
  (function () {
    var cv = document.getElementById('scrub');
    if (!cv) return;
    var ctx = cv.getContext('2d');
    var N = 120, frames = new Array(N), shown = -1, target = 0, cur = 0;
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    function src(i) { return 'assets/frames/f' + ('00' + (i + 1)).slice(-3) + '.webp'; }

    // load frames in playback order (several at a time), so the frames just
    // ahead of the scroll position are always the next ones to arrive
    var next = 0, busy = 0;
    function pump() {
      while (busy < 8 && next < N) {
        (function (i) {
          var im = new Image(); busy++;
          im.onload = function () { frames[i] = im; busy--; if (shown < 0) draw(Math.round(cur)); pump(); };
          im.onerror = function () { busy--; pump(); };
          im.src = src(i);
        })(next++);
      }
    }
    pump();

    // nearest frame already loaded at or below i (never jump ahead)
    function nearest(i) {
      for (var k = i; k >= 0; k--) if (frames[k]) return k;
      return -1;
    }
    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.round(cv.clientWidth * dpr), h = Math.round(cv.clientHeight * dpr);
      if (w === cv.width && h === cv.height) return;   // mobile URL bar show/hide: nothing to do
      cv.width = w; cv.height = h;                     // (this clears the canvas…)
      shown = -1; draw(Math.round(cur));               // …so repaint right away
    }
    function draw(i) {
      var k = frames[i] ? i : (shown < 0 ? nearest(i) : shown);
      if (k < 0 || k === shown) return;
      var im = frames[k], W = cv.width, H = cv.height;
      var sc = Math.max(W / im.naturalWidth, H / im.naturalHeight); // cover
      var w = im.naturalWidth * sc, h = im.naturalHeight * sc;
      ctx.drawImage(im, (W - w) / 2, (H - h) / 2, w, h);
      shown = k;
    }
    function progress() {
      var max = document.documentElement.scrollHeight - innerHeight;
      return max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    }
    size(); addEventListener('resize', size);
    if (reduce) {
      // one still frame, no scrubbing
      var still = Math.round(N * .35);
      (function wait() { frames[still] ? draw(still) : setTimeout(wait, 120); })();
      return;
    }
    (function loop() {
      target = progress() * (N - 1);
      cur += (target - cur) * .18;            // ease toward the scroll position
      if (Math.abs(target - cur) < .01) cur = target;
      draw(Math.round(cur));
      requestAnimationFrame(loop);
    })();
  })();

  /* ---- home: name cut out of the cream veil ---- */
  (function () {
    var stage = document.getElementById('stage');
    if (!stage) return;
    var veil = document.getElementById('veil'), svg = veil.querySelector('svg'),
        mtext = document.getElementById('mtext'), mg = document.getElementById('mg'),
        sub = document.getElementById('sub'), cap = document.getElementById('cap');
    var W = 0, H = 0, base = 0, NAME = 'PABLO HIDALGO';

    function size() {
      W = innerWidth; H = innerHeight;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.querySelectorAll('rect').forEach(function (r) { r.setAttribute('width', W); r.setAttribute('height', H); });
      var lines = W < 640 ? NAME.split(' ') : [NAME];
      while (mtext.firstChild) mtext.removeChild(mtext.firstChild);
      mtext.setAttribute('font-size', 100);
      lines.forEach(function (l) {
        var ts = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        ts.setAttribute('x', W / 2); ts.textContent = l; mtext.appendChild(ts);
      });
      var widest = 0;
      mtext.querySelectorAll('tspan').forEach(function (ts) { widest = Math.max(widest, ts.getComputedTextLength()); });
      base = Math.min(100 * (W * .86) / widest, H * .26);
      mtext.setAttribute('font-size', base);
      mtext.querySelectorAll('tspan').forEach(function (ts, i) { ts.setAttribute('y', H / 2 + (i - (lines.length - 1) / 2) * base * 1.05 - base * .4); });
      sub.style.setProperty('--sub-off', (base * 1.05 * lines.length / 2 - base * .1) + 'px');
      update();
    }
    function update() {
      var r = stage.getBoundingClientRect(), total = stage.offsetHeight - H;
      var p = Math.min(1, Math.max(0, -r.top / total));
      veil.style.opacity = Math.min(1, p * 2.2);
      var sc = 1 + 7 * Math.pow(1 - Math.min(1, p * 1.25), 2.2);
      mg.setAttribute('transform', 'translate(' + W / 2 + ' ' + H / 2 + ') scale(' + sc + ') translate(' + (-W / 2) + ' ' + (-H / 2) + ')');
      sub.classList.toggle('on', p > .72);
      cap.classList.toggle('on', p > .72);
    }
    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', size);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(size);
    size();
  })();
})();
