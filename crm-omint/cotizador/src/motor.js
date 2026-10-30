// Motor de cotización Omint. Sin dependencias de la interfaz: recibe la lista de
// precios (ya leída), la provincia y los datos del grupo, y devuelve los valores
// de cada plan. Las reglas comerciales se configuran en Administración.
import { FRANJAS, TRAMOS } from "./lista.js";

export const CONDICIONES = [
  { key: "empleado", label: "Empleado en relación de dependencia", corto: "Empleado", aporta: true },
  { key: "empleado_monotributista", label: "Empleado y además monotributista", corto: "Empleado + monotributo", aporta: true },
  { key: "monotributista", label: "Monotributista", corto: "Monotributista", aporta: false },
  { key: "responsable_inscripto", label: "Responsable inscripto", corto: "Resp. inscripto", aporta: false },
  { key: "particular", label: "Particular (sin aportes)", corto: "Particular", aporta: false },
];

export const REGLAS_DEFAULT = {
  descuento: 20, // % de la campaña sobre el precio de lista
  meses: 12, // duración de la campaña
  // A quién se le aplica la campaña (como el cotizador anterior: no a "particular" ni "empleado").
  campana: { empleado: false, empleado_monotributista: true, monotributista: true, responsable_inscripto: true, particular: false, empresa: true },
  iva: 10.5, // IVA para socios directos
  conIva: { monotributista: true, responsable_inscripto: true },
  edadHijo: 21, // hasta esta edad (inclusive) cotiza como "hijo"
  edadHijoPlanB: 25, // en Planes B la grilla toma como hijo hasta los 25
  factorAporte: 0.0765, // aporte real a salud sobre el sueldo bruto
  compensarAportes: false, // empresas: el excedente de aporte de un empleado ¿descuenta el de otro?
};

export function franjaDeEdad(edad) {
  const e = Number(edad);
  if (!isFinite(e) || e < 0) return null;
  if (e <= 25) return "00-25";
  if (e <= 35) return "26-35";
  if (e <= 54) return "36-54";
  if (e <= 59) return "55-59";
  return "60+";
}

export function tramoPorCapitas(n) {
  if (n <= 10) return "1 a 10";
  if (n <= 99) return "11 a 99";
  if (n <= 199) return "100 a 199";
  return "200 a 499";
}

export const zonaDeProvincia = (lista, provincia) => (lista && lista.provincias[provincia] ? lista.zonas[lista.provincias[provincia]] : null);

// Precios [00-25, 26-35, 36-54, 55-59, 60+, hijo1, hijo2+] de un plan en un tramo.
function preciosPlan(plan, tramo) {
  if (plan.precioUnico) return plan.precioUnico;
  return plan.tarifas[tramo] || null;
}

// Aporte real a salud: (aporte del 3% ÷ 3%) × 7,65%, o sueldo bruto × 7,65%.
export function aporteReal({ aporte3, bruto }, reglas = REGLAS_DEFAULT) {
  const a3 = Number(aporte3);
  if (isFinite(a3) && a3 > 0) return (a3 / 0.03) * reglas.factorAporte;
  const b = Number(bruto);
  if (isFinite(b) && b > 0) return b * reglas.factorAporte;
  return 0;
}

// Costo de una familia: adultos por franja de edad + hijos (1.º hijo a tarifa
// "Hijo 1"; del 2.º en adelante, "Hijo 2 o +").
export function costoFamilia(precios, edadesAdultos, edadesHijos, plan, reglas = REGLAS_DEFAULT) {
  const corte = plan.planB ? reglas.edadHijoPlanB : reglas.edadHijo;
  let total = 0;
  let hijos = 0;
  edadesAdultos.forEach((e) => (total += precios[FRANJAS.indexOf(franjaDeEdad(e))]));
  edadesHijos.forEach((e) => {
    if (Number(e) <= corte) hijos++;
    else total += precios[FRANJAS.indexOf(franjaDeEdad(e))];
  });
  if (hijos > 0) total += precios[5] + (hijos - 1) * precios[6];
  return total;
}

