#!/usr/bin/env python3
"""Build Pablo Hidalgo's CV (ES + EN) as HTML; build_cv.js prints them to PDF.

Edit the content below, then run:
    python3 cv-src/build_cv.py && node cv-src/build_cv.js
Set WEB_URL once the site has its own domain (e.g. "pablohidalgo.com").
"""
import html, pathlib

WEB_URL = "pablohidalgo.site"

HERE = pathlib.Path(__file__).parent

HUBSPOT_URL = "https://app.hubspot.com/academy/achievements/zlnygxxg/es/1/pablo-hidalgo/certificacion-del-software-de-ventas-de-hubspot"

# Content follows Pablo's CV (Oct 2026). Competencies are (label, text) pairs.
CV = {
  "es": {
    "lang": "es",
    "title": "Senior Account Manager | Sector Financiero y Seguros | Cuentas Enterprise",
    "loc": "Mendoza, Argentina",
    "web_label": "Web / Portfolio", "web_ph": "[agregar link de la web]",
    "h_profile": "Perfil profesional", "h_comp": "Competencias clave", "h_exp": "Experiencia laboral",
    "h_projects": "Proyectos", "h_edu": "Formación y certificaciones", "h_tools": "Herramientas", "h_lang": "Idiomas",
    "profile": "Account Manager senior con más de 8 años de experiencia en el sector financiero y de seguros: más de 7 años en "
               "Federación Patronal Seguros gestionando grandes cuentas corporativas, brokers y productores, y actualmente en "
               "Grupo Omint (medicina prepaga) con clientes corporativos. Experiencia en estrategia de retención de cartera, "
               "identificación de oportunidades de crecimiento (upsell y cross-sell) y liderazgo de un equipo comercial regional. "
               "Perfil híbrido: formación como Analista de Datos (SQL, Power BI, Excel avanzado), experiencia como entrenador de "
               "modelos de IA y desarrollo propio de un CRM para gestionar el pipeline. Acostumbrado a interactuar con niveles "
               "gerenciales y a traducir necesidades de negocio en soluciones concretas.",
    "comp": [
      ("Gestión de cuentas enterprise", "retención de cartera y prevención de bajas, relaciones de largo plazo, upsell y cross-sell, negociación con niveles gerenciales."),
      ("Industria", "seguros (ART y salud corporativa), gestión de brokers, PAS y canales."),
      ("Tecnología e IA", "ecosistemas CRM (HubSpot, Salesforce fundamentos, CRM propio), inteligencia artificial conversacional (IA Trainer), uso de IA aplicada a procesos comerciales."),
      ("Datos y resultados", "KPIs de cartera y retención, análisis de performance, dashboards, SQL, Power BI, Qlik Sense."),
      ("Liderazgo", "conducción de equipo comercial regional, coordinación con áreas técnicas y comerciales."),
    ],
    "jobs": [
      {"t": "Ejecutivo Comercial B2B PyME", "org": "Grupo Omint", "ind": "Medicina prepaga", "d": "Junio 2026 – Actualidad",
       "b": ["Prospección y desarrollo de negocios B2B, gestión de pipeline comercial de clientes corporativos PyME.",
             "Elaboración de propuestas comerciales y negociación con clientes corporativos."]},
      {"t": "Account Manager", "org": "Grupo América", "ind": "Medios", "d": "Mayo 2025 – Junio 2026",
       "b": ["Gestión de cuentas y atención directa a clientes corporativos.",
             "Análisis de resultados y seguimiento de KPIs comerciales."]},
      {"t": "Analista de Datos / IA Trainer", "org": "Outlier", "ind": "Tecnología – IA", "d": "Julio 2024 – Abril 2025",
       "b": ["Análisis y validación de datos e interacciones de modelos de IA conversacional, con foco en calidad y métricas de desempeño."]},
      {"t": "Jefe de ART", "org": "Federación Patronal Seguros", "ind": "Sector seguros", "d": "Abril 2016 – Enero 2023",
       "b": ["Gestión y desarrollo de grandes cuentas corporativas, PAS y brokers; liderazgo de equipo comercial regional.",
             "Análisis de KPIs de cartera y performance comercial; mejora de la retención de clientes."]},
      {"t": "Analista Comercial", "org": "Federación Patronal Seguros", "ind": "", "d": "Noviembre 2015 – Abril 2016",
       "b": ["Análisis técnico-comercial de clientes para evaluación de riesgos y reporting de indicadores clave."]},
    ],
    "projects": [
      ("CRM propio de gestión de pipeline B2B", "diseño y desarrollo de una herramienta para registrar, segmentar y dar seguimiento a cuentas y oportunidades comerciales PyME."),
      ("Cotizador comercial en Excel", "modelo para armar cotizaciones y propuestas comerciales."),
    ],
    "edu": [("Certificación del software de Ventas de HubSpot", "HubSpot Academy", "2026", HUBSPOT_URL),
            ("Certificado de Project Management de Google", "Coursera", "En curso", ""),
            ("Analista de Datos", "Jupi Digital", "2024 – 2025", ""),
            ("Tecnicatura en Comercialización", "Universidad Siglo 21", "2016 – 2020", "")],
    "tools": "CRM, HubSpot Sales, Salesforce (fundamentos, en estudio), Power BI, Qlik Sense, SQL, Excel avanzado, Google Workspace",
    "langs": "Español (nativo) · Inglés (intermedio avanzado, B2)",
  },
  "en": {
    "lang": "en",
    "title": "Senior Account Manager | Financial Services & Insurance | Enterprise Accounts",
    "loc": "Mendoza, Argentina",
    "web_label": "Website / Portfolio", "web_ph": "[add website link]",
    "h_profile": "Professional summary", "h_comp": "Core competencies", "h_exp": "Work experience",
    "h_projects": "Projects", "h_edu": "Education & certifications", "h_tools": "Tools", "h_lang": "Languages",
    "profile": "Senior Account Manager with 8+ years of experience in financial services and insurance: 7+ years at "
               "Federación Patronal Seguros managing key corporate accounts, brokers and agents, and currently at Grupo Omint "
               "(private health insurance) serving corporate clients. Experienced in portfolio retention strategy, identifying "
               "growth opportunities (upsell and cross-sell) and leading a regional sales team. Hybrid profile: trained as a "
               "Data Analyst (SQL, Power BI, advanced Excel), experience as an AI model trainer, and built my own CRM to manage "
               "the pipeline. Comfortable working with senior management and turning business needs into concrete solutions.",
    "comp": [
      ("Enterprise account management", "portfolio retention and churn prevention, long-term relationships, upsell and cross-sell, negotiation with senior management."),
      ("Industry", "insurance (workers' compensation and corporate health), broker, agent and channel management."),
      ("Technology & AI", "CRM ecosystems (HubSpot, Salesforce fundamentals, custom CRM), conversational AI (AI Trainer), AI applied to sales processes."),
      ("Data & results", "portfolio and retention KPIs, performance analysis, dashboards, SQL, Power BI, Qlik Sense."),
      ("Leadership", "leading a regional sales team, coordinating with technical and commercial teams."),
    ],
    "jobs": [
      {"t": "SMB B2B Account Executive", "org": "Grupo Omint", "ind": "Private health insurance", "d": "June 2026 – Present",
       "b": ["B2B prospecting and business development; managing the sales pipeline of SMB corporate clients.",
             "Preparing commercial proposals and negotiating with corporate clients."]},
      {"t": "Account Manager", "org": "Grupo América", "ind": "Media", "d": "May 2025 – June 2026",
       "b": ["Account management and direct support to corporate clients.",
             "Results analysis and tracking of commercial KPIs."]},
      {"t": "Data Analyst / AI Trainer", "org": "Outlier", "ind": "Technology – AI", "d": "July 2024 – April 2025",
       "b": ["Analysis and validation of conversational AI model data and interactions, focused on quality and performance metrics."]},
      {"t": "Workers' Compensation (ART) Manager", "org": "Federación Patronal Seguros", "ind": "Insurance", "d": "April 2016 – January 2023",
       "b": ["Managed and grew key corporate accounts, agents (PAS) and brokers; led a regional sales team.",
             "Portfolio KPI and sales performance analysis; improved client retention."]},
      {"t": "Commercial Analyst", "org": "Federación Patronal Seguros", "ind": "", "d": "November 2015 – April 2016",
       "b": ["Technical-commercial client analysis for risk assessment and key-indicator reporting."]},
    ],
    "projects": [
      ("Custom B2B pipeline CRM", "designed and built a tool to log, segment and follow up SMB accounts and sales opportunities."),
      ("Excel sales quoting tool", "model for building quotes and commercial proposals."),
    ],
    "edu": [("HubSpot Sales Software Certification", "HubSpot Academy", "2026", HUBSPOT_URL),
            ("Google Project Management Certificate", "Coursera", "In progress", ""),
            ("Data Analyst", "Jupi Digital", "2024 – 2025", ""),
            ("Associate Degree in Marketing & Sales", "Universidad Siglo 21", "2016 – 2020", "")],
    "tools": "CRM, HubSpot Sales, Salesforce (fundamentals, learning), Power BI, Qlik Sense, SQL, advanced Excel, Google Workspace",
    "langs": "Spanish (native) · English (upper-intermediate, B2)",
  },
}

