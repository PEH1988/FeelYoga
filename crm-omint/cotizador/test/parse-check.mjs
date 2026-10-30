import XLSX from "xlsx";
import fs from "node:fs";
import { parseListaPrecios, resumenLista, compararListas } from "../src/lista.js";
const [nov, oct, out] = process.argv.slice(2);
const L = parseListaPrecios(XLSX, XLSX.readFile(nov));
const O = parseListaPrecios(XLSX, XLSX.readFile(oct));
console.log("NOV", resumenLista(L), "errores", L.errores, "avisos", L.avisos);
console.log("OCT", resumenLista(O), "errores", O.errores);
for (const [id, z] of Object.entries(L.zonas)) console.log(id, z.titulo.slice(0, 50), "|", z.planes.map((p) => p.codigo + (p.planB ? "(B)" : "") + (p.maxCapitas ? "≤" + p.maxCapitas : "") + (p.nota ? "[" + p.nota + "]" : "") + (p.precioUnico ? "*" : "")).join(" "));
const c = compararListas(L, O); console.log("variacion", c && { prom: (c.promedio * 100).toFixed(2) + "%", min: (c.min * 100).toFixed(2), max: (c.max * 100).toFixed(2), n: c.comparados });
console.log("provincias", L.provincias);
fs.writeFileSync(out, JSON.stringify(L));
// check Oct Mendoza matches old cotizador
const mza = JSON.parse(fs.readFileSync(process.argv[5], "utf8"));
let d = 0; const z7 = O.zonas["7"];
for (const [name, t] of Object.entries(mza)) { const p = z7.planes.find((x) => x.nombre === name); for (const [tr, v] of Object.entries(t)) { const got = tr === "B" ? p.precioUnico : p.tarifas[tr]; if (JSON.stringify(got) !== JSON.stringify(v)) { d++; console.log("DIFF", name, tr, got, v); } } }
console.log("oct mendoza diffs vs anterior:", d);
