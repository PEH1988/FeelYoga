/* ------------------------------------------------------------------
 * PORTFOLIO
 * Edit this list to add, remove or change projects.
 *  - category: used by the filter buttons (dashboards | data | sales | web)
 *  - image:    optional path to a screenshot (e.g. "img/dashboard.png")
 *  - link:     optional URL (demo, PDF, LinkedIn post, GitHub, etc.)
 *  - example:  true shows an "Ejemplo" badge — remove it once the
 *              project is replaced with real content.
 * ------------------------------------------------------------------ */
const PORTFOLIO = [
  {
    category: 'dashboards',
    icon: '📊',
    example: true,
    title: { es: 'Dashboard de KPIs comerciales', en: 'Sales KPI dashboard' },
    text: {
      es: 'Tablero en Power BI para seguir pipeline, conversión por etapa y cumplimiento de objetivos por ejecutivo.',
      en: 'Power BI dashboard tracking pipeline, stage conversion and quota attainment per account executive.'
    },
    tags: ['Power BI', 'DAX', 'KPIs']
  },
  {
    category: 'data',
    icon: '🗄️',
    example: true,
    title: { es: 'Análisis de retención de cartera', en: 'Portfolio retention analysis' },
    text: {
      es: 'Consultas SQL y análisis de cohortes para detectar riesgo de baja en cuentas corporativas.',
      en: 'SQL queries and cohort analysis to flag churn risk across corporate accounts.'
    },
    tags: ['SQL', 'Excel', 'Retención']
  },
  {
    category: 'dashboards',
    icon: '📈',
    example: true,
    title: { es: 'Reporting de cartera en Qlik Sense', en: 'Qlik Sense portfolio reporting' },
    text: {
      es: 'Reportes de performance comercial por región, producto y canal (PAS y brokers).',
      en: 'Sales performance reports by region, product and channel (agents and brokers).'
    },
    tags: ['Qlik Sense', 'Reporting']
  },
  {
    category: 'sales',
    icon: '🎯',
    example: true,
    title: { es: 'Plan de prospección B2B PyME', en: 'SME B2B prospecting plan' },
    text: {
      es: 'Segmentación de mercado, cadencias de contacto y propuesta de valor para captar nuevas cuentas.',
      en: 'Market segmentation, outreach cadences and value proposition to win new accounts.'
    },
    tags: ['Hunter', 'CRM', 'Pipeline']
  },
  {
    category: 'data',
    icon: '🎓',
    example: true,
    title: { es: 'Proyecto final — Analista de Datos', en: 'Capstone — Data Analyst' },
    text: {
      es: 'Proyecto integrador de Jupi Digital: limpieza, modelado y visualización de un dataset real.',
      en: 'Jupi Digital capstone: cleaning, modelling and visualising a real-world dataset.'
    },
    tags: ['SQL', 'Power BI', 'Python']
  },
  {
    category: 'web',
    icon: '🧘',
    image: '../public/img/back.jpg',
    link: '../index.html',
    title: { es: 'FeelYoga — sitio web', en: 'FeelYoga — website' },
    text: {
      es: 'Sitio responsive para un estudio de yoga con HTML5, SCSS y Bootstrap 5.',
      en: 'Responsive website for a yoga studio built with HTML5, SCSS and Bootstrap 5.'
    },
    tags: ['HTML', 'SCSS', 'Bootstrap']
  }
];

const CATEGORIES = {
  all: { es: 'Todos', en: 'All' },
  dashboards: { es: 'Dashboards', en: 'Dashboards' },
  data: { es: 'Datos', en: 'Data' },
  sales: { es: 'Comercial', en: 'Sales' },
  web: { es: 'Web', en: 'Web' }
};

/* ------------------------------------------------------------------
 * TRANSLATIONS (English). Spanish lives in the HTML itself.
 * ------------------------------------------------------------------ */
