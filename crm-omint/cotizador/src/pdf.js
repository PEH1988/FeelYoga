// PDF de cotización (particular y empresa) con jsPDF, 100% en el navegador.
import { jsPDF } from "jspdf";
import * as AT from "jspdf-autotable";
import QRCode from "qrcode";
import { beneficiosDe, linkPlan, colorFamilia, etiquetaPlan, BENEFICIOS_COMUNES, CARTILLAS } from "./catalogo.js";

// jspdf-autotable expone la función como default (ESM) o dentro del módulo (CJS).
const autoTable = typeof AT.default === "function" ? AT.default : AT.default && typeof AT.default.default === "function" ? AT.default.default : AT.autoTable;

const NAVY = [23, 41, 110];
const NAVY_DEEP = [15, 30, 82];
const CYAN = [11, 187, 230];
const LILAC = [143, 128, 183];
const LILAC_SOFT = [237, 234, 246];
const INK = [27, 35, 64];
const INK_SOFT = [91, 97, 120];
const LINE = [228, 225, 218];
const GOOD = [47, 122, 92];

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
export const fmt = (n) => "$" + Math.round(n || 0).toLocaleString("es-AR");
const W = 210;
const M = 16;

function waLink(tel) {
  const d = String(tel || "").replace(/\D/g, "");
  if (!d) return null;
  const n = d.startsWith("54") ? d : "549" + d.replace(/^0/, "").replace(/^15/, "");
  return `https://wa.me/${n}`;
}

function encabezado(doc, titulo, sub, fecha) {
  doc.setFillColor(...NAVY_DEEP);
  doc.rect(0, 0, W, 34, "F");
  doc.setFillColor(...CYAN);
  doc.rect(0, 34, W, 1.4, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Omint", M, 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Medicina prepaga", M, 22);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(titulo, W - M, 14, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(sub, W - M, 20.5, { align: "right" });
  doc.text(fecha, W - M, 26, { align: "right" });
  return 46;
}

function cajaDatos(doc, y, filas, titulo) {
  const h = 11 + filas.length * 6;
  doc.setFillColor(247, 245, 241);
  doc.setDrawColor(...LINE);
  doc.roundedRect(M, y, W - 2 * M, h, 2.5, 2.5, "FD");
  doc.setTextColor(...LILAC);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(titulo.toUpperCase(), M + 5, y + 6);
  doc.setFontSize(9.5);
  filas.forEach(([k, v], i) => {
    const yy = y + 12 + i * 6;
    doc.setTextColor(...INK_SOFT);
    doc.setFont("helvetica", "normal");
    doc.text(k, M + 5, yy);
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "bold");
    doc.text(String(v), M + 52, yy, { maxWidth: W - 2 * M - 58 });
  });
  return y + h + 6;
}

function chipCampana(doc, y, reglas) {
  doc.setFillColor(...LILAC_SOFT);
  doc.roundedRect(M, y, W - 2 * M, 11, 2.5, 2.5, "F");
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`Campaña vigente: ${reglas.descuento}% de descuento sobre el precio de lista durante ${reglas.meses} meses.`, W / 2, y + 7, { align: "center" });
  return y + 17;
}

async function tarjetaEjecutivo(doc, y, ej) {
  if (!ej) return y;
  const link = ej.wa ? (ej.wa.startsWith("http") ? ej.wa : waLink(ej.wa)) : waLink(ej.tel);
  const h = 30;
  if (y + h > 287) {
    doc.addPage();
    y = 20;
  }
  doc.setFillColor(...LILAC_SOFT);
  doc.setDrawColor(...LINE);
  doc.roundedRect(M, y, W - 2 * M, h, 3, 3, "FD");
  doc.setTextColor(...NAVY_DEEP);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(ej.nombre || "", M + 6, y + 9);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...INK_SOFT);
  doc.text(ej.cargo || "Ejecutivo comercial", M + 6, y + 14.5);
  doc.setTextColor(...INK);
  const datos = [ej.tel ? `Tel: ${ej.tel}` : null, ej.mail || null].filter(Boolean).join("   ·   ");
  doc.text(datos, M + 6, y + 20.5);
  if (link) {
    doc.setTextColor(...LILAC);
    doc.textWithLink("Escaneá el QR o tocá acá para escribirme por WhatsApp", M + 6, y + 26, { url: link });
    try {
      const qr = await QRCode.toDataURL(link, { margin: 0, width: 300, color: { dark: "#0F1E52", light: "#FFFFFF" } });
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(W - M - 27, y + 3, 24, 24, 2, 2, "F");
      doc.addImage(qr, "PNG", W - M - 25.5, y + 4.5, 21, 21);
      doc.link(W - M - 27, y + 3, 24, 24, { url: link });
    } catch (e) {
      // sin QR: queda el link
    }
  }
  return y + h + 4;
}

