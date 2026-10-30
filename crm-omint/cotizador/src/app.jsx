import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { REGLAS_DEFAULT } from "./motor.js";
import { Cotizar } from "./cotizar.jsx";
import { Admin, Historial, PROVINCIAS_ORDEN } from "./admin.jsx";
import { CSS, Btn, Field, Modal, Ico } from "./ui.jsx";

const TOKEN_LS = "cot_omint_token";
const params = new URLSearchParams(window.location.search);
const EMBED = params.get("embed") === "crm";
// Origen del CRM que abrió el cotizador (para avisarle aunque esté en otra dirección).
const ORIGEN_CRM = (() => {
  const o = params.get("origen") || "";
  try {
    const ref = document.referrer ? new URL(document.referrer).origin : "";
    if (o && (!ref || ref === o)) return o;
    return ref || window.location.origin;
  } catch (e) {
    return window.location.origin;
  }
})();
const PREFILL = { modo: params.get("modo") === "empresas" || params.get("modo") === "empresa" ? "empresa" : "particular", nombre: params.get("nombre") || "", telefono: params.get("tel") || "", provincia: params.get("provincia") || "" };

let token = "";
try {
  token = localStorage.getItem(TOKEN_LS) || "";
} catch (e) {
  // sin localStorage
}
const guardarToken = (t) => {
  token = t;
  try {
    t ? localStorage.setItem(TOKEN_LS, t) : localStorage.removeItem(TOKEN_LS);
  } catch (e) {
    // no crítico
  }
};

async function api(action, body) {
  const r = await fetch(`api.php?action=${action}`, { method: "POST", headers: { "Content-Type": "application/json", "X-Cot-Token": token }, body: JSON.stringify(body || {}), cache: "no-store" });
  let d = null;
  try {
    d = await r.json();
  } catch (e) {
    // PHP no disponible o error del servidor
  }
  if (!r.ok || !d || !d.ok) {
    const err = new Error((d && d.error) || `No se pudo conectar con el servidor (HTTP ${r.status}).`);
    err.status = r.status;
    throw err;
  }
  return d;
}

function mezclarReglas(r) {
  const x = { ...REGLAS_DEFAULT, ...(r || {}) };
  x.campana = { ...REGLAS_DEFAULT.campana, ...((r && r.campana) || {}) };
  x.conIva = { ...REGLAS_DEFAULT.conIva, ...((r && r.conIva) || {}) };
  return x;
}

// ================================================================== Ingreso

function Pantalla({ children }) {
  return (
    <div className="cz" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "linear-gradient(160deg,#0F1E52 0%,#17296E 60%,#2B3E8C 100%)" }}>
      <style>{CSS}</style>
      <div className="card" style={{ width: "100%", maxWidth: 400, padding: 28 }}>{children}</div>
    </div>
  );
}

function Marca() {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 26, color: "var(--navy-deep)" }}>Omint</div>
      <div style={{ height: 3, width: 44, background: "var(--cyan)", borderRadius: 2, margin: "4px 0 10px" }} />
      <div style={{ fontWeight: 700, fontSize: 16 }}>Cotizador comercial</div>
    </div>
  );
}

function Login({ onOk }) {
  const [u, setU] = useState("");
  const [c, setC] = useState("");
  const [err, setErr] = useState("");
  const [cargando, setCargando] = useState(false);
  const [instalado, setInstalado] = useState(true);
  const [nombre, setNombre] = useState("");
  useEffect(() => {
    api("estado").then((r) => setInstalado(r.instalado)).catch(() => {});
  }, []);
  const entrar = async (ev) => {
    ev.preventDefault();
    setCargando(true);
    setErr("");
    try {
      if (!instalado) await api("setup", { usuario: u, clave: c, nombre });
      const r = await api("login", { usuario: u, clave: c });
      guardarToken(r.token);
      onOk();
    } catch (e) {
      setErr(e.message);
    }
    setCargando(false);
  };
  return (
    <Pantalla>
      <Marca />
      <form onSubmit={entrar} className="stack">
        <div className="muted">{instalado ? "Ingresá con tu usuario y contraseña." : "Primera vez: creá el usuario administrador."}</div>
        {!instalado && (
          <Field label="Tu nombre y apellido">
            <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </Field>
        )}
        <Field label="Usuario">
          <input className="input" autoFocus autoComplete="username" value={u} onChange={(e) => setU(e.target.value)} />
        </Field>
        <Field label="Contraseña" hint={!instalado ? "Mínimo 8 caracteres" : null}>
          <input className="input" type="password" autoComplete={instalado ? "current-password" : "new-password"} value={c} onChange={(e) => setC(e.target.value)} />
        </Field>
        {err && <div className="note n-bad">{err}</div>}
        <Btn v="primary" type="submit" disabled={!u || !c || cargando} style={{ width: "100%", padding: 12 }}>
          {cargando ? "Ingresando…" : instalado ? "Ingresar" : "Crear y entrar"}
        </Btn>
        <div className="muted" style={{ fontSize: 12 }}>La sesión queda abierta en este dispositivo. Si es una computadora compartida, cerrá sesión al terminar.</div>
      </form>
    </Pantalla>
  );
}

