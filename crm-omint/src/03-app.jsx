
// =================================================================== App ===

const NAV = [
  { group: "Gestión" },
  { key: "hoy", label: "Mi día", icon: Sunrise },
  { key: "tablero", label: "Indicadores", icon: LayoutDashboard },
  { group: "Empresas (PyME)" },
  { key: "pipeline", label: "Pipeline", icon: ClipboardList },
  { key: "empresas", label: "Cartera", icon: Building2 },
  { key: "agenda", label: "Agenda", icon: CalIcon },
  { key: "campana", label: "Campaña WhatsApp", icon: Megaphone },
  { key: "cotizador", label: "Cotizador", icon: Calculator },
  { group: "Particulares" },
  { key: "b2c", label: "Tablero B2C", icon: Heart },
  { key: "personas", label: "Pacientes", icon: Users },
  { key: "campanab2c", label: "Campaña B2C", icon: MessageCircle },
  { group: "Recursos" },
  { key: "producto", label: "Producto y objeciones", icon: BookOpen },
  { key: "contenido", label: "Contenido", icon: Instagram },
];

export default function App() {
  const [companies, setCompanies] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [contenido, setContenido] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [view, setView] = useState("hoy");
  const [loaded, setLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [showNewCompany, setShowNewCompany] = useState(false);
  const [showNewMeeting, setShowNewMeeting] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(null);
  const [selectedPersonaId, setSelectedPersonaId] = useState(null);
  const [showNewPersona, setShowNewPersona] = useState(false);
  const [showPersonaWhatsApp, setShowPersonaWhatsApp] = useState(null);
  const [logFor, setLogFor] = useState(null); // { companyId, tipo, texto } | null
  const [lostFor, setLostFor] = useState(null); // companyId pendiente de motivo de pérdida
  const [showSettings, setShowSettings] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [cotizarPara, setCotizarPara] = useState(null); // companyId preseleccionado en el cotizador
  const [saveState, setSaveState] = useState("idle");
  const [confirmState, setConfirmState] = useState(null);
  const [toast, setToast] = useState(null);
  const [gcalStatus, setGcalStatus] = useState("idle");
  const [deletedEventIds, setDeletedEventIds] = useState([]);
  const [waLog, setWaLog] = useState([]);
  const [pendingDeletions, setPendingDeletions] = useState([]);
  const [lastSynced, setLastSynced] = useState(null);
  const personaChunkCountRef = useRef(0);
  const personaChunkContentsRef = useRef([]);
  const companyChunkCountRef = useRef(0);
  const companyChunkContentsRef = useRef([]);
  const toastTimer = useRef(null);

  const askConfirm = useCallback((message, onConfirm) => setConfirmState({ message, onConfirm }), []);
  const showToast = useCallback((message) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  }, []);

  // ---------------------------------------------------------- Carga inicial
  useEffect(() => {
    (async () => {
      try {
        const m = await getStorageSafe("meetings");
        const d = await getStorageSafe("deletedEventIds");
        const ct = await getStorageSafe("contenido");
        const wl = await getStorageSafe("waLog");
        const st = await getStorageSafe("settings");
        const p = await loadChunked("personas", "personas");
        personaChunkCountRef.current = p.chunkCount;
        personaChunkContentsRef.current = p.chunkContents;
        const c = await loadChunked("companies", "companies");
        companyChunkCountRef.current = c.chunkCount;
        companyChunkContentsRef.current = c.chunkContents;

        // Primera vez sin datos -> base inicial. Si había datos y algo falló,
        // NUNCA reseteamos: nos quedamos con lo recuperado y avisamos.
        const primeraVez = c.chunkCount === 0 && c.items.length === 0 && !c.huboBloqueDanado;
        setCompanies(primeraVez ? loadInitialCompanies() : mergeSeedData(c.items));
        if (c.huboBloqueDanado || p.huboBloqueDanado) {
          showToast("⚠️ Una parte de los datos no se pudo leer correctamente y puede faltar. Si tenés un backup exportado, restauralo para no perder nada.");
        }
        setMeetings(
          parseJSONSafe(m, []).map((x) => ({ ...x, syncStatus: x.syncStatus || (x.googleEventId ? "synced" : "local"), syncError: x.syncError ?? null }))
        );
        setDeletedEventIds(parseJSONSafe(d, []));
        setPersonas(normalizePersonas(p.items));
        setContenido(parseJSONSafe(ct, CONTENIDO_SEED));
        setWaLog(parseJSONSafe(wl, []));
        const s = parseJSONSafe(st, {});
        setSettings({ ...DEFAULT_SETTINGS, ...s, objetivos: { ...DEFAULT_SETTINGS.objetivos, ...(s.objetivos || {}) } });
      } catch (e) {
        setLoadFailed(true);
        return; // sin "loaded" el autoguardado queda desactivado
      }
      setLoaded(true);
    })();
  }, []);

  // ------------------------------------------------------------- Guardado
  const saveNow = useCallback(async () => {
    setSaveState("saving");
    const rc = await saveChunked("companies", companies, COMPANY_CHUNK_SIZE, companyChunkCountRef.current, companyChunkContentsRef.current);
    companyChunkCountRef.current = rc.chunkCount;
    companyChunkContentsRef.current = rc.chunkContents;
    const okMeetings = await trySetStorage("meetings", JSON.stringify(meetings));
    const okDeleted = await trySetStorage("deletedEventIds", JSON.stringify(deletedEventIds));
    const rp = await saveChunked("personas", personas, PERSONA_CHUNK_SIZE, personaChunkCountRef.current, personaChunkContentsRef.current);
    personaChunkCountRef.current = rp.chunkCount;
    personaChunkContentsRef.current = rp.chunkContents;
    const okContenido = await trySetStorage("contenido", JSON.stringify(contenido));
    const corte60Dias = Date.now() - 60 * 86400000;
    const okWaLog = await trySetStorage("waLog", JSON.stringify(waLog.filter((ts) => ts > corte60Dias)));
    const okSettings = await trySetStorage("settings", JSON.stringify(settings));
    const ok = rc.ok && okMeetings && okDeleted && rp.ok && okContenido && okWaLog && okSettings;
    setSaveState(ok ? "saved" : "error");
    return ok;
  }, [companies, meetings, deletedEventIds, personas, contenido, waLog, settings]);

  useEffect(() => {
    if (!loaded) return;
    setSaveState("saving");
    const t = setTimeout(() => saveNow(), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companies, meetings, deletedEventIds, personas, contenido, waLog, settings, loaded]);

  // Aviso al cerrar la pestaña si hay cambios que todavía no terminaron de guardarse.
  useEffect(() => {
    if (saveState !== "saving" && saveState !== "error") return;
    const h = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [saveState]);

  // ---------------------------------------------------- Acciones: empresas
  const updateCompany = useCallback((id, patch) => {
    const hoy = hoyISO();
    setCompanies((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const next = { ...c, ...patch };
        if (patch.stage && patch.stage !== c.stage) {
          next.stageDates = { ...(c.stageDates || {}), [patch.stage]: hoy };
          next.historial = [{ fecha: hoy, tipo: "etapa", texto: `Etapa: ${STAGE_BY_KEY[c.stage]?.label || c.stage} → ${STAGE_BY_KEY[patch.stage]?.label}` }, ...(c.historial || [])];
          if (patch.stage === "ganado") next.fechaGanado = hoy;
        }
        return next;
      })
    );
    if (patch.stage === "perdido") setLostFor(id);
  }, []);

  const addHistorial = useCallback((id, texto, tipo = "nota") => {
    setCompanies((prev) => prev.map((c) => (c.id === id ? { ...c, historial: [{ fecha: hoyISO(), tipo, texto }, ...(c.historial || [])] } : c)));
  }, []);

  // Registro de actividad desde el modal: historial + próxima acción + etapa.
  const registrarActividad = useCallback(
    ({ companyId, tipo, texto, programar, proximaAccion, fechaProximaAccion, stage }) => {
      const label = TIPOS_ACT[tipo]?.label || "Nota";
      addHistorial(companyId, texto ? `${label}: ${texto}` : label, tipo);
      const patch = programar ? { proximaAccion: proximaAccion || "", fechaProximaAccion: fechaProximaAccion || "" } : {};
      if (stage) patch.stage = stage;
      if (Object.keys(patch).length) updateCompany(companyId, patch);
      showToast(`✓ ${label} registrada${programar && fechaProximaAccion ? ` · próxima acción ${fmtRelativo(fechaProximaAccion)}` : ""}`);
    },
    [addHistorial, updateCompany, showToast]
  );

  const registrarEnvioWa = useCallback(() => setWaLog((prev) => [...prev, Date.now()]), []);

  const logWhatsAppSent = useCallback(
    (id, stepKey) => {
      const step = WHATSAPP_SEQUENCE.find((s) => s.key === stepKey) || WHATSAPP_SEQUENCE[0];
      setCompanies((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;
          const nuevaEtapa = c.stage === "prospeccion" ? "contacto" : c.stage;
          return {
            ...c,
            stage: nuevaEtapa,
            stageDates: nuevaEtapa !== c.stage ? { ...(c.stageDates || {}), contacto: hoyISO() } : c.stageDates,
            historial: [{ fecha: hoyISO(), texto: `${WA_STEP_PREFIX}${step.label}` }, ...(c.historial || [])],
          };
        })
      );
      registrarEnvioWa();
    },
    [registrarEnvioWa]
  );

  const stopWhatsAppSequence = useCallback((id, stopped) => {
    setCompanies((prev) => prev.map((c) => (c.id === id ? { ...c, waSequenceStopped: stopped } : c)));
  }, []);

  const deleteCompany = useCallback((id) => {
    setCompanies((prev) => prev.filter((c) => c.id !== id));
    setMeetings((prev) => prev.filter((m) => m.companyId !== id));
    setSelectedId(null);
  }, []);

  const guardarCotizacion = useCallback(
    (companyId, cot, moverAPropuesta) => {
      setCompanies((prev) =>
        prev.map((c) => {
          if (c.id !== companyId) return c;
          return {
            ...c,
            capitas: String(cot.capitas),
            planCotizado: cot.plan,
            montoMensual: Math.round(cot.total),
            cotizacion: { ...cot, fecha: hoyISO() },
            historial: [{ fecha: hoyISO(), tipo: "propuesta", texto: `Cotización ${cot.plan}: ${cot.capitas} cápitas · ${money(cot.total)}/mes (desc. ${cot.descuento}%)` }, ...(c.historial || [])],
          };
        })
      );
      if (moverAPropuesta) {
        const c = companies.find((x) => x.id === companyId);
        if (c && ["prospeccion", "contacto", "reunion"].includes(c.stage)) updateCompany(companyId, { stage: "propuesta" });
      }
      showToast("✓ Cotización guardada en la ficha de la empresa");
    },
    [companies, updateCompany, showToast]
  );

  // ----------------------------------------------------- Acciones: personas
  const addPersona = useCallback((data) => setPersonas((prev) => [{ id: uid(), status: "nuevo", nota: "", historial: [], ...data }, ...prev]), []);
  const updatePersona = useCallback((id, patch) => setPersonas((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p))), []);
  const deletePersona = useCallback((id) => setPersonas((prev) => prev.filter((p) => p.id !== id)), []);
  const clearPersonas = useCallback(() => setPersonas([]), []);
  const logPersonaWhatsAppSent = useCallback(
    (id) => {
      setPersonas((prev) =>
        prev.map((p) =>
          p.id !== id
            ? p
            : { ...p, status: p.status === "nuevo" ? "contactado" : p.status, contactado: true, historial: [{ fecha: hoyISO(), texto: "Contactado por WhatsApp" }, ...(p.historial || [])] }
        )
      );
      registrarEnvioWa();
    },
    [registrarEnvioWa]
  );
  const importPersonas = useCallback((nuevas) => {
    setPersonas((prev) => [...prev, ...nuevas.map((p) => ({ id: uid(), status: "nuevo", nota: "", historial: [], ...p }))]);
  }, []);

  // ---------------------------------------------------- Acciones: contenido
  const addContenido = useCallback((data) => setContenido((prev) => [{ id: uid(), status: "idea", ...data }, ...prev]), []);
  const updateContenido = useCallback((id, patch) => setContenido((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c))), []);
  const deleteContenido = useCallback((id) => setContenido((prev) => prev.filter((c) => c.id !== id)), []);

  // ------------------------------------------------------ Reuniones / GCal
  const createMeeting = useCallback(async (data, syncToGoogle) => {
    const localMeeting = { id: uid(), googleEventId: null, syncStatus: syncToGoogle && !HOSTED ? "syncing" : "local", syncError: null, ...data };
    if (syncToGoogle && HOSTED) window.open(gcalTemplateLink(localMeeting), "_blank");
    setMeetings((prev) => [...prev, localMeeting]);
    if (data.companyId) {
      setCompanies((prev) =>
        prev.map((c) => {
          if (c.id !== data.companyId) return c;
          const avanza = ["prospeccion", "contacto"].includes(c.stage);
          return {
            ...c,
            stage: avanza ? "reunion" : c.stage,
            stageDates: avanza ? { ...(c.stageDates || {}), reunion: hoyISO() } : c.stageDates,
            historial: [{ fecha: hoyISO(), tipo: "etapa", texto: `Reunión agendada para el ${fmtFecha(data.fecha)} ${data.hora}` }, ...(c.historial || [])],
          };
        })
      );
    }
    if (syncToGoogle && !HOSTED) {
      const { eventId, error } = await pushMeetingToGoogle(localMeeting);
      setMeetings((prev) => prev.map((m) => (m.id === localMeeting.id ? { ...m, googleEventId: eventId, syncStatus: eventId ? "synced" : "error", syncError: error } : m)));
    }
  }, []);

  const retryMeetingSync = useCallback(async (meeting) => {
    setMeetings((prev) => prev.map((m) => (m.id === meeting.id ? { ...m, syncStatus: "syncing", syncError: null } : m)));
    const { eventId, error } = await pushMeetingToGoogle(meeting);
    setMeetings((prev) => prev.map((m) => (m.id === meeting.id ? { ...m, googleEventId: eventId, syncStatus: eventId ? "synced" : "error", syncError: error } : m)));
  }, []);

  const removeMeeting = useCallback(async (meeting) => {
    setMeetings((prev) => prev.filter((m) => m.id !== meeting.id));
    if (meeting.googleEventId) {
      setDeletedEventIds((prev) => (prev.includes(meeting.googleEventId) ? prev : [...prev, meeting.googleEventId]));
      const { ok, error } = await deleteEventFromGoogle(meeting.googleEventId);
      if (!ok) setPendingDeletions((prev) => [...prev, { id: meeting.id, googleEventId: meeting.googleEventId, empresa: meeting.empresa, error }]);
    }
  }, []);

  const retryDeletion = useCallback(async (pending) => {
    const { ok, error } = await deleteEventFromGoogle(pending.googleEventId);
    setPendingDeletions((prev) => (ok ? prev.filter((p) => p.id !== pending.id) : prev.map((p) => (p.id === pending.id ? { ...p, error } : p))));
  }, []);

  const syncFromGoogle = useCallback(async () => {
    setGcalStatus("syncing");
    try {
      const { events, rangeStart, rangeEnd } = await pullEventsFromGoogle();
      const remoteIds = new Set(events.map((ev) => ev.id));
      setMeetings((prevMeetings) => {
        const existingIds = new Set(prevMeetings.map((m) => m.googleEventId).filter(Boolean));
        const newOnes = events
          .filter((ev) => !existingIds.has(ev.id) && !deletedEventIds.includes(ev.id))
          .map((ev) => {
            const match = companies.find((c) => ev.summary && ev.summary.toLowerCase().includes(c.empresa.toLowerCase()));
            const [fecha, hora] = (ev.start || "").split("T");
            return {
              id: uid(),
              companyId: match ? match.id : null,
              empresa: match ? match.empresa : ev.summary || "Evento de Google Calendar",
              fecha: fecha || hoyISO(),
              hora: hora ? hora.slice(0, 5) : "09:00",
              notas: match ? ev.summary : "Importado de Google Calendar",
              googleEventId: ev.id,
              syncStatus: "synced",
              syncError: null,
            };
          });
        // Vinculada a Google, dentro del rango consultado y ya no existe allá -> se borró.
        const stillPresent = prevMeetings.filter((m) => {
          if (!m.googleEventId || remoteIds.has(m.googleEventId)) return true;
          const dt = localDateFromFechaHora(m.fecha, m.hora);
          return !(dt >= rangeStart && dt <= rangeEnd);
        });
        return [...stillPresent, ...newOnes];
      });
      setGcalStatus("done");
      setLastSynced(new Date());
    } catch (e) {
      setGcalStatus("error");
    }
    setTimeout(() => setGcalStatus("idle"), 3000);
  }, [companies, deletedEventIds]);

  const syncRef = useRef(syncFromGoogle);
  useEffect(() => {
    syncRef.current = syncFromGoogle;
  }, [syncFromGoogle]);
  useEffect(() => {
    if (!loaded || HOSTED) return;
    const i = setInterval(() => syncRef.current(), 30 * 60 * 1000);
    return () => clearInterval(i);
  }, [loaded]);

  // --------------------------------------------------------- Backup
  const exportBackup = useCallback(() => {
    const payload = { exportedAt: new Date().toISOString(), version: 2, companies, meetings, deletedEventIds, personas, contenido, waLog, settings };
    descargarArchivo(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }), `crm-omint-backup-${hoyISO()}.json`);
  }, [companies, meetings, deletedEventIds, personas, contenido, waLog, settings]);

  const importBackup = useCallback(
    (file) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const payload = JSON.parse(reader.result);
          if (!Array.isArray(payload.companies)) throw new Error("El archivo no tiene el formato esperado (falta 'companies').");
          setCompanies(payload.companies.map((c) => ({ historial: [], ...c })));
          setMeetings(Array.isArray(payload.meetings) ? payload.meetings : []);
          setDeletedEventIds(Array.isArray(payload.deletedEventIds) ? payload.deletedEventIds : []);
          setPersonas(normalizePersonas(Array.isArray(payload.personas) ? payload.personas : []));
          setContenido(Array.isArray(payload.contenido) ? payload.contenido : []);
          setWaLog(Array.isArray(payload.waLog) ? payload.waLog : []);
          if (payload.settings) setSettings({ ...DEFAULT_SETTINGS, ...payload.settings });
          showToast(`Backup importado: ${payload.companies.length} empresas, ${(payload.meetings || []).length} reuniones, ${(payload.personas || []).length} personas.`);
        } catch (e) {
          showToast("No se pudo importar el backup: " + e.message);
        }
      };
      reader.readAsText(file);
    },
    [showToast]
  );

  // ------------------------------------------------------- Atajos de teclado
  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowPalette((v) => !v);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  // ------------------------------------------------------- Derivados
  const actividad = useMemo(() => construirActividad(companies, personas, meetings, waLog), [companies, personas, meetings, waLog]);

  const metrics = useMemo(() => calcularMetricas(companies, settings), [companies, settings]);

  const agenda = useMemo(() => {
    const today = hoyISO();
    const upcoming = meetings.filter((m) => m.fecha >= today).sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
    const past = meetings.filter((m) => m.fecha < today).sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora));
    return { upcoming, past, hoy: upcoming.filter((m) => m.fecha === today) };
  }, [meetings]);

  const pendientes = useMemo(() => calcularPendientes(companies, personas, meetings), [companies, personas, meetings]);

  const vars = useMemo(() => ({ asesor: settings.asesor, descuento: settings.descuento }), [settings.asesor, settings.descuento]);
  const theme = settings.theme === "dark" ? "dark" : "light";
  const go = useCallback((v) => {
    setView(v);
    try {
      window.scrollTo({ top: 0 });
    } catch (e) {
      // no crítico
    }
  }, []);
  const abrirCotizador = useCallback((companyId) => {
    setCotizarPara(companyId || null);
    setSelectedId(null);
    setView("cotizador");
  }, []);

  const selected = companies.find((c) => c.id === selectedId);
  const badges = {
    hoy: pendientes.totalUrgente,
    campana: pendientes.waDue.length,
    agenda: agenda.hoy.length,
  };

  if (loadFailed) {
    return (
      <div className="crm" data-theme="light" style={{ alignItems: "center", justifyContent: "center" }}>
        <style>{APP_CSS}</style>
        <div className="card" style={{ maxWidth: 420, padding: 24, textAlign: "center", margin: "auto" }}>
          <AlertTriangle size={28} color="var(--warn)" />
          <div style={{ fontWeight: 700, fontSize: 17, marginTop: 8 }}>No se pudieron cargar tus datos</div>
          <div className="muted" style={{ marginTop: 6 }}>No se modificó ni se guardó nada — tu información está a salvo. Recargá la página para volver a intentarlo.</div>
          <Btn variant="primary" style={{ marginTop: 14 }} onClick={() => window.location.reload()}>Recargar</Btn>
        </div>
      </div>
    );
  }
  if (!loaded) {
    return (
      <div className="crm" data-theme={theme} style={{ alignItems: "center", justifyContent: "center" }}>
        <style>{APP_CSS}</style>
        <div style={{ margin: "auto", fontWeight: 600 }} className="muted">
          <RefreshCw size={16} className="spin" style={{ verticalAlign: -3, marginRight: 8 }} />
          Cargando tu CRM…
        </div>
      </div>
    );
  }

  const waHoy = calcularWaStats(waLog).enviadosHoy;
  const common = { companies, setSelectedId, setShowWhatsApp, go };

  return (
    <ThemeCtx.Provider value={theme}>
      <div className="crm" data-theme={theme}>
        <style>{APP_CSS}</style>

        <aside className="side">
          <div className="row" style={{ gap: 10, padding: "2px 6px 6px" }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: "linear-gradient(135deg,#14B8A6,#0E7490)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Stethoscope size={19} color="white" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 15, letterSpacing: "-.01em" }}>CRM Omint</div>
              <div style={{ color: "#7F93B2", fontSize: 11.5 }}>Medicina prepaga · Mendoza</div>
            </div>
          </div>

          <button className="nav-btn" onClick={() => setShowPalette(true)} style={{ background: "var(--side-2)", color: "#8FA3C2" }}>
            <Search size={15} /> Buscar o crear…
            <span className="kbd" style={{ marginLeft: "auto", background: "transparent", borderColor: "#2A3F60", color: "#7F93B2" }}>Ctrl K</span>
          </button>

          <nav aria-label="Secciones">
            {NAV.map((n, i) =>
              n.group ? (
                <div key={i} className="nav-group">{n.group}</div>
              ) : (
                <button key={n.key} className={"nav-btn" + (view === n.key ? " on" : "")} onClick={() => go(n.key)} aria-current={view === n.key ? "page" : undefined}>
                  <n.icon size={16} />
                  {n.label}
                  {badges[n.key] > 0 && <span className={"nav-badge" + (n.key === "hoy" ? " hot" : "")}>{badges[n.key]}</span>}
                </button>
              )
            )}
          </nav>

          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ background: "var(--side-2)", borderRadius: 12, padding: "10px 12px", color: "var(--side-ink)", fontSize: 12 }}>
              <div className="row between">
                <span style={{ fontWeight: 600 }}>WhatsApp hoy</span>
                <span className="tnum" style={{ fontWeight: 800, color: "#fff" }}>{waHoy} / {WA_DAILY_HARD_LIMIT}</span>
              </div>
              <div style={{ height: 5, borderRadius: 9, background: "rgba(255,255,255,.12)", marginTop: 7, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(100, (waHoy / WA_DAILY_HARD_LIMIT) * 100)}%`, background: waHoy >= WA_DAILY_HARD_LIMIT ? "#F07068" : "#7FE3D5" }} />
              </div>
            </div>
            <div className="row" style={{ gap: 6 }}>
              <button className="nav-btn" style={{ justifyContent: "center", background: "var(--side-2)", flex: 1 }} onClick={exportBackup} title="Descargar backup completo (.json)">
                <Download size={14} /> Backup
              </button>
              <label className="nav-btn" style={{ justifyContent: "center", background: "var(--side-2)", flex: 1, cursor: "pointer" }} title="Restaurar un backup (reemplaza los datos actuales)">
                <Upload size={14} /> Restaurar
                <input
                  type="file"
                  accept="application/json"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) askConfirm("Esto va a reemplazar todas las empresas, personas y reuniones actuales por las del backup. ¿Confirmás?", () => importBackup(file));
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            <div className="row" style={{ gap: 6 }}>
              <button className="nav-btn" style={{ justifyContent: "center", background: "var(--side-2)", flex: 1 }} onClick={() => setShowSettings(true)}>
                <Settings size={14} /> Ajustes
              </button>
              {HOSTED && window.__CRM_LOGOUT__ && (
                <button
                  className="nav-btn"
                  style={{ justifyContent: "center", background: "var(--side-2)", width: 44, flex: "none" }}
                  title="Cerrar sesión"
                  aria-label="Cerrar sesión"
                  onClick={() => askConfirm("¿Cerrar sesión en este dispositivo?", () => window.__CRM_LOGOUT__())}
                >
                  <LogOut size={15} />
                </button>
              )}
              <button
                className="nav-btn"
                style={{ justifyContent: "center", background: "var(--side-2)", width: 44, flex: "none" }}
                onClick={() => setSettings((s) => ({ ...s, theme: s.theme === "dark" ? "light" : "dark" }))}
                title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
                aria-label="Cambiar tema"
              >
                {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
              </button>
            </div>
          </div>
        </aside>

        <main className="main">
          <div className="topbar">
            <button className="nav-btn" style={{ width: "auto" }} onClick={() => setShowPalette(true)} aria-label="Buscar">
              <Search size={16} />
            </button>
            {NAV.filter((n) => !n.group).map((n) => (
              <button key={n.key} className={"nav-btn" + (view === n.key ? " on" : "")} style={{ width: "auto" }} onClick={() => go(n.key)}>
                <n.icon size={15} /> {n.label}
              </button>
            ))}
            <button className="nav-btn" style={{ width: "auto" }} onClick={() => setShowSettings(true)} aria-label="Ajustes">
              <Settings size={15} />
            </button>
          </div>

          <div className="inner">
            {view === "hoy" && (
              <MiDia
                {...common}
                settings={settings}
                metrics={metrics}
                pendientes={pendientes}
                agenda={agenda}
                actividad={actividad}
                personas={personas}
                setLogFor={setLogFor}
                setShowNewMeeting={setShowNewMeeting}
                setShowNewCompany={setShowNewCompany}
                setSelectedPersonaId={setSelectedPersonaId}
                setShowPersonaWhatsApp={setShowPersonaWhatsApp}
              />
            )}
            {view === "tablero" && <Tablero {...common} settings={settings} metrics={metrics} actividad={actividad} meetings={meetings} />}
            {view === "pipeline" && <Pipeline {...common} updateCompany={updateCompany} setShowNewCompany={setShowNewCompany} setLogFor={setLogFor} />}
            {view === "empresas" && <Cartera {...common} setShowNewCompany={setShowNewCompany} showToast={showToast} />}
            {view === "agenda" && (
              <Agenda
                {...common}
                agenda={agenda}
                setShowNewMeeting={setShowNewMeeting}
                removeMeeting={removeMeeting}
                syncFromGoogle={syncFromGoogle}
                gcalStatus={gcalStatus}
                lastSynced={lastSynced}
                retryMeetingSync={retryMeetingSync}
                pendingDeletions={pendingDeletions}
                retryDeletion={retryDeletion}
                setLogFor={setLogFor}
              />
            )}
            {view === "campana" && <Campaign {...common} waLog={waLog} />}
            {view === "cotizador" && (
              <Cotizador companies={companies} settings={settings} presetCompanyId={cotizarPara} guardarCotizacion={guardarCotizacion} showToast={showToast} vars={vars} />
            )}
            {view === "b2c" && <DashboardB2C personas={personas} waLog={waLog} go={go} setShowNewPersona={setShowNewPersona} />}
            {view === "personas" && (
              <PersonasList
                personas={personas}
                setSelectedPersonaId={setSelectedPersonaId}
                setShowNewPersona={setShowNewPersona}
                setShowPersonaWhatsApp={setShowPersonaWhatsApp}
                importPersonas={importPersonas}
                clearPersonas={clearPersonas}
                askConfirm={askConfirm}
                showToast={showToast}
                updatePersona={updatePersona}
              />
            )}
            {view === "campanab2c" && <CampanaB2C personas={personas} setSelectedPersonaId={setSelectedPersonaId} setShowPersonaWhatsApp={setShowPersonaWhatsApp} updatePersona={updatePersona} />}
            {view === "producto" && <ProductoReferencia go={go} />}
            {view === "contenido" && <ContenidoPlanner contenido={contenido} addContenido={addContenido} updateContenido={updateContenido} deleteContenido={deleteContenido} askConfirm={askConfirm} />}
          </div>
        </main>

        {selectedPersonaId && personas.find((p) => p.id === selectedPersonaId) && (
          <PersonaDetail
            persona={personas.find((p) => p.id === selectedPersonaId)}
            onClose={() => setSelectedPersonaId(null)}
            updatePersona={updatePersona}
            deletePersona={deletePersona}
            setShowPersonaWhatsApp={setShowPersonaWhatsApp}
            askConfirm={askConfirm}
          />
        )}
        {showNewPersona && <NewPersonaModal onClose={() => setShowNewPersona(false)} onSave={(data) => { addPersona(data); setShowNewPersona(false); }} />}
        {showPersonaWhatsApp && personas.find((p) => p.id === showPersonaWhatsApp) && (
          <PersonaWhatsAppModal
            persona={personas.find((p) => p.id === showPersonaWhatsApp)}
            onClose={() => setShowPersonaWhatsApp(null)}
            onSent={() => logPersonaWhatsAppSent(showPersonaWhatsApp)}
            waLog={waLog}
            vars={vars}
          />
        )}

        {selected && (
          <CompanyDetail
            company={selected}
            onClose={() => setSelectedId(null)}
            updateCompany={updateCompany}
            addHistorial={addHistorial}
            deleteCompany={deleteCompany}
            meetings={meetings.filter((m) => m.companyId === selected.id)}
            setShowNewMeeting={setShowNewMeeting}
            removeMeeting={removeMeeting}
            retryMeetingSync={retryMeetingSync}
            setShowWhatsApp={setShowWhatsApp}
            stopWhatsAppSequence={stopWhatsAppSequence}
            askConfirm={askConfirm}
            setLogFor={setLogFor}
            abrirCotizador={abrirCotizador}
          />
        )}
        {showWhatsApp && companies.find((c) => c.id === showWhatsApp) && (
          <WhatsAppModal
            company={companies.find((c) => c.id === showWhatsApp)}
            onClose={() => setShowWhatsApp(null)}
            onSent={(stepKey) => logWhatsAppSent(showWhatsApp, stepKey)}
            onStopSequence={(stopped) => stopWhatsAppSequence(showWhatsApp, stopped)}
            waLog={waLog}
            vars={vars}
          />
        )}
        {showNewCompany && (
          <NewCompanyModal
            onClose={() => setShowNewCompany(false)}
            onSave={(data) => {
              const id = uid();
              setCompanies((prev) => [...prev, { id, stage: "prospeccion", capitas: "", proximaAccion: "", fechaProximaAccion: "", historial: [], fechaAlta: hoyISO(), ...data }]);
              setShowNewCompany(false);
              setSelectedId(id);
              showToast(`✓ ${data.empresa} agregada a tu cartera`);
            }}
          />
        )}
        {showNewMeeting && (
          <NewMeetingModal
            companies={companies}
            preselectedId={typeof showNewMeeting === "string" ? showNewMeeting : null}
            onClose={() => setShowNewMeeting(false)}
            onSave={(data, syncToGoogle) => {
              createMeeting(data, syncToGoogle);
              setShowNewMeeting(false);
              showToast(`✓ Reunión agendada: ${data.empresa} · ${fmtFecha(data.fecha)} ${data.hora}`);
            }}
          />
        )}
        {logFor && <LogActividadModal preset={logFor} companies={companies} onClose={() => setLogFor(null)} onSave={(d) => { registrarActividad(d); setLogFor(null); }} />}
        {lostFor && companies.find((c) => c.id === lostFor) && (
          <MotivoPerdidaModal
            company={companies.find((c) => c.id === lostFor)}
            onClose={() => setLostFor(null)}
            onSave={(motivo, detalle) => {
              updateCompany(lostFor, { motivoPerdida: motivo, proximaAccion: "", fechaProximaAccion: "" });
              addHistorial(lostFor, `Perdida — ${motivo}${detalle ? `: ${detalle}` : ""}`, "nota");
              setLostFor(null);
            }}
          />
        )}
        {showSettings && <SettingsModal settings={settings} onClose={() => setShowSettings(false)} onSave={(s) => { setSettings(s); setShowSettings(false); showToast("✓ Ajustes guardados"); }} />}
        {showPalette && (
          <CommandPalette
            companies={companies}
            personas={personas}
            onClose={() => setShowPalette(false)}
            onPickCompany={(id) => { setSelectedId(id); setShowPalette(false); }}
            onPickPersona={(id) => { setSelectedPersonaId(id); setShowPalette(false); }}
            actions={[
              { label: "Nueva empresa", icon: Plus, run: () => setShowNewCompany(true) },
              { label: "Agendar reunión", icon: CalIcon, run: () => setShowNewMeeting(true) },
              { label: "Registrar actividad", icon: Activity, run: () => setLogFor({}) },
              { label: "Nuevo paciente (B2C)", icon: Users, run: () => setShowNewPersona(true) },
              { label: "Abrir cotizador", icon: Calculator, run: () => abrirCotizador(null) },
              ...NAV.filter((n) => !n.group).map((n) => ({ label: `Ir a ${n.label}`, icon: n.icon, run: () => go(n.key) })),
            ]}
          />
        )}

        <div className="savestate">
          {saveState === "saving" && "Guardando…"}
          {saveState === "saved" && "✓ Guardado"}
          {saveState === "error" && (
            <span style={{ color: "var(--bad)", background: "var(--bad-soft)", padding: "4px 8px", borderRadius: 8 }}>
              ⚠ No se pudo guardar ·{" "}
              <button onClick={() => saveNow()} style={{ textDecoration: "underline", background: "none", border: 0, color: "inherit", cursor: "pointer", font: "inherit" }}>Reintentar</button>
            </span>
          )}
        </div>

        {confirmState && (
          <Modal title="Confirmar" onClose={() => setConfirmState(null)}>
            <div className="stack">
              <div>{confirmState.message}</div>
              <div className="row" style={{ justifyContent: "flex-end" }}>
                <Btn onClick={() => setConfirmState(null)}>Cancelar</Btn>
                <Btn variant="danger" onClick={() => { confirmState.onConfirm(); setConfirmState(null); }}>Confirmar</Btn>
              </div>
            </div>
          </Modal>
        )}
        {toast && <div className="toast" role="status">{toast}</div>}
      </div>
    </ThemeCtx.Provider>
  );
}

// ======================================================== Métricas ===

function calcularMetricas(companies, settings) {
  const now = new Date();
  const hoy = hoyISO();
  const mesActual = hoy.slice(0, 7);
  const { start: qStart, end: qEnd, label: qLabel } = quarterRange(now);
  const byStage = {};
  const capByStage = {};
  STAGES.forEach((s) => {
    byStage[s.key] = 0;
    capByStage[s.key] = 0;
  });
  let capitasGanadas = 0, capitasPipeline = 0, forecast = 0, calientes = 0, mrrGanado = 0, mrrPipeline = 0;
  const ganadas = [];
  const perdidas = [];
  const motivos = {};
  companies.forEach((c) => {
    byStage[c.stage] = (byStage[c.stage] || 0) + 1;
    const cap = num(c.capitas);
    capByStage[c.stage] = (capByStage[c.stage] || 0) + cap;
    if (c.tier === "caliente") calientes++;
    if (c.stage === "ganado") {
      capitasGanadas += cap;
      mrrGanado += num(c.montoMensual);
      ganadas.push(c);
    } else if (c.stage === "perdido") {
      perdidas.push(c);
      const m = c.motivoPerdida || "Sin motivo registrado";
      motivos[m] = (motivos[m] || 0) + 1;
    } else {
      capitasPipeline += cap;
      forecast += cap * (STAGE_BY_KEY[c.stage]?.prob || 0);
      mrrPipeline += num(c.montoMensual) * (STAGE_BY_KEY[c.stage]?.prob || 0);
    }
  });
  const ganadasConFecha = ganadas.filter((c) => c.fechaGanado);
  const capitasEsteMes = ganadasConFecha.filter((c) => c.fechaGanado.slice(0, 7) === mesActual).reduce((s, c) => s + num(c.capitas), 0);
  const enTrimestre = ganadasConFecha.filter((c) => {
    const d = parseISO(c.fechaGanado);
    return d >= qStart && d <= qEnd;
  });
  const capitasNetasTrimestre = enTrimestre.reduce((s, c) => s + num(c.capitas), 0);
  const empresas20Trimestre = enTrimestre.filter((c) => num(c.capitas) > 20).length;

  // Ciclo de venta: desde el primer contacto registrado hasta el cierre.
  const ciclos = ganadasConFecha
    .map((c) => {
      const sd = c.stageDates || {};
      const fechas = (c.historial || []).map((h) => h.fecha).filter(Boolean).sort();
      const inicio = sd.contacto || sd.reunion || fechas[0];
      return inicio ? diasEntre(inicio, c.fechaGanado) : null;
    })
    .filter((x) => x !== null && x >= 0);
  const cicloPromedio = ciclos.length ? ciclos.reduce((a, b) => a + b, 0) / ciclos.length : null;

  // Cápitas ganadas por mes (últimos 6 meses).
  const porMes = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
    porMes.push({
      key,
      mes: MESES_CORTO[d.getMonth()],
      tooltipLabel: `${MESES_ES[d.getMonth()]} ${d.getFullYear()}`,
      capitas: ganadasConFecha.filter((c) => c.fechaGanado.slice(0, 7) === key).reduce((s, c) => s + num(c.capitas), 0),
    });
  }

  const cerradas = ganadas.length + perdidas.length;
  const diasMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const faltan = Math.max(0, settings.metaMensual - capitasEsteMes);
  const habiles = diasHabilesRestantes(now);
  return {
    byStage,
    capByStage,
    total: companies.length,
    calientes,
    capitasGanadas,
    capitasPipeline,
    forecast,
    mrrGanado,
    mrrPipeline,
    tier: commissionTier(capitasGanadas),
    winRate: cerradas ? ganadas.length / cerradas : null,
    ganadasN: ganadas.length,
    perdidasN: perdidas.length,
    ticket: ganadas.length ? capitasGanadas / ganadas.length : null,
    cicloPromedio,
    motivos: Object.entries(motivos).sort((a, b) => b[1] - a[1]),
    porMes,
    capitasEsteMes,
    metaMensual: settings.metaMensual,
    faltan,
    diasRestantes: Math.max(0, diasMes - now.getDate()),
    habiles,
    porDiaHabil: habiles ? faltan / habiles : faltan,
    proyeccionMes: now.getDate() > 0 ? (capitasEsteMes / now.getDate()) * diasMes : 0,
    capitasNetasTrimestre,
    empresas20Trimestre,
    premioCapitas: premioCapitasNetas(capitasNetasTrimestre),
    premioEmpresas: premioEmpresas20(empresas20Trimestre),
    qLabel,
    activos: companies.filter((c) => ACTIVE_STAGES.includes(c.stage)).length,
  };
}

function calcularPendientes(companies, personas, meetings) {
  const hoy = hoyISO();
  const vencidas = [];
  const enRiesgo = [];
  const waDue = [];
  const calientes = [];
  companies.forEach((c) => {
    if (!isOpen(c)) return;
    if (c.fechaProximaAccion && c.fechaProximaAccion <= hoy) vencidas.push(c);
    else if (["reunion", "propuesta", "negociacion"].includes(c.stage)) {
      const d = diasSinActividad(c);
      if (d === null || d >= 7) enRiesgo.push(c);
    }
    if (c.telefono) {
      const seq = getSequenceStatus(c);
      if (seq.status === "due" && seq.step && seq.step.key !== WHATSAPP_SEQUENCE[0].key) waDue.push({ c, seq });
    }
    if (c.tier === "caliente" && c.stage === "prospeccion" && c.telefono && !c.waSequenceStopped) calientes.push(c);
  });
  vencidas.sort((a, b) => a.fechaProximaAccion.localeCompare(b.fechaProximaAccion));
  enRiesgo.sort((a, b) => (STAGE_BY_KEY[b.stage].prob - STAGE_BY_KEY[a.stage].prob) || num(b.capitas) - num(a.capitas));
  const b2c = personas
    .filter((p) => p.seguimiento && p.seguimiento <= hoy && !["cliente", "descartado"].includes(p.status))
    .sort((a, b) => a.seguimiento.localeCompare(b.seguimiento));
  const reunionesHoy = meetings.filter((m) => m.fecha === hoy).length;
  return { vencidas, enRiesgo, waDue, calientes, b2c, totalUrgente: vencidas.length + waDue.length + b2c.length + reunionesHoy };
}
