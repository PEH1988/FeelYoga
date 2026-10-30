// Descripción comercial de los planes. Los valores por defecto vienen del
// cotizador anterior; el administrador puede editarlos desde Administración.
// Se buscan por código exacto y, si no hay, por código "base" (4500_23C -> 4500_23).

export const FAMILIAS = {
  Génesis: { color: "#8E9A2F", soft: "#F2F4E1" },
  Global: { color: "#D9611F", soft: "#FCEDE3" },
  Clásico: { color: "#6E737B", soft: "#EEEFF1" },
  Premium: { color: "#7E7253", soft: "#F2EFE8" },
  Comunidad: { color: "#2C8C99", soft: "#E1F2F4" },
};

export const PLANES_INFO_DEFAULT = {
  "2500_24": ["Habitación compartida (individual solo en Cl. Santa Isabel y Bazterrica)", "Ortodoncia cubierta solo entre 5 y 8 años", "Kinesiología y fonoaudiología: hasta 30 sesiones", "Extensión de cobertura por fallecimiento del titular: 6 meses"],
  "4500_23": ["Habitación individual en todas las instituciones", "Ortodoncia cubierta hasta los 18 años", "Kinesiología y fonoaudiología: hasta 40 sesiones", "Extensión de cobertura por fallecimiento del titular: 12 meses"],
  "6500_21": ["Habitación individual en todas las instituciones", "Ortodoncia cubierta hasta los 25 años", "Kinesiología y fonoaudiología sin tope de sesiones", "Reintegro de ecografías 3D/4D y consultas homeopáticas"],
  "8500_21": ["Habitación individual, con sistema Cerrado, Combinado y Abierto", "Ortodoncia cubierta hasta los 99 años (sin límite práctico)", "Única línea con cobertura de cirugía estética", "Única línea con reintegro de óptica", "Acompañante en internación hasta 4 días (el máximo de la línea)"],
  "2500_20": ["Habitación compartida (individual solo en Cl. Santa Isabel y Bazterrica)", "Ortodoncia cubierta solo entre 5 y 8 años c/copago", "Kinesiología y fonoaudiología: hasta 30 sesiones c/copago", "Extensión de cobertura por fallecimiento del titular: 6 meses c/copago"],
  "4500_20": ["Habitación individual en todas las instituciones", "Ortodoncia cubierta hasta los 18 años c/copago", "Kinesiología y fonoaudiología: hasta 40 sesiones c/copago", "Extensión de cobertura por fallecimiento del titular: 12 meses c/copago"],
  "6500_20": ["Habitación individual en todas las instituciones", "Ortodoncia cubierta hasta los 25 años c/copago", "Kinesiología y fonoaudiología sin tope de sesiones c/copago"],
  "4500_PYME": ["Farmacia 40%", "Asistencia al viajero OA_TURISTA", "Óptica (1 caso/año), ortodoncia sin límite de edad y check-up anual"],
  "6500_PYME": ["Farmacia 50%", "Asistencia al viajero OA_TURISTA_PLUS", "Óptica (1 caso/año), ortodoncia sin límite de edad y check-up anual"],
  "8500_PYME": ["Farmacia 50%", "Asistencia al viajero OA_EURO", "Óptica (1 caso/año), ortodoncia sin límite de edad y check-up anual"],
  COMUNIDAD_SC: ["PMO Omint sin copagos"],
  COMUNIDAD_CC: ["PMO Omint con copagos", "Exclusivo para holdings de hasta 25 cápitas"],
};

export const BENEFICIOS_COMUNES = [
  "Medicamentos: 40% de descuento de uso habitual y 70% en medicación de enfermedades crónicas prevalentes.",
  "Cobertura internacional en todo el mundo con Omint Assistance, activable desde la app antes de viajar.",
];

// Cartilla: el dato confirmado es de Mendoza.
export const CARTILLAS = {
  Mendoza: "Hospital Español, Clínica de Cuyo, Santa Isabel de Hungría, Hospital Italiano, Centro Médico Palmares y La Barraca, entre otros",
};

export function codigoBase(codigo) {
  return codigo.replace(/C$/, "").replace(/S$/, "");
}

export function beneficiosDe(codigo, planesInfo) {
  const info = { ...PLANES_INFO_DEFAULT, ...(planesInfo || {}) };
  return info[codigo] || info[codigoBase(codigo)] || [];
}

export function linkPlan(codigo) {
  if (/PYME|COMUNIDAD/.test(codigo)) return null;
  return `https://www.omint.com.ar/OmintPlanes/Beneficios.html?Plan=${encodeURIComponent(codigo)}&CondSocio=E`;
}

export const colorFamilia = (familia) => (FAMILIAS[familia] || FAMILIAS.Clásico).color;
export const softFamilia = (familia) => (FAMILIAS[familia] || FAMILIAS.Clásico).soft;

export function etiquetaPlan(p) {
  if (p.planB) return `${p.familia} · Plan B con copago`;
  if (p.pyme) return `${p.familia} · PYME`;
  if (p.seccion === "Planes Comunidad") return "Comunidad";
  return `Línea ${p.familia}`;
}
