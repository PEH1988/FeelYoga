#!/usr/bin/env python3
"""Build Pablo Hidalgo's CV (ES + EN) as HTML; build_cv.js prints them to PDF.

Edit the content below, then run:
    python3 cv-src/build_cv.py && node cv-src/build_cv.js
Set WEB_URL once the site has its own domain (e.g. "pablohidalgo.com").
"""
import html, pathlib

WEB_URL = "pablohidalgo.site"

HERE = pathlib.Path(__file__).parent

JUPI_URL = "https://www.jupidigital.com/pablo-hidalgo-certificado-bootcamp-analisis-de-datos"
GOOGLE_PM_URL = "https://www.credly.com/badges/cb4eed89-b2f5-4929-a1ce-de794096b387"
HUBSPOT_URL = "https://app.hubspot.com/academy/achievements/zlnygxxg/es/1/pablo-hidalgo/certificacion-del-software-de-ventas-de-hubspot"

# Content follows Pablo's CV (Oct 2026). Competencies are (label, text) pairs.
CV = {
  "es": {
    "lang": "es",
    "title": "Project Coordinator | BI Analyst | Account Manager",
    "loc": "Mendoza, Argentina",
    "web_label": "Web / Portfolio", "web_ph": "[agregar link de la web]",
    "h_profile": "Perfil profesional", "h_comp": "Competencias clave", "h_exp": "Experiencia laboral",
    "h_projects": "Proyectos", "h_edu": "Formación y certificaciones", "h_tools": "Herramientas", "h_lang": "Idiomas",
    "profile": "",
    "comp": [
      ("Coordinación de proyectos", "Agile, Scrum, Kanban y Waterfall; planificación, seguimiento, cierre y gestión de stakeholders."),
      ("Business Intelligence", "dashboards de KPIs en Power BI, Qlik Sense y Oracle BI; SQL y modelado de datos."),
      ("Gestión de cuentas", "grandes cuentas corporativas, retención, upselling y cross-selling."),
      ("Liderazgo", "equipo comercial regional y coordinación entre áreas."),
    ],
    "jobs": [
      {"t": "Ejecutivo Comercial B2B PyME", "org": "Grupo Omint", "ind": "Medicina prepaga", "d": "Junio 2026 – Actualidad",
       "b": ["Coordiné de punta a punta un CRM propio y un cotizador web, desde los requerimientos hasta la puesta en marcha.",
             "Gestión del pipeline B2B: propuestas, negociación y renovaciones."]},
      {"t": "Account Manager", "org": "Grupo América", "ind": "Medios", "d": "Mayo 2025 – Junio 2026",
       "b": ["Cartera de cuentas corporativas y seguimiento de KPIs comerciales."]},
      {"t": "Analista de Datos / IA Trainer", "org": "Outlier", "ind": "Tecnología – IA", "d": "Julio 2024 – Abril 2025",
       "b": ["Control de calidad de datos de modelos de IA con rúbricas de evaluación."]},
      {"t": "Jefe de ART", "org": "Federación Patronal Seguros", "ind": "Sector seguros", "d": "Abril 2016 – Enero 2023",
       "b": ["Lideré la unidad ART regional, coordinando Cobranzas, Siniestros y Prevención para retener cartera.",
             "Reportes y dashboards de KPIs de cartera, retención y cobranzas en Oracle BI."]},
      {"t": "Analista Comercial", "org": "Federación Patronal Seguros", "ind": "", "d": "Noviembre 2015 – Abril 2016",
       "b": ["Análisis de clientes para evaluación de riesgos y reporting de KPIs."]},
    ],
    "projects": [
      ("CRM propio de gestión de pipeline B2B", "proyecto propio de punta a punta: requerimientos, diseño y desarrollo de una herramienta para registrar, segmentar y seguir cuentas y oportunidades PyME."),
      ("Cotizador web de planes", "compara planes para individuos y empresas y genera un PDF para el cliente en 1 a 2 minutos por cotización."),
    ],
    "edu": [("Certificado de Project Management de Google", "Coursera", "2026", GOOGLE_PM_URL),
            ("Certificación del software de Ventas de HubSpot", "HubSpot Academy", "2026", HUBSPOT_URL),
            ("Analista de Datos", "Jupi Digital", "2024 – 2025", JUPI_URL),
            ("Tecnicatura en Comercialización", "Universidad Siglo 21", "2016 – 2020", "")],
    "tools": "Power BI, Qlik Sense, Oracle BI, SQL, Snowflake, Excel avanzado, Dynamics 365, HubSpot, Salesforce, Asana, Google Workspace",
    "langs": "Español (nativo) · Inglés (intermedio avanzado, B2)",
  },
  "en": {
    "lang": "en",
    "title": "Project Coordinator | BI Analyst | Account Manager",
    "loc": "Mendoza, Argentina",
    "web_label": "Website / Portfolio", "web_ph": "[add website link]",
    "h_profile": "Professional summary", "h_comp": "Core competencies", "h_exp": "Work experience",
    "h_projects": "Projects", "h_edu": "Education & certifications", "h_tools": "Tools", "h_lang": "Languages",
    "profile": "",
    "comp": [
      ("Project coordination", "Agile, Scrum, Kanban and Waterfall; planning, tracking, closure and stakeholder management."),
      ("Business Intelligence", "KPI dashboards in Power BI, Qlik Sense and Oracle BI; SQL and data modelling."),
      ("Account management", "key corporate accounts, client retention, upselling and cross-selling."),
      ("Leadership", "regional sales team and cross-functional coordination."),
    ],
    "jobs": [
      {"t": "SMB B2B Account Executive", "org": "Grupo Omint", "ind": "Private health insurance", "d": "June 2026 – Present",
       "b": ["Coordinated a custom CRM and a web quoting tool end to end, from requirements to rollout.",
             "Manage the B2B pipeline: proposals, negotiation and renewals."]},
      {"t": "Account Manager", "org": "Grupo América", "ind": "Media", "d": "May 2025 – June 2026",
       "b": ["Corporate account portfolio and commercial KPI tracking."]},
      {"t": "Data Analyst / AI Trainer", "org": "Outlier", "ind": "Technology – AI", "d": "July 2024 – April 2025",
       "b": ["Quality assurance of AI model data using evaluation rubrics."]},
      {"t": "Workers' Compensation (ART) Manager", "org": "Federación Patronal Seguros", "ind": "Insurance", "d": "April 2016 – January 2023",
       "b": ["Led the regional ART unit, coordinating Collections, Claims and Prevention to retain the portfolio.",
             "Built KPI reports and dashboards on portfolio, retention and collections in Oracle BI."]},
      {"t": "Commercial Analyst", "org": "Federación Patronal Seguros", "ind": "", "d": "November 2015 – April 2016",
       "b": ["Client analysis for risk assessment and KPI reporting."]},
    ],
    "projects": [
      ("Custom B2B pipeline CRM", "end-to-end own project: requirements, design and build of a tool to log, segment and follow up SMB accounts and opportunities."),
      ("Web plan quoting tool", "compares plans for individuals and companies and generates a client PDF in 1 to 2 minutes per quote."),
    ],
    "edu": [("Google Project Management Certificate", "Coursera", "2026", GOOGLE_PM_URL),
            ("HubSpot Sales Software Certification", "HubSpot Academy", "2026", HUBSPOT_URL),
            ("Data Analyst", "Jupi Digital", "2024 – 2025", JUPI_URL),
            ("Associate Degree in Marketing & Sales", "Universidad Siglo 21", "2016 – 2020", "")],
    "tools": "Power BI, Qlik Sense, Oracle BI, SQL, Snowflake, advanced Excel, Dynamics 365, HubSpot, Salesforce, Asana, Google Workspace",
    "langs": "Spanish (native) · English (upper-intermediate, B2)",
  },
}

