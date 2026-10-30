import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { parseListaPrecios, resumenLista, compararListas, ordenVigencia, TRAMOS } from "./lista.js";
import { CONDICIONES, REGLAS_DEFAULT } from "./motor.js";
import { PLANES_INFO_DEFAULT, beneficiosDe, colorFamilia } from "./catalogo.js";
import { Btn, Field, Modal, money, Ico } from "./ui.jsx";

const fechaHora = (s) => (s ? new Date(s).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");

// ================================================================ Historial

export function Historial({ ctx, todas }) {
  const { api, toast, reabrir, yo } = ctx;
  const [items, setItems] = useState(null);
  const [q, setQ] = useState("");
  const [meses, setMeses] = useState(3);
  const [verTodas, setVerTodas] = useState(!!todas);
  useEffect(() => {
    setItems(null);
    api("cotizaciones", { meses, todas: verTodas })
      .then((r) => setItems(r.cotizaciones))
      .catch((e) => {
        setItems([]);
        toast(e.message);
      });
  }, [meses, verTodas]);
  const filtrados = (items || []).filter((c) => {
    const t = q.trim().toLowerCase();
    return !t || [c.cliente, c.ejecutivo, c.provincia, ...(c.planes || []).map((p) => p.nombre)].join(" ").toLowerCase().includes(t);
  });
  return (
    <div className="stack">
      <div className="row between wrap">
        <div>
          <h1>{verTodas ? "Cotizaciones de toda la empresa" : "Mis cotizaciones"}</h1>
          <div className="muted">Cada PDF o envío por WhatsApp queda registrado. Al reabrir se recalcula con la lista vigente.</div>
        </div>
        <div className="row wrap">
          {yo.rol === "admin" && (
            <div className="seg">
              <button className={!verTodas ? "on" : ""} onClick={() => setVerTodas(false)}>Mías</button>
              <button className={verTodas ? "on" : ""} onClick={() => setVerTodas(true)}>Todas</button>
            </div>
          )}
          <select className="select" style={{ width: "auto" }} value={meses} onChange={(e) => setMeses(Number(e.target.value))} aria-label="Período">
            <option value={1}>Este mes</option>
            <option value={3}>Últimos 3 meses</option>
            <option value={6}>Últimos 6 meses</option>
            <option value={12}>Último año</option>
          </select>
          <input className="input" style={{ width: 220 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar cliente, plan…" />
        </div>
      </div>
      <div className="card" style={{ overflow: "hidden" }}>
        {items === null ? (
          <div className="muted" style={{ padding: 20, textAlign: "center" }}>Cargando…</div>
        ) : filtrados.length === 0 ? (
          <div className="muted" style={{ padding: 20, textAlign: "center" }}>No hay cotizaciones en este período.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="t">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Tipo</th>
                  <th>Provincia</th>
                  <th>Planes</th>
                  <th className="r">Desde / mes</th>
                  {verTodas && <th>Ejecutivo</th>}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((c) => (
                  <tr key={c.id}>
                    <td className="tnum" style={{ whiteSpace: "nowrap" }}>{fechaHora(c.fecha)}</td>
                    <td><b>{c.cliente || "Sin nombre"}</b>{c.via && <span className="chip" style={{ marginLeft: 6 }}>{c.via === "whatsapp" ? "WhatsApp" : "CRM"}</span>}</td>
                    <td>{c.tipo === "empresa" ? `Empresa · ${c.capitas} cáp.` : "Particular"}</td>
                    <td>{c.provincia}</td>
                    <td style={{ maxWidth: 260 }}>{(c.planes || []).map((p) => p.nombre.replace("Plan ", "")).join(", ")}</td>
                    <td className="r tnum">{c.planes && c.planes.length ? money(Math.min(...c.planes.map((p) => p.aPagar))) : "—"}</td>
                    {verTodas && <td>{c.ejecutivo}</td>}
                    <td><Btn sm v="outline" onClick={() => reabrir(c)}>Reabrir</Btn></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// =========================================================== Administración

export function Admin({ ctx }) {
  const [tab, setTab] = useState("lista");
  const tabs = [
    ["lista", "Lista de precios"],
    ["usuarios", "Usuarios"],
    ["reglas", "Reglas comerciales"],
    ["planes", "Planes"],
    ["actividad", "Actividad"],
  ];
  return (
    <div className="stack">
      <div className="row between wrap">
        <h1>Administración</h1>
        <div className="seg" style={{ overflowX: "auto", maxWidth: "100%" }}>
          {tabs.map(([k, l]) => (
            <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>
      </div>
      {tab === "lista" && <AdminLista ctx={ctx} />}
      {tab === "usuarios" && <AdminUsuarios ctx={ctx} />}
      {tab === "reglas" && <AdminReglas ctx={ctx} />}
      {tab === "planes" && <AdminPlanes ctx={ctx} />}
      {tab === "actividad" && <AdminActividad ctx={ctx} />}
    </div>
  );
}

function AdminLista({ ctx }) {
  const { api, toast, lista, listaMeta, recargar } = ctx;
  const [nueva, setNueva] = useState(null);
  const [archivo, setArchivo] = useState("");
  const [hist, setHist] = useState([]);
  const [leyendo, setLeyendo] = useState(false);
  const cargarHist = () => api("listas").then((r) => setHist(r.historial)).catch(() => {});
  useEffect(() => {
    cargarHist();
  }, []);

  const leer = (file) => {
    setLeyendo(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(new Uint8Array(ev.target.result), { type: "array" });
        const l = parseListaPrecios(XLSX, wb);
        setArchivo(file.name);
        setNueva(l);
      } catch (e) {
        toast("No pude leer la lista: " + e.message);
      }
      setLeyendo(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const publicar = async () => {
    try {
      const { errores, avisos, ...limpia } = nueva;
      await api("publicarLista", { lista: limpia, archivo });
      toast(`✓ Lista ${nueva.vigencia} publicada. Todos los ejecutivos ya cotizan con estos valores.`);
      setNueva(null);
      cargarHist();
      recargar();
    } catch (e) {
      toast(e.message);
    }
  };

  const comp = nueva ? compararListas(nueva, lista) : null;
  const res = nueva ? resumenLista(nueva) : null;

  return (
    <div className="grid g2">
      <div className="card card-p stack">
        <div className="sec-t">Lista vigente</div>
        <div>
          <h2>{lista.vigencia}</h2>
          <div className="muted">{listaMeta ? `Publicada por ${listaMeta.subidaPor}${listaMeta.fecha ? " · " + fechaHora(listaMeta.fecha) : ""}` : ""}</div>
        </div>
        <div className="grid g3">
          <div className="kpi"><b>{Object.keys(lista.provincias).length}</b><span>provincias</span></div>
          <div className="kpi"><b>{Object.keys(lista.zonas).length}</b><span>zonas de precio</span></div>
          <div className="kpi"><b>{resumenLista(lista).planes}</b><span>planes</span></div>
        </div>
        <label className="drop" style={{ display: "block" }}>
          <div style={{ color: "var(--navy)" }}>{Ico.upload}</div>
          <div style={{ fontWeight: 700, marginTop: 4 }}>{leyendo ? "Leyendo…" : "Subir la lista de precios del mes"}</div>
          <div className="muted" style={{ fontSize: 12 }}>El Excel "Lista de precios EMPRESAS" de Omint (.xls o .xlsx), tal como llega.</div>
          <input type="file" accept=".xls,.xlsx" style={{ display: "none" }} onChange={(e) => { const f = e.target.files[0]; if (f) leer(f); e.target.value = ""; }} />
        </label>
        <div className="note n-info">Antes de publicar vas a ver un resumen y la variación de precios contra la lista vigente. Nada cambia hasta que confirmás.</div>
      </div>

      <div className="card card-p stack">
        <div className="sec-t">Historial de listas</div>
        {hist.length === 0 ? (
          <div className="muted">Todavía no se publicó ninguna lista: se usa la que vino con la instalación ({lista.vigencia}).</div>
        ) : (
          <table className="t">
            <thead><tr><th>Vigencia</th><th>Publicada</th><th></th></tr></thead>
            <tbody>
              {hist.map((h) => (
                <tr key={h.id}>
                  <td><b>{h.vigencia}</b><div className="muted" style={{ fontSize: 11.5 }}>{h.archivo}</div></td>
                  <td className="tnum">{fechaHora(h.fecha)}<div className="muted" style={{ fontSize: 11.5 }}>{h.subidaPor}</div></td>
                  <td>
                    {listaMeta && listaMeta.id === h.id ? (
                      <span className="chip badge-best">Vigente</span>
                    ) : (
                      <Btn sm v="outline" onClick={async () => { try { await api("activarLista", { id: h.id }); toast(`✓ Volviste a la lista ${h.vigencia}`); recargar(); cargarHist(); } catch (e) { toast(e.message); } }}>Usar esta</Btn>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {nueva && (
        <Modal title={`Publicar lista ${nueva.vigencia || ""}`} onClose={() => setNueva(null)} width={760}>
          <div className="stack">
            <div className="grid g4">
              <div className="kpi"><b>{res.vigencia || "?"}</b><span>vigencia</span></div>
              <div className="kpi"><b>{res.provincias}</b><span>provincias</span></div>
              <div className="kpi"><b>{res.zonas}</b><span>zonas</span></div>
              <div className="kpi"><b>{res.planes}</b><span>planes</span></div>
            </div>
            {comp && (
              <div className={"note " + (Math.abs(comp.promedio) > 0.15 ? "n-warn" : "n-lilac")}>
                Variación contra la lista vigente ({lista.vigencia}): <b>{(comp.promedio * 100).toFixed(2).replace(".", ",")}%</b> promedio
                {(comp.min * 100).toFixed(1) !== (comp.max * 100).toFixed(1) ? <> (de {(comp.min * 100).toFixed(1).replace(".", ",")}% a {(comp.max * 100).toFixed(1).replace(".", ",")}%)</> : " (pareja en todos los planes)"} en {comp.comparados.toLocaleString("es-AR")} precios comparados.
                {Math.abs(comp.promedio) > 0.15 && " Es una variación grande: revisá que el archivo sea el correcto."}
              </div>
            )}
            {ordenVigencia(nueva.vigencia) !== null && ordenVigencia(lista.vigencia) !== null && ordenVigencia(nueva.vigencia) < ordenVigencia(lista.vigencia) && (
              <div className="note n-bad">
                <b>Atención:</b> esta lista ({nueva.vigencia}) es <b>más vieja</b> que la vigente ({lista.vigencia}). Si la publicás, todos van a cotizar con precios anteriores.
              </div>
            )}
            {ordenVigencia(nueva.vigencia) === ordenVigencia(lista.vigencia) && nueva.vigencia && <div className="note n-warn">Es la misma vigencia que la lista actual ({lista.vigencia}). Publicala solo si es una corrección.</div>}
            {nueva.errores.length > 0 && <div className="note n-bad"><b>Hay problemas en el archivo:</b><ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>{nueva.errores.slice(0, 10).map((e) => <li key={e}>{e}</li>)}</ul></div>}
            {nueva.avisos.length > 0 && <div className="note n-warn">{nueva.avisos.join(" ")}</div>}
            <div style={{ maxHeight: 300, overflow: "auto", border: "1px solid var(--line)", borderRadius: 12 }}>
              <table className="t">
                <thead><tr><th>Zona de precios</th><th>Provincias</th><th>Planes</th></tr></thead>
                <tbody>
                  {Object.entries(nueva.zonas).map(([id, z]) => (
                    <tr key={id}>
                      <td><b>{z.titulo.length > 40 ? z.titulo.slice(0, 40) + "…" : z.titulo}</b></td>
                      <td style={{ fontSize: 12 }}>{Object.entries(nueva.provincias).filter(([, h]) => h === id).map(([p]) => p).join(", ")}</td>
                      <td style={{ fontSize: 12 }}>{z.planes.map((p) => p.codigo).join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="row" style={{ justifyContent: "flex-end" }}>
              <Btn onClick={() => setNueva(null)}>Cancelar</Btn>
              <Btn v="primary" icon={Ico.check} disabled={nueva.errores.length > 0} onClick={publicar}>Publicar para toda la empresa</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

const PROVINCIAS_ORDEN = (lista) => Object.keys(lista.provincias).sort((a, b) => (a === "AMBA" ? -1 : b === "AMBA" ? 1 : a.localeCompare(b, "es")));

function AdminUsuarios({ ctx }) {
  const { api, toast, lista, yo } = ctx;
  const [users, setUsers] = useState([]);
  const [edit, setEdit] = useState(null);
  const cargar = () => api("usuarios").then((r) => setUsers(r.usuarios)).catch((e) => toast(e.message));
  useEffect(() => {
    cargar();
  }, []);
  const guardar = async () => {
    try {
      await api("guardarUsuario", edit);
      toast(`✓ Usuario ${edit.usuario} guardado`);
      setEdit(null);
      cargar();
    } catch (e) {
      toast(e.message);
    }
  };
  const nuevo = { usuario: "", nombre: "", cargo: "Asesor comercial", tel: "", mail: "", wa: "", provincia: "Mendoza", rol: "ejecutivo", activo: true, clave: "", nuevo: true };
  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div className="row between card-p" style={{ paddingBottom: 8 }}>
        <div>
          <h2>Usuarios ({users.length})</h2>
          <div className="muted">Cada ejecutivo entra con su usuario; su nombre, teléfono y QR de WhatsApp salen en los PDF.</div>
        </div>
        <Btn v="primary" icon={Ico.plus} onClick={() => setEdit(nuevo)}>Nuevo usuario</Btn>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table className="t">
          <thead><tr><th>Nombre</th><th>Usuario</th><th>Rol</th><th>Contacto</th><th>Provincia</th><th>Último ingreso</th><th></th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.usuario} style={{ opacity: u.activo ? 1 : 0.5 }}>
                <td><b>{u.nombre}</b><div className="muted" style={{ fontSize: 11.5 }}>{u.cargo}</div></td>
                <td>{u.usuario}</td>
                <td>{u.rol === "admin" ? <span className="chip" style={{ background: "var(--lilac-soft)", color: "var(--navy)" }}>Administrador</span> : "Ejecutivo"}{!u.activo && <span className="chip" style={{ marginLeft: 4 }}>Inactivo</span>}</td>
                <td style={{ fontSize: 12.5 }}>{u.tel}<div className="muted">{u.mail}</div></td>
                <td>{u.provincia}</td>
                <td className="tnum" style={{ fontSize: 12.5 }}>{fechaHora(u.ultimoIngreso)}</td>
                <td><Btn sm v="outline" onClick={() => setEdit({ ...u, clave: "" })}>Editar</Btn></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {edit && (
        <Modal title={edit.nuevo ? "Nuevo usuario" : `Editar ${edit.nombre}`} onClose={() => setEdit(null)} width={560}>
          <div className="stack">
            <div className="grid g2" style={{ gap: 10 }}>
              <Field label="Nombre y apellido"><input className="input" value={edit.nombre} onChange={(e) => setEdit({ ...edit, nombre: e.target.value })} /></Field>
              <Field label="Usuario (para ingresar)"><input className="input" value={edit.usuario} disabled={!edit.nuevo} onChange={(e) => setEdit({ ...edit, usuario: e.target.value.toLowerCase().replace(/\s/g, "") })} placeholder="ej: jperez" /></Field>
              <Field label="Cargo (sale en el PDF)"><input className="input" value={edit.cargo || ""} onChange={(e) => setEdit({ ...edit, cargo: e.target.value })} /></Field>
              <Field label="Provincia habitual"><select className="select" value={edit.provincia || "Mendoza"} onChange={(e) => setEdit({ ...edit, provincia: e.target.value })}>{PROVINCIAS_ORDEN(lista).map((p) => <option key={p}>{p}</option>)}</select></Field>
              <Field label="Teléfono"><input className="input" value={edit.tel || ""} onChange={(e) => setEdit({ ...edit, tel: e.target.value })} /></Field>
              <Field label="Mail"><input className="input" value={edit.mail || ""} onChange={(e) => setEdit({ ...edit, mail: e.target.value })} /></Field>
              <Field label="WhatsApp para el QR" hint="Número con característica. Si queda vacío se usa el teléfono."><input className="input" value={edit.wa || ""} onChange={(e) => setEdit({ ...edit, wa: e.target.value })} /></Field>
              <Field label={edit.nuevo ? "Contraseña" : "Nueva contraseña (opcional)"} hint="Mínimo 8 caracteres"><input className="input" type="text" value={edit.clave} onChange={(e) => setEdit({ ...edit, clave: e.target.value })} autoComplete="new-password" /></Field>
            </div>
            <div className="row wrap" style={{ gap: 18 }}>
              <label className="switch"><input type="checkbox" checked={edit.rol === "admin"} onChange={(e) => setEdit({ ...edit, rol: e.target.checked ? "admin" : "ejecutivo" })} disabled={edit.usuario === yo.usuario} /> Administrador</label>
              <label className="switch"><input type="checkbox" checked={!!edit.activo} onChange={(e) => setEdit({ ...edit, activo: e.target.checked })} disabled={edit.usuario === yo.usuario} /> Activo</label>
            </div>
            <div className="row" style={{ justifyContent: "flex-end" }}>
              <Btn onClick={() => setEdit(null)}>Cancelar</Btn>
              <Btn v="primary" onClick={guardar}>Guardar</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function AdminReglas({ ctx }) {
  const { api, toast, reglas, recargar } = ctx;
  const [r, setR] = useState(reglas);
  const numero = (k) => (e) => setR({ ...r, [k]: Number(e.target.value) });
  const guardar = async () => {
    try {
      await api("guardarReglas", { reglas: r });
      toast("✓ Reglas guardadas para toda la empresa");
      recargar();
    } catch (e) {
      toast(e.message);
    }
  };
  return (
    <div className="grid g2">
      <div className="card card-p stack">
        <div className="sec-t">Campaña de descuento</div>
        <div className="grid g2" style={{ gap: 10 }}>
          <Field label="Descuento sobre precio de lista (%)"><input className="input tnum" type="number" min="0" max="100" value={r.descuento} onChange={numero("descuento")} /></Field>
          <Field label="Duración (meses)"><input className="input tnum" type="number" min="1" max="60" value={r.meses} onChange={numero("meses")} /></Field>
        </div>
        <div>
          <span className="label">Se aplica a</span>
          <div className="stack-sm">
            {[...CONDICIONES, { key: "empresa", label: "Empresas (nómina)" }].map((c) => (
              <label key={c.key} className="switch" style={{ display: "flex" }}>
                <input type="checkbox" checked={!!r.campana[c.key]} onChange={(e) => setR({ ...r, campana: { ...r.campana, [c.key]: e.target.checked } })} /> {c.label}
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="card card-p stack">
        <div className="sec-t">Cálculo</div>
        <div className="grid g2" style={{ gap: 10 }}>
          <Field label="IVA para socios directos (%)"><input className="input tnum" type="number" step="0.5" value={r.iva} onChange={numero("iva")} /></Field>
          <Field label="Aporte real (% del bruto)" hint="7,65% = aporte del 3% ÷ 3% × 7,65%"><input className="input tnum" type="number" step="0.0001" value={r.factorAporte} onChange={numero("factorAporte")} /></Field>
          <Field label="Edad máxima como hijo" hint="Desde esa edad + 1 cotiza como adulto"><input className="input tnum" type="number" value={r.edadHijo} onChange={numero("edadHijo")} /></Field>
          <Field label="Edad máxima como hijo (Planes B)"><input className="input tnum" type="number" value={r.edadHijoPlanB} onChange={numero("edadHijoPlanB")} /></Field>
        </div>
        <div>
          <span className="label">Con IVA</span>
          <div className="stack-sm">
            {CONDICIONES.map((c) => (
              <label key={c.key} className="switch" style={{ display: "flex" }}>
                <input type="checkbox" checked={!!r.conIva[c.key]} onChange={(e) => setR({ ...r, conIva: { ...r.conIva, [c.key]: e.target.checked } })} /> {c.label}
              </label>
            ))}
          </div>
        </div>
        <label className="switch"><input type="checkbox" checked={!!r.compensarAportes} onChange={(e) => setR({ ...r, compensarAportes: e.target.checked })} /> Empresas: el excedente de aporte de un titular descuenta el de otros</label>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <Btn v="ghost" onClick={() => setR(REGLAS_DEFAULT)}>Restaurar valores originales</Btn>
          <Btn v="primary" onClick={guardar}>Guardar reglas</Btn>
        </div>
      </div>
    </div>
  );
}

function AdminPlanes({ ctx }) {
  const { api, toast, lista, planesInfo, recargar } = ctx;
  const planes = useMemo(() => {
    const m = new Map();
    Object.values(lista.zonas).forEach((z) => z.planes.forEach((p) => m.set(p.codigo, p)));
    return [...m.values()].sort((a, b) => a.codigo.localeCompare(b.codigo));
  }, [lista]);
  const [info, setInfo] = useState(() => Object.fromEntries(planes.map((p) => [p.codigo, beneficiosDe(p.codigo, planesInfo).join("\n")])));
  const guardar = async () => {
    try {
      const out = {};
      Object.entries(info).forEach(([k, v]) => (out[k] = v.split("\n").map((s) => s.trim()).filter(Boolean)));
      await api("guardarPlanesInfo", { planesInfo: out });
      toast("✓ Descripciones guardadas");
      recargar();
    } catch (e) {
      toast(e.message);
    }
  };
  return (
    <div className="stack">
      <div className="note n-info">Lo que escribas acá aparece en las tarjetas de cada plan y en los PDF (una línea por beneficio). Los precios salen siempre de la lista vigente.</div>
      <div className="grid g2">
        {planes.map((p) => (
          <div key={p.codigo} className="card card-p">
            <div className="row" style={{ gap: 8, marginBottom: 6 }}>
              <span style={{ width: 4, height: 22, borderRadius: 2, background: colorFamilia(p.familia) }} />
              <b>{p.nombre}</b>
              <span className="muted" style={{ fontSize: 12 }}>{p.familia}{p.planB ? " · Plan B" : ""}{p.pyme ? " · PYME" : ""}</span>
              {!PLANES_INFO_DEFAULT[p.codigo] && !planesInfo?.[p.codigo] && <span className="chip">sin descripción propia</span>}
            </div>
            <textarea className="textarea" rows={4} value={info[p.codigo] || ""} onChange={(e) => setInfo({ ...info, [p.codigo]: e.target.value })} />
          </div>
        ))}
      </div>
      <div className="row" style={{ justifyContent: "flex-end" }}><Btn v="primary" onClick={guardar}>Guardar descripciones</Btn></div>
    </div>
  );
}

function AdminActividad({ ctx }) {
  const { api, toast } = ctx;
  const [items, setItems] = useState(null);
  const [audit, setAudit] = useState([]);
  const [meses, setMeses] = useState(3);
  useEffect(() => {
    api("cotizaciones", { meses, todas: true }).then((r) => setItems(r.cotizaciones)).catch((e) => toast(e.message));
    api("auditoria").then((r) => setAudit(r.auditoria)).catch(() => {});
  }, [meses]);
  const agrupar = (key) => {
    const m = new Map();
    (items || []).forEach((c) => {
      const k = key(c) || "—";
      const o = m.get(k) || { k, n: 0, empresas: 0, capitas: 0 };
      o.n++;
      if (c.tipo === "empresa") { o.empresas++; o.capitas += c.capitas || 0; }
      m.set(k, o);
    });
    return [...m.values()].sort((a, b) => b.n - a.n);
  };
  const porEj = agrupar((c) => c.ejecutivo);
  const porProv = agrupar((c) => c.provincia);
  const porPlan = (() => {
    const m = new Map();
    (items || []).forEach((c) => (c.planes || []).forEach((p) => m.set(p.nombre, (m.get(p.nombre) || 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  })();
  const max = (arr, f) => Math.max(1, ...arr.map(f));
  const Barra = ({ v, m }) => <span style={{ display: "inline-block", height: 8, width: `${Math.max(4, (v / m) * 100)}%`, background: "var(--navy)", borderRadius: 4, opacity: 0.8 }} />;
  return (
    <div className="stack">
      <div className="row between wrap">
        <div className="muted">{items ? `${items.length} cotizaciones en el período` : "Cargando…"}</div>
        <select className="select" style={{ width: "auto" }} value={meses} onChange={(e) => setMeses(Number(e.target.value))}>
          <option value={1}>Este mes</option><option value={3}>Últimos 3 meses</option><option value={6}>Últimos 6 meses</option><option value={12}>Último año</option>
        </select>
      </div>
      <div className="grid g3">
        <div className="card card-p">
          <div className="sec-t">Por ejecutivo</div>
          <table className="t"><tbody>{porEj.map((o) => <tr key={o.k}><td>{o.k}</td><td style={{ width: "40%" }}><Barra v={o.n} m={max(porEj, (x) => x.n)} /></td><td className="r tnum"><b>{o.n}</b><div className="muted" style={{ fontSize: 11 }}>{o.empresas} empresas</div></td></tr>)}</tbody></table>
        </div>
        <div className="card card-p">
          <div className="sec-t">Por provincia</div>
          <table className="t"><tbody>{porProv.map((o) => <tr key={o.k}><td>{o.k}</td><td style={{ width: "40%" }}><Barra v={o.n} m={max(porProv, (x) => x.n)} /></td><td className="r tnum"><b>{o.n}</b></td></tr>)}</tbody></table>
        </div>
        <div className="card card-p">
          <div className="sec-t">Planes más cotizados</div>
          <table className="t"><tbody>{porPlan.map(([k, n]) => <tr key={k}><td>{k.replace("Plan ", "")}</td><td style={{ width: "40%" }}><Barra v={n} m={max(porPlan, (x) => x[1])} /></td><td className="r tnum"><b>{n}</b></td></tr>)}</tbody></table>
        </div>
      </div>
      <div className="card card-p">
        <div className="sec-t">Cambios de configuración</div>
        {audit.length === 0 ? <div className="muted">Sin cambios registrados.</div> : (
          <table className="t"><tbody>{audit.slice(0, 30).map((a, i) => <tr key={i}><td className="tnum" style={{ width: 160 }}>{fechaHora(a.fecha)}</td><td>{a.usuario}</td><td>{a.accion}</td></tr>)}</tbody></table>
        )}
      </div>
    </div>
  );
}

export { PROVINCIAS_ORDEN, TRAMOS };
