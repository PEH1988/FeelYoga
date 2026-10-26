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
    'home.sub': 'Project Coordinator | BI Analyst | Account Manager',
    'home.tag': 'Remote · Argentina · <em>GMT-3</em>',
    'home.cue': 'Scroll down, or tap Menu to get to know me',

    /* experience */
    'exp.k': 'Experience',
    'exp.h': 'I run projects, analyse data and grow <em>accounts.</em>',
    'exp.lead': '8+ years in insurance, healthcare and media coordinating teams and departments, analysing KPIs and managing corporate accounts. I turn ideas into concrete solutions: from understanding the need to delivering a working tool.',
    'exp.omint.t': 'Account Manager, SMB – Health Benefits',
    'exp.omint.i': 'Health Benefits',
    'exp.omint.d': 'Jun 2026 — Present',
    'exp.omint.1': 'Coordinated a custom React CRM end to end: gathered requirements, defined the scope and rolled it out to track the SMB account pipeline.',
    'exp.omint.2': 'Designed and launched a web quoting tool for individual and corporate plans: each quote takes 1 to 2 minutes.',
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
    'exp.fp.2': 'Built management reports and dashboards on portfolio, retention and collections KPIs, with account tracking in Microsoft Dynamics 365 CRM.',
    'exp.fp.3': 'Led the regional ART unit, coordinating Collections, Claims and Prevention to retain the portfolio, recover receivables and set up payment plans.',
    'tools': 'Tools', 'softs': 'Soft skills',
    'ss.nego': 'Negotiation', 'ss.rel': 'Relationship Building', 'ss.prob': 'Problem Solving',
    'ss.comm': 'Communication', 'ss.cust': 'Customer Focus', 'ss.adapt': 'Adaptability',
    'ss.crit': 'Critical Thinking', 'ss.detail': 'Attention to Detail', 'ss.time': 'Time Management',
    'ss.lead': 'Leadership', 'ss.anal': 'Analytical Thinking', 'ss.stake': 'Stakeholder Management', 'tool.excel': 'Advanced Excel',

    /* skills */
    'sk.k': 'Skills',
    'sk.h': 'I plan, analyse and <em>grow accounts.</em>',
    'sk.lead': 'I break work into clear stages, measure how each initiative performs and look after the client relationship.',
    'sk.p1': 'Needs & requirements gathering', 'sk.p2': 'Scoping & planning', 'sk.p3': 'Progress tracking & rollout', 'sk.p4': 'Stakeholder management', 'sk.p5': 'Cross-functional coordination',
    'sk.a1': 'Portfolio & key account management', 'sk.a2': 'Long-term relationships & retention',
    'sk.a3': 'Upselling & cross-selling', 'sk.a7': 'Debt recovery & payment plans', 'sk.a4': 'Proposals, negotiation & closing',
    'sk.a5': 'B2B prospecting (hunter)', 'sk.a6': 'Pipeline & CRM', 'sk.a6s': 'Learning',
    'sk.b1': 'KPI & performance tracking', 'sk.b2': 'Dashboards & reporting', 'sk.b3': 'Advanced Excel',
    'sk.b4': 'ETL & data modelling', 'sk.b5': 'Data storytelling',
    'sk.l': 'Leadership & languages',
    'sk.l1': 'Leading sales teams', 'sk.l2': 'Broker & channel management', 'sk.l3': 'Coordination with Collections, Claims & Prevention',
    'sk.es': 'Spanish', 'sk.native': 'Native', 'sk.en': 'English',
    'sk.mision': 'I combine project management, data analysis and a commercial drive. Having lived in Australia, Spain and Argentina, I adapt fast and work well with diverse teams.',
    'sk.mision.s': 'Native Spanish · English B2',
    'sk.edu': 'Education & certifications', 'sk.edu4.t': 'HubSpot Sales Software Certification', 'sk.edu4.l': 'View certificate →', 'sk.cert': 'Certified',
    'sk.edu1.t': 'Data Analyst',
    'sk.edu2.t': 'Associate Degree in Marketing & Sales',
    'sk.gpm1': 'Methodologies & management',
    'sk.gpm2': 'Planning & control', 'sk.gpm3': 'Interpersonal skills',
    'gpm.c1': 'Project Management', 'gpm.c2': 'Agile Project Management', 'gpm.c3': 'Waterfall', 'gpm.c4': 'Project Planning',
    'gpm.c5': 'Project Execution', 'gpm.c6': 'Project Closure', 'gpm.c7': 'Risk Management', 'gpm.c8': 'Budget Management',
    'gpm.c9': 'Stakeholder Management', 'gpm.c10': 'Change Management', 'gpm.c11': 'Quality Management', 'gpm.c12': 'Work Breakdown Structure (WBS)',
    'gpm.c13': 'Project Charter', 'gpm.c14': 'Strategic Thinking', 'gpm.c15': 'Effective Communication', 'gpm.c16': 'Influencing',
    'gpm.c17': 'Team Leadership', 'gpm.c18': 'Problem Solving', 'gpm.c19': 'Conflict Resolution', 'gpm.c20': 'Advanced Excel',
    'gpm.c21': 'Salesforce (fundamentals)', 'gpm.c22': 'Spreadsheets', 'gpm.c23': 'Gantt Charts', 'gpm.c24': 'Agile Backlog / User Stories',
    'sk.edu3.t': 'Google Project Management Certificate',

    /* portfolio */
    'pf.k': 'Portfolio',
    'pf.lead': 'Three perspectives, one goal: getting things done. I take projects from idea to rollout, use data to decide and look after the client relationship.',
    'pf.pm.w': 'tools taken from idea to production',
    'pf.pm.t': 'CRM, web quoting tool and lead-generation landing page: I coordinated requirements gathering, scoping, design, testing and rollout for each one. Google Project Management Certificate.',
    'pf.am.w': 'years managing B2B accounts',
    'pf.am.t': 'Corporate and strategic accounts, brokers and commercial partners in insurance, healthcare and media. Long-term relationships, retention, debt recovery, upselling and cross-selling.',
    'pf.ba.w': 'records analysed in a single dashboard',
    'pf.ba.t': 'Business Intelligence: KPI dashboards in Power BI (DAX, Power Query), Qlik Sense and SQL. I turn complex numbers into clear recommendations.',
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
    'ct.h': 'A project to deliver or accounts to grow? <em>Let’s talk.</em>',
    'ct.lead': 'If your team needs someone who organises projects, understands the data and looks after the client, let’s talk. I’m based in Mendoza and work in Spanish and English.',
    'ct.cv': 'Download CV (PDF)',
    'ct.mail': 'Write me',
    'ct.phone': 'Phone',

    /* shared */
    'more': 'Read more', 'less': 'Read less',
    'next': 'Next', 'menu': 'Menu', 'close': 'Close', 'scroll': 'Scroll', 'invert': 'Invert colors', 'normal': 'Original colors'
  };

  var ES_UI = { more: 'Ver más', less: 'Ver menos', next: 'Siguiente', menu: 'Menú', close: 'Cerrar', scroll: 'Scroll', invert: 'Invertir colores', normal: 'Colores originales' };
  // bump when the CV PDFs are regenerated, so browsers and the host never serve an old copy
  var CV_VERSION = '20261021b';
  var MODE_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M12 2.5a9.5 9.5 0 0 1 0 19z" fill="currentColor"/></svg>';
  var GLOBE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19M12 2.5c3 3.2 3 15.8 0 19M12 2.5c-3 3.2-3 15.8 0 19"/></svg>';

  var langHooks = [];   // run after a language switch (see the fx section)
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
      langHooks.forEach(function (f) { f(); });
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

  /* ------------------------------------------------------------------
   * fx: motion layer on top of the base site
   *  - scroll progress bar
   *  - hero h1 letter rise + kicker decode (replays on language switch)
   *  - text decode on hover for the big menu / next-page links
   *  - count-up for the big numbers
   *  - staggered chips / list items
   *  - home marquee of tools
   *  - desktop only: custom cursor, magnetic buttons, 3D tilt on shots
   * Everything is skipped (or left static) under prefers-reduced-motion.
   * ------------------------------------------------------------------ */
  (function () {
    var root = document.documentElement;
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
    var raf = requestAnimationFrame;

    /* ---- scroll progress (feedback, not decoration: kept under reduced motion) ---- */
    var bar = document.createElement('div');
    bar.className = 'fx-progress'; bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    var barQueued = false;
    function barUpdate() {
      barQueued = false;
      var max = root.scrollHeight - innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0) + ')';
    }
    function barQueue() { if (!barQueued) { barQueued = true; raf(barUpdate); } }
    addEventListener('scroll', barQueue, { passive: true });
    addEventListener('resize', barQueue);
    barUpdate();

    if (reduce) return;
    root.classList.add('fx');

    /* ---- text decode (scramble that settles left to right) ---- */
    var GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/+';
    function decode(el, dur, delay) {
      var tok = (el._fxTok || 0) + 1; el._fxTok = tok;
      var final = el.textContent, t0 = 0, last = 0;
      (function step(t) {
        if (el._fxTok !== tok) return;            // superseded (language switch, re-hover)
        if (!t0) t0 = t + (delay || 0);
        var p = (t - t0) / dur;
        if (p >= 1) { el.textContent = final; return; }
        if (p >= 0 && t - last > 45) {            // ~20 fps keeps it legible and "terminal-like"
          last = t;
          var n = Math.floor(p * final.length), out = '';
          for (var i = 0; i < final.length; i++) {
            var c = final[i];
            out += (i < n || c === ' ' || c === '→' || c === '·') ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0];
          }
          el.textContent = out;
        }
        raf(step);
      })(performance.now());
      return function cancel() { if (el._fxTok === tok) { el._fxTok++; el.textContent = final; } };
    }

    /* ---- hero h1: letters rise in, then the original markup is restored ---- */
    function splitRise(h) {
      var html = h.innerHTML, label = h.textContent.replace(/\s+/g, ' ').trim(), d = 0;
      var tok = (h._fxTok || 0) + 1; h._fxTok = tok;
      (function walk(node) {
        [].slice.call(node.childNodes).forEach(function (c) {
          if (c.nodeType === 1) return walk(c);
          if (c.nodeType !== 3 || !c.nodeValue.trim()) return;
          var frag = document.createDocumentFragment();
          c.nodeValue.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var w = document.createElement('span'); w.className = 'fx-w'; w.setAttribute('aria-hidden', 'true');
            for (var i = 0; i < part.length; i++) {
              var ch = document.createElement('span'); ch.className = 'fx-c';
              ch.style.setProperty('--d', (d++ * 22) + 'ms'); ch.textContent = part[i];
              w.appendChild(ch);
            }
            frag.appendChild(w);
          });
          node.replaceChild(frag, c);
        });
      })(h);
      h.setAttribute('aria-label', label);
      // restore the exact markup once done (kerning, screen readers, i18n source)
      setTimeout(function () {
        if (h._fxTok !== tok) return;
        h.innerHTML = html; h.removeAttribute('aria-label');
      }, d * 22 + 1000);
    }
    var hero = document.querySelector('.open .h'), kicker = document.querySelector('.open .k');
    if (hero) splitRise(hero);
    if (kicker) decode(kicker, 700, 150);
    langHooks.push(function () {
      // data-i18n elements were just rewritten by apply(): replay on the new text
      if (hero && hero.hasAttribute('data-i18n')) splitRise(hero);
      if (kicker) decode(kicker, 600, 0);
    });

    /* ---- decode on hover: menus, next-page link and the titles of each section ----
     * [hovered area, word that decodes inside it (null = the area itself)] */
    var HOVER = [
      ['.menu2 a, .next a, .nav li a', null],
      ['.list .row', '.hd b'],            // experience roles, education
      ['.step', 'b.disp'],                // skills columns
      ['.work', 'h2.disp'],               // portfolio projects
      ['.contact-lines a', 'b.disp']      // contact channels
    ];
    var hoverEl = null, hoverCancel = null;
    document.addEventListener('mouseover', function (e) {
      if (!e.target.closest) return;
      for (var i = 0; i < HOVER.length; i++) {
        var area = e.target.closest(HOVER[i][0]);
        if (!area) continue;
        if (area.contains(e.relatedTarget)) return;   // still inside the same area
        var el = HOVER[i][1] ? area.querySelector(HOVER[i][1]) : area;
        if (!el || el.children.length) return;        // only plain-text words, never markup
        if (hoverCancel) hoverCancel();
        hoverEl = el; hoverCancel = decode(el, 420, 0);
        return;
      }
    });
    // the text was just rewritten in the other language: stop without restoring the old one
    langHooks.push(function () { if (hoverEl) hoverEl._fxTok++; hoverEl = hoverCancel = null; });

    /* ---- count-up for the big numbers, ending on the exact original string ---- */
    function parse(s) {
      var m = s.match(/^([^\d]*)(\d[\d.,]*)([^\d]*)$/);
      if (!m) return null;
      var body = m[2], digits = body.replace(/\D/g, ''), dec = body.lastIndexOf(',');
      return { pre: m[1], body: body, suf: m[3], n: parseInt(digits, 10),
               min: dec >= 0 ? body.length - dec : 1 };      // "41,6" needs at least "0,x"
    }
    function fmt(p, k) {
      var d = String(k); while (d.length < p.min) d = '0' + d;
      var out = '', di = d.length - 1;
      for (var i = p.body.length - 1; i >= 0 && di >= 0; i--) {
        var c = p.body[i];
        if (/\d/.test(c)) out = d[di--] + out;
        else out = c + out;                                     // separator: only while digits remain
      }
      return p.pre + out + p.suf;
    }
    var nums = [].slice.call(document.querySelectorAll('.case .n, .stat .n')).map(function (el) {
      return { el: el, txt: el.textContent.trim(), p: parse(el.textContent.trim()) };
    }).filter(function (o) { return o.p && o.p.n > 0; });
    if (nums.length && 'IntersectionObserver' in window) {
      nums.forEach(function (o) {
        o.el.textContent = fmt(o.p, 0); o.el.setAttribute('aria-label', o.txt);
        o.el._fx = o;
      });
      var nio = new IntersectionObserver(function (en) {
        en.forEach(function (x) {
          if (!x.isIntersecting) return;
          nio.unobserve(x.target);
          var o = x.target._fx, t0 = performance.now(), dur = 1600;
          // lock the final width (fonts are loaded by now) so the label beside it never jumps
          o.el.textContent = o.txt; o.el.style.minWidth = o.el.offsetWidth + 'px';
          (function step(t) {
            var p = Math.min(1, (t - t0) / dur), e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
            o.el.textContent = p === 1 ? o.txt : fmt(o.p, Math.round(o.p.n * e));
            if (p < 1) raf(step); else { o.el.removeAttribute('aria-label'); o.el.style.minWidth = ''; }
          })(t0);
        });
      }, { threshold: .6 });
      nums.forEach(function (o) { nio.observe(o.el); });
    }

    /* ---- stagger: chips and list items reveal one after another ---- */
    document.querySelectorAll('.pm-skills .chips').forEach(function (row, r) {
      [].slice.call(row.children).forEach(function (c, i) { c.style.setProperty('--i', r * 3 + i); });
    });
    document.querySelectorAll('.step ul').forEach(function (ul) {
      [].slice.call(ul.children).forEach(function (c, i) { c.style.setProperty('--i', i); });
    });

    /* ---- marquee: clone the set so the loop is seamless ---- */
    document.querySelectorAll('.mq-track').forEach(function (t) {
      var set = t.firstElementChild; if (set) t.appendChild(set.cloneNode(true));
      t.classList.add('on');
    });

    if (!fine) return;

    /* ---- custom cursor + magnetic targets (mouse / trackpad only) ---- */
    root.classList.add('fx-cursor');
    var dot = document.createElement('div'), ring = document.createElement('div');
    dot.className = 'fx-dot'; ring.className = 'fx-ring';
    dot.setAttribute('aria-hidden', 'true'); ring.setAttribute('aria-hidden', 'true');
    document.body.appendChild(ring); document.body.appendChild(dot);
    var mx = -100, my = -100, rx = -100, ry = -100, moving = false, mag = null;
    var MAG = '.cta a, .lang, .mode, .nav .wm, .work-body .links a, .next a';
    function loop() {
      rx += (mx - rx) * .2; ry += (my - ry) * .2;
      ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
      if (Math.abs(mx - rx) + Math.abs(my - ry) > .1) raf(loop); else moving = false;
    }
    function unmag() {
      if (!mag) return;
      mag.style.translate = ''; mag.classList.remove('fx-mag');
      delete mag.dataset.fxX; delete mag.dataset.fxY; mag = null;
    }
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
      root.classList.add('fx-cursor-on');
      if (!moving) { moving = true; raf(loop); }
      var t = e.target.closest ? e.target : null;
      ring.classList.toggle('hot', !!(t && t.closest('a, button, [role="button"]')));
      ring.classList.toggle('view', !!(t && t.closest('.work .shot')));
      var m = t && t.closest(MAG);
      if (m !== mag) unmag();
      if (m) {
        mag = m; m.classList.add('fx-mag');
        var b = m.getBoundingClientRect(), ox = parseFloat(m.dataset.fxX || 0), oy = parseFloat(m.dataset.fxY || 0);
        var cx = b.left - ox + b.width / 2, cy = b.top - oy + b.height / 2;
        var dx = (mx - cx) * .25, dy = (my - cy) * .35;
        m.dataset.fxX = dx; m.dataset.fxY = dy;
        m.style.translate = dx.toFixed(1) + 'px ' + dy.toFixed(1) + 'px';
      }
    }, { passive: true });
    document.addEventListener('pointerdown', function () { ring.classList.add('down'); });
    document.addEventListener('pointerup', function () { ring.classList.remove('down'); });
    document.documentElement.addEventListener('mouseleave', function () { root.classList.remove('fx-cursor-on'); unmag(); });
    // the nav is rebuilt on language / mode switch: drop the stale reference
    var navEl = document.getElementById('nav');
    if (navEl && 'MutationObserver' in window) new MutationObserver(function () { mag = null; }).observe(navEl, { childList: true });

    /* ---- 3D tilt + glare on the portfolio screenshots ---- */
    document.querySelectorAll('.work .shot').forEach(function (s) {
      var box = null, q = false, px = .5, py = .5;
      function paint() {
        q = false; if (!box) return;
        s.style.transform = 'perspective(900px) rotateX(' + ((.5 - py) * 8).toFixed(2) + 'deg) rotateY(' + ((px - .5) * 10).toFixed(2) + 'deg)';
        s.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
        s.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
      }
      s.addEventListener('pointerenter', function () { box = s.getBoundingClientRect(); s.classList.add('tilt'); });
      s.addEventListener('pointermove', function (e) {
        if (!box) box = s.getBoundingClientRect();
        px = (e.clientX - box.left) / box.width; py = (e.clientY - box.top) / box.height;
        if (!q) { q = true; raf(paint); }
      });
      s.addEventListener('pointerleave', function () { box = null; s.classList.remove('tilt'); s.style.transform = ''; });
      addEventListener('scroll', function () { box = null; }, { passive: true });
    });
  })();
})();
