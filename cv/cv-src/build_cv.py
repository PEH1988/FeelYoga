#!/usr/bin/env python3
"""Build Pablo Hidalgo's CV (ES + EN) as HTML; build_cv.js prints them to PDF.

Edit the content below, then run:
    python3 cv-src/build_cv.py && node cv-src/build_cv.js
Set WEB_URL once the site has its own domain (e.g. "pablohidalgo.com").
"""
import html, pathlib

WEB_URL = "pablohidalgo.site"

HERE = pathlib.Path(__file__).parent

CV = {
  "es": {
    "lang": "es",
    "title": "Analista de Negocio y Datos | Gestión de Cuentas",
    "loc": "Mendoza, Argentina · Remoto (GMT-3)",
    "web_label": "Web / Portfolio",
    "web_ph": "[agregar link de la web]",
    "h_profile": "Perfil",
    "profile": "Analista de negocio y datos con más de 8 años en gestión de cuentas B2B en seguros, salud y medios. "
               "Combino la relación con el cliente con análisis de datos (SQL, Power BI, Qlik Sense, Oracle BI) para seguir KPIs, "
               "entender la performance de la cartera y convertir hallazgos en acciones concretas. Experiencia liderando una unidad "
               "regional y coordinando áreas de Cobranzas, Siniestros y Prevención. Viví en Australia, España y Argentina.",
    "h_exp": "Experiencia",
    "h_projects": "Proyectos",
    "h_skills": "Habilidades",
    "h_edu": "Formación",
    "h_lang": "Idiomas",
    "soft": "Soft skills",
    "tools": "Herramientas",
    "jobs": [
      {"t": "Ejecutivo Comercial PyME", "org": "Grupo Omint", "ind": "Beneficios de salud", "d": "Jun 2026 – Actualidad",
       "b": ["Construí un CRM propio en React para registrar, segmentar y dar seguimiento al pipeline de cuentas PyME.",
             "Diseñé un cotizador web (landing page) para planes individuales y corporativos.",
             "Gestiono la cartera PyME y sus renovaciones."],
       "s": ["Negociación", "Construcción de relaciones", "Resolución de problemas"],
       "tl": ["React", "CRM", "Microsoft Dynamics 365 CRM"]},
      {"t": "Account Manager – Medios", "org": "Grupo América", "ind": "Medios", "d": "May 2025 – Jun 2026",
       "b": ["Gestioné una cartera de cuentas corporativas como punto de contacto principal.",
             "Analicé resultados y seguí KPIs comerciales para detectar oportunidades y riesgos en la cartera.",
             "Prospecté nuevas cuentas por redes sociales y venta en frío, y desarrollé las existentes con upselling y cross-selling."],
       "s": ["Comunicación efectiva", "Orientación al cliente", "Adaptabilidad"],
       "tl": ["Prospección en redes sociales", "Venta en frío", "Upselling", "Cross-selling"]},
      {"t": "Analista de Datos – Entrenamiento y Evaluación de IA", "org": "Outlier", "ind": "", "d": "Jul 2024 – Abr 2025",
       "b": ["Evalué y califiqué outputs de LLMs según precisión, coherencia y calidad lingüística.",
             "Control de calidad de datos: validé interacciones y detecté errores e inconsistencias.",
             "Apliqué criterios y rúbricas de evaluación para mejorar las respuestas del modelo."],
       "s": ["Pensamiento crítico", "Atención al detalle", "Gestión del tiempo"],
       "tl": ["Entrenamiento de IA", "Evaluación de LLMs", "Prompt Engineering", "IA Generativa", "Análisis de datos", "Control de calidad"]},
      {"t": "Analista de Negocio → Responsable de Operaciones ART", "org": "Federación Patronal Seguros", "ind": "Seguros", "d": "Nov 2015 – Ene 2023",
       "note": "ART: sistema argentino de cobertura de riesgos del trabajo (workers' compensation).",
       "b": ["Analicé siniestralidad y cartera en Oracle BI (por zona, producto y riesgo) para definir políticas comerciales y de suscripción.",
             "Construí reportes de gestión sobre KPIs de cartera, retención y cobranzas, con seguimiento de cuentas en Microsoft Dynamics 365 CRM.",
             "Lideré la unidad ART regional, coordinando Cobranzas, Siniestros y Prevención para retener cartera, recuperar cobranzas y armar planes de pago."],
       "s": ["Liderazgo", "Pensamiento analítico", "Gestión de stakeholders"],
       "tl": ["Excel avanzado", "Oracle BI", "Microsoft Dynamics 365 CRM"]},
    ],
    "projects": [
      ("Tractchun · Power BI", "Reporte interactivo sobre 97.948 tickets de soporte TI: modelo estrella, KPIs en DAX (satisfacción, días abiertos, tickets por agente)."),
      ("Higiene del sueño · Qlik Sense, SQL, Snowflake", "Análisis de 374 personas: limpieza y modelado de datos; 41,6% presenta trastornos del sueño, con el estrés como principal factor."),
      ("Pipeline CRM · React", "CRM propio para gestionar el pipeline B2B: registro, segmentación y seguimiento de cuentas y oportunidades."),
      ("Cotizador de Planes – Individuos y Empresas", "Cotizador web que compara planes según situación laboral o nómina y genera un PDF por cliente. 1 a 2 minutos por cotización."),
      ("Landing Page y Generación de Leads", "Landing de captación con formulario de cotización, comparación de planes y consultas derivadas a WhatsApp y email."),
    ],
    "skills": [
      ("Business Analysis", "Seguimiento de KPIs y performance · Dashboards y reporting · ETL y modelado de datos · Storytelling con datos"),
      ("Datos y BI", "SQL · MySQL · Snowflake · Power BI · Qlik Sense · Oracle BI · Excel avanzado · Google Workspace"),
      ("Account Management", "Gestión de cartera y grandes cuentas · Retención · Upselling y cross-selling · Recupero de cobranzas · Negociación"),
      ("CRM", "Microsoft Dynamics 365 · CRM propio en React · Salesforce (en estudio)"),
      ("Liderazgo", "Conducción de equipos · Gestión de brokers y canales · Coordinación entre áreas"),
    ],
    "edu": [("Certificado de Project Management de Google", "Coursera", "En curso"),
            ("Analista de Datos", "Jupi Digital", "2024 – 2025"),
            ("Tecnicatura en Comercialización", "Universidad Siglo 21", "2016 – 2020")],
    "langs": "Español (nativo) · Inglés (B2, intermedio avanzado)",
  },
  "en": {
    "lang": "en",
    "title": "Business & Data Analyst | Account Management",
    "loc": "Mendoza, Argentina · Remote (GMT-3)",
    "web_label": "Website / Portfolio",
    "web_ph": "[add website link]",
    "h_profile": "Profile",
    "profile": "Business and data analyst with 8+ years managing B2B accounts in insurance, healthcare and media. "
               "I combine client relationships with data analysis (SQL, Power BI, Qlik Sense, Oracle BI) to track KPIs, "
               "understand portfolio performance and turn insights into concrete actions. Experience leading a regional unit and "
               "coordinating Collections, Claims and Prevention teams. Lived in Australia, Spain and Argentina.",
    "h_exp": "Experience",
    "h_projects": "Projects",
    "h_skills": "Skills",
    "h_edu": "Education",
    "h_lang": "Languages",
    "soft": "Soft skills",
    "tools": "Tools",
    "jobs": [
      {"t": "Account Manager, SMB – Health Benefits", "org": "Grupo Omint", "ind": "Health Benefits", "d": "Jun 2026 – Present",
       "b": ["Built a custom React CRM to log, segment and track the SMB account pipeline.",
             "Designed a web quoting tool (landing page) for individual and corporate plans.",
             "Manage the SMB portfolio and its renewals."],
       "s": ["Negotiation", "Relationship Building", "Problem Solving"],
       "tl": ["React", "CRM", "Microsoft Dynamics 365 CRM"]},
      {"t": "Account Manager – Media", "org": "Grupo América", "ind": "Media", "d": "May 2025 – Jun 2026",
       "b": ["Managed a portfolio of corporate accounts as main point of contact.",
             "Analyzed results and tracked commercial KPIs to spot opportunities and risks across the portfolio.",
             "Prospected new accounts through social media and cold outreach, and grew existing ones through upselling and cross-selling."],
       "s": ["Communication", "Customer Focus", "Adaptability"],
       "tl": ["Social media prospecting", "Cold outreach", "Upselling", "Cross-selling"]},
      {"t": "Data Analyst – AI Training & Evaluation", "org": "Outlier", "ind": "", "d": "Jul 2024 – Apr 2025",
       "b": ["Evaluated and rated LLM outputs for accuracy, coherence and language quality.",
             "Data quality control: validated interactions and flagged errors and inconsistencies.",
             "Applied evaluation criteria and rubrics to improve model responses."],
       "s": ["Critical Thinking", "Attention to Detail", "Time Management"],
       "tl": ["AI Training", "LLM Evaluation", "Prompt Engineering", "Generative AI", "Data Analysis", "Quality Assurance"]},
      {"t": "Business Analyst → Workers' Compensation Operations Manager", "org": "Federación Patronal Seguros", "ind": "Insurance", "d": "Nov 2015 – Jan 2023",
       "note": "ART is Argentina's workers' compensation system for occupational risks.",
       "b": ["Analyzed claims and portfolio data in Oracle BI (by region, product and risk) to set commercial and underwriting policies.",
             "Built management reports on portfolio, retention and collections KPIs, with account tracking in Microsoft Dynamics 365 CRM.",
             "Led the regional ART unit, coordinating Collections, Claims and Prevention to retain the portfolio, recover receivables and set up payment plans."],
       "s": ["Leadership", "Analytical Thinking", "Stakeholder Management"],
       "tl": ["Advanced Excel", "Oracle BI", "Microsoft Dynamics 365 CRM"]},
    ],
    "projects": [
      ("Tractchun · Power BI", "Interactive report on 97,948 IT support tickets: star schema, DAX KPIs (satisfaction, days open, tickets per agent)."),
      ("Sleep Hygiene · Qlik Sense, SQL, Snowflake", "Analysis of 374 people: data cleaning and modelling; 41.6% have a sleep disorder, with stress as the main driver."),
      ("Pipeline CRM · React", "Custom CRM to manage the B2B pipeline: logging, segmentation and follow-up of accounts and opportunities."),
      ("Pricing & Quoting Tool – Individuals & Companies", "Web quoting tool that compares plans by employment status or headcount and generates a client PDF. 1–2 minutes per quote."),
      ("Landing Page & Lead Generation", "Lead-capture landing page with quote form, plan comparison and enquiries routed to WhatsApp and email."),
    ],
    "skills": [
      ("Business Analysis", "KPI & performance tracking · Dashboards & reporting · ETL & data modelling · Data storytelling"),
      ("Data & BI", "SQL · MySQL · Snowflake · Power BI · Qlik Sense · Oracle BI · Advanced Excel · Google Workspace"),
      ("Account Management", "Portfolio & key accounts · Retention · Upselling & cross-selling · Debt recovery · Negotiation"),
      ("CRM", "Microsoft Dynamics 365 · Custom React CRM · Salesforce (learning)"),
      ("Leadership", "Team leadership · Broker & channel management · Cross-team coordination"),
    ],
    "edu": [("Google Project Management Certificate", "Coursera", "In progress"),
            ("Data Analyst", "Jupi Digital", "2024 – 2025"),
            ("Associate Degree in Marketing & Sales", "Universidad Siglo 21", "2016 – 2020")],
    "langs": "Spanish (native) · English (B2, upper-intermediate)",
  },
}