// ===================================================================== App

function App() {
  const [estado, setEstado] = useState(token ? "cargando" : "login");
  const [datos, setDatos] = useState(null);
  const [tab, setTab] = useState("cotizar");
  const [provincia, setProvincia] = useState("");
  const [toast, setToastMsg] = useState(null);
  const [restaurar, setRestaurar] = useState(null);
  const [perfil, setPerfil] = useState(false);
  const [menu, setMenu] = useState(false);
  const tRef = useRef(null);
  const showToast = useCallback((m) => {
    setToastMsg(m);
    clearTimeout(tRef.current);
    tRef.current = setTimeout(() => setToastMsg(null), 4200);
  }, []);

  const cargar = useCallback(async () => {
    try {
      const d = await api("init");
      if (!d.lista) throw new Error("No hay ninguna lista de precios cargada. Un administrador tiene que subirla.");
      setDatos(d);
      const prov = [PREFILL.provincia, localStorage.getItem(`cot_prov_${d.yo.usuario}`), d.yo.provincia, "Mendoza"].find((x) => x && d.lista.provincias[x]);
      setProvincia((p) => (p && d.lista.provincias[p] ? p : prov || Object.keys(d.lista.provincias)[0]));
      setEstado("listo");
    } catch (e) {
      if (e.status === 401) {
        guardarToken("");
        setEstado("login");
      } else {
        setDatos({ error: e.message });
        setEstado("error");
      }
    }
  }, []);
  useEffect(() => {
    if (token) cargar();
  }, []);

  const elegirProvincia = (p) => {
    setProvincia(p);
    try {
      localStorage.setItem(`cot_prov_${datos.yo.usuario}`, p);
    } catch (e) {
      // no crítico
    }
  };

  const salir = async () => {
    try {
      await api("logout");
    } catch (e) {
      // igual cerramos la sesión local
    }
    guardarToken("");
    setDatos(null);
    setEstado("login");
  };

  const ctx = useMemo(() => {
    if (!datos || !datos.lista) return null;
    return {
      api,
      toast: showToast,
      lista: datos.lista,
      listaMeta: datos.listaMeta,
      reglas: mezclarReglas(datos.reglas),
      planesInfo: datos.planesInfo || {},
      yo: datos.yo,
      provincia,
      embed: EMBED,
      prefill: PREFILL,
      restaurar,
      recargar: cargar,
      avisarCRM: (msg) => {
        try {
          if (window.parent && window.parent !== window) window.parent.postMessage({ ...msg, fecha: new Date().toISOString() }, ORIGEN_CRM);
        } catch (e) {
          // fuera del CRM no hace nada
        }
      },
      reabrir: (c) => {
        if (c.provincia && datos.lista.provincias[c.provincia]) setProvincia(c.provincia);
        setRestaurar({ ...c, _t: Date.now() });
        setTab("cotizar");
        window.scrollTo({ top: 0 });
      },
    };
  }, [datos, provincia, restaurar, showToast, cargar]);

  if (estado === "login") return <Login onOk={() => { setEstado("cargando"); cargar(); }} />;
  if (estado === "cargando" || (estado === "listo" && !ctx))
    return (
      <div className="cz" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{CSS}</style>
        <div className="muted" style={{ fontWeight: 600 }}>Cargando cotizador…</div>
      </div>
    );
  if (estado === "error")
    return (
      <Pantalla>
        <Marca />
        <div className="note n-bad">{datos && datos.error}</div>
        <div className="row" style={{ marginTop: 14 }}>
          <Btn v="primary" onClick={cargar}>Reintentar</Btn>
          <Btn onClick={salir}>Cerrar sesión</Btn>
        </div>
      </Pantalla>
    );

  const yo = datos.yo;
  const zona = datos.lista.zonas[datos.lista.provincias[provincia]];
  const iniciales = (yo.nombre || yo.usuario).split(" ").map((x) => x[0]).slice(0, 2).join("").toUpperCase();
  const tabs = [["cotizar", "Cotizar"], ["historial", "Mis cotizaciones"], ...(yo.rol === "admin" && !EMBED ? [["admin", "Administración"]] : [])];

  return (
    <div className={"cz" + (EMBED ? " embed" : "")}>
      <style>{CSS}</style>
      <header className="top">
        <div className="top-in">
          <div className="brand">
            <span>Omint</span>
            {!EMBED && <span className="hide-sm" style={{ fontFamily: "Inter", fontWeight: 600, fontSize: 13, color: "#A9B6E0" }}>Cotizador</span>}
          </div>
          <nav className="tabs" aria-label="Secciones">
            {tabs.map(([k, l]) => (
              <button key={k} className={"tab" + (tab === k ? " on" : "")} onClick={() => setTab(k)} aria-current={tab === k ? "page" : undefined}>
                {l}
              </button>
            ))}
          </nav>
          <div className="prov" title={zona ? `Usa los precios de: ${zona.titulo}` : ""}>
            <span style={{ color: "#7FDDF5", display: "flex" }}>{Ico.pin}</span>
            <label htmlFor="prov">Provincia</label>
            <select id="prov" value={provincia} onChange={(e) => elegirProvincia(e.target.value)}>
              {PROVINCIAS_ORDEN(datos.lista).map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
          <div style={{ position: "relative" }}>
            <button className="user-btn" onClick={() => setMenu((m) => !m)} aria-haspopup="menu" aria-expanded={menu}>
              <span className="avatar">{iniciales}</span>
              <span className="hide-sm">{(yo.nombre || yo.usuario).split(" ")[0]}</span>
            </button>
            {menu && (
              <div className="menu" role="menu" onMouseLeave={() => setMenu(false)}>
                <div style={{ padding: "8px 10px 6px" }}>
                  <b>{yo.nombre}</b>
                  <div className="muted" style={{ fontSize: 12 }}>{yo.rol === "admin" ? "Administrador" : "Ejecutivo"} · {yo.usuario}</div>
                </div>
                <button onClick={() => { setPerfil(true); setMenu(false); }}>{Ico.user} Mis datos y contraseña</button>
                <button onClick={salir}>{Ico.logout} Cerrar sesión</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="main">
        {zona && datos.lista.provincias[provincia] && Object.values(datos.lista.provincias).filter((h) => h === datos.lista.provincias[provincia]).length > 1 && tab === "cotizar" && (
          <div className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
            {provincia} usa la grilla “{zona.titulo.length > 70 ? zona.titulo.slice(0, 70) + "…" : zona.titulo}”.
          </div>
        )}
        {tab === "cotizar" && <Cotizar key={restaurar ? restaurar._t : "nueva"} ctx={ctx} />}
        {tab === "historial" && <Historial ctx={ctx} />}
        {tab === "admin" && yo.rol === "admin" && <Admin ctx={ctx} />}
      </main>

      {perfil && <Perfil yo={yo} lista={datos.lista} onClose={() => setPerfil(false)} onSaved={(y) => { setDatos({ ...datos, yo: y }); showToast("✓ Datos actualizados"); }} toast={showToast} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

function Perfil({ yo, lista, onClose, onSaved, toast }) {
  const [f, setF] = useState({ nombre: yo.nombre || "", cargo: yo.cargo || "", tel: yo.tel || "", mail: yo.mail || "", wa: yo.wa || "", provincia: yo.provincia || "Mendoza" });
  const [cl, setCl] = useState({ actual: "", nueva: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal title="Mis datos" onClose={onClose} width={560}>
      <div className="stack">
        <div className="note n-lilac">Estos datos salen en la tarjeta de contacto y el QR de WhatsApp de tus PDF.</div>
        <div className="grid g2" style={{ gap: 10 }}>
          <Field label="Nombre y apellido"><input className="input" value={f.nombre} onChange={set("nombre")} /></Field>
          <Field label="Cargo"><input className="input" value={f.cargo} onChange={set("cargo")} /></Field>
          <Field label="Teléfono"><input className="input" value={f.tel} onChange={set("tel")} /></Field>
          <Field label="Mail"><input className="input" value={f.mail} onChange={set("mail")} /></Field>
          <Field label="WhatsApp (para el QR)" hint="Si queda vacío se usa el teléfono"><input className="input" value={f.wa} onChange={set("wa")} /></Field>
          <Field label="Provincia habitual">
            <select className="select" value={f.provincia} onChange={set("provincia")}>{PROVINCIAS_ORDEN(lista).map((p) => <option key={p}>{p}</option>)}</select>
          </Field>
        </div>
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <Btn v="primary" onClick={async () => { try { const r = await api("perfil", f); onSaved(r.yo); onClose(); } catch (e) { toast(e.message); } }}>Guardar</Btn>
        </div>
        <div className="divider" />
        <div className="sec-t">Cambiar contraseña</div>
        <div className="grid g2" style={{ gap: 10 }}>
          <Field label="Actual"><input className="input" type="password" value={cl.actual} onChange={(e) => setCl({ ...cl, actual: e.target.value })} autoComplete="current-password" /></Field>
          <Field label="Nueva (mín. 8)"><input className="input" type="password" value={cl.nueva} onChange={(e) => setCl({ ...cl, nueva: e.target.value })} autoComplete="new-password" /></Field>
        </div>
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <Btn disabled={!cl.actual || cl.nueva.length < 8} onClick={async () => { try { await api("clave", cl); toast("✓ Contraseña cambiada"); setCl({ actual: "", nueva: "" }); } catch (e) { toast(e.message); } }}>Cambiar contraseña</Btn>
        </div>
      </div>
    </Modal>
  );
}

createRoot(document.getElementById("root")).render(<App />);
