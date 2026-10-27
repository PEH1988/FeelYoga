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
  descuento: 30,
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
Te escribo porque contamos con un *{Descuento}% de descuento en planes de salud* para grupos familiares con CUIT, monotributistas, empleados en relación de dependencia y PyMEs.
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
    .replace(/{Descuento}/g, String(vars.descuento ?? 30))
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
    text: `Hola {Nombre}! Soy {Asesor}, Ejecutivo Comercial de OMINT Medicina Prepaga. Si cobrás con bono de sueldo, sos monotributista o responsable inscripto, este mes tenés *{Descuento}% de descuento* en los planes de OMINT. Tenés cobertura a nivel nacional e internacional, y podés sumar a toda tu familia. Contame tu situación y te armo una propuesta a medida, sin compromiso.`,
  },
  {
    key: "conversacional",
    label: "Conversacional",
    text: `Hola {Nombre}! Soy {Asesor}, Ejecutivo Comercial de OMINT Medicina Prepaga. Si tenés bono de sueldo, sos monotributista o responsable inscripto, aprovechá el *{Descuento}% de descuento* que tiene OMINT este mes. Cobertura en todo el país y también afuera si viajás, más la posibilidad de sumar a tu grupo familiar. Contame cómo estás cubierto hoy y vemos qué plan te conviene.`,
  },
  {
    key: "pregunta",
    label: "Pregunta abierta",
    text: `Hola {Nombre}! Soy {Asesor}, Ejecutivo Comercial de OMINT Medicina Prepaga. ¿Sabías que con bono de sueldo, monotributo o RI podés acceder a un *{Descuento}% de descuento* en OMINT este mes? Es una cobertura con alcance nacional e internacional, ideal si viajás seguido o tenés familia en otras provincias. Te armo una cotización sin compromiso, contame tu caso.`,
  },
  {
    key: "beneficio",
    label: "Beneficio concreto",
    text: `Hola {Nombre}! Soy {Asesor}, Ejecutivo Comercial de OMINT Medicina Prepaga. Con bono de sueldo, monotributo o RI, este mes accedés a un *{Descuento}% de descuento* en los planes de OMINT — con cobertura nacional e internacional y la posibilidad de sumar a toda tu familia. Contame tu situación y te paso una propuesta a medida, sin ningún compromiso.`,
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
    titulo: "Post — 30% de descuento",
    texto: `¿Sabías que podés acceder a un plan de salud premium con hasta 30% de descuento? 🏥✨

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

// Precios PYME tomados del Cotizador Omint (tarifas de empresa por tramo de cápitas).
// "precios" = tramo 11 a 99; "precios100" = tramo 100 a 199.
const PYME_PLANES = [
  {
    plan: "4500_PYME",
    linea: "Global",
    cartilla: "4500 (línea Global)",
    farmacia: "40%",
    modulo: "OA_TURISTA",
    precios: { "00-25": 150555, "26-35": 214348, "36-54": 256975, "55-59": 435490, "60+": 661886, hijo1: 130691, hijo2: 113162 },
    precios100: { "00-25": 139142, "26-35": 198263, "36-54": 237863, "55-59": 403229, "60+": 612460, hijo1: 121174, hijo2: 104656 },
  },
  {
    plan: "6500_PYME",
    linea: "Clásico",
    cartilla: "6500 (línea Clásico)",
    farmacia: "50%",
    modulo: "OA_TURISTA_PLUS",
    precios: { "00-25": 164763, "26-35": 235558, "36-54": 275813, "55-59": 462243, "60+": 688541, hijo1: 144008, hijo2: 124848 },
    precios100: { "00-25": 152439, "26-35": 218000, "36-54": 255185, "55-59": 427941, "60+": 637149, hijo1: 133245, hijo2: 115539 },
  },
  {
    plan: "8500_PYME",
    linea: "Premium",
    cartilla: "8500 (línea Premium)",
    farmacia: "50%",
    modulo: "OA_EURO",
    precios: { "00-25": 283132, "26-35": 377312, "36-54": 496624, "55-59": 691974, "60+": 943364, hijo1: 248381, hijo2: 216509 },
    precios100: { "00-25": 262232, "26-35": 349159, "36-54": 459684, "55-59": 640526, "60+": 872991, hijo1: 229814, hijo2: 200472 },
  },
];
// Campaña vigente según el Cotizador Omint: 20% sobre el precio de lista.
const DESCUENTO_CAMPANA_COTIZADOR = 20;
const FRANJAS = [
  { key: "00-25", label: "Titulares 0–25" },
  { key: "26-35", label: "Titulares 26–35" },
  { key: "36-54", label: "Titulares 36–54" },
  { key: "55-59", label: "Titulares 55–59" },
  { key: "60+", label: "Titulares 60+" },
  { key: "hijo1", label: "Hijo 1" },
  { key: "hijo2", label: "Hijo 2 y siguientes" },
];
const MIN_CAPITAS_PYME = 11;

function cotizar(plan, cantidades, descuento) {
  let lista = 0, capitas = 0;
  FRANJAS.forEach((f) => (capitas += num(cantidades[f.key])));
  const tabla = capitas >= 100 && plan.precios100 ? plan.precios100 : plan.precios;
  FRANJAS.forEach((f) => (lista += num(cantidades[f.key]) * tabla[f.key]));
  const desc = lista * (num(descuento) / 100);
  const total = lista - desc;
  return { lista, desc, total, capitas, porCapita: capitas ? total / capitas : 0 };
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

const ThemeCtx = createContext("light");
const CHART = {
  light: { accent: "#0E8C7F", accent2: "#86B6EF", grid: "#E3E8EF", axis: "#6B788C", ref: "#B86E00" },
  dark: { accent: "#2FB5A5", accent2: "#3B6EA8", grid: "#263246", axis: "#8F9CB0", ref: "#E3A33A" },
};
function useChart() {
  return CHART[useContext(ThemeCtx)] || CHART.light;
}