function pie(doc, vigencia, provincia) {
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...INK_SOFT);
    doc.text(`Valores de la lista de precios ${vigencia} · ${provincia}. Cotización orientativa sujeta a aprobación de la solicitud.`, M, 291);
    doc.text(`${i} / ${n}`, W - M, 291, { align: "right" });
  }
}

function notas(doc, y, lineas) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...INK_SOFT);
  lineas.filter(Boolean).forEach((l) => {
    const t = doc.splitTextToSize("• " + l, W - 2 * M);
    if (y + t.length * 3.8 > 280) {
      doc.addPage();
      y = 20;
    }
    doc.text(t, M, y);
    y += t.length * 3.8 + 1;
  });
  return y + 2;
}

function bloqueBeneficios(doc, y, planes, planesInfo) {
  planes.forEach((p) => {
    const b = beneficiosDe(p.codigo, planesInfo);
    const link = linkPlan(p.codigo);
    const alto = 8 + b.length * 4.2 + (link ? 4.6 : 0);
    if (y + alto > 278) {
      doc.addPage();
      y = 20;
    }
    doc.setFillColor(...hex(colorFamilia(p.familia)));
    doc.rect(M, y, 1.4, alto - 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...INK);
    doc.text(`${p.nombre}  ·  ${etiquetaPlan(p)}`, M + 5, y + 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.6);
    doc.setTextColor(...INK_SOFT);
    let yy = y + 8.5;
    b.forEach((x) => {
      doc.text("• " + x, M + 5, yy, { maxWidth: W - 2 * M - 8 });
      yy += 4.2;
    });
    if (link) {
      doc.setTextColor(...LILAC);
      doc.textWithLink("Ver el cuadro de beneficios completo en omint.com.ar", M + 5, yy, { url: link });
      yy += 4.6;
    }
    y = yy + 2.5;
  });
  return y;
}

const fechaLarga = (d = new Date()) => d.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });

