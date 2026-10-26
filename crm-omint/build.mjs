// Une src/*.jsx en un único archivo para pegar como artifact de Claude.
// Uso: node build.mjs [archivo-con-SEED.jsx] [salida.jsx]
// El SEED (base de empresas con datos de contacto) NO se versiona: se toma del
// CRM anterior o de un archivo local que lo contenga ("const SEED = [ ... ];").
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const [seedSrc, out = path.join(dir, "dist", "CRM_Omint_v2.jsx")] = process.argv.slice(2);
const files = fs.readdirSync(path.join(dir, "src")).filter((f) => f.endsWith(".jsx")).sort();
let code = files.map((f) => fs.readFileSync(path.join(dir, "src", f), "utf8")).join("\n");

if (seedSrc) {
  const raw = fs.readFileSync(seedSrc, "utf8");
  const m = raw.match(/const SEED = (\[[\s\S]*?\n\]);/);
  if (!m) throw new Error("No encontré 'const SEED = [...]' en " + seedSrc);
  code = code.replace("/*__SEED__*/[]", m[1]);
  console.log("SEED inyectado:", (m[1].match(/"empresa":/g) || []).length, "empresas");
}
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, code);
console.log("OK ->", out, (code.length / 1024).toFixed(0) + " KB");