CSS = """
@page { size: A4; margin: 14mm 15mm 14mm; }
* { box-sizing: border-box; }
body { margin: 0; font: 9.6pt/1.45 "Inter", Arial, sans-serif; color: #2B2E30; }
a { color: inherit; text-decoration: none; }
header { border-bottom: 2px solid #0C0C0E; padding-bottom: 9px; margin-bottom: 10px; }
h1 { font: 700 22pt/1.05 "Inter", Arial, sans-serif; letter-spacing: -.01em; color: #0C0C0E; margin: 0; }
.role { font-weight: 600; font-size: 11pt; color: #C8102E; margin-top: 3px; }
.contact { margin-top: 6px; font-size: 8.8pt; color: #3F4648; display: flex; flex-wrap: wrap; gap: 2px 14px; }
.web { margin-top: 5px; font-size: 9pt; }
.web b { color: #0C0C0E; }
.web .ph { color: #C8102E; border-bottom: 1px dashed #C8102E; }
h2 { font: 700 9pt/1 "Inter", Arial, sans-serif; letter-spacing: .14em; text-transform: uppercase; color: #0C0C0E;
     margin: 12px 0 6px; padding-bottom: 4px; border-bottom: 1px solid #D3D2CB; }
p { margin: 0; }
.job { margin-bottom: 8px; break-inside: avoid; }
.jh { display: flex; justify-content: space-between; gap: 12px; align-items: baseline; }
.jh b { font-size: 10.2pt; color: #0C0C0E; }
.jh span { font-size: 8.6pt; color: #3F4648; white-space: nowrap; }
.org { font-size: 9pt; color: #C8102E; font-weight: 600; }
.org i { font-style: normal; color: #3F4648; font-weight: 400; }
.note { font-size: 8.4pt; color: #3F4648; font-style: italic; margin-top: 1px; }
ul { margin: 3px 0 3px; padding-left: 14px; }
li { margin: 1px 0; }
.kv { font-size: 8.6pt; color: #3F4648; }
.kv b { color: #0C0C0E; font-weight: 600; }
.proj { margin-bottom: 4px; break-inside: avoid; }
.proj b { color: #0C0C0E; }
.grid { display: grid; grid-template-columns: 128px 1fr; gap: 3px 10px; }
.grid b { color: #0C0C0E; }
.edu { display: flex; justify-content: space-between; gap: 10px; }
.edu span { color: #3F4648; white-space: nowrap; }
"""

