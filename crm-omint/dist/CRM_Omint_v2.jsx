import React, { useState, useEffect, useMemo, useCallback, useRef, createContext, useContext } from "react";
import * as XLSX from "xlsx";
import {
  Building2, Search, Plus, Phone, Mail, Calendar as CalIcon, X,
  TrendingUp, Users, Target, ClipboardList, Flame, Snowflake,
  ChevronRight, Trash2, Clock, CheckCircle2, XCircle, Save,
  RefreshCw, Link2, MessageCircle, SkipForward, PencilLine,
  Download, Upload, Instagram, Heart, LayoutDashboard, Megaphone,
  BookOpen, Activity, Zap, Sun, Moon, Calculator, Settings, AlertTriangle,
  Sunrise, FileText, Copy, ArrowRight, Trophy, Timer, Stethoscope,
  Sparkles, Command, Award, Briefcase, Check, LogOut,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Cell,
} from "recharts";

// ============================================================================
//  CRM OMINT · Herramienta comercial para Ejecutivo de Medicina Prepaga
//  v2 — rediseño completo. Usa las MISMAS claves de almacenamiento que la
//  versión anterior (companies_*, personas_*, meetings, deletedEventIds,
//  contenido, waLog), así que todos los datos cargados se conservan.
//  Claves nuevas: "settings".
// ============================================================================

const SEED = /*__SEED__*/[];

// ---------------------------------------------------------------- Pipeline ---

const STAGES = [
  { key: "prospeccion", label: "Prospección", prob: 0.05 },
  { key: "contacto", label: "Contacto Inicial", prob: 0.1 },
  { key: "reunion", label: "Reunión Agendada", prob: 0.25 },
  { key: "propuesta", label: "Propuesta Enviada", prob: 0.5 },
  { key: "negociacion", label: "Negociación", prob: 0.75 },
  { key: "ganado", label: "Ganado", prob: 1 },
  { key: "perdido", label: "Perdido", prob: 0 },
];
const STAGE_BY_KEY = Object.fromEntries(STAGES.map((s) => [s.key, s]));
const ACTIVE_STAGES = ["contacto", "reunion", "propuesta", "negociacion"];
const isOpen = (c) => !["ganado", "perdido"].includes(c.stage);

const MOTIVOS_PERDIDA = [
  "Precio",
  "Se queda con su cobertura actual",
  "Eligió otra prepaga",
  "No califica (menos de 11 cápitas)",
  "Sin respuesta / no contesta",
  "Timing: retomar más adelante",
  "Otro",
];

const TIPOS_ACT = {
  llamada: { label: "Llamada", icon: Phone },
  whatsapp: { label: "WhatsApp", icon: MessageCircle },
  mail: { label: "Mail", icon: Mail },
  reunion: { label: "Reunión", icon: Users },
  propuesta: { label: "Propuesta", icon: FileText },
  nota: { label: "Nota", icon: PencilLine },
  etapa: { label: "Cambio de etapa", icon: ArrowRight },
};
const TIPOS_LOG = ["llamada", "whatsapp", "mail", "reunion", "propuesta", "nota"];

const DEFAULT_SETTINGS = {
  asesor: "Pablo Hidalgo",
  metaMensual: 30,
  descuento: 20,
  mesesCampana: 12,
  campanaVersion: 2, // 2 = campaña 20% por 12 meses (octubre 2026)
  provincia: "Mendoza", // provincia habitual para cotizar
  cotizadorUrl: "../cotizador/", // versión web: dónde está instalado el Cotizador Omint
  objetivos: { llamada: 15, whatsapp: 12, reunion: 2, propuesta: 2 },
  theme: "light",
};

function commissionTier(capitas) {
  if (capitas > 70) return { pct: 80, label: "Más de 70 cápitas" };
  if (capitas > 50) return { pct: 75, label: "51 a 70 cápitas" };
  if (capitas > 35) return { pct: 70, label: "36 a 50 cápitas" };
  if (capitas > 20) return { pct: 65, label: "21 a 35 cápitas" };
  if (capitas >= 1) return { pct: 50, label: "1 a 20 cápitas" };
  return { pct: 0, label: "Sin cápitas cerradas" };
}
const ESCALA_COMISION = [
  { desde: 1, hasta: 20, pct: 50 },
  { desde: 21, hasta: 35, pct: 65 },
  { desde: 36, hasta: 50, pct: 70 },
  { desde: 51, hasta: 70, pct: 75 },
  { desde: 71, hasta: null, pct: 80 },
];

// Premio trimestral por cápitas netas de EE: sueldos según tramo alcanzado.
function premioCapitasNetas(capitas) {
  if (capitas > 150) return { sueldos: 3, label: "+150 cápitas" };
  if (capitas > 120) return { sueldos: 2, label: "121 a 150 cápitas" };
  if (capitas > 95) return { sueldos: 1, label: "96 a 120 cápitas" };
  return { sueldos: 0, label: "Aún no alcanza el mínimo (95 cápitas)" };
}

// Premio trimestral por cantidad de empresas con más de 20 cápitas cerradas.
function premioEmpresas20(cantidad) {
  if (cantidad > 7) return { sueldos: 3, label: "+7 empresas" };
  if (cantidad > 5) return { sueldos: 2, label: "6 a 7 empresas" };
  if (cantidad > 3) return { sueldos: 1, label: "4 a 5 empresas" };
  return { sueldos: 0, label: "Aún no alcanza el mínimo (3 empresas)" };
}

function quarterRange(date) {
  const q = Math.floor(date.getMonth() / 3);
  const start = new Date(date.getFullYear(), q * 3, 1);
  const end = new Date(date.getFullYear(), q * 3 + 3, 0);
  return { start, end, label: `Q${q + 1} ${date.getFullYear()}` };
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// ------------------------------------------------------------------ Fechas ---

const pad2 = (n) => String(n).padStart(2, "0");
// Fecha local (no UTC): después de las 21 h en Argentina, toISOString ya da "mañana".
function isoLocal(d = new Date()) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function hoyISO() {
  return isoLocal(new Date());
}
function addDaysISO(n, from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + n);
  return isoLocal(d);
}
function parseISO(s) {
  if (!s) return null;
  const [y, m, d] = s.slice(0, 10).split("-").map(Number);
  if (!y) return null;
  return new Date(y, (m || 1) - 1, d || 1);
}
function diasEntre(aISO, bISO) {
  const a = parseISO(aISO), b = parseISO(bISO);
  if (!a || !b) return null;
  return Math.round((b - a) / 86400000);
}
function fmtFecha(s, opts = { day: "2-digit", month: "2-digit" }) {
  const d = parseISO(s);
  return d ? d.toLocaleDateString("es-AR", opts) : "—";
}
function fmtRelativo(s) {
  const n = diasEntre(hoyISO(), s);
  if (n === null) return "";
  if (n === 0) return "hoy";
  if (n === 1) return "mañana";
  if (n === -1) return "ayer";
  if (n < 0) return `hace ${-n} días`;
  return `en ${n} días`;
}
const MESES_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const MESES_CORTO = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DIAS_ES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
function fechaLarga(d = new Date()) {
  return `${DIAS_ES[d.getDay()]} ${d.getDate()} de ${MESES_ES[d.getMonth()]}`;
}
function saludo() {
  const h = new Date().getHours();
  if (h < 12) return "Buen día";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
}
function diasHabilesRestantes(d = new Date()) {
  const fin = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  let n = 0;
  for (let x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x <= fin; x.setDate(x.getDate() + 1)) {
    if (x.getDay() !== 0 && x.getDay() !== 6) n++;
  }
  return n;
}

const num = (v) => parseFloat(v) || 0;
const fmtN = (n) => Math.round(n).toLocaleString("es-AR");
function money(n) {
  return "$" + Math.round(n || 0).toLocaleString("es-AR");
}
function moneyK(n) {
  if (n >= 1e6) return "$" + (n / 1e6).toLocaleString("es-AR", { maximumFractionDigits: 1 }) + " M";
  if (n >= 1e3) return "$" + Math.round(n / 1e3).toLocaleString("es-AR") + " k";
  return money(n);
}

// ------------------------------------------------------- Historial / actividad

const WA_STEP_PREFIX = "WhatsApp enviado: ";

// Tipo de una entrada de historial. Las entradas viejas no tienen "tipo":
// las de WhatsApp se reconocen por su texto, el resto cuentan como nota.
function tipoDe(h) {
  if (h.tipo) return h.tipo;
  if (h.texto && (h.texto.startsWith(WA_STEP_PREFIX) || h.texto === "Contactado por WhatsApp")) return "whatsapp";
  return "nota";
}

function ultimaActividad(c) {
  let max = "";
  (c.historial || []).forEach((h) => {
    if (h.fecha && h.fecha > max) max = h.fecha;
  });
  return max || null;
}
function diasSinActividad(c) {
  const u = ultimaActividad(c);
  if (!u) return null;
  return diasEntre(u, hoyISO());
}

// --------------------------------------------------------------- WhatsApp ---

// Normaliza números argentinos al formato que necesita wa.me: solo dígitos,
// con código de país y con el "9" de celulares. Es best-effort, por eso el
// número siempre queda editable antes de enviar.
function normalizePhoneAR(raw) {
  if (!raw) return "";
  // Si hay varios números separados por ";" o "/", tomamos el primero.
  let digits = String(raw).split(/[;\/]/)[0].replace(/[^\d]/g, "");
  if (!digits) return "";
  if (digits.startsWith("54")) {
    let rest = digits.slice(2);
    rest = rest.replace(/^0+/, "");
    rest = rest.replace(/^15/, "");
    if (!rest.startsWith("9")) rest = "9" + rest;
    digits = "54" + rest;
  } else if (digits.startsWith("0")) {
    digits = "549" + digits.replace(/^0+/, "");
  } else if (digits.length <= 12) {
    digits = "549" + digits.replace(/^15/, "");
  }
  return digits;
}

const WHATSAPP_SEQUENCE = [
  {
    key: "variante_a",
    label: "Variante A",
    delayDays: 0,
    text: `Hola {Nombre}, ¿cómo estás? Soy {Asesor}, asesor de OMINT Medicina Prepaga.
Te escribo porque contamos con un *{Descuento}% de descuento durante {Meses} meses en planes de salud* para grupos familiares con CUIT, monotributistas, empleados en relación de dependencia y PyMEs.
¿Querés que te arme una cotización sin compromiso?
Contame tu situación y en minutos te paso los planes disponibles`,
  },
  {
    key: "seguimiento_1",
    label: "Seguimiento 1",
    delayDays: 2,
    text: `Hola {Nombre} 👋 Te escribí hace unos días por si te interesaba conocer los planes de OMINT con descuentos para grupos familiares, monotributistas y profesionales. Sé que a veces el mensaje se pierde entre tantos 😅 Por eso te reescribo: ¿te gustaría que te arme una cotización rápida, sin ningún compromiso?`,
  },
  {
    key: "seguimiento_2",
    label: "Seguimiento 2",
    delayDays: 7,
    text: `Hola {Nombre}, ¿cómo andás? Soy {Asesor} de OMINT 🏥 Te dejo esta última info por si te sirve: estamos con precios preferenciales este mes para varios perfiles (familias, empresas, profesionales). Si en algún momento querés cotizar o tenés dudas sobre tu cobertura actual, quedo a disposición. ¡Que tengas buen día! 🙌`,
  },
];

function getFirstName(contacto) {
  const first = (contacto || "").split("/")[0].trim();
  return first.split(" ")[0] || "";
}
function capitalizar(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;
}
function fillVars(text, vars) {
  return text
    .replace(/{Nombre}/g, vars.nombre || "")
    .replace(/{Asesor}/g, vars.asesor || "")
    .replace(/{Descuento}/g, String(vars.descuento ?? CAMPANA.descuento))
    .replace(/{Meses}/g, String(vars.meses ?? CAMPANA.meses))
    .replace(/{Empresa}/g, vars.empresa || "");
}

// Decide qué paso de la secuencia toca, cuándo estaría listo y si ya terminó.
function getSequenceStatus(company) {
  if (company.waSequenceStopped) return { status: "stopped", step: null, dueDate: null };
  const sent = (company.historial || [])
    .filter((h) => h.texto && h.texto.startsWith(WA_STEP_PREFIX))
    .map((h) => {
      const label = h.texto.slice(WA_STEP_PREFIX.length);
      const step = WHATSAPP_SEQUENCE.find((s) => s.label === label);
      return step ? { step, fecha: h.fecha } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
  const lastSentIndex = sent.length ? WHATSAPP_SEQUENCE.findIndex((s) => s.key === sent[sent.length - 1].step.key) : -1;
  if (lastSentIndex === WHATSAPP_SEQUENCE.length - 1) return { status: "completed", step: null, dueDate: null };
  const nextStep = WHATSAPP_SEQUENCE[lastSentIndex + 1];
  let dueDate;
  if (lastSentIndex === -1) {
    dueDate = new Date();
    dueDate.setHours(0, 0, 0, 0); // variante A: lista desde hoy
  } else {
    const lastDate = parseISO(sent[sent.length - 1].fecha);
    dueDate = new Date(lastDate.getTime() + nextStep.delayDays * 86400000);
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return { status: dueDate <= today ? "due" : "waiting", step: nextStep, dueDate };
}

function buildWaLink(phone, message) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function descargarArchivo(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Archivo .vcf para importar contactos a la agenda del celular y escribirles
// desde WhatsApp normal: la vía más segura contra bloqueos.
function descargarVCF(contactos, nombreArchivo) {
  const vcards = contactos
    .filter((c) => c.telefono)
    .map((c) => {
      const tel = normalizePhoneAR(c.telefono);
      const nota = c.nota ? c.nota.replace(/\n/g, " ") : "";
      return ["BEGIN:VCARD", "VERSION:3.0", `FN:${c.nombre}`, `TEL;TYPE=CELL:+${tel}`, c.org ? `ORG:${c.org}` : "", nota ? `NOTE:${nota}` : "", "END:VCARD"]
        .filter(Boolean)
        .join("\n");
    });
  descargarArchivo(new Blob([vcards.join("\n")], { type: "text/vcard" }), nombreArchivo);
}

function exportarExcel(filas, nombreHoja, nombreArchivo) {
  const ws = XLSX.utils.json_to_sheet(filas);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, nombreHoja);
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  descargarArchivo(new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), nombreArchivo);
}

// Protección antibaneo: espaciar envíos y respetar un tope diario.
const WA_COOLDOWN_MS = 8 * 60 * 1000;
const WA_DAILY_HARD_LIMIT = 12;

function esMismoDia(ts1, ts2) {
  return new Date(ts1).toDateString() === new Date(ts2).toDateString();
}
function calcularWaStats(waLog) {
  const ahora = Date.now();
  const enviadosHoy = waLog.filter((ts) => esMismoDia(ts, ahora)).length;
  const ultimoEnvio = waLog.length ? Math.max(...waLog) : null;
  const msDesdeUltimo = ultimoEnvio ? ahora - ultimoEnvio : Infinity;
  const msRestantesCooldown = Math.max(0, WA_COOLDOWN_MS - msDesdeUltimo);
  const superoLimite = enviadosHoy >= WA_DAILY_HARD_LIMIT;
  return { enviadosHoy, puedeEnviar: msRestantesCooldown <= 0 && !superoLimite, msRestantesCooldown, superoLimite };
}
function useWaGate(waLog) {
  const [, forceTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
  return calcularWaStats(waLog);
}

// ---------------------------------------------------------- B2C: Personas ---

function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return null;
  const nacimiento = parseISO(fechaNacimiento);
  if (!nacimiento || isNaN(nacimiento.getTime())) return null;
  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const m = hoy.getMonth() - nacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
  return edad;
}

// "Apellido, Nombre" o "Nombre Apellido" -> nombre de pila.
function getPersonaFirstName(nombreCompleto) {
  const s = (nombreCompleto || "").trim();
  if (!s) return "";
  if (s.includes(",")) return capitalizar((s.split(",")[1] || "").trim().split(" ")[0] || "");
  return capitalizar(s.split(" ")[0]);
}

const PERSONA_TEMPLATES = [
  {
    key: "directa",
    label: "Directa",
    text: `Hola {Nombre}! Soy {Asesor}, Ejecutivo Comercial de OMINT Medicina Prepaga. Si cobrás con bono de sueldo, sos monotributista o responsable inscripto, este mes tenés *{Descuento}% de descuento durante {Meses} meses* en los planes de OMINT. Tenés cobertura a nivel nacional e internacional, y podés sumar a toda tu familia. Contame tu situación y te armo una propuesta a medida, sin compromiso.`,
  },
  {
    key: "conversacional",
    label: "Conversacional",
    text: `Hola {Nombre}! Soy {Asesor}, Ejecutivo Comercial de OMINT Medicina Prepaga. Si tenés bono de sueldo, sos monotributista o responsable inscripto, aprovechá el *{Descuento}% de descuento por {Meses} meses* que tiene OMINT este mes. Cobertura en todo el país y también afuera si viajás, más la posibilidad de sumar a tu grupo familiar. Contame cómo estás cubierto hoy y vemos qué plan te conviene.`,
  },
  {
    key: "pregunta",
    label: "Pregunta abierta",
    text: `Hola {Nombre}! Soy {Asesor}, Ejecutivo Comercial de OMINT Medicina Prepaga. ¿Sabías que con bono de sueldo, monotributo o RI podés acceder a un *{Descuento}% de descuento durante {Meses} meses* en OMINT este mes? Es una cobertura con alcance nacional e internacional, ideal si viajás seguido o tenés familia en otras provincias. Te armo una cotización sin compromiso, contame tu caso.`,
  },
  {
    key: "beneficio",
    label: "Beneficio concreto",
    text: `Hola {Nombre}! Soy {Asesor}, Ejecutivo Comercial de OMINT Medicina Prepaga. Con bono de sueldo, monotributo o RI, este mes accedés a un *{Descuento}% de descuento durante {Meses} meses* en los planes de OMINT — con cobertura nacional e internacional y la posibilidad de sumar a toda tu familia. Contame tu situación y te paso una propuesta a medida, sin ningún compromiso.`,
  },
];

const PERSONA_HEADER_MAP = {
  nombre: ["nombre", "nombre y apellido", "cliente", "nombre completo", "apellido y nombre", "razon social"],
  apellido: ["apellido"],
  telefono: ["telefono", "tel", "celular", "whatsapp", "telefono contacto", "telefono de contacto"],
  mail: ["mail", "email", "correo", "correo electronico", "e-mail"],
  fechaNacimiento: ["fecha de nacimiento", "fechanacimiento", "nacimiento", "fecha nac"],
  obraSocial: ["obra social", "obrasocial", "os", "cobertura actual", "prepaga actual"],
  dni: ["dni", "documento"],
};

function stripAccents(s) {
  return (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "");
}
function normHeader(h) {
  return stripAccents(String(h || "")).trim().toLowerCase();
}
function normFechaNacimiento(v) {
  if (!v) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "number") {
    const d = new Date(Math.round((v - 25569) * 86400 * 1000));
    return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
  }
  const s = String(v).trim();
  let m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    let [, dd, mm, yyyy] = m;
    if (yyyy.length === 2) yyyy = (Number(yyyy) > 30 ? "19" : "20") + yyyy;
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  return "";
}

// Lee .xlsx/.xls/.csv de pacientes detectando columnas por encabezado. Usa la
// hoja con más filas. Une Apellido + Nombre si vienen separados.
function parsePersonasFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array", cellDates: true });
        let rows = [];
        wb.SheetNames.forEach((name) => {
          const r = XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: "" });
          if (r.length > rows.length) rows = r;
        });
        if (!rows.length) return resolve([]);
        const headerToField = {};
        Object.keys(rows[0]).forEach((h) => {
          const nh = normHeader(h);
          for (const [field, variants] of Object.entries(PERSONA_HEADER_MAP)) {
            if (variants.some((v) => nh === v || nh.includes(v))) headerToField[h] = field;
          }
        });
        const personas = rows
          .map((row) => {
            const p = { nombre: "", apellido: "", telefono: "", mail: "", fechaNacimiento: "", obraSocial: "", dni: "" };
            Object.entries(row).forEach(([h, val]) => {
              const field = headerToField[h];
              if (!field || val === "" || val == null) return;
              p[field] = field === "fechaNacimiento" ? normFechaNacimiento(val) : String(val).trim();
            });
            if (p.apellido) p.nombre = p.nombre ? `${p.apellido}, ${p.nombre}` : p.apellido;
            delete p.apellido;
            return p;
          })
          .filter((p) => p.nombre || p.telefono);
        resolve(personas);
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

const PERSONA_STATUS = [
  { key: "nuevo", label: "Nuevo" },
  { key: "contactado", label: "Contactado" },
  { key: "interesado", label: "Interesado" },
  { key: "cliente", label: "Cliente" },
  { key: "descartado", label: "Descartado" },
];
const RANGOS_EDAD = [
  { key: "<30", label: "< 30", min: 0, max: 29 },
  { key: "30", label: "30–39", min: 30, max: 39 },
  { key: "40", label: "40–49", min: 40, max: 49 },
  { key: "50", label: "50–59", min: 50, max: 59 },
  { key: "60", label: "60–69", min: 60, max: 69 },
  { key: "70", label: "70 +", min: 70, max: 200 },
];

// ---------------------------------------------------------------- Contenido ---

const CONTENIDO_STATUS = [
  { key: "idea", label: "Idea" },
  { key: "borrador", label: "Borrador" },
  { key: "listo", label: "Listo para publicar" },
  { key: "publicado", label: "Publicado" },
];
const CONTENIDO_SEED = [
  {
    id: "content-seed-1",
    plataforma: "instagram",
    titulo: "Post — 20% de descuento por 12 meses",
    texto: `¿Sabías que podés acceder a un plan de salud premium con 20% de descuento durante 12 meses? 🏥✨

Si tenés CUIT, sos monotributista, trabajás en relación de dependencia o tenés una PyME, este descuento es para vos.

📲 Escribime y te armo una cotización sin compromiso.

#SaludOMINT #MedicinaPrepaga #Mendoza`,
    fecha: "",
    status: "borrador",
    nota: "Usar imagen con la promo destacada en grande. Ideal para feed + historia.",
  },
  {
    id: "content-seed-2",
    plataforma: "whatsapp",
    titulo: "Estado — Recordatorio de cotización",
    texto: `¿Todavía no cotizaste tu cobertura de salud? 👀 Este mes seguimos con precios preferenciales para PyMEs y monotributistas. Escribime y en minutos te paso los planes disponibles.`,
    fecha: "",
    status: "idea",
    nota: "Para subir como estado de WhatsApp, acompañado de una imagen simple con el logo de Omint.",
  },
];

// ------------------------------------------------------- Producto / precios ---

// ---------------------------------------------- Lista de precios EMPRESAS ---
// La lista completa (todas las provincias) se inyecta al armar el archivo desde
// el Excel de Omint: node build.mjs ... --lista "Lista de precios Empresas.xls".
// No se versiona en el repositorio. null = sin lista cargada.
const LISTA_DATA = /*__LISTA__*/null;
const LISTA_PRECIOS = LISTA_DATA ? `Lista Empresas · ${LISTA_DATA.vigencia}` : "Sin lista de precios cargada";
const PROVINCIAS = LISTA_DATA ? Object.keys(LISTA_DATA.provincias).sort((a, b) => (a === "AMBA" ? -1 : b === "AMBA" ? 1 : a.localeCompare(b, "es"))) : [];
const TRAMOS = [
  { key: "1 a 10", min: 1, max: 10 },
  { key: "11 a 99", min: 11, max: 99 },
  { key: "100 a 199", min: 100, max: 199 },
  { key: "200 a 499", min: 200, max: Infinity },
];
const tramoDe = (capitas) => (TRAMOS.find((t) => capitas >= t.min && capitas <= t.max) || TRAMOS[0]).key;
// Orden de la lista: 00-25, 26-35, 36-54, 55-59, 60+, Hijo 1, Hijo 2 o +.
const P = (a) => (a ? { "00-25": a[0], "26-35": a[1], "36-54": a[2], "55-59": a[3], "60+": a[4], hijo1: a[5], hijo2: a[6] } : null);
const MAX_CAPITAS_PLAN_B = 25;
// Beneficios de referencia (los mismos que usa el Cotizador Omint).
const BENEFICIOS_PLAN = {
  "2500_24": ["Habitación compartida (individual solo en Cl. Santa Isabel y Bazterrica)", "Ortodoncia cubierta solo entre 5 y 8 años", "Kinesiología y fonoaudiología: hasta 30 sesiones", "Extensión de cobertura por fallecimiento del titular: 6 meses"],
  "4500_23": ["Habitación individual en todas las instituciones", "Ortodoncia cubierta hasta los 18 años", "Kinesiología y fonoaudiología: hasta 40 sesiones", "Extensión de cobertura por fallecimiento del titular: 12 meses"],
  "6500_21": ["Habitación individual en todas las instituciones", "Ortodoncia cubierta hasta los 25 años", "Kinesiología y fonoaudiología sin tope de sesiones", "Reintegro de ecografías 3D/4D y consultas homeopáticas"],
  "8500_21": ["Habitación individual, con sistema Cerrado, Combinado y Abierto", "Ortodoncia cubierta hasta los 99 años (sin límite práctico)", "Única línea con cobertura de cirugía estética", "Única línea con reintegro de óptica", "Acompañante en internación hasta 4 días (el máximo de la línea)"],
  "2500_20": ["Habitación compartida (individual solo en Cl. Santa Isabel y Bazterrica)", "Ortodoncia cubierta solo entre 5 y 8 años c/copago", "Kinesiología y fonoaudiología: hasta 30 sesiones c/copago", "Extensión de cobertura por fallecimiento del titular: 6 meses c/copago"],
  "4500_20": ["Habitación individual en todas las instituciones", "Ortodoncia cubierta hasta los 18 años c/copago", "Kinesiología y fonoaudiología: hasta 40 sesiones c/copago", "Extensión de cobertura por fallecimiento del titular: 12 meses c/copago"],
  "6500_20": ["Habitación individual en todas las instituciones", "Ortodoncia cubierta hasta los 25 años c/copago", "Kinesiología y fonoaudiología sin tope de sesiones c/copago"],
  COMUNIDAD_SC: ["PMO Omint sin copagos"],
  COMUNIDAD_CC: ["PMO Omint con copagos", "Exclusivo para holdings de hasta 25 cápitas"],
};
// Datos extra de la línea PYME (ficha de producto).
const PYME_EXTRA = {
  "4500_PYME": { farmacia: "40%", modulo: "OA_TURISTA" },
  "6500_PYME": { farmacia: "50%", modulo: "OA_TURISTA_PLUS" },
  "8500_PYME": { farmacia: "50%", modulo: "OA_EURO" },
};

// Planes que se venden en una provincia, con sus tarifas por tramo.
const _planesCache = {};
function planesDeProvincia(provincia) {
  if (!LISTA_DATA) return [];
  const zid = LISTA_DATA.provincias[provincia] || LISTA_DATA.provincias.Mendoza || Object.values(LISTA_DATA.provincias)[0];
  if (_planesCache[zid]) return _planesCache[zid];
  const zona = LISTA_DATA.zonas[zid];
  _planesCache[zid] = zona.planes.map((p) => {
    const tarifas = {};
    TRAMOS.forEach((t) => (tarifas[t.key] = p.precioUnico ? (t.key === "200 a 499" ? null : P(p.precioUnico)) : P(p.tarifas[t.key])));
    const tipo = p.planB ? "Plan B" : p.pyme ? "PYME" : p.seccion === "Planes Comunidad" ? "Comunidad" : "Estándar";
    const base = p.codigo.replace(/C$/, "");
    return { plan: p.codigo, linea: p.familia, tipo, tarifas, maxCapitas: p.maxCapitas, nota: p.nota || "", bullets: BENEFICIOS_PLAN[p.codigo] || BENEFICIOS_PLAN[base] || [] };
  });
  return _planesCache[zid];
}
const zonaTitulo = (provincia) => (LISTA_DATA && LISTA_DATA.zonas[LISTA_DATA.provincias[provincia]] ? LISTA_DATA.zonas[LISTA_DATA.provincias[provincia]].titulo : "");
const CAMPANA = { descuento: 20, meses: 12 };
const FRANJAS = [
  { key: "00-25", label: "Titulares 0–25" },
  { key: "26-35", label: "Titulares 26–35" },
  { key: "36-54", label: "Titulares 36–54" },
  { key: "55-59", label: "Titulares 55–59" },
  { key: "60+", label: "Titulares 60+" },
  { key: "hijo1", label: "1er hijo menor de 25 (uno por familia)" },
  { key: "hijo2", label: "2º hijo menor de 25 en adelante" },
];
const MIN_CAPITAS_PYME = 11;

// Cotiza un plan para la composición dada, aplicando el tramo por cápitas y
// las reglas de venta (PYME desde 11, Plan B hasta 25, 200+ consultar).
function cotizar(plan, cantidades, descuento) {
  let capitas = 0;
  FRANJAS.forEach((f) => (capitas += num(cantidades[f.key])));
  const tramo = tramoDe(capitas);
  const base = { plan, capitas, tramo, lista: 0, desc: 0, total: 0, porCapita: 0, disponible: false, motivo: "" };
  if (!capitas) return { ...base, motivo: "Cargá la composición del grupo" };
  if (plan.maxCapitas && capitas > plan.maxCapitas) return { ...base, motivo: `Solo hasta ${plan.maxCapitas} cápitas` };
  const tabla = plan.tarifas[tramo];
  if (!tabla) {
    const motivo = tramo === "200 a 499" ? "Consultar con Producto" : plan.tipo === "PYME" ? `PYME: desde ${MIN_CAPITAS_PYME} cápitas` : `No se vende en el tramo ${tramo}`;
    return { ...base, motivo };
  }
  let lista = 0;
  FRANJAS.forEach((f) => (lista += num(cantidades[f.key]) * tabla[f.key]));
  const desc = lista * (num(descuento) / 100);
  const total = lista - desc;
  return { ...base, disponible: true, lista, desc, total, porCapita: total / capitas };
}

const OBJECIONES = [
  {
    q: "“Es caro”",
    a: "Llevá la conversación a valor por cápita y por mes, no al total. Mostrá el descuento vigente y compará contra lo que hoy pagan por empleado (aportes + diferencias). Si el precio sigue siendo el tema, bajá de línea (Premium → Clásico → Global) antes que resignar margen.",
  },
  {
    q: "“Ya tenemos obra social / prepaga”",
    a: "No compitas de entrada: preguntá qué valoran y qué les molesta de la cobertura actual (cartilla, demoras, reintegros, cobertura fuera de la provincia). Ofrecé una comparación sin compromiso con su plan actual y evaluá la derivación de aportes.",
  },
  {
    q: "“Lo tengo que pensar / consultar”",
    a: "Preguntá con quién lo tiene que consultar y qué necesita esa persona para decidir. Proponé una reunión corta con el decisor y dejá fecha concreta en el CRM como próxima acción.",
  },
  {
    q: "“Mandame la info por mail”",
    a: "Mandala, pero con una cotización a medida (usá el Cotizador) y cerrá ya una fecha para revisarla juntos: “Te la mando hoy y el jueves a las 10 la repasamos en 15 minutos, ¿te parece?”.",
  },
  {
    q: "“Somos pocos empleados”",
    a: "La línea PYME arranca en 11 cápitas, que incluyen al grupo familiar de cada titular. Sumá cónyuges e hijos: muchas veces 5–6 empleados ya califican.",
  },
  {
    q: "“No es el momento”",
    a: "Registrá el motivo (Timing) y agendá un seguimiento a 30–60 días. Preguntá qué fecha tiene sentido: cierre de ejercicio, paritarias, renovación de su cobertura actual.",
  },
];

// --------------------------------------------------------- Google Calendar ---

// Versión web (hosting propio): no hay conector de Claude, así que en lugar de
// sincronizar se abre Google Calendar con el evento ya completado.
const HOSTED = typeof window !== "undefined" && !!window.__CRM_HOSTED__;

function gcalTemplateLink(m) {
  const start = localDateFromFechaHora(m.fecha, m.hora);
  const end = new Date(start.getTime() + 30 * 60000);
  const f = (d) => `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}T${pad2(d.getHours())}${pad2(d.getMinutes())}00`;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const q = new URLSearchParams({ action: "TEMPLATE", text: `Reunión con ${m.empresa}`, dates: `${f(start)}/${f(end)}`, details: m.notas || "Reunión comercial Omint PyME", ctz: tz });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

const GCAL_CALENDAR_ID = "pablohidalgo1188@gmail.com";
const GCAL_SYSTEM = `You have access to a Google Calendar MCP tool connected to the user's real Google account. You must ONLY ever read from or write to the calendar with id "${GCAL_CALENDAR_ID}". Never use "primary" or any other calendar id, even if it is offered as a default. Always call the appropriate tool immediately when asked. Never ask clarifying questions and never refuse. After the tool call completes, output ONLY the exact JSON requested in the user message, with no code fences, no explanation, and no extra text before or after it.`;

async function callGCalAgent(userMessage) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);
  let response;
  try {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: GCAL_SYSTEM,
        messages: [{ role: "user", content: userMessage }],
        mcp_servers: [{ type: "url", url: "https://calendarmcp.googleapis.com/mcp/v1", name: "google-calendar" }],
      }),
    });
  } catch (e) {
    if (e.name === "AbortError") throw new Error("Se agotó el tiempo de espera conectando con Google Calendar. Revisá que el conector siga autorizado e intentá de nuevo.");
    throw new Error("No se pudo conectar con el servicio (" + (e.message || "error de red") + ").");
  } finally {
    clearTimeout(timeoutId);
  }
  let data;
  try {
    data = await response.json();
  } catch (e) {
    throw new Error("Respuesta inválida del servidor (HTTP " + response.status + ").");
  }
  if (!response.ok) {
    const msg = (data && data.error && data.error.message) || "HTTP " + response.status;
    throw new Error("Error al conectar con Google Calendar: " + msg);
  }
  return (data.content || []).filter((i) => i.type === "text").map((i) => i.text).join("\n");
}

