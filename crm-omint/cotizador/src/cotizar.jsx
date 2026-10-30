import React, { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { cotizarParticular, cotizarEmpresa, CONDICIONES, franjaDeEdad, nominaDesdeFilas, PLANTILLA_COLUMNAS, FRANJAS } from "./motor.js";
import { colorFamilia, softFamilia, etiquetaPlan, beneficiosDe } from "./catalogo.js";
import { pdfParticular, pdfEmpresa } from "./pdf.js";
import { Btn, Field, Modal, money, numOr, Ico } from "./ui.jsx";

const VACIO_P = { cliente: "", telefono: "", condicion: "", edad: "", aporteModo: "aporte3", aporteValor: "", conyuge: false, cEdad: "", cAporta: false, cModo: "aporte3", cValor: "", hijos: [] };
const VACIO_E = { empresa: "", cuit: "", telefono: "", fuente: "manual", nomina: [], rapida: { "00-25": 0, "26-35": 0, "36-54": 0, "55-59": 0, "60+": 0, hijo1: 0, hijo2: 0 } };
const EDAD_REP = { "00-25": 22, "26-35": 30, "36-54": 45, "55-59": 57, "60+": 62 };

export function Cotizar({ ctx }) {
  const { lista, reglas, planesInfo, provincia, prefill, restaurar } = ctx;
  const [modo, setModo] = useState(prefill.modo === "empresa" ? "empresa" : "particular");
  const [p, setP] = useState(() => ({ ...VACIO_P, cliente: prefill.modo !== "empresa" ? prefill.nombre || "" : "", telefono: prefill.telefono || "" }));
  const [e, setE] = useState(() => ({ ...VACIO_E, empresa: prefill.modo === "empresa" ? prefill.nombre || "" : "", telefono: prefill.telefono || "" }));

  // Reabrir una cotización del historial.
  useEffect(() => {
    if (!restaurar) return;
    const en = restaurar.entrada || {};
    setModo(restaurar.tipo === "empresa" ? "empresa" : "particular");
    if (restaurar.tipo === "empresa") setE({ ...VACIO_E, ...en });
    else setP({ ...VACIO_P, ...en });
  }, [restaurar]);

  return (
    <div className="stack">
      <div className="row between wrap">
        <div>
          <h1>Nueva cotización</h1>
          <div className="muted" style={{ marginTop: 2 }}>
            Precios de <b>{provincia}</b> · lista {lista.vigencia}
            {reglas.descuento ? ` · campaña ${reglas.descuento}% por ${reglas.meses} meses` : ""}
          </div>
        </div>
        <div className="seg" role="tablist" aria-label="Tipo de cotización">
          <button className={modo === "particular" ? "on" : ""} onClick={() => setModo("particular")} role="tab" aria-selected={modo === "particular"}>
            {Ico.users} Particular / familia
          </button>
          <button className={modo === "empresa" ? "on" : ""} onClick={() => setModo("empresa")} role="tab" aria-selected={modo === "empresa"}>
            {Ico.building} Empresa
          </button>
        </div>
      </div>
      {modo === "particular" ? <Particular ctx={ctx} p={p} setP={setP} /> : <Empresa ctx={ctx} e={e} setE={setE} />}
    </div>
  );
}

// ================================================================ Particular

function datosParticular(p) {
  const ap = (modo, valor) => (modo === "bruto" ? { bruto: numOr(valor) } : { aporte3: numOr(valor) });
  return {
    condicion: p.condicion,
    edad: numOr(p.edad),
    ...ap(p.aporteModo, p.aporteValor),
    conyuge: p.conyuge ? { edad: numOr(p.cEdad), aporta: p.cAporta, ...ap(p.cModo, p.cValor) } : null,
    hijos: p.hijos.map(numOr).filter((h) => h !== ""),
  };
}

export function grupoTexto(p, reglas) {
  const partes = [`Titular ${p.edad} años`];
  if (p.conyuge && p.cEdad !== "") partes.push(`cónyuge ${p.cEdad} años${p.cAporta ? " (con aportes)" : ""}`);
  const hijos = p.hijos.filter((h) => h !== "");
  if (hijos.length) partes.push(`${hijos.length} hijo${hijos.length > 1 ? "s" : ""} (${hijos.join(", ")} años)`);
  return partes.join(" · ");
}

function Particular({ ctx, p, setP }) {
  const { lista, reglas, provincia } = ctx;
  const set = (k, v) => setP((x) => ({ ...x, [k]: v }));
  const cond = CONDICIONES.find((c) => c.key === p.condicion);
  const datos = datosParticular(p);
  const r = useMemo(() => cotizarParticular(lista, provincia, datos, reglas), [lista, provincia, JSON.stringify(datos), reglas]);
  const listo = !r.error;

  return (
    <div className="layout">
      <div className="stack sticky">
        <div className="card card-p stack">
          <div>
            <div className="sec-t">1 · Cliente</div>
            <div className="grid g2" style={{ gap: 10 }}>
              <Field label="Nombre">
                <input className="input" value={p.cliente} onChange={(ev) => set("cliente", ev.target.value)} placeholder="Ej: María González" />
              </Field>
              <Field label="Celular (opcional)" hint="Para enviarle la propuesta por WhatsApp">
                <input className="input" inputMode="tel" value={p.telefono} onChange={(ev) => set("telefono", ev.target.value)} placeholder="261 555 1234" />
              </Field>
            </div>
          </div>

          <div>
            <div className="sec-t">2 · ¿Cómo factura o cobra?</div>
            <div className="grid g2" style={{ gap: 8 }}>
              {CONDICIONES.map((c) => (
                <button key={c.key} className={"opt" + (p.condicion === c.key ? " on" : "")} onClick={() => set("condicion", c.key)} aria-pressed={p.condicion === c.key}>
                  <b>{c.corto}</b>
                  <span>
                    {reglas.campana[c.key] ? `Con ${reglas.descuento}% de campaña` : "Sin campaña"}
                    {reglas.conIva[c.key] ? ` · +IVA ${String(reglas.iva).replace(".", ",")}%` : ""}
                    {c.aporta ? " · descuenta aportes" : ""}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="sec-t">3 · Grupo familiar</div>
            <div className="grid g2" style={{ gap: 10 }}>
              <Field label="Edad del titular" hint={p.edad !== "" ? `Franja ${franjaDeEdad(p.edad)}` : null}>
                <input className="input tnum" type="number" min="0" max="110" inputMode="numeric" value={p.edad} onChange={(ev) => set("edad", ev.target.value)} placeholder="Ej: 38" />
              </Field>
              {cond && cond.aporta && <AporteInput modo={p.aporteModo} valor={p.aporteValor} onModo={(v) => set("aporteModo", v)} onValor={(v) => set("aporteValor", v)} reglas={reglas} />}
            </div>

            <div className="divider" />
            <label className="switch">
              <input type="checkbox" checked={p.conyuge} onChange={(ev) => set("conyuge", ev.target.checked)} /> Suma cónyuge o pareja
            </label>
            {p.conyuge && (
              <div className="stack-sm" style={{ marginTop: 10 }}>
                <div className="grid g2" style={{ gap: 10 }}>
                  <Field label="Edad del cónyuge">
                    <input className="input tnum" type="number" min="0" inputMode="numeric" value={p.cEdad} onChange={(ev) => set("cEdad", ev.target.value)} />
                  </Field>
                  <div style={{ paddingTop: 22 }}>
                    <label className="switch">
                      <input type="checkbox" checked={p.cAporta} onChange={(ev) => set("cAporta", ev.target.checked)} /> Trabaja en relación de dependencia
                    </label>
                  </div>
                </div>
                {p.cAporta && <AporteInput modo={p.cModo} valor={p.cValor} onModo={(v) => set("cModo", v)} onValor={(v) => set("cValor", v)} reglas={reglas} label="Aporte del cónyuge" />}
              </div>
            )}

            <div className="divider" />
            <div className="row between">
              <span className="label" style={{ margin: 0 }}>Hijos ({p.hijos.length})</span>
              <Btn sm icon={Ico.plus} onClick={() => set("hijos", [...p.hijos, ""])} disabled={p.hijos.length >= 10}>
                Agregar hijo
              </Btn>
            </div>
            {p.hijos.length > 0 && (
              <div className="row wrap" style={{ marginTop: 8 }}>
                {p.hijos.map((h, i) => (
                  <span key={i} className="kid">
                    <span className="muted" style={{ fontSize: 12 }}>Edad</span>
                    <input
                      className="input sm tnum"
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={h}
                      autoFocus={h === "" && i === p.hijos.length - 1}
                      onChange={(ev) => set("hijos", p.hijos.map((x, j) => (j === i ? ev.target.value : x)))}
                      aria-label={`Edad del hijo ${i + 1}`}
                    />
                    <button className="icon-btn" style={{ width: 24, height: 24, border: 0 }} onClick={() => set("hijos", p.hijos.filter((_, j) => j !== i))} aria-label="Quitar hijo">
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="hint">
              Hasta {reglas.edadHijo} años cotizan como hijo ({reglas.edadHijoPlanB} en Planes B); a partir de esa edad, como adulto por franja.
            </div>
          </div>
        </div>
      </div>

      <Resultados ctx={ctx} r={r} listo={listo} tipo="particular" p={p} datos={datos} />
    </div>
  );
}

function AporteInput({ modo, valor, onModo, onValor, reglas, label = "Aporte de obra social" }) {
  const real = modo === "bruto" ? numOr(valor) * reglas.factorAporte : (numOr(valor) / 0.03) * reglas.factorAporte;
  return (
    <Field label={label} hint={numOr(valor) ? `Aporte real a salud: ${money(real)} por mes` : modo === "bruto" ? "Sueldo bruto mensual" : "Aporte de obra social del recibo (3%)"}>
      <div className="row" style={{ gap: 6 }}>
        <select className="select" style={{ width: 120, flexShrink: 0 }} value={modo} onChange={(ev) => onModo(ev.target.value)} aria-label="Tipo de dato">
          <option value="aporte3">Aporte 3%</option>
          <option value="bruto">Sueldo bruto</option>
        </select>
        <input className="input tnum" type="number" min="0" inputMode="numeric" value={valor} onChange={(ev) => onValor(ev.target.value)} placeholder="$" />
      </div>
    </Field>
  );
}

// ================================================================== Empresa

function nominaDeRapida(rap) {
  const out = [];
  FRANJAS.forEach((f) => {
    for (let i = 0; i < (Number(rap[f]) || 0); i++) out.push({ nombre: `Titular ${out.length + 1}`, edad: EDAD_REP[f], bruto: "", aporte3: "", conyugeEdad: "", hijos: [] });
  });
  // 1.º hijo: uno por titular; del 2.º en adelante, en los que ya tienen uno.
  let h1 = Math.min(Number(rap.hijo1) || 0, out.length);
  for (let i = 0; i < h1; i++) out[i].hijos.push(8);
  let h2 = Number(rap.hijo2) || 0;
  for (let i = 0; h2 > 0 && h1 > 0; i = (i + 1) % h1, h2--) out[i].hijos.push(6);
  return out;
}

function Empresa({ ctx, e, setE }) {
  const { lista, reglas, provincia, toast } = ctx;
  const set = (k, v) => setE((x) => ({ ...x, [k]: v }));
  const nomina = e.fuente === "rapida" ? nominaDeRapida(e.rapida) : e.nomina;
  const r = useMemo(() => cotizarEmpresa(lista, provincia, nomina, reglas), [lista, provincia, JSON.stringify(nomina), reglas]);
  const [over, setOver] = useState(false);
  const fileRef = useRef(null);

  const importar = (file) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(new Uint8Array(ev.target.result), { type: "array" });
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: null });
        const nom = nominaDesdeFilas(rows);
        if (!nom.length) return toast("No encontré filas con edad de titular. Usá la plantilla: la columna B es la edad.");
        setE((x) => ({ ...x, fuente: "manual", nomina: nom }));
        toast(`✓ Nómina cargada: ${nom.length} titulares`);
      } catch (err) {
        toast("No pude leer el archivo. Verificá que sea la plantilla de nómina en Excel.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const plantilla = () => {
    const ws = XLSX.utils.aoa_to_sheet([PLANTILLA_COLUMNAS, ["Juan Pérez", 38, 1500000, "", 36, 8, 5], ["Ana Gómez", 29, 1200000, "", "", "", ""]]);
    ws["!cols"] = PLANTILLA_COLUMNAS.map((c, i) => ({ wch: i === 0 ? 26 : 14 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Nómina");
    XLSX.writeFile(wb, "Plantilla_Nomina_Omint.xlsx");
  };

  const setFila = (i, k, v) => set("nomina", e.nomina.map((f, j) => (j === i ? { ...f, [k]: v } : f)));

  return (
    <div className="layout">
      <div className="stack sticky">
        <div className="card card-p stack">
          <div>
            <div className="sec-t">1 · Empresa</div>
            <Field label="Razón social o nombre">
              <input className="input" value={e.empresa} onChange={(ev) => set("empresa", ev.target.value)} placeholder="Ej: Distribuidora Cuyo SA" />
            </Field>
            <div className="grid g2" style={{ gap: 10, marginTop: 10 }}>
              <Field label="CUIT (opcional)">
                <input className="input" value={e.cuit} onChange={(ev) => set("cuit", ev.target.value)} placeholder="30-12345678-9" />
              </Field>
              <Field label="Celular del contacto (opcional)">
                <input className="input" inputMode="tel" value={e.telefono} onChange={(ev) => set("telefono", ev.target.value)} />
              </Field>
            </div>
          </div>

          <div>
            <div className="sec-t">2 · Nómina</div>
            <div className="seg" style={{ width: "100%" }}>
              <button style={{ flex: 1 }} className={e.fuente !== "rapida" ? "on" : ""} onClick={() => set("fuente", "manual")}>
                Nómina detallada
              </button>
              <button style={{ flex: 1 }} className={e.fuente === "rapida" ? "on" : ""} onClick={() => set("fuente", "rapida")}>
                Estimación rápida
              </button>
            </div>

            {e.fuente !== "rapida" ? (
              <div className="stack-sm" style={{ marginTop: 10 }}>
                <div
                  className={"drop" + (over ? " over" : "")}
                  onClick={() => fileRef.current && fileRef.current.click()}
                  onDragOver={(ev) => {
                    ev.preventDefault();
                    setOver(true);
                  }}
                  onDragLeave={() => setOver(false)}
                  onDrop={(ev) => {
                    ev.preventDefault();
                    setOver(false);
                    const f = ev.dataTransfer.files[0];
                    if (f) importar(f);
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div style={{ color: "var(--navy)" }}>{Ico.upload}</div>
                  <div style={{ fontWeight: 700, marginTop: 4 }}>Subí el Excel de la nómina</div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    o arrastralo acá ·{" "}
                    <a
                      href="#"
                      onClick={(ev) => {
                        ev.preventDefault();
                        ev.stopPropagation();
                        plantilla();
                      }}
                    >
                      descargar plantilla
                    </a>
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    style={{ display: "none" }}
                    onChange={(ev) => {
                      const f = ev.target.files[0];
                      if (f) importar(f);
                      ev.target.value = "";
                    }}
                  />
                </div>
                <NominaTabla nomina={e.nomina} setFila={setFila} quitar={(i) => set("nomina", e.nomina.filter((_, j) => j !== i))} />
                <div className="row wrap">
                  <Btn sm icon={Ico.plus} onClick={() => set("nomina", [...e.nomina, { nombre: `Titular ${e.nomina.length + 1}`, edad: "", bruto: "", aporte3: "", conyugeEdad: "", hijos: [] }])}>
                    Agregar titular
                  </Btn>
                  {e.nomina.length > 0 && (
                    <Btn sm v="ghost" onClick={() => set("nomina", [])}>
                      Vaciar
                    </Btn>
                  )}
                </div>
              </div>
            ) : (
              <div className="stack-sm" style={{ marginTop: 10 }}>
                <div className="hint" style={{ marginTop: 0 }}>
                  Para una idea rápida sin nombres ni sueldos (no descuenta aportes). Cargá cuántas personas adultas hay por franja (titulares y cónyuges) y cuántos hijos.
                </div>
                {[...FRANJAS.map((f) => [f, `Adultos ${f.replace("-", " a ")}${f === "60+" ? "" : " años"}`]), ["hijo1", "1.er hijo de cada familia"], ["hijo2", "Hijos del 2.º en adelante"]].map(([k, l]) => (
                  <div key={k} className="row between">
                    <span className="ink2">{l}</span>
                    <input className="input sm tnum" style={{ width: 80 }} type="number" min="0" inputMode="numeric" value={e.rapida[k]} onChange={(ev) => set("rapida", { ...e.rapida, [k]: Math.max(0, Math.round(Number(ev.target.value) || 0)) })} aria-label={l} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Resultados ctx={ctx} r={r} listo={!r.error} tipo="empresa" e={e} nomina={nomina} />
    </div>
  );
}

function NominaTabla({ nomina, setFila, quitar }) {
  if (!nomina.length) return <div className="muted" style={{ fontSize: 12.5, textAlign: "center", padding: 6 }}>Todavía no hay titulares cargados.</div>;
  return (
    <div style={{ maxHeight: 360, overflow: "auto", border: "1px solid var(--line)", borderRadius: 12 }}>
      <table className="t">
        <thead>
          <tr>
            <th>Titular</th>
            <th>Edad</th>
            <th>Sueldo bruto</th>
            <th>Cónyuge</th>
            <th>Hijos (edades)</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {nomina.map((f, i) => (
            <tr key={i}>
              <td><input className="input sm" style={{ minWidth: 110 }} value={f.nombre} onChange={(ev) => setFila(i, "nombre", ev.target.value)} aria-label="Nombre" /></td>
              <td><input className="input sm tnum" style={{ width: 58 }} type="number" min="0" value={f.edad} onChange={(ev) => setFila(i, "edad", numOr(ev.target.value))} aria-label="Edad" /></td>
              <td>
                <input
                  className="input sm tnum"
                  style={{ width: 104 }}
                  type="number"
                  min="0"
                  value={f.bruto !== "" ? f.bruto : f.aporte3 !== "" ? Math.round(f.aporte3 / 0.03) : ""}
                  onChange={(ev) => {
                    setFila(i, "bruto", numOr(ev.target.value));
                  }}
                  onBlur={() => f.aporte3 !== "" && setFila(i, "aporte3", "")}
                  aria-label="Sueldo bruto"
                />
              </td>
              <td><input className="input sm tnum" style={{ width: 58 }} type="number" min="0" value={f.conyugeEdad} onChange={(ev) => setFila(i, "conyugeEdad", numOr(ev.target.value))} aria-label="Edad del cónyuge" /></td>
              <td>
                <input
                  className="input sm"
                  style={{ width: 96 }}
                  defaultValue={f.hijos.join(", ")}
                  key={f.hijos.join(",")}
                  onBlur={(ev) => setFila(i, "hijos", ev.target.value.split(/[,; ]+/).map(numOr).filter((x) => x !== ""))}
                  placeholder="8, 5"
                  aria-label="Edades de los hijos"
                />
              </td>
              <td><button className="icon-btn" style={{ width: 26, height: 26 }} onClick={() => quitar(i)} aria-label="Quitar titular">✕</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// =============================================================== Resultados

function Resultados({ ctx, r, listo, tipo, p, e, nomina, datos }) {
  const { reglas, planesInfo, provincia, lista, yo, api, toast, embed, avisarCRM } = ctx;
  const [sel, setSel] = useState([]);
  const [filtro, setFiltro] = useState("todos");
  const [verNo, setVerNo] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [trabajando, setTrabajando] = useState(false);
  const disponibles = (r.planes || []).filter((x) => x.disponible);
  const noDisp = (r.planes || []).filter((x) => !x.disponible);
  const secciones = [...new Set(disponibles.map((x) => (x.planB ? "B" : x.pyme ? "PYME" : x.seccion === "Planes Comunidad" ? "Comunidad" : "Estándar")))];
  const visibles = disponibles.filter((x) => filtro === "todos" || (filtro === "B" ? x.planB : filtro === "PYME" ? x.pyme : filtro === "Comunidad" ? x.seccion === "Planes Comunidad" : !x.planB && !x.pyme && x.seccion !== "Planes Comunidad"));
  const mejor = disponibles[0];

  // Si cambian los datos, se descartan selecciones que ya no aplican.
  useEffect(() => {
    setSel((s) => s.filter((c) => disponibles.some((x) => x.codigo === c)));
  }, [JSON.stringify(disponibles.map((x) => x.codigo))]);

  const toggle = (c) => setSel((s) => (s.includes(c) ? s.filter((x) => x !== c) : [...s, c]));
  const elegidos = (codigos) => disponibles.filter((x) => codigos.includes(x.codigo));
  const nombreCliente = tipo === "empresa" ? e.empresa : p.cliente;
  const telefono = tipo === "empresa" ? e.telefono : p.telefono;

  const registro = (planes) => ({
    tipo,
    cliente: nombreCliente || "",
    provincia,
    vigencia: lista.vigencia,
    capitas: r.capitas,
    entrada: tipo === "empresa" ? { ...e, nomina: e.fuente === "rapida" ? [] : e.nomina } : p,
    condicion: tipo === "particular" ? r.condicion.label : "",
    planes: planes.map((x) => ({ codigo: x.codigo, nombre: x.nombre, familia: x.familia, lista: Math.round(x.lista), bonificado: Math.round(x.bonificado), aporte: Math.round(x.aporte || 0), aPagar: Math.round(x.aPagar) })),
  });

  const mensajeCRM = (planes) => ({
    fuente: "cotizador-omint",
    tipo: tipo === "empresa" ? "empresa" : "individual",
    datos: {
      nombre: nombreCliente || "",
      provincia,
      capitas: tipo === "empresa" ? r.capitas : null,
      titulares: tipo === "empresa" ? r.titulares : null,
      condicion: tipo === "particular" ? r.condicion.label : "",
      grupo: tipo === "particular" ? grupoTexto(p, reglas) : null,
      planes: planes.map((x) => ({ plan: x.nombre, tag: etiquetaPlan(x), lista: x.lista, bonificado: x.bonificado, aporte: x.aporte || 0, aPagar: x.aPagar })),
    },
  });

  async function generar(codigos, compartir) {
    const planes = elegidos(codigos);
    if (!planes.length) return;
    setTrabajando(true);
    try {
      const base = { provincia, vigencia: lista.vigencia, reglas, resultado: r, planes, ejecutivo: yo, planesInfo };
      const doc = tipo === "empresa" ? await pdfEmpresa({ ...base, empresa: e.empresa, cuit: e.cuit }) : await pdfParticular({ ...base, cliente: p.cliente, grupoTexto: grupoTexto(p, reglas) });
      const base0 = (nombreCliente || (tipo === "empresa" ? "Empresa" : "Particular")).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w]+/g, "_");
      const nombre = `Cotizacion_Omint_${base0}_${planes.length > 1 ? "comparativa" : planes[0].codigo}.pdf`;
      const blob = doc.output("blob");
      const file = new File([blob], nombre, { type: "application/pdf" });
      if (compartir && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: "Cotización Omint", text: `Cotización Omint${nombreCliente ? " para " + nombreCliente : ""}` });
        } catch (err) {
          // el usuario canceló el menú de compartir
        }
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = nombre;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
      }
      api("guardarCotizacion", { cotizacion: registro(planes) }).catch(() => toast("El PDF se generó, pero no se pudo guardar en el historial."));
      if (embed) avisarCRM(mensajeCRM(planes));
      toast(embed ? "✓ PDF generado y guardado en la ficha del CRM" : "✓ PDF generado y guardado en tu historial");
    } catch (err) {
      console.error(err);
      toast("No se pudo generar el PDF: " + err.message);
    }
    setTrabajando(false);
  }

  function textoWhatsApp(codigos) {
    const planes = elegidos(codigos);
    const saludo = nombreCliente ? `Hola ${tipo === "empresa" ? "" : (nombreCliente.split(" ")[0] || "") + "! "}` : "Hola! ";
    const lineas = planes.map((x) => {
      const pref = tipo === "empresa" ? "total mensual" : r.aporte > 0 ? "diferencia a pagar" : "por mes";
      return `• *${x.nombre}* (${etiquetaPlan(x)}): ${x.aPagar <= 0 ? "cubierto con tus aportes" : `${money(x.aPagar)} ${pref}`}${r.conCampana ? ` (lista ${money(x.lista)})` : ""}`;
    });
    return `${tipo === "empresa" ? saludo.trim() + " " : saludo}Te comparto la cotización de Omint${tipo === "empresa" && nombreCliente ? ` para ${nombreCliente}` : ""}${tipo === "empresa" ? ` (${r.capitas} cápitas)` : ""}:

${lineas.join("\n")}
${r.conCampana ? `\nIncluye la campaña de *${reglas.descuento}% de descuento durante ${reglas.meses} meses*.` : ""}
Valores de la lista ${lista.vigencia} para ${provincia}. ¿Te paso el detalle completo en PDF?

${yo.nombre}${yo.cargo ? " · " + yo.cargo : ""} · Omint`;
  }

  function whatsapp(codigos) {
    const t = encodeURIComponent(textoWhatsApp(codigos));
    const d = String(telefono || "").replace(/\D/g, "");
    const n = d ? (d.startsWith("54") ? d : "549" + d.replace(/^0/, "").replace(/^15/, "")) : "";
    window.open(n ? `https://wa.me/${n}?text=${t}` : `https://wa.me/?text=${t}`, "_blank");
    api("guardarCotizacion", { cotizacion: { ...registro(elegidos(codigos)), via: "whatsapp" } }).catch(() => {});
    if (embed) avisarCRM(mensajeCRM(elegidos(codigos)));
  }

  if (!listo) {
    return (
      <div className="card card-p" style={{ minHeight: 260, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <div>
          <div style={{ color: "var(--lilac)", display: "inline-flex", transform: "scale(1.8)", marginBottom: 12 }}>{Ico.calc}</div>
          <h2>Completá los datos y los planes aparecen acá</h2>
          <div className="muted" style={{ marginTop: 6 }}>{r.error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="card card-p">
        <div className="grid g4">
          {tipo === "empresa" ? (
            <>
              <div className="kpi"><b className="tnum">{r.titulares}</b><span>titulares</span></div>
              <div className="kpi"><b className="tnum">{r.capitas}</b><span>cápitas · tramo {r.tramo}</span></div>
              <div className="kpi"><b className="tnum">{r.conAporte}</b><span>con sueldo o aporte</span></div>
              <div className="kpi"><b className="tnum">{mejor ? money(mejor.aPagar) : "—"}</b><span>opción más económica / mes</span></div>
            </>
          ) : (
            <>
              <div className="kpi"><b className="tnum">{r.capitas}</b><span>cápita{r.capitas > 1 ? "s" : ""}</span></div>
              <div className="kpi"><b style={{ fontSize: 15, paddingTop: 4 }}>{r.condicion.corto}</b><span>{r.conCampana ? `campaña ${reglas.descuento}% · ${reglas.meses} meses` : "sin campaña"}{r.conIva ? " · con IVA" : ""}</span></div>
              <div className="kpi"><b className="tnum">{r.aporte > 0 ? money(r.aporte) : "—"}</b><span>aporte que se descuenta</span></div>
              <div className="kpi"><b className="tnum">{mejor ? (mejor.aPagar <= 0 ? "Cubierto" : money(mejor.aPagar)) : "—"}</b><span>opción más económica / mes</span></div>
            </>
          )}
        </div>
        {tipo === "empresa" && r.sinAporte > 0 && r.conAporte > 0 && <div className="note n-warn" style={{ marginTop: 10 }}>{r.sinAporte} titulares no tienen sueldo cargado: a ellos no se les descuenta aporte.</div>}
      </div>

      <div className="row between wrap">
        <h2>{disponibles.length} planes disponibles en {provincia}</h2>
        {secciones.length > 1 && (
          <div className="seg">
            <button className={filtro === "todos" ? "on" : ""} onClick={() => setFiltro("todos")}>Todos</button>
            {secciones.map((s) => (
              <button key={s} className={filtro === s ? "on" : ""} onClick={() => setFiltro(s)}>
                {s === "B" ? "Plan B" : s}
              </button>
            ))}
          </div>
        )}
      </div>

      {tipo === "particular" ? (
        <div className="grid g2">
          {visibles.map((x) => (
            <PlanCard key={x.codigo} x={x} r={r} reglas={reglas} mejor={mejor && mejor.codigo === x.codigo} sel={sel.includes(x.codigo)} onSel={() => toggle(x.codigo)} onPdf={() => generar([x.codigo])} trabajando={trabajando} planesInfo={planesInfo} />
          ))}
        </div>
      ) : (
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table className="t">
              <thead>
                <tr>
                  <th style={{ width: 34 }}></th>
                  <th>Plan</th>
                  <th className="r">Lista</th>
                  <th className="r">{r.conCampana ? `Con ${reglas.descuento}%` : "Precio"}</th>
                  <th className="r hide-sm">Aportes</th>
                  <th className="r">Total empresa / mes</th>
                  <th className="r hide-sm">Por cápita</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((x) => (
                  <tr key={x.codigo} className="click" onClick={() => toggle(x.codigo)} style={{ background: sel.includes(x.codigo) ? "#F3F5FC" : undefined }}>
                    <td><input type="checkbox" checked={sel.includes(x.codigo)} onChange={() => toggle(x.codigo)} onClick={(ev) => ev.stopPropagation()} aria-label={`Incluir ${x.nombre}`} /></td>
                    <td>
                      <div className="row" style={{ gap: 8 }}>
                        <span style={{ width: 4, height: 28, borderRadius: 2, background: colorFamilia(x.familia) }} />
                        <div>
                          <b>{x.nombre.replace("Plan ", "")}</b> {mejor && mejor.codigo === x.codigo && <span className="chip badge-best">Más económico</span>}
                          <div className="muted" style={{ fontSize: 11.5 }}>{etiquetaPlan(x)}{x.nota ? ` · ${x.nota}` : ""}</div>
                        </div>
                      </div>
                    </td>
                    <td className="r tnum" style={{ color: r.conCampana ? "var(--muted)" : undefined, textDecoration: r.conCampana ? "line-through" : "none" }}>{money(x.lista)}</td>
                    <td className="r tnum">{money(x.bonificado)}</td>
                    <td className="r tnum hide-sm">{x.aporte ? "−" + money(x.aporte) : "—"}</td>
                    <td className="r tnum" style={{ fontWeight: 800, color: "var(--navy-deep)" }}>{money(x.aPagar)}</td>
                    <td className="r tnum hide-sm">{money(x.aPagar / r.capitas)}</td>
                    <td><Btn sm v="ghost" onClick={(ev) => { ev.stopPropagation(); setDetalle(x); }}>Detalle</Btn></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {noDisp.length > 0 && (
        <div>
          <button className="btn b-ghost btn-sm" onClick={() => setVerNo((v) => !v)}>{verNo ? "Ocultar" : "Ver"} {noDisp.length} planes que no aplican</button>
          {verNo && (
            <div className="card card-p" style={{ marginTop: 6 }}>
              {noDisp.map((x) => (
                <div key={x.codigo} className="row between" style={{ padding: "4px 0", fontSize: 13 }}>
                  <span>{x.nombre} <span className="muted">· {etiquetaPlan(x)}</span></span>
                  <span className="muted">{x.motivo}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="actionbar">
        <span style={{ fontWeight: 700 }}>{sel.length ? `${sel.length} plan${sel.length > 1 ? "es" : ""} seleccionado${sel.length > 1 ? "s" : ""}` : "Elegí los planes a enviar"}</span>
        {!sel.length && mejor && <span style={{ color: "#A9B6E0", fontSize: 12.5 }}>o usá el más económico</span>}
        <div className="row wrap" style={{ marginLeft: "auto" }}>
          <Btn v="cyan" icon={Ico.pdf} disabled={trabajando || (!sel.length && !mejor)} onClick={() => generar(sel.length ? sel : [mejor.codigo])}>
            {trabajando ? "Generando…" : sel.length > 1 ? "PDF comparativo" : "PDF"}
          </Btn>
          {navigator.share && <Btn v="outline" icon={Ico.share} disabled={trabajando || (!sel.length && !mejor)} onClick={() => generar(sel.length ? sel : [mejor.codigo], true)}>Compartir</Btn>}
          <Btn v="wa" icon={Ico.wa} disabled={!sel.length && !mejor} onClick={() => whatsapp(sel.length ? sel : [mejor.codigo])}>WhatsApp</Btn>
          {embed && (
            <Btn v="outline" icon={Ico.crm} disabled={!sel.length && !mejor} onClick={() => { avisarCRM(mensajeCRM(elegidos(sel.length ? sel : [mejor.codigo]))); api("guardarCotizacion", { cotizacion: { ...registro(elegidos(sel.length ? sel : [mejor.codigo])), via: "crm" } }).catch(() => {}); toast("✓ Guardada en la ficha del CRM"); }}>
              Guardar en CRM
            </Btn>
          )}
        </div>
      </div>

      {detalle && (
        <Modal title={`Detalle · ${detalle.nombre}`} onClose={() => setDetalle(null)} width={860}>
          <div className="muted" style={{ marginBottom: 10 }}>{etiquetaPlan(detalle)} · {r.capitas} cápitas · tramo {r.tramo}</div>
          <div style={{ overflowX: "auto" }}>
            <table className="t">
              <thead>
                <tr><th>Titular</th><th>Edad</th><th>Cónyuge</th><th>Hijos</th><th className="r">Lista</th><th className="r">Con desc.</th><th className="r">Aporte</th><th className="r">A pagar</th></tr>
              </thead>
              <tbody>
                {detalle.detalle.map((d, i) => (
                  <tr key={i}>
                    <td>{d.nombre}</td><td>{d.edad}</td><td>{d.conyugeEdad === "" || d.conyugeEdad == null ? "—" : d.conyugeEdad}</td><td>{d.hijos.length ? d.hijos.join(", ") : "—"}</td>
                    <td className="r tnum">{money(d.lista)}</td><td className="r tnum">{money(d.bonificado)}</td><td className="r tnum">{d.aporte ? money(d.aporte) : "—"}</td><td className="r tnum" style={{ fontWeight: 700 }}>{money(d.aPagar)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {detalle.excedente > 0 && <div className="note n-info" style={{ marginTop: 10 }}>Aportes que superan el valor de su grupo familiar: {money(detalle.excedente)} por mes (no se descuentan del resto).</div>}
          <div className="divider" />
          <div className="sec-t">Lo que incluye</div>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>{beneficiosDe(detalle.codigo, planesInfo).map((b) => <li key={b}>{b}</li>)}</ul>
        </Modal>
      )}
    </div>
  );
}

function PlanCard({ x, r, reglas, mejor, sel, onSel, onPdf, trabajando, planesInfo }) {
  const ben = beneficiosDe(x.codigo, planesInfo);
  return (
    <div className={"plan" + (sel ? " sel" : "")}>
      <span className="bar" style={{ background: colorFamilia(x.familia) }} />
      <div className="row between" style={{ alignItems: "flex-start" }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15.5 }}>{x.nombre}</div>
          <span className="chip" style={{ background: softFamilia(x.familia), color: colorFamilia(x.familia), marginTop: 3 }}>{etiquetaPlan(x)}</span>
          {mejor && <span className="chip badge-best" style={{ marginLeft: 6 }}>Más económico</span>}
        </div>
        <label className="switch" style={{ fontSize: 12.5 }}>
          <input type="checkbox" checked={sel} onChange={onSel} /> Elegir
        </label>
      </div>
      <div style={{ marginTop: 10 }}>
        <div className="muted" style={{ fontSize: 12 }}>{x.cubre ? "Tus aportes cubren el plan" : r.aporte > 0 ? "Diferencia a pagar por mes" : "Total por mes"}</div>
        <div className="big tnum">{x.cubre ? `+${money(-x.aPagar)}` : money(x.aPagar)}</div>
        <div className="tnum" style={{ fontSize: 12.5, marginTop: 4, lineHeight: 1.6 }}>
          <span className={r.conCampana ? "strike" : ""}>Lista {money(x.lista)}</span>
          {r.conCampana && <> · <b>{money(x.bonificado)}</b> con {reglas.descuento}%</>}
          {r.aporte > 0 && <> · aporte −{money(x.aporte)}</>}
        </div>
        {r.conCampana && <div className="muted tnum" style={{ fontSize: 12 }}>Desde el mes {reglas.meses + 1}: {x.aPagarSinCampana <= 0 ? "cubierto" : money(x.aPagarSinCampana)}</div>}
        {x.nota && <div className="note n-warn" style={{ marginTop: 6, padding: "5px 9px" }}>{x.nota}</div>}
      </div>
      {ben.length > 0 && (
        <ul style={{ margin: "10px 0 0", paddingLeft: 16, fontSize: 12.3, color: "var(--ink2)", lineHeight: 1.5 }}>
          {ben.slice(0, 3).map((b) => <li key={b}>{b}</li>)}
        </ul>
      )}
      <div className="row" style={{ marginTop: 10 }}>
        <Btn sm v="outline" icon={Ico.pdf} onClick={onPdf} disabled={trabajando}>PDF de este plan</Btn>
      </div>
    </div>
  );
}
