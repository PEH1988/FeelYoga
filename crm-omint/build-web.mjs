// Arma la versión web para subir a un hosting con PHP (ej. Hostinger).
// Uso: node build-web.mjs [carpeta-salida] [--lista "Lista de precios Empresas.xls"]
//   (por defecto: web-dist/). El Cotizador Omint se instala aparte
//   (build-cotizador.mjs) y el CRM lo abre integrado desde Ajustes > dirección.
// Genera: index.html (app completa en un solo archivo), api.php, config.php y
// .htaccess. Luego hay que completar usuario y contraseña en config.php.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import * as esbuild from "esbuild";

const dir = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const iLista = args.indexOf("--lista");
const listaArgs = iLista >= 0 ? ["--lista", args.splice(iLista, 2)[1]] : [];
const out = path.resolve(args[0] || path.join(dir, "web-dist"));
const tmp = path.join(dir, "web", ".build");
fs.mkdirSync(tmp, { recursive: true });

// 1) App sin base inicial (los datos se cargan con Restaurar y viven en el servidor).
execFileSync(process.execPath, [path.join(dir, "build.mjs"), "", path.join(tmp, "app.jsx"), ...listaArgs], { stdio: "inherit" });
fs.copyFileSync(path.join(dir, "web", "entry.jsx"), path.join(tmp, "entry.jsx"));

// 2) Bundle de producción.
const res = await esbuild.build({
  entryPoints: [path.join(tmp, "entry.jsx")],
  bundle: true,
  minify: true,
  write: false,
  format: "iife",
  jsx: "automatic",
  loader: { ".jsx": "jsx" },
  define: { "process.env.NODE_ENV": '"production"' },
  target: ["es2019"],
  legalComments: "none",
});
const js = res.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");

const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>CRM Omint</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%230E8C7F'/%3E%3Cpath d='M16 9v14M9 16h14' stroke='white' stroke-width='3.5' stroke-linecap='round'/%3E%3C/svg%3E">
<style>html,body{margin:0;background:#F3F5F9}</style>
</head>
<body>
<div id="root"></div>
<noscript>Este CRM necesita JavaScript habilitado.</noscript>
<script>window.__CRM_HOSTED__ = true;</script>
<script>${js}</script>
</body>
</html>
`;

fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, "index.html"), html);
fs.copyFileSync(path.join(dir, "web", "api.php"), path.join(out, "api.php"));
if (!fs.existsSync(path.join(out, "config.php"))) fs.copyFileSync(path.join(dir, "web", "config.php"), path.join(out, "config.php"));
fs.copyFileSync(path.join(dir, "web", "htaccess.txt"), path.join(out, ".htaccess"));
fs.rmSync(tmp, { recursive: true, force: true });
console.log("Web lista en", out, "· index.html", (html.length / 1024).toFixed(0), "KB");
