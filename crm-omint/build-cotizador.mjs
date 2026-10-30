// Arma el Cotizador Omint para subir a un hosting con PHP (ej. Hostinger).
// Uso:
//   node build-cotizador.mjs --lista "Lista de precios Empresas.xls" [--usuarios usuarios.json] [carpeta-salida]
// - --lista: Excel de Omint con el que arranca la instalación (después se
//   actualiza desde Administración, sin volver a compilar).
// - --usuarios: (opcional) usuarios iniciales [{usuario, nombre, rol, hash, tel, mail, wa, cargo, provincia}].
//   Acepta hashes bcrypt o APR1 (los del .htpasswd del cotizador anterior).
// Ni la lista ni los usuarios se versionan: se pasan al compilar.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import XLSX from "xlsx";
import { parseListaPrecios, resumenLista } from "./cotizador/src/lista.js";

const dir = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args.splice(i, 2)[1] : null;
};
const listaPath = opt("--lista");
const usuariosPath = opt("--usuarios");
const out = path.resolve(args[0] || path.join(dir, "cotizador-dist"));
if (!listaPath) {
  console.error("Falta --lista <archivo de la lista de precios>.");
  process.exit(1);
}

const lista = parseListaPrecios(XLSX, XLSX.readFile(listaPath));
if (lista.errores.length) {
  console.error("La lista tiene errores:\n- " + lista.errores.join("\n- "));
  process.exit(1);
}
const { errores, avisos, ...listaLimpia } = lista;
console.log("Lista:", resumenLista(lista));

const res = await esbuild.build({
  entryPoints: [path.join(dir, "cotizador", "src", "app.jsx")],
  bundle: true,
  minify: true,
  write: false,
  format: "iife",
  jsx: "automatic",
  loader: { ".jsx": "jsx", ".js": "jsx" },
  define: { "process.env.NODE_ENV": '"production"' },
  target: ["es2019"],
  legalComments: "none",
});
const js = res.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#0F1E52">
<title>Cotizador Omint</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%230F1E52'/%3E%3Ctext x='16' y='22' font-family='Arial' font-weight='700' font-size='17' fill='%230BBBE6' text-anchor='middle'%3EO%3C/text%3E%3C/svg%3E">
<style>html,body{margin:0;background:#F4F3EF}</style>
</head>
<body>
<div id="root"></div>
<noscript>El cotizador necesita JavaScript habilitado.</noscript>
<script>${js}</script>
</body>
</html>
`;

const GUARD = "<?php http_response_code(404); exit; ?>\n";
fs.mkdirSync(path.join(out, "instalacion"), { recursive: true });
fs.writeFileSync(path.join(out, "index.html"), html);
// index.php: reemplaza al index.php del cotizador anterior (si se sube en la misma carpeta).
fs.writeFileSync(path.join(out, "index.php"), "<?php\nheader('Content-Type: text/html; charset=utf-8');\nheader('Cache-Control: no-cache');\nreadfile(__DIR__ . '/index.html');\n");
fs.copyFileSync(path.join(dir, "cotizador", "api.php"), path.join(out, "api.php"));
if (!fs.existsSync(path.join(out, "config.php"))) fs.copyFileSync(path.join(dir, "cotizador", "config.php"), path.join(out, "config.php"));
fs.copyFileSync(path.join(dir, "cotizador", "htaccess.txt"), path.join(out, ".htaccess"));
fs.writeFileSync(path.join(out, "instalacion", "lista-inicial.php"), GUARD + JSON.stringify(listaLimpia));
if (usuariosPath) {
  const us = JSON.parse(fs.readFileSync(usuariosPath, "utf8"));
  fs.writeFileSync(path.join(out, "instalacion", "usuarios-iniciales.php"), GUARD + JSON.stringify(us));
  console.log("Usuarios iniciales:", us.map((u) => u.usuario).join(", "));
}
console.log("Cotizador listo en", out, "· index.html", (html.length / 1024).toFixed(0), "KB");