CSS = """
@page { size: A4; margin: 11mm 14mm 10mm; }
* { box-sizing: border-box; }
body { margin: 0; font: 9.6pt/1.45 "Inter", Arial, sans-serif; color: #3C3F42; }
a { color: inherit; text-decoration: none; }
header { border-bottom: 2px solid #111111; padding-bottom: 10px; margin-bottom: calc(var(--s, 8px) * .5); }
h1 { font: 700 22pt/1.05 "Inter", Arial, sans-serif; letter-spacing: -.01em; color: #111111; margin: 0; }
.role { font-weight: 600; font-size: 11pt; color: #3C3F42; margin-top: 3px; }
.contact { margin-top: 6px; font-size: 8.8pt; color: #7D8185; display: flex; flex-wrap: wrap; gap: 2px 14px; }
.web { margin-top: 5px; font-size: 9pt; }
.web b { color: #111111; }
.web .ph { color: #7D8185; border-bottom: 1px dashed #7D8185; }
h2 { font: 700 9pt/1 "Inter", Arial, sans-serif; letter-spacing: .14em; text-transform: uppercase; color: #111111;
     margin: var(--s, 8px) 0 calc(var(--s, 8px) * .45); padding-bottom: 4px; border-bottom: 1px solid #D4D6D8; }
p { margin: 0; }
.job { margin-bottom: calc(var(--s, 8px) * .5); break-inside: avoid; }
.jh { display: flex; justify-content: space-between; gap: 12px; align-items: baseline; }
.jh b { font-size: 10.2pt; color: #111111; }
.jh span { font-size: 8.6pt; color: #7D8185; white-space: nowrap; }
.org { font-size: 9pt; color: #3C3F42; font-weight: 600; }
.org i { font-style: normal; color: #7D8185; font-weight: 400; }
.note { font-size: 8.4pt; color: #7D8185; font-style: italic; margin-top: 1px; }
ul { margin: 2px 0 2px; padding-left: 14px; }
li { margin: 0; }
.kv { font-size: 8.6pt; color: #7D8185; }
.kv b { color: #111111; font-weight: 600; }
.proj { margin-bottom: calc(var(--s, 8px) * .3); break-inside: avoid; }
.proj b { color: #111111; }
.grid { display: grid; grid-template-columns: 128px 1fr; gap: 3px 10px; }
.grid b { color: #111111; }
.edu { display: flex; justify-content: space-between; gap: 10px; }
.edu span { color: #7D8185; white-space: nowrap; }
.comp li b { color: #111111; }
a.cert { border-bottom: 1px solid #7D8185; }
"""

