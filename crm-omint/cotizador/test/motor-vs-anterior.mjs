// Compara el motor nuevo con la lógica del cotizador anterior (reimplementada
// tal cual) sobre casos al azar con la lista de octubre/Mendoza.
// Uso: node motor-vs-anterior.mjs lista-oct.json
import fs from "node:fs";
import { cotizarParticular, cotizarEmpresa, REGLAS_DEFAULT, franjaDeEdad } from "../src/motor.js";
const lista = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const zona = lista.zonas[lista.provincias["Mendoza"]];
const EDADES = ["00-25", "26-35", "36-54", "55-59", "60+"];
let seed = 42; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647); const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));

// ---- lógica anterior (copiada de index_sin_login.html) ----
function oldCostoHijosN(p, n) { if (n === 0) return 0; if (n === 1) return p[5]; return p[5] + n * p[6]; }
function oldParticular(st) {
  const esEmp = st.fiscal === "empleado" || st.fiscal === "empleado_monotributista";
  const sinCamp = st.fiscal === "particular" || st.fiscal === "empleado";
  const iva = st.fiscal === "monotributista" || st.fiscal === "responsable_inscripto";
  let ap = 0; if (esEmp) ap += (st.aporte / 0.03) * 0.0765; if (st.tieneConyuge && st.conyugeEmpleado) ap += (st.aporteConyuge / 0.03) * 0.0765;
  return zona.planes.filter((p) => !p.pyme).map((plan) => {
    const pr = plan.precioUnico || plan.tarifas["1 a 10"];
    let t = pr[EDADES.indexOf(st.edad)]; if (st.tieneConyuge) t += pr[EDADES.indexOf(st.edadConyuge)];
    let nH = st.hijos; st.hijosMayores.forEach((e) => { if (plan.planB && e === "00-25") nH++; else t += pr[EDADES.indexOf(e)]; });
    t += oldCostoHijosN(pr, nH); if (iva) t *= 1.105; const b = sinCamp ? t : t * 0.8;
    return { codigo: plan.codigo, lista: t, bonificado: b, aPagar: b - ap };
  });
}
function oldEmpresa(nomina) {
  const cap = nomina.reduce((s, e) => s + 1 + (e.edadConyuge != null ? 1 : 0) + e.hijos.length, 0);
  const tramo = cap <= 10 ? "1 a 10" : cap <= 99 ? "11 a 99" : cap <= 199 ? "100 a 199" : "200 a 499";
  const b = (x) => EDADES.indexOf(franjaDeEdad(x));
  return zona.planes.filter((p) => (p.precioUnico || p.tarifas[tramo]) && !(p.planB && cap > 25)).map((plan) => {
    const pr = plan.precioUnico || plan.tarifas[tramo]; const corte = plan.planB ? 25 : 21; let tot = 0;
    nomina.forEach((e) => { let t = pr[b(e.edadTitular)]; if (e.edadConyuge != null) t += pr[b(e.edadConyuge)]; let n = 0; e.hijos.forEach((h) => { if (h <= corte) n++; else t += pr[b(h)]; }); t += oldCostoHijosN(pr, n); let ap = 0; if (e.aporte3 > 0) ap = (e.aporte3 / 0.03) * 0.0765; else if (e.sueldoBruto > 0) ap = e.sueldoBruto * 0.0765; tot += t * 0.8 - ap; });
    return { codigo: plan.codigo, aPagar: tot };
  });
}
const conds = ["empleado", "empleado_monotributista", "monotributista", "responsable_inscripto", "particular"];
let iguales = 0, distintos = 0, distintosEsperados = 0;
const reglasAnteriores = { ...REGLAS_DEFAULT, compensarAportes: true };
for (let k = 0; k < 600; k++) {
  const fiscal = conds[ri(0, 4)]; const edad = ri(18, 70); const tieneConyuge = rnd() < 0.5; const edadC = ri(18, 70); const cEmp = tieneConyuge && rnd() < 0.4;
  const hijos = Array.from({ length: ri(0, 3) }, () => ri(0, 30));
  const aporte = ri(20000, 120000), aporteC = ri(20000, 90000);
  const st = { fiscal, edad: franjaDeEdad(edad), tieneConyuge, edadConyuge: franjaDeEdad(edadC), conyugeEmpleado: cEmp, aporte, aporteConyuge: aporteC, hijos: hijos.filter((h) => h <= 21).length, hijosMayores: hijos.filter((h) => h > 21).map(franjaDeEdad) };
  const nuevo = cotizarParticular(lista, "Mendoza", { condicion: fiscal, edad, aporte3: aporte, conyuge: tieneConyuge ? { edad: edadC, aporta: cEmp, aporte3: aporteC } : null, hijos }, reglasAnteriores);
  const viejo = oldParticular(st);
  // cantidad de hijos que cotizan como hijo (para saber si aplica la corrección)
  viejo.forEach((v) => {
    const n = nuevo.planes.find((x) => x.codigo === v.codigo);
    const corte = zona.planes.find((p) => p.codigo === v.codigo).planB ? 25 : 21;
    const nH = hijos.filter((h) => h <= corte).length;
    const ok = Math.abs(n.aPagar - v.aPagar) < 0.01;
    if (ok) iguales++; else if (nH >= 2) distintosEsperados++; else { distintos++; if (distintos < 5) console.log("DIF particular", v.codigo, st, n.aPagar, v.aPagar); }
  });
}
for (let k = 0; k < 200; k++) {
  const nom = Array.from({ length: ri(1, 40) }, (_, i) => ({ nombre: "E" + i, edadTitular: ri(19, 66), edadConyuge: rnd() < 0.5 ? ri(19, 66) : null, hijos: Array.from({ length: ri(0, 1) }, () => ri(0, 28)), sueldoBruto: rnd() < 0.7 ? ri(500000, 3000000) : null, aporte3: null }));
  const nuevo = cotizarEmpresa(lista, "Mendoza", nom.map((e) => ({ nombre: e.nombre, edad: e.edadTitular, conyugeEdad: e.edadConyuge ?? "", hijos: e.hijos, bruto: e.sueldoBruto ?? "" })), reglasAnteriores);
  oldEmpresa(nom).forEach((v) => { const n = nuevo.planes.find((x) => x.codigo === v.codigo); if (n && n.disponible && Math.abs(n.aPagar - v.aPagar) < 0.01) iguales++; else { distintos++; if (distintos < 8) console.log("DIF empresa", v.codigo, n && n.aPagar, v.aPagar, n && n.motivo); } });
}
console.log({ iguales, distintosInesperados: distintos, distintosPorCorreccionHijos: distintosEsperados });
// Ejemplo de la corrección: 2 hijos menores
const ej = cotizarParticular(lista, "Mendoza", { condicion: "monotributista", edad: 38, hijos: [5, 8] });
const p = zona.planes.find((x) => x.codigo === "4500_23C").tarifas["1 a 10"];
console.log("Ejemplo 4500_23C, titular 38 + 2 hijos, lista sin IVA:", { nuevo: p[2] + p[5] + p[6], anterior: p[2] + p[5] + 2 * p[6], sobreprecio: p[6] });
process.exit(distintos ? 1 : 0);
