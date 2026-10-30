// Une src/*.jsx en un único archivo para pegar como artifact de Claude.
// Uso: node build.mjs [archivo-con-SEED.jsx] [salida.jsx] [--lista "Lista de precios Empresas.xls"]
// El SEED (base de empresas con datos de contacto) NO se versiona: se toma del
// CRM anterior o de un archivo local que lo contenga ("const SEED = [ ... ];").
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";
import { parseListaPrecios } from "./cotizador/src/lista.js";

const dir = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const iLista = argv.indexOf("--lista");
const listaPath = iLista >= 0 ? argv.splice(iLista, 2)[1] : null;
const [seedArg, out = path.join(dir, "dist", "CRM_Omint_v2.jsx")] = argv;
const files = fs.readdirSync(path.join(dir, "src")).filter((f) => f.endsWith(".jsx")).sort();
let code = files.map((f) => fs.readFileSync(path.join(dir, "src", f), "utf8")).join("\n");

const seedSrc = seedArg || null;
if (seedSrc) {
  const raw = fs.readFileSync(seedSrc, "utf8");
  const m = raw.match(/const SEED = (\[[\s\S]*?\n\]);/);
  if (!m) throw new Error("No encontré 'const SEED = [...]' en " + seedSrc);
  code = code.replace("/*__SEED__*/[]", () => m[1]);
  console.log("SEED inyectado:", (m[1].match(/"empresa":/g) || []).length, "empresas");
}
if (listaPath) {
  const l = parseListaPrecios(XLSX, XLSX.readFile(listaPath));
  if (l.errores.length) throw new Error("La lista de precios tiene errores:\n- " + l.errores.join("\n- "));
  const { errores, avisos, regiones, ...datos } = l;
  code = code.replace("/*__LISTA__*/null", () => JSON.stringify(datos));
  console.log("Lista de precios inyectada:", l.vigencia, Object.keys(l.provincias).length, "provincias");
}
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, code);
console.log("OK ->", out, (code.length / 1024).toFixed(0) + " KB");