// -------------------------------------------------------------- Particular
// d: { cliente, provincia, vigencia, reglas, resultado (de cotizarParticular), planes (seleccionados), grupoTexto, ejecutivo, planesInfo }
export async function pdfParticular(d) {
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const r = d.resultado;
  let y = encabezado(doc, d.planes.length > 1 ? "Comparativa de planes" : "Cotización de plan", `${d.provincia} · Lista ${d.vigencia}`, fechaLarga());
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(d.cliente ? `Cotización para ${d.cliente}` : "Cotización de cobertura médica", M, y);
  y += 7;
  y = cajaDatos(doc, y, [["Condición fiscal", r.condicion.label], ["Grupo familiar", d.grupoTexto], ["Provincia", d.provincia], ...(r.aporte > 0 ? [["Aporte de obra social", `${fmt(r.aporte)} por mes (se descuenta del valor)`]] : [])], "Datos cotizados");
  if (r.conCampana) y = chipCampana(doc, y, d.reglas);

  const cols = d.planes.map((p) => p.nombre.replace("Plan ", ""));
  const filas = [["Precio de lista", ...d.planes.map((p) => fmt(p.lista))]];
  if (r.conCampana) filas.push([`Con ${d.reglas.descuento}% de descuento (${d.reglas.meses} meses)`, ...d.planes.map((p) => fmt(p.bonificado))]);
  if (r.aporte > 0) filas.push(["Aporte de obra social", ...d.planes.map((p) => "- " + fmt(p.aporte))]);
  filas.push([r.aporte > 0 ? "Diferencia a pagar por mes" : "Total a pagar por mes", ...d.planes.map((p) => (p.cubre ? "Cubierto (" + fmt(-p.aPagar) + " a favor)" : fmt(p.aPagar)))]);
  if (r.conCampana) filas.push([`Desde el mes ${d.reglas.meses + 1}`, ...d.planes.map((p) => (p.aPagarSinCampana <= 0 ? "Cubierto" : fmt(p.aPagarSinCampana)))]);

  autoTable(doc, {
    startY: y,
    head: [["", ...cols]],
    body: filas,
    theme: "grid",
    margin: { left: M, right: M },
    styles: { font: "helvetica", fontSize: 9.5, cellPadding: 2.6, lineColor: LINE, textColor: INK, halign: "right" },
    headStyles: { fillColor: NAVY, textColor: 255, fontStyle: "bold", halign: "right" },
    columnStyles: { 0: { halign: "left", textColor: INK_SOFT, cellWidth: 62 } },
    didParseCell: (h) => {
      if (h.section === "body" && h.row.index === filas.length - (r.conCampana ? 2 : 1) && h.column.index > 0) {
        h.cell.styles.fontStyle = "bold";
        h.cell.styles.fontSize = 11;
        h.cell.styles.textColor = NAVY_DEEP;
        h.cell.styles.fillColor = LILAC_SOFT;
      }
      if (h.section === "body" && h.row.index === 0 && r.conCampana && h.column.index > 0) h.cell.styles.textColor = INK_SOFT;
    },
  });
  y = doc.lastAutoTable.finalY + 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...NAVY);
  doc.text("Lo que incluye cada plan", M, y);
  y += 6;
  y = bloqueBeneficios(doc, y, d.planes, d.planesInfo);
  const cart = CARTILLAS[d.provincia];
  y = notas(doc, y, [
    ...BENEFICIOS_COMUNES,
    cart ? `Cartilla de prestadores en ${d.provincia}: ${cart}.` : null,
    r.conIva ? `Los valores incluyen el ${String(d.reglas.iva).replace(".", ",")}% de IVA.` : "Los valores no incluyen IVA.",
    r.aporte > 0 ? "El aporte de obra social se calcula como aporte del recibo (3%) ÷ 3% × 7,65%, o sueldo bruto × 7,65%." : null,
  ]);
  await tarjetaEjecutivo(doc, y + 2, d.ejecutivo);
  pie(doc, d.vigencia, d.provincia);
  return doc;
}

