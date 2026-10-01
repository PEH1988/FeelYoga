/* ------------------------------------------------------------------
 * Pablo Hidalgo — CV · shared behaviour for every page
 *  - builds nav, mobile menu and footer
 *  - ES/EN switch (Spanish lives in the HTML, English below)
 *  - accordions, reveal-on-scroll, liquid WebGL background
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
    'home.sub': 'B2B sales. Key accounts. Data.',
    'home.tag': 'Results <em>first.</em>',
    'home.cue': 'Scroll down, or tap Menu to get to know me',

    /* experience */
    'exp.k': 'Experience',
    'exp.h': '8+ years opening markets and growing <em>key accounts.</em>',
    'exp.lead': 'B2B Account Executive focused on business development, new-business prospecting (hunter) and corporate account management. I negotiate with clients, build proposals, manage the pipeline and make decisions backed by KPIs.',
    'exp.omint.t': 'SME B2B Account Executive',
    'exp.omint.d': 'Jun 2026 — Present',
    'exp.omint.1': 'B2B prospecting and business development; management of the SME corporate client pipeline.',
    'exp.omint.2': 'Preparation of commercial proposals and negotiation with corporate clients.',
    'exp.america.d': 'May 2025 — Jun 2026',
    'exp.america.1': 'Account management and direct service to corporate clients.',
    'exp.america.2': 'Results analysis and tracking of commercial KPIs.',
    'exp.outlier.t': 'Data Analyst / AI Trainer',
    'exp.outlier.d': 'Jul 2024 — Apr 2025',
    'exp.outlier.1': 'Analysis and validation of data and interactions, focused on quality and performance metrics.',
    'exp.fp.t': 'Workers’ Comp (ART) Manager',
    'exp.fp.d': 'Apr 2016 — Jan 2023',
    'exp.fp.1': 'Managed and grew key corporate accounts, insurance agents and brokers; led a regional sales team.',
    'exp.fp.2': 'Portfolio KPI and sales performance analysis; improved client retention.',
    'exp.fp2.t': 'Commercial Analyst',
    'exp.fp2.d': 'Nov 2015 — Apr 2016',
    'exp.fp2.1': 'Technical-commercial client analysis for risk assessment and key-indicator reporting.',

    /* skills */
    'sk.k': 'Skills',
    'sk.h': 'Sales instinct, <em>data discipline.</em>',
    'sk.lead': 'I find the opportunity, build the proposal and close it. Then I measure what worked so the next deal comes easier.',
    'sk.c': 'Commercial',
    'sk.c1': 'Key account management', 'sk.c2': 'B2B prospecting (hunter)', 'sk.c3': 'Negotiation',
    'sk.c4': 'Closing deals', 'sk.c5': 'Pipeline & CRM', 'sk.c6': 'Commercial proposals',
    'sk.t': 'Technical',
    'sk.t4': 'Advanced Excel', 'sk.t5': 'KPI analysis', 'sk.t6': 'Dashboards & reporting', 'sk.t7': 'Data storytelling', 'sk.t8': 'Database modelling',
    'sk.l': 'Languages',
    'sk.es': 'Spanish', 'sk.native': 'Native', 'sk.en': 'English',
    'sk.mision': 'Results-driven, with an analytical mindset and a constant focus on customer satisfaction. Having lived in Australia, Spain and Argentina, I adapt fast and work well in diverse teams.',
    'sk.mision.s': 'Customer first',
    'sk.edu': 'Education',
    'sk.edu1.t': 'Data Analyst',
    'sk.edu2.t': 'Associate Degree in Marketing & Sales',

    /* portfolio */
    'pf.k': 'Portfolio',
    'pf.h': 'Data that turns into <em>decisions.</em>',
    'pf.lead': 'After 8 years in sales I found my passion for data. Now I bring both together: I understand the business and I know what to ask the numbers.',
    'pf.p1.w': 'IT support tickets analysed',
    'pf.p1.1': 'The IT team wanted to know where to improve its service. I built an interactive report with a star schema, DAX KPIs (satisfaction, days open, tickets per agent) and filters by year, month and agent.',
    'pf.live': 'View live dashboard →',
    'pf.p2.t': 'Sleep hygiene',
    'pf.p2.w': 'of 374 people have a sleep disorder',
    'pf.p2.1': 'More weight, less sleep? I crossed weight, stress and work data to see what keeps us awake. Spoiler: women suffer twice as many disorders (55.7% vs 27.5%) and stress is the main enemy.',
    'pf.case': 'Read the analysis →',
    'pf.more': 'More projects',
    'pf.p6.t': 'FeelYoga — website',
    'pf.p6.1': 'Responsive website for a yoga studio built with HTML5, SCSS and Bootstrap 5.',
    'pf.all': 'See full portfolio →',

    /* contact */
    'ct.k': 'Contact',
    'ct.h': 'Want to grow your sales? <em>Let’s talk.</em>',
    'ct.lead': 'Twenty minutes is enough to understand your business and see where I can add value. If it makes sense to keep going, we keep going.',
    'ct.cv': 'Download CV (PDF)',
    'ct.mail': 'Write me',
    'ct.phone': 'Phone',

    /* shared */
    'more': 'Read more', 'less': 'Read less',
    'next': 'Next', 'menu': 'Menu', 'close': 'Close', 'scroll': 'Scroll'
  };

  var ES_UI = { more: 'Ver más', less: 'Ver menos', next: 'Siguiente', menu: 'Menú', close: 'Cerrar', scroll: 'Scroll' };
  var GLOBE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19M12 2.5c3 3.2 3 15.8 0 19M12 2.5c-3 3.2-3 15.8 0 19"/></svg>';

  var lang = 'es';
  try { lang = localStorage.getItem('lang') === 'en' ? 'en' : 'es'; } catch (e) {}

  var here = location.pathname.split('/').pop() || 'index.html';
  var idx = Math.max(0, PAGES.findIndex(function (p) { return p.href === here; }));

  function ui(key) { return lang === 'en' ? EN[key] : ES_UI[key]; }
  function cur(p) { return p.href === PAGES[idx].href ? ' aria-current="page"' : ''; }

  /* ---- chrome: nav, overlay, next, footer ---- */
  function build() {
    var other = lang === 'es' ? 'EN' : 'ES';
    var nav = document.getElementById('nav');
    nav.innerHTML =
      '<a class="wm" href="index.html">Pablo Hidalgo</a><ul>' +
      PAGES.map(function (p) { return '<li><a href="' + p.href + '"' + cur(p) + '>' + p[lang] + '</a></li>'; }).join('') +
      '<li class="li-lang"><button class="lang" data-lang-toggle>' + GLOBE + other + '</button></li></ul>' +
      '<button class="menu" data-open>' + ui('menu') + '</button>';

    var ov = document.getElementById('ov');
    ov.innerHTML =
      '<button class="x label" data-close>' + ui('close') + '</button>' +
      PAGES.map(function (p) { return '<a class="disp" href="' + p.href + '"' + cur(p) + '>' + p[lang] + '</a>'; }).join('') +
      '<button class="lang" data-lang-toggle>' + GLOBE + (lang === 'es' ? 'English' : 'Español') + '</button>';

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
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-lang-toggle]')) {
      lang = lang === 'es' ? 'en' : 'es';
      try { localStorage.setItem('lang', lang); } catch (err) {}
      apply();
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

  /* ---- reveal on scroll ---- */
  var els = [].slice.call(document.querySelectorAll('.r'));
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } });
    }, { rootMargin: '0px 0px -10% 0px', threshold: .08 });
    els.forEach(function (e) { io.observe(e); });
  } else els.forEach(function (e) { e.classList.add('in'); });

  /* ---- liquid background (WebGL) ---- */
  var TONES = {
    cream: [[.60, .58, .53], [.79, .77, .72], [.97, .96, .93]],
    dark: [[.02, .02, .03], [.07, .07, .09], [.27, .27, .31]]
  };
  var liquid = (function () {
    var cv = document.getElementById('liq');
    if (!cv) return null;
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var gl = cv.getContext('webgl', { antialias: false, depth: false, stencil: false, powerPreference: 'low-power', preserveDrawingBuffer: reduce });
    if (!gl) { cv.remove(); return null; }

    var vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    var fs = [
      'precision mediump float;',
      'uniform vec2 R;uniform float T;uniform vec2 M;uniform vec3 A,B,C;',
      'float h(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}',
      'float n(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);',
      ' return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),',
      '            mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+1.),f.x),f.y),f.z);}',
      'float fbm(vec3 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*n(p);p=p*2.02+vec3(3.1,1.7,4.3);a*=.5;}return s;}',
      'float F(vec2 p,float t){vec2 w=vec2(fbm(vec3(p,t*.12)),fbm(vec3(p+4.7,t*.1)));',
      ' float v=fbm(vec3(p*1.3+w*1.2,t*.08));vec2 d=p-M;return v+.12*exp(-dot(d,d)*5.);}',
      'void main(){vec2 uv=(gl_FragCoord.xy-.5*R)/R.y*1.4;float e=.004;',
      ' float f=F(uv,T);float dx=F(uv+vec2(e,0.),T)-f;float dy=F(uv+vec2(0.,e),T)-f;',
      ' vec3 N=normalize(vec3(-dx*22.,-dy*22.,1.));vec3 L=normalize(vec3(-.4,.7,.6));',
      ' float dif=max(dot(N,L),0.);float sp=pow(max(dot(reflect(-L,N),vec3(0,0,1)),0.),48.);',
      ' vec3 rr=reflect(vec3(0,0,-1),N);float env=smoothstep(-.5,.9,rr.y);',
      ' float band=smoothstep(.4,.6,fract(rr.x*1.4+rr.y*.7+T*.02));',
      ' vec3 col=mix(A,B,env);col=mix(col,C,band*env*.55);col+=dif*.05+sp*.8;',
      ' col*=mix(.7,1.,smoothstep(1.5,.3,length(uv*vec2(.6,1.))));',
      ' gl_FragColor=vec4(col,1.);}'
    ].join('\n');

    function sh(t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null; }
    var a = sh(gl.VERTEX_SHADER, vs), b = sh(gl.FRAGMENT_SHADER, fs);
    if (!a || !b) { cv.remove(); return null; }
    var pr = gl.createProgram(); gl.attachShader(pr, a); gl.attachShader(pr, b); gl.linkProgram(pr); gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var lp = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
    var U = {}; ['R', 'T', 'M', 'A', 'B', 'C'].forEach(function (k) { U[k] = gl.getUniformLocation(pr, k); });

    var t = 3.7, mx = 0, my = 0, tx = 0, ty = 0;
    function draw() { gl.uniform2f(U.R, cv.width, cv.height); gl.uniform1f(U.T, t); gl.uniform2f(U.M, mx, my); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); }
    function mix(k) {
      var x = TONES.cream, y = TONES.dark;
      ['A', 'B', 'C'].forEach(function (u, i) {
        gl.uniform3f(U[u], x[i][0] + (y[i][0] - x[i][0]) * k, x[i][1] + (y[i][1] - x[i][1]) * k, x[i][2] + (y[i][2] - x[i][2]) * k);
      });
      if (reduce) draw();
    }
    function size() {
      var s = innerWidth < 700 ? .4 : .55;
      cv.width = Math.max(2, Math.floor(cv.clientWidth * s)); cv.height = Math.max(2, Math.floor(cv.clientHeight * s));
      gl.viewport(0, 0, cv.width, cv.height); draw();
    }
    mix(0); size(); addEventListener('resize', size);
    if (!reduce) {
      addEventListener('pointermove', function (ev) { tx = (ev.clientX / innerWidth - .5) * 1.4; ty = (.5 - ev.clientY / innerHeight) * 1.4; }, { passive: true });
      var t0 = performance.now(), last = 0;
      (function loop(now) {
        requestAnimationFrame(loop);
        if (document.hidden || now - last < 33) return; // ~30fps is plenty
        last = now; t = 3.7 + (now - t0) / 1000;
        mx += (tx - mx) * .04; my += (ty - my) * .04;
        draw();
      })(t0);
    }
    return { mix: mix };
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
      if (liquid) liquid.mix(Math.min(1, Math.max(0, (p - .05) / .5)));
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