# Tailored version for a specific application (Analista de Contratos, Venoil Energía).
# Only tasks Pablo confirmed for his ART role: tenders, renewals, claims, internal
# controls and negotiation of terms. Not published on the site.
import copy
_c = copy.deepcopy(CV["es"])
_c["title"] = "Seguros Corporativos | Licitaciones y Renovaciones | Negociación y Control"
_c["comp"] = [
  ("Seguros corporativos y riesgos", "coberturas de ART para empresas, evaluación de riesgos y suscripción, análisis de siniestralidad."),
  ("Licitaciones, renovaciones y reclamos", "coordinación de licitaciones y renovaciones de contratos de cobertura; gestión de reclamos y siniestros."),
  ("Negociación y análisis de costos", "negociación de tarifas y condiciones comerciales con clientes, brokers y PAS a partir de datos de costos y siniestralidad."),
  ("Controles internos", "aplicación de controles internos y procedimientos en la operación de la cartera, cobranzas y planes de pago."),
  ("Planificación y liderazgo", "conducción de equipo regional y coordinación con Cobranzas, Siniestros y Prevención; trabajo bajo presión y orientación a resultados."),
  ("Análisis y reporting", "KPIs y reportes de gestión en Oracle BI, Power BI y Excel avanzado; CRM Microsoft Dynamics 365."),
]
_c["jobs"] = [
  {"t": "Ejecutivo Comercial B2B PyME", "org": "Grupo Omint", "ind": "Medicina prepaga", "d": "Junio 2026 – Actualidad",
   "b": ["Elaboración de propuestas comerciales, negociación y renovaciones con clientes corporativos PyME.",
         "Diseño de un cotizador web que compara planes y genera la propuesta en PDF en 1 a 2 minutos."]},
  {"t": "Account Manager", "org": "Grupo América", "ind": "Medios", "d": "Mayo 2025 – Junio 2026",
   "b": ["Gestión de una cartera de cuentas corporativas como punto de contacto principal; seguimiento de KPIs comerciales."]},
  {"t": "Analista de Datos / IA Trainer", "org": "Outlier", "ind": "Tecnología – IA", "d": "Julio 2024 – Abril 2025",
   "b": ["Control de calidad de datos con rúbricas y criterios de evaluación estrictos."]},
  {"t": "Jefe de ART", "org": "Federación Patronal Seguros", "ind": "Sector seguros", "d": "Abril 2016 – Enero 2023",
   "b": ["Jefatura de la unidad ART regional durante casi 7 años, con equipo a cargo y coordinación de las áreas de Cobranzas, Siniestros y Prevención.",
         "Coordinación de licitaciones y renovaciones de contratos de cobertura de ART con clientes corporativos, brokers y PAS.",
         "Negociación de tarifas y condiciones comerciales a partir del análisis de costos y siniestralidad en Oracle BI.",
         "Gestión de reclamos y siniestros junto al área de Siniestros; recupero de cobranzas y armado de planes de pago.",
         "Aplicación de controles internos en la operación de la cartera y reportes de gestión sobre retención y cobranzas."]},
  {"t": "Analista Comercial", "org": "Federación Patronal Seguros", "ind": "", "d": "Noviembre 2015 – Abril 2016",
   "b": ["Análisis técnico-comercial de clientes para evaluación de riesgos y reporting de indicadores clave."]},
]
_c["tools"] = "Excel avanzado, Oracle BI, Microsoft Dynamics 365 CRM, Power BI, SQL, HubSpot, Google Workspace"
CV["es-contratos"] = _c