function extractJson(raw) {
  const clean = raw.replace(/```json|```/g, "").trim();
  const start = clean.search(/[\[{]/);
  if (start === -1) throw new Error("no json found");
  return JSON.parse(clean.slice(start));
}

function formatWithOffset(dt) {
  const offsetMin = -dt.getTimezoneOffset();
  const sign = offsetMin >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMin);
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}T${pad2(dt.getHours())}:${pad2(dt.getMinutes())}:00${sign}${pad2(Math.floor(abs / 60))}:${pad2(abs % 60)}`;
}
function localDateFromFechaHora(fecha, hora) {
  const [y, m, d] = fecha.split("-").map(Number);
  const [hh, mm] = (hora || "00:00").split(":").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0);
}

async function pushMeetingToGoogle(meeting) {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const startDt = localDateFromFechaHora(meeting.fecha, meeting.hora);
  const endDt = new Date(startDt.getTime() + 30 * 60000);
  const startISO = formatWithOffset(startDt);
  const endISO = formatWithOffset(endDt);
  const msg = `Create an event on the Google Calendar with id "${GCAL_CALENDAR_ID}" (not "primary", use exactly this calendar id).

These values are already fully computed, including the correct UTC offset for time zone ${tz}. Do NOT recalculate, convert, shift, or reinterpret them in any way — copy them exactly as given into the tool call:
- Title: Reunión con ${meeting.empresa}
- Description: ${meeting.notas || "Reunión comercial Omint PyME"}
- start.dateTime: ${startISO}
- end.dateTime: ${endISO}
- Time zone field (if the tool asks for one separately): ${tz}

Call the create_event tool now with calendarId "${GCAL_CALENDAR_ID}", using start.dateTime = "${startISO}" and end.dateTime = "${endISO}" exactly as written above, character for character. After it succeeds, respond with ONLY this JSON and nothing else: {"eventId": "<the id returned by the tool>"}`;
  try {
    const parsed = extractJson(await callGCalAgent(msg));
    if (!parsed.eventId) return { eventId: null, error: "Google Calendar no devolvió un id de evento." };
    return { eventId: parsed.eventId, error: null };
  } catch (e) {
    return { eventId: null, error: e.message || "Error desconocido al crear el evento." };
  }
}

async function deleteEventFromGoogle(eventId) {
  if (!eventId) return { ok: true, error: null };
  const msg = `Delete the event with id "${eventId}" from the Google Calendar with id "${GCAL_CALENDAR_ID}" (not "primary", use exactly this calendar id). Call the delete_event tool now with calendarId "${GCAL_CALENDAR_ID}". Respond with ONLY this JSON: {"status":"deleted"}`;
  try {
    const parsed = extractJson(await callGCalAgent(msg));
    if (parsed.status !== "deleted") return { ok: false, error: "Google Calendar no confirmó el borrado." };
    return { ok: true, error: null };
  } catch (e) {
    return { ok: false, error: e.message || "Error desconocido al borrar el evento." };
  }
}

async function pullEventsFromGoogle() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = new Date();
  const in60 = new Date(now.getTime() + 60 * 86400000);
  const msg = `List all events on the Google Calendar with id "${GCAL_CALENDAR_ID}" (not "primary", use exactly this calendar id) between ${now.toISOString()} and ${in60.toISOString()}.
Call the list_events tool now with calendarId "${GCAL_CALENDAR_ID}". Each event's start.dateTime returned by the tool already includes its own UTC offset — convert every start time to the local time in the "${tz}" time zone before reporting it (do not report raw UTC times as if they were local). After retrieving the results, respond with ONLY a JSON array in this exact format, no other text:
[{"id":"<event id>","summary":"<event title>","start":"YYYY-MM-DDTHH:MM"}]
The "start" field in your JSON output must be the local wall-clock time in "${tz}", not UTC.
If there are no events, respond with exactly: []`;
  const events = extractJson(await callGCalAgent(msg));
  return { events, rangeStart: now, rangeEnd: in60 };
}

// ---------------------------------------------------- Base inicial / merge ---

function companyFromSeed(s) {
  return {
    id: uid(),
    empresa: s.empresa,
    cuit: s.cuit || "",
    fechaAlta: s.fechaAlta || "",
    nombreFantasia: s.nombreFantasia || "",
    contacto: s.contacto,
    telefono: s.telefono,
    mail: s.mail,
    tier: s.tier,
    nota: s.nota,
    stage: "prospeccion",
    capitas: "",
    proximaAccion: "",
    fechaProximaAccion: "",
    historial: [],
  };
}
function loadInitialCompanies() {
  return SEED.map(companyFromSeed);
}
function normEmpresa(nombre) {
  return (nombre || "").trim().toUpperCase().replace(/\s+/g, " ");
}
function normcuitStr(cuit) {
  return (cuit || "").replace(/[^0-9]/g, "");
}

// Completa campos faltantes con el SEED y agrega empresas nuevas del SEED,
// sin pisar nada de lo que el usuario ya cargó.
function mergeSeedData(storedCompanies) {
  const seedByName = new Map(SEED.map((s) => [normEmpresa(s.empresa), s]));
  const enriched = storedCompanies.map((c) => {
    const match = seedByName.get(normEmpresa(c.empresa));
    const base = { historial: [], ...c };
    if (!match) return base;
    return {
      ...base,
      cuit: c.cuit || match.cuit || "",
      fechaAlta: c.fechaAlta || match.fechaAlta || "",
      nombreFantasia: c.nombreFantasia || match.nombreFantasia || "",
    };
  });
  const existingNames = new Set(enriched.map((c) => normEmpresa(c.empresa)));
  const existingCuits = new Set(enriched.filter((c) => c.cuit).map((c) => normcuitStr(c.cuit)));
  const nuevas = SEED.filter((s) => !existingNames.has(normEmpresa(s.empresa)) && !(s.cuit && existingCuits.has(normcuitStr(s.cuit)))).map(companyFromSeed);
  return [...enriched, ...nuevas];
}

// ----------------------------------------------------------- Almacenamiento ---

const PERSONA_CHUNK_SIZE = 3000;
const COMPANY_CHUNK_SIZE = 400;

async function trySetStorage(key, value) {
  for (let intento = 0; intento < 3; intento++) {
    try {
      const res = await window.storage.set(key, value);
      if (res) return true;
    } catch (e) {
      // reintentamos
    }
    await new Promise((r) => setTimeout(r, 500 * (intento + 1)));
  }
  return false;
}

// Límite de 5MB por clave: partimos en bloques y solo reescribimos los que cambian.
async function saveChunked(prefix, items, chunkSize, prevChunkCount, prevChunkContents) {
  const chunks = [];
  for (let i = 0; i < items.length; i += chunkSize) chunks.push(items.slice(i, i + chunkSize));
  let ok = true;
  const chunkContents = [];
  for (let i = 0; i < chunks.length; i++) {
    const contenido = JSON.stringify(chunks[i]);
    chunkContents.push(contenido);
    if (prevChunkContents && prevChunkContents[i] === contenido) continue;
    ok = (await trySetStorage(`${prefix}_chunk_${i}`, contenido)) && ok;
  }
  ok = (await trySetStorage(`${prefix}_meta`, JSON.stringify({ count: chunks.length }))) && ok;
  if (prevChunkCount && prevChunkCount > chunks.length) {
    for (let i = chunks.length; i < prevChunkCount; i++) {
      try {
        await window.storage.delete(`${prefix}_chunk_${i}`);
      } catch (e) {
        // no crítico
      }
    }
  }
  return { ok, chunkCount: chunks.length, chunkContents };
}

async function getStorageSafe(key) {
  try {
    return await window.storage.get(key);
  } catch (e) {
    return null;
  }
}

// Si un bloque está dañado lo salteamos avisando: nunca tiramos toda la base.
async function loadChunked(prefix, legacyFlatKey) {
  const meta = await getStorageSafe(`${prefix}_meta`);
  if (meta) {
    let count = 0;
    try {
      count = JSON.parse(meta.value).count || 0;
    } catch (e) {
      count = 0;
    }
    let items = [];
    const chunkContents = [];
    let huboBloqueDanado = false;
    for (let i = 0; i < count; i++) {
      const chunk = await getStorageSafe(`${prefix}_chunk_${i}`);
      const contenido = chunk ? chunk.value : "[]";
      chunkContents.push(contenido);
      if (chunk) {
        try {
          items = items.concat(JSON.parse(contenido));
        } catch (e) {
          huboBloqueDanado = true;
        }
      } else huboBloqueDanado = true;
    }
    return { items, chunkCount: count, chunkContents, huboBloqueDanado };
  }
  if (legacyFlatKey) {
    const old = await getStorageSafe(legacyFlatKey);
    if (old) {
      try {
        return { items: JSON.parse(old.value), chunkCount: 0, chunkContents: [], huboBloqueDanado: false };
      } catch (e) {
        return { items: [], chunkCount: 0, chunkContents: [], huboBloqueDanado: true };
      }
    }
  }
  return { items: [], chunkCount: 0, chunkContents: [], huboBloqueDanado: false };
}

function normalizePersonas(personas) {
  return personas.map((p) => {
    const w = { ...p };
    if (!w.id) w.id = uid();
    if (!w.status) w.status = "nuevo";
    if (!w.nota) w.nota = "";
    if (!w.historial) w.historial = [];
    return w;
  });
}

function parseJSONSafe(entry, fallback) {
  if (!entry) return fallback;
  try {
    return JSON.parse(entry.value);
  } catch (e) {
    return fallback;
  }
}

// ---------------------------------------------------------- Agregaciones ---

// Cuenta actividad comercial por día a partir de historiales, reuniones y el
// registro de WhatsApp. Devuelve Map("YYYY-MM-DD" -> {llamada, whatsapp, ...}).
function construirActividad(companies, personas, meetings, waLog) {
  const map = new Map();
  const get = (f) => {
    let o = map.get(f);
    if (!o) {
      o = { llamada: 0, whatsapp: 0, mail: 0, reunion: 0, propuesta: 0 };
      map.set(f, o);
    }
    return o;
  };
  const reunionHist = new Map();
  const addHist = (h) => {
    if (!h.fecha || !h.tipo) return; // las entradas sin tipo (viejas / automáticas de WA) no cuentan acá
    if (h.tipo === "reunion") reunionHist.set(h.fecha, (reunionHist.get(h.fecha) || 0) + 1);
    else if (h.tipo in { llamada: 1, whatsapp: 1, mail: 1, propuesta: 1 }) get(h.fecha)[h.tipo]++;
  };
  companies.forEach((c) => (c.historial || []).forEach(addHist));
  personas.forEach((p) => (p.historial || []).forEach(addHist));
  waLog.forEach((ts) => get(isoLocal(new Date(ts))).whatsapp++);
  const reunionAgenda = new Map();
  meetings.forEach((m) => m.fecha && reunionAgenda.set(m.fecha, (reunionAgenda.get(m.fecha) || 0) + 1));
  new Set([...reunionHist.keys(), ...reunionAgenda.keys()]).forEach((f) => {
    get(f).reunion = Math.max(reunionHist.get(f) || 0, reunionAgenda.get(f) || 0);
  });
  return map;
}
const totalToques = (o) => (o ? o.llamada + o.whatsapp + o.mail + o.reunion + o.propuesta : 0);

// --------------------------------------- Cotizaciones del Cotizador Omint ---

// Nombre comparable: sin acentos, mayúsculas, puntuación ni forma societaria.
function claveNombre(s) {
  return stripAccents(String(s || ""))
    .toLowerCase()
    .replace(/\b(s\.?\s?a\.?\s?s?|s\.?\s?r\.?\s?l|s\.?\s?a\.?\s?u|sociedad anonima|srl|sas|sa)\b\.?/g, " ")
    .replace(/[^a-z0-9ñ ]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .sort()
    .join(" ");
}
const telClave = (t) => {
  const d = normalizePhoneAR(t);
  return d.length >= 8 ? d.slice(-10) : "";
};

// Direcciones donde puede estar instalado el cotizador (absolutas, sin repetir).
function candidatosCotizador(preferida) {
  const loc = window.location;
  const out = [];
  const add = (u) => {
    try {
      let x = new URL(u, loc.href).toString();
      if (!x.endsWith("/")) x += "/";
      if (!out.includes(x)) out.push(x);
    } catch (e) {
      // dirección inválida: se ignora
    }
  };
  if (preferida) add(preferida);
  add("../cotizador/");
  add("/cotizador/");
  add("./cotizador/");
  const partes = loc.hostname.split(".");
  if (partes.length >= 2 && !/^\d+$/.test(partes[partes.length - 1])) {
    const base = /^(crm|www|app)$/i.test(partes[0]) && partes.length > 2 ? partes.slice(1).join(".") : loc.hostname;
    add(`${loc.protocol}//cotizador.${base}/`);
    add(`${loc.protocol}//${base}/cotizador/`);
  }
  return out;
}

// Convierte una cotización guardada en el cotizador al formato que registra el CRM.
function cotizacionAMensaje(q) {
  return {
    tipo: q.tipo === "empresa" ? "empresa" : "individual",
    fecha: q.fecha,
    datos: {
      cid: q.id,
      nombre: q.cliente || "",
      telefono: q.telefono || "",
      provincia: q.provincia || "",
      capitas: q.tipo === "empresa" ? q.capitas : null,
      condicion: q.condicion || "",
      planes: (q.planes || []).map((p) => ({ plan: p.nombre, tag: "", lista: p.lista, bonificado: p.bonificado, aporte: p.aporte, aPagar: p.aPagar })),
    },
  };
}

// Posibles fichas para una cotización: por CUIT, teléfono o nombre.
function coincidenciasCotizacion(q, companies, personas) {
  const nom = claveNombre(q.cliente);
  const tel = telClave(q.telefono);
  const cuit = normcuitStr(q.cuit);
  if (q.tipo === "empresa") {
    return companies
      .filter((c) => (cuit.length >= 10 && normcuitStr(c.cuit) === cuit) || (nom && (claveNombre(c.empresa) === nom || (c.nombreFantasia && claveNombre(c.nombreFantasia) === nom))) || (tel && telClave(c.telefono) === tel))
      .map((c) => ({ tipo: "empresa", id: c.id, label: c.empresa }));
  }
  return personas
    .filter((p) => (tel && telClave(p.telefono) === tel) || (nom && claveNombre(p.nombre) === nom))
    .map((p) => ({ tipo: "persona", id: p.id, label: p.nombre }));
}

const ThemeCtx = createContext("light");
const CHART = {
  light: { accent: "#0E8C7F", accent2: "#86B6EF", grid: "#E3E8EF", axis: "#6B788C", ref: "#B86E00" },
  dark: { accent: "#2FB5A5", accent2: "#3B6EA8", grid: "#263246", axis: "#8F9CB0", ref: "#E3A33A" },
};
function useChart() {
  return CHART[useContext(ThemeCtx)] || CHART.light;
}


// ============================================================== Estilos ===

const APP_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
.crm {
  --bg:#F3F5F9; --surface:#FFFFFF; --surface-2:#F6F8FB; --surface-3:#EDF1F6; --border:#E2E7EF; --border-strong:#CBD3DF;
  --ink:#0F1B2D; --ink-2:#44546A; --muted:#6B788C;
  --brand:#0B2A4F; --accent:#0E8C7F; --accent-hover:#0B776C; --accent-soft:#E2F4F1; --accent-ink:#0A6B61;
  --good:#1E8A4C; --good-soft:#E3F3E9; --warn:#A8620A; --warn-soft:#FCF0DC; --bad:#C8372D; --bad-soft:#FBE7E5;
  --info:#2A6FC4; --info-soft:#E6EFFB; --wa:#1E8A4C;
  --side:#0B1E38; --side-2:#13294A; --side-ink:#AFC0D8; --side-active:#7FE3D5;
  --shadow:0 1px 2px rgba(15,27,45,.04),0 2px 8px rgba(15,27,45,.04);
  --shadow-lg:0 12px 40px rgba(15,27,45,.18);
  color-scheme: light;
}
.crm[data-theme="dark"] {
  --bg:#0B111B; --surface:#121A27; --surface-2:#172131; --surface-3:#1D293B; --border:#243147; --border-strong:#33435E;
  --ink:#E7EDF5; --ink-2:#AEBBCD; --muted:#8392A8;
  --brand:#E7EDF5; --accent:#2FB5A5; --accent-hover:#3CC7B6; --accent-soft:rgba(47,181,165,.14); --accent-ink:#62D4C5;
  --good:#45C07A; --good-soft:rgba(69,192,122,.14); --warn:#E5A646; --warn-soft:rgba(229,166,70,.14); --bad:#F07068; --bad-soft:rgba(240,112,104,.14);
  --info:#5A9FEF; --info-soft:rgba(90,159,239,.14); --wa:#45C07A;
  --side:#080D16; --side-2:#111A29; --side-ink:#93A3BA; --side-active:#62D4C5;
  --shadow:0 1px 2px rgba(0,0,0,.3); --shadow-lg:0 12px 40px rgba(0,0,0,.5);
  color-scheme: dark;
}
.crm { background:var(--bg); color:var(--ink); font-family:'Inter',system-ui,-apple-system,sans-serif; font-size:14px; display:flex; min-height:100vh; -webkit-font-smoothing:antialiased; }
.crm * { box-sizing:border-box; }
.crm .tnum { font-variant-numeric:tabular-nums; }
.crm h1 { font-size:24px; font-weight:800; letter-spacing:-.02em; margin:0; color:var(--ink); }
.crm .sub { color:var(--muted); font-size:13px; margin-top:2px; }
.crm .muted { color:var(--muted); }
.crm .ink2 { color:var(--ink-2); }

