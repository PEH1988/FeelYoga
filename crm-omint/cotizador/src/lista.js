// Lectura de la "Lista de precios EMPRESAS" de Omint (Excel .xls/.xlsx).
// Funciona igual en el navegador (subida desde Administración) y en Node (build).
//
// Estructura esperada del libro (la que usa Omint todos los meses):
//   - Hoja "Provincias": provincia + link "ver" a la hoja de su zona de precios.
//   - Una hoja por zona ("1", "2", ...): secciones "Planes 201602", "Planes B",
//     "Planes COMUNIDAD"; cada plan con filas por tramo de cápitas
//     ("1 a 10 cápitas", ...) o una sola fila de precio único.
//   - Hoja "Planes por region" (opcional): regiones habilitadas por plan.
// Si el formato cambia, devolvemos errores claros en lugar de precios dudosos.

export const FRANJAS = ["00-25", "26-35", "36-54", "55-59", "60+"];
export const TRAMOS = ["1 a 10", "11 a 99", "100 a 199", "200 a 499"];

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

const limpiar = (v) => (v == null ? "" : String(v).replace(/\s+/g, " ").trim());
const sinAcentos = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
const esNumero = (v) => typeof v === "number" && isFinite(v) && v > 0;

function tramoDeTexto(t) {
  const m = sinAcentos(limpiar(t).toLowerCase()).match(/^(\d+)\s*a\s*(\d+)\s*capitas/);
  if (!m) return null;
  const k = `${m[1]} a ${m[2]}`;
  return TRAMOS.includes(k) ? k : null;
}

// Fila de precios: columnas B-F (5 franjas de edad) y H-I (hijo 1, hijo 2 o +).
function leerPrecios(row) {
  const v = [row[1], row[2], row[3], row[4], row[5], row[7], row[8]];
  if (v.every(esNumero)) return v.map((x) => Math.round(x));
  if (v.some((x) => typeof x === "string" && /consultar/i.test(x))) return null; // "Consultar con Producto"
  return undefined; // fila irreconocible
}

function familiaDe(codigo) {
  const n = parseInt(codigo, 10);
  if (/COMUNIDAD/i.test(codigo)) return "Comunidad";
  if (n >= 8000) return "Premium";
  if (n >= 6000) return "Clásico";
  if (n >= 4000) return "Global";
  return "Génesis";
}

function leerZona(rows, nombreHoja, errores) {
  const titulo = limpiar(rows[2] && rows[2][0]) || `Zona ${nombreHoja}`;
  const planes = [];
  let seccion = "Planes 201602";
  let maxCapitas = null;
  let nota = "";
  let actual = null;
  for (let i = 3; i < rows.length; i++) {
    const row = rows[i] || [];
    const a = limpiar(row[0]);
    const b = limpiar(row[1]);
    if (/^planes\b/i.test(a)) {
      if (/^ver$/i.test(b)) continue; // índice de la hoja
      seccion = /planes b/i.test(a) ? "Planes B" : /comunidad/i.test(a) ? "Planes Comunidad" : "Planes 201602";
      maxCapitas = null;
      actual = null;
      continue;
    }
    if (/^disponibles exclusivamente/i.test(a)) {
      const m = a.match(/hasta\s+(\d+)\s*capitas/i) || sinAcentos(a).match(/hasta\s+(\d+)\s*capitas/i);
      maxCapitas = m ? parseInt(m[1], 10) : 25;
      continue;
    }
    if (!a && /^exclusivo/i.test(b)) {
      nota = b.charAt(0) + b.slice(1).toLowerCase();
      continue;
    }
    if (/^plan\s+/i.test(a)) {
      const codigo = a.replace(/^plan\s+/i, "").trim();
      actual = {
        codigo,
        nombre: `Plan ${codigo}`,
        familia: familiaDe(codigo),
        seccion,
        planB: seccion === "Planes B",
        pyme: /_PYME$/i.test(codigo),
        maxCapitas,
        nota,
        cobertura: limpiar(row[10]) || "",
        precioUnico: null,
        tarifas: {},
      };
      nota = "";
      const unico = leerPrecios(row);
      if (unico) actual.precioUnico = unico;
      planes.push(actual);
      continue;
    }
    const tramo = tramoDeTexto(a);
    if (tramo && actual) {
      const p = leerPrecios(row);
      if (p === undefined) errores.push(`Hoja ${nombreHoja}, fila ${i + 1}: no pude leer los precios de ${actual.nombre} (${tramo}).`);
      else actual.tarifas[tramo] = p; // null = consultar con Producto
      if (!actual.cobertura) actual.cobertura = limpiar(row[10]);
    }
  }
  planes.forEach((p) => {
    const tiene = p.precioUnico || Object.values(p.tarifas).some(Boolean);
    if (!tiene) errores.push(`Hoja ${nombreHoja}: ${p.nombre} no tiene ningún precio cargado.`);
  });
  return { id: nombreHoja, titulo, planes: planes.filter((p) => p.precioUnico || Object.values(p.tarifas).some(Boolean)) };
}