# Tailored version for EY GDS — ET Risk & Compliance, Operations & Reporting Analyst.
# Uses only confirmed experience; Pablo confirmed SharePoint, Teams/Planner and
# budget/expense tracking. No audit experience is claimed. Not published on the site.
_y = copy.deepcopy(CV["en"])
_y["title"] = "Reporting & Data Analyst | KPI Dashboards & Internal Controls | Project Coordination"
_y["comp"] = [
  ("Management reporting & dashboards", "KPI and risk-indicator dashboards (loss ratio, retention, collections) in Power BI (DAX, Power Query), Oracle BI and Qlik Sense; recurring management reports, ad hoc and trend analysis for decision-making."),
  ("Internal controls & records", "applied internal controls and procedures to portfolio operations; maintained account records in Microsoft Dynamics 365 CRM; data quality reviews and record validation."),
  ("Project coordination & stakeholders", "requirements gathering, scoping, planning, progress tracking and rollout; cross-functional coordination and stakeholder communication."),
  ("Project methodologies", "Agile, Scrum, Kanban and Waterfall; planning, execution and closure; WBS, project charter and OKRs; risk, budget, change and quality management."),
  ("Microsoft 365 & collaboration", "SharePoint document libraries, Microsoft Teams, Planner and advanced Excel for team coordination and reporting."),
  ("Vendor & financial administration", "contract renewals and tenders with corporate clients, brokers and agents; budget and expense tracking."),
]
_y["jobs"] = [
  {"t": "SMB B2B Account Executive", "org": "Grupo Omint", "ind": "Private health insurance", "d": "June 2026 – Present",
   "b": ["Coordinated a custom CRM and a web quoting tool end to end: requirements gathering, scoping, testing and rollout.",
         "Manage the SMB pipeline: commercial proposals, negotiation and renewals."]},
  {"t": "Account Manager", "org": "Grupo América", "ind": "Media", "d": "May 2025 – June 2026",
   "b": ["Tracked and reported commercial KPIs to spot opportunities and risks across a corporate account portfolio."]},
  {"t": "Data Analyst / AI Trainer", "org": "Outlier", "ind": "Technology – AI", "d": "July 2024 – April 2025",
   "b": ["Data quality reviews of AI model outputs against evaluation rubrics and guidelines; flagged errors and inconsistencies."]},
  {"t": "Workers' Compensation (ART) Manager", "org": "Federación Patronal Seguros", "ind": "Insurance", "d": "April 2016 – January 2023",
   "b": ["Led the regional ART unit for nearly 7 years with a team, coordinating Collections, Claims and Prevention.",
         "Built management reports and dashboards on portfolio, retention, collections and loss-ratio indicators in Oracle BI to support leadership decisions.",
         "Applied internal controls to portfolio operations, collections and payment plans; maintained account records in Microsoft Dynamics 365 CRM.",
         "Coordinated tenders, contract renewals and claims with corporate clients, brokers and agents."]},
  {"t": "Commercial Analyst", "org": "Federación Patronal Seguros", "ind": "", "d": "November 2015 – April 2016",
   "b": ["Client data analysis for risk assessment and KPI reporting."]},
]
_y["tools"] = "Power BI (DAX, Power Query), advanced Excel, SharePoint, Microsoft Teams, Planner, Oracle BI, Qlik Sense, SQL, Snowflake, Microsoft Dynamics 365 CRM, HubSpot, Asana, Gantt charts, Google Workspace"
CV["en-ey"] = _y