function motivoNoDisponible(plan, tramo, capitas) {
  if (plan.maxCapitas && capitas > plan.maxCapitas) return `Solo hasta ${plan.maxCapitas} cápitas`;
  if (tramo === "200 a 499") return "Desde 200 cápitas: consultar con Producto";
  if (plan.pyme) return "Línea PYME: desde 11 cápitas";
  return `No se vende en el tramo ${tramo} cápitas`;
}

// ---------------------------------------------------------------- Particular
// datos: { condicion, edad, aporte3, bruto, conyuge: { edad, aporta, aporte3, bruto } | null, hijos: [edad...] }
export function cotizarParticular(lista, provincia, datos, reglas = REGLAS_DEFAULT) {
  const zona = zonaDeProvincia(lista, provincia);
  if (!zona) return { error: "Elegí una provincia", planes: [] };
  const cond = CONDICIONES.find((c) => c.key === datos.condicion);
  if (!cond) return { error: "Elegí la condición fiscal", planes: [] };
  if (!(Number(datos.edad) >= 0) || datos.edad === "" || datos.edad == null) return { error: "Cargá la edad del titular", planes: [] };
  const conyuge = datos.conyuge && datos.conyuge.edad !== "" && datos.conyuge.edad != null ? datos.conyuge : null;
  const hijos = (datos.hijos || []).filter((h) => h !== "" && h != null && isFinite(Number(h)));
  const capitas = 1 + (conyuge ? 1 : 0) + hijos.length;

  let aporte = 0;
  if (cond.aporta) aporte += aporteReal(datos, reglas);
  if (conyuge && conyuge.aporta) aporte += aporteReal(conyuge, reglas);
  if (cond.aporta && aporte <= 0) return { error: "Cargá el aporte del recibo de sueldo (3%) o el sueldo bruto", planes: [] };

  const conCampana = !!reglas.campana[cond.key];
  const conIva = !!reglas.conIva[cond.key];
  const factorIva = conIva ? 1 + reglas.iva / 100 : 1;
  const factorCampana = conCampana ? 1 - reglas.descuento / 100 : 1;
  const tramo = tramoPorCapitas(capitas);

  const planes = zona.planes
    .filter((p) => !p.pyme)
    .map((p) => {
      const precios = preciosPlan(p, tramo);
      const base = { codigo: p.codigo, nombre: p.nombre, familia: p.familia, planB: p.planB, seccion: p.seccion, nota: p.nota, cobertura: p.cobertura };
      if (!precios || (p.maxCapitas && capitas > p.maxCapitas)) return { ...base, disponible: false, motivo: motivoNoDisponible(p, tramo, capitas) };
      const lista0 = costoFamilia(precios, [datos.edad, ...(conyuge ? [conyuge.edad] : [])], hijos, p, reglas) * factorIva;
      const bonificado = lista0 * factorCampana;
      const aPagar = bonificado - aporte;
      return { ...base, disponible: true, lista: lista0, bonificado, aporte, aPagar, aPagarSinCampana: lista0 - aporte, cubre: aPagar <= 0 };
    });

  return {
    provincia,
    zona: zona.titulo,
    condicion: cond,
    conCampana,
    conIva,
    capitas,
    tramo,
    aporte,
    planes: ordenar(planes),
  };
}

