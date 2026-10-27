// Incorpora el Cotizador Omint (HTML autónomo) al CRM web.
// - No cambia precios ni cálculos: solo agrega un "puente" que, cada vez que se
//   genera un PDF, le avisa al CRM (postMessage, mismo dominio) qué se cotizó.
// - Permite pre-llenar nombre y modo desde la URL (?modo=empresas&nombre=...).
// Si una nueva versión del cotizador cambia las líneas de referencia, el script
// falla con un mensaje claro en lugar de generar algo roto.
import fs from "node:fs";

function insertarAntes(src, ancla, codigo, etiqueta) {
  const n = src.split(ancla).length - 1;
  if (n !== 1) throw new Error(`Cotizador: no encontré un único punto de enganche para "${etiqueta}" (${n} coincidencias).`);
  return src.replace(ancla, codigo + ancla);
}

export function integrarCotizador(htmlPath) {
  let html = fs.readFileSync(htmlPath, "utf8");

  // 1) Función de aviso al CRM, al principio del script de la calculadora.
  html = insertarAntes(
    html,
    '/* ===================== Lógica de la calculadora ===================== */',
    `/* ---- Puente CRM: avisa al CRM cada cotización generada ---- */
  function __crmAviso(tipo, datos){
    try{
      if(window.parent && window.parent !== window){
        window.parent.postMessage({ fuente: "cotizador-omint", tipo: tipo, datos: datos, fecha: new Date().toISOString() }, window.location.origin);
      }
    }catch(e){}
  }
  `,
    "aviso"
  );

  // 2) PDF individual (un plan).
  html = insertarAntes(
    html,
    "var pdfString = buildQuotePdf(data);",
    `__crmAviso("individual", { nombre: comun.nombre, condicion: comun.condicionFiscal, grupo: { titular: comun.edadTitular, conyuge: comun.conyuge, hijos: comun.hijos },
        planes: [{ plan: calc.plan.nombre, tag: calc.plan.tag, lista: calc.precioLista, bonificado: calc.precioBonificado, aporte: calc.aporteReal, aPagar: calc.diff }] });
      `,
    "PDF individual"
  );

  // 3) PDF comparativo (varios planes, particulares).
  html = insertarAntes(
    html,
    "var pdfString = buildComparisonPdf(data);",
    `__crmAviso("individual", { nombre: comun.nombre, condicion: comun.condicionFiscal, grupo: { titular: comun.edadTitular, conyuge: comun.conyuge, hijos: comun.hijos },
        planes: idxs.map(function(i){ var c = ultimoCalculo[i]; return { plan: c.plan.nombre, tag: c.plan.tag, lista: c.precioLista, bonificado: c.precioBonificado, aporte: c.aporteReal, aPagar: c.diff }; }) });
      `,
    "PDF comparativo"
  );

  // 4) PDF de empresa (nómina).
  html = insertarAntes(
    html,
    "var pdfString = doc.build();",
    `__crmAviso("empresa", { nombre: nombreEmpresa, capitas: totalCapitasNomina, titulares: nomina.length, tramo: tramoNomina,
        planes: planesCalc.map(function(p){ var t = p.calc.totales; return { plan: p.nombre, tag: PLAN_TAGS_EMPRESA[p.nombre] || "", lista: t.precioLista, bonificado: t.precioBonificado, aporte: t.aporteReal, aPagar: t.totalMensual }; }) });
      `,
    "PDF empresa"
  );

  // 5) Pre-llenado desde la URL, después de que el cotizador terminó de iniciar.
  const prefill = `<script>
(function(){
  try{
    var q = new URLSearchParams(window.location.search);
    var nombre = q.get("nombre") || "";
    if(q.get("modo") === "empresas"){
      document.getElementById("cw-modo-empresas-btn").click();
      if(nombre) document.getElementById("cwe-nombre-empresa").value = nombre;
    } else if(nombre){
      document.getElementById("cw-nombre").value = nombre;
    }
  }catch(e){}
})();
</script>
</body>`;
  const idx = html.lastIndexOf("</body>");
  if (idx === -1) throw new Error("Cotizador: no encontré </body>.");
  html = html.slice(0, idx) + prefill + html.slice(idx + "</body>".length);
  return html;
}