def e(s): return html.escape(s)

def render(d):
    web = (f'<a href="https://{e(WEB_URL)}">{e(WEB_URL)}</a>' if WEB_URL else f'<span class="ph">{e(d["web_ph"])}</span>')
    comp = "".join(f"<li><b>{e(k)}:</b> {e(v)}</li>" for k, v in d["comp"])
    jobs = ""
    for j in d["jobs"]:
        org = e(j["org"]) + (f' <i>· {e(j["ind"])}</i>' if j["ind"] else "")
        jobs += f'''<div class="job"><div class="jh"><b>{e(j["t"])}</b><span>{e(j["d"])}</span></div>
<div class="org">{org}</div><ul>{"".join(f"<li>{e(x)}</li>" for x in j["b"])}</ul></div>'''
    projects = "".join(f"<li><b>{e(t)}:</b> {e(x)}</li>" for t, x in d["projects"])
    def edu_item(t, o, y, url):
        title = f'<a class="cert" href="{e(url)}">{e(t)}</a>' if url else e(t)
        return f'<div class="edu"><p><b>{title}</b> · {e(o)}</p><span>{e(y)}</span></div>'
    edu = "".join(edu_item(*x) for x in d["edu"])
    return f'''<!doctype html><html lang="{d["lang"]}"><head><meta charset="utf-8"><title>Pablo Hidalgo — CV</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap"><style>{CSS}</style></head><body>
<header><h1>Pablo Hidalgo</h1><div class="role">{e(d["title"])}</div>
<div class="contact"><span>{e(d["loc"])}</span><span>+54 261 510 2207</span><a href="mailto:pablohidalgo1188@gmail.com">pablohidalgo1188@gmail.com</a><a href="https://linkedin.com/in/pabloehidalgo">linkedin.com/in/pabloehidalgo</a></div>
<div class="web"><b>{e(d["web_label"])}:</b> {web}</div></header>

<h2>{e(d["h_exp"])}</h2>{jobs}
<h2>{e(d["h_edu"])}</h2>{edu}
<h2>{e(d["h_comp"])}</h2><ul class="comp">{comp}</ul>
<h2>{e(d["h_tools"])}</h2><p>{e(d["tools"])}</p>
<h2>{e(d["h_lang"])}</h2><p>{e(d["langs"])}</p>
</body></html>'''

for code, d in CV.items():
    (HERE / f"cv-{code}.html").write_text(render(d), encoding="utf-8")
print("ok")