// ------------------------------------------------------------------- Empresa
// nomina: [{ nombre, edad, bruto, aporte3, conyugeEdad, hijos: [edad...] }]
export function cotizarEmpresa(lista, provincia, nomina, reglas = REGLAS_DEFAULT) {
  const zona = zonaDeProvincia(lista, provincia);
  if (!zona) return { error: "Elegí una provincia", planes: [] };
  const empleados = (nomina || []).filter((e) => e && e.edad !== "" && e.edad != null && isFinite(Number(e.edad)));
  if (!empleados.length) return { error: "Cargá al menos un titular con su edad", planes: [] };
  const capitas = empleados.reduce((s, e) => s + 1 + (hasVal(e.conyugeEdad) ? 1 : 0) + (e.hijos || []).filter(hasVal).length, 0);
  const tramo = tramoPorCapitas(capitas);
  const factorCampana = reglas.campana.empresa ? 1 - reglas.descuento / 100 : 1;
  const conAporte = empleados.filter((e) => aporteReal(e, reglas) > 0).length;

  const planes = zona.planes.map((p) => {
    const base = { codigo: p.codigo, nombre: p.nombre, familia: p.familia, planB: p.planB, pyme: p.pyme, seccion: p.seccion, nota: p.nota, cobertura: p.cobertura };
    const precios = preciosPlan(p, tramo);
    if (!precios || (p.maxCapitas && capitas > p.maxCapitas)) return { ...base, disponible: false, motivo: motivoNoDisponible(p, tramo, capitas) };
    let lista0 = 0, bonificado = 0, aporte = 0, aPagar = 0, excedente = 0;
    const detalle = empleados.map((e) => {
      const l = costoFamilia(precios, [e.edad, ...(hasVal(e.conyugeEdad) ? [e.conyugeEdad] : [])], (e.hijos || []).filter(hasVal), p, reglas);
      const b = l * factorCampana;
      const a = aporteReal(e, reglas);
      const neto = b - a;
      const pagar = reglas.compensarAportes ? neto : Math.max(0, neto);
      if (neto < 0) excedente += -neto;
      lista0 += l;
      bonificado += b;
      aporte += a;
      aPagar += pagar;
      return { nombre: e.nombre, edad: e.edad, conyugeEdad: e.conyugeEdad, hijos: (e.hijos || []).filter(hasVal), lista: l, bonificado: b, aporte: a, aPagar: pagar };
    });
    return { ...base, disponible: true, lista: lista0, bonificado, aporte, aPagar, excedente: reglas.compensarAportes ? 0 : excedente, aPagarSinCampana: detalle.reduce((s, d) => s + (reglas.compensarAportes ? d.lista - d.aporte : Math.max(0, d.lista - d.aporte)), 0), detalle };
  });

  return { provincia, zona: zona.titulo, capitas, titulares: empleados.length, conAporte, sinAporte: empleados.length - conAporte, tramo, conCampana: !!reglas.campana.empresa, planes: ordenar(planes) };
}

function hasVal(v) {
  return v !== "" && v != null && isFinite(Number(v));
}

function ordenar(planes) {
  return [...planes].sort((a, b) => (a.disponible === b.disponible ? (a.disponible ? a.aPagar - b.aPagar : 0) : a.disponible ? -1 : 1));
}

// Nómina desde la plantilla Excel (Nombre, Edad Titular, Sueldo Bruto, Aporte 3%,
// Edad Cónyuge, Edad Hijo 1..6). Compatible con la plantilla del cotizador anterior.
export function nominaDesdeFilas(rows) {
  const out = [];
  const num = (v) => (v === null || v === "" || v === undefined || !isFinite(Number(v)) ? "" : Number(v));
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i] || [];
    if (num(r[1]) === "") continue;
    const hijos = [];
    for (let h = 5; h <= 10; h++) if (num(r[h]) !== "") hijos.push(num(r[h]));
    out.push({ nombre: r[0] != null && String(r[0]).trim() ? String(r[0]).trim() : `Titular ${out.length + 1}`, edad: num(r[1]), bruto: num(r[2]), aporte3: num(r[3]), conyugeEdad: num(r[4]), hijos });
  }
  return out;
}

export const PLANTILLA_COLUMNAS = ["Nombre y apellido", "Edad Titular", "Sueldo Bruto", "Aporte 3% (opcional)", "Edad Cónyuge", "Edad Hijo 1", "Edad Hijo 2", "Edad Hijo 3", "Edad Hijo 4", "Edad Hijo 5", "Edad Hijo 6"];
export { TRAMOS, FRANJAS };
