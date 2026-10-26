
// ================================================================ Agenda ===

function Agenda({ agenda, companies, setShowNewMeeting, removeMeeting, syncFromGoogle, gcalStatus, lastSynced, retryMeetingSync, pendingDeletions, retryDeletion, setSelectedId, setLogFor }) {
  const [verPasadas, setVerPasadas] = useState(false);
  const porDia = useMemo(() => {
    const g = new Map();
    agenda.upcoming.forEach((m) => {
      if (!g.has(m.fecha)) g.set(m.fecha, []);
      g.get(m.fecha).push(m);
    });
    return [...g.entries()];
  }, [agenda.upcoming]);
  const open = (m) => {
    const comp = companies.find((c) => c.id === m.companyId);
    if (comp) setSelectedId(comp.id);
  };

  return (
    <div className="stack">
      <PageHeader
        title="Agenda de reuniones"
        subtitle={HOSTED ? "Usá “Agregar a Google Calendar” en cada reunión para tenerla también en tu calendario" : `Se sincroniza con Google Calendar cada 30 minutos${lastSynced ? ` · última: ${lastSynced.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}` : ""}`}
      >
        {!HOSTED && <Btn icon={RefreshCw} onClick={syncFromGoogle} disabled={gcalStatus === "syncing"} className={gcalStatus === "syncing" ? "syncing" : ""}>
          {gcalStatus === "syncing" ? "Sincronizando…" : gcalStatus === "done" ? "¡Listo!" : gcalStatus === "error" ? "Error, reintentar" : "Traer de Google Calendar"}
        </Btn>}
        <Btn variant="primary" icon={Plus} onClick={() => setShowNewMeeting(true)}>Reunión</Btn>
      </PageHeader>

      {pendingDeletions.length > 0 && (
        <div className="note t-bad">
          <strong>{pendingDeletions.length === 1 ? "1 reunión no se pudo borrar" : `${pendingDeletions.length} reuniones no se pudieron borrar`} de Google Calendar</strong>
          {pendingDeletions.map((p) => (
            <div key={p.id} className="row between" style={{ marginTop: 4 }}>
              <span>{p.empresa}{p.error ? ` — ${p.error}` : ""}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => retryDeletion(p)}>Reintentar</button>
            </div>
          ))}
        </div>
      )}

      <div className="grid g3">
        <Kpi icon={CalIcon} label="Hoy" value={agenda.hoy.length} sub="reuniones" />
        <Kpi icon={Clock} label="Próximos 7 días" value={agenda.upcoming.filter((m) => m.fecha <= addDaysISO(7)).length} sub="reuniones" tone="info" />
        <Kpi icon={CheckCircle2} label="Últimos 30 días" value={agenda.past.filter((m) => m.fecha >= addDaysISO(-30)).length} sub="reuniones realizadas" tone="good" />
      </div>

      <Card title="Próximas" icon={CalIcon}>
        {porDia.length === 0 ? (
          <EmptyNote>Sin reuniones agendadas.</EmptyNote>
        ) : (
          <div className="stack">
            {porDia.map(([fecha, ms]) => (
              <div key={fecha}>
                <div className="label" style={{ textTransform: "capitalize" }}>
                  {fmtFecha(fecha, { weekday: "long", day: "numeric", month: "long" })} <span className="muted" style={{ fontWeight: 500, textTransform: "none" }}>· {fmtRelativo(fecha)}</span>
                </div>
                <div className="stack-sm">
                  {ms.map((m) => <MeetingRow key={m.id} m={m} onClick={() => open(m)} onDelete={() => removeMeeting(m)} onRetry={() => retryMeetingSync(m)} />)}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title={`Pasadas (${agenda.past.length})`} icon={Clock} action={<button className="btn btn-ghost btn-sm" onClick={() => setVerPasadas((v) => !v)}>{verPasadas ? "Ocultar" : "Mostrar"}</button>}>
        {verPasadas &&
          (agenda.past.length === 0 ? (
            <EmptyNote>Sin historial todavía.</EmptyNote>
          ) : (
            <div className="stack-sm">
              {agenda.past.slice(0, 60).map((m) => (
                <MeetingRow key={m.id} m={m} past onClick={() => open(m)} onDelete={() => removeMeeting(m)} onRetry={() => retryMeetingSync(m)} onLog={m.companyId ? () => setLogFor({ companyId: m.companyId, tipo: "reunion" }) : null} />
              ))}
            </div>
          ))}
      </Card>
    </div>
  );
}

function MeetingRow({ m, past, onClick, onDelete, onRetry, onLog }) {
  return (
    <div className="item" style={{ opacity: past ? 0.75 : 1, cursor: "default" }}>
      <span className={"chip tnum " + (past ? "t-neutral" : "t-warn")} style={{ fontSize: 12.5 }}>
        {past ? fmtFecha(m.fecha) + " " : ""}{m.hora}
      </span>
      <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={onClick}>
        <div className="row" style={{ gap: 6, fontWeight: 600 }}>
          {m.empresa}
          {m.syncStatus === "synced" && <Link2 size={12} color="var(--accent)" aria-label="sincronizada" />}
          {m.syncStatus === "syncing" && <RefreshCw size={12} className="spin" />}
          {m.syncStatus === "error" && <XCircle size={12} color="var(--bad)" />}
        </div>
        {m.notas && <div className="muted" style={{ fontSize: 12 }}>{m.notas}</div>}
        {m.syncStatus === "error" && (
          <div style={{ fontSize: 12, color: "var(--bad)" }}>
            No se sincronizó con Google Calendar{m.syncError ? `: ${m.syncError}` : ""}{" "}
            <button className="btn btn-ghost btn-sm" style={{ color: "var(--bad)", padding: "0 4px" }} onClick={(e) => { e.stopPropagation(); onRetry && onRetry(); }}>Reintentar</button>
          </div>
        )}
      </div>
      {onLog && <Btn size="sm" variant="soft" onClick={onLog}>Registrar resultado</Btn>}
      {HOSTED && !past && (
        <a className="btn btn-outline btn-sm" href={gcalTemplateLink(m)} target="_blank" rel="noreferrer" title="Agregar a Google Calendar">
          <CalIcon size={13} /> Google Calendar
        </a>
      )}
      <button className="icon-btn" onClick={onDelete} aria-label="Borrar reunión"><Trash2 size={13} /></button>
    </div>
  );
}

function NewMeetingModal({ companies, preselectedId, onClose, onSave }) {
  const [companyId, setCompanyId] = useState(preselectedId || "");
  const [busca, setBusca] = useState("");
  const [form, setForm] = useState({ fecha: addDaysISO(1), hora: "10:00", notas: "" });
  const [syncToGoogle, setSyncToGoogle] = useState(true);
  const comp = companies.find((c) => c.id === companyId);
  const sugerencias = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return [];
    return companies.filter((c) => c.empresa.toLowerCase().includes(q) || (c.contacto || "").toLowerCase().includes(q)).slice(0, 6);
  }, [busca, companies]);

  return (
    <Modal title="Agendar reunión" onClose={onClose}>
      <div className="stack">
        {comp ? (
          <div className="tile row between">
            <span style={{ fontWeight: 700 }}>{comp.empresa}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setCompanyId("")}>Cambiar</button>
          </div>
        ) : (
          <div>
            <span className="label">Empresa (opcional)</span>
            <SearchBox value={busca} onChange={setBusca} placeholder="Buscar empresa…" />
            <div className="stack-sm" style={{ marginTop: 6 }}>
              {sugerencias.map((c) => (
                <button key={c.id} className="item" onClick={() => { setCompanyId(c.id); setBusca(""); }}>
                  <Building2 size={14} /> {c.empresa}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="grid g2" style={{ gap: 10 }}>
          <Field label="Fecha"><input type="date" className="input" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} /></Field>
          <Field label="Hora"><input type="time" className="input" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} /></Field>
        </div>
        <QuickDates onPick={(d) => setForm({ ...form, fecha: d })} />
        <Field label="Notas"><input className="input" value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} placeholder="Ej: presentación de planes con RRHH" /></Field>
        <label className="row" style={{ gap: 8, fontSize: 13, cursor: "pointer" }}>
          <input type="checkbox" checked={syncToGoogle} onChange={(e) => setSyncToGoogle(e.target.checked)} /> {HOSTED ? "Abrir Google Calendar para guardarla también ahí" : "Crear también en Google Calendar"}
        </label>
        {comp && ["prospeccion", "contacto"].includes(comp.stage) && <div className="note t-accent">La empresa pasa automáticamente a “Reunión Agendada”.</div>}
        <Btn
          variant="primary"
          icon={CalIcon}
          disabled={!comp && !form.notas.trim()}
          style={{ width: "100%" }}
          onClick={() => onSave({ ...form, companyId: comp ? comp.id : "", empresa: comp ? comp.empresa : form.notas || "Reunión" }, syncToGoogle)}
        >
          Agendar
        </Btn>
      </div>
    </Modal>
  );
}

// ======================================================= Campaña B2B (WA) ===

function Campaign({ companies, setSelectedId, setShowWhatsApp, waLog }) {
  const [tierFilter, setTierFilter] = useState("caliente");
  const [stageFilter, setStageFilter] = useState("todos");
  const [onlyDue, setOnlyDue] = useState(true);
  const [index, setIndex] = useState(0);
  const waGate = useWaGate(waLog);

  const withSeq = useMemo(
    () =>
      companies
        .filter((c) => isOpen(c) && !!c.telefono)
        .filter((c) => tierFilter === "todos" || c.tier === tierFilter)
        .filter((c) => stageFilter === "todos" || c.stage === stageFilter)
        .map((c) => ({ company: c, seq: getSequenceStatus(c) })),
    [companies, tierFilter, stageFilter]
  );
  const queue = useMemo(() => {
    const base = onlyDue ? withSeq.filter((x) => x.seq.status === "due") : withSeq.filter((x) => x.seq.status !== "stopped" && x.seq.status !== "completed");
    const order = { due: 0, waiting: 1, completed: 2, stopped: 3 };
    // Primero los seguimientos (ya hubo contacto), después los primeros mensajes.
    return [...base].sort((a, b) => order[a.seq.status] - order[b.seq.status] || (a.seq.step?.key === "variante_a") - (b.seq.step?.key === "variante_a") || (a.seq.dueDate && b.seq.dueDate ? a.seq.dueDate - b.seq.dueDate : 0));
  }, [withSeq, onlyDue]);
  useEffect(() => setIndex(0), [tierFilter, stageFilter, onlyDue]);
  const current = queue[index];
  const dueCount = withSeq.filter((x) => x.seq.status === "due").length;
  const restantesHoy = Math.max(0, WA_DAILY_HARD_LIMIT - waGate.enviadosHoy);

  return (
    <div className="stack">
      <PageHeader title="Campaña de WhatsApp" subtitle={`${dueCount} empresas listas para el próximo mensaje · secuencia: Variante A → Seguimiento 1 (+2 d) → Seguimiento 2 (+7 d)`}>
        <div className="seg">
          {[["caliente", "Calientes"], ["tibio", "Tibias"], ["todos", "Todas"]].map(([k, l]) => (
            <button key={k} className={tierFilter === k ? "on" : ""} onClick={() => setTierFilter(k)}>{l}</button>
          ))}
        </div>
        <select className="select" value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
          <option value="todos">Toda etapa</option>
          {STAGES.filter((s) => !["ganado", "perdido"].includes(s.key)).map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <label className="row ink2" style={{ gap: 6, fontSize: 12.5, cursor: "pointer" }}>
          <input type="checkbox" checked={onlyDue} onChange={(e) => setOnlyDue(e.target.checked)} /> Solo listas para enviar
        </label>
      </PageHeader>

      <div className="grid g3">
        <Card className="span2" title={queue.length ? `Contacto ${Math.min(index + 1, queue.length)} de ${queue.length}` : "Cola vacía"} icon={Megaphone}>
          {!current ? (
            <EmptyNote>{onlyDue ? "No hay empresas listas para el próximo mensaje con este filtro." : "No hay empresas con teléfono que coincidan con el filtro."}</EmptyNote>
          ) : (
            <div className="stack">
              <div className="row between" style={{ alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>{current.company.empresa}</div>
                  <div className="muted">{current.company.contacto} · {current.company.telefono}</div>
                </div>
                <div className="stack-sm" style={{ textAlign: "right" }}>
                  <div><TierBadge tier={current.company.tier} /></div>
                  <div><SequenceBadge seq={current.seq} /></div>
                </div>
              </div>
              {current.company.nota && <div className="note t-accent">{current.company.nota}</div>}
              <div className="row wrap">
                <Btn variant="wa" icon={MessageCircle} onClick={() => setShowWhatsApp(current.company.id)}>Enviar WhatsApp</Btn>
                <Btn onClick={() => setSelectedId(current.company.id)}>Ver ficha</Btn>
                <Btn variant="ghost" icon={SkipForward} style={{ marginLeft: "auto" }} onClick={() => setIndex((i) => Math.min(i + 1, queue.length))}>Saltar</Btn>
              </div>
            </div>
          )}
        </Card>
        <Card title="Cupo de hoy" icon={Timer}>
          <div className="row" style={{ alignItems: "baseline", gap: 6 }}>
            <span className="tnum" style={{ fontSize: 32, fontWeight: 800 }}>{restantesHoy}</span>
            <span className="muted">mensajes disponibles</span>
          </div>
          <ProgressBar value={waGate.enviadosHoy} max={WA_DAILY_HARD_LIMIT} tone={waGate.superoLimite ? "bad" : undefined} />
          <div style={{ marginTop: 10 }}><WaGateBanner waGate={waGate} /></div>
        </Card>
      </div>

      {queue.length > 0 && (
        <Card title="Resto de la cola" icon={ClipboardList}>
          <div className="stack-sm">
            {queue.slice(0, 80).map((x, i) => (
              <div key={x.company.id} className="item" style={{ opacity: i === index ? 1 : 0.85, borderColor: i === index ? "var(--accent)" : "transparent" }} onClick={() => setIndex(i)}>
                <span className="tnum muted" style={{ width: 26, fontSize: 12 }}>{i + 1}</span>
                <span style={{ fontWeight: 600, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{x.company.empresa}</span>
                <TierBadge tier={x.company.tier} />
                <SequenceBadge seq={x.seq} />
                <button className="icon-btn wa" onClick={(e) => { e.stopPropagation(); setShowWhatsApp(x.company.id); }} aria-label="Enviar WhatsApp"><MessageCircle size={14} /></button>
              </div>
            ))}
            {queue.length > 80 && <div className="muted" style={{ fontSize: 12 }}>y {queue.length - 80} más.</div>}
          </div>
        </Card>
      )}
    </div>
  );
}

function WaGateBanner({ waGate }) {
  if (waGate.superoLimite) {
    return <div className="note t-bad">🛑 Ya enviaste {waGate.enviadosHoy} WhatsApp hoy: llegaste al máximo recomendado mientras tu cuenta se recupera de restricciones recientes. Seguí mañana.</div>;
  }
  if (waGate.msRestantesCooldown > 0) {
    const seg = Math.ceil(waGate.msRestantesCooldown / 1000);
    return <div className="note t-warn">⏳ Dejá al menos {WA_COOLDOWN_MS / 60000} minutos entre envíos para que WhatsApp no lo detecte como spam. Podés enviar en {Math.floor(seg / 60)}:{pad2(seg % 60)}.</div>;
  }
  return <div className="note t-good">Podés enviar el próximo mensaje · {waGate.enviadosHoy} de {WA_DAILY_HARD_LIMIT} hoy.</div>;
}

function WhatsAppModal({ company, onClose, onSent, onStopSequence, waLog, vars }) {
  const seq = getSequenceStatus(company);
  const initialStepKey = seq.step ? seq.step.key : seq.status === "completed" ? WHATSAPP_SEQUENCE[WHATSAPP_SEQUENCE.length - 1].key : WHATSAPP_SEQUENCE[0].key;
  const nombre = capitalizar(getFirstName(company.contacto));
  const build = (k) => fillVars((WHATSAPP_SEQUENCE.find((s) => s.key === k) || WHATSAPP_SEQUENCE[0]).text, { ...vars, nombre, empresa: company.empresa });
  const [stepKey, setStepKey] = useState(initialStepKey);
  const [phone, setPhone] = useState(normalizePhoneAR(company.telefono));
  const [message, setMessage] = useState(build(initialStepKey));
  const [sent, setSent] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const waGate = useWaGate(waLog);

  return (
    <Modal title={`WhatsApp · ${company.empresa}`} onClose={onClose} width={540}>
      <div className="stack">
        <WaGateBanner waGate={waGate} />
        {seq.status === "stopped" && (
          <div className="note t-neutral row between">
            <span>Secuencia detenida para esta empresa.</span>
            <button className="btn btn-ghost btn-sm" onClick={() => onStopSequence(false)}>Reactivar</button>
          </div>
        )}
        {seq.status === "completed" && <div className="note t-accent">Ya se enviaron los 3 mensajes de la secuencia. Podés reenviar cualquiera si querés retomar el contacto.</div>}
        {seq.status === "waiting" && <div className="note t-warn">El próximo paso (“{seq.step.label}”) está recomendado desde el {seq.dueDate.toLocaleDateString("es-AR")}. Podés enviarlo antes igual.</div>}

        <div>
          <span className="label">Paso de la secuencia</span>
          <div className="seg" style={{ width: "100%" }}>
            {WHATSAPP_SEQUENCE.map((s) => (
              <button key={s.key} style={{ flex: 1 }} className={stepKey === s.key ? "on" : ""} onClick={() => { setStepKey(s.key); setMessage(build(s.key)); }}>
                {s.label}{seq.step && seq.step.key === s.key && seq.status !== "stopped" ? " ★" : ""}
              </button>
            ))}
          </div>
        </div>
        <Field label="Número (formato internacional, solo dígitos)">
          <input className="input tnum" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ""))} placeholder="Ej: 5492611234567" />
        </Field>
        <Field label={`Mensaje · {Nombre} = “${nombre || "sin nombre"}”`}>
          <textarea className="textarea" rows={7} value={message} onChange={(e) => setMessage(e.target.value)} />
        </Field>
        <Btn
          variant="wa"
          icon={MessageCircle}
          style={{ width: "100%" }}
          disabled={!phone || sent || !waGate.puedeEnviar}
          onClick={() => {
            if (!phone || !waGate.puedeEnviar) return;
            window.open(buildWaLink(phone, message), "_blank");
            onSent(stepKey);
            setSent(true);
          }}
        >
          {sent ? "Abierto en WhatsApp ✓" : waGate.superoLimite ? "Límite diario alcanzado" : !waGate.puedeEnviar ? `Esperá ${Math.ceil(waGate.msRestantesCooldown / 1000)} s` : `Abrir WhatsApp (${WHATSAPP_SEQUENCE.find((s) => s.key === stepKey).label})`}
        </Btn>
        <Btn icon={Copy} style={{ width: "100%" }} onClick={async () => { if (await copiarTexto(message)) { setCopiado(true); setTimeout(() => setCopiado(false), 2500); } }}>
          {copiado ? "Copiado ✓" : "Copiar mensaje (para enviar a mano)"}
        </Btn>
        {sent && (
          <div className="muted" style={{ textAlign: "center", fontSize: 12.5 }}>
            Se registró el envío en el historial.{" "}
            {seq.status !== "stopped" && <button className="btn btn-ghost btn-sm" style={{ color: "var(--bad)" }} onClick={() => onStopSequence(true)}>Ya respondió · detener secuencia</button>}
          </div>
        )}
      </div>
    </Modal>
  );
}

function NewCompanyModal({ onClose, onSave }) {
  const [form, setForm] = useState({ empresa: "", cuit: "", contacto: "", telefono: "", mail: "", rubro: "", capitas: "", tier: "caliente", nota: "" });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  return (
    <Modal title="Nueva empresa" onClose={onClose}>
      <div className="stack">
        <Field label="Razón social *"><input className="input" autoFocus value={form.empresa} onChange={set("empresa")} /></Field>
        <div className="grid g2" style={{ gap: 10 }}>
          <Field label="CUIT"><input className="input" value={form.cuit} onChange={set("cuit")} placeholder="30-12345678-9" /></Field>
          <Field label="Rubro"><input className="input" value={form.rubro} onChange={set("rubro")} /></Field>
        </div>
        <Field label="Contacto"><input className="input" value={form.contacto} onChange={set("contacto")} placeholder="Nombre y apellido" /></Field>
        <div className="grid g2" style={{ gap: 10 }}>
          <Field label="Teléfono"><input className="input" value={form.telefono} onChange={set("telefono")} /></Field>
          <Field label="Mail"><input className="input" value={form.mail} onChange={set("mail")} /></Field>
        </div>
        <div className="grid g2" style={{ gap: 10 }}>
          <Field label="Cápitas estimadas"><input className="input" type="number" min="0" value={form.capitas} onChange={set("capitas")} /></Field>
          <Field label="Prioridad">
            <select className="select full" value={form.tier} onChange={set("tier")}>
              <option value="caliente">Caliente</option>
              <option value="tibio">Tibio</option>
            </select>
          </Field>
        </div>
        <Field label="Nota / origen del lead"><input className="input" value={form.nota} onChange={set("nota")} placeholder="Ej: referido por cliente X" /></Field>
        <Btn variant="primary" disabled={!form.empresa.trim()} style={{ width: "100%" }} onClick={() => onSave({ ...form, empresa: form.empresa.trim() })}>Guardar empresa</Btn>
      </div>
    </Modal>
  );
}

// ============================================================= Cotizador ===

function Cotizador({ companies, settings, presetCompanyId, guardarCotizacion, showToast, vars }) {
  const [cant, setCant] = useState({ "00-25": 0, "26-35": 0, "36-54": 0, "55-59": 0, "60+": 0, hijo1: 0, hijo2: 0 });
  const [descuento, setDescuento] = useState(settings.descuento);
  const [iva, setIva] = useState(0);
  const [planSel, setPlanSel] = useState("6500_PYME");
  const [companyId, setCompanyId] = useState(presetCompanyId || "");
  const [busca, setBusca] = useState("");
  const [moverPropuesta, setMoverPropuesta] = useState(true);
  const comp = companies.find((c) => c.id === companyId);

  useEffect(() => {
    if (presetCompanyId) setCompanyId(presetCompanyId);
  }, [presetCompanyId]);

  const res = PYME_PLANES.map((p) => {
    const r = cotizar(p, cant, descuento);
    const f = 1 + num(iva) / 100;
    return { plan: p, ...r, lista: r.lista * f, desc: r.desc * f, total: r.total * f, porCapita: r.porCapita * f };
  });
  const capitas = res[0].capitas;
  const sel = res.find((r) => r.plan.plan === planSel) || res[1];
  const nombre = comp ? capitalizar(getFirstName(comp.contacto)) : "";

  const texto = `Hola${nombre ? " " + nombre : ""}! Te paso la cotización de OMINT${comp ? ` para ${comp.empresa}` : ""}:

• Plan ${sel.plan.plan} (línea ${sel.plan.linea}) — ${capitas} cápitas
• Valor de lista: ${money(sel.lista)}/mes
• Descuento campaña ${descuento}%: −${money(sel.desc)}
• *Total mensual: ${money(sel.total)}* (≈ ${money(sel.porCapita)} por cápita)

Incluye farmacia ${sel.plan.farmacia}, óptica, ortodoncia sin límite de edad, check-up anual y asistencia al viajero ${sel.plan.modulo}.
${num(iva) ? `Valores con IVA ${iva}% incluido.` : "Valores sin IVA."} Sujeto a aprobación y vigencia de la campaña.

¿Coordinamos 15 minutos para revisarla juntos?
${vars.asesor} · OMINT`;

  const busqueda = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return [];
    return companies.filter((c) => c.empresa.toLowerCase().includes(q)).slice(0, 6);
  }, [busca, companies]);

  const setN = (k, v) => setCant((p) => ({ ...p, [k]: Math.max(0, Math.round(num(v))) }));
  const minPrecio = Math.min(...res.map((r) => r.total));

  return (
    <div className="stack">
      <PageHeader title="Cotizador PYME" subtitle="Precios de lista Mendoza · septiembre 2026 · escala 11 a 99 cápitas">
        <Btn icon={RefreshCw} onClick={() => setCant({ "00-25": 0, "26-35": 0, "36-54": 0, "55-59": 0, "60+": 0, hijo1: 0, hijo2: 0 })}>Limpiar</Btn>
      </PageHeader>

      <div className="grid g3">
        <Card title="Composición del grupo" icon={Users}>
          <div className="stack-sm">
            {FRANJAS.map((f) => (
              <div key={f.key} className="row between">
                <span className="ink2" style={{ fontSize: 13 }}>{f.label}</span>
                <div className="row" style={{ gap: 4 }}>
                  <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => setN(f.key, cant[f.key] - 1)} aria-label={`Restar ${f.label}`}>−</button>
                  <input className="input tnum" style={{ width: 56, textAlign: "center", padding: "5px 4px" }} type="number" min="0" value={cant[f.key]} onChange={(e) => setN(f.key, e.target.value)} aria-label={f.label} />
                  <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => setN(f.key, cant[f.key] + 1)} aria-label={`Sumar ${f.label}`}>+</button>
                </div>
              </div>
            ))}
          </div>
          <div className="divider" />
          <div className="grid g2" style={{ gap: 10 }}>
            <Field label="Descuento %"><input className="input tnum" type="number" min="0" max="100" value={descuento} onChange={(e) => setDescuento(num(e.target.value))} /></Field>
            <Field label="IVA % (lista sin IVA)"><input className="input tnum" type="number" min="0" value={iva} onChange={(e) => setIva(num(e.target.value))} /></Field>
          </div>
          <div className="row between" style={{ marginTop: 12 }}>
            <span style={{ fontWeight: 700 }}>Total cápitas</span>
            <span className="tnum" style={{ fontSize: 22, fontWeight: 800 }}>{capitas}</span>
          </div>
          {capitas > 0 && capitas < MIN_CAPITAS_PYME && <div className="note t-warn" style={{ marginTop: 8 }}>La línea PYME aplica desde {MIN_CAPITAS_PYME} cápitas. Sumá familiares de los titulares para calificar.</div>}
          {capitas > 99 && <div className="note t-info" style={{ marginTop: 8 }}>Más de 99 cápitas: verificá la escala con Producto (más de 200 tiene condiciones especiales).</div>}
        </Card>

        <div className="span2 stack">
          <div className="grid g3">
            {res.map((r) => {
              const on = planSel === r.plan.plan;
              return (
                <button
                  key={r.plan.plan}
                  className="card"
                  onClick={() => setPlanSel(r.plan.plan)}
                  style={{ padding: 16, textAlign: "left", cursor: "pointer", font: "inherit", color: "inherit", borderColor: on ? "var(--accent)" : "var(--border)", boxShadow: on ? "0 0 0 3px var(--accent-soft)" : "var(--shadow)" }}
                >
                  <div className="row between">
                    <span style={{ fontWeight: 800 }}>{r.plan.plan}</span>
                    {on ? <Chip tone="accent" icon={Check}>Elegido</Chip> : capitas > 0 && r.total === minPrecio ? <Chip tone="good">Más económico</Chip> : null}
                  </div>
                  <div className="muted" style={{ fontSize: 12 }}>Línea {r.plan.linea} · farmacia {r.plan.farmacia}</div>
                  <div className="tnum" style={{ fontSize: 24, fontWeight: 800, marginTop: 10 }}>{money(r.total)}</div>
                  <div className="muted" style={{ fontSize: 12 }}>por mes{capitas ? ` · ${money(r.porCapita)} por cápita` : ""}</div>
                  {r.desc > 0 && <div style={{ fontSize: 12, marginTop: 6, color: "var(--good)", fontWeight: 600 }}>Ahorro {money(r.desc)}/mes · lista {money(r.lista)}</div>}
                </button>
              );
            })}
          </div>

          <Card title="Propuesta para enviar" icon={FileText} action={<Btn size="sm" icon={Copy} disabled={!capitas} onClick={async () => showToast((await copiarTexto(texto)) ? "✓ Propuesta copiada" : "No se pudo copiar")}>Copiar</Btn>}>
            <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 13, margin: 0, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: 12, color: "var(--ink)" }}>
              {capitas ? texto : "Cargá la composición del grupo para generar la propuesta."}
            </pre>
            <div className="divider" />
            {comp ? (
              <div className="row wrap">
                <div className="tile row" style={{ gap: 8, flex: 1, minWidth: 220 }}>
                  <Building2 size={15} />
                  <span style={{ fontWeight: 700 }}>{comp.empresa}</span>
                  <StageChip stage={comp.stage} />
                  {!presetCompanyId && <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }} onClick={() => setCompanyId("")}>Cambiar</button>}
                </div>
                <label className="row ink2" style={{ gap: 6, fontSize: 12.5, cursor: "pointer" }}>
                  <input type="checkbox" checked={moverPropuesta} onChange={(e) => setMoverPropuesta(e.target.checked)} /> Pasar a “Propuesta Enviada”
                </label>
                {comp.telefono && (
                  <a className="btn btn-wa" href={buildWaLink(normalizePhoneAR(comp.telefono), texto)} target="_blank" rel="noreferrer" onClick={() => capitas && guardarCotizacion(comp.id, { plan: sel.plan.plan, capitas, total: sel.total, lista: sel.lista, descuento, detalle: cant }, moverPropuesta)}>
                    <MessageCircle size={15} /> Enviar y guardar
                  </a>
                )}
                <Btn variant="primary" icon={Save} disabled={!capitas} onClick={() => guardarCotizacion(comp.id, { plan: sel.plan.plan, capitas, total: sel.total, lista: sel.lista, descuento, detalle: cant }, moverPropuesta)}>
                  Guardar en la ficha
                </Btn>
              </div>
            ) : (
              <div>
                <span className="label">Asociar a una empresa para guardar la cotización</span>
                <SearchBox value={busca} onChange={setBusca} placeholder="Buscar empresa…" />
                <div className="stack-sm" style={{ marginTop: 6 }}>
                  {busqueda.map((c) => (
                    <button key={c.id} className="item" onClick={() => { setCompanyId(c.id); setBusca(""); }}>
                      <Building2 size={14} /> {c.empresa}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Card>
          <div className="note t-warn">Valores de referencia para la conversación de venta. Antes de confirmar un monto o cobertura puntual, verificá el cuadro oficial o el sistema.</div>
        </div>
      </div>
    </div>
  );
}