const EN = {
  'nav.about': 'Profile', 'nav.experience': 'Experience', 'nav.skills': 'Skills',
  'nav.portfolio': 'Portfolio', 'nav.education': 'Education', 'nav.contact': 'Contact',
  'hero.hello': "Hi, I'm",
  'hero.role': 'B2B Account Executive — Key Accounts',
  'hero.lead': '8+ years developing business, opening new markets and growing corporate accounts, backed by a data-driven mindset.',
  'hero.download': 'Download CV (PDF)', 'hero.contact': 'Get in touch',
  'stats.years': 'years in B2B sales', 'stats.lead': 'years leading key accounts', 'stats.english': 'English level',
  'about.p1': 'B2B Account Executive with 8+ years of experience in business development, new-business prospecting (hunter) and management of corporate and key accounts.',
  'about.p2': 'Experienced in negotiation, commercial proposals, pipeline management and KPI analysis for decision making. Results-driven, with strong analytical skills (advanced Excel, Power BI, SQL) and a focus on customer satisfaction.',
  'exp.omint.date': 'Jun 2026 — Present', 'exp.omint.role': 'SME B2B Account Executive',
  'exp.omint.1': 'B2B prospecting and business development; management of the SME corporate client pipeline.',
  'exp.omint.2': 'Preparation of commercial proposals and negotiation with corporate clients.',
  'exp.america.date': 'May 2025 — Jun 2026',
  'exp.america.1': 'Account management and direct service to corporate clients.',
  'exp.america.2': 'Results analysis and tracking of commercial KPIs.',
  'exp.outlier.date': 'Jul 2024 — Apr 2025', 'exp.outlier.role': 'Data Analyst / AI Trainer',
  'exp.outlier.1': 'Analysis and validation of data and interactions, focused on quality and performance metrics.',
  'exp.fp.date': 'Apr 2016 — Jan 2023', 'exp.fp.role': 'Workers’ Comp (ART) Manager',
  'exp.fp.1': 'Managed and grew key corporate accounts, insurance agents and brokers; led a regional sales team.',
  'exp.fp.2': 'Portfolio KPI and sales performance analysis; improved client retention.',
  'exp.fp2.date': 'Nov 2015 — Apr 2016', 'exp.fp2.role': 'Commercial Analyst',
  'exp.fp2.1': 'Technical-commercial client analysis for risk assessment and key-indicator reporting.',
  'tag.negotiation': 'Negotiation', 'tag.metrics': 'Metrics', 'tag.keyaccounts': 'Key accounts',
  'tag.leadership': 'Leadership', 'tag.retention': 'Retention', 'tag.risk': 'Risk assessment',
  'skills.commercial': 'Commercial', 'skills.technical': 'Technical', 'skills.languages': 'Languages',
  'skills.c1': 'Key account management', 'skills.c2': 'B2B prospecting (hunter)', 'skills.c4': 'Closing deals',
  'skills.c5': 'Pipeline & CRM management', 'skills.c6': 'Commercial proposals',
  'skills.t4': 'Advanced Excel', 'skills.t5': 'KPI analysis', 'skills.t6': 'Dashboards & reporting',
  'skills.es': 'Spanish', 'skills.en': 'English', 'skills.native': 'Native',
  'portfolio.intro': 'A selection of work and projects combining sales strategy and data analysis.',
  'edu.data': 'Data Analyst', 'edu.marketing': 'Associate Degree in Marketing & Sales',
  'contact.text': 'Shall we talk about growing your client portfolio?'
};

/* ------------------------------------------------------------------ */
let lang = 'es';
let filter = 'all';
const ES = {};

document.querySelectorAll('[data-i18n]').forEach(el => {
  if (!(el.dataset.i18n in ES)) ES[el.dataset.i18n] = el.textContent;
});

function renderFilters() {
  const box = document.getElementById('portfolio-filters');
  const used = ['all', ...new Set(PORTFOLIO.map(p => p.category))];
  box.innerHTML = '';
  used.forEach(cat => {
    const b = document.createElement('button');
    b.className = 'chip' + (cat === filter ? ' active' : '');
    b.textContent = CATEGORIES[cat] ? CATEGORIES[cat][lang] : cat;
    b.onclick = () => { filter = cat; renderFilters(); renderPortfolio(); };
    box.appendChild(b);
  });
}

function renderPortfolio() {
  const grid = document.getElementById('portfolio-grid');
  grid.innerHTML = '';
  PORTFOLIO.filter(p => filter === 'all' || p.category === filter).forEach(p => {
    const card = document.createElement(p.link ? 'a' : 'article');
    card.className = 'project';
    if (p.link) { card.href = p.link; if (/^https?:/.test(p.link)) { card.target = '_blank'; card.rel = 'noopener'; } }

    const thumb = document.createElement('div');
    thumb.className = 'thumb';
    if (p.image) thumb.style.backgroundImage = `url("${p.image}")`;
    else thumb.textContent = p.icon || '•';

    const body = document.createElement('div');
    body.className = 'body';
    const kind = document.createElement('span');
    kind.className = 'kind mono';
    kind.textContent = (CATEGORIES[p.category] ? CATEGORIES[p.category][lang] : p.category) +
      (p.example ? (lang === 'es' ? ' · Ejemplo' : ' · Example') : '');
    const h = document.createElement('h4');
    h.textContent = p.title[lang];
    const txt = document.createElement('p');
    txt.textContent = p.text[lang];
    const tags = document.createElement('div');
    tags.className = 'tags';
    p.tags.forEach(t => { const s = document.createElement('span'); s.textContent = t; tags.appendChild(s); });

    body.append(kind, h, txt, tags);
    card.append(thumb, body);
    grid.appendChild(card);
  });
}

function setLang(next) {
  lang = next;
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const value = lang === 'en' ? EN[key] : ES[key];
    if (value) el.textContent = value;
  });
  document.getElementById('lang-toggle').textContent = lang === 'es' ? 'EN' : 'ES';
  renderFilters();
  renderPortfolio();
  try { localStorage.setItem('lang', lang); } catch (e) {}
}

document.getElementById('lang-toggle').addEventListener('click', () => setLang(lang === 'es' ? 'en' : 'es'));

document.getElementById('theme-toggle').addEventListener('click', () => {
  const root = document.documentElement;
  const isDark = root.dataset.theme
    ? root.dataset.theme === 'dark'
    : matchMedia('(prefers-color-scheme: dark)').matches;
  root.dataset.theme = isDark ? 'light' : 'dark';
  try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
});

// Highlight the nav link of the section in view and reveal sections on scroll.
const links = [...document.querySelectorAll('.nav a')];
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
  });
}, { rootMargin: '-40% 0px -55% 0px' });
document.querySelectorAll('.section').forEach(s => { s.classList.add('reveal'); io.observe(s); });
// Sections already on screen at load (or tall ones) should show immediately.
const revealIO = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); } });
}, { threshold: 0.05 });
document.querySelectorAll('.section').forEach(s => revealIO.observe(s));

document.getElementById('year').textContent = new Date().getFullYear();

let saved = 'es';
try { saved = localStorage.getItem('lang') || 'es'; } catch (e) {}
setLang(saved);