export function parseListaPrecios(XLSX, wb) {
  const errores = [];
  const avisos = [];
  const hojaProv = wb.SheetNames.find((n) => /provincia/i.test(n));
  if (!hojaProv) throw new Error("El archivo no tiene la hoja \"Provincias\". ¿Es la lista de precios EMPRESAS de Omint?");
  const wsProv = wb.Sheets[hojaProv];
  const filasProv = XLSX.utils.sheet_to_json(wsProv, { header: 1, defval: null });

  // Vigencia: "Vigentes a Noviembre 2026".
  let vigencia = "";
  for (const r of filasProv.slice(0, 6)) {
    const t = limpiar(r && r[0]);
    const m = sinAcentos(t.toLowerCase()).match(/vigentes? a\s+([a-z]+)\s+(\d{4})/);
    if (m) {
      const mes = MESES.indexOf(m[1]);
      vigencia = mes >= 0 ? `${MESES[mes].charAt(0).toUpperCase() + MESES[mes].slice(1)} ${m[2]}` : t;
      break;
    }
  }
  if (!vigencia) avisos.push("No encontré la fecha de vigencia (\"Vigentes a ...\").");

  // Provincia -> hoja de su zona, leyendo el hipervínculo "ver".
  const provincias = {};
  const rango = XLSX.utils.decode_range(wsProv["!ref"]);
  for (let r = 0; r <= rango.e.r; r++) {
    const ca = wsProv[XLSX.utils.encode_cell({ r, c: 0 })];
    const cb = wsProv[XLSX.utils.encode_cell({ r, c: 1 })];
    const nombre = limpiar(ca && ca.v);
    if (!nombre || /^provincia$/i.test(nombre) || !cb) continue;
    const destino = cb.l && (cb.l.Target || cb.l.Rel && cb.l.Rel.Target);
    const m = destino && String(destino).match(/#'?([^'!]+)'?!/);
    if (m && wb.Sheets[m[1]]) provincias[nombre] = m[1];
    else if (/^ver$/i.test(limpiar(cb.v))) errores.push(`La provincia ${nombre} no tiene un link válido a su hoja de precios.`);
  }
  if (!Object.keys(provincias).length) throw new Error("No encontré provincias con link a su hoja de precios en la hoja \"Provincias\".");

  const zonas = {};
  [...new Set(Object.values(provincias))].forEach((hoja) => {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[hoja], { header: 1, defval: null });
    zonas[hoja] = leerZona(rows, hoja, errores);
    if (!zonas[hoja].planes.length) errores.push(`La hoja ${hoja} (${zonas[hoja].titulo}) no tiene planes.`);
  });

  // Regiones habilitadas (informativo).
  const regiones = [];
  const hojaReg = wb.SheetNames.find((n) => /planes por regi/i.test(n));
  if (hojaReg) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[hojaReg], { header: 1, defval: null });
    const head = rows.find((r) => r && r.some((v) => /^regi[oó]n/i.test(limpiar(v))));
    if (head) {
      const cols = head.map((v, i) => (/^regi[oó]n/i.test(limpiar(v)) ? i : -1)).filter((i) => i >= 0);
      rows.slice(rows.indexOf(head) + 1).forEach((r) => {
        if (!r || !limpiar(r[1]) || !limpiar(r[0])) return;
        regiones.push({ familia: limpiar(r[0]), plan: limpiar(r[1]), habilitado: cols.filter((c) => /x/i.test(limpiar(r[c]))).map((c) => limpiar(head[c])) });
      });
    }
  }

  return { vigencia, provincias, zonas, regiones, errores, avisos };
}

// "Noviembre 2026" -> 2026*12+10, para comparar vigencias.
export function ordenVigencia(v) {
  const m = sinAcentos(String(v || "").toLowerCase()).match(/([a-z]+)\s+(\d{4})/);
  if (!m) return null;
  const i = MESES.indexOf(m[1]);
  return i < 0 ? null : Number(m[2]) * 12 + i;
}

// Resumen para mostrar antes de publicar una lista nueva.
export function resumenLista(lista) {
  const planes = new Set();
  Object.values(lista.zonas).forEach((z) => z.planes.forEach((p) => planes.add(p.codigo)));
  return { vigencia: lista.vigencia, provincias: Object.keys(lista.provincias).length, zonas: Object.keys(lista.zonas).length, planes: planes.size };
}

// Variación promedio de precios entre dos listas (mismo plan, zona, tramo y franja).
export function compararListas(nueva, anterior) {
  if (!anterior) return null;
  const difs = [];
  Object.entries(nueva.zonas).forEach(([zid, z]) => {
    const za = anterior.zonas[zid];
    if (!za) return;
    z.planes.forEach((p) => {
      const pa = za.planes.find((x) => x.codigo === p.codigo);
      if (!pa) return;
      const pares = [];
      if (p.precioUnico && pa.precioUnico) pares.push([p.precioUnico, pa.precioUnico]);
      TRAMOS.forEach((t) => p.tarifas[t] && pa.tarifas[t] && pares.push([p.tarifas[t], pa.tarifas[t]]));
      pares.forEach(([n, a]) => n.forEach((v, i) => a[i] && difs.push(v / a[i] - 1)));
    });
  });
  if (!difs.length) return null;
  const prom = difs.reduce((s, x) => s + x, 0) / difs.length;
  return { promedio: prom, min: Math.min(...difs), max: Math.max(...difs), comparados: difs.length };
}