// ----------------------------------------------------------------- Empresa
// d: { empresa, cuit, provincia, vigencia, reglas, resultado (de cotizarEmpresa), planes (seleccionados), ejecutivo, planesInfo }
export async function pdfEmpresa(d) {
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const r = d.resultado;
  let y = encabezado(doc, "Propuesta corporativa", `${d.provincia} · Lista ${d.vigencia}`, fechaLarga());
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(`Propuesta para ${d.empresa || "la empresa"}`, M, y);
  y += 7;
  y = cajaDatos(
    doc,
    y,
    [
      ["Titulares en nómina", String(r.titulares)],
      ["Cápitas cubiertas", `${r.capitas} (titulares + familiares) · tramo ${r.tramo}`],
      ["Aportes cargados", r.sinAporte ? `${r.conAporte} titulares con sueldo o aporte; ${r.sinAporte} sin ese dato` : "Todos los titulares tienen sueldo o aporte cargado"],
      ["Provincia", d.provincia + (d.cuit ? ` · CUIT ${d.cuit}` : "")],
    ],
    "Resumen"
  );
  if (r.conCampana) y = chipCampana(doc, y, d.reglas);

  autoTable(doc, {
    startY: y,
    head: [["Plan", "Precio de lista", r.conCampana ? `Con ${d.reglas.descuento}%` : "Precio", "Aportes", "Total mensual empresa", "Por cápita"]],
    body: d.planes.map((p) => [`${p.nombre.replace("Plan ", "")}\n${etiquetaPlan(p)}`, fmt(p.lista), fmt(p.bonificado), "- " + fmt(p.aporte), fmt(p.aPagar), fmt(p.aPagar / r.capitas)]),
    theme: "grid",
    margin: { left: M, right: M },
    styles: { font: "helvetica", fontSize: 9, cellPadding: 2.4, lineColor: LINE, textColor: INK, halign: "right", valign: "middle" },
    headStyles: { fillColor: NAVY, textColor: 255, fontStyle: "bold", halign: "right" },
    columnStyles: { 0: { halign: "left", cellWidth: 42 }, 4: { fontStyle: "bold", textColor: NAVY_DEEP } },
    didParseCell: (h) => {
      if (h.section === "head" && h.column.index === 0) h.cell.styles.halign = "left";
    },
  });
  y = doc.lastAutoTable.finalY + 5;
  y = notas(doc, y, [
    "Total mensual empresa: valor con descuento menos los aportes de obra social de cada titular (aporte del recibo ÷ 3% × 7,65%, o sueldo bruto × 7,65%).",
    !d.reglas.compensarAportes && d.planes.some((p) => p.excedente > 0) ? "Si el aporte de un titular supera el valor de su grupo familiar, el excedente no se descuenta del resto de la nómina." : null,
    "Los valores no incluyen IVA.",
  ]);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...NAVY);
  if (y > 240) {
    doc.addPage();
    y = 20;
  }
  doc.text("Lo que incluye cada plan", M, y);
  y += 6;
  y = bloqueBeneficios(doc, y, d.planes, d.planesInfo);
  y = notas(doc, y, [...BENEFICIOS_COMUNES, CARTILLAS[d.provincia] ? `Cartilla de prestadores en ${d.provincia}: ${CARTILLAS[d.provincia]}.` : null]);
  await tarjetaEjecutivo(doc, y + 2, d.ejecutivo);

  // Detalle por colaborador, un bloque por plan.
  d.planes.forEach((p) => {
    doc.addPage();
    doc.setFillColor(...hex(colorFamilia(p.familia)));
    doc.rect(0, 0, W, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...INK);
    doc.text(`Detalle por colaborador · ${p.nombre}`, M, 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...INK_SOFT);
    doc.text(`${etiquetaPlan(p)} · ${r.capitas} cápitas · tramo ${r.tramo}`, M, 22);
    autoTable(doc, {
      startY: 27,
      head: [["Titular", "Edad", "Cónyuge", "Hijos", "Lista", r.conCampana ? `Con ${d.reglas.descuento}%` : "Precio", "Aporte", "A pagar"]],
      body: p.detalle.map((e) => [e.nombre, e.edad, e.conyugeEdad === "" || e.conyugeEdad == null ? "-" : e.conyugeEdad, e.hijos.length ? e.hijos.join(", ") : "-", fmt(e.lista), fmt(e.bonificado), e.aporte ? fmt(e.aporte) : "-", fmt(e.aPagar)]),
      foot: [["Total", "", "", "", fmt(p.lista), fmt(p.bonificado), fmt(p.aporte), fmt(p.aPagar)]],
      theme: "striped",
      margin: { left: M, right: M },
      styles: { font: "helvetica", fontSize: 8, cellPadding: 1.8, textColor: INK, halign: "right" },
      headStyles: { fillColor: NAVY, textColor: 255, halign: "right" },
      footStyles: { fillColor: LILAC_SOFT, textColor: NAVY_DEEP, fontStyle: "bold", halign: "right" },
      columnStyles: { 0: { halign: "left", cellWidth: 44 }, 1: { halign: "center" }, 2: { halign: "center" }, 3: { halign: "center" }, 7: { fontStyle: "bold" } },
    });
  });
  pie(doc, d.vigencia, d.provincia);
  return doc;
}

export { GOOD };