/* Layout */
.crm .side { width:240px; flex-shrink:0; height:100vh; position:sticky; top:0; overflow-y:auto; background:var(--side); display:flex; flex-direction:column; gap:14px; padding:16px 12px; }
.crm .main { flex:1; min-width:0; }
.crm .inner { max-width:1440px; padding:24px 32px 64px; }
.crm .nav-group { font-size:10.5px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:#6F84A3; padding:10px 10px 4px; }
.crm .nav-btn { display:flex; align-items:center; gap:10px; width:100%; padding:8px 10px; border-radius:10px; font-size:13.5px; font-weight:600; color:var(--side-ink); background:transparent; border:0; cursor:pointer; text-align:left; white-space:nowrap; }
.crm .nav-btn:hover { background:rgba(255,255,255,.06); color:#fff; }
.crm .nav-btn.on { background:rgba(127,227,213,.13); color:var(--side-active); }
.crm .nav-badge { margin-left:auto; font-size:11px; font-weight:700; padding:1px 7px; border-radius:999px; background:rgba(255,255,255,.1); color:#E3EAF4; }
.crm .nav-badge.hot { background:#C8372D; color:#fff; }
.crm .topbar { display:none; }
.crm .grid { display:grid; gap:16px; }
.crm .g2 { grid-template-columns:repeat(2,minmax(0,1fr)); }
.crm .g3 { grid-template-columns:repeat(3,minmax(0,1fr)); }
.crm .g4 { grid-template-columns:repeat(4,minmax(0,1fr)); }
.crm .g6 { grid-template-columns:repeat(6,minmax(0,1fr)); }
.crm .span2 { grid-column:span 2; }
.crm .span3 { grid-column:span 3; }
.crm .row { display:flex; align-items:center; gap:8px; }
.crm .wrap { flex-wrap:wrap; }
.crm .between { justify-content:space-between; }
.crm .stack > * + * { margin-top:16px; }
.crm .stack-sm > * + * { margin-top:8px; }
@media (max-width: 1100px) { .crm .g4, .crm .g6 { grid-template-columns:repeat(2,minmax(0,1fr)); } .crm .g3 { grid-template-columns:repeat(2,minmax(0,1fr)); } .crm .span3 { grid-column:span 2; } }
@media (max-width: 820px) {
  .crm { display:block; }
  .crm .side { display:none; }
  .crm .topbar { display:flex; position:sticky; top:0; z-index:30; background:var(--side); padding:10px 12px; gap:6px; overflow-x:auto; align-items:center; }
  .crm .inner { padding:16px 16px 72px; }
  .crm .g2, .crm .g3, .crm .g4 { grid-template-columns:minmax(0,1fr); }
  .crm .g6 { grid-template-columns:repeat(2,minmax(0,1fr)); }
  .crm .span2, .crm .span3 { grid-column:auto; }
  .crm h1 { font-size:20px; }
}

/* Superficies */
.crm .card { background:var(--surface); border:1px solid var(--border); border-radius:16px; box-shadow:var(--shadow); min-width:0; }
.crm .card-h { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:14px 18px 4px; }
.crm .card-t { display:flex; align-items:center; gap:8px; font-weight:700; font-size:14px; color:var(--ink); }
.crm .card-t svg { color:var(--muted); }
.crm .card-b { padding:12px 18px 18px; }
.crm .hero { background:linear-gradient(155deg,#0B2A4F 0%,#0E4A5E 100%); color:#fff; border-radius:16px; padding:20px; }
.crm[data-theme="dark"] .hero { background:linear-gradient(155deg,#10284A 0%,#0D3A44 100%); border:1px solid var(--border); }
.crm .tile { background:var(--surface-2); border:1px solid var(--border); border-radius:12px; padding:10px 12px; }
.crm .item { display:flex; align-items:center; gap:10px; width:100%; text-align:left; background:var(--surface-2); border:1px solid transparent; border-radius:12px; padding:9px 11px; color:var(--ink); cursor:pointer; }
.crm .item:hover { border-color:var(--border-strong); background:var(--surface-3); }
.crm .divider { height:1px; background:var(--border); margin:12px 0; }

/* Controles */
.crm .btn { display:inline-flex; align-items:center; justify-content:center; gap:6px; font:inherit; font-size:13px; font-weight:600; padding:8px 13px; border-radius:10px; border:1px solid transparent; cursor:pointer; white-space:nowrap; text-decoration:none; transition:background .12s, border-color .12s; }
.crm .btn:disabled { opacity:.45; cursor:not-allowed; }
.crm .btn-sm { padding:5px 9px; font-size:12px; border-radius:8px; }
.crm .btn-primary { background:var(--accent); color:#fff; }
.crm[data-theme="dark"] .btn-primary { color:#062420; }
.crm .btn-primary:hover:not(:disabled) { background:var(--accent-hover); }
.crm .btn-outline { background:var(--surface); border-color:var(--border); color:var(--ink); }
.crm .btn-outline:hover:not(:disabled) { border-color:var(--border-strong); background:var(--surface-2); }
.crm .btn-ghost { background:transparent; color:var(--ink-2); }
.crm .btn-ghost:hover:not(:disabled) { background:var(--surface-3); color:var(--ink); }
.crm .btn-wa { background:var(--wa); color:#fff; }
.crm[data-theme="dark"] .btn-wa { color:#06210F; }
.crm .btn-danger { background:transparent; border-color:var(--bad); color:var(--bad); }
.crm .btn-soft { background:var(--accent-soft); color:var(--accent-ink); }
.crm .icon-btn { display:inline-flex; align-items:center; justify-content:center; width:30px; height:30px; border-radius:8px; border:1px solid var(--border); background:var(--surface); color:var(--ink-2); cursor:pointer; flex-shrink:0; }
.crm .icon-btn:hover:not(:disabled) { background:var(--surface-3); color:var(--ink); }
.crm .icon-btn:disabled { opacity:.35; cursor:not-allowed; }
.crm .icon-btn.wa { color:var(--wa); background:var(--good-soft); border-color:transparent; }
.crm .input, .crm .select, .crm .textarea { width:100%; font:inherit; font-size:13.5px; color:var(--ink); background:var(--surface); border:1px solid var(--border); border-radius:10px; padding:8px 10px; outline:none; }
.crm .input:focus, .crm .select:focus, .crm .textarea:focus { border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-soft); }
.crm .select { width:auto; padding-right:28px; }
.crm .select.full { width:100%; }
.crm .label { display:block; font-size:12px; font-weight:600; color:var(--ink-2); margin-bottom:4px; }
.crm .search { position:relative; }
.crm .search svg { position:absolute; left:10px; top:50%; transform:translateY(-50%); color:var(--muted); }
.crm .search .input { padding-left:32px; min-width:220px; }
.crm .seg { display:inline-flex; background:var(--surface-3); border-radius:10px; padding:3px; gap:2px; }
.crm .seg button { font:inherit; font-size:12.5px; font-weight:600; padding:5px 10px; border:0; border-radius:8px; background:transparent; color:var(--ink-2); cursor:pointer; }
.crm .seg button.on { background:var(--surface); color:var(--ink); box-shadow:var(--shadow); }
.crm .chip { display:inline-flex; align-items:center; gap:4px; font-size:11.5px; font-weight:600; padding:2px 8px; border-radius:999px; white-space:nowrap; }
.crm .t-neutral { background:var(--surface-3); color:var(--ink-2); }
.crm .t-accent { background:var(--accent-soft); color:var(--accent-ink); }
.crm .t-good { background:var(--good-soft); color:var(--good); }
.crm .t-warn { background:var(--warn-soft); color:var(--warn); }
.crm .t-bad { background:var(--bad-soft); color:var(--bad); }
.crm .t-info { background:var(--info-soft); color:var(--info); }
.crm .note { font-size:12.5px; padding:9px 12px; border-radius:10px; line-height:1.45; }
.crm .bar-track { height:8px; border-radius:999px; background:var(--surface-3); overflow:hidden; }
.crm .bar-fill { height:100%; border-radius:999px; background:var(--accent); transition:width .5s ease; }
.crm .kbd { font-size:11px; font-weight:600; padding:1px 6px; border-radius:6px; border:1px solid var(--border-strong); color:var(--muted); background:var(--surface-2); }

/* Tablas */
.crm table.tbl { width:100%; border-collapse:collapse; font-size:13px; }
.crm table.tbl th { text-align:left; font-size:11.5px; font-weight:700; letter-spacing:.02em; color:var(--muted); padding:10px 12px; background:var(--surface-2); border-bottom:1px solid var(--border); white-space:nowrap; }
.crm table.tbl th.sortable { cursor:pointer; user-select:none; }
.crm table.tbl th.sortable:hover { color:var(--ink); }
.crm table.tbl td { padding:9px 12px; border-bottom:1px solid var(--border); color:var(--ink-2); vertical-align:middle; }
.crm table.tbl tr.click { cursor:pointer; }
.crm table.tbl tr.click:hover td { background:var(--surface-2); }
.crm table.tbl td.strong { color:var(--ink); font-weight:600; }

/* Kanban */
.crm .kanban { display:flex; gap:12px; overflow-x:auto; padding-bottom:12px; align-items:flex-start; }
.crm .kcol { width:272px; min-width:272px; background:var(--surface-2); border:1px solid var(--border); border-radius:14px; padding:10px; }
.crm .kcol.over { border-color:var(--accent); background:var(--accent-soft); }
.crm .kcard { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:10px 11px; cursor:grab; box-shadow:var(--shadow); }
.crm .kcard:hover { border-color:var(--border-strong); }
.crm .kcard.dragging { opacity:.4; }

/* Overlays */
.crm-overlay { position:fixed; inset:0; z-index:50; background:rgba(8,15,28,.48); display:flex; align-items:center; justify-content:center; padding:16px; }
.crm-overlay.right { justify-content:flex-end; padding:0; align-items:stretch; }
.crm .modal { background:var(--surface); color:var(--ink); border-radius:16px; width:100%; max-width:480px; max-height:calc(100vh - 32px); overflow:auto; box-shadow:var(--shadow-lg); border:1px solid var(--border); }
.crm .modal-h { display:flex; align-items:center; justify-content:space-between; padding:14px 18px; border-bottom:1px solid var(--border); position:sticky; top:0; background:var(--surface); z-index:1; font-weight:700; }
.crm .modal-b { padding:16px 18px 18px; }
.crm .drawer { background:var(--surface); width:100%; max-width:520px; height:100%; overflow-y:auto; box-shadow:var(--shadow-lg); border-left:1px solid var(--border); }
.crm .toast { position:fixed; bottom:16px; right:16px; z-index:60; max-width:380px; background:var(--side); color:#fff; padding:12px 14px; border-radius:12px; font-size:13px; box-shadow:var(--shadow-lg); }
.crm .savestate { position:fixed; bottom:12px; left:256px; font-size:11.5px; color:var(--muted); z-index:20; }
@media (max-width: 820px) { .crm .savestate { left:12px; } }

/* Timeline */
.crm .tl { position:relative; }
.crm .tl-item { display:flex; gap:10px; padding:6px 0; }
.crm .tl-dot { width:26px; height:26px; border-radius:999px; display:flex; align-items:center; justify-content:center; flex-shrink:0; background:var(--surface-3); color:var(--ink-2); }

.crm button:focus-visible, .crm a:focus-visible, .crm input:focus-visible, .crm select:focus-visible, .crm textarea:focus-visible { outline:2px solid var(--accent); outline-offset:2px; }
.crm ::-webkit-scrollbar { height:8px; width:8px; }
.crm ::-webkit-scrollbar-thumb { background:var(--border-strong); border-radius:4px; }
@keyframes crmspin { to { transform:rotate(360deg); } }
.crm .spin { animation:crmspin 1s linear infinite; }
@media (prefers-reduced-motion: reduce) { .crm * { transition:none !important; animation:none !important; } }
`;

// ============================================================ Primitivas ===

function Btn({ variant = "outline", size, icon: Icon, children, className = "", ...props }) {
  return (
    <button className={`btn btn-${variant} ${size === "sm" ? "btn-sm" : ""} ${className}`} {...props}>
      {Icon && <Icon size={size === "sm" ? 13 : 15} />}
      {children}
    </button>
  );
}

function Card({ title, icon: Icon, action, children, className = "", pad = true, style }) {
  return (
    <div className={"card " + className} style={style}>
      {(title || action) && (
        <div className="card-h">
          <div className="card-t">
            {Icon && <Icon size={16} />}
            {title}
          </div>
          {action}
        </div>
      )}
      {pad ? <div className="card-b">{children}</div> : children}
    </div>
  );
}

function LinkBtn({ onClick, children }) {
  return (
    <button onClick={onClick} className="btn btn-ghost btn-sm" style={{ color: "var(--accent-ink)" }}>
      {children} <ChevronRight size={13} />
    </button>
  );
}

function Kpi({ icon: Icon, label, value, sub, tone = "accent", onClick, footer }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag onClick={onClick} className="card" style={{ padding: 16, textAlign: "left", cursor: onClick ? "pointer" : "default", font: "inherit", color: "inherit", display: "block", width: "100%" }}>
      <div className="row between">
        <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-2)" }}>{label}</span>
        {Icon && (
          <span className={`chip t-${tone}`} style={{ padding: 6, borderRadius: 9 }}>
            <Icon size={14} />
          </span>
        )}
      </div>
      <div className="tnum" style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-.02em", marginTop: 6, lineHeight: 1.1 }}>{value}</div>
      {sub && <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{sub}</div>}
      {footer}
    </Tag>
  );
}

function Chip({ tone = "neutral", icon: Icon, children, title }) {
  return (
    <span className={`chip t-${tone}`} title={title}>
      {Icon && <Icon size={11} />}
      {children}
    </span>
  );
}

function Field({ label, children, style }) {
  return (
    <label style={{ display: "block", ...style }}>
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

function ProgressBar({ value, max, tone, height = 8 }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const color = tone === "good" ? "var(--good)" : tone === "warn" ? "var(--warn)" : tone === "bad" ? "var(--bad)" : "var(--accent)";
  return (
    <div className="bar-track" style={{ height }} role="progressbar" aria-valuenow={value} aria-valuemax={max}>
      <div className="bar-fill" style={{ width: pct + "%", background: color }} />
    </div>
  );
}

function Ring({ value, max, size = 156, stroke = 13, color = "#7FE3D5", track = "rgba(255,255,255,0.14)", children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: "stroke-dashoffset .8s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>{children}</div>
    </div>
  );
}

function MilestoneBar({ value, max, marks = [] }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ position: "relative", margin: "8px 0 22px" }}>
      <div className="bar-track" style={{ height: 10 }}>
        <div className="bar-fill" style={{ width: pct + "%", background: "var(--warn)" }} />
      </div>
      {marks.map((m) => (
        <div key={m} style={{ position: "absolute", top: -3, left: `${(m / max) * 100}%`, transform: "translateX(-50%)", textAlign: "center" }}>
          <div style={{ width: 2, height: 16, background: value >= m ? "var(--good)" : "var(--border-strong)", margin: "0 auto" }} />
          <div className="tnum" style={{ fontSize: 10.5, fontWeight: 700, color: value >= m ? "var(--good)" : "var(--muted)" }}>{m}</div>
        </div>
      ))}
    </div>
  );
}

function EmptyNote({ children }) {
  return (
    <div className="muted" style={{ textAlign: "center", fontSize: 13, padding: "18px 8px" }}>
      {children}
    </div>
  );
}

function PageHeader({ title, subtitle, children }) {
  return (
    <div className="row between wrap" style={{ alignItems: "flex-end", gap: 12 }}>
      <div>
        <h1>{title}</h1>
        {subtitle && <div className="sub">{subtitle}</div>}
      </div>
      {children && <div className="row wrap">{children}</div>}
    </div>
  );
}

function SearchBox({ value, onChange, placeholder = "Buscar…", inputRef }) {
  return (
    <div className="search">
      <Search size={14} />
      <input ref={inputRef} className="input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function useEscape(onClose) {
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
}

// Los overlays se renderizan dentro de .crm para heredar el tema.
function Modal({ title, onClose, children, width = 480 }) {
  useEscape(onClose);
  return (
    <div className="crm-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: width }} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-h">
          <span>{title}</span>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar">
            <X size={16} />
          </button>
        </div>
        <div className="modal-b">{children}</div>
      </div>
    </div>
  );
}

function Drawer({ onClose, children }) {
  useEscape(onClose);
  return (
    <div className="crm-overlay right" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  );
}

function TierBadge({ tier }) {
  return tier === "caliente" ? <Chip tone="bad" icon={Flame}>Caliente</Chip> : <Chip tone="info" icon={Snowflake}>Tibio</Chip>;
}

function StageChip({ stage }) {
  const tone = stage === "ganado" ? "good" : stage === "perdido" ? "neutral" : stage === "negociacion" || stage === "propuesta" ? "warn" : stage === "prospeccion" ? "neutral" : "accent";
  return <Chip tone={tone}>{STAGE_BY_KEY[stage]?.label || stage}</Chip>;
}

// Antigüedad sin actividad: cuanto más tiempo, más "frío" el deal.
function AgingChip({ c }) {
  if (!isOpen(c) || c.stage === "prospeccion") return null;
  const d = diasSinActividad(c);
  if (d === null) return null;
  if (d >= 14) return <Chip tone="bad" icon={Timer} title="Días sin actividad">{d} d</Chip>;
  if (d >= 7) return <Chip tone="warn" icon={Timer} title="Días sin actividad">{d} d</Chip>;
  return <Chip tone="neutral" icon={Timer} title="Días sin actividad">{d} d</Chip>;
}

function SequenceBadge({ seq }) {
  if (seq.status === "stopped") return <Chip tone="neutral">Secuencia detenida</Chip>;
  if (seq.status === "completed") return <Chip tone="accent">Secuencia completa</Chip>;
  if (seq.status === "due") return <Chip tone="good" icon={MessageCircle}>Enviar {seq.step.label}</Chip>;
  return <Chip tone="warn">{seq.step.label} desde el {seq.dueDate.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })}</Chip>;
}

function ChartTooltip({ active, payload, label, unit = "" }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 10px", fontSize: 12, boxShadow: "var(--shadow-lg)", color: "var(--ink)" }}>
      <div style={{ fontWeight: 700, marginBottom: 2 }}>{payload[0].payload.tooltipLabel || label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="tnum" style={{ color: "var(--ink-2)" }}>
          {p.name}: <strong style={{ color: "var(--ink)" }}>{fmtN(p.value)}{unit}</strong>
        </div>
      ))}
    </div>
  );
}

// Barra horizontal simple (embudos, rankings) en HTML, con etiqueta y valor visibles.
function HBar({ label, value, max, tone, right, onClick, title }) {
  const Tag = onClick ? "button" : "div";
  const color = tone === "good" ? "var(--good)" : tone === "muted" ? "var(--border-strong)" : tone === "warn" ? "var(--warn)" : "var(--accent)";
  return (
    <Tag onClick={onClick} title={title} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", background: "none", border: 0, padding: 0, font: "inherit", cursor: onClick ? "pointer" : "default", color: "inherit" }}>
      <span style={{ width: 132, flexShrink: 0, fontSize: 12.5, fontWeight: 600, color: "var(--ink-2)", textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      <span style={{ flex: 1, height: 22, background: "var(--surface-3)", borderRadius: 6, overflow: "hidden" }}>
        {value > 0 && <span style={{ display: "block", height: "100%", width: `${Math.max(3, (value / Math.max(1, max)) * 100)}%`, background: color, borderRadius: "0 4px 4px 0", transition: "width .5s ease" }} />}
      </span>
      <span className="tnum" style={{ width: 64, textAlign: "right", fontSize: 12.5, fontWeight: 700 }}>{right ?? fmtN(value)}</span>
    </Tag>
  );
}

async function copiarTexto(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch (e) {
    return false;
  }
}


// =================================================================== App ===

const NAV = [
  { group: "Gestión" },
  { key: "hoy", label: "Mi día", icon: Sunrise },
  { key: "tablero", label: "Indicadores", icon: LayoutDashboard },
  { group: "Empresas (PyME)" },
  { key: "pipeline", label: "Pipeline", icon: ClipboardList },
  { key: "empresas", label: "Cartera", icon: Building2 },
  { key: "agenda", label: "Agenda", icon: CalIcon },
  { key: "campana", label: "Campaña WhatsApp", icon: Megaphone },
  { key: "cotizador", label: "Cotizador", icon: Calculator },
  { group: "Particulares" },
  { key: "b2c", label: "Tablero B2C", icon: Heart },
  { key: "personas", label: "Pacientes", icon: Users },
  { key: "campanab2c", label: "Campaña B2C", icon: MessageCircle },
  { group: "Recursos" },
  { key: "producto", label: "Producto y objeciones", icon: BookOpen },
  { key: "contenido", label: "Contenido", icon: Instagram },
];

export default function App() {
  const [companies, setCompanies] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [contenido, setContenido] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [view, setView] = useState("hoy");
  const [loaded, setLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [showNewCompany, setShowNewCompany] = useState(false);
  const [showNewMeeting, setShowNewMeeting] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(null);
  const [selectedPersonaId, setSelectedPersonaId] = useState(null);
  const [showNewPersona, setShowNewPersona] = useState(false);
  const [showPersonaWhatsApp, setShowPersonaWhatsApp] = useState(null);
  const [logFor, setLogFor] = useState(null); // { companyId, tipo, texto } | null
  const [lostFor, setLostFor] = useState(null); // companyId pendiente de motivo de pérdida
  const [showSettings, setShowSettings] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [cotizarPara, setCotizarPara] = useState(null);
  const [cotVista, setCotVista] = useState(HOSTED ? "oficial" : "rapido"); // oficial | pendientes | rapido // { tipo: "empresa" | "persona", id, label } preseleccionado en el cotizador
  const [saveState, setSaveState] = useState("idle");
  const [confirmState, setConfirmState] = useState(null);
  const [toast, setToast] = useState(null);
  const [gcalStatus, setGcalStatus] = useState("idle");
  const [deletedEventIds, setDeletedEventIds] = useState([]);
  const [waLog, setWaLog] = useState([]);
  const [pendingDeletions, setPendingDeletions] = useState([]);
  const [lastSynced, setLastSynced] = useState(null);
  const personaChunkCountRef = useRef(0);
  const personaChunkContentsRef = useRef([]);
  const companyChunkCountRef = useRef(0);
  const companyChunkContentsRef = useRef([]);
  const toastTimer = useRef(null);
  const companiesRef = useRef([]);
  const personasRef = useRef([]);
  companiesRef.current = companies;
  personasRef.current = personas;

  const askConfirm = useCallback((message, onConfirm) => setConfirmState({ message, onConfirm }), []);
  const showToast = useCallback((message) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  }, []);

  // ---------------------------------------------------------- Carga inicial
  useEffect(() => {
    (async () => {
      try {
        const m = await getStorageSafe("meetings");
        const d = await getStorageSafe("deletedEventIds");
        const ct = await getStorageSafe("contenido");
        const wl = await getStorageSafe("waLog");
        const st = await getStorageSafe("settings");
        const p = await loadChunked("personas", "personas");
        personaChunkCountRef.current = p.chunkCount;
        personaChunkContentsRef.current = p.chunkContents;
        const c = await loadChunked("companies", "companies");
        companyChunkCountRef.current = c.chunkCount;
        companyChunkContentsRef.current = c.chunkContents;

        // Primera vez sin datos -> base inicial. Si había datos y algo falló,
        // NUNCA reseteamos: nos quedamos con lo recuperado y avisamos.
        const primeraVez = c.chunkCount === 0 && c.items.length === 0 && !c.huboBloqueDanado;
        setCompanies(primeraVez ? loadInitialCompanies() : mergeSeedData(c.items));
        if (c.huboBloqueDanado || p.huboBloqueDanado) {
          showToast("⚠️ Una parte de los datos no se pudo leer correctamente y puede faltar. Si tenés un backup exportado, restauralo para no perder nada.");
        }
        setMeetings(
          parseJSONSafe(m, []).map((x) => ({ ...x, syncStatus: x.syncStatus || (x.googleEventId ? "synced" : "local"), syncError: x.syncError ?? null }))
        );
        setDeletedEventIds(parseJSONSafe(d, []));
        setPersonas(normalizePersonas(p.items));
        setContenido(parseJSONSafe(ct, CONTENIDO_SEED));
        setWaLog(parseJSONSafe(wl, []));
        const s = parseJSONSafe(st, {});
        const merged = { ...DEFAULT_SETTINGS, ...s, objetivos: { ...DEFAULT_SETTINGS.objetivos, ...(s.objetivos || {}) } };
        // Campaña nueva (oct. 2026): 20% durante 12 meses. Se aplica una sola vez
        // sobre ajustes guardados con la campaña anterior.
        if ((s.campanaVersion || 1) < 2) Object.assign(merged, { descuento: CAMPANA.descuento, mesesCampana: CAMPANA.meses, campanaVersion: 2 });
        setSettings(merged);
      } catch (e) {
        setLoadFailed(true);
        return; // sin "loaded" el autoguardado queda desactivado
      }
      setLoaded(true);
    })();
  }, []);

  // ------------------------------------------------------------- Guardado
  const saveNow = useCallback(async () => {
    setSaveState("saving");
    const rc = await saveChunked("companies", companies, COMPANY_CHUNK_SIZE, companyChunkCountRef.current, companyChunkContentsRef.current);
    companyChunkCountRef.current = rc.chunkCount;
    companyChunkContentsRef.current = rc.chunkContents;
    const okMeetings = await trySetStorage("meetings", JSON.stringify(meetings));
    const okDeleted = await trySetStorage("deletedEventIds", JSON.stringify(deletedEventIds));
    const rp = await saveChunked("personas", personas, PERSONA_CHUNK_SIZE, personaChunkCountRef.current, personaChunkContentsRef.current);
    personaChunkCountRef.current = rp.chunkCount;
    personaChunkContentsRef.current = rp.chunkContents;
    const okContenido = await trySetStorage("contenido", JSON.stringify(contenido));
    const corte60Dias = Date.now() - 60 * 86400000;
    const okWaLog = await trySetStorage("waLog", JSON.stringify(waLog.filter((ts) => ts > corte60Dias)));
    const okSettings = await trySetStorage("settings", JSON.stringify(settings));
    const ok = rc.ok && okMeetings && okDeleted && rp.ok && okContenido && okWaLog && okSettings;
    setSaveState(ok ? "saved" : "error");
    return ok;
  }, [companies, meetings, deletedEventIds, personas, contenido, waLog, settings]);

  useEffect(() => {
    if (!loaded) return;
    setSaveState("saving");
    const t = setTimeout(() => saveNow(), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companies, meetings, deletedEventIds, personas, contenido, waLog, settings, loaded]);

  // Aviso al cerrar la pestaña si hay cambios que todavía no terminaron de guardarse.
  useEffect(() => {
    if (saveState !== "saving" && saveState !== "error") return;
    const h = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [saveState]);

  // ---------------------------------------------------- Acciones: empresas
  const updateCompany = useCallback((id, patch) => {
    const hoy = hoyISO();
    setCompanies((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const next = { ...c, ...patch };
        if (patch.stage && patch.stage !== c.stage) {
          next.stageDates = { ...(c.stageDates || {}), [patch.stage]: hoy };
          next.historial = [{ fecha: hoy, tipo: "etapa", texto: `Etapa: ${STAGE_BY_KEY[c.stage]?.label || c.stage} → ${STAGE_BY_KEY[patch.stage]?.label}` }, ...(c.historial || [])];
          if (patch.stage === "ganado") next.fechaGanado = hoy;
        }
        return next;
      })
    );
    if (patch.stage === "perdido") setLostFor(id);
  }, []);

  const addHistorial = useCallback((id, texto, tipo = "nota") => {
    setCompanies((prev) => prev.map((c) => (c.id === id ? { ...c, historial: [{ fecha: hoyISO(), tipo, texto }, ...(c.historial || [])] } : c)));
  }, []);

  // Registro de actividad desde el modal: historial + próxima acción + etapa.
  const registrarActividad = useCallback(
    ({ companyId, tipo, texto, programar, proximaAccion, fechaProximaAccion, stage }) => {
      const label = TIPOS_ACT[tipo]?.label || "Nota";
      addHistorial(companyId, texto ? `${label}: ${texto}` : label, tipo);
      const patch = programar ? { proximaAccion: proximaAccion || "", fechaProximaAccion: fechaProximaAccion || "" } : {};
      if (stage) patch.stage = stage;
      if (Object.keys(patch).length) updateCompany(companyId, patch);
      showToast(`✓ ${label} registrada${programar && fechaProximaAccion ? ` · próxima acción ${fmtRelativo(fechaProximaAccion)}` : ""}`);
    },
    [addHistorial, updateCompany, showToast]
  );

  const registrarEnvioWa = useCallback(() => setWaLog((prev) => [...prev, Date.now()]), []);

  const logWhatsAppSent = useCallback(
    (id, stepKey) => {
      const step = WHATSAPP_SEQUENCE.find((s) => s.key === stepKey) || WHATSAPP_SEQUENCE[0];
      setCompanies((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;
          const nuevaEtapa = c.stage === "prospeccion" ? "contacto" : c.stage;
          return {
            ...c,
            stage: nuevaEtapa,
            stageDates: nuevaEtapa !== c.stage ? { ...(c.stageDates || {}), contacto: hoyISO() } : c.stageDates,
            historial: [{ fecha: hoyISO(), texto: `${WA_STEP_PREFIX}${step.label}` }, ...(c.historial || [])],
          };
        })
      );
      registrarEnvioWa();
    },
    [registrarEnvioWa]
  );

  const stopWhatsAppSequence = useCallback((id, stopped) => {
    setCompanies((prev) => prev.map((c) => (c.id === id ? { ...c, waSequenceStopped: stopped } : c)));
  }, []);

  const deleteCompany = useCallback((id) => {
    setCompanies((prev) => prev.filter((c) => c.id !== id));
    setMeetings((prev) => prev.filter((m) => m.companyId !== id));
    setSelectedId(null);
  }, []);

  const guardarCotizacion = useCallback(
    (companyId, cot, moverAPropuesta) => {
      setCompanies((prev) =>
        prev.map((c) => {
          if (c.id !== companyId) return c;
          return {
            ...c,
            capitas: String(cot.capitas),
            planCotizado: cot.plan,
            montoMensual: Math.round(cot.total),
            cotizacion: { ...cot, fecha: hoyISO() },
            cotizaciones: [
              { id: uid(), fecha: hoyISO(), origen: "rapido", tipo: "empresa", capitas: cot.capitas, planes: [{ plan: cot.plan, lista: Math.round(cot.lista), bonificado: Math.round(cot.total), aporte: 0, aPagar: Math.round(cot.total) }] },
              ...(c.cotizaciones || []),
            ],
            historial: [{ fecha: hoyISO(), tipo: "propuesta", texto: `Cotización ${cot.plan}: ${cot.capitas} cápitas · ${money(cot.total)}/mes (desc. ${cot.descuento}%${cot.meses ? ` × ${cot.meses} meses` : ""})` }, ...(c.historial || [])],
          };
        })
      );
      if (moverAPropuesta) {
        const c = companies.find((x) => x.id === companyId);
        if (c && ["prospeccion", "contacto", "reunion"].includes(c.stage)) updateCompany(companyId, { stage: "propuesta" });
      }
      showToast("✓ Cotización guardada en la ficha de la empresa");
    },
    [companies, updateCompany, showToast]
  );

  // Cotización generada en el Cotizador Omint (PDF): se guarda en la ficha.
  // Cotización del Cotizador Omint: se guarda en la ficha (empresa o paciente),
  // queda en el historial como propuesta y deja agendado el seguimiento.
  // El "cid" la identifica: si ya está registrada, no se duplica.
  const registrarCotizacion = useCallback(
    (ref, msg, moverEtapa, silencioso) => {
      const d = msg.datos || {};
      const planes = (d.planes || []).map((p) => ({
        plan: p.plan,
        tag: p.tag || "",
        lista: Math.round(num(p.lista)),
        bonificado: Math.round(num(p.bonificado)),
        aporte: Math.round(num(p.aporte)),
        aPagar: Math.round(num(p.aPagar)),
      }));
      if (!planes.length) return false;
      const hoy = hoyISO();
      const fechaCot = msg.fecha ? isoLocal(new Date(msg.fecha)) : hoy;
      const cid = d.cid || null;
      const ya = (lista) => cid && (lista || []).some((q) => q.cid === cid || q.id === cid);
      const cot = { id: cid || uid(), cid, fecha: fechaCot, origen: "cotizador", tipo: msg.tipo, provincia: d.provincia || "", capitas: d.capitas || null, titulares: d.titulares || null, condicion: d.condicion || "", grupo: d.grupo || null, planes };
      const resumen = planes.map((p) => `${p.plan.replace("Plan ", "")} ${money(p.aPagar)}`).join(" · ");
      const texto = `Cotización ${planes.length > 1 ? "comparativa" : "PDF"}${d.capitas ? ` (${d.capitas} cápitas)` : ""}${d.provincia && d.provincia !== "Mendoza" ? ` · ${d.provincia}` : ""}: ${resumen}`;
      const seguimiento = [addDaysISO(2, parseISO(fechaCot) || new Date()), hoy].sort().pop();
      if (ref.tipo === "empresa") {
        setCompanies((prev) =>
          prev.map((c) => {
            if (c.id !== ref.id || ya(c.cotizaciones)) return c;
            const p0 = planes[0];
            return {
              ...c,
              cotizaciones: [cot, ...(c.cotizaciones || [])],
              ...(planes.length === 1 ? { planCotizado: p0.plan.replace("Plan ", ""), montoMensual: p0.bonificado } : {}),
              ...(d.capitas ? { capitas: String(d.capitas) } : {}),
              ...(!c.proximaAccion && isOpen(c) ? { proximaAccion: "Seguimiento de cotización", fechaProximaAccion: seguimiento } : {}),
              historial: [{ fecha: fechaCot, tipo: "propuesta", texto }, ...(c.historial || [])],
            };
          })
        );
        if (moverEtapa) {
          const c = companiesRef.current.find((x) => x.id === ref.id);
          if (c && ["prospeccion", "contacto", "reunion"].includes(c.stage)) updateCompany(ref.id, { stage: "propuesta" });
        }
      } else {
        setPersonas((prev) =>
          prev.map((p) =>
            p.id !== ref.id || ya(p.cotizaciones)
              ? p
              : {
                  ...p,
                  cotizaciones: [cot, ...(p.cotizaciones || [])],
                  contactado: true,
                  status: ["nuevo", "contactado"].includes(p.status) ? "interesado" : p.status,
                  seguimiento: p.seguimiento && p.seguimiento > hoy ? p.seguimiento : seguimiento,
                  historial: [{ fecha: fechaCot, tipo: "propuesta", texto }, ...(p.historial || [])],
                }
          )
        );
      }
      if (!silencioso) showToast(`✓ Cotización guardada en ${ref.label}`);
      return true;
    },
    [updateCompany, showToast]
  );

  // ---------------------------------- Sincronización con el Cotizador Omint
  // Trae las cotizaciones que hiciste con tu usuario en el cotizador (también
  // las hechas fuera del CRM): las que coinciden con una sola ficha se guardan
  // solas; el resto queda "por vincular".
  const [cotSync, setCotSync] = useState({ estado: HOSTED ? "inicial" : "no-disponible", pendientes: [], ultima: null, error: "" });
  const registrarRef = useRef(registrarCotizacion);
  registrarRef.current = registrarCotizacion;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const sincronizandoRef = useRef(false);

  // Dónde está instalado el cotizador: se prueba la dirección de Ajustes y las
  // ubicaciones habituales (carpeta hermana, raíz del sitio, subdominio).
  const [cotBase, setCotBase] = useState({ estado: HOSTED ? "buscando" : "no-disponible", url: null, probados: [] });
  const cotBaseRef = useRef(cotBase);
  cotBaseRef.current = cotBase;
  const detectarCotizador = useCallback(async (urlManual) => {
    setCotBase((s) => ({ ...s, estado: "buscando" }));
    const probados = [];
    for (const c of candidatosCotizador(urlManual || settingsRef.current.cotizadorUrl)) {
      try {
        const r = await fetch(new URL("api.php?action=estado", c).toString(), { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}", cache: "no-store" });
        const d = await r.json().catch(() => null);
        if (d && d.ok && "instalado" in d) {
          setCotBase({ estado: "ok", url: c, probados });
          cotBaseRef.current = { estado: "ok", url: c, probados };
          if (c !== settingsRef.current.cotizadorUrl) setSettings((s) => ({ ...s, cotizadorUrl: c }));
          return c;
        }
        probados.push({ url: c, resultado: r.status === 404 ? "no existe (404)" : r.status === 401 ? "pide usuario (es el cotizador anterior)" : `respondió algo que no es el cotizador (HTTP ${r.status})` });
      } catch (e) {
        probados.push({ url: c, resultado: "no responde o bloquea la conexión" });
      }
    }
    setCotBase({ estado: "no", url: null, probados });
    cotBaseRef.current = { estado: "no", url: null, probados };
    return null;
  }, []);
  const urlCotizador = (accion) => new URL(`api.php?action=${accion}`, cotBaseRef.current.url || new URL(settingsRef.current.cotizadorUrl || "../cotizador/", window.location.href)).toString();
  const tokenCot = () => {
    try {
      return localStorage.getItem("cot_omint_token") || "";
    } catch (e) {
      return "";
    }
  };

  const sincronizarCotizador = useCallback(
    async (manual) => {
      if (!HOSTED || sincronizandoRef.current) return;
      if (!cotBaseRef.current.url && !(await detectarCotizador())) {
        setCotSync((s) => ({ ...s, estado: "no-encontrado" }));
        return;
      }
      const token = tokenCot();
      if (!token) {
        setCotSync((s) => ({ ...s, estado: "desconectado" }));
        return;
      }
      sincronizandoRef.current = true;
      setCotSync((s) => ({ ...s, estado: "sincronizando" }));
      try {
        const r = await fetch(urlCotizador("cotizaciones"), { method: "POST", headers: { "Content-Type": "application/json", "X-Cot-Token": token }, body: JSON.stringify({ meses: 6 }), cache: "no-store" });
        if (r.status === 401) {
          setCotSync((s) => ({ ...s, estado: "desconectado" }));
          return;
        }
        const data = await r.json();
        if (!data.ok) throw new Error(data.error || "Error del cotizador");
        // Ya registradas: por id, o por fecha + planes + montos (las anteriores a este cambio no tenían id compartido).
        const firma = (fecha, planes) => `${fecha}|${planes.map((p) => `${String(p.plan || p.nombre).replace("Plan ", "")}:${Math.round(p.aPagar)}`).join(",")}`;
        const conocidas = new Set(settingsRef.current.cotIgnoradas || []);
        const firmas = new Set();
        const anotar = (q) => {
          conocidas.add(q.cid || q.id);
          firmas.add(firma(q.fecha, q.planes || []));
        };
        companiesRef.current.forEach((c) => (c.cotizaciones || []).forEach(anotar));
        personasRef.current.forEach((p) => (p.cotizaciones || []).forEach(anotar));
        const nuevas = (data.cotizaciones || []).filter((q) => q.id && (q.planes || []).length && !conocidas.has(q.id) && !firmas.has(firma(isoLocal(new Date(q.fecha)), q.planes)));
        const pendientes = [];
        let auto = 0;
        // De la más vieja a la más nueva, para que el historial quede en orden.
        [...nuevas].reverse().forEach((q) => {
          const m = coincidenciasCotizacion(q, companiesRef.current, personasRef.current);
          if (m.length === 1) {
            registrarRef.current(m[0], cotizacionAMensaje(q), true, true);
            auto++;
          } else pendientes.push({ ...q, sugeridas: m });
        });
        pendientes.reverse();
        setCotSync({ estado: "ok", pendientes, ultima: new Date(), error: "" });
        if (auto) showToast(`✓ ${auto} cotización${auto > 1 ? "es" : ""} del cotizador ${auto > 1 ? "quedaron" : "quedó"} en sus fichas`);
        else if (manual) showToast(pendientes.length ? `${pendientes.length} cotización${pendientes.length > 1 ? "es" : ""} por vincular` : "✓ Todo al día con el cotizador");
      } catch (e) {
        setCotSync((s) => ({ ...s, estado: "error", error: e.message || "No se pudo conectar con el cotizador" }));
      } finally {
        sincronizandoRef.current = false;
      }
    },
    [showToast]
  );

  const conectarCotizador = useCallback(
    async (usuario, clave) => {
      const r = await fetch(urlCotizador("login"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ usuario, clave }) });
      const d = await r.json().catch(() => null);
      if (!d || !d.ok) throw new Error((d && d.error) || "No se pudo conectar con el cotizador");
      try {
        localStorage.setItem("cot_omint_token", d.token);
      } catch (e) {
        // sin localStorage no se puede recordar la conexión
      }
      await sincronizarCotizador(true);
    },
    [sincronizarCotizador]
  );

  const quitarPendiente = (id) => setCotSync((s) => ({ ...s, pendientes: s.pendientes.filter((q) => q.id !== id) }));

  const vincularCotizacion = useCallback((q, ref) => {
    registrarRef.current(ref, cotizacionAMensaje(q), true);
    quitarPendiente(q.id);
  }, []);

  const crearDesdeCotizacion = useCallback((q) => {
    const id = uid();
    const hoy = hoyISO();
    if (q.tipo === "empresa") {
      const empresa = q.cliente || "Empresa sin nombre";
      setCompanies((prev) => [...prev, { id, empresa, cuit: q.cuit || "", telefono: q.telefono || "", contacto: "", mail: "", tier: "caliente", nota: "Alta desde el Cotizador Omint", stage: "contacto", stageDates: { contacto: hoy }, capitas: "", proximaAccion: "", fechaProximaAccion: "", historial: [], fechaAlta: hoy }]);
      registrarRef.current({ tipo: "empresa", id, label: empresa }, cotizacionAMensaje(q), true);
    } else {
      const nombre = q.cliente || "Paciente sin nombre";
      setPersonas((prev) => [{ id, nombre, telefono: q.telefono || "", mail: "", obraSocial: "", fechaNacimiento: "", status: "interesado", nota: "Alta desde el Cotizador Omint", historial: [] }, ...prev]);
      registrarRef.current({ tipo: "persona", id, label: nombre }, cotizacionAMensaje(q), true);
    }
    quitarPendiente(q.id);
  }, []);

  const ignorarCotizacion = useCallback((q) => {
    setSettings((s) => ({ ...s, cotIgnoradas: [q.id, ...(s.cotIgnoradas || [])].slice(0, 500) }));
    quitarPendiente(q.id);
  }, []);

  // ----------------------------------------------------- Acciones: personas
  const addPersona = useCallback((data) => setPersonas((prev) => [{ id: uid(), status: "nuevo", nota: "", historial: [], ...data }, ...prev]), []);
  const updatePersona = useCallback((id, patch) => setPersonas((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p))), []);
  const deletePersona = useCallback((id) => setPersonas((prev) => prev.filter((p) => p.id !== id)), []);
  const clearPersonas = useCallback(() => setPersonas([]), []);
  const logPersonaWhatsAppSent = useCallback(
    (id) => {
      setPersonas((prev) =>
        prev.map((p) =>
          p.id !== id
            ? p
            : { ...p, status: p.status === "nuevo" ? "contactado" : p.status, contactado: true, historial: [{ fecha: hoyISO(), texto: "Contactado por WhatsApp" }, ...(p.historial || [])] }
        )
      );
      registrarEnvioWa();
    },
    [registrarEnvioWa]
  );
  const importPersonas = useCallback((nuevas) => {
    setPersonas((prev) => [...prev, ...nuevas.map((p) => ({ id: uid(), status: "nuevo", nota: "", historial: [], ...p }))]);
  }, []);

  // ---------------------------------------------------- Acciones: contenido
  const addContenido = useCallback((data) => setContenido((prev) => [{ id: uid(), status: "idea", ...data }, ...prev]), []);
  const updateContenido = useCallback((id, patch) => setContenido((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c))), []);
  const deleteContenido = useCallback((id) => setContenido((prev) => prev.filter((c) => c.id !== id)), []);

  // ------------------------------------------------------ Reuniones / GCal
  const createMeeting = useCallback(async (data, syncToGoogle) => {
    const localMeeting = { id: uid(), googleEventId: null, syncStatus: syncToGoogle && !HOSTED ? "syncing" : "local", syncError: null, ...data };
    if (syncToGoogle && HOSTED) window.open(gcalTemplateLink(localMeeting), "_blank");
    setMeetings((prev) => [...prev, localMeeting]);
    if (data.companyId) {
      setCompanies((prev) =>
        prev.map((c) => {
          if (c.id !== data.companyId) return c;
          const avanza = ["prospeccion", "contacto"].includes(c.stage);
          return {
            ...c,
            stage: avanza ? "reunion" : c.stage,
            stageDates: avanza ? { ...(c.stageDates || {}), reunion: hoyISO() } : c.stageDates,
            historial: [{ fecha: hoyISO(), tipo: "etapa", texto: `Reunión agendada para el ${fmtFecha(data.fecha)} ${data.hora}` }, ...(c.historial || [])],
          };
        })
      );
    }
    if (syncToGoogle && !HOSTED) {
      const { eventId, error } = await pushMeetingToGoogle(localMeeting);
      setMeetings((prev) => prev.map((m) => (m.id === localMeeting.id ? { ...m, googleEventId: eventId, syncStatus: eventId ? "synced" : "error", syncError: error } : m)));
    }
  }, []);

  const retryMeetingSync = useCallback(async (meeting) => {
    setMeetings((prev) => prev.map((m) => (m.id === meeting.id ? { ...m, syncStatus: "syncing", syncError: null } : m)));
    const { eventId, error } = await pushMeetingToGoogle(meeting);
    setMeetings((prev) => prev.map((m) => (m.id === meeting.id ? { ...m, googleEventId: eventId, syncStatus: eventId ? "synced" : "error", syncError: error } : m)));
  }, []);

  const removeMeeting = useCallback(async (meeting) => {
    setMeetings((prev) => prev.filter((m) => m.id !== meeting.id));
    if (meeting.googleEventId) {
      setDeletedEventIds((prev) => (prev.includes(meeting.googleEventId) ? prev : [...prev, meeting.googleEventId]));
      const { ok, error } = await deleteEventFromGoogle(meeting.googleEventId);
      if (!ok) setPendingDeletions((prev) => [...prev, { id: meeting.id, googleEventId: meeting.googleEventId, empresa: meeting.empresa, error }]);
    }
  }, []);

  const retryDeletion = useCallback(async (pending) => {
    const { ok, error } = await deleteEventFromGoogle(pending.googleEventId);
    setPendingDeletions((prev) => (ok ? prev.filter((p) => p.id !== pending.id) : prev.map((p) => (p.id === pending.id ? { ...p, error } : p))));
  }, []);

  const syncFromGoogle = useCallback(async () => {
    setGcalStatus("syncing");
    try {
      const { events, rangeStart, rangeEnd } = await pullEventsFromGoogle();
      const remoteIds = new Set(events.map((ev) => ev.id));
      setMeetings((prevMeetings) => {
        const existingIds = new Set(prevMeetings.map((m) => m.googleEventId).filter(Boolean));
        const newOnes = events
          .filter((ev) => !existingIds.has(ev.id) && !deletedEventIds.includes(ev.id))
          .map((ev) => {
            const match = companies.find((c) => ev.summary && ev.summary.toLowerCase().includes(c.empresa.toLowerCase()));
            const [fecha, hora] = (ev.start || "").split("T");
            return {
              id: uid(),
              companyId: match ? match.id : null,
              empresa: match ? match.empresa : ev.summary || "Evento de Google Calendar",
              fecha: fecha || hoyISO(),
              hora: hora ? hora.slice(0, 5) : "09:00",
              notas: match ? ev.summary : "Importado de Google Calendar",
              googleEventId: ev.id,
              syncStatus: "synced",
              syncError: null,
            };
          });
        // Vinculada a Google, dentro del rango consultado y ya no existe allá -> se borró.
        const stillPresent = prevMeetings.filter((m) => {
          if (!m.googleEventId || remoteIds.has(m.googleEventId)) return true;
          const dt = localDateFromFechaHora(m.fecha, m.hora);
          return !(dt >= rangeStart && dt <= rangeEnd);
        });
        return [...stillPresent, ...newOnes];
      });
      setGcalStatus("done");
      setLastSynced(new Date());
    } catch (e) {
      setGcalStatus("error");
    }
    setTimeout(() => setGcalStatus("idle"), 3000);
  }, [companies, deletedEventIds]);

  const syncRef = useRef(syncFromGoogle);
  useEffect(() => {
    syncRef.current = syncFromGoogle;
  }, [syncFromGoogle]);
  useEffect(() => {
    if (!loaded || HOSTED) return;
    const i = setInterval(() => syncRef.current(), 30 * 60 * 1000);
    return () => clearInterval(i);
  }, [loaded]);

  // --------------------------------------------------------- Backup
  const exportBackup = useCallback(() => {
    const payload = { exportedAt: new Date().toISOString(), version: 2, companies, meetings, deletedEventIds, personas, contenido, waLog, settings };
    descargarArchivo(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }), `crm-omint-backup-${hoyISO()}.json`);
  }, [companies, meetings, deletedEventIds, personas, contenido, waLog, settings]);

  const importBackup = useCallback(
    (file) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const payload = JSON.parse(reader.result);
          if (!Array.isArray(payload.companies)) throw new Error("El archivo no tiene el formato esperado (falta 'companies').");
          setCompanies(payload.companies.map((c) => ({ historial: [], ...c })));
          setMeetings(Array.isArray(payload.meetings) ? payload.meetings : []);
          setDeletedEventIds(Array.isArray(payload.deletedEventIds) ? payload.deletedEventIds : []);
          setPersonas(normalizePersonas(Array.isArray(payload.personas) ? payload.personas : []));
          setContenido(Array.isArray(payload.contenido) ? payload.contenido : []);
          setWaLog(Array.isArray(payload.waLog) ? payload.waLog : []);
          if (payload.settings) setSettings({ ...DEFAULT_SETTINGS, ...payload.settings });
          showToast(`Backup importado: ${payload.companies.length} empresas, ${(payload.meetings || []).length} reuniones, ${(payload.personas || []).length} personas.`);
        } catch (e) {
          showToast("No se pudo importar el backup: " + e.message);
        }
      };
      reader.readAsText(file);
    },
    [showToast]
  );

  useEffect(() => {
    if (!loaded || !HOSTED) return;
    sincronizarCotizador();
    const i = setInterval(() => sincronizarCotizador(), 5 * 60 * 1000);
    const f = () => document.visibilityState === "visible" && sincronizarCotizador();
    // Si iniciás sesión en el cotizador en otra pestaña, el CRM se entera al instante.
    const st = (e) => e.key === "cot_omint_token" && e.newValue && sincronizarCotizador();
    document.addEventListener("visibilitychange", f);
    window.addEventListener("storage", st);
    return () => {
      clearInterval(i);
      document.removeEventListener("visibilitychange", f);
      window.removeEventListener("storage", st);
    };
  }, [loaded, sincronizarCotizador]);

  // ------------------------------------------------------- Atajos de teclado
  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowPalette((v) => !v);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  // ------------------------------------------------------- Derivados
  const actividad = useMemo(() => construirActividad(companies, personas, meetings, waLog), [companies, personas, meetings, waLog]);

  const metrics = useMemo(() => calcularMetricas(companies, settings), [companies, settings]);

  const agenda = useMemo(() => {
    const today = hoyISO();
    const upcoming = meetings.filter((m) => m.fecha >= today).sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
    const past = meetings.filter((m) => m.fecha < today).sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora));
    return { upcoming, past, hoy: upcoming.filter((m) => m.fecha === today) };
  }, [meetings]);

  const pendientes = useMemo(() => calcularPendientes(companies, personas, meetings), [companies, personas, meetings]);

  const vars = useMemo(() => ({ asesor: settings.asesor, descuento: settings.descuento, meses: settings.mesesCampana }), [settings.asesor, settings.descuento, settings.mesesCampana]);
  const theme = settings.theme === "dark" ? "dark" : "light";
  const go = useCallback((v) => {
    setView(v);
    try {
      window.scrollTo({ top: 0 });
    } catch (e) {
      // no crítico
    }
  }, []);
  const abrirCotizador = useCallback((ref) => {
    setCotizarPara(ref || null);
    setCotVista(HOSTED ? "oficial" : "rapido");
    setSelectedPersonaId(null);
    setSelectedId(null);
    setView("cotizador");
  }, []);

  const selected = companies.find((c) => c.id === selectedId);
  const badges = {
    cotizador: cotSync.pendientes.length,
    hoy: pendientes.totalUrgente,
    campana: pendientes.waDue.length,
    agenda: agenda.hoy.length,
  };

  if (loadFailed) {
    return (
      <div className="crm" data-theme="light" style={{ alignItems: "center", justifyContent: "center" }}>
        <style>{APP_CSS}</style>
        <div className="card" style={{ maxWidth: 420, padding: 24, textAlign: "center", margin: "auto" }}>
          <AlertTriangle size={28} color="var(--warn)" />
          <div style={{ fontWeight: 700, fontSize: 17, marginTop: 8 }}>No se pudieron cargar tus datos</div>
          <div className="muted" style={{ marginTop: 6 }}>No se modificó ni se guardó nada — tu información está a salvo. Recargá la página para volver a intentarlo.</div>
          <Btn variant="primary" style={{ marginTop: 14 }} onClick={() => window.location.reload()}>Recargar</Btn>
        </div>
      </div>
    );
  }
  if (!loaded) {
    return (
      <div className="crm" data-theme={theme} style={{ alignItems: "center", justifyContent: "center" }}>
        <style>{APP_CSS}</style>
        <div style={{ margin: "auto", fontWeight: 600 }} className="muted">
          <RefreshCw size={16} className="spin" style={{ verticalAlign: -3, marginRight: 8 }} />
          Cargando tu CRM…
        </div>
      </div>
    );
  }

  const waHoy = calcularWaStats(waLog).enviadosHoy;
  const common = { companies, setSelectedId, setShowWhatsApp, go };

  return (
    <ThemeCtx.Provider value={theme}>
      <div className="crm" data-theme={theme}>
        <style>{APP_CSS}</style>

        <aside className="side">
          <div className="row" style={{ gap: 10, padding: "2px 6px 6px" }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: "linear-gradient(135deg,#14B8A6,#0E7490)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Stethoscope size={19} color="white" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 15, letterSpacing: "-.01em" }}>CRM Omint</div>
              <div style={{ color: "#7F93B2", fontSize: 11.5 }}>Medicina prepaga · Mendoza</div>
            </div>
          </div>

          <button className="nav-btn" onClick={() => setShowPalette(true)} style={{ background: "var(--side-2)", color: "#8FA3C2" }}>
            <Search size={15} /> Buscar o crear…
            <span className="kbd" style={{ marginLeft: "auto", background: "transparent", borderColor: "#2A3F60", color: "#7F93B2" }}>Ctrl K</span>
          </button>

          <nav aria-label="Secciones">
            {NAV.map((n, i) =>
              n.group ? (
                <div key={i} className="nav-group">{n.group}</div>
              ) : (
                <button key={n.key} className={"nav-btn" + (view === n.key ? " on" : "")} onClick={() => go(n.key)} aria-current={view === n.key ? "page" : undefined}>
                  <n.icon size={16} />
                  {n.label}
                  {badges[n.key] > 0 && <span className={"nav-badge" + (n.key === "hoy" ? " hot" : "")}>{badges[n.key]}</span>}
                </button>
              )
            )}
          </nav>

          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ background: "var(--side-2)", borderRadius: 12, padding: "10px 12px", color: "var(--side-ink)", fontSize: 12 }}>
              <div className="row between">
                <span style={{ fontWeight: 600 }}>WhatsApp hoy</span>
                <span className="tnum" style={{ fontWeight: 800, color: "#fff" }}>{waHoy} / {WA_DAILY_HARD_LIMIT}</span>
              </div>
              <div style={{ height: 5, borderRadius: 9, background: "rgba(255,255,255,.12)", marginTop: 7, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(100, (waHoy / WA_DAILY_HARD_LIMIT) * 100)}%`, background: waHoy >= WA_DAILY_HARD_LIMIT ? "#F07068" : "#7FE3D5" }} />
              </div>
            </div>
            <div className="row" style={{ gap: 6 }}>
              <button className="nav-btn" style={{ justifyContent: "center", background: "var(--side-2)", flex: 1 }} onClick={exportBackup} title="Descargar backup completo (.json)">
                <Download size={14} /> Backup
              </button>
              <label className="nav-btn" style={{ justifyContent: "center", background: "var(--side-2)", flex: 1, cursor: "pointer" }} title="Restaurar un backup (reemplaza los datos actuales)">
                <Upload size={14} /> Restaurar
                <input
                  type="file"
                  accept="application/json"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) askConfirm("Esto va a reemplazar todas las empresas, personas y reuniones actuales por las del backup. ¿Confirmás?", () => importBackup(file));
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            <div className="row" style={{ gap: 6 }}>
              <button className="nav-btn" style={{ justifyContent: "center", background: "var(--side-2)", flex: 1 }} onClick={() => setShowSettings(true)}>
                <Settings size={14} /> Ajustes
              </button>
              {HOSTED && window.__CRM_LOGOUT__ && (
                <button
                  className="nav-btn"
                  style={{ justifyContent: "center", background: "var(--side-2)", width: 44, flex: "none" }}
                  title="Cerrar sesión"
                  aria-label="Cerrar sesión"
                  onClick={() => askConfirm("¿Cerrar sesión en este dispositivo?", () => window.__CRM_LOGOUT__())}
                >
                  <LogOut size={15} />
                </button>
              )}
              <button
                className="nav-btn"
                style={{ justifyContent: "center", background: "var(--side-2)", width: 44, flex: "none" }}
                onClick={() => setSettings((s) => ({ ...s, theme: s.theme === "dark" ? "light" : "dark" }))}
                title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
                aria-label="Cambiar tema"
              >
                {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
              </button>
            </div>
          </div>
        </aside>

        <main className="main">
          <div className="topbar">
            <button className="nav-btn" style={{ width: "auto" }} onClick={() => setShowPalette(true)} aria-label="Buscar">
              <Search size={16} />
            </button>
            {NAV.filter((n) => !n.group).map((n) => (
              <button key={n.key} className={"nav-btn" + (view === n.key ? " on" : "")} style={{ width: "auto" }} onClick={() => go(n.key)}>
                <n.icon size={15} /> {n.label}
              </button>
            ))}
            <button className="nav-btn" style={{ width: "auto" }} onClick={() => setShowSettings(true)} aria-label="Ajustes">
              <Settings size={15} />
            </button>
          </div>

          <div className="inner">
            {view === "hoy" && (
              <MiDia
                {...common}
                settings={settings}
                metrics={metrics}
                pendientes={pendientes}
                agenda={agenda}
                actividad={actividad}
                personas={personas}
                setLogFor={setLogFor}
                setShowNewMeeting={setShowNewMeeting}
                setShowNewCompany={setShowNewCompany}
                setSelectedPersonaId={setSelectedPersonaId}
                setShowPersonaWhatsApp={setShowPersonaWhatsApp}
                cotPendientes={cotSync.pendientes}
                abrirPorVincular={() => { setCotVista("pendientes"); go("cotizador"); }}
              />
            )}
            {view === "tablero" && <Tablero {...common} settings={settings} metrics={metrics} actividad={actividad} meetings={meetings} />}
            {view === "pipeline" && <Pipeline {...common} updateCompany={updateCompany} setShowNewCompany={setShowNewCompany} setLogFor={setLogFor} />}
            {view === "empresas" && <Cartera {...common} setShowNewCompany={setShowNewCompany} showToast={showToast} />}
            {view === "agenda" && (
              <Agenda
                {...common}
                agenda={agenda}
                setShowNewMeeting={setShowNewMeeting}
                removeMeeting={removeMeeting}
                syncFromGoogle={syncFromGoogle}
                gcalStatus={gcalStatus}
                lastSynced={lastSynced}
                retryMeetingSync={retryMeetingSync}
                pendingDeletions={pendingDeletions}
                retryDeletion={retryDeletion}
                setLogFor={setLogFor}
              />
            )}
            {view === "campana" && <Campaign {...common} waLog={waLog} />}
            {view === "cotizador" && (
              <CotizadorView
                companies={companies}
                personas={personas}
                settings={settings}
                preset={cotizarPara}
                guardarCotizacion={guardarCotizacion}
                registrarCotizacion={registrarCotizacion}
                showToast={showToast}
                vars={vars}
                vista={cotVista}
                setVista={setCotVista}
                cotSync={cotSync}
                sincronizarCotizador={sincronizarCotizador}
                conectarCotizador={conectarCotizador}
                vincularCotizacion={vincularCotizacion}
                crearDesdeCotizacion={crearDesdeCotizacion}
                ignorarCotizacion={ignorarCotizacion}
                setSelectedId={setSelectedId}
                setSelectedPersonaId={setSelectedPersonaId}
                cotBase={cotBase}
                detectarCotizador={detectarCotizador}
              />
            )}
            {view === "b2c" && <DashboardB2C personas={personas} waLog={waLog} go={go} setShowNewPersona={setShowNewPersona} />}
            {view === "personas" && (
              <PersonasList
                personas={personas}
                setSelectedPersonaId={setSelectedPersonaId}
                setShowNewPersona={setShowNewPersona}
                setShowPersonaWhatsApp={setShowPersonaWhatsApp}
                importPersonas={importPersonas}
                clearPersonas={clearPersonas}
                askConfirm={askConfirm}
                showToast={showToast}
                updatePersona={updatePersona}
              />
            )}
            {view === "campanab2c" && <CampanaB2C personas={personas} setSelectedPersonaId={setSelectedPersonaId} setShowPersonaWhatsApp={setShowPersonaWhatsApp} updatePersona={updatePersona} />}
            {view === "producto" && <ProductoReferencia go={go} />}
            {view === "contenido" && <ContenidoPlanner contenido={contenido} addContenido={addContenido} updateContenido={updateContenido} deleteContenido={deleteContenido} askConfirm={askConfirm} />}
          </div>
        </main>

        {selectedPersonaId && personas.find((p) => p.id === selectedPersonaId) && (
          <PersonaDetail
            persona={personas.find((p) => p.id === selectedPersonaId)}
            onClose={() => setSelectedPersonaId(null)}
            updatePersona={updatePersona}
            deletePersona={deletePersona}
            setShowPersonaWhatsApp={setShowPersonaWhatsApp}
            askConfirm={askConfirm}
            abrirCotizador={abrirCotizador}
          />
        )}
        {showNewPersona && <NewPersonaModal onClose={() => setShowNewPersona(false)} onSave={(data) => { addPersona(data); setShowNewPersona(false); }} />}
        {showPersonaWhatsApp && personas.find((p) => p.id === showPersonaWhatsApp) && (
          <PersonaWhatsAppModal
            persona={personas.find((p) => p.id === showPersonaWhatsApp)}
            onClose={() => setShowPersonaWhatsApp(null)}
            onSent={() => logPersonaWhatsAppSent(showPersonaWhatsApp)}
            waLog={waLog}
            vars={vars}
          />
        )}

        {selected && (
          <CompanyDetail
            company={selected}
            onClose={() => setSelectedId(null)}
            updateCompany={updateCompany}
            addHistorial={addHistorial}
            deleteCompany={deleteCompany}
            meetings={meetings.filter((m) => m.companyId === selected.id)}
            setShowNewMeeting={setShowNewMeeting}
            removeMeeting={removeMeeting}
            retryMeetingSync={retryMeetingSync}
            setShowWhatsApp={setShowWhatsApp}
            stopWhatsAppSequence={stopWhatsAppSequence}
            askConfirm={askConfirm}
            setLogFor={setLogFor}
            abrirCotizador={abrirCotizador}
          />
        )}
        {showWhatsApp && companies.find((c) => c.id === showWhatsApp) && (
          <WhatsAppModal
            company={companies.find((c) => c.id === showWhatsApp)}
            onClose={() => setShowWhatsApp(null)}
            onSent={(stepKey) => logWhatsAppSent(showWhatsApp, stepKey)}
            onStopSequence={(stopped) => stopWhatsAppSequence(showWhatsApp, stopped)}
            waLog={waLog}
            vars={vars}
          />
        )}
        {showNewCompany && (
          <NewCompanyModal
            onClose={() => setShowNewCompany(false)}
            onSave={(data) => {
              const id = uid();
              setCompanies((prev) => [...prev, { id, stage: "prospeccion", capitas: "", proximaAccion: "", fechaProximaAccion: "", historial: [], fechaAlta: hoyISO(), ...data }]);
              setShowNewCompany(false);
              setSelectedId(id);
              showToast(`✓ ${data.empresa} agregada a tu cartera`);
            }}
          />
        )}
        {showNewMeeting && (
          <NewMeetingModal
            companies={companies}
            preselectedId={typeof showNewMeeting === "string" ? showNewMeeting : null}
            onClose={() => setShowNewMeeting(false)}
            onSave={(data, syncToGoogle) => {
              createMeeting(data, syncToGoogle);
              setShowNewMeeting(false);
              showToast(`✓ Reunión agendada: ${data.empresa} · ${fmtFecha(data.fecha)} ${data.hora}`);
            }}
          />
        )}
        {logFor && <LogActividadModal preset={logFor} companies={companies} onClose={() => setLogFor(null)} onSave={(d) => { registrarActividad(d); setLogFor(null); }} />}
        {lostFor && companies.find((c) => c.id === lostFor) && (
          <MotivoPerdidaModal
            company={companies.find((c) => c.id === lostFor)}
            onClose={() => setLostFor(null)}
            onSave={(motivo, detalle) => {
              updateCompany(lostFor, { motivoPerdida: motivo, proximaAccion: "", fechaProximaAccion: "" });
              addHistorial(lostFor, `Perdida — ${motivo}${detalle ? `: ${detalle}` : ""}`, "nota");
              setLostFor(null);
            }}
          />
        )}
        {showSettings && <SettingsModal settings={settings} onClose={() => setShowSettings(false)} onSave={(s) => { setSettings(s); setShowSettings(false); showToast("✓ Ajustes guardados"); }} />}
        {showPalette && (
          <CommandPalette
            companies={companies}
            personas={personas}
            onClose={() => setShowPalette(false)}
            onPickCompany={(id) => { setSelectedId(id); setShowPalette(false); }}
            onPickPersona={(id) => { setSelectedPersonaId(id); setShowPalette(false); }}
            actions={[
              { label: "Nueva empresa", icon: Plus, run: () => setShowNewCompany(true) },
              { label: "Agendar reunión", icon: CalIcon, run: () => setShowNewMeeting(true) },
              { label: "Registrar actividad", icon: Activity, run: () => setLogFor({}) },
              { label: "Nuevo paciente (B2C)", icon: Users, run: () => setShowNewPersona(true) },
              { label: "Abrir cotizador", icon: Calculator, run: () => abrirCotizador(null) },
              ...NAV.filter((n) => !n.group).map((n) => ({ label: `Ir a ${n.label}`, icon: n.icon, run: () => go(n.key) })),
            ]}
          />
        )}

        <div className="savestate">
          {saveState === "saving" && "Guardando…"}
          {saveState === "saved" && "✓ Guardado"}
          {saveState === "error" && (
            <span style={{ color: "var(--bad)", background: "var(--bad-soft)", padding: "4px 8px", borderRadius: 8 }}>
              ⚠ No se pudo guardar ·{" "}
              <button onClick={() => saveNow()} style={{ textDecoration: "underline", background: "none", border: 0, color: "inherit", cursor: "pointer", font: "inherit" }}>Reintentar</button>
            </span>
          )}
        </div>

        {confirmState && (
          <Modal title="Confirmar" onClose={() => setConfirmState(null)}>
            <div className="stack">
              <div>{confirmState.message}</div>
              <div className="row" style={{ justifyContent: "flex-end" }}>
                <Btn onClick={() => setConfirmState(null)}>Cancelar</Btn>
                <Btn variant="danger" onClick={() => { confirmState.onConfirm(); setConfirmState(null); }}>Confirmar</Btn>
              </div>
            </div>
          </Modal>
        )}
        {toast && <div className="toast" role="status">{toast}</div>}
      </div>
    </ThemeCtx.Provider>
  );
}

// ======================================================== Métricas ===

function calcularMetricas(companies, settings) {
  const now = new Date();
  const hoy = hoyISO();
  const mesActual = hoy.slice(0, 7);
  const { start: qStart, end: qEnd, label: qLabel } = quarterRange(now);
  const byStage = {};
  const capByStage = {};
  STAGES.forEach((s) => {
    byStage[s.key] = 0;
    capByStage[s.key] = 0;
  });
  let capitasGanadas = 0, capitasPipeline = 0, forecast = 0, calientes = 0, mrrGanado = 0, mrrPipeline = 0;
  const ganadas = [];
  const perdidas = [];
  const motivos = {};
  companies.forEach((c) => {
    byStage[c.stage] = (byStage[c.stage] || 0) + 1;
    const cap = num(c.capitas);
    capByStage[c.stage] = (capByStage[c.stage] || 0) + cap;
    if (c.tier === "caliente") calientes++;
    if (c.stage === "ganado") {
      capitasGanadas += cap;
      mrrGanado += num(c.montoMensual);
      ganadas.push(c);
    } else if (c.stage === "perdido") {
      perdidas.push(c);
      const m = c.motivoPerdida || "Sin motivo registrado";
      motivos[m] = (motivos[m] || 0) + 1;
    } else {
      capitasPipeline += cap;
      forecast += cap * (STAGE_BY_KEY[c.stage]?.prob || 0);
      mrrPipeline += num(c.montoMensual) * (STAGE_BY_KEY[c.stage]?.prob || 0);
    }
  });
  const ganadasConFecha = ganadas.filter((c) => c.fechaGanado);
  const capitasEsteMes = ganadasConFecha.filter((c) => c.fechaGanado.slice(0, 7) === mesActual).reduce((s, c) => s + num(c.capitas), 0);
  const enTrimestre = ganadasConFecha.filter((c) => {
    const d = parseISO(c.fechaGanado);
    return d >= qStart && d <= qEnd;
  });
  const capitasNetasTrimestre = enTrimestre.reduce((s, c) => s + num(c.capitas), 0);
  const empresas20Trimestre = enTrimestre.filter((c) => num(c.capitas) > 20).length;

  // Ciclo de venta: desde el primer contacto registrado hasta el cierre.
  const ciclos = ganadasConFecha
    .map((c) => {
      const sd = c.stageDates || {};
      const fechas = (c.historial || []).map((h) => h.fecha).filter(Boolean).sort();
      const inicio = sd.contacto || sd.reunion || fechas[0];
      return inicio ? diasEntre(inicio, c.fechaGanado) : null;
    })
    .filter((x) => x !== null && x >= 0);
  const cicloPromedio = ciclos.length ? ciclos.reduce((a, b) => a + b, 0) / ciclos.length : null;

  // Cápitas ganadas por mes (últimos 6 meses).
  const porMes = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
    porMes.push({
      key,
      mes: MESES_CORTO[d.getMonth()],
      tooltipLabel: `${MESES_ES[d.getMonth()]} ${d.getFullYear()}`,
      capitas: ganadasConFecha.filter((c) => c.fechaGanado.slice(0, 7) === key).reduce((s, c) => s + num(c.capitas), 0),
    });
  }

  const cerradas = ganadas.length + perdidas.length;
  const diasMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const faltan = Math.max(0, settings.metaMensual - capitasEsteMes);
  const habiles = diasHabilesRestantes(now);
  return {
    byStage,
    capByStage,
    total: companies.length,
    calientes,
    capitasGanadas,
    capitasPipeline,
    forecast,
    mrrGanado,
    mrrPipeline,
    tier: commissionTier(capitasGanadas),
    winRate: cerradas ? ganadas.length / cerradas : null,
    ganadasN: ganadas.length,
    perdidasN: perdidas.length,
    ticket: ganadas.length ? capitasGanadas / ganadas.length : null,
    cicloPromedio,
    motivos: Object.entries(motivos).sort((a, b) => b[1] - a[1]),
    porMes,
    capitasEsteMes,
    metaMensual: settings.metaMensual,
    faltan,
    diasRestantes: Math.max(0, diasMes - now.getDate()),
    habiles,
    porDiaHabil: habiles ? faltan / habiles : faltan,
    proyeccionMes: now.getDate() > 0 ? (capitasEsteMes / now.getDate()) * diasMes : 0,
    capitasNetasTrimestre,
    empresas20Trimestre,
    premioCapitas: premioCapitasNetas(capitasNetasTrimestre),
    premioEmpresas: premioEmpresas20(empresas20Trimestre),
    qLabel,
    activos: companies.filter((c) => ACTIVE_STAGES.includes(c.stage)).length,
  };
}

function calcularPendientes(companies, personas, meetings) {
  const hoy = hoyISO();
  const vencidas = [];
  const enRiesgo = [];
  const waDue = [];
  const calientes = [];
  companies.forEach((c) => {
    if (!isOpen(c)) return;
    if (c.fechaProximaAccion && c.fechaProximaAccion <= hoy) vencidas.push(c);
    else if (["reunion", "propuesta", "negociacion"].includes(c.stage)) {
      const d = diasSinActividad(c);
      if (d === null || d >= 7) enRiesgo.push(c);
    }
    if (c.telefono) {
      const seq = getSequenceStatus(c);
      if (seq.status === "due" && seq.step && seq.step.key !== WHATSAPP_SEQUENCE[0].key) waDue.push({ c, seq });
    }
    if (c.tier === "caliente" && c.stage === "prospeccion" && c.telefono && !c.waSequenceStopped) calientes.push(c);
  });
  vencidas.sort((a, b) => a.fechaProximaAccion.localeCompare(b.fechaProximaAccion));
  enRiesgo.sort((a, b) => (STAGE_BY_KEY[b.stage].prob - STAGE_BY_KEY[a.stage].prob) || num(b.capitas) - num(a.capitas));
  const b2c = personas
    .filter((p) => p.seguimiento && p.seguimiento <= hoy && !["cliente", "descartado"].includes(p.status))
    .sort((a, b) => a.seguimiento.localeCompare(b.seguimiento));
  const reunionesHoy = meetings.filter((m) => m.fecha === hoy).length;
  return { vencidas, enRiesgo, waDue, calientes, b2c, totalUrgente: vencidas.length + waDue.length + b2c.length + reunionesHoy };
}


// ================================================================ Mi día ===

function MiDia({ companies, settings, metrics, pendientes, agenda, actividad, personas, setSelectedId, setShowWhatsApp, go, setLogFor, setShowNewMeeting, setShowNewCompany, setSelectedPersonaId, setShowPersonaWhatsApp, cotPendientes = [], abrirPorVincular }) {
  const hoy = hoyISO();
  const act = actividad.get(hoy) || { llamada: 0, whatsapp: 0, mail: 0, reunion: 0, propuesta: 0 };
  const obj = settings.objetivos;
  const metas = [
    { key: "llamada", label: "Llamadas", icon: Phone },
    { key: "whatsapp", label: "WhatsApp", icon: MessageCircle },
    { key: "reunion", label: "Reuniones", icon: Users },
    { key: "propuesta", label: "Propuestas", icon: FileText },
  ];
  const cumplidas = metas.filter((m) => act[m.key] >= (obj[m.key] || 0)).length;
  const nombre = (settings.asesor || "").split(" ")[0];
  const metaOk = metrics.faltan === 0;

  // Racha: días hábiles consecutivos con al menos un toque.
  const racha = useMemo(() => {
    let n = 0;
    const d = new Date();
    if (totalToques(actividad.get(isoLocal(d))) === 0) d.setDate(d.getDate() - 1);
    for (let i = 0; i < 120; i++) {
      if (d.getDay() === 0 || d.getDay() === 6) {
        d.setDate(d.getDate() - 1);
        continue;
      }
      if (totalToques(actividad.get(isoLocal(d))) > 0) n++;
      else break;
      d.setDate(d.getDate() - 1);
    }
    return n;
  }, [actividad]);

  return (
    <div className="stack">
      <PageHeader title={`${saludo()}, ${nombre}`} subtitle={`${capitalizar(fechaLarga())} · ${metrics.habiles} días hábiles para cerrar el mes`}>
        <Btn variant="primary" icon={Activity} onClick={() => setLogFor({})}>Registrar actividad</Btn>
        <Btn icon={CalIcon} onClick={() => setShowNewMeeting(true)}>Agendar reunión</Btn>
        <Btn icon={Plus} onClick={() => setShowNewCompany(true)}>Empresa</Btn>
      </PageHeader>

      <div className="grid g3">
        <div className="hero">
          <div className="row between">
            <span style={{ fontWeight: 700, fontSize: 14 }}>Meta del mes</span>
            <span className="chip" style={{ background: "rgba(255,255,255,.12)", color: "#fff" }}>{metrics.metaMensual} cápitas</span>
          </div>
          <div className="row" style={{ gap: 18, marginTop: 10 }}>
            <Ring value={metrics.capitasEsteMes} max={metrics.metaMensual} size={128} stroke={11} color={metaOk ? "#7BE0A4" : "#7FE3D5"}>
              <div className="tnum" style={{ fontSize: 34, fontWeight: 800, lineHeight: 1 }}>{fmtN(metrics.capitasEsteMes)}</div>
              <div style={{ fontSize: 11, color: "#A9BCD3", marginTop: 2 }}>de {metrics.metaMensual}</div>
            </Ring>
            <div style={{ fontSize: 13, color: "#D6E2F0", lineHeight: 1.5, minWidth: 0 }}>
              {metaOk ? (
                <>🎉 <strong style={{ color: "#fff" }}>Meta alcanzada.</strong> Lo que sumes ahora va al premio trimestral.</>
              ) : (
                <>
                  Faltan <strong style={{ color: "#fff" }}>{fmtN(metrics.faltan)} cápitas</strong>: ≈ {metrics.porDiaHabil.toLocaleString("es-AR", { maximumFractionDigits: 1 })} por día hábil.
                  <div style={{ marginTop: 6, color: "#A9BCD3", fontSize: 12 }}>Forecast ponderado del pipeline: {fmtN(metrics.forecast)} cápitas.</div>
                </>
              )}
            </div>
          </div>
        </div>

        <Card title="Objetivos de hoy" icon={Target} className="span2" action={<Chip tone={cumplidas === metas.length ? "good" : "neutral"}>{cumplidas}/{metas.length} cumplidos</Chip>}>
          <div className="grid g4" style={{ gap: 12 }}>
            {metas.map((m) => {
              const v = act[m.key];
              const o = obj[m.key] || 0;
              const ok = v >= o && o > 0;
              return (
                <div key={m.key} className="tile">
                  <div className="row between">
                    <span className="row ink2" style={{ gap: 6, fontSize: 12.5, fontWeight: 600 }}>
                      <m.icon size={14} /> {m.label}
                    </span>
                    {ok && <CheckCircle2 size={15} color="var(--good)" aria-label="cumplido" />}
                  </div>
                  <div className="tnum" style={{ fontSize: 24, fontWeight: 800, margin: "4px 0 6px" }}>
                    {v}
                    <span className="muted" style={{ fontSize: 13, fontWeight: 600 }}> / {o}</span>
                  </div>
                  <ProgressBar value={v} max={o} tone={ok ? "good" : undefined} height={6} />
                  {m.key !== "whatsapp" && (
                    <button className="btn btn-ghost btn-sm" style={{ marginTop: 6, padding: "3px 6px" }} onClick={() => setLogFor({ tipo: m.key })}>
                      <Plus size={12} /> Registrar
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <div className="row between wrap muted" style={{ fontSize: 12, marginTop: 10 }}>
            <span>Llamadas, mails y propuestas se cuentan al registrarlas; los WhatsApp se cuentan solos al enviarlos desde el CRM.</span>
            {racha > 1 && <Chip tone="warn" icon={Flame}>Racha: {racha} días hábiles activos</Chip>}
          </div>
        </Card>
      </div>

      {cotPendientes.length > 0 && (
        <div className="note t-warn row between wrap" style={{ gap: 10 }}>
          <span>
            <strong>{cotPendientes.length} cotización{cotPendientes.length > 1 ? "es" : ""} del cotizador</strong> sin ficha en el CRM ({cotPendientes.slice(0, 3).map((q) => q.cliente || "sin nombre").join(", ")}{cotPendientes.length > 3 ? "…" : ""}). Vinculalas para hacerles seguimiento.
          </span>
          <Btn size="sm" variant="primary" onClick={abrirPorVincular}>Vincular ahora</Btn>
        </div>
      )}

      <div className="grid g3">
        <Card title="Reuniones de hoy" icon={CalIcon} action={<LinkBtn onClick={() => go("agenda")}>Agenda</LinkBtn>}>
          {agenda.hoy.length === 0 ? (
            <EmptyNote>
              Sin reuniones hoy.
              {agenda.upcoming[0] && <div style={{ marginTop: 4 }}>Próxima: {agenda.upcoming[0].empresa} · {fmtFecha(agenda.upcoming[0].fecha)} {agenda.upcoming[0].hora}</div>}
            </EmptyNote>
          ) : (
            <div className="stack-sm">
              {agenda.hoy.map((m) => (
                <div key={m.id} className="item" onClick={() => m.companyId && setSelectedId(m.companyId)}>
                  <span className="chip t-warn tnum" style={{ fontSize: 13 }}>{m.hora}</span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.empresa}</div>
                    {m.notas && <div className="muted" style={{ fontSize: 12 }}>{m.notas}</div>}
                  </div>
                  {m.companyId && (
                    <button className="btn btn-soft btn-sm" onClick={(e) => { e.stopPropagation(); setLogFor({ companyId: m.companyId, tipo: "reunion" }); }}>
                      Hecha
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Acciones vencidas y de hoy" icon={AlertTriangle} className="span2" action={<Chip tone={pendientes.vencidas.length ? "bad" : "good"}>{pendientes.vencidas.length}</Chip>}>
          {pendientes.vencidas.length === 0 ? (
            <EmptyNote>Estás al día. Cargá una “próxima acción” en cada empresa activa para que aparezca acá.</EmptyNote>
          ) : (
            <div className="stack-sm">
              {pendientes.vencidas.slice(0, 7).map((c) => {
                const atraso = diasEntre(c.fechaProximaAccion, hoyISO());
                return (
                  <div key={c.id} className="item" onClick={() => setSelectedId(c.id)}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="row" style={{ gap: 6 }}>
                        <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.empresa}</span>
                        <StageChip stage={c.stage} />
                      </div>
                      <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                        {c.proximaAccion || "Acción sin detalle"} · <span style={{ color: atraso > 0 ? "var(--bad)" : "var(--warn)", fontWeight: 600 }}>{atraso > 0 ? `vencida hace ${atraso} d` : "hoy"}</span>
                      </div>
                    </div>
                    <button className="icon-btn wa" disabled={!c.telefono} title="WhatsApp" onClick={(e) => { e.stopPropagation(); setShowWhatsApp(c.id); }}>
                      <MessageCircle size={14} />
                    </button>
                    <button className="btn btn-soft btn-sm" onClick={(e) => { e.stopPropagation(); setLogFor({ companyId: c.id, texto: c.proximaAccion }); }}>
                      <Check size={13} /> Hecho
                    </button>
                  </div>
                );
              })}
              {pendientes.vencidas.length > 7 && <div className="muted" style={{ fontSize: 12 }}>y {pendientes.vencidas.length - 7} más — filtralas en Cartera.</div>}
            </div>
          )}
        </Card>
      </div>

      <div className="grid g3">
        <Card title="Oportunidades enfriándose" icon={Timer} action={<LinkBtn onClick={() => go("pipeline")}>Pipeline</LinkBtn>}>
          {pendientes.enRiesgo.length === 0 ? (
            <EmptyNote>Ninguna oportunidad avanzada lleva 7+ días sin actividad.</EmptyNote>
          ) : (
            <div className="stack-sm">
              {pendientes.enRiesgo.slice(0, 5).map((c) => (
                <button key={c.id} className="item" onClick={() => setSelectedId(c.id)}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.empresa}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{STAGE_BY_KEY[c.stage].label}{num(c.capitas) ? ` · ${c.capitas} cáp.` : ""}</div>
                  </div>
                  <AgingChip c={c} />
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card title="Seguimientos WhatsApp" icon={MessageCircle} action={<LinkBtn onClick={() => go("campana")}>Campaña</LinkBtn>}>
          {pendientes.waDue.length === 0 ? (
            <EmptyNote>No hay seguimientos pendientes de la secuencia.</EmptyNote>
          ) : (
            <div className="stack-sm">
              {pendientes.waDue.slice(0, 5).map(({ c, seq }) => (
                <button key={c.id} className="item" onClick={() => setShowWhatsApp(c.id)}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.empresa}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{seq.step.label}</div>
                  </div>
                  <MessageCircle size={15} color="var(--wa)" />
                </button>
              ))}
              {pendientes.waDue.length > 5 && <div className="muted" style={{ fontSize: 12 }}>y {pendientes.waDue.length - 5} más en Campaña.</div>}
            </div>
          )}
        </Card>

        <Card title="Calientes sin contactar" icon={Flame} action={<Chip tone="bad">{pendientes.calientes.length}</Chip>}>
          {pendientes.calientes.length === 0 ? (
            <EmptyNote>Ya contactaste a todos los prospectos calientes. 💪</EmptyNote>
          ) : (
            <div className="stack-sm">
              {pendientes.calientes.slice(0, 5).map((c) => (
                <div key={c.id} className="item" onClick={() => setSelectedId(c.id)}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.empresa}</div>
                    <div className="muted" style={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.contacto || "Sin contacto"}</div>
                  </div>
                  <button className="icon-btn wa" title="Primer WhatsApp" onClick={(e) => { e.stopPropagation(); setShowWhatsApp(c.id); }}>
                    <MessageCircle size={14} />
                  </button>
                  <button className="icon-btn" title="Registrar llamada" onClick={(e) => { e.stopPropagation(); setLogFor({ companyId: c.id, tipo: "llamada" }); }}>
                    <Phone size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {(pendientes.b2c.length > 0 || personas.some((p) => p.status === "interesado")) && (
        <Card title="Particulares para seguir hoy" icon={Heart} action={<LinkBtn onClick={() => go("personas")}>Pacientes</LinkBtn>}>
          {pendientes.b2c.length === 0 ? (
            <EmptyNote>
              Tenés {personas.filter((p) => p.status === "interesado").length} interesados sin fecha de seguimiento. Abrí su ficha y cargale una fecha.
            </EmptyNote>
          ) : (
            <div className="grid g3" style={{ gap: 8 }}>
              {pendientes.b2c.slice(0, 9).map((p) => (
                <div key={p.id} className="item" onClick={() => setSelectedPersonaId(p.id)}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nombre}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{PERSONA_STATUS.find((s) => s.key === p.status)?.label} · seguimiento {fmtRelativo(p.seguimiento)}</div>
                  </div>
                  <button className="icon-btn wa" disabled={!p.telefono} onClick={(e) => { e.stopPropagation(); setShowPersonaWhatsApp(p.id); }}>
                    <MessageCircle size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// ============================================================ Indicadores ===

function Tablero({ companies, settings, metrics, actividad, meetings, setSelectedId, go }) {
  const ch = useChart();
  const [rango, setRango] = useState(8);

  const semanas = useMemo(() => {
    const out = [];
    const lunes = new Date();
    lunes.setHours(0, 0, 0, 0);
    lunes.setDate(lunes.getDate() - ((lunes.getDay() + 6) % 7));
    for (let w = rango - 1; w >= 0; w--) {
      const ini = new Date(lunes);
      ini.setDate(ini.getDate() - w * 7);
      const tot = { llamada: 0, whatsapp: 0, mail: 0, reunion: 0, propuesta: 0 };
      for (let i = 0; i < 7; i++) {
        const d = new Date(ini);
        d.setDate(d.getDate() + i);
        const o = actividad.get(isoLocal(d));
        if (o) Object.keys(tot).forEach((k) => (tot[k] += o[k]));
      }
      out.push({ semana: `${pad2(ini.getDate())}/${pad2(ini.getMonth() + 1)}`, tooltipLabel: `Semana del ${ini.getDate()} de ${MESES_ES[ini.getMonth()]}`, toques: totalToques(tot), ...tot });
    }
    return out;
  }, [actividad, rango]);
  const estaSemana = semanas[semanas.length - 1];
  const semanaAnterior = semanas[semanas.length - 2];
  const delta = semanaAnterior && semanaAnterior.toques ? Math.round(((estaSemana.toques - semanaAnterior.toques) / semanaAnterior.toques) * 100) : null;

  const funnelStages = STAGES.filter((s) => s.key !== "perdido");
  // Embudo acumulado: una empresa en Propuesta ya pasó por Contacto y Reunión.
  const alcanzaron = useMemo(() => {
    const idx = Object.fromEntries(funnelStages.map((s, i) => [s.key, i]));
    const counts = funnelStages.map(() => 0);
    companies.forEach((c) => {
      let i = idx[c.stage];
      if (c.stage === "perdido") {
        const sd = c.stageDates || {};
        i = Math.max(-1, ...funnelStages.filter((s) => sd[s.key]).map((s) => idx[s.key]));
        if (i < 0) i = 1; // perdida sin rastro: al menos hubo contacto
      }
      for (let k = 0; k <= i; k++) counts[k]++;
    });
    return counts;
  }, [companies]);

  const top = useMemo(
    () => companies.filter((c) => ["propuesta", "negociacion"].includes(c.stage)).sort((a, b) => num(b.capitas) * STAGE_BY_KEY[b.stage].prob - num(a.capitas) * STAGE_BY_KEY[a.stage].prob).slice(0, 6),
    [companies]
  );

  const tasaReunion = useMemo(() => {
    const desde = addDaysISO(-30);
    const r = meetings.filter((m) => m.fecha >= desde && m.fecha <= hoyISO()).length;
    return r;
  }, [meetings]);

  return (
    <div className="stack">
      <PageHeader title="Indicadores de gestión" subtitle={`Resultados, pipeline y actividad · ${metrics.qLabel}`}>
        <Btn icon={Download} onClick={() => exportarExcel(kpiFilas(metrics, semanas), "KPIs", `kpis-${hoyISO()}.xlsx`)}>Exportar KPIs</Btn>
      </PageHeader>

      <div className="grid g6">
        <Kpi icon={Target} label="Cápitas del mes" value={fmtN(metrics.capitasEsteMes)} sub={`Meta ${metrics.metaMensual} · proyección ${fmtN(metrics.proyeccionMes)}`} tone={metrics.faltan === 0 ? "good" : "accent"} />
        <Kpi icon={TrendingUp} label="Forecast ponderado" value={fmtN(metrics.forecast)} sub={`${fmtN(metrics.capitasPipeline)} cápitas en pipeline`} tone="info" onClick={() => go("pipeline")} />
        <Kpi icon={Trophy} label="Tasa de cierre" value={metrics.winRate === null ? "—" : `${Math.round(metrics.winRate * 100)}%`} sub={`${metrics.ganadasN} ganadas · ${metrics.perdidasN} perdidas`} tone="good" />
        <Kpi icon={Users} label="Ticket promedio" value={metrics.ticket === null ? "—" : metrics.ticket.toLocaleString("es-AR", { maximumFractionDigits: 1 })} sub="cápitas por empresa ganada" tone="accent" />
        <Kpi icon={Clock} label="Ciclo de venta" value={metrics.cicloPromedio === null ? "—" : `${Math.round(metrics.cicloPromedio)} d`} sub="del primer contacto al cierre" tone="warn" />
        <Kpi icon={Briefcase} label="Cartera ganada / mes" value={metrics.mrrGanado ? moneyK(metrics.mrrGanado) : "—"} sub={metrics.mrrPipeline ? `+ ${moneyK(metrics.mrrPipeline)} ponderado en curso` : "según cotizaciones guardadas"} tone="good" />
      </div>

      <div className="grid g3">
        <Card title="Cápitas ganadas por mes" icon={Award} className="span2" action={<span className="muted" style={{ fontSize: 12 }}>Línea punteada: meta mensual</span>}>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.porMes} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={ch.grid} />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={{ fill: ch.axis, fontSize: 12 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: ch.axis, fontSize: 12 }} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: ch.grid, opacity: 0.5 }} />
                <ReferenceLine y={metrics.metaMensual} stroke={ch.ref} strokeDasharray="5 4" strokeWidth={1.5} />
                <Bar dataKey="capitas" name="Cápitas" radius={[4, 4, 0, 0]} maxBarSize={44}>
                  {metrics.porMes.map((d, i) => (
                    <Cell key={d.key} fill={i === metrics.porMes.length - 1 ? ch.accent : ch.accent2} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Escalera de comisión" icon={TrendingUp}>
          <div className="row" style={{ alignItems: "baseline", gap: 8, marginBottom: 10 }}>
            <span className="tnum" style={{ fontSize: 34, fontWeight: 800, color: "var(--accent-ink)" }}>{metrics.tier.pct}%</span>
            <span className="muted" style={{ fontSize: 12 }}>{metrics.tier.label}</span>
          </div>
          <div className="stack-sm">
            {ESCALA_COMISION.map((t) => {
              const actual = metrics.tier.pct === t.pct;
              return (
                <div key={t.pct} className="row between" style={{ padding: "6px 10px", borderRadius: 8, fontSize: 12.5, background: actual ? "var(--accent-soft)" : "var(--surface-2)", color: actual ? "var(--accent-ink)" : "var(--ink-2)", fontWeight: actual ? 700 : 500 }}>
                  <span>{t.hasta ? `${t.desde} a ${t.hasta} cápitas` : `Más de ${t.desde - 1} cápitas`}</span>
                  <span className="tnum">{t.pct}%</span>
                </div>
              );
            })}
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>
            {fmtN(metrics.capitasGanadas)} cápitas cerradas. {(() => {
              const next = ESCALA_COMISION.find((t) => t.desde > metrics.capitasGanadas);
              return next ? `Te faltan ${fmtN(next.desde - metrics.capitasGanadas)} para el ${next.pct}%.` : "Estás en el tramo máximo.";
            })()}
          </div>
        </Card>
      </div>

      <Card title={`Premios del trimestre · ${metrics.qLabel}`} icon={Award}>
        <div className="grid g2" style={{ gap: 28 }}>
          <div>
            <div className="row between">
              <span className="ink2" style={{ fontSize: 12.5, fontWeight: 600 }}>Cápitas netas</span>
              <span className="tnum" style={{ fontWeight: 800 }}>{fmtN(metrics.capitasNetasTrimestre)}</span>
            </div>
            <MilestoneBar value={metrics.capitasNetasTrimestre} max={170} marks={[96, 121, 151]} />
            <Chip tone={metrics.premioCapitas.sueldos > 0 ? "good" : "neutral"}>
              {metrics.premioCapitas.sueldos > 0 ? `Premio: ${metrics.premioCapitas.sueldos} sueldo${metrics.premioCapitas.sueldos > 1 ? "s" : ""} (${metrics.premioCapitas.label})` : metrics.premioCapitas.label}
            </Chip>
          </div>
          <div>
            <div className="row between">
              <span className="ink2" style={{ fontSize: 12.5, fontWeight: 600 }}>Empresas con más de 20 cápitas</span>
              <span className="tnum" style={{ fontWeight: 800 }}>{metrics.empresas20Trimestre}</span>
            </div>
            <MilestoneBar value={metrics.empresas20Trimestre} max={9} marks={[4, 6, 8]} />
            <Chip tone={metrics.premioEmpresas.sueldos > 0 ? "good" : "neutral"}>
              {metrics.premioEmpresas.sueldos > 0 ? `Premio: ${metrics.premioEmpresas.sueldos} sueldo${metrics.premioEmpresas.sueldos > 1 ? "s" : ""} (${metrics.premioEmpresas.label})` : metrics.premioEmpresas.label}
            </Chip>
          </div>
        </div>
        <div className="note t-accent" style={{ marginTop: 14 }}>
          Comisión OA (socio y no socio): 20% + 0,20 cápitas por voucher vendido para premios y comisiones de salud (5 OA = 1 cápita de salud).
        </div>
      </Card>

      <div className="grid g3">
        <Card title="Embudo de conversión" icon={ClipboardList} className="span2" action={<LinkBtn onClick={() => go("pipeline")}>Abrir pipeline</LinkBtn>}>
          <div className="stack-sm">
            {funnelStages.map((s, i) => {
              const n = alcanzaron[i];
              const conv = i > 0 && alcanzaron[i - 1] ? Math.round((n / alcanzaron[i - 1]) * 100) : null;
              return (
                <HBar
                  key={s.key}
                  label={s.label}
                  value={n}
                  max={alcanzaron[1] || 1}
                  tone={s.key === "ganado" ? "good" : s.key === "prospeccion" ? "muted" : undefined}
                  right={conv !== null ? `${fmtN(n)} · ${conv}%` : fmtN(n)}
                  title={`${s.label}: ${fmtN(n)} empresas llegaron a esta etapa`}
                />
              );
            })}
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>Empresas que alguna vez llegaron a cada etapa; el % es la conversión desde la etapa anterior. Prospección se muestra fuera de escala.</div>
        </Card>

        <Card title="Motivos de pérdida" icon={XCircle}>
          {metrics.motivos.length === 0 ? (
            <EmptyNote>Todavía no hay oportunidades perdidas. Cuando pases una a “Perdido” te vamos a pedir el motivo.</EmptyNote>
          ) : (
            <div className="stack-sm">
              {metrics.motivos.slice(0, 7).map(([m, n]) => (
                <HBar key={m} label={m} value={n} max={metrics.motivos[0][1]} tone="warn" />
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid g3">
        <Card
          title="Actividad comercial por semana"
          icon={Activity}
          className="span2"
          action={
            <div className="seg">
              {[4, 8, 12].map((n) => (
                <button key={n} className={rango === n ? "on" : ""} onClick={() => setRango(n)}>{n} sem</button>
              ))}
            </div>
          }
        >
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={semanas} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={ch.grid} />
                <XAxis dataKey="semana" tickLine={false} axisLine={false} tick={{ fill: ch.axis, fontSize: 12 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: ch.axis, fontSize: 12 }} />
                <Tooltip content={<ActividadTooltip />} cursor={{ fill: ch.grid, opacity: 0.5 }} />
                <Bar dataKey="toques" name="Toques" fill={ch.accent} radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="muted" style={{ fontSize: 12 }}>Toques = llamadas + WhatsApp + mails + reuniones + propuestas.</div>
        </Card>

        <Card title="Esta semana" icon={Zap}>
          <div className="row" style={{ alignItems: "baseline", gap: 8 }}>
            <span className="tnum" style={{ fontSize: 34, fontWeight: 800 }}>{estaSemana?.toques || 0}</span>
            <span className="muted">toques</span>
            {delta !== null && <Chip tone={delta >= 0 ? "good" : "bad"}>{delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}% vs. anterior</Chip>}
          </div>
          <table className="tbl" style={{ marginTop: 8 }}>
            <tbody>
              {["llamada", "whatsapp", "mail", "reunion", "propuesta"].map((k) => {
                const I = TIPOS_ACT[k].icon;
                return (
                  <tr key={k}>
                    <td style={{ padding: "7px 4px" }}>
                      <span className="row" style={{ gap: 8 }}><I size={14} /> {TIPOS_ACT[k].label}</span>
                    </td>
                    <td className="tnum strong" style={{ padding: "7px 4px", textAlign: "right" }}>{estaSemana?.[k] || 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>{tasaReunion} reuniones en los últimos 30 días.</div>
        </Card>
      </div>

      <div className="grid g2">
        <Card title="Top oportunidades para cerrar" icon={Zap} action={<span className="muted" style={{ fontSize: 12 }}>orden: cápitas × probabilidad</span>}>
          {top.length === 0 ? (
            <EmptyNote>Cuando una empresa pase a Propuesta o Negociación, aparece acá.</EmptyNote>
          ) : (
            <table className="tbl">
              <thead>
                <tr><th>Empresa</th><th>Etapa</th><th style={{ textAlign: "right" }}>Cápitas</th><th style={{ textAlign: "right" }}>$/mes</th></tr>
              </thead>
              <tbody>
                {top.map((c) => (
                  <tr key={c.id} className="click" onClick={() => setSelectedId(c.id)}>
                    <td className="strong">{c.empresa}</td>
                    <td><StageChip stage={c.stage} /></td>
                    <td className="tnum" style={{ textAlign: "right" }}>{num(c.capitas) || "—"}</td>
                    <td className="tnum" style={{ textAlign: "right" }}>{c.montoMensual ? moneyK(c.montoMensual) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="Composición de la cartera" icon={Building2} action={<LinkBtn onClick={() => go("empresas")}>Cartera</LinkBtn>}>
          <div className="grid g2" style={{ gap: 10 }}>
            <div className="tile"><div className="muted" style={{ fontSize: 12 }}>Empresas en cartera</div><div className="tnum" style={{ fontSize: 22, fontWeight: 800 }}>{fmtN(metrics.total)}</div></div>
            <div className="tile"><div className="muted" style={{ fontSize: 12 }}>Sin contactar</div><div className="tnum" style={{ fontSize: 22, fontWeight: 800 }}>{fmtN(metrics.byStage.prospeccion)}</div></div>
            <div className="tile"><div className="muted" style={{ fontSize: 12 }}>En conversación</div><div className="tnum" style={{ fontSize: 22, fontWeight: 800 }}>{fmtN(metrics.activos)}</div></div>
            <div className="tile"><div className="muted" style={{ fontSize: 12 }}>Calientes</div><div className="tnum" style={{ fontSize: 22, fontWeight: 800 }}>{fmtN(metrics.calientes)}</div></div>
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>
            Cobertura: contactaste {metrics.total ? Math.round(((metrics.total - metrics.byStage.prospeccion) / metrics.total) * 100) : 0}% de la base.
          </div>
          <div style={{ marginTop: 6 }}>
            <ProgressBar value={metrics.total - metrics.byStage.prospeccion} max={metrics.total} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function ActividadTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 10px", fontSize: 12, boxShadow: "var(--shadow-lg)", color: "var(--ink)" }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{d.tooltipLabel}</div>
      <div className="tnum">Toques: <strong>{d.toques}</strong></div>
      <div className="tnum" style={{ color: "var(--ink-2)" }}>
        {d.llamada} llamadas · {d.whatsapp} WA · {d.mail} mails · {d.reunion} reuniones · {d.propuesta} propuestas
      </div>
    </div>
  );
}

function kpiFilas(m, semanas) {
  return [
    { Indicador: "Cápitas del mes", Valor: m.capitasEsteMes },
    { Indicador: "Meta mensual", Valor: m.metaMensual },
    { Indicador: "Forecast ponderado (cápitas)", Valor: Math.round(m.forecast) },
    { Indicador: "Cápitas en pipeline", Valor: m.capitasPipeline },
    { Indicador: "Tasa de cierre", Valor: m.winRate === null ? "" : Math.round(m.winRate * 100) + "%" },
    { Indicador: "Ticket promedio (cápitas)", Valor: m.ticket === null ? "" : Number(m.ticket.toFixed(1)) },
    { Indicador: "Ciclo de venta (días)", Valor: m.cicloPromedio === null ? "" : Math.round(m.cicloPromedio) },
    { Indicador: "Cápitas netas trimestre", Valor: m.capitasNetasTrimestre },
    { Indicador: "Empresas +20 cápitas trimestre", Valor: m.empresas20Trimestre },
    { Indicador: "Comisión actual", Valor: m.tier.pct + "%" },
    ...semanas.map((s) => ({ Indicador: `Toques semana ${s.semana}`, Valor: s.toques })),
  ];
}


// ============================================================== Pipeline ===

const KANBAN_CARDS_POR_COLUMNA = 25;

function Pipeline({ companies, updateCompany, setSelectedId, setShowNewCompany, setShowWhatsApp, setLogFor }) {
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState("todos");
  const [ocultarProspeccion, setOcultarProspeccion] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [dragId, setDragId] = useState(null);
  const [overStage, setOverStage] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return companies.filter((c) => {
      if (tier !== "todos" && c.tier !== tier) return false;
      if (q && !(c.empresa.toLowerCase().includes(q) || (c.contacto || "").toLowerCase().includes(q) || (c.cuit || "").includes(q))) return false;
      return true;
    });
  }, [companies, search, tier]);

  const columnas = STAGES.filter((s) => !(ocultarProspeccion && s.key === "prospeccion"));
  const hoy = hoyISO();

  return (
    <div className="stack">
      <PageHeader title="Pipeline" subtitle="Arrastrá las tarjetas entre columnas para cambiar de etapa">
        <SearchBox value={search} onChange={setSearch} placeholder="Buscar empresa, contacto o CUIT…" />
        <div className="seg">
          {[["todos", "Todas"], ["caliente", "Calientes"], ["tibio", "Tibias"]].map(([k, l]) => (
            <button key={k} className={tier === k ? "on" : ""} onClick={() => setTier(k)}>{l}</button>
          ))}
        </div>
        <label className="row ink2" style={{ fontSize: 12.5, gap: 6, cursor: "pointer" }}>
          <input type="checkbox" checked={ocultarProspeccion} onChange={(e) => setOcultarProspeccion(e.target.checked)} /> Ocultar prospección
        </label>
        <Btn variant="primary" icon={Plus} onClick={() => setShowNewCompany(true)}>Empresa</Btn>
      </PageHeader>

      <div className="kanban">
        {columnas.map((stage) => {
          const all = filtered.filter((c) => c.stage === stage.key);
          // Las acciones vencidas y lo más grande primero.
          all.sort((a, b) => {
            const va = a.fechaProximaAccion && a.fechaProximaAccion <= hoy ? 0 : 1;
            const vb = b.fechaProximaAccion && b.fechaProximaAccion <= hoy ? 0 : 1;
            return va - vb || num(b.capitas) - num(a.capitas);
          });
          const isExp = !!expanded[stage.key];
          const items = isExp ? all : all.slice(0, KANBAN_CARDS_POR_COLUMNA);
          const cap = all.reduce((s, c) => s + num(c.capitas), 0);
          return (
            <div
              key={stage.key}
              className={"kcol" + (overStage === stage.key ? " over" : "")}
              onDragOver={(e) => {
                e.preventDefault();
                if (overStage !== stage.key) setOverStage(stage.key);
              }}
              onDragLeave={() => setOverStage(null)}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain") || dragId;
                if (id) updateCompany(id, { stage: stage.key });
                setDragId(null);
                setOverStage(null);
              }}
            >
              <div style={{ padding: "2px 4px 10px" }}>
                <div className="row between">
                  <span style={{ fontWeight: 700, fontSize: 13.5 }}>{stage.label}</span>
                  <Chip tone="neutral">{all.length}</Chip>
                </div>
                <div className="muted tnum" style={{ fontSize: 11.5, marginTop: 3 }}>
                  {fmtN(cap)} cáp. {stage.prob > 0 && stage.prob < 1 ? `· ${fmtN(cap * stage.prob)} ponderadas (${Math.round(stage.prob * 100)}%)` : ""}
                </div>
              </div>
              <div className="stack-sm" style={{ minHeight: 60 }}>
                {items.map((c) => {
                  const vencida = c.fechaProximaAccion && c.fechaProximaAccion <= hoy && isOpen(c);
                  return (
                    <div
                      key={c.id}
                      className={"kcard" + (dragId === c.id ? " dragging" : "")}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", c.id);
                        e.dataTransfer.effectAllowed = "move";
                        setDragId(c.id);
                      }}
                      onDragEnd={() => {
                        setDragId(null);
                        setOverStage(null);
                      }}
                      onClick={() => setSelectedId(c.id)}
                    >
                      <div style={{ fontWeight: 650, fontSize: 13, lineHeight: 1.3 }}>{c.empresa}</div>
                      {c.contacto && <div className="muted" style={{ fontSize: 12, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.contacto}</div>}
                      <div className="row wrap" style={{ gap: 5, marginTop: 7 }}>
                        <TierBadge tier={c.tier} />
                        {num(c.capitas) > 0 && <Chip tone="accent">{c.capitas} cáp.</Chip>}
                        {c.montoMensual > 0 && <Chip tone="neutral">{moneyK(c.montoMensual)}/mes</Chip>}
                        <AgingChip c={c} />
                      </div>
                      {c.proximaAccion || c.fechaProximaAccion ? (
                        <div style={{ fontSize: 11.5, marginTop: 7, color: vencida ? "var(--bad)" : "var(--ink-2)", fontWeight: vencida ? 600 : 500 }}>
                          → {c.proximaAccion || "Próxima acción"}{c.fechaProximaAccion ? ` · ${fmtRelativo(c.fechaProximaAccion)}` : ""}
                        </div>
                      ) : (
                        isOpen(c) && c.stage !== "prospeccion" && <div style={{ fontSize: 11.5, marginTop: 7, color: "var(--warn)" }}>Sin próxima acción</div>
                      )}
                      <div className="row" style={{ gap: 5, marginTop: 8 }}>
                        <button className="icon-btn wa" style={{ width: 26, height: 26 }} disabled={!c.telefono} title="WhatsApp" onClick={(e) => { e.stopPropagation(); setShowWhatsApp(c.id); }}>
                          <MessageCircle size={13} />
                        </button>
                        <button className="icon-btn" style={{ width: 26, height: 26 }} title="Registrar actividad" onClick={(e) => { e.stopPropagation(); setLogFor({ companyId: c.id }); }}>
                          <Activity size={13} />
                        </button>
                        <select
                          className="select"
                          style={{ flex: 1, minWidth: 0, padding: "3px 6px", fontSize: 11.5, height: 26 }}
                          value={c.stage}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => updateCompany(c.id, { stage: e.target.value })}
                          aria-label="Etapa"
                        >
                          {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                        </select>
                      </div>
                    </div>
                  );
                })}
                {all.length > items.length && (
                  <button className="btn btn-ghost btn-sm" style={{ width: "100%" }} onClick={() => setExpanded((p) => ({ ...p, [stage.key]: true }))}>
                    Ver {all.length - items.length} más
                  </button>
                )}
                {isExp && all.length > KANBAN_CARDS_POR_COLUMNA && (
                  <button className="btn btn-ghost btn-sm" style={{ width: "100%" }} onClick={() => setExpanded((p) => ({ ...p, [stage.key]: false }))}>
                    Mostrar menos
                  </button>
                )}
                {all.length === 0 && <div className="muted" style={{ fontSize: 12, textAlign: "center", padding: 12 }}>Soltá una tarjeta acá</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================== Cartera ===

const EMPRESAS_POR_PAGINA = 50;

function Cartera({ companies, setSelectedId, setShowNewCompany, setShowWhatsApp, showToast }) {
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState("todos");
  const [stage, setStage] = useState("todos");
  const [foco, setFoco] = useState("todas"); // todas | vencidas | sinAccion | frias | cotizadas
  const [sort, setSort] = useState({ key: "empresa", dir: 1 });
  const [page, setPage] = useState(1);
  const hoy = hoyISO();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const out = companies.filter((c) => {
      if (tier !== "todos" && c.tier !== tier) return false;
      if (stage !== "todos" && c.stage !== stage) return false;
      if (foco === "vencidas" && !(isOpen(c) && c.fechaProximaAccion && c.fechaProximaAccion <= hoy)) return false;
      if (foco === "sinAccion" && !(ACTIVE_STAGES.includes(c.stage) && !c.fechaProximaAccion)) return false;
      if (foco === "frias" && !(ACTIVE_STAGES.includes(c.stage) && (diasSinActividad(c) ?? 999) >= 14)) return false;
      if (foco === "cotizadas" && !c.cotizacion) return false;
      if (q) {
        return (
          c.empresa.toLowerCase().includes(q) ||
          (c.nombreFantasia || "").toLowerCase().includes(q) ||
          (c.contacto || "").toLowerCase().includes(q) ||
          (c.mail || "").toLowerCase().includes(q) ||
          (c.cuit || "").includes(q) ||
          (c.telefono || "").includes(q)
        );
      }
      return true;
    });
    const val = {
      empresa: (c) => c.empresa.toLowerCase(),
      etapa: (c) => STAGES.findIndex((s) => s.key === c.stage),
      capitas: (c) => num(c.capitas),
      actividad: (c) => ultimaActividad(c) || "",
      accion: (c) => c.fechaProximaAccion || "9999",
    }[sort.key];
    out.sort((a, b) => {
      const x = val(a), y = val(b);
      return (x < y ? -1 : x > y ? 1 : 0) * sort.dir;
    });
    return out;
  }, [companies, search, tier, stage, foco, sort, hoy]);

  useEffect(() => setPage(1), [search, tier, stage, foco, sort]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / EMPRESAS_POR_PAGINA));
  const p = Math.min(page, totalPages);
  const pageItems = filtered.slice((p - 1) * EMPRESAS_POR_PAGINA, p * EMPRESAS_POR_PAGINA);

  const Th = ({ k, children, right }) => (
    <th className="sortable" style={{ textAlign: right ? "right" : "left" }} onClick={() => setSort((s) => ({ key: k, dir: s.key === k ? -s.dir : 1 }))}>
      {children} {sort.key === k ? (sort.dir === 1 ? "↑" : "↓") : ""}
    </th>
  );

  return (
    <div className="stack">
      <PageHeader title="Cartera de empresas" subtitle={`${fmtN(filtered.length)} de ${fmtN(companies.length)} empresas`}>
        <Btn
          icon={Download}
          onClick={() =>
            exportarExcel(
              filtered.map((c) => ({
                Empresa: c.empresa,
                "Nombre fantasía": c.nombreFantasia || "",
                CUIT: c.cuit || "",
                Contacto: c.contacto || "",
                Teléfono: c.telefono || "",
                Mail: c.mail || "",
                Prioridad: c.tier,
                Etapa: STAGE_BY_KEY[c.stage]?.label,
                Cápitas: num(c.capitas) || "",
                "Plan cotizado": c.planCotizado || "",
                "$ mensual": c.montoMensual || "",
                "Última actividad": ultimaActividad(c) || "",
                "Próxima acción": c.proximaAccion || "",
                "Fecha próxima acción": c.fechaProximaAccion || "",
                "Motivo pérdida": c.motivoPerdida || "",
              })),
              "Cartera",
              `cartera-${hoyISO()}.xlsx`
            )
          }
        >
          Excel
        </Btn>
        <Btn
          icon={Phone}
          title="Archivo .vcf para importar estos contactos a la agenda del celular"
          onClick={() => {
            descargarVCF(filtered.map((c) => ({ nombre: c.contacto || c.empresa, telefono: c.telefono, org: c.empresa, nota: c.cuit ? `CUIT: ${c.cuit}` : "" })), `empresas-${hoyISO()}.vcf`);
            showToast(`Se descargaron ${filtered.filter((c) => c.telefono).length} contactos para tu celular.`);
          }}
        >
          A mi celular
        </Btn>
        <Btn variant="primary" icon={Plus} onClick={() => setShowNewCompany(true)}>Empresa</Btn>
      </PageHeader>

      <div className="row wrap">
        <SearchBox value={search} onChange={setSearch} placeholder="Empresa, contacto, CUIT, teléfono…" />
        <select className="select" value={tier} onChange={(e) => setTier(e.target.value)} aria-label="Prioridad">
          <option value="todos">Toda prioridad</option>
          <option value="caliente">Calientes</option>
          <option value="tibio">Tibias</option>
        </select>
        <select className="select" value={stage} onChange={(e) => setStage(e.target.value)} aria-label="Etapa">
          <option value="todos">Toda etapa</option>
          {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <div className="seg">
          {[
            ["todas", "Todas"],
            ["vencidas", "Acción vencida"],
            ["sinAccion", "Sin próxima acción"],
            ["frias", "Frías +14 d"],
            ["cotizadas", "Cotizadas"],
          ].map(([k, l]) => (
            <button key={k} className={foco === k ? "on" : ""} onClick={() => setFoco(k)}>{l}</button>
          ))}
        </div>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="tbl">
            <thead>
              <tr>
                <Th k="empresa">Empresa</Th>
                <th>Contacto</th>
                <th>Prioridad</th>
                <Th k="etapa">Etapa</Th>
                <Th k="capitas" right>Cápitas</Th>
                <Th k="actividad">Última act.</Th>
                <Th k="accion">Próxima acción</Th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((c) => {
                const ua = ultimaActividad(c);
                const venc = isOpen(c) && c.fechaProximaAccion && c.fechaProximaAccion <= hoy;
                return (
                  <tr key={c.id} className="click" onClick={() => setSelectedId(c.id)}>
                    <td className="strong">
                      {c.empresa}
                      <div className="muted" style={{ fontSize: 11.5, fontWeight: 500 }}>{[c.nombreFantasia && c.nombreFantasia !== c.empresa ? c.nombreFantasia : null, c.cuit].filter(Boolean).join(" · ")}</div>
                    </td>
                    <td>
                      {c.contacto || "—"}
                      <div className="muted" style={{ fontSize: 11.5 }}>{c.telefono || c.mail || ""}</div>
                    </td>
                    <td><TierBadge tier={c.tier} /></td>
                    <td><StageChip stage={c.stage} /></td>
                    <td className="tnum" style={{ textAlign: "right" }}>{num(c.capitas) || "—"}</td>
                    <td className="tnum">{ua ? fmtRelativo(ua) : "—"}</td>
                    <td style={{ color: venc ? "var(--bad)" : undefined, fontWeight: venc ? 600 : undefined, maxWidth: 220 }}>
                      {c.fechaProximaAccion ? `${fmtFecha(c.fechaProximaAccion)} · ` : ""}
                      {c.proximaAccion || (c.fechaProximaAccion ? "" : "—")}
                    </td>
                    <td>
                      <button className="icon-btn wa" disabled={!c.telefono} title="WhatsApp" onClick={(e) => { e.stopPropagation(); setShowWhatsApp(c.id); }}>
                        <MessageCircle size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <EmptyNote>No hay empresas que coincidan con el filtro.</EmptyNote>}
        {filtered.length > 0 && <Paginador page={p} totalPages={totalPages} setPage={setPage} total={filtered.length} porPagina={EMPRESAS_POR_PAGINA} />}
      </div>
    </div>
  );
}

function Paginador({ page, totalPages, setPage, total, porPagina }) {
  return (
    <div className="row between wrap" style={{ padding: "10px 14px", fontSize: 13 }}>
      <span className="muted tnum">Mostrando {fmtN((page - 1) * porPagina + 1)}–{fmtN(Math.min(page * porPagina, total))} de {fmtN(total)}</span>
      <div className="row">
        <Btn size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Btn>
        <span className="muted tnum">{page} / {totalPages}</span>
        <Btn size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Siguiente</Btn>
      </div>
    </div>
  );
}

// ======================================================= Ficha de empresa ===

function QuickDates({ onPick }) {
  return (
    <div className="row wrap" style={{ gap: 4, marginTop: 6 }}>
      {[["Hoy", 0], ["Mañana", 1], ["+3 d", 3], ["+1 sem", 7], ["+2 sem", 14], ["+1 mes", 30]].map(([l, n]) => (
        <button key={l} type="button" className="btn btn-ghost btn-sm" style={{ padding: "3px 7px", border: "1px solid var(--border)" }} onClick={() => onPick(addDaysISO(n))}>
          {l}
        </button>
      ))}
    </div>
  );
}

function CompanyDetail({ company, onClose, updateCompany, addHistorial, deleteCompany, meetings, setShowNewMeeting, removeMeeting, retryMeetingSync, setShowWhatsApp, stopWhatsAppSequence, askConfirm, setLogFor, abrirCotizador }) {
  const [tab, setTab] = useState("gestion");
  const [note, setNote] = useState("");
  const [f, setF] = useState({});
  useEffect(() => {
    setF({
      _id: company.id,
      empresa: company.empresa || "",
      nombreFantasia: company.nombreFantasia || "",
      cuit: company.cuit || "",
      contacto: company.contacto || "",
      telefono: company.telefono || "",
      mail: company.mail || "",
      rubro: company.rubro || "",
      capitas: company.capitas || "",
      proximaAccion: company.proximaAccion || "",
      fechaProximaAccion: company.fechaProximaAccion || "",
    });
    setNote("");
  }, [company.id]);
  // Mantener sincronizados los campos que pueden cambiar desde afuera (modal de actividad, cotizador).
  useEffect(() => {
    setF((p) => ({ ...p, proximaAccion: company.proximaAccion || "", fechaProximaAccion: company.fechaProximaAccion || "", capitas: company.capitas || "" }));
  }, [company.proximaAccion, company.fechaProximaAccion, company.capitas]);

  // Si la ficha se cierra (Esc, clic afuera) con un campo todavía en edición,
  // lo guardamos igual: ningún cambio se pierde por no haber salido del campo.
  const latest = useRef(null);
  latest.current = { f, company };
  useEffect(
    () => () => {
      const { f: ff, company: cc } = latest.current;
      if (ff._id !== cc.id) return;
      const patch = {};
      Object.keys(ff).forEach((k) => {
        if (k !== "_id" && ff[k] !== (cc[k] || "") && !(k === "empresa" && !ff[k].trim())) patch[k] = ff[k];
      });
      if (Object.keys(patch).length) updateCompany(cc.id, patch);
    },
    []
  );

  const commit = (k) => {
    if (f[k] === undefined || f[k] === (company[k] || "")) return;
    if (k === "empresa" && !f[k].trim()) return;
    updateCompany(company.id, { [k]: k === "empresa" ? f[k].trim() : f[k] });
  };
  const inp = (k, props = {}) => (
    <input className="input" value={f[k] ?? ""} onChange={(e) => setF({ ...f, [k]: e.target.value })} onBlur={() => commit(k)} {...props} />
  );
  const seq = getSequenceStatus(company);
  const idx = STAGES.findIndex((s) => s.key === company.stage);
  const timeline = company.historial || [];

  return (
    <Drawer onClose={onClose}>
      <div style={{ position: "sticky", top: 0, background: "var(--surface)", zIndex: 2, borderBottom: "1px solid var(--border)" }}>
        <div className="row between" style={{ padding: "16px 18px 10px", alignItems: "flex-start" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-.01em" }}>{company.empresa}</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
              {[company.nombreFantasia && company.nombreFantasia !== company.empresa ? company.nombreFantasia : null, company.cuit ? `CUIT ${company.cuit}` : "Sin CUIT"].filter(Boolean).join(" · ")}
            </div>
            <div className="row wrap" style={{ gap: 6, marginTop: 8 }}>
              <button
                style={{ background: "none", border: 0, padding: 0, cursor: "pointer" }}
                title="Cambiar prioridad"
                onClick={() => updateCompany(company.id, { tier: company.tier === "caliente" ? "tibio" : "caliente" })}
              >
                <TierBadge tier={company.tier} />
              </button>
              <StageChip stage={company.stage} />
              <AgingChip c={company} />
              {company.motivoPerdida && <Chip tone="neutral">{company.motivoPerdida}</Chip>}
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar"><X size={16} /></button>
        </div>
        {/* Stepper de etapas */}
        <div style={{ display: "flex", gap: 3, padding: "0 18px 12px" }}>
          {STAGES.filter((s) => s.key !== "perdido").map((s, i) => {
            const done = company.stage !== "perdido" && i <= idx;
            return (
              <button
                key={s.key}
                onClick={() => updateCompany(company.id, { stage: s.key })}
                title={s.label}
                style={{ flex: 1, height: 26, border: 0, borderRadius: 6, cursor: "pointer", fontSize: 10.5, fontWeight: 700, background: done ? (s.key === "ganado" ? "var(--good)" : "var(--accent)") : "var(--surface-3)", color: done ? "#fff" : "var(--muted)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", padding: "0 3px" }}
              >
                {s.label.split(" ")[0]}
              </button>
            );
          })}
          <button
            onClick={() => updateCompany(company.id, { stage: "perdido" })}
            title="Marcar como perdida"
            style={{ width: 30, height: 26, border: 0, borderRadius: 6, cursor: "pointer", background: company.stage === "perdido" ? "var(--bad)" : "var(--surface-3)", color: company.stage === "perdido" ? "#fff" : "var(--muted)" }}
          >
            <XCircle size={13} />
          </button>
        </div>
        <div className="row" style={{ gap: 6, padding: "0 18px 12px" }}>
          <Btn variant="wa" size="sm" icon={MessageCircle} disabled={!company.telefono} onClick={() => setShowWhatsApp(company.id)}>WhatsApp</Btn>
          {company.telefono && (
            <a className="btn btn-outline btn-sm" href={`tel:+${normalizePhoneAR(company.telefono)}`} onClick={() => setLogFor({ companyId: company.id, tipo: "llamada" })}>
              <Phone size={13} /> Llamar
            </a>
          )}
          {company.mail && (
            <a className="btn btn-outline btn-sm" href={`mailto:${company.mail}`} onClick={() => setLogFor({ companyId: company.id, tipo: "mail" })}>
              <Mail size={13} /> Mail
            </a>
          )}
          <Btn size="sm" icon={CalIcon} onClick={() => setShowNewMeeting(company.id)}>Reunión</Btn>
          <Btn size="sm" icon={Calculator} onClick={() => abrirCotizador({ tipo: "empresa", id: company.id, label: company.empresa })}>Cotizar</Btn>
        </div>
        <div className="seg" style={{ margin: "0 18px 10px" }}>
          {[["gestion", "Gestión"], ["historial", `Historial (${timeline.length})`], ["datos", "Datos"]].map(([k, l]) => (
            <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: 18 }} className="stack">
        {tab === "gestion" && (
          <>
            <div className="card" style={{ padding: 14, boxShadow: "none" }}>
              <div className="label" style={{ marginBottom: 6 }}>Próxima acción</div>
              <div className="row" style={{ gap: 8 }}>
                {inp("proximaAccion", { placeholder: "Ej: llamar para confirmar cápitas", style: { flex: 1 } })}
                <input
                  type="date"
                  className="input"
                  style={{ width: 150 }}
                  value={f.fechaProximaAccion || ""}
                  onChange={(e) => setF({ ...f, fechaProximaAccion: e.target.value })}
                  onBlur={() => commit("fechaProximaAccion")}
                />
              </div>
              <QuickDates onPick={(d) => { setF({ ...f, fechaProximaAccion: d }); updateCompany(company.id, { fechaProximaAccion: d }); }} />
            </div>

            <div className="grid g2" style={{ gap: 10 }}>
              <Field label="Cápitas estimadas / cerradas">{inp("capitas", { type: "number", min: 0, placeholder: "Ej: 15" })}</Field>
              <Field label="Plan / $ mensual cotizado">
                <div className="input" style={{ background: "var(--surface-2)", color: company.planCotizado ? "var(--ink)" : "var(--muted)" }}>
                  {company.planCotizado ? `${company.planCotizado} · ${money(company.montoMensual)}` : "Sin cotización"}
                </div>
              </Field>
            </div>
            {num(company.capitas) > 0 && num(company.capitas) < MIN_CAPITAS_PYME && <div className="note t-warn">La línea PYME requiere desde {MIN_CAPITAS_PYME} cápitas (titulares + familiares).</div>}

            <div>
              <div className="label">Registrar actividad</div>
              <div className="row wrap" style={{ gap: 6 }}>
                {["llamada", "mail", "reunion", "propuesta"].map((t) => {
                  const I = TIPOS_ACT[t].icon;
                  return (
                    <Btn key={t} size="sm" icon={I} onClick={() => setLogFor({ companyId: company.id, tipo: t })}>{TIPOS_ACT[t].label}</Btn>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="label">Nota rápida</div>
              <div className="row" style={{ gap: 6 }}>
                <input
                  className="input"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ej: habló con el dueño, pidió cotización… (Enter para guardar)"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && note.trim()) {
                      addHistorial(company.id, note.trim(), "nota");
                      setNote("");
                    }
                  }}
                />
                <button className="icon-btn" style={{ width: 38, height: 38 }} onClick={() => { if (note.trim()) { addHistorial(company.id, note.trim(), "nota"); setNote(""); } }} aria-label="Guardar nota">
                  <Save size={15} />
                </button>
              </div>
            </div>

            {company.telefono && (
              <div className="row between tile">
                <SequenceBadge seq={seq} />
                <button className="btn btn-ghost btn-sm" onClick={() => stopWhatsAppSequence(company.id, !company.waSequenceStopped)}>
                  {company.waSequenceStopped ? "Reactivar secuencia" : "Detener secuencia"}
                </button>
              </div>
            )}

            <CotizacionesList items={company.cotizaciones} />

            {company.nota && <div className="note t-accent">{company.nota}</div>}

            {meetings.length > 0 && (
              <div>
                <div className="label">Reuniones</div>
                <div className="stack-sm">
                  {meetings.map((m) => (
                    <div key={m.id} className="tile row between" style={{ fontSize: 12.5 }}>
                      <span className="row" style={{ gap: 6 }}>
                        <Clock size={12} /> {fmtFecha(m.fecha)} {m.hora} — {m.notas || "sin notas"}
                        {m.syncStatus === "synced" && <Link2 size={12} color="var(--accent)" />}
                        {m.syncStatus === "syncing" && <RefreshCw size={12} className="spin" />}
                        {m.syncStatus === "error" && (
                          <button className="btn btn-ghost btn-sm" style={{ color: "var(--bad)", padding: "0 4px" }} onClick={() => retryMeetingSync(m)}>Reintentar sync</button>
                        )}
                      </span>
                      <button className="icon-btn" style={{ width: 24, height: 24 }} onClick={() => removeMeeting(m)} aria-label="Borrar reunión"><Trash2 size={12} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {timeline.length > 0 && (
              <div>
                <div className="row between"><span className="label">Últimos movimientos</span><button className="btn btn-ghost btn-sm" onClick={() => setTab("historial")}>Ver todo</button></div>
                <Timeline items={timeline.slice(0, 4)} />
              </div>
            )}
          </>
        )}

        {tab === "historial" && (timeline.length ? <Timeline items={timeline} /> : <EmptyNote>Sin movimientos todavía.</EmptyNote>)}

        {tab === "datos" && (
          <>
            <Field label="Razón social">{inp("empresa")}</Field>
            <Field label="Nombre de fantasía">{inp("nombreFantasia", { placeholder: "Nombre comercial, si es distinto" })}</Field>
            <div className="grid g2" style={{ gap: 10 }}>
              <Field label="CUIT">{inp("cuit", { placeholder: "30-12345678-9" })}</Field>
              <Field label="Rubro">{inp("rubro", { placeholder: "Ej: comercio, salud, construcción" })}</Field>
            </div>
            <Field label="Contacto">{inp("contacto", { placeholder: "Nombre y apellido" })}</Field>
            <div className="grid g2" style={{ gap: 10 }}>
              <Field label="Teléfono">{inp("telefono")}</Field>
              <Field label="Mail">{inp("mail")}</Field>
            </div>
            {company.fechaAlta && <div className="muted" style={{ fontSize: 12 }}>Fecha de alta: {fmtFecha(company.fechaAlta, { day: "2-digit", month: "2-digit", year: "numeric" })}</div>}
            <div className="divider" />
            <Btn variant="danger" icon={Trash2} onClick={() => askConfirm(`¿Eliminar ${company.empresa} de tu cartera?`, () => deleteCompany(company.id))}>Eliminar empresa</Btn>
          </>
        )}
      </div>
    </Drawer>
  );
}

function Timeline({ items }) {
  return (
    <div className="tl">
      {items.map((h, i) => {
        const t = tipoDe(h);
        const I = TIPOS_ACT[t]?.icon || PencilLine;
        const tone = t === "whatsapp" ? "t-good" : t === "propuesta" ? "t-warn" : t === "reunion" ? "t-info" : t === "llamada" ? "t-accent" : "";
        return (
          <div key={i} className="tl-item">
            <span className={"tl-dot " + tone}><I size={13} /></span>
            <div style={{ minWidth: 0, fontSize: 13 }}>
              <div style={{ color: "var(--ink)" }}>{h.texto}</div>
              <div className="muted" style={{ fontSize: 11.5 }}>{fmtFecha(h.fecha, { day: "2-digit", month: "short", year: "numeric" })} · {fmtRelativo(h.fecha)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ================================================= Registrar actividad ===

function LogActividadModal({ preset, companies, onClose, onSave }) {
  const [companyId, setCompanyId] = useState(preset.companyId || "");
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState(preset.tipo || "llamada");
  const [texto, setTexto] = useState(preset.texto || "");
  const c = companies.find((x) => x.id === companyId);
  const [proxima, setProxima] = useState("");
  const [fecha, setFecha] = useState(addDaysISO(3));
  const [stage, setStage] = useState("");
  const [programar, setProgramar] = useState(true);

  const sugerencias = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return [];
    return companies.filter((x) => x.empresa.toLowerCase().includes(q) || (x.contacto || "").toLowerCase().includes(q)).slice(0, 6);
  }, [busca, companies]);

  // Sugerencia de etapa según el tipo de actividad.
  useEffect(() => {
    if (!c) return;
    const i = STAGES.findIndex((s) => s.key === c.stage);
    const target = tipo === "propuesta" ? "propuesta" : tipo === "reunion" ? "reunion" : (tipo === "llamada" || tipo === "mail") && c.stage === "prospeccion" ? "contacto" : "";
    const ti = STAGES.findIndex((s) => s.key === target);
    setStage(target && ti > i && isOpen(c) ? target : "");
  }, [tipo, companyId]);

  return (
    <Modal title="Registrar actividad" onClose={onClose} width={520}>
      <div className="stack">
        {c ? (
          <div className="tile row between">
            <div>
              <div style={{ fontWeight: 700 }}>{c.empresa}</div>
              <div className="muted" style={{ fontSize: 12 }}>{STAGE_BY_KEY[c.stage]?.label}{c.contacto ? ` · ${c.contacto}` : ""}</div>
            </div>
            {!preset.companyId && <button className="btn btn-ghost btn-sm" onClick={() => setCompanyId("")}>Cambiar</button>}
          </div>
        ) : (
          <div>
            <span className="label">Empresa</span>
            <SearchBox value={busca} onChange={setBusca} placeholder="Escribí para buscar…" />
            <div className="stack-sm" style={{ marginTop: 6 }}>
              {sugerencias.map((x) => (
                <button key={x.id} className="item" onClick={() => { setCompanyId(x.id); setBusca(""); }}>
                  <Building2 size={14} /> <span style={{ fontWeight: 600 }}>{x.empresa}</span> <span className="muted" style={{ fontSize: 12 }}>{x.contacto}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <span className="label">Tipo</span>
          <div className="row wrap" style={{ gap: 6 }}>
            {TIPOS_LOG.map((t) => {
              const I = TIPOS_ACT[t].icon;
              return (
                <button key={t} className={"btn btn-sm " + (tipo === t ? "btn-primary" : "btn-outline")} onClick={() => setTipo(t)}>
                  <I size={13} /> {TIPOS_ACT[t].label}
                </button>
              );
            })}
          </div>
        </div>

        <Field label="Detalle (opcional)">
          <textarea className="textarea" rows={2} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Ej: atendió RRHH, son 18 empleados, pidió cotización 6500" />
        </Field>

        <div className="tile">
          <label className="row" style={{ gap: 8, fontWeight: 600, cursor: "pointer" }}>
            <input type="checkbox" checked={programar} onChange={(e) => setProgramar(e.target.checked)} /> Programar próxima acción
            {c && c.proximaAccion && <span className="muted" style={{ fontWeight: 500, fontSize: 12 }}>(reemplaza: “{c.proximaAccion}”)</span>}
          </label>
          {programar && (
            <>
              <div className="grid g2" style={{ gap: 10, marginTop: 10 }}>
                <Field label="Qué">
                  <input className="input" value={proxima} onChange={(e) => setProxima(e.target.value)} placeholder="Ej: enviar propuesta" />
                </Field>
                <Field label="Cuándo">
                  <input type="date" className="input" value={fecha} onChange={(e) => setFecha(e.target.value)} />
                </Field>
              </div>
              <QuickDates onPick={setFecha} />
            </>
          )}
        </div>

        {c && isOpen(c) && (
          <Field label="Mover a etapa">
            <select className="select full" value={stage} onChange={(e) => setStage(e.target.value)}>
              <option value="">Mantener en {STAGE_BY_KEY[c.stage]?.label}</option>
              {STAGES.filter((s) => s.key !== c.stage).map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </Field>
        )}

        <Btn
          variant="primary"
          icon={Check}
          disabled={!c}
          style={{ width: "100%" }}
          onClick={() =>
            onSave({
              companyId,
              tipo,
              texto: texto.trim(),
              programar,
              proximaAccion: proxima.trim() || (fecha ? "Seguimiento" : ""),
              fechaProximaAccion: fecha,
              stage,
            })
          }
        >
          Guardar {TIPOS_ACT[tipo].label.toLowerCase()}
        </Btn>
      </div>
    </Modal>
  );
}

function MotivoPerdidaModal({ company, onClose, onSave }) {
  const [motivo, setMotivo] = useState(company.motivoPerdida || MOTIVOS_PERDIDA[0]);
  const [detalle, setDetalle] = useState("");
  return (
    <Modal title={`¿Por qué se perdió ${company.empresa}?`} onClose={onClose}>
      <div className="stack">
        <div className="stack-sm">
          {MOTIVOS_PERDIDA.map((m) => (
            <label key={m} className="item" style={{ cursor: "pointer", borderColor: motivo === m ? "var(--accent)" : "transparent" }}>
              <input type="radio" name="motivo" checked={motivo === m} onChange={() => setMotivo(m)} /> {m}
            </label>
          ))}
        </div>
        <Field label="Detalle (opcional)">
          <input className="input" value={detalle} onChange={(e) => setDetalle(e.target.value)} placeholder="Ej: renovó con su prepaga por 12 meses" />
        </Field>
        <div className="muted" style={{ fontSize: 12 }}>Esto alimenta el indicador “Motivos de pérdida” para detectar patrones.</div>
        <Btn variant="primary" style={{ width: "100%" }} onClick={() => onSave(motivo, detalle.trim())}>Guardar motivo</Btn>
      </div>
    </Modal>
  );
}


// ================================================================ Agenda ===

function Agenda({ agenda, companies, setShowNewMeeting, removeMeeting, syncFromGoogle, gcalStatus, lastSynced, retryMeetingSync, pendingDeletions, retryDeletion, setSelectedId, setLogFor }) {
  const [verPasadas, setVerPasadas] = useState(false);
  const porDia = useMemo(() => {
    const g = new Map();
    agenda.upcoming.forEach((m) => {
      if (!g.has(m.fecha)) g.set(m.fecha, []);
      g.get(m.fecha).push(m);
    });
    return [...g.entries()];
  }, [agenda.upcoming]);
  const open = (m) => {
    const comp = companies.find((c) => c.id === m.companyId);
    if (comp) setSelectedId(comp.id);
  };

  return (
    <div className="stack">
      <PageHeader
        title="Agenda de reuniones"
        subtitle={HOSTED ? "Usá “Agregar a Google Calendar” en cada reunión para tenerla también en tu calendario" : `Se sincroniza con Google Calendar cada 30 minutos${lastSynced ? ` · última: ${lastSynced.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}` : ""}`}
      >
        {!HOSTED && <Btn icon={RefreshCw} onClick={syncFromGoogle} disabled={gcalStatus === "syncing"} className={gcalStatus === "syncing" ? "syncing" : ""}>
          {gcalStatus === "syncing" ? "Sincronizando…" : gcalStatus === "done" ? "¡Listo!" : gcalStatus === "error" ? "Error, reintentar" : "Traer de Google Calendar"}
        </Btn>}
        <Btn variant="primary" icon={Plus} onClick={() => setShowNewMeeting(true)}>Reunión</Btn>
      </PageHeader>

      {pendingDeletions.length > 0 && (
        <div className="note t-bad">
          <strong>{pendingDeletions.length === 1 ? "1 reunión no se pudo borrar" : `${pendingDeletions.length} reuniones no se pudieron borrar`} de Google Calendar</strong>
          {pendingDeletions.map((p) => (
            <div key={p.id} className="row between" style={{ marginTop: 4 }}>
              <span>{p.empresa}{p.error ? ` — ${p.error}` : ""}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => retryDeletion(p)}>Reintentar</button>
            </div>
          ))}
        </div>
      )}

      <div className="grid g3">
        <Kpi icon={CalIcon} label="Hoy" value={agenda.hoy.length} sub="reuniones" />
        <Kpi icon={Clock} label="Próximos 7 días" value={agenda.upcoming.filter((m) => m.fecha <= addDaysISO(7)).length} sub="reuniones" tone="info" />
        <Kpi icon={CheckCircle2} label="Últimos 30 días" value={agenda.past.filter((m) => m.fecha >= addDaysISO(-30)).length} sub="reuniones realizadas" tone="good" />
      </div>

      <Card title="Próximas" icon={CalIcon}>
        {porDia.length === 0 ? (
          <EmptyNote>Sin reuniones agendadas.</EmptyNote>
        ) : (
          <div className="stack">
            {porDia.map(([fecha, ms]) => (
              <div key={fecha}>
                <div className="label" style={{ textTransform: "capitalize" }}>
                  {fmtFecha(fecha, { weekday: "long", day: "numeric", month: "long" })} <span className="muted" style={{ fontWeight: 500, textTransform: "none" }}>· {fmtRelativo(fecha)}</span>
                </div>
                <div className="stack-sm">
                  {ms.map((m) => <MeetingRow key={m.id} m={m} onClick={() => open(m)} onDelete={() => removeMeeting(m)} onRetry={() => retryMeetingSync(m)} />)}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title={`Pasadas (${agenda.past.length})`} icon={Clock} action={<button className="btn btn-ghost btn-sm" onClick={() => setVerPasadas((v) => !v)}>{verPasadas ? "Ocultar" : "Mostrar"}</button>}>
        {verPasadas &&
          (agenda.past.length === 0 ? (
            <EmptyNote>Sin historial todavía.</EmptyNote>
          ) : (
            <div className="stack-sm">
              {agenda.past.slice(0, 60).map((m) => (
                <MeetingRow key={m.id} m={m} past onClick={() => open(m)} onDelete={() => removeMeeting(m)} onRetry={() => retryMeetingSync(m)} onLog={m.companyId ? () => setLogFor({ companyId: m.companyId, tipo: "reunion" }) : null} />
              ))}
            </div>
          ))}
      </Card>
    </div>
  );
}

function MeetingRow({ m, past, onClick, onDelete, onRetry, onLog }) {
  return (
    <div className="item" style={{ opacity: past ? 0.75 : 1, cursor: "default" }}>
      <span className={"chip tnum " + (past ? "t-neutral" : "t-warn")} style={{ fontSize: 12.5 }}>
        {past ? fmtFecha(m.fecha) + " " : ""}{m.hora}
      </span>
      <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={onClick}>
        <div className="row" style={{ gap: 6, fontWeight: 600 }}>
          {m.empresa}
          {m.syncStatus === "synced" && <Link2 size={12} color="var(--accent)" aria-label="sincronizada" />}
          {m.syncStatus === "syncing" && <RefreshCw size={12} className="spin" />}
          {m.syncStatus === "error" && <XCircle size={12} color="var(--bad)" />}
        </div>
        {m.notas && <div className="muted" style={{ fontSize: 12 }}>{m.notas}</div>}
        {m.syncStatus === "error" && (
          <div style={{ fontSize: 12, color: "var(--bad)" }}>
            No se sincronizó con Google Calendar{m.syncError ? `: ${m.syncError}` : ""}{" "}
            <button className="btn btn-ghost btn-sm" style={{ color: "var(--bad)", padding: "0 4px" }} onClick={(e) => { e.stopPropagation(); onRetry && onRetry(); }}>Reintentar</button>
          </div>
        )}
      </div>
      {onLog && <Btn size="sm" variant="soft" onClick={onLog}>Registrar resultado</Btn>}
      {HOSTED && !past && (
        <a className="btn btn-outline btn-sm" href={gcalTemplateLink(m)} target="_blank" rel="noreferrer" title="Agregar a Google Calendar">
          <CalIcon size={13} /> Google Calendar
        </a>
      )}
      <button className="icon-btn" onClick={onDelete} aria-label="Borrar reunión"><Trash2 size={13} /></button>
    </div>
  );
}

function NewMeetingModal({ companies, preselectedId, onClose, onSave }) {
  const [companyId, setCompanyId] = useState(preselectedId || "");
  const [busca, setBusca] = useState("");
  const [form, setForm] = useState({ fecha: addDaysISO(1), hora: "10:00", notas: "" });
  const [syncToGoogle, setSyncToGoogle] = useState(true);
  const comp = companies.find((c) => c.id === companyId);
  const sugerencias = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return [];
    return companies.filter((c) => c.empresa.toLowerCase().includes(q) || (c.contacto || "").toLowerCase().includes(q)).slice(0, 6);
  }, [busca, companies]);

  return (
    <Modal title="Agendar reunión" onClose={onClose}>
      <div className="stack">
        {comp ? (
          <div className="tile row between">
            <span style={{ fontWeight: 700 }}>{comp.empresa}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setCompanyId("")}>Cambiar</button>
          </div>
        ) : (
          <div>
            <span className="label">Empresa (opcional)</span>
            <SearchBox value={busca} onChange={setBusca} placeholder="Buscar empresa…" />
            <div className="stack-sm" style={{ marginTop: 6 }}>
              {sugerencias.map((c) => (
                <button key={c.id} className="item" onClick={() => { setCompanyId(c.id); setBusca(""); }}>
                  <Building2 size={14} /> {c.empresa}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="grid g2" style={{ gap: 10 }}>
          <Field label="Fecha"><input type="date" className="input" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} /></Field>
          <Field label="Hora"><input type="time" className="input" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} /></Field>
        </div>
        <QuickDates onPick={(d) => setForm({ ...form, fecha: d })} />
        <Field label="Notas"><input className="input" value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} placeholder="Ej: presentación de planes con RRHH" /></Field>
        <label className="row" style={{ gap: 8, fontSize: 13, cursor: "pointer" }}>
          <input type="checkbox" checked={syncToGoogle} onChange={(e) => setSyncToGoogle(e.target.checked)} /> {HOSTED ? "Abrir Google Calendar para guardarla también ahí" : "Crear también en Google Calendar"}
        </label>
        {comp && ["prospeccion", "contacto"].includes(comp.stage) && <div className="note t-accent">La empresa pasa automáticamente a “Reunión Agendada”.</div>}
        <Btn
          variant="primary"
          icon={CalIcon}
          disabled={!comp && !form.notas.trim()}
          style={{ width: "100%" }}
          onClick={() => onSave({ ...form, companyId: comp ? comp.id : "", empresa: comp ? comp.empresa : form.notas || "Reunión" }, syncToGoogle)}
        >
          Agendar
        </Btn>
      </div>
    </Modal>
  );
}

// ======================================================= Campaña B2B (WA) ===

function Campaign({ companies, setSelectedId, setShowWhatsApp, waLog }) {
  const [tierFilter, setTierFilter] = useState("caliente");
  const [stageFilter, setStageFilter] = useState("todos");
  const [onlyDue, setOnlyDue] = useState(true);
  const [index, setIndex] = useState(0);
  const waGate = useWaGate(waLog);

  const withSeq = useMemo(
    () =>
      companies
        .filter((c) => isOpen(c) && !!c.telefono)
        .filter((c) => tierFilter === "todos" || c.tier === tierFilter)
        .filter((c) => stageFilter === "todos" || c.stage === stageFilter)
        .map((c) => ({ company: c, seq: getSequenceStatus(c) })),
    [companies, tierFilter, stageFilter]
  );
  const queue = useMemo(() => {
    const base = onlyDue ? withSeq.filter((x) => x.seq.status === "due") : withSeq.filter((x) => x.seq.status !== "stopped" && x.seq.status !== "completed");
    const order = { due: 0, waiting: 1, completed: 2, stopped: 3 };
    // Primero los seguimientos (ya hubo contacto), después los primeros mensajes.
    return [...base].sort((a, b) => order[a.seq.status] - order[b.seq.status] || (a.seq.step?.key === "variante_a") - (b.seq.step?.key === "variante_a") || (a.seq.dueDate && b.seq.dueDate ? a.seq.dueDate - b.seq.dueDate : 0));
  }, [withSeq, onlyDue]);
  useEffect(() => setIndex(0), [tierFilter, stageFilter, onlyDue]);
  const current = queue[index];
  const dueCount = withSeq.filter((x) => x.seq.status === "due").length;
  const restantesHoy = Math.max(0, WA_DAILY_HARD_LIMIT - waGate.enviadosHoy);

  return (
    <div className="stack">
      <PageHeader title="Campaña de WhatsApp" subtitle={`${dueCount} empresas listas para el próximo mensaje · secuencia: Variante A → Seguimiento 1 (+2 d) → Seguimiento 2 (+7 d)`}>
        <div className="seg">
          {[["caliente", "Calientes"], ["tibio", "Tibias"], ["todos", "Todas"]].map(([k, l]) => (
            <button key={k} className={tierFilter === k ? "on" : ""} onClick={() => setTierFilter(k)}>{l}</button>
          ))}
        </div>
        <select className="select" value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
          <option value="todos">Toda etapa</option>
          {STAGES.filter((s) => !["ganado", "perdido"].includes(s.key)).map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <label className="row ink2" style={{ gap: 6, fontSize: 12.5, cursor: "pointer" }}>
          <input type="checkbox" checked={onlyDue} onChange={(e) => setOnlyDue(e.target.checked)} /> Solo listas para enviar
        </label>
      </PageHeader>

      <div className="grid g3">
        <Card className="span2" title={queue.length ? `Contacto ${Math.min(index + 1, queue.length)} de ${queue.length}` : "Cola vacía"} icon={Megaphone}>
          {!current ? (
            <EmptyNote>{onlyDue ? "No hay empresas listas para el próximo mensaje con este filtro." : "No hay empresas con teléfono que coincidan con el filtro."}</EmptyNote>
          ) : (
            <div className="stack">
              <div className="row between" style={{ alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>{current.company.empresa}</div>
                  <div className="muted">{current.company.contacto} · {current.company.telefono}</div>
                </div>
                <div className="stack-sm" style={{ textAlign: "right" }}>
                  <div><TierBadge tier={current.company.tier} /></div>
                  <div><SequenceBadge seq={current.seq} /></div>
                </div>
              </div>
              {current.company.nota && <div className="note t-accent">{current.company.nota}</div>}
              <div className="row wrap">
                <Btn variant="wa" icon={MessageCircle} onClick={() => setShowWhatsApp(current.company.id)}>Enviar WhatsApp</Btn>
                <Btn onClick={() => setSelectedId(current.company.id)}>Ver ficha</Btn>
                <Btn variant="ghost" icon={SkipForward} style={{ marginLeft: "auto" }} onClick={() => setIndex((i) => Math.min(i + 1, queue.length))}>Saltar</Btn>
              </div>
            </div>
          )}
        </Card>
        <Card title="Cupo de hoy" icon={Timer}>
          <div className="row" style={{ alignItems: "baseline", gap: 6 }}>
            <span className="tnum" style={{ fontSize: 32, fontWeight: 800 }}>{restantesHoy}</span>
            <span className="muted">mensajes disponibles</span>
          </div>
          <ProgressBar value={waGate.enviadosHoy} max={WA_DAILY_HARD_LIMIT} tone={waGate.superoLimite ? "bad" : undefined} />
          <div style={{ marginTop: 10 }}><WaGateBanner waGate={waGate} /></div>
        </Card>
      </div>

      {queue.length > 0 && (
        <Card title="Resto de la cola" icon={ClipboardList}>
          <div className="stack-sm">
            {queue.slice(0, 80).map((x, i) => (
              <div key={x.company.id} className="item" style={{ opacity: i === index ? 1 : 0.85, borderColor: i === index ? "var(--accent)" : "transparent" }} onClick={() => setIndex(i)}>
                <span className="tnum muted" style={{ width: 26, fontSize: 12 }}>{i + 1}</span>
                <span style={{ fontWeight: 600, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{x.company.empresa}</span>
                <TierBadge tier={x.company.tier} />
                <SequenceBadge seq={x.seq} />
                <button className="icon-btn wa" onClick={(e) => { e.stopPropagation(); setShowWhatsApp(x.company.id); }} aria-label="Enviar WhatsApp"><MessageCircle size={14} /></button>
              </div>
            ))}
            {queue.length > 80 && <div className="muted" style={{ fontSize: 12 }}>y {queue.length - 80} más.</div>}
          </div>
        </Card>
      )}
    </div>
  );
}

function WaGateBanner({ waGate }) {
  if (waGate.superoLimite) {
    return <div className="note t-bad">🛑 Ya enviaste {waGate.enviadosHoy} WhatsApp hoy: llegaste al máximo recomendado mientras tu cuenta se recupera de restricciones recientes. Seguí mañana.</div>;
  }
  if (waGate.msRestantesCooldown > 0) {
    const seg = Math.ceil(waGate.msRestantesCooldown / 1000);
    return <div className="note t-warn">⏳ Dejá al menos {WA_COOLDOWN_MS / 60000} minutos entre envíos para que WhatsApp no lo detecte como spam. Podés enviar en {Math.floor(seg / 60)}:{pad2(seg % 60)}.</div>;
  }
  return <div className="note t-good">Podés enviar el próximo mensaje · {waGate.enviadosHoy} de {WA_DAILY_HARD_LIMIT} hoy.</div>;
}

function WhatsAppModal({ company, onClose, onSent, onStopSequence, waLog, vars }) {
  const seq = getSequenceStatus(company);
  const initialStepKey = seq.step ? seq.step.key : seq.status === "completed" ? WHATSAPP_SEQUENCE[WHATSAPP_SEQUENCE.length - 1].key : WHATSAPP_SEQUENCE[0].key;
  const nombre = capitalizar(getFirstName(company.contacto));
  const build = (k) => fillVars((WHATSAPP_SEQUENCE.find((s) => s.key === k) || WHATSAPP_SEQUENCE[0]).text, { ...vars, nombre, empresa: company.empresa });
  const [stepKey, setStepKey] = useState(initialStepKey);
  const [phone, setPhone] = useState(normalizePhoneAR(company.telefono));
  const [message, setMessage] = useState(build(initialStepKey));
  const [sent, setSent] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const waGate = useWaGate(waLog);

  return (
    <Modal title={`WhatsApp · ${company.empresa}`} onClose={onClose} width={540}>
      <div className="stack">
        <WaGateBanner waGate={waGate} />
        {seq.status === "stopped" && (
          <div className="note t-neutral row between">
            <span>Secuencia detenida para esta empresa.</span>
            <button className="btn btn-ghost btn-sm" onClick={() => onStopSequence(false)}>Reactivar</button>
          </div>
        )}
        {seq.status === "completed" && <div className="note t-accent">Ya se enviaron los 3 mensajes de la secuencia. Podés reenviar cualquiera si querés retomar el contacto.</div>}
        {seq.status === "waiting" && <div className="note t-warn">El próximo paso (“{seq.step.label}”) está recomendado desde el {seq.dueDate.toLocaleDateString("es-AR")}. Podés enviarlo antes igual.</div>}

        <div>
          <span className="label">Paso de la secuencia</span>
          <div className="seg" style={{ width: "100%" }}>
            {WHATSAPP_SEQUENCE.map((s) => (
              <button key={s.key} style={{ flex: 1 }} className={stepKey === s.key ? "on" : ""} onClick={() => { setStepKey(s.key); setMessage(build(s.key)); }}>
                {s.label}{seq.step && seq.step.key === s.key && seq.status !== "stopped" ? " ★" : ""}
              </button>
            ))}
          </div>
        </div>
        <Field label="Número (formato internacional, solo dígitos)">
          <input className="input tnum" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ""))} placeholder="Ej: 5492611234567" />
        </Field>
        <Field label={`Mensaje · {Nombre} = “${nombre || "sin nombre"}”`}>
          <textarea className="textarea" rows={7} value={message} onChange={(e) => setMessage(e.target.value)} />
        </Field>
        <Btn
          variant="wa"
          icon={MessageCircle}
          style={{ width: "100%" }}
          disabled={!phone || sent || !waGate.puedeEnviar}
          onClick={() => {
            if (!phone || !waGate.puedeEnviar) return;
            window.open(buildWaLink(phone, message), "_blank");
            onSent(stepKey);
            setSent(true);
          }}
        >
          {sent ? "Abierto en WhatsApp ✓" : waGate.superoLimite ? "Límite diario alcanzado" : !waGate.puedeEnviar ? `Esperá ${Math.ceil(waGate.msRestantesCooldown / 1000)} s` : `Abrir WhatsApp (${WHATSAPP_SEQUENCE.find((s) => s.key === stepKey).label})`}
        </Btn>
        <Btn icon={Copy} style={{ width: "100%" }} onClick={async () => { if (await copiarTexto(message)) { setCopiado(true); setTimeout(() => setCopiado(false), 2500); } }}>
          {copiado ? "Copiado ✓" : "Copiar mensaje (para enviar a mano)"}
        </Btn>
        {sent && (
          <div className="muted" style={{ textAlign: "center", fontSize: 12.5 }}>
            Se registró el envío en el historial.{" "}
            {seq.status !== "stopped" && <button className="btn btn-ghost btn-sm" style={{ color: "var(--bad)" }} onClick={() => onStopSequence(true)}>Ya respondió · detener secuencia</button>}
          </div>
        )}
      </div>
    </Modal>
  );
}

function NewCompanyModal({ onClose, onSave }) {
  const [form, setForm] = useState({ empresa: "", cuit: "", contacto: "", telefono: "", mail: "", rubro: "", capitas: "", tier: "caliente", nota: "" });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  return (
    <Modal title="Nueva empresa" onClose={onClose}>
      <div className="stack">
        <Field label="Razón social *"><input className="input" autoFocus value={form.empresa} onChange={set("empresa")} /></Field>
        <div className="grid g2" style={{ gap: 10 }}>
          <Field label="CUIT"><input className="input" value={form.cuit} onChange={set("cuit")} placeholder="30-12345678-9" /></Field>
          <Field label="Rubro"><input className="input" value={form.rubro} onChange={set("rubro")} /></Field>
        </div>
        <Field label="Contacto"><input className="input" value={form.contacto} onChange={set("contacto")} placeholder="Nombre y apellido" /></Field>
        <div className="grid g2" style={{ gap: 10 }}>
          <Field label="Teléfono"><input className="input" value={form.telefono} onChange={set("telefono")} /></Field>
          <Field label="Mail"><input className="input" value={form.mail} onChange={set("mail")} /></Field>
        </div>
        <div className="grid g2" style={{ gap: 10 }}>
          <Field label="Cápitas estimadas"><input className="input" type="number" min="0" value={form.capitas} onChange={set("capitas")} /></Field>
          <Field label="Prioridad">
            <select className="select full" value={form.tier} onChange={set("tier")}>
              <option value="caliente">Caliente</option>
              <option value="tibio">Tibio</option>
            </select>
          </Field>
        </div>
        <Field label="Nota / origen del lead"><input className="input" value={form.nota} onChange={set("nota")} placeholder="Ej: referido por cliente X" /></Field>
        <Btn variant="primary" disabled={!form.empresa.trim()} style={{ width: "100%" }} onClick={() => onSave({ ...form, empresa: form.empresa.trim() })}>Guardar empresa</Btn>
      </div>
    </Modal>
  );
}

// ============================================================= Cotizador ===

function Cotizador({ companies, settings, presetCompanyId, guardarCotizacion, showToast, vars }) {
  const vacio = { "00-25": 0, "26-35": 0, "36-54": 0, "55-59": 0, "60+": 0, hijo1: 0, hijo2: 0 };
  const [cant, setCant] = useState(vacio);
  const [descuento, setDescuento] = useState(settings.descuento ?? CAMPANA.descuento);
  const [iva, setIva] = useState(0);
  const [planSel, setPlanSel] = useState("");
  const [verNoDisp, setVerNoDisp] = useState(false);
  const [companyId, setCompanyId] = useState(presetCompanyId || "");
  const [busca, setBusca] = useState("");
  const [moverPropuesta, setMoverPropuesta] = useState(true);
  const comp = companies.find((c) => c.id === companyId);
  const meses = settings.mesesCampana || CAMPANA.meses;
  const [provincia, setProvincia] = useState(settings.provincia || "Mendoza");
  const PLANES = planesDeProvincia(provincia);

  useEffect(() => {
    if (presetCompanyId) setCompanyId(presetCompanyId);
  }, [presetCompanyId]);

  const f = 1 + num(iva) / 100;
  const res = PLANES.map((p) => {
    const r = cotizar(p, cant, descuento);
    return { ...r, lista: r.lista * f, desc: r.desc * f, total: r.total * f, porCapita: r.porCapita * f };
  });
  const capitas = res.length ? res[0].capitas : 0;
  const tramo = res.length ? res[0].tramo : "1 a 10";
  const disponibles = res.filter((r) => r.disponible).sort((x, y) => x.total - y.total);
  const noDisponibles = res.filter((r) => !r.disponible);
  const sel = disponibles.find((r) => r.plan.plan === planSel) || disponibles[0] || null;
  const minPrecio = disponibles.length ? disponibles[0].total : 0;
  const nombre = comp ? capitalizar(getFirstName(comp.contacto)) : "";

  const beneficios = sel
    ? sel.plan.tipo === "PYME" && PYME_EXTRA[sel.plan.plan]
      ? [`Farmacia ${PYME_EXTRA[sel.plan.plan].farmacia}`, "Óptica, ortodoncia sin límite de edad y check-up anual", `Asistencia al viajero ${PYME_EXTRA[sel.plan.plan].modulo}`]
      : sel.plan.bullets.slice(0, 3)
    : [];
  const texto = sel
    ? `Hola${nombre ? " " + nombre : ""}! Te paso la cotización de OMINT${comp ? ` para ${comp.empresa}` : ""}:

• Plan ${sel.plan.plan} (línea ${sel.plan.linea}${sel.plan.tipo !== "Estándar" ? ` · ${sel.plan.tipo}` : ""}) — ${capitas} cápitas
• Valor de lista: ${money(sel.lista)}/mes
${num(descuento) ? `• Campaña: ${descuento}% de descuento durante ${meses} meses: −${money(sel.desc)}
` : ""}• *Total mensual: ${money(sel.total)}* (≈ ${money(sel.porCapita)} por cápita)
${num(descuento) ? `Desde el mes ${meses + 1} se aplica el valor de lista vigente.
` : ""}
${beneficios.map((b) => `✓ ${b}`).join("\n")}

${num(iva) ? `Valores con IVA ${iva}% incluido.` : "Valores sin IVA."} ${LISTA_PRECIOS} · ${provincia}. Sujeto a aprobación.

¿Coordinamos 15 minutos para revisarla juntos?
${vars.asesor} · OMINT`
    : "";

  const busqueda = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return [];
    return companies.filter((c) => c.empresa.toLowerCase().includes(q)).slice(0, 6);
  }, [busca, companies]);

  const setN = (k, v) => setCant((p) => ({ ...p, [k]: Math.max(0, Math.round(num(v))) }));
  const payload = () => ({ plan: sel.plan.plan, capitas, total: sel.total, lista: sel.lista, descuento, meses, detalle: cant });

  return (
    <div className="stack">
      <PageHeader title="Cotizador rápido" subtitle={`${LISTA_PRECIOS} · ${provincia}: ${PLANES.length} planes · campaña ${descuento}% por ${meses} meses`}>
        <select className="select" value={provincia} onChange={(e) => setProvincia(e.target.value)} aria-label="Provincia">
          {PROVINCIAS.map((p) => <option key={p}>{p}</option>)}
        </select>
        <Btn icon={RefreshCw} onClick={() => setCant(vacio)}>Limpiar</Btn>
      </PageHeader>

      <div className="grid g3">
        <Card title="Composición del grupo" icon={Users}>
          <div className="stack-sm">
            {FRANJAS.map((fr) => (
              <div key={fr.key} className="row between">
                <span className="ink2" style={{ fontSize: 13 }}>{fr.label}</span>
                <div className="row" style={{ gap: 4 }}>
                  <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => setN(fr.key, cant[fr.key] - 1)} aria-label={`Restar ${fr.label}`}>−</button>
                  <input className="input tnum" style={{ width: 56, textAlign: "center", padding: "5px 4px" }} type="number" min="0" value={cant[fr.key]} onChange={(e) => setN(fr.key, e.target.value)} aria-label={fr.label} />
                  <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => setN(fr.key, cant[fr.key] + 1)} aria-label={`Sumar ${fr.label}`}>+</button>
                </div>
              </div>
            ))}
          </div>
          <div className="muted" style={{ fontSize: 11.5, marginTop: 6 }}>Titulares incluye cónyuges, familiares a cargo e hijos de 25 años o más (según la lista).</div>
          <div className="divider" />
          <div className="grid g2" style={{ gap: 10 }}>
            <Field label={`Descuento % (${meses} meses)`}><input className="input tnum" type="number" min="0" max="100" value={descuento} onChange={(e) => setDescuento(num(e.target.value))} /></Field>
            <Field label="IVA % (lista sin IVA)"><input className="input tnum" type="number" min="0" value={iva} onChange={(e) => setIva(num(e.target.value))} /></Field>
          </div>
          <div className="row between" style={{ marginTop: 12 }}>
            <span style={{ fontWeight: 700 }}>Total cápitas</span>
            <span className="tnum" style={{ fontSize: 22, fontWeight: 800 }}>{capitas}</span>
          </div>
          {capitas > 0 && <div className="muted" style={{ fontSize: 12, textAlign: "right" }}>Tramo {tramo} cápitas</div>}
          {capitas >= 200 && <div className="note t-warn" style={{ marginTop: 8 }}>Desde 200 cápitas los valores se consultan con Producto.</div>}
        </Card>

        <div className="span2 stack">
          <Card
            title={capitas ? `${disponibles.length} planes disponibles para ${capitas} cápitas` : "Planes"}
            icon={Stethoscope}
            pad={false}
            action={noDisponibles.length > 0 && capitas > 0 && <button className="btn btn-ghost btn-sm" onClick={() => setVerNoDisp((v) => !v)}>{verNoDisp ? "Ocultar" : "Ver"} no disponibles ({noDisponibles.length})</button>}
          >
            {!capitas ? (
              <EmptyNote>{PLANES.length ? `Cargá la composición del grupo para ver los ${PLANES.length} planes de ${provincia}.` : "No hay lista de precios cargada en este archivo."}</EmptyNote>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="tbl">
                  <thead>
                    <tr><th></th><th>Plan</th><th>Línea</th><th style={{ textAlign: "right" }}>Lista</th><th style={{ textAlign: "right" }}>Con {descuento}%</th><th style={{ textAlign: "right" }}>Por cápita</th></tr>
                  </thead>
                  <tbody>
                    {disponibles.map((r) => {
                      const on = sel && sel.plan.plan === r.plan.plan;
                      return (
                        <tr key={r.plan.plan} className="click" onClick={() => setPlanSel(r.plan.plan)} style={{ background: on ? "var(--accent-soft)" : undefined }}>
                          <td style={{ width: 28 }}><input type="radio" checked={!!on} onChange={() => setPlanSel(r.plan.plan)} aria-label={`Elegir ${r.plan.plan}`} /></td>
                          <td className="strong">
                            {r.plan.plan} {r.total === minPrecio && <Chip tone="good">Más económico</Chip>}
                          </td>
                          <td>{r.plan.linea}{r.plan.tipo !== "Estándar" ? <span className="muted"> · {r.plan.tipo}</span> : ""}</td>
                          <td className="tnum" style={{ textAlign: "right", textDecoration: r.desc > 0 ? "line-through" : "none" }}>{money(r.lista)}</td>
                          <td className="tnum strong" style={{ textAlign: "right" }}>{money(r.total)}</td>
                          <td className="tnum" style={{ textAlign: "right" }}>{money(r.porCapita)}</td>
                        </tr>
                      );
                    })}
                    {verNoDisp &&
                      noDisponibles.map((r) => (
                        <tr key={r.plan.plan} style={{ opacity: 0.6 }}>
                          <td></td>
                          <td>{r.plan.plan}</td>
                          <td>{r.plan.linea}{r.plan.tipo !== "Estándar" ? ` · ${r.plan.tipo}` : ""}</td>
                          <td colSpan={3} style={{ textAlign: "right" }}>{r.motivo}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {disponibles.length === 0 && <EmptyNote>Ningún plan de la lista aplica para {capitas} cápitas. {noDisponibles[0]?.motivo}</EmptyNote>}
              </div>
            )}
          </Card>

          <Card title="Propuesta para enviar" icon={FileText} action={<Btn size="sm" icon={Copy} disabled={!sel} onClick={async () => showToast((await copiarTexto(texto)) ? "✓ Propuesta copiada" : "No se pudo copiar")}>Copiar</Btn>}>
            <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 13, margin: 0, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: 12, color: "var(--ink)" }}>
              {sel ? texto : "Cargá la composición del grupo y elegí un plan para generar la propuesta."}
            </pre>
            <div className="divider" />
            {comp ? (
              <div className="row wrap">
                <div className="tile row" style={{ gap: 8, flex: 1, minWidth: 220 }}>
                  <Building2 size={15} />
                  <span style={{ fontWeight: 700 }}>{comp.empresa}</span>
                  <StageChip stage={comp.stage} />
                  {!presetCompanyId && <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }} onClick={() => setCompanyId("")}>Cambiar</button>}
                </div>
                <label className="row ink2" style={{ gap: 6, fontSize: 12.5, cursor: "pointer" }}>
                  <input type="checkbox" checked={moverPropuesta} onChange={(e) => setMoverPropuesta(e.target.checked)} /> Pasar a “Propuesta Enviada”
                </label>
                {comp.telefono && sel && (
                  <a className="btn btn-wa" href={buildWaLink(normalizePhoneAR(comp.telefono), texto)} target="_blank" rel="noreferrer" onClick={() => guardarCotizacion(comp.id, payload(), moverPropuesta)}>
                    <MessageCircle size={15} /> Enviar y guardar
                  </a>
                )}
                <Btn variant="primary" icon={Save} disabled={!sel} onClick={() => guardarCotizacion(comp.id, payload(), moverPropuesta)}>
                  Guardar en la ficha
                </Btn>
              </div>
            ) : (
              <div>
                <span className="label">Asociar a una empresa para guardar la cotización</span>
                <SearchBox value={busca} onChange={setBusca} placeholder="Buscar empresa…" />
                <div className="stack-sm" style={{ marginTop: 6 }}>
                  {busqueda.map((c) => (
                    <button key={c.id} className="item" onClick={() => { setCompanyId(c.id); setBusca(""); }}>
                      <Building2 size={14} /> {c.empresa}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Card>
          <div className="note t-warn">Valores de referencia para la conversación de venta. Antes de confirmar un monto o cobertura puntual, verificá el cuadro oficial o el sistema.</div>
        </div>
      </div>
    </div>
  );
}

// ============================================= Cotizador oficial (web) ===

// "Apellido, Nombre" -> "Nombre Apellido" para encabezar la cotización.
function nombreLegible(n) {
  const s = (n || "").trim();
  if (!s.includes(",")) return s;
  const [ap, no] = s.split(",");
  return `${(no || "").trim()} ${ap.trim()}`.trim();
}

function CotizadorView(props) {
  const modo = props.vista || (HOSTED ? "oficial" : "rapido");
  const setModo = props.setVista || (() => {});
  const presetCompanyId = props.preset && props.preset.tipo === "empresa" ? props.preset.id : null;
  if (!HOSTED) return <Cotizador {...props} presetCompanyId={presetCompanyId} />;
  const n = props.cotSync ? props.cotSync.pendientes.length : 0;
  return (
    <div className="stack">
      <div className="seg">
        <button className={modo === "oficial" ? "on" : ""} onClick={() => setModo("oficial")}>Cotizador Omint</button>
        <button className={modo === "pendientes" ? "on" : ""} onClick={() => setModo("pendientes")}>
          Por vincular{n ? ` (${n})` : ""}
        </button>
        <button className={modo === "rapido" ? "on" : ""} onClick={() => setModo("rapido")}>Cálculo rápido PYME</button>
      </div>
      {modo === "oficial" && <CotizadorOficial {...props} />}
      {modo === "pendientes" && <CotizacionesPorVincular {...props} />}
      {modo === "rapido" && <Cotizador {...props} presetCompanyId={presetCompanyId} />}
    </div>
  );
}

// Cotizaciones hechas con tu usuario en el Cotizador Omint que todavía no están
// en ninguna ficha. Las que coinciden con una sola ficha se guardan solas.
function CotizacionesPorVincular({ cotSync, sincronizarCotizador, conectarCotizador, vincularCotizacion, crearDesdeCotizacion, ignorarCotizacion, companies, personas, cotBase, detectarCotizador }) {
  const [u, setU] = useState("");
  const [c, setC] = useState("");
  const [err, setErr] = useState("");
  const [conectando, setConectando] = useState(false);
  const [buscando, setBuscando] = useState(null); // id de la cotización en la que se busca ficha
  const [q, setQ] = useState("");
  const est = cotSync.estado;
  // Al abrir la bandeja: si ya hay sesión del cotizador en este navegador, sincroniza.
  useEffect(() => {
    let hay = false;
    try {
      hay = !!localStorage.getItem("cot_omint_token");
    } catch (e) {
      hay = false;
    }
    if (hay && (est === "desconectado" || est === "inicial")) sincronizarCotizador();
  }, []);

  const resultados = useMemo(() => {
    const t = stripAccents(q.trim().toLowerCase());
    if (t.length < 2 || !buscando) return [];
    const m = (s) => stripAccents((s || "").toLowerCase()).includes(t);
    const cot = cotSync.pendientes.find((x) => x.id === buscando);
    const empresas = companies.filter((x) => m(x.empresa) || m(x.nombreFantasia) || (x.cuit || "").includes(t)).slice(0, 6).map((x) => ({ tipo: "empresa", id: x.id, label: x.empresa, hint: STAGE_BY_KEY[x.stage]?.label }));
    const pers = personas.filter((x) => m(x.nombre) || (x.telefono || "").includes(t)).slice(0, 6).map((x) => ({ tipo: "persona", id: x.id, label: x.nombre, hint: x.obraSocial || "Paciente" }));
    return cot && cot.tipo === "empresa" ? [...empresas, ...pers] : [...pers, ...empresas];
  }, [q, buscando, companies, personas, cotSync.pendientes]);

  if (est === "no-encontrado" || (cotBase && cotBase.estado === "no")) {
    return (
      <CotizadorNoEncontrado
        cotBase={cotBase}
        detectarCotizador={async (u) => {
          if (await detectarCotizador(u)) sincronizarCotizador(true);
        }}
      />
    );
  }

  if (est === "desconectado" || est === "inicial") {
    return (
      <Card title="Conectar con el Cotizador Omint" icon={Link2}>
        <div className="stack" style={{ maxWidth: 460 }}>
          <div className="muted">
            Conectá tu usuario del cotizador una sola vez: el CRM trae solas las cotizaciones que hagas (también desde el celular o fuera del CRM) y las guarda en la ficha de cada cliente para que le hagas seguimiento.
          </div>
          <form
            className="stack"
            onSubmit={async (e) => {
              e.preventDefault();
              setConectando(true);
              setErr("");
              try {
                await conectarCotizador(u, c);
              } catch (ex) {
                setErr(ex.message);
              }
              setConectando(false);
            }}
          >
            <div className="grid g2" style={{ gap: 10 }}>
              <Field label="Usuario del cotizador"><input className="input" value={u} onChange={(e) => setU(e.target.value)} autoComplete="username" /></Field>
              <Field label="Contraseña"><input className="input" type="password" value={c} onChange={(e) => setC(e.target.value)} autoComplete="current-password" /></Field>
            </div>
            {err && <div className="note t-bad">{err}</div>}
            <Btn variant="primary" icon={Link2} type="submit" disabled={!u || !c || conectando}>{conectando ? "Conectando…" : "Conectar"}</Btn>
          </form>
        </div>
      </Card>
    );
  }

  return (
    <div className="stack">
      <div className="row between wrap">
        <div>
          <h1>Cotizaciones por vincular</h1>
          <div className="sub">
            Hechas con tu usuario en el Cotizador Omint y sin ficha en el CRM. Las que coinciden con una sola empresa o paciente se guardan solas.
            {cotSync.ultima && ` · Revisado ${cotSync.ultima.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`}
          </div>
        </div>
        <Btn icon={RefreshCw} onClick={() => sincronizarCotizador(true)} disabled={est === "sincronizando"}>{est === "sincronizando" ? "Revisando…" : "Revisar ahora"}</Btn>
      </div>
      {est === "error" && <div className="note t-bad">No se pudo conectar con el cotizador: {cotSync.error}</div>}
      {cotSync.pendientes.length === 0 ? (
        <Card><EmptyNote>✓ No hay cotizaciones pendientes. Todo lo que cotizás queda en las fichas.</EmptyNote></Card>
      ) : (
        <div className="stack-sm">
          {cotSync.pendientes.map((x) => {
            const min = Math.min(...x.planes.map((p) => p.aPagar));
            return (
              <div key={x.id} className="card" style={{ padding: 14 }}>
                <div className="row between wrap" style={{ alignItems: "flex-start", gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div className="row wrap" style={{ gap: 6 }}>
                      <span style={{ fontWeight: 800, fontSize: 15 }}>{x.cliente || "Sin nombre"}</span>
                      <Chip tone={x.tipo === "empresa" ? "info" : "accent"}>{x.tipo === "empresa" ? `Empresa · ${x.capitas} cápitas` : "Particular"}</Chip>
                      {x.via === "whatsapp" && <Chip tone="good">Enviada por WhatsApp</Chip>}
                    </div>
                    <div className="muted" style={{ fontSize: 12.5, marginTop: 3 }}>
                      {fmtFecha(isoLocal(new Date(x.fecha)), { day: "2-digit", month: "short" })} · {x.provincia}
                      {x.telefono ? ` · ${x.telefono}` : ""} · {x.planes.map((p) => p.nombre.replace("Plan ", "")).join(", ")} · desde {money(min)}/mes
                    </div>
                    {x.sugeridas && x.sugeridas.length > 1 && <div style={{ fontSize: 12.5, marginTop: 4 }}>Coincide con {x.sugeridas.length} fichas: elegí cuál.</div>}
                  </div>
                  <div className="row wrap" style={{ gap: 6 }}>
                    {(x.sugeridas || []).slice(0, 3).map((s) => (
                      <Btn key={s.id} size="sm" variant="soft" icon={Check} onClick={() => vincularCotizacion(x, s)}>{s.label.length > 28 ? s.label.slice(0, 28) + "…" : s.label}</Btn>
                    ))}
                    <Btn size="sm" variant="primary" icon={Plus} onClick={() => crearDesdeCotizacion(x)}>{x.tipo === "empresa" ? "Crear empresa" : "Crear paciente"}</Btn>
                    <Btn size="sm" icon={Search} onClick={() => { setBuscando(buscando === x.id ? null : x.id); setQ(""); }}>Buscar ficha</Btn>
                    <Btn size="sm" variant="ghost" onClick={() => ignorarCotizacion(x)}>Ignorar</Btn>
                  </div>
                </div>
                {buscando === x.id && (
                  <div style={{ marginTop: 10 }}>
                    <SearchBox value={q} onChange={setQ} placeholder="Empresa, paciente, CUIT o teléfono…" />
                    <div className="stack-sm" style={{ marginTop: 6 }}>
                      {resultados.map((r) => (
                        <button key={r.tipo + r.id} className="item" onClick={() => { vincularCotizacion(x, r); setBuscando(null); }}>
                          {r.tipo === "empresa" ? <Building2 size={14} /> : <Users size={14} />}
                          <span style={{ fontWeight: 600 }}>{r.label}</span>
                          <span className="muted" style={{ fontSize: 12 }}>{r.hint}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <div className="muted" style={{ fontSize: 12 }}>Al vincular o crear, la cotización queda en la ficha y en su historial, la empresa pasa a “Propuesta Enviada” y se agenda “Seguimiento de cotización” a 2 días (si no tenía otra próxima acción).</div>
    </div>
  );
}

function CotizadorOficial({ companies, personas, preset, registrarCotizacion, showToast, settings, cotBase, detectarCotizador }) {
  const baseUrl = (cotBase && cotBase.url) || (settings && settings.cotizadorUrl) || "../cotizador/";
  const origenCotizador = (() => {
    try {
      return new URL(baseUrl, window.location.href).origin;
    } catch (e) {
      return window.location.origin;
    }
  })();
  const [link, setLink] = useState(preset || null);
  const [busca, setBusca] = useState("");
  const [mover, setMover] = useState(true);
  const [pendiente, setPendiente] = useState(null);
  const [registradas, setRegistradas] = useState([]);
  useEffect(() => {
    if (preset) setLink(preset);
  }, [preset]);

  const linkRef = useRef(link);
  linkRef.current = link;
  const moverRef = useRef(mover);
  moverRef.current = mover;

  // El cotizador avisa (postMessage, mismo dominio) cada vez que genera un PDF.
  useEffect(() => {
    const h = (e) => {
      if (e.origin !== origenCotizador) return;
      const d = e.data;
      if (!d || d.fuente !== "cotizador-omint" || !Array.isArray(d.datos && d.datos.planes)) return;
      const l = linkRef.current;
      if (l) {
        registrarCotizacion(l, d, moverRef.current);
        setRegistradas((r) => [{ ...d, label: l.label }, ...r].slice(0, 10));
      } else {
        setPendiente(d);
        showToast("Cotización generada. Vinculala a una empresa o paciente para guardarla en su ficha.");
      }
    };
    window.addEventListener("message", h);
    return () => window.removeEventListener("message", h);
  }, [registrarCotizacion, showToast]);

  const ent = link ? (link.tipo === "empresa" ? companies.find((c) => c.id === link.id) : personas.find((p) => p.id === link.id)) : null;
  const src = useMemo(() => {
    const q = new URLSearchParams({ embed: "crm", provincia: (settings && settings.provincia) || "Mendoza" });
    if (link) {
      q.set("modo", link.tipo === "empresa" ? "empresas" : "particular");
      q.set("nombre", link.label);
      const ent = link.tipo === "empresa" ? companies.find((c) => c.id === link.id) : personas.find((p) => p.id === link.id);
      if (ent && ent.telefono) q.set("tel", ent.telefono);
    }
    q.set("origen", window.location.origin);
    return `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}${q.toString()}`;
  }, [link && link.tipo, link && link.id, baseUrl]);

  const resultados = useMemo(() => {
    const t = stripAccents(busca.trim().toLowerCase());
    if (t.length < 2) return [];
    const m = (s) => stripAccents((s || "").toLowerCase()).includes(t);
    return [
      ...companies.filter((c) => m(c.empresa) || m(c.contacto) || (c.cuit || "").includes(t)).slice(0, 5).map((c) => ({ tipo: "empresa", id: c.id, label: c.empresa, hint: STAGE_BY_KEY[c.stage]?.label })),
      ...personas.filter((p) => m(p.nombre) || (p.telefono || "").includes(t)).slice(0, 5).map((p) => ({ tipo: "persona", id: p.id, label: nombreLegible(p.nombre), hint: p.obraSocial || "Paciente" })),
    ];
  }, [busca, companies, personas]);

  const resumenPlanes = (d) => d.datos.planes.map((p) => `${p.plan.replace("Plan ", "")} ${money(p.aPagar)}`).join(" · ");

  if (cotBase && cotBase.estado !== "ok") return <CotizadorNoEncontrado cotBase={cotBase} detectarCotizador={detectarCotizador} />;

  return (
    <div className="stack">
      <Card title="Cotizando para" icon={Calculator}>
        <div className="row wrap" style={{ gap: 10 }}>
          {link ? (
            <div className="tile row" style={{ gap: 8, flex: 1, minWidth: 260 }}>
              {link.tipo === "empresa" ? <Building2 size={15} /> : <Users size={15} />}
              <span style={{ fontWeight: 700 }}>{link.label}</span>
              {ent && link.tipo === "empresa" && <StageChip stage={ent.stage} />}
              {ent && link.tipo === "persona" && <Chip>{PERSONA_STATUS.find((s) => s.key === ent.status)?.label}</Chip>}
              <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }} onClick={() => setLink(null)}>Cambiar</button>
            </div>
          ) : (
            <div style={{ flex: 1, minWidth: 260 }}>
              <SearchBox value={busca} onChange={setBusca} placeholder="Buscá la empresa o el paciente a cotizar…" />
              <div className="stack-sm" style={{ marginTop: 6 }}>
                {resultados.map((r) => (
                  <button key={r.tipo + r.id} className="item" onClick={() => { setLink({ tipo: r.tipo, id: r.id, label: r.label }); setBusca(""); }}>
                    {r.tipo === "empresa" ? <Building2 size={14} /> : <Users size={14} />}
                    <span style={{ fontWeight: 600 }}>{r.label}</span>
                    <span className="muted" style={{ fontSize: 12 }}>{r.hint}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {link && link.tipo === "empresa" && (
            <label className="row ink2" style={{ gap: 6, fontSize: 12.5, cursor: "pointer" }}>
              <input type="checkbox" checked={mover} onChange={(e) => setMover(e.target.checked)} /> Pasar a “Propuesta Enviada”
            </label>
          )}
          <a className="btn btn-outline btn-sm" href={src} target="_blank" rel="noreferrer" title="En una pestaña aparte las cotizaciones no se registran en el CRM">
            Abrir en pestaña nueva
          </a>
        </div>
        <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
          Cotizá y generá el PDF como siempre: cada PDF que generes se guarda solo en la ficha vinculada (planes, valores y cápitas) y queda en su historial como propuesta.
        </div>
        {pendiente && link && (
          <div className="note t-warn row between wrap" style={{ marginTop: 10, gap: 8 }}>
            <span>Hay una cotización sin guardar: {resumenPlanes(pendiente)}</span>
            <Btn size="sm" variant="primary" onClick={() => { registrarCotizacion(link, pendiente, mover); setRegistradas((r) => [{ ...pendiente, label: link.label }, ...r]); setPendiente(null); }}>
              Guardar en {link.label}
            </Btn>
          </div>
        )}
        {registradas.length > 0 && (
          <div className="stack-sm" style={{ marginTop: 10 }}>
            {registradas.map((r, i) => (
              <div key={i} className="note t-good">✓ Guardada en {r.label}: {resumenPlanes(r)}</div>
            ))}
          </div>
        )}
      </Card>
      <iframe
        key={src}
        src={src}
        title="Cotizador Omint"
        style={{ width: "100%", height: "calc(100vh - 150px)", minHeight: 640, border: "1px solid var(--border)", borderRadius: 16, background: "#fff" }}
      />
    </div>
  );
}

// Historial de cotizaciones de una empresa o paciente.
function CotizacionesList({ items }) {
  if (!items || !items.length) return null;
  return (
    <div>
      <div className="label">Cotizaciones ({items.length})</div>
      <div className="stack-sm">
        {items.slice(0, 8).map((c) => (
          <div key={c.id} className="tile" style={{ fontSize: 12.5 }}>
            <div className="row between">
              <span style={{ fontWeight: 700 }}>{fmtFecha(c.fecha, { day: "2-digit", month: "short", year: "numeric" })}</span>
              <span className="muted">
                {c.origen === "rapido" ? "Cálculo rápido" : c.tipo === "empresa" ? "Empresa · nómina" : "Particular"}
                {c.capitas ? ` · ${c.capitas} cápitas` : ""}
              </span>
            </div>
            {c.planes.map((p) => (
              <div key={p.plan} className="row between tnum" style={{ marginTop: 3 }}>
                <span>{p.plan.replace("Plan ", "")}</span>
                <span>
                  <span className="muted" style={{ textDecoration: p.bonificado < p.lista ? "line-through" : "none" }}>{money(p.lista)}</span>{" "}
                  <strong>{money(p.aPagar)}</strong>/mes
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Cuando el CRM no encuentra el cotizador: qué probó y cómo resolverlo.
function CotizadorNoEncontrado({ cotBase, detectarCotizador }) {
  const [url, setUrl] = useState("");
  if (cotBase.estado === "buscando") {
    return (
      <Card>
        <EmptyNote>
          <RefreshCw size={16} className="spin" style={{ verticalAlign: -3, marginRight: 6 }} />
          Buscando el Cotizador Omint…
        </EmptyNote>
      </Card>
    );
  }
  return (
    <Card title="No encuentro el Cotizador Omint" icon={AlertTriangle}>
      <div className="stack">
        <div className="ink2">
          El CRM abre el cotizador que instalaste en tu hosting (la carpeta <strong>cotizador</strong> del paquete). Probé estas direcciones y en ninguna está:
        </div>
        <div className="tile" style={{ fontSize: 12.5 }}>
          {cotBase.probados.map((p) => (
            <div key={p.url} className="row between wrap" style={{ padding: "3px 0" }}>
              <code style={{ wordBreak: "break-all" }}>{p.url}</code>
              <span className="muted">{p.resultado}</span>
            </div>
          ))}
        </div>
        <div className="note t-info" style={{ lineHeight: 1.6 }}>
          <strong>Cómo resolverlo:</strong>
          <br />1. Abrí en otra pestaña la dirección donde entrás al cotizador nuevo (la pantalla azul de “Cotizador comercial”) y copiala.
          <br />2. Pegala acá abajo y tocá <strong>Probar</strong>. Queda guardada.
          <br />Si no lo subiste todavía: en Hostinger, subí el contenido de la carpeta <strong>cotizador</strong> del paquete a <code>public_html/cotizador</code>.
        </div>
        <div className="row" style={{ gap: 8 }}>
          <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://tu-dominio.com/cotizador/" />
          <Btn variant="primary" disabled={!url.trim()} onClick={() => detectarCotizador(url.trim())}>Probar</Btn>
          <Btn icon={RefreshCw} onClick={() => detectarCotizador()}>Buscar de nuevo</Btn>
        </div>
      </div>
    </Card>
  );
}


// ============================================================ Tablero B2C ===

function DashboardB2C({ personas, waLog, go, setShowNewPersona }) {
  const waGate = useWaGate(waLog);
  const d = useMemo(() => {
    const total = personas.length;
    let conTel = 0, contactados = 0, pendConTel = 0;
    const porStatus = {};
    PERSONA_STATUS.forEach((s) => (porStatus[s.key] = 0));
    const os = new Map();
    const edades = RANGOS_EDAD.map(() => ({ total: 0, contactados: 0 }));
    let sinEdad = 0;
    personas.forEach((p) => {
      if (p.telefono) conTel++;
      if (p.contactado) contactados++;
      const pend = !p.contactado && p.telefono && !["cliente", "descartado"].includes(p.status);
      if (pend) pendConTel++;
      porStatus[p.status] = (porStatus[p.status] || 0) + 1;
      const k = p.obraSocial || "Sin obra social";
      const o = os.get(k) || { nombre: k, total: 0, contactados: 0, pendConTel: 0, clientes: 0 };
      o.total++;
      if (p.contactado) o.contactados++;
      if (pend) o.pendConTel++;
      if (p.status === "cliente") o.clientes++;
      os.set(k, o);
      const edad = calcularEdad(p.fechaNacimiento);
      if (edad === null || edad < 0 || edad > 120) sinEdad++;
      else {
        const i = RANGOS_EDAD.findIndex((r) => edad >= r.min && edad <= r.max);
        if (i >= 0) {
          edades[i].total++;
          if (p.contactado) edades[i].contactados++;
        }
      }
    });
    const lista = [...os.values()].sort((a, b) => b.total - a.total);
    return { total, conTel, contactados, pendConTel, porStatus, obras: lista.slice(0, 10), edades, sinEdad, mejorPend: [...lista].sort((a, b) => b.pendConTel - a.pendConTel)[0] };
  }, [personas]);
  const ch = useChart();

  if (d.total === 0) {
    return (
      <div className="stack">
        <PageHeader title="Particulares (B2C)" />
        <Card>
          <EmptyNote>
            Todavía no hay pacientes cargados. Importá tu base (Excel/CSV) desde “Pacientes” o sumá uno a mano.
            <div className="row" style={{ justifyContent: "center", marginTop: 12 }}>
              <Btn variant="primary" icon={Upload} onClick={() => go("personas")}>Ir a Pacientes</Btn>
              <Btn icon={Plus} onClick={() => setShowNewPersona(true)}>Nuevo paciente</Btn>
            </div>
          </EmptyNote>
        </Card>
      </div>
    );
  }

  const pct = Math.round((d.contactados / d.total) * 100);
  const ritmo = 15;
  const conv = d.contactados ? ((d.porStatus.cliente || 0) / d.contactados) * 100 : 0;
  const respuesta = d.contactados ? (((d.porStatus.interesado || 0) + (d.porStatus.cliente || 0)) / d.contactados) * 100 : 0;
  const edadData = d.edades.map((e, i) => ({ rango: RANGOS_EDAD[i].label, tooltipLabel: `${RANGOS_EDAD[i].label} años`, total: e.total, contactados: e.contactados }));

  return (
    <div className="stack">
      <PageHeader title="Particulares (B2C)" subtitle={`${fmtN(d.total)} personas en la base · ${fmtN(d.pendConTel)} listas para contactar`}>
        <Btn variant="primary" icon={MessageCircle} onClick={() => go("campanab2c")}>Contactar hoy</Btn>
        <Btn icon={Plus} onClick={() => setShowNewPersona(true)}>Paciente</Btn>
      </PageHeader>

      <div className="grid g3">
        <div className="hero">
          <div className="row between">
            <span style={{ fontWeight: 700 }}>Cobertura de la base</span>
            <span className="chip tnum" style={{ background: "rgba(255,255,255,.12)", color: "#fff" }}>{fmtN(d.contactados)} / {fmtN(d.total)}</span>
          </div>
          <div className="row" style={{ gap: 18, marginTop: 10 }}>
            <Ring value={d.contactados} max={d.total} size={124} stroke={11}>
              <div className="tnum" style={{ fontSize: 30, fontWeight: 800 }}>{pct}%</div>
              <div style={{ fontSize: 11, color: "#A9BCD3" }}>contactada</div>
            </Ring>
            <div style={{ fontSize: 13, color: "#D6E2F0", lineHeight: 1.5 }}>
              {d.pendConTel === 0 ? "No quedan personas con teléfono por contactar." : `A ${ritmo} mensajes por día terminás los pendientes en ≈ ${fmtN(Math.ceil(d.pendConTel / ritmo))} días hábiles.`}
            </div>
          </div>
        </div>
        <div className="span2 grid g2">
          <Kpi icon={Phone} label="Pendientes con teléfono" value={fmtN(d.pendConTel)} sub="listos para escribirles" onClick={() => go("campanab2c")} />
          <Kpi icon={Sparkles} label="Tasa de respuesta" value={`${respuesta.toFixed(1)}%`} sub="interesados + clientes / contactados" tone="info" />
          <Kpi icon={Heart} label="Interesados" value={fmtN(d.porStatus.interesado || 0)} sub="seguir con cotización" tone="warn" onClick={() => go("personas")} />
          <Kpi icon={CheckCircle2} label="Clientes" value={fmtN(d.porStatus.cliente || 0)} sub={`conversión ${conv.toFixed(1)}% de contactados`} tone="good" />
        </div>
      </div>

      <div className="grid g3">
        <Card title="Obra social de origen" icon={Building2} className="span2" action={<LinkBtn onClick={() => go("personas")}>Filtrar</LinkBtn>}>
          <table className="tbl">
            <thead>
              <tr><th>Obra social</th><th style={{ textAlign: "right" }}>Base</th><th style={{ width: "40%" }}>Contactados</th><th style={{ textAlign: "right" }}>Pendientes</th><th style={{ textAlign: "right" }}>Clientes</th></tr>
            </thead>
            <tbody>
              {d.obras.map((o) => (
                <tr key={o.nombre}>
                  <td className="strong">{o.nombre}</td>
                  <td className="tnum" style={{ textAlign: "right" }}>{fmtN(o.total)}</td>
                  <td>
                    <div className="row" style={{ gap: 8 }}>
                      <div style={{ flex: 1 }}><ProgressBar value={o.contactados} max={o.total} height={6} /></div>
                      <span className="tnum" style={{ fontSize: 12, width: 36, textAlign: "right" }}>{Math.round((o.contactados / o.total) * 100)}%</span>
                    </div>
                  </td>
                  <td className="tnum" style={{ textAlign: "right" }}>{fmtN(o.pendConTel)}</td>
                  <td className="tnum" style={{ textAlign: "right" }}>{fmtN(o.clientes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {d.mejorPend && d.mejorPend.pendConTel > 0 && (
            <div className="note t-accent" style={{ marginTop: 10 }}>Mayor bolsa sin contactar: <strong>{d.mejorPend.nombre}</strong>, con {fmtN(d.mejorPend.pendConTel)} personas con teléfono.</div>
          )}
        </Card>

        <Card title="WhatsApp de hoy" icon={MessageCircle}>
          <div className="row" style={{ alignItems: "baseline", gap: 6 }}>
            <span className="tnum" style={{ fontSize: 34, fontWeight: 800, color: waGate.superoLimite ? "var(--bad)" : "var(--ink)" }}>{waGate.enviadosHoy}</span>
            <span className="muted">de {WA_DAILY_HARD_LIMIT} mensajes</span>
          </div>
          <ProgressBar value={waGate.enviadosHoy} max={WA_DAILY_HARD_LIMIT} tone={waGate.superoLimite ? "bad" : undefined} />
          <div style={{ marginTop: 10 }}><WaGateBanner waGate={waGate} /></div>
          <div className="divider" />
          <div className="label">Estado de los pacientes</div>
          <div className="stack-sm">
            {PERSONA_STATUS.map((s) => (
              <HBar key={s.key} label={s.label} value={d.porStatus[s.key] || 0} max={Math.max(1, ...PERSONA_STATUS.map((x) => d.porStatus[x.key] || 0))} tone={s.key === "cliente" ? "good" : s.key === "descartado" ? "muted" : undefined} />
            ))}
          </div>
        </Card>
      </div>

      <Card title="Edades de la base" icon={Users} action={<span className="muted" style={{ fontSize: 12 }}>azul: base total · verde: contactados</span>}>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={edadData} margin={{ top: 10, right: 8, left: -10, bottom: 0 }} barGap={2}>
              <CartesianGrid vertical={false} stroke={ch.grid} />
              <XAxis dataKey="rango" tickLine={false} axisLine={false} tick={{ fill: ch.axis, fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: ch.axis, fontSize: 12 }} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: ch.grid, opacity: 0.5 }} />
              <Bar dataKey="total" name="Base" fill={ch.accent2} radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="contactados" name="Contactados" fill={ch.accent} radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {d.sinEdad > 0 && <div className="muted" style={{ fontSize: 12 }}>{fmtN(d.sinEdad)} personas sin fecha de nacimiento válida no figuran en el gráfico.</div>}
      </Card>
    </div>
  );
}

// ============================================================== Pacientes ===

const PERSONAS_POR_PAGINA = 50;

function PersonasList({ personas, setSelectedPersonaId, setShowNewPersona, setShowPersonaWhatsApp, importPersonas, clearPersonas, askConfirm, showToast, updatePersona }) {
  const [search, setSearch] = useState("");
  const [obraSocialFiltro, setObraSocialFiltro] = useState("todas");
  const [statusFiltro, setStatusFiltro] = useState("todos");
  const [contactadoFiltro, setContactadoFiltro] = useState("todos");
  const [edadFiltro, setEdadFiltro] = useState("todas");
  const [page, setPage] = useState(1);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const obrasSociales = useMemo(() => {
    const cnt = new Map();
    personas.forEach((p) => p.obraSocial && cnt.set(p.obraSocial, (cnt.get(p.obraSocial) || 0) + 1));
    return [...cnt.entries()].sort((a, b) => b[1] - a[1]);
  }, [personas]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rango = RANGOS_EDAD.find((r) => r.key === edadFiltro);
    return personas.filter((p) => {
      if (obraSocialFiltro !== "todas" && p.obraSocial !== obraSocialFiltro) return false;
      if (statusFiltro !== "todos" && p.status !== statusFiltro) return false;
      if (contactadoFiltro === "pendientes" && p.contactado) return false;
      if (contactadoFiltro === "contactados" && !p.contactado) return false;
      if (rango) {
        const e = calcularEdad(p.fechaNacimiento);
        if (e === null || e < rango.min || e > rango.max) return false;
      }
      if (q) return (p.nombre || "").toLowerCase().includes(q) || (p.telefono || "").includes(q) || (p.mail || "").toLowerCase().includes(q) || (p.dni || "").includes(q);
      return true;
    });
  }, [personas, obraSocialFiltro, statusFiltro, contactadoFiltro, edadFiltro, search]);

  useEffect(() => setPage(1), [search, obraSocialFiltro, statusFiltro, contactadoFiltro, edadFiltro]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PERSONAS_POR_PAGINA));
  const pg = Math.min(page, totalPages);
  const pageItems = filtered.slice((pg - 1) * PERSONAS_POR_PAGINA, pg * PERSONAS_POR_PAGINA);

  const handleFile = async (file) => {
    setImporting(true);
    try {
      const nuevas = await parsePersonasFile(file);
      const existentes = new Set(personas.map((p) => normEmpresa(p.nombre) + "|" + normcuitStr(p.telefono)));
      const aAgregar = nuevas.filter((p) => !existentes.has(normEmpresa(p.nombre) + "|" + normcuitStr(p.telefono)));
      importPersonas(aAgregar);
      showToast(`Se importaron ${fmtN(aAgregar.length)} personas nuevas (de ${fmtN(nuevas.length)} filas; ${fmtN(nuevas.length - aAgregar.length)} ya existían).`);
    } catch (e) {
      showToast("No se pudo leer el archivo: " + e.message);
    }
    setImporting(false);
  };

  return (
    <div className="stack">
      <PageHeader title="Pacientes" subtitle={`${fmtN(filtered.length)} de ${fmtN(personas.length)} personas`}>
        <Btn variant="primary" icon={Plus} onClick={() => setShowNewPersona(true)}>Paciente</Btn>
        <Btn icon={Upload} disabled={importing} onClick={() => fileInputRef.current && fileInputRef.current.click()}>{importing ? "Importando…" : "Importar base"}</Btn>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
        {filtered.length > 0 && (
          <>
            <Btn
              icon={Download}
              onClick={() =>
                exportarExcel(
                  filtered.map((p) => ({ Nombre: p.nombre, Edad: calcularEdad(p.fechaNacimiento) ?? "", "Obra social": p.obraSocial || "", Teléfono: p.telefono || "", Mail: p.mail || "", Estado: PERSONA_STATUS.find((s) => s.key === p.status)?.label || p.status, Contactado: p.contactado ? "Sí" : "No", Seguimiento: p.seguimiento || "", Nota: p.nota || "" })),
                  "Pacientes",
                  `pacientes-${hoyISO()}.xlsx`
                )
              }
            >
              Excel
            </Btn>
            <Btn
              icon={Phone}
              onClick={() => {
                const contactos = filtered.map((p) => ({ nombre: p.nombre, telefono: p.telefono, nota: p.obraSocial ? `Obra social: ${p.obraSocial}` : "" }));
                descargarVCF(contactos, `personas-${hoyISO()}.vcf`);
                showToast(`Se descargaron ${fmtN(contactos.filter((c) => c.telefono).length)} contactos. Importalos desde tu celular.`);
              }}
            >
              A mi celular
            </Btn>
          </>
        )}
        {personas.length > 0 && (
          <Btn variant="danger" icon={Trash2} onClick={() => askConfirm(`Esto va a borrar las ${fmtN(personas.length)} personas cargadas en B2C. No afecta a las empresas. ¿Confirmás?`, clearPersonas)}>
            Vaciar
          </Btn>
        )}
      </PageHeader>

      <div className="row wrap">
        <SearchBox value={search} onChange={setSearch} placeholder="Nombre, teléfono, mail o DNI…" />
        <select className="select" value={obraSocialFiltro} onChange={(e) => setObraSocialFiltro(e.target.value)}>
          <option value="todas">Toda obra social</option>
          {obrasSociales.map(([os, n]) => <option key={os} value={os}>{os} ({fmtN(n)})</option>)}
        </select>
        <select className="select" value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)}>
          <option value="todos">Todo estado</option>
          {PERSONA_STATUS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <select className="select" value={edadFiltro} onChange={(e) => setEdadFiltro(e.target.value)}>
          <option value="todas">Toda edad</option>
          {RANGOS_EDAD.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
        </select>
        <div className="seg">
          {[["todos", "Todos"], ["pendientes", "Pendientes"], ["contactados", "Contactados"]].map(([k, l]) => (
            <button key={k} className={contactadoFiltro === k ? "on" : ""} onClick={() => setContactadoFiltro(k)}>{l}</button>
          ))}
        </div>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="tbl">
            <thead>
              <tr><th style={{ width: 36 }}>✓</th><th>Nombre</th><th>Edad</th><th>Obra social</th><th>Teléfono</th><th>Estado</th><th>Seguimiento</th><th></th></tr>
            </thead>
            <tbody>
              {pageItems.map((p) => {
                const edad = calcularEdad(p.fechaNacimiento);
                return (
                  <tr key={p.id} className="click" onClick={() => setSelectedPersonaId(p.id)} style={{ opacity: p.contactado ? 0.72 : 1 }}>
                    <td>
                      <input type="checkbox" checked={!!p.contactado} onClick={(e) => e.stopPropagation()} onChange={(e) => updatePersona(p.id, { contactado: e.target.checked })} title="Marcar como contactado/a" />
                    </td>
                    <td className="strong">{p.nombre}</td>
                    <td className="tnum">{edad != null ? `${edad}` : "—"}</td>
                    <td>{p.obraSocial || "—"}</td>
                    <td className="tnum">{p.telefono || "—"}</td>
                    <td>
                      <select className="select" style={{ padding: "3px 24px 3px 6px", fontSize: 12 }} value={p.status} onClick={(e) => e.stopPropagation()} onChange={(e) => updatePersona(p.id, { status: e.target.value })} aria-label="Estado">
                        {PERSONA_STATUS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                      </select>
                    </td>
                    <td style={{ color: p.seguimiento && p.seguimiento <= hoyISO() ? "var(--bad)" : undefined }}>{p.seguimiento ? fmtFecha(p.seguimiento) : "—"}</td>
                    <td>
                      <button className="icon-btn wa" disabled={!p.telefono} onClick={(e) => { e.stopPropagation(); setShowPersonaWhatsApp(p.id); }} aria-label="WhatsApp"><MessageCircle size={14} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <EmptyNote>{personas.length === 0 ? "Todavía no cargaste ninguna persona. Usá “Importar base” o agregá una manualmente." : "No hay personas que coincidan con el filtro."}</EmptyNote>}
        {filtered.length > 0 && <Paginador page={pg} totalPages={totalPages} setPage={setPage} total={filtered.length} porPagina={PERSONAS_POR_PAGINA} />}
      </div>
    </div>
  );
}

function PersonaDetail({ persona, onClose, updatePersona, deletePersona, setShowPersonaWhatsApp, askConfirm, abrirCotizador }) {
  const [f, setF] = useState({});
  useEffect(() => {
    setF({ _id: persona.id, nombre: persona.nombre || "", telefono: persona.telefono || "", mail: persona.mail || "", obraSocial: persona.obraSocial || "", fechaNacimiento: persona.fechaNacimiento || "", nota: persona.nota || "", seguimiento: persona.seguimiento || "", grupo: persona.grupo || "" });
  }, [persona.id]);
  const latest = useRef(null);
  latest.current = { f, persona };
  useEffect(
    () => () => {
      const { f: ff, persona: pp } = latest.current;
      if (ff._id !== pp.id) return;
      const patch = {};
      Object.keys(ff).forEach((k) => k !== "_id" && ff[k] !== (pp[k] || "") && (patch[k] = ff[k]));
      if (Object.keys(patch).length) updatePersona(pp.id, patch);
    },
    []
  );
  const commit = (k) => f[k] !== undefined && f[k] !== (persona[k] || "") && updatePersona(persona.id, { [k]: f[k] });
  const edad = calcularEdad(persona.fechaNacimiento);
  const inp = (k, props = {}) => <input className="input" value={f[k] ?? ""} onChange={(e) => setF({ ...f, [k]: e.target.value })} onBlur={() => commit(k)} {...props} />;

  return (
    <Drawer onClose={onClose}>
      <div className="row between" style={{ padding: "16px 18px", borderBottom: "1px solid var(--border)", alignItems: "flex-start", position: "sticky", top: 0, background: "var(--surface)", zIndex: 2 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{persona.nombre}</div>
          <div className="muted" style={{ fontSize: 12 }}>{[edad != null ? `${edad} años` : "Sin fecha de nacimiento", persona.obraSocial, persona.dni ? `DNI ${persona.dni}` : null].filter(Boolean).join(" · ")}</div>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Cerrar"><X size={16} /></button>
      </div>
      <div style={{ padding: 18 }} className="stack">
        <div className="row wrap">
          <Btn variant="wa" icon={MessageCircle} disabled={!persona.telefono} onClick={() => setShowPersonaWhatsApp(persona.id)}>WhatsApp</Btn>
          {persona.telefono && <a className="btn btn-outline" href={`tel:+${normalizePhoneAR(persona.telefono)}`}><Phone size={15} /> Llamar</a>}
          {HOSTED && abrirCotizador && <Btn icon={Calculator} onClick={() => abrirCotizador({ tipo: "persona", id: persona.id, label: nombreLegible(persona.nombre) })}>Cotizar</Btn>}
        </div>
        <div className="grid g2" style={{ gap: 10 }}>
          <Field label="Estado">
            <select className="select full" value={persona.status} onChange={(e) => updatePersona(persona.id, { status: e.target.value })}>
              {PERSONA_STATUS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Próximo seguimiento">
            <input type="date" className="input" value={f.seguimiento || ""} onChange={(e) => setF({ ...f, seguimiento: e.target.value })} onBlur={() => commit("seguimiento")} />
          </Field>
        </div>
        <QuickDates onPick={(d) => { setF({ ...f, seguimiento: d }); updatePersona(persona.id, { seguimiento: d }); }} />
        <label className="tile row" style={{ gap: 8, cursor: "pointer" }}>
          <input type="checkbox" checked={!!persona.contactado} onChange={(e) => updatePersona(persona.id, { contactado: e.target.checked })} /> Ya la contacté (por acá o desde mi celular)
        </label>
        <Field label="Grupo familiar a cotizar"><input className="input" value={f.grupo ?? ""} onChange={(e) => setF({ ...f, grupo: e.target.value })} onBlur={() => commit("grupo")} placeholder="Ej: titular 38 + cónyuge 36 + 2 hijos" /></Field>
        <CotizacionesList items={persona.cotizaciones} />
        <Field label="Nota"><textarea className="textarea" rows={3} value={f.nota ?? ""} onChange={(e) => setF({ ...f, nota: e.target.value })} onBlur={() => commit("nota")} /></Field>
        <div className="divider" />
        <Field label="Nombre y apellido">{inp("nombre")}</Field>
        <div className="grid g2" style={{ gap: 10 }}>
          <Field label="Teléfono">{inp("telefono")}</Field>
          <Field label="Mail">{inp("mail")}</Field>
          <Field label="Obra social">{inp("obraSocial")}</Field>
          <Field label="Fecha de nacimiento">{inp("fechaNacimiento", { type: "date" })}</Field>
        </div>
        {(persona.historial || []).length > 0 && (
          <div>
            <div className="label">Historial</div>
            <Timeline items={persona.historial} />
          </div>
        )}
        <Btn variant="danger" icon={Trash2} onClick={() => askConfirm(`¿Eliminar a ${persona.nombre}?`, () => { deletePersona(persona.id); onClose(); })}>Eliminar paciente</Btn>
      </div>
    </Drawer>
  );
}

function CampanaB2C({ personas, setSelectedPersonaId, setShowPersonaWhatsApp, updatePersona }) {
  const [obraSocialFiltro, setObraSocialFiltro] = useState("todas");
  const [edadFiltro, setEdadFiltro] = useState("todas");
  const [incluirContactados, setIncluirContactados] = useState(false);
  const [index, setIndex] = useState(0);
  const obrasSociales = useMemo(() => Array.from(new Set(personas.map((p) => p.obraSocial).filter(Boolean))).sort(), [personas]);
  const queue = useMemo(() => {
    const rango = RANGOS_EDAD.find((r) => r.key === edadFiltro);
    return personas.filter((p) => {
      if (!p.telefono || ["cliente", "descartado"].includes(p.status)) return false;
      if (!incluirContactados && p.contactado) return false;
      if (obraSocialFiltro !== "todas" && p.obraSocial !== obraSocialFiltro) return false;
      if (rango) {
        const e = calcularEdad(p.fechaNacimiento);
        if (e === null || e < rango.min || e > rango.max) return false;
      }
      return true;
    });
  }, [personas, obraSocialFiltro, edadFiltro, incluirContactados]);
  useEffect(() => setIndex(0), [obraSocialFiltro, edadFiltro, incluirContactados]);
  const current = queue[index];
  const siguiente = () => setIndex((i) => Math.min(i + 1, queue.length));

  return (
    <div className="stack">
      <PageHeader title="Campaña B2C" subtitle={`${fmtN(queue.length)} personas en la cola`}>
        <select className="select" value={obraSocialFiltro} onChange={(e) => setObraSocialFiltro(e.target.value)}>
          <option value="todas">Toda obra social</option>
          {obrasSociales.map((os) => <option key={os} value={os}>{os}</option>)}
        </select>
        <select className="select" value={edadFiltro} onChange={(e) => setEdadFiltro(e.target.value)}>
          <option value="todas">Toda edad</option>
          {RANGOS_EDAD.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
        </select>
        <label className="row ink2" style={{ gap: 6, fontSize: 12.5, cursor: "pointer" }}>
          <input type="checkbox" checked={incluirContactados} onChange={(e) => setIncluirContactados(e.target.checked)} /> Incluir ya contactados
        </label>
      </PageHeader>
      <Card title={queue.length ? `Persona ${Math.min(index + 1, queue.length)} de ${fmtN(queue.length)}` : "Cola vacía"} icon={Megaphone}>
        {!current ? (
          <EmptyNote>{personas.length === 0 ? "Todavía no hay personas cargadas. Importá tu base desde Pacientes." : "No hay más personas pendientes con este filtro."}</EmptyNote>
        ) : (
          <div className="stack">
            <div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{current.nombre}</div>
              <div className="muted">{current.telefono} · {current.obraSocial || "sin obra social"} · {calcularEdad(current.fechaNacimiento) != null ? `${calcularEdad(current.fechaNacimiento)} años` : "edad desconocida"}</div>
            </div>
            <div className="row wrap">
              <Btn variant="wa" icon={MessageCircle} onClick={() => setShowPersonaWhatsApp(current.id)}>Enviar WhatsApp</Btn>
              <Btn icon={CheckCircle2} onClick={() => { updatePersona(current.id, { contactado: true, status: current.status === "nuevo" ? "contactado" : current.status }); siguiente(); }}>Ya la contacté</Btn>
              <Btn icon={Heart} onClick={() => { updatePersona(current.id, { contactado: true, status: "interesado", seguimiento: addDaysISO(2) }); siguiente(); }}>Interesada (+2 d)</Btn>
              <Btn icon={XCircle} onClick={() => { updatePersona(current.id, { contactado: true, status: "descartado" }); siguiente(); }}>Descartar</Btn>
              <Btn variant="ghost" onClick={() => setSelectedPersonaId(current.id)}>Ficha</Btn>
              <Btn variant="ghost" icon={SkipForward} style={{ marginLeft: "auto" }} onClick={siguiente}>Saltar</Btn>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function PersonaWhatsAppModal({ persona, onClose, onSent, waLog, vars }) {
  const nombre = getPersonaFirstName(persona.nombre);
  const build = (k) => fillVars((PERSONA_TEMPLATES.find((t) => t.key === k) || PERSONA_TEMPLATES[0]).text, { ...vars, nombre });
  const [templateKey, setTemplateKey] = useState(PERSONA_TEMPLATES[0].key);
  const [phone, setPhone] = useState(normalizePhoneAR(persona.telefono));
  const [message, setMessage] = useState(build(PERSONA_TEMPLATES[0].key));
  const [sent, setSent] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const waGate = useWaGate(waLog);
  return (
    <Modal title={`WhatsApp · ${persona.nombre}`} onClose={onClose} width={540}>
      <div className="stack">
        <WaGateBanner waGate={waGate} />
        <div>
          <span className="label">Plantilla</span>
          <div className="seg" style={{ width: "100%", flexWrap: "wrap" }}>
            {PERSONA_TEMPLATES.map((t) => (
              <button key={t.key} style={{ flex: 1 }} className={templateKey === t.key ? "on" : ""} onClick={() => { setTemplateKey(t.key); setMessage(build(t.key)); }}>{t.label}</button>
            ))}
          </div>
        </div>
        <Field label="Número (formato internacional, solo dígitos)"><input className="input tnum" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ""))} /></Field>
        <Field label={`Mensaje · {Nombre} = “${nombre || "sin nombre"}”`}><textarea className="textarea" rows={6} value={message} onChange={(e) => setMessage(e.target.value)} /></Field>
        <Btn
          variant="wa"
          icon={MessageCircle}
          style={{ width: "100%" }}
          disabled={!phone || sent || !waGate.puedeEnviar}
          onClick={() => {
            if (!phone || !waGate.puedeEnviar) return;
            window.open(buildWaLink(phone, message), "_blank");
            onSent();
            setSent(true);
          }}
        >
          {sent ? "Abierto en WhatsApp ✓" : waGate.superoLimite ? "Límite diario alcanzado" : !waGate.puedeEnviar ? `Esperá ${Math.ceil(waGate.msRestantesCooldown / 1000)} s` : "Abrir WhatsApp"}
        </Btn>
        <Btn icon={Copy} style={{ width: "100%" }} onClick={async () => { if (await copiarTexto(message)) { setCopiado(true); setTimeout(() => setCopiado(false), 2500); } }}>
          {copiado ? "Copiado ✓" : "Copiar mensaje (para enviar a mano)"}
        </Btn>
        <div className="muted" style={{ fontSize: 12, textAlign: "center" }}>Escribir a mano desde tu celular es la forma más segura de no arriesgar tu cuenta.</div>
      </div>
    </Modal>
  );
}

function NewPersonaModal({ onClose, onSave }) {
  const [form, setForm] = useState({ nombre: "", telefono: "", mail: "", fechaNacimiento: "", obraSocial: "", nota: "" });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  return (
    <Modal title="Nuevo paciente" onClose={onClose}>
      <div className="stack">
        <Field label="Nombre y apellido *"><input className="input" autoFocus value={form.nombre} onChange={set("nombre")} /></Field>
        <div className="grid g2" style={{ gap: 10 }}>
          <Field label="Teléfono"><input className="input" value={form.telefono} onChange={set("telefono")} /></Field>
          <Field label="Mail"><input className="input" value={form.mail} onChange={set("mail")} /></Field>
          <Field label="Fecha de nacimiento"><input type="date" className="input" value={form.fechaNacimiento} onChange={set("fechaNacimiento")} /></Field>
          <Field label="Obra social"><input className="input" value={form.obraSocial} onChange={set("obraSocial")} /></Field>
        </div>
        <Btn variant="primary" disabled={!form.nombre.trim()} style={{ width: "100%" }} onClick={() => onSave(form)}>Guardar</Btn>
      </div>
    </Modal>
  );
}


// ================================================= Producto y objeciones ===

function ProductoReferencia({ go }) {
  const [abierta, setAbierta] = useState(0);
  const [tramo, setTramo] = useState("11 a 99");
  const [linea, setLinea] = useState("todas");
  const lineas = ["Génesis", "Global", "Clásico", "Premium"];
  const [provincia, setProvincia] = useState("Mendoza");
  const PLANES = planesDeProvincia(provincia);
  const lineas2 = [...new Set(PLANES.map((p) => p.linea))];
  const planesVista = PLANES.filter((p) => linea === "todas" || p.linea === linea);
  const COLS = ["00-25", "26-35", "36-54", "55-59", "60+", "hijo1", "hijo2"];
  return (
    <div className="stack">
      <PageHeader title="Producto y objeciones" subtitle={`${LISTA_PRECIOS} · ${provincia}: ${PLANES.length} planes${zonaTitulo(provincia) && zonaTitulo(provincia) !== provincia ? ` (grilla ${zonaTitulo(provincia).slice(0, 40)}${zonaTitulo(provincia).length > 40 ? "…" : ""})` : ""}`}>
        <select className="select" value={provincia} onChange={(e) => { setProvincia(e.target.value); setLinea("todas"); }} aria-label="Provincia">
          {PROVINCIAS.map((p) => <option key={p}>{p}</option>)}
        </select>
        <Btn variant="primary" icon={Calculator} onClick={() => go("cotizador")}>Abrir cotizador</Btn>
      </PageHeader>

      <Card
        title="Precios de lista por cápita (sin IVA)"
        icon={FileText}
        pad={false}
        action={
          <div className="row wrap" style={{ gap: 6 }}>
            <div className="seg">
              {TRAMOS.map((t) => (
                <button key={t.key} className={tramo === t.key ? "on" : ""} onClick={() => setTramo(t.key)}>{t.key}</button>
              ))}
            </div>
            <select className="select" value={linea} onChange={(e) => setLinea(e.target.value)} aria-label="Línea">
              <option value="todas">Todas las líneas</option>
              {lineas2.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        }
      >
        <div style={{ overflowX: "auto", padding: "8px 0 0" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Plan</th>
                <th>Línea</th>
                {["0–25", "26–35", "36–54", "55–59", "60+", "Hijo 1", "Hijo 2+"].map((h) => <th key={h} style={{ textAlign: "right" }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {planesVista.map((p) => {
                const t = p.tarifas[tramo];
                const fueraB = p.maxCapitas && TRAMOS.find((x) => x.key === tramo).min > p.maxCapitas;
                return (
                  <tr key={p.plan}>
                    <td className="strong">{p.plan}</td>
                    <td>{p.linea}{p.tipo !== "Estándar" ? <span className="muted"> · {p.tipo}</span> : ""}</td>
                    {t && !fueraB ? (
                      COLS.map((k) => <td key={k} className="tnum" style={{ textAlign: "right" }}>{money(t[k])}</td>)
                    ) : (
                      <td colSpan={7} className="muted" style={{ textAlign: "right" }}>
                        {fueraB ? `Solo hasta ${p.maxCapitas} cápitas` : tramo === "200 a 499" ? "Consultar con Producto" : p.tipo === "PYME" ? `Desde ${MIN_CAPITAS_PYME} cápitas` : "No se vende en este tramo"}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="muted" style={{ fontSize: 12, padding: "10px 18px 14px", lineHeight: 1.5 }}>
          Adulto / cónyuge / familiar a cargo / hijo de 25 o más se cotizan por franja de edad; hijos menores de 25 como Hijo 1 e Hijo 2 o +. Planes B: exclusivos para empresas PYME, holdings de hasta {MAX_CAPITAS_PLAN_B} cápitas, precio único. Los precios no incluyen IVA (aplicable solo a socios directos).
        </div>
      </Card>

      <div className="grid g3">
        {planesVista.map((p) => (
          <Card key={p.plan} title={p.plan} icon={Stethoscope} action={<Chip tone={p.tipo === "PYME" ? "info" : p.tipo === "Plan B" ? "warn" : "accent"}>{p.linea}{p.tipo !== "Estándar" ? ` · ${p.tipo}` : ""}</Chip>}>
            <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6, color: "var(--ink-2)", fontSize: 13 }}>
              {p.tipo === "PYME" && PYME_EXTRA[p.plan] ? (
                <>
                  <li>Farmacia {PYME_EXTRA[p.plan].farmacia}</li>
                  <li>Asistencia al viajero {PYME_EXTRA[p.plan].modulo}</li>
                  <li>Óptica (1 caso/año), ortodoncia sin límite de edad y check-up anual</li>
                  <li>Desde {MIN_CAPITAS_PYME} cápitas · solo empresas nuevas</li>
                </>
              ) : (
                p.bullets.map((b) => <li key={b}>{b}</li>)
              )}
            </ul>
          </Card>
        ))}
      </div>

      <div className="grid g2">
        <Card title="Requisitos para ofrecer PYME" icon={ClipboardList}>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7, color: "var(--ink-2)" }}>
            <li>Solo para captación de empresas <strong>nuevas</strong> (CUIT nuevo para Omint).</li>
            <li>Desde <strong>11 cápitas</strong> en adelante (no hay escala PYME de 1 a 10).</li>
            <li>No disponible para “1er renglón de empresas”.</li>
            <li>Reemplazan a 4500_24/4500_23C, 6500_21C/22C y 8500_21/22 cuando corresponda.</li>
            <li>Aplican a la campaña de descuento vigente.</li>
          </ul>
        </Card>
        <Card title="Preguntas de calificación" icon={Target}>
          <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7, color: "var(--ink-2)" }}>
            <li>¿Cuántos empleados son y cuántos tienen grupo familiar a cargo?</li>
            <li>¿Qué cobertura tienen hoy y qué les gustaría mejorar?</li>
            <li>¿Quién decide y quién más participa (dueño, RRHH, contador)?</li>
            <li>¿La empresa paga el plan o lo cubre cada empleado con sus aportes?</li>
            <li>¿Para cuándo necesitan tenerlo resuelto?</li>
          </ol>
        </Card>
      </div>

      <Card title="Manejo de objeciones" icon={Sparkles}>
        <div className="stack-sm">
          {OBJECIONES.map((o, i) => (
            <div key={i} className="tile" style={{ padding: 0 }}>
              <button onClick={() => setAbierta(abierta === i ? -1 : i)} className="row between" style={{ width: "100%", padding: "10px 12px", background: "none", border: 0, cursor: "pointer", font: "inherit", color: "var(--ink)", fontWeight: 700 }} aria-expanded={abierta === i}>
                {o.q}
                <ChevronRight size={15} style={{ transform: abierta === i ? "rotate(90deg)" : "none", transition: "transform .15s" }} />
              </button>
              {abierta === i && <div style={{ padding: "0 12px 12px", color: "var(--ink-2)", lineHeight: 1.55 }}>{o.a}</div>}
            </div>
          ))}
        </div>
      </Card>

      <div className="note t-warn">
        Valores de referencia rápida para la conversación de venta. Antes de confirmar un monto o cobertura puntual, verificá el cuadro de beneficios oficial o el sistema: algunos PDFs de julio mostraron columnas corridas en filas específicas (ej. Cirugía cardiovascular / Honorarios cesárea en 4500 y 6500 PYME).
      </div>
    </div>
  );
}

// ============================================================= Contenido ===

function ContenidoPlanner({ contenido, addContenido, updateContenido, deleteContenido, askConfirm }) {
  const [showNew, setShowNew] = useState(false);
  const [filtro, setFiltro] = useState("todos");
  const vacio = { plataforma: "instagram", titulo: "", texto: "", fecha: "", nota: "" };
  const [form, setForm] = useState(vacio);
  const lista = contenido
    .filter((c) => filtro === "todos" || c.status === filtro)
    .sort((a, b) => (a.fecha || "9999").localeCompare(b.fecha || "9999"));

  return (
    <div className="stack">
      <PageHeader title="Planificador de contenido" subtitle="Instagram y estados de WhatsApp: organizá ideas y textos; publicás vos desde cada app.">
        <div className="seg">
          <button className={filtro === "todos" ? "on" : ""} onClick={() => setFiltro("todos")}>Todos</button>
          {CONTENIDO_STATUS.map((s) => (
            <button key={s.key} className={filtro === s.key ? "on" : ""} onClick={() => setFiltro(s.key)}>
              {s.label} ({contenido.filter((c) => c.status === s.key).length})
            </button>
          ))}
        </div>
        <Btn variant="primary" icon={Plus} onClick={() => setShowNew(true)}>Nueva idea</Btn>
      </PageHeader>

      {lista.length === 0 && <Card><EmptyNote>No hay contenido en esta vista.</EmptyNote></Card>}
      <div className="grid g2">
        {lista.map((c) => (
          <div key={c.id} className="card" style={{ padding: 16 }}>
            <div className="row between">
              <span className="row" style={{ gap: 8, fontWeight: 700 }}>
                {c.plataforma === "instagram" ? <Instagram size={16} color="var(--bad)" /> : <MessageCircle size={16} color="var(--wa)" />}
                {c.titulo}
              </span>
              <div className="row" style={{ gap: 6 }}>
                <select className="select" style={{ padding: "4px 24px 4px 8px", fontSize: 12 }} value={c.status} onChange={(e) => updateContenido(c.id, { status: e.target.value })}>
                  {CONTENIDO_STATUS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
                <button className="icon-btn" title="Copiar texto" onClick={() => copiarTexto(c.texto)}><Copy size={13} /></button>
                <button className="icon-btn" title="Eliminar" onClick={() => askConfirm("¿Eliminar esta idea de contenido?", () => deleteContenido(c.id))}><Trash2 size={13} /></button>
              </div>
            </div>
            <textarea key={c.id + "t"} className="textarea" style={{ marginTop: 10 }} defaultValue={c.texto} onBlur={(e) => updateContenido(c.id, { texto: e.target.value })} rows={5} />
            {c.nota && <div className="note t-accent" style={{ marginTop: 8 }}>💡 {c.nota}</div>}
            <div className="row" style={{ marginTop: 8, gap: 8 }}>
              <CalIcon size={13} className="muted" />
              <input type="date" className="input" style={{ width: 160, padding: "4px 8px" }} defaultValue={c.fecha} onBlur={(e) => updateContenido(c.id, { fecha: e.target.value })} />
              <span className="muted" style={{ fontSize: 12 }}>fecha de publicación</span>
            </div>
          </div>
        ))}
      </div>

      {showNew && (
        <Modal title="Nueva idea de contenido" onClose={() => setShowNew(false)}>
          <div className="stack">
            <Field label="Plataforma">
              <select className="select full" value={form.plataforma} onChange={(e) => setForm({ ...form, plataforma: e.target.value })}>
                <option value="instagram">Instagram</option>
                <option value="whatsapp">WhatsApp (estado/difusión)</option>
              </select>
            </Field>
            <Field label="Título / tema"><input className="input" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} /></Field>
            <Field label="Texto / caption"><textarea className="textarea" rows={5} value={form.texto} onChange={(e) => setForm({ ...form, texto: e.target.value })} /></Field>
            <Field label="Fecha planificada"><input type="date" className="input" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} /></Field>
            <Btn variant="primary" disabled={!form.titulo.trim()} style={{ width: "100%" }} onClick={() => { addContenido(form); setShowNew(false); setForm(vacio); }}>Guardar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// =============================================================== Ajustes ===

function SettingsModal({ settings, onClose, onSave }) {
  const [s, setS] = useState(settings);
  const setObj = (k, v) => setS({ ...s, objetivos: { ...s.objetivos, [k]: Math.max(0, Math.round(num(v))) } });
  return (
    <Modal title="Ajustes" onClose={onClose}>
      <div className="stack">
        <Field label="Tu nombre (se usa en los mensajes de WhatsApp y cotizaciones)"><input className="input" value={s.asesor} onChange={(e) => setS({ ...s, asesor: e.target.value })} /></Field>
        <div className="grid g2" style={{ gap: 10 }}>
          <Field label="Meta mensual (cápitas)"><input className="input tnum" type="number" min="1" value={s.metaMensual} onChange={(e) => setS({ ...s, metaMensual: Math.max(1, Math.round(num(e.target.value))) })} /></Field>
          <Field label="Descuento de campaña %"><input className="input tnum" type="number" min="0" max="100" value={s.descuento} onChange={(e) => setS({ ...s, descuento: num(e.target.value) })} /></Field>
          <Field label="Duración de la campaña (meses)"><input className="input tnum" type="number" min="1" max="60" value={s.mesesCampana} onChange={(e) => setS({ ...s, mesesCampana: Math.max(1, Math.round(num(e.target.value))) })} /></Field>
          <Field label="Provincia habitual">
            <select className="select full" value={s.provincia || "Mendoza"} onChange={(e) => setS({ ...s, provincia: e.target.value })}>
              {(PROVINCIAS.length ? PROVINCIAS : ["Mendoza"]).map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>
        </div>
        {HOSTED && (
          <Field label="Dirección del Cotizador Omint" hint="Por defecto ../cotizador/ (la carpeta cotizador al lado de la del CRM, en el mismo dominio).">
            <input className="input" value={s.cotizadorUrl || ""} onChange={(e) => setS({ ...s, cotizadorUrl: e.target.value })} placeholder="../cotizador/" />
          </Field>
        )}
        <div>
          <span className="label">Objetivos diarios de actividad</span>
          <div className="grid g2" style={{ gap: 10 }}>
            {[["llamada", "Llamadas"], ["whatsapp", "WhatsApp"], ["reunion", "Reuniones"], ["propuesta", "Propuestas"]].map(([k, l]) => (
              <Field key={k} label={l}><input className="input tnum" type="number" min="0" value={s.objetivos[k]} onChange={(e) => setObj(k, e.target.value)} /></Field>
            ))}
          </div>
          {s.objetivos.whatsapp > WA_DAILY_HARD_LIMIT && <div className="note t-warn" style={{ marginTop: 8 }}>El tope de seguridad anti-bloqueo es {WA_DAILY_HARD_LIMIT} WhatsApp por día.</div>}
        </div>
        <Field label="Tema">
          <div className="seg">
            <button className={s.theme !== "dark" ? "on" : ""} onClick={() => setS({ ...s, theme: "light" })}><Sun size={13} style={{ verticalAlign: -2 }} /> Claro</button>
            <button className={s.theme === "dark" ? "on" : ""} onClick={() => setS({ ...s, theme: "dark" })}><Moon size={13} style={{ verticalAlign: -2 }} /> Oscuro</button>
          </div>
        </Field>
        {HOSTED && (
          <div className="note t-info">
            Tus datos se guardan en <strong>este navegador</strong> (no en el servidor). No se comparten entre dispositivos y se pierden si borrás los datos del sitio: hacé <strong>Backup</strong> seguido y usá <strong>Restaurar</strong> para pasar la base a otra computadora.
          </div>
        )}
        <Btn variant="primary" style={{ width: "100%" }} onClick={() => onSave(s)}>Guardar ajustes</Btn>
      </div>
    </Modal>
  );
}

// ======================================================== Paleta (Ctrl K) ===

function CommandPalette({ companies, personas, actions, onClose, onPickCompany, onPickPersona }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef(null);
  useEffect(() => {
    inputRef.current && inputRef.current.focus();
  }, []);
  useEscape(onClose);

  const results = useMemo(() => {
    const t = stripAccents(q.trim().toLowerCase());
    const out = [];
    const match = (s) => stripAccents((s || "").toLowerCase()).includes(t);
    actions.filter((a) => !t || match(a.label)).slice(0, t ? 4 : 5).forEach((a) => out.push({ kind: "accion", label: a.label, icon: a.icon, run: () => { onClose(); a.run(); } }));
    if (t.length >= 2) {
      companies
        .filter((c) => match(c.empresa) || match(c.contacto) || match(c.nombreFantasia) || (c.cuit || "").includes(t))
        .slice(0, 7)
        .forEach((c) => out.push({ kind: "empresa", label: c.empresa, hint: `${STAGE_BY_KEY[c.stage]?.label}${c.contacto ? " · " + c.contacto : ""}`, icon: Building2, run: () => onPickCompany(c.id) }));
      personas
        .filter((p) => match(p.nombre) || (p.telefono || "").includes(t) || (p.dni || "").includes(t))
        .slice(0, 5)
        .forEach((p) => out.push({ kind: "paciente", label: p.nombre, hint: p.obraSocial || "Paciente", icon: Users, run: () => onPickPersona(p.id) }));
    }
    return out;
  }, [q, companies, personas, actions]);
  useEffect(() => setSel(0), [q]);

  return (
    <div className="crm-overlay" style={{ alignItems: "flex-start", paddingTop: "12vh" }} onClick={onClose}>
      <div className="modal" style={{ maxWidth: 580 }} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Buscar">
        <div className="row" style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
          <Search size={17} className="muted" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, results.length - 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
              if (e.key === "Enter" && results[sel]) results[sel].run();
            }}
            placeholder="Buscar empresa, paciente, CUIT, teléfono… o una acción"
            style={{ flex: 1, border: 0, outline: "none", background: "transparent", font: "inherit", fontSize: 15, color: "var(--ink)" }}
          />
          <span className="kbd">Esc</span>
        </div>
        <div style={{ maxHeight: 420, overflowY: "auto", padding: 6 }}>
          {results.length === 0 && <EmptyNote>{q.trim().length < 2 ? "Escribí al menos 2 letras para buscar en la base." : "Sin resultados."}</EmptyNote>}
          {results.map((r, i) => (
            <button
              key={r.kind + r.label + i}
              onMouseEnter={() => setSel(i)}
              onClick={r.run}
              className="row"
              style={{ width: "100%", gap: 10, padding: "9px 10px", borderRadius: 10, border: 0, cursor: "pointer", font: "inherit", textAlign: "left", background: i === sel ? "var(--accent-soft)" : "transparent", color: "var(--ink)" }}
            >
              <r.icon size={15} className="muted" />
              <span style={{ fontWeight: 600, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</span>
              {r.hint && <span className="muted" style={{ fontSize: 12, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.hint}</span>}
              <Chip tone={r.kind === "accion" ? "accent" : "neutral"}>{r.kind}</Chip>
            </button>
          ))}
        </div>
        <div className="row muted" style={{ gap: 12, padding: "8px 14px", borderTop: "1px solid var(--border)", fontSize: 11.5 }}>
          <span><span className="kbd">↑↓</span> moverse</span>
          <span><span className="kbd">Enter</span> abrir</span>
          <span style={{ marginLeft: "auto" }}><Command size={11} style={{ verticalAlign: -1 }} /> Ctrl/⌘ K desde cualquier pantalla</span>
        </div>
      </div>
    </div>
  );
}