def e(s): return html.escape(s)

def render(d):
    web = (f'<a href="https://{e(WEB_URL)}">{e(WEB_URL)}</a>' if WEB_URL else f'<span class="ph">{e(d["web_ph"])}</span>')
    jobs = ""
    for j in d["jobs"]:
        org = e(j["org"]) + (f' <i>· {e(j["ind"])}</i>' if j["ind"] else "")
        note = f'<p class="note">{e(j["note"])}</p>' if j.get("note") else ""
        jobs += f'''<div class="job"><div class="jh"><b>{e(j["t"])}</b><span>{e(j["d"])}</span></div>
<div class="org">{org}</div>{note}<ul>{"".join(f"<li>{e(x)}</li>" for x in j["b"])}</ul>
<p class="kv"><b>{e(d["soft"])}:</b> {e(" · ".join(j["s"]))} &nbsp;|&nbsp; <b>{e(d["tools"])}:</b> {e(" · ".join(j["tl"]))}</p></div>'''
    projects = "".join(f'<p class="proj"><b>{e(t)}</b> — {e(x)}</p>' for t, x in d["projects"])
    skills = "".join(f"<b>{e(k)}</b><span>{e(v)}</span>" for k, v in d["skills"])
    edu = "".join(f'<div class="edu"><p><b>{e(t)}</b> · {e(o)}</p><span>{e(y)}</span></div>' for t, o, y in d["edu"])
    return f'''<!doctype html><html lang="{d["lang"]}"><head><meta charset="utf-8"><title>Pablo Hidalgo — CV</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap"><style>{CSS}</style></head><body>
<header><h1>Pablo Hidalgo</h1><div class="role">{e(d["title"])}</div>
<div class="contact"><span>{e(d["loc"])}</span><span>+54 261 510 2207</span><a href="mailto:pablohidalgo1188@gmail.com">pablohidalgo1188@gmail.com</a><a href="https://linkedin.com/in/pabloehidalgo">linkedin.com/in/pabloehidalgo</a></div>
<div class="web"><b>{e(d["web_label"])}:</b> {web}</div></header>
<h2>{e(d["h_profile"])}</h2><p>{e(d["profile"])}</p>
<h2>{e(d["h_exp"])}</h2>{jobs}
<h2>{e(d["h_projects"])}</h2>{projects}
<h2>{e(d["h_skills"])}</h2><div class="grid">{skills}</div>
<h2>{e(d["h_edu"])}</h2>{edu}
<h2>{e(d["h_lang"])}</h2><p>{e(d["langs"])}</p>
</body></html>'''

for code, d in CV.items():
    (HERE / f"cv-{code}.html").write_text(render(d), encoding="utf-8")
print("ok")