CSS = """
@page { size: A4; margin: 11mm 14mm 10mm; }
* { box-sizing: border-box; }
body { margin: 0; font: 9pt/1.36 "Inter", Arial, sans-serif; color: #2B2E30; }
a { color: inherit; text-decoration: none; }
header { border-bottom: 2px solid #0C0C0E; padding-bottom: 8px; margin-bottom: 6px; }
h1 { font: 700 22pt/1.05 "Inter", Arial, sans-serif; letter-spacing: -.01em; color: #0C0C0E; margin: 0; }
.role { font-weight: 600; font-size: 11pt; color: #C8102E; margin-top: 3px; }
.contact { margin-top: 6px; font-size: 8.8pt; color: #3F4648; display: flex; flex-wrap: wrap; gap: 2px 14px; }
.web { margin-top: 5px; font-size: 9pt; }
.web b { color: #0C0C0E; }
.web .ph { color: #C8102E; border-bottom: 1px dashed #C8102E; }
h2 { font: 700 9pt/1 "Inter", Arial, sans-serif; letter-spacing: .14em; text-transform: uppercase; color: #0C0C0E;
     margin: 8px 0 4px; padding-bottom: 3px; border-bottom: 1px solid #D3D2CB; }
p { margin: 0; }
.job { margin-bottom: 4px; break-inside: avoid; }
.jh { display: flex; justify-content: space-between; gap: 12px; align-items: baseline; }
.jh b { font-size: 10.2pt; color: #0C0C0E; }
.jh span { font-size: 8.6pt; color: #3F4648; white-space: nowrap; }
.org { font-size: 9pt; color: #C8102E; font-weight: 600; }
.org i { font-style: normal; color: #3F4648; font-weight: 400; }
.note { font-size: 8.4pt; color: #3F4648; font-style: italic; margin-top: 1px; }
ul { margin: 2px 0 2px; padding-left: 14px; }
li { margin: 0; }
.kv { font-size: 8.6pt; color: #3F4648; }
.kv b { color: #0C0C0E; font-weight: 600; }
.proj { margin-bottom: 4px; break-inside: avoid; }
.proj b { color: #0C0C0E; }
.grid { display: grid; grid-template-columns: 128px 1fr; gap: 3px 10px; }
.grid b { color: #0C0C0E; }
.edu { display: flex; justify-content: space-between; gap: 10px; }
.edu span { color: #3F4648; white-space: nowrap; }
.comp li b { color: #0C0C0E; }
a.cert { border-bottom: 1px solid #C8102E; }
"""

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
<h2>{e(d["h_profile"])}</h2><p>{e(d["profile"])}</p>
<h2>{e(d["h_comp"])}</h2><ul class="comp">{comp}</ul>
<h2>{e(d["h_exp"])}</h2>{jobs}
<h2>{e(d["h_projects"])}</h2><ul class="comp">{projects}</ul>
<h2>{e(d["h_edu"])}</h2>{edu}
<h2>{e(d["h_tools"])}</h2><p>{e(d["tools"])}</p>
<h2>{e(d["h_lang"])}</h2><p>{e(d["langs"])}</p>
</body></html>'''

for code, d in CV.items():
    (HERE / f"cv-{code}.html").write_text(render(d), encoding="utf-8")
print("ok")
