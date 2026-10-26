// Punto de entrada de la versión web (Hostinger). Reemplaza el almacenamiento
// de Claude (window.storage) por el servidor propio (api.php): cada cambio se
// guarda automáticamente en el hosting y se ve desde cualquier dispositivo.
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./app.jsx";

// Nota: el flag window.__CRM_HOSTED__ se define en index.html ANTES de este
// script, porque los imports se evalúan antes que el cuerpo de este módulo.

const API = "api.php";
const TOKEN_LS = "crm_omint_sesion";
const session = Math.random().toString(36).slice(2) + Date.now().toString(36);
// Solo se guarda el token de sesión (nunca la contraseña).
let token = "";
try {
  token = localStorage.getItem(TOKEN_LS) || "";
} catch (e) {
  // sin localStorage: se pide login en cada visita
}
const guardarToken = (t) => {
  token = t;
  try {
    if (t) localStorage.setItem(TOKEN_LS, t);
    else localStorage.removeItem(TOKEN_LS);
  } catch (e) {
    // no crítico
  }
};
let cache = {};
let rev = 0;
let pendientes = 0;
const listeners = new Set();
const emit = (ev) => listeners.forEach((fn) => fn(ev));

async function call(action, body) {
  const r = await fetch(`${API}?action=${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-CRM-Token": token },
    body: JSON.stringify(body || {}),
    cache: "no-store",
  });
  let data = null;
  try {
    data = await r.json();
  } catch (e) {
    // respuesta no JSON (por ejemplo, PHP no habilitado)
  }
  if (!r.ok || !data || !data.ok) {
    const err = new Error((data && data.error) || `HTTP ${r.status}`);
    err.status = r.status;
    throw err;
  }
  return data;
}

async function escribir(action, payload) {
  pendientes++;
  try {
    const res = await call(action, { ...payload, session, baseRev: rev });
    rev = res.rev;
    return true;
  } catch (e) {
    if (e.status === 409) emit("conflicto");
    if (e.status === 401) emit("auth");
    return false;
  } finally {
    pendientes--;
  }
}

window.__CRM_LOGOUT__ = async () => {
  try {
    await call("logout");
  } catch (e) {
    // aunque falle, cerramos la sesión local
  }
  guardarToken("");
  window.location.reload();
};

window.storage = {
  async get(k) {
    return k in cache ? { key: k, value: cache[k] } : null;
  },
  async set(k, v) {
    if (cache[k] === v) return { key: k, value: v };
    const ok = await escribir("set", { key: k, value: v });
    if (!ok) return null;
    cache[k] = v;
    return { key: k, value: v };
  },
  async delete(k) {
    if (!(k in cache)) return true;
    const ok = await escribir("delete", { key: k });
    if (ok) delete cache[k];
    return ok;
  },
};

const box = { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F3F5F9", fontFamily: "Inter, system-ui, sans-serif", padding: 16 };
const card = { background: "#fff", border: "1px solid #E2E7EF", borderRadius: 16, padding: 28, width: "100%", maxWidth: 380, boxShadow: "0 12px 40px rgba(15,27,45,.12)", color: "#0F1B2D" };
const inputSt = { display: "block", width: "100%", marginTop: 4, padding: "10px 12px", border: "1px solid #CBD3DF", borderRadius: 10, fontSize: 15, boxSizing: "border-box", fontWeight: 400, color: "#0F1B2D" };
const btn = { width: "100%", marginTop: 14, padding: "11px 14px", border: 0, borderRadius: 10, background: "#0E8C7F", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" };

function Gate() {
  const [estado, setEstado] = useState(token ? "cargando" : "login"); // cargando | login | listo | error
  const [error, setError] = useState("");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [entrando, setEntrando] = useState(false);
  const [aviso, setAviso] = useState(null); // conflicto | remoto | auth

  const cargar = async () => {
    setEstado("cargando");
    try {
      const res = await call("all");
      cache = res.data || {};
      rev = res.rev;
      setEstado("listo");
    } catch (e) {
      if (e.status === 401) {
        guardarToken("");
        setError("Tu sesión venció. Ingresá de nuevo.");
        setEstado("login");
      } else {
        setError(e.status === 500 ? e.message : "No se pudo conectar con el servidor. Revisá tu conexión e intentá de nuevo.");
        setEstado("error");
      }
    }
  };

  useEffect(() => {
    if (token) cargar();
  }, []);

  // Avisos: guardado rechazado por cambios desde otro dispositivo, o cambios
  // remotos detectados al volver a la pestaña.
  useEffect(() => {
    if (estado !== "listo") return;
    const fn = (ev) => setAviso(ev);
    listeners.add(fn);
    const check = async () => {
      if (pendientes > 0 || document.hidden) return;
      try {
        const r = await call("rev");
        if (r.rev !== rev && pendientes === 0) setAviso((a) => a || "remoto");
      } catch (e) {
        // sin conexión: se reintenta en el próximo chequeo
      }
    };
    const i = setInterval(check, 60000);
    window.addEventListener("focus", check);
    return () => {
      listeners.delete(fn);
      clearInterval(i);
      window.removeEventListener("focus", check);
    };
  }, [estado]);

  if (estado === "listo") {
    return (
      <>
        <App />
        {aviso && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: aviso === "remoto" ? "#2A6FC4" : "#C8372D", color: "#fff", padding: "10px 16px", fontFamily: "Inter, system-ui, sans-serif", fontSize: 14, display: "flex", gap: 12, alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
            <span>
              {aviso === "auth"
                ? "Tu sesión venció: recargá e ingresá de nuevo para seguir guardando."
                : aviso === "conflicto"
                ? "La base se modificó desde otro dispositivo. Para no pisar esos cambios, este guardado se frenó: recargá la página."
                : "Hay cambios nuevos guardados desde otro dispositivo."}
            </span>
            <button onClick={() => window.location.reload()} style={{ background: "#fff", color: "#0F1B2D", border: 0, borderRadius: 8, padding: "6px 12px", fontWeight: 700, cursor: "pointer" }}>
              Recargar
            </button>
          </div>
        )}
      </>
    );
  }

  if (estado === "cargando") {
    return <div style={{ ...box, color: "#6B788C", fontWeight: 600 }}>Cargando tu CRM…</div>;
  }

  if (estado === "error") {
    return (
      <div style={box}>
        <div style={card}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>No se pudo cargar el CRM</div>
          <div style={{ color: "#6B788C", marginTop: 8, fontSize: 14 }}>{error} No se modificó ningún dato.</div>
          <button style={btn} onClick={cargar}>Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div style={box}>
      <form
        style={card}
        onSubmit={async (e) => {
          e.preventDefault();
          setEntrando(true);
          setError("");
          try {
            const r = await call("login", { user, pass });
            guardarToken(r.token);
            setPass("");
            await cargar();
          } catch (err) {
            setError(err.status === 401 || err.status === 429 || err.status === 500 ? err.message : "No se pudo conectar con el servidor.");
          }
          setEntrando(false);
        }}
      >
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#14B8A6,#0E7490)", marginBottom: 14 }} />
        <div style={{ fontWeight: 800, fontSize: 20 }}>CRM Omint</div>
        <div style={{ color: "#6B788C", fontSize: 14, marginTop: 4 }}>Ingresá con tu usuario y contraseña.</div>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#44546A", marginTop: 16 }}>
          Usuario
          <input autoFocus autoComplete="username" value={user} onChange={(e) => setUser(e.target.value)} style={inputSt} />
        </label>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#44546A", marginTop: 10 }}>
          Contraseña
          <input type="password" autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} style={inputSt} />
        </label>
        {error && <div style={{ color: "#C8372D", fontSize: 13, marginTop: 10 }}>{error}</div>}
        <button type="submit" style={{ ...btn, opacity: !user || !pass || entrando ? 0.6 : 1 }} disabled={!user || !pass || entrando}>
          {entrando ? "Ingresando…" : "Ingresar"}
        </button>
        <div style={{ color: "#6B788C", fontSize: 12, marginTop: 12 }}>La sesión queda abierta 30 días en este dispositivo. Usá “Cerrar sesión” en el menú si es una computadora compartida.</div>
      </form>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<Gate />);
