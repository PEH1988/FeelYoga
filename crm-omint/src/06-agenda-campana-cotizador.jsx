
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
  const vacio = { "00-25": 0, "26-35": 0, "36-54": 0, "55-59": 0, "60+": 0, hijo1: 0, hijo2: 0 };
  const [cant, setCant] = useState(vacio);
  const [descuento, setDescuento] = useState(settings.descuento ?? CAMPANA.descuento);
  const [iva, setIva] = useState(0);
  const [planSel, setPlanSel] = useState("");
  const [verNoDisp, setVerNoDisp] = useState(false);
  const [companyId, setCompanyId] = useState(presetCompanyId || "");
  const [busca, setBusca] = useState("");
  const [moverPropuesta, setMoverPropuesta] = useState(true);
  const comp = companies.find((c) => c.id === companyId);
  const meses = settings.mesesCampana || CAMPANA.meses;
  const [provincia, setProvincia] = useState(settings.provincia || "Mendoza");
  const PLANES = planesDeProvincia(provincia);

  useEffect(() => {
    if (presetCompanyId) setCompanyId(presetCompanyId);
  }, [presetCompanyId]);

  const f = 1 + num(iva) / 100;
  const res = PLANES.map((p) => {
    const r = cotizar(p, cant, descuento);
    return { ...r, lista: r.lista * f, desc: r.desc * f, total: r.total * f, porCapita: r.porCapita * f };
  });
  const capitas = res.length ? res[0].capitas : 0;
  const tramo = res.length ? res[0].tramo : "1 a 10";
  const disponibles = res.filter((r) => r.disponible).sort((x, y) => x.total - y.total);
  const noDisponibles = res.filter((r) => !r.disponible);
  const sel = disponibles.find((r) => r.plan.plan === planSel) || disponibles[0] || null;
  const minPrecio = disponibles.length ? disponibles[0].total : 0;
  const nombre = comp ? capitalizar(getFirstName(comp.contacto)) : "";

  const beneficios = sel
    ? sel.plan.tipo === "PYME" && PYME_EXTRA[sel.plan.plan]
      ? [`Farmacia ${PYME_EXTRA[sel.plan.plan].farmacia}`, "Óptica, ortodoncia sin límite de edad y check-up anual", `Asistencia al viajero ${PYME_EXTRA[sel.plan.plan].modulo}`]
      : sel.plan.bullets.slice(0, 3)
    : [];
  const texto = sel
    ? `Hola${nombre ? " " + nombre : ""}! Te paso la cotización de OMINT${comp ? ` para ${comp.empresa}` : ""}:

• Plan ${sel.plan.plan} (línea ${sel.plan.linea}${sel.plan.tipo !== "Estándar" ? ` · ${sel.plan.tipo}` : ""}) — ${capitas} cápitas
• Valor de lista: ${money(sel.lista)}/mes
${num(descuento) ? `• Campaña: ${descuento}% de descuento durante ${meses} meses: −${money(sel.desc)}
` : ""}• *Total mensual: ${money(sel.total)}* (≈ ${money(sel.porCapita)} por cápita)
${num(descuento) ? `Desde el mes ${meses + 1} se aplica el valor de lista vigente.
` : ""}
${beneficios.map((b) => `✓ ${b}`).join("\n")}

${num(iva) ? `Valores con IVA ${iva}% incluido.` : "Valores sin IVA."} ${LISTA_PRECIOS} · ${provincia}. Sujeto a aprobación.

¿Coordinamos 15 minutos para revisarla juntos?
${vars.asesor} · OMINT`
    : "";

  const busqueda = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return [];
    return companies.filter((c) => c.empresa.toLowerCase().includes(q)).slice(0, 6);
  }, [busca, companies]);

  const setN = (k, v) => setCant((p) => ({ ...p, [k]: Math.max(0, Math.round(num(v))) }));
  const payload = () => ({ plan: sel.plan.plan, capitas, total: sel.total, lista: sel.lista, descuento, meses, detalle: cant });

  return (
    <div className="stack">
      <PageHeader title="Cotizador rápido" subtitle={`${LISTA_PRECIOS} · ${provincia}: ${PLANES.length} planes · campaña ${descuento}% por ${meses} meses`}>
        <select className="select" value={provincia} onChange={(e) => setProvincia(e.target.value)} aria-label="Provincia">
          {PROVINCIAS.map((p) => <option key={p}>{p}</option>)}
        </select>
        <Btn icon={RefreshCw} onClick={() => setCant(vacio)}>Limpiar</Btn>
      </PageHeader>

      <div className="grid g3">
        <Card title="Composición del grupo" icon={Users}>
          <div className="stack-sm">
            {FRANJAS.map((fr) => (
              <div key={fr.key} className="row between">
                <span className="ink2" style={{ fontSize: 13 }}>{fr.label}</span>
                <div className="row" style={{ gap: 4 }}>
                  <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => setN(fr.key, cant[fr.key] - 1)} aria-label={`Restar ${fr.label}`}>−</button>
                  <input className="input tnum" style={{ width: 56, textAlign: "center", padding: "5px 4px" }} type="number" min="0" value={cant[fr.key]} onChange={(e) => setN(fr.key, e.target.value)} aria-label={fr.label} />
                  <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => setN(fr.key, cant[fr.key] + 1)} aria-label={`Sumar ${fr.label}`}>+</button>
                </div>
              </div>
            ))}
          </div>
          <div className="muted" style={{ fontSize: 11.5, marginTop: 6 }}>Titulares incluye cónyuges, familiares a cargo e hijos de 25 años o más (según la lista).</div>
          <div className="divider" />
          <div className="grid g2" style={{ gap: 10 }}>
            <Field label={`Descuento % (${meses} meses)`}><input className="input tnum" type="number" min="0" max="100" value={descuento} onChange={(e) => setDescuento(num(e.target.value))} /></Field>
            <Field label="IVA % (lista sin IVA)"><input className="input tnum" type="number" min="0" value={iva} onChange={(e) => setIva(num(e.target.value))} /></Field>
          </div>
          <div className="row between" style={{ marginTop: 12 }}>
            <span style={{ fontWeight: 700 }}>Total cápitas</span>
            <span className="tnum" style={{ fontSize: 22, fontWeight: 800 }}>{capitas}</span>
          </div>
          {capitas > 0 && <div className="muted" style={{ fontSize: 12, textAlign: "right" }}>Tramo {tramo} cápitas</div>}
          {capitas >= 200 && <div className="note t-warn" style={{ marginTop: 8 }}>Desde 200 cápitas los valores se consultan con Producto.</div>}
        </Card>

        <div className="span2 stack">
          <Card
            title={capitas ? `${disponibles.length} planes disponibles para ${capitas} cápitas` : "Planes"}
            icon={Stethoscope}
            pad={false}
            action={noDisponibles.length > 0 && capitas > 0 && <button className="btn btn-ghost btn-sm" onClick={() => setVerNoDisp((v) => !v)}>{verNoDisp ? "Ocultar" : "Ver"} no disponibles ({noDisponibles.length})</button>}
          >
            {!capitas ? (
              <EmptyNote>{PLANES.length ? `Cargá la composición del grupo para ver los ${PLANES.length} planes de ${provincia}.` : "No hay lista de precios cargada en este archivo."}</EmptyNote>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="tbl">
                  <thead>
                    <tr><th></th><th>Plan</th><th>Línea</th><th style={{ textAlign: "right" }}>Lista</th><th style={{ textAlign: "right" }}>Con {descuento}%</th><th style={{ textAlign: "right" }}>Por cápita</th></tr>
                  </thead>
                  <tbody>
                    {disponibles.map((r) => {
                      const on = sel && sel.plan.plan === r.plan.plan;
                      return (
                        <tr key={r.plan.plan} className="click" onClick={() => setPlanSel(r.plan.plan)} style={{ background: on ? "var(--accent-soft)" : undefined }}>
                          <td style={{ width: 28 }}><input type="radio" checked={!!on} onChange={() => setPlanSel(r.plan.plan)} aria-label={`Elegir ${r.plan.plan}`} /></td>
                          <td className="strong">
                            {r.plan.plan} {r.total === minPrecio && <Chip tone="good">Más económico</Chip>}
                          </td>
                          <td>{r.plan.linea}{r.plan.tipo !== "Estándar" ? <span className="muted"> · {r.plan.tipo}</span> : ""}</td>
                          <td className="tnum" style={{ textAlign: "right", textDecoration: r.desc > 0 ? "line-through" : "none" }}>{money(r.lista)}</td>
                          <td className="tnum strong" style={{ textAlign: "right" }}>{money(r.total)}</td>
                          <td className="tnum" style={{ textAlign: "right" }}>{money(r.porCapita)}</td>
                        </tr>
                      );
                    })}
                    {verNoDisp &&
                      noDisponibles.map((r) => (
                        <tr key={r.plan.plan} style={{ opacity: 0.6 }}>
                          <td></td>
                          <td>{r.plan.plan}</td>
                          <td>{r.plan.linea}{r.plan.tipo !== "Estándar" ? ` · ${r.plan.tipo}` : ""}</td>
                          <td colSpan={3} style={{ textAlign: "right" }}>{r.motivo}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {disponibles.length === 0 && <EmptyNote>Ningún plan de la lista aplica para {capitas} cápitas. {noDisponibles[0]?.motivo}</EmptyNote>}
              </div>
            )}
          </Card>

          <Card title="Propuesta para enviar" icon={FileText} action={<Btn size="sm" icon={Copy} disabled={!sel} onClick={async () => showToast((await copiarTexto(texto)) ? "✓ Propuesta copiada" : "No se pudo copiar")}>Copiar</Btn>}>
            <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 13, margin: 0, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: 12, color: "var(--ink)" }}>
              {sel ? texto : "Cargá la composición del grupo y elegí un plan para generar la propuesta."}
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
                {comp.telefono && sel && (
                  <a className="btn btn-wa" href={buildWaLink(normalizePhoneAR(comp.telefono), texto)} target="_blank" rel="noreferrer" onClick={() => guardarCotizacion(comp.id, payload(), moverPropuesta)}>
                    <MessageCircle size={15} /> Enviar y guardar
                  </a>
                )}
                <Btn variant="primary" icon={Save} disabled={!sel} onClick={() => guardarCotizacion(comp.id, payload(), moverPropuesta)}>
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

// ============================================= Cotizador oficial (web) ===

// "Apellido, Nombre" -> "Nombre Apellido" para encabezar la cotización.
function nombreLegible(n) {
  const s = (n || "").trim();
  if (!s.includes(",")) return s;
  const [ap, no] = s.split(",");
  return `${(no || "").trim()} ${ap.trim()}`.trim();
}

function CotizadorView(props) {
  const modo = props.vista || (HOSTED ? "oficial" : "rapido");
  const setModo = props.setVista || (() => {});
  const presetCompanyId = props.preset && props.preset.tipo === "empresa" ? props.preset.id : null;
  if (!HOSTED) return <Cotizador {...props} presetCompanyId={presetCompanyId} />;
  const n = props.cotSync ? props.cotSync.pendientes.length : 0;
  return (
    <div className="stack">
      <div className="seg">
        <button className={modo === "oficial" ? "on" : ""} onClick={() => setModo("oficial")}>Cotizador Omint</button>
        <button className={modo === "pendientes" ? "on" : ""} onClick={() => setModo("pendientes")}>
          Por vincular{n ? ` (${n})` : ""}
        </button>
        <button className={modo === "rapido" ? "on" : ""} onClick={() => setModo("rapido")}>Cálculo rápido PYME</button>
      </div>
      {modo === "oficial" && <CotizadorOficial {...props} />}
      {modo === "pendientes" && <CotizacionesPorVincular {...props} />}
      {modo === "rapido" && <Cotizador {...props} presetCompanyId={presetCompanyId} />}
    </div>
  );
}

// Cotizaciones hechas con tu usuario en el Cotizador Omint que todavía no están
// en ninguna ficha. Las que coinciden con una sola ficha se guardan solas.
function CotizacionesPorVincular({ cotSync, sincronizarCotizador, conectarCotizador, vincularCotizacion, crearDesdeCotizacion, ignorarCotizacion, companies, personas, cotBase, detectarCotizador }) {
  const [u, setU] = useState("");
  const [c, setC] = useState("");
  const [err, setErr] = useState("");
  const [conectando, setConectando] = useState(false);
  const [buscando, setBuscando] = useState(null); // id de la cotización en la que se busca ficha
  const [q, setQ] = useState("");
  const est = cotSync.estado;
  // Al abrir la bandeja: si ya hay sesión del cotizador en este navegador, sincroniza.
  useEffect(() => {
    let hay = false;
    try {
      hay = !!localStorage.getItem("cot_omint_token");
    } catch (e) {
      hay = false;
    }
    if (hay && (est === "desconectado" || est === "inicial")) sincronizarCotizador();
  }, []);

  const resultados = useMemo(() => {
    const t = stripAccents(q.trim().toLowerCase());
    if (t.length < 2 || !buscando) return [];
    const m = (s) => stripAccents((s || "").toLowerCase()).includes(t);
    const cot = cotSync.pendientes.find((x) => x.id === buscando);
    const empresas = companies.filter((x) => m(x.empresa) || m(x.nombreFantasia) || (x.cuit || "").includes(t)).slice(0, 6).map((x) => ({ tipo: "empresa", id: x.id, label: x.empresa, hint: STAGE_BY_KEY[x.stage]?.label }));
    const pers = personas.filter((x) => m(x.nombre) || (x.telefono || "").includes(t)).slice(0, 6).map((x) => ({ tipo: "persona", id: x.id, label: x.nombre, hint: x.obraSocial || "Paciente" }));
    return cot && cot.tipo === "empresa" ? [...empresas, ...pers] : [...pers, ...empresas];
  }, [q, buscando, companies, personas, cotSync.pendientes]);

  if (est === "no-encontrado" || (cotBase && cotBase.estado === "no")) {
    return (
      <CotizadorNoEncontrado
        cotBase={cotBase}
        detectarCotizador={async (u) => {
          if (await detectarCotizador(u)) sincronizarCotizador(true);
        }}
      />
    );
  }

  if (est === "desconectado" || est === "inicial") {
    return (
      <Card title="Conectar con el Cotizador Omint" icon={Link2}>
        <div className="stack" style={{ maxWidth: 460 }}>
          <div className="muted">
            Conectá tu usuario del cotizador una sola vez: el CRM trae solas las cotizaciones que hagas (también desde el celular o fuera del CRM) y las guarda en la ficha de cada cliente para que le hagas seguimiento.
          </div>
          <form
            className="stack"
            onSubmit={async (e) => {
              e.preventDefault();
              setConectando(true);
              setErr("");
              try {
                await conectarCotizador(u, c);
              } catch (ex) {
                setErr(ex.message);
              }
              setConectando(false);
            }}
          >
            <div className="grid g2" style={{ gap: 10 }}>
              <Field label="Usuario del cotizador"><input className="input" value={u} onChange={(e) => setU(e.target.value)} autoComplete="username" /></Field>
              <Field label="Contraseña"><input className="input" type="password" value={c} onChange={(e) => setC(e.target.value)} autoComplete="current-password" /></Field>
            </div>
            {err && <div className="note t-bad">{err}</div>}
            <Btn variant="primary" icon={Link2} type="submit" disabled={!u || !c || conectando}>{conectando ? "Conectando…" : "Conectar"}</Btn>
          </form>
        </div>
      </Card>
    );
  }

  return (
    <div className="stack">
      <div className="row between wrap">
        <div>
          <h1>Cotizaciones por vincular</h1>
          <div className="sub">
            Hechas con tu usuario en el Cotizador Omint y sin ficha en el CRM. Las que coinciden con una sola empresa o paciente se guardan solas.
            {cotSync.ultima && ` · Revisado ${cotSync.ultima.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`}
          </div>
        </div>
        <Btn icon={RefreshCw} onClick={() => sincronizarCotizador(true)} disabled={est === "sincronizando"}>{est === "sincronizando" ? "Revisando…" : "Revisar ahora"}</Btn>
      </div>
      {est === "error" && <div className="note t-bad">No se pudo conectar con el cotizador: {cotSync.error}</div>}
      {cotSync.pendientes.length === 0 ? (
        <Card><EmptyNote>✓ No hay cotizaciones pendientes. Todo lo que cotizás queda en las fichas.</EmptyNote></Card>
      ) : (
        <div className="stack-sm">
          {cotSync.pendientes.map((x) => {
            const min = Math.min(...x.planes.map((p) => p.aPagar));
            return (
              <div key={x.id} className="card" style={{ padding: 14 }}>
                <div className="row between wrap" style={{ alignItems: "flex-start", gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div className="row wrap" style={{ gap: 6 }}>
                      <span style={{ fontWeight: 800, fontSize: 15 }}>{x.cliente || "Sin nombre"}</span>
                      <Chip tone={x.tipo === "empresa" ? "info" : "accent"}>{x.tipo === "empresa" ? `Empresa · ${x.capitas} cápitas` : "Particular"}</Chip>
                      {x.via === "whatsapp" && <Chip tone="good">Enviada por WhatsApp</Chip>}
                    </div>
                    <div className="muted" style={{ fontSize: 12.5, marginTop: 3 }}>
                      {fmtFecha(isoLocal(new Date(x.fecha)), { day: "2-digit", month: "short" })} · {x.provincia}
                      {x.telefono ? ` · ${x.telefono}` : ""} · {x.planes.map((p) => p.nombre.replace("Plan ", "")).join(", ")} · desde {money(min)}/mes
                    </div>
                    {x.sugeridas && x.sugeridas.length > 1 && <div style={{ fontSize: 12.5, marginTop: 4 }}>Coincide con {x.sugeridas.length} fichas: elegí cuál.</div>}
                  </div>
                  <div className="row wrap" style={{ gap: 6 }}>
                    {(x.sugeridas || []).slice(0, 3).map((s) => (
                      <Btn key={s.id} size="sm" variant="soft" icon={Check} onClick={() => vincularCotizacion(x, s)}>{s.label.length > 28 ? s.label.slice(0, 28) + "…" : s.label}</Btn>
                    ))}
                    <Btn size="sm" variant="primary" icon={Plus} onClick={() => crearDesdeCotizacion(x)}>{x.tipo === "empresa" ? "Crear empresa" : "Crear paciente"}</Btn>
                    <Btn size="sm" icon={Search} onClick={() => { setBuscando(buscando === x.id ? null : x.id); setQ(""); }}>Buscar ficha</Btn>
                    <Btn size="sm" variant="ghost" onClick={() => ignorarCotizacion(x)}>Ignorar</Btn>
                  </div>
                </div>
                {buscando === x.id && (
                  <div style={{ marginTop: 10 }}>
                    <SearchBox value={q} onChange={setQ} placeholder="Empresa, paciente, CUIT o teléfono…" />
                    <div className="stack-sm" style={{ marginTop: 6 }}>
                      {resultados.map((r) => (
                        <button key={r.tipo + r.id} className="item" onClick={() => { vincularCotizacion(x, r); setBuscando(null); }}>
                          {r.tipo === "empresa" ? <Building2 size={14} /> : <Users size={14} />}
                          <span style={{ fontWeight: 600 }}>{r.label}</span>
                          <span className="muted" style={{ fontSize: 12 }}>{r.hint}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <div className="muted" style={{ fontSize: 12 }}>Al vincular o crear, la cotización queda en la ficha y en su historial, la empresa pasa a “Propuesta Enviada” y se agenda “Seguimiento de cotización” a 2 días (si no tenía otra próxima acción).</div>
    </div>
  );
}

function CotizadorOficial({ companies, personas, preset, registrarCotizacion, showToast, settings, cotBase, detectarCotizador }) {
  const baseUrl = (cotBase && cotBase.url) || (settings && settings.cotizadorUrl) || "../cotizador/";
  const origenCotizador = (() => {
    try {
      return new URL(baseUrl, window.location.href).origin;
    } catch (e) {
      return window.location.origin;
    }
  })();
  const [link, setLink] = useState(preset || null);
  const [busca, setBusca] = useState("");
  const [mover, setMover] = useState(true);
  const [pendiente, setPendiente] = useState(null);
  const [registradas, setRegistradas] = useState([]);
  useEffect(() => {
    if (preset) setLink(preset);
  }, [preset]);

  const linkRef = useRef(link);
  linkRef.current = link;
  const moverRef = useRef(mover);
  moverRef.current = mover;

  // El cotizador avisa (postMessage, mismo dominio) cada vez que genera un PDF.
  useEffect(() => {
    const h = (e) => {
      if (e.origin !== origenCotizador) return;
      const d = e.data;
      if (!d || d.fuente !== "cotizador-omint" || !Array.isArray(d.datos && d.datos.planes)) return;
      const l = linkRef.current;
      if (l) {
        registrarCotizacion(l, d, moverRef.current);
        setRegistradas((r) => [{ ...d, label: l.label }, ...r].slice(0, 10));
      } else {
        setPendiente(d);
        showToast("Cotización generada. Vinculala a una empresa o paciente para guardarla en su ficha.");
      }
    };
    window.addEventListener("message", h);
    return () => window.removeEventListener("message", h);
  }, [registrarCotizacion, showToast]);

  const ent = link ? (link.tipo === "empresa" ? companies.find((c) => c.id === link.id) : personas.find((p) => p.id === link.id)) : null;
  const src = useMemo(() => {
    const q = new URLSearchParams({ embed: "crm", provincia: (settings && settings.provincia) || "Mendoza" });
    if (link) {
      q.set("modo", link.tipo === "empresa" ? "empresas" : "particular");
      q.set("nombre", link.label);
      const ent = link.tipo === "empresa" ? companies.find((c) => c.id === link.id) : personas.find((p) => p.id === link.id);
      if (ent && ent.telefono) q.set("tel", ent.telefono);
    }
    q.set("origen", window.location.origin);
    return `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}${q.toString()}`;
  }, [link && link.tipo, link && link.id, baseUrl]);

  const resultados = useMemo(() => {
    const t = stripAccents(busca.trim().toLowerCase());
    if (t.length < 2) return [];
    const m = (s) => stripAccents((s || "").toLowerCase()).includes(t);
    return [
      ...companies.filter((c) => m(c.empresa) || m(c.contacto) || (c.cuit || "").includes(t)).slice(0, 5).map((c) => ({ tipo: "empresa", id: c.id, label: c.empresa, hint: STAGE_BY_KEY[c.stage]?.label })),
      ...personas.filter((p) => m(p.nombre) || (p.telefono || "").includes(t)).slice(0, 5).map((p) => ({ tipo: "persona", id: p.id, label: nombreLegible(p.nombre), hint: p.obraSocial || "Paciente" })),
    ];
  }, [busca, companies, personas]);

  const resumenPlanes = (d) => d.datos.planes.map((p) => `${p.plan.replace("Plan ", "")} ${money(p.aPagar)}`).join(" · ");

  if (cotBase && cotBase.estado !== "ok") return <CotizadorNoEncontrado cotBase={cotBase} detectarCotizador={detectarCotizador} />;

  return (
    <div className="stack">
      <Card title="Cotizando para" icon={Calculator}>
        <div className="row wrap" style={{ gap: 10 }}>
          {link ? (
            <div className="tile row" style={{ gap: 8, flex: 1, minWidth: 260 }}>
              {link.tipo === "empresa" ? <Building2 size={15} /> : <Users size={15} />}
              <span style={{ fontWeight: 700 }}>{link.label}</span>
              {ent && link.tipo === "empresa" && <StageChip stage={ent.stage} />}
              {ent && link.tipo === "persona" && <Chip>{PERSONA_STATUS.find((s) => s.key === ent.status)?.label}</Chip>}
              <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }} onClick={() => setLink(null)}>Cambiar</button>
            </div>
          ) : (
            <div style={{ flex: 1, minWidth: 260 }}>
              <SearchBox value={busca} onChange={setBusca} placeholder="Buscá la empresa o el paciente a cotizar…" />
              <div className="stack-sm" style={{ marginTop: 6 }}>
                {resultados.map((r) => (
                  <button key={r.tipo + r.id} className="item" onClick={() => { setLink({ tipo: r.tipo, id: r.id, label: r.label }); setBusca(""); }}>
                    {r.tipo === "empresa" ? <Building2 size={14} /> : <Users size={14} />}
                    <span style={{ fontWeight: 600 }}>{r.label}</span>
                    <span className="muted" style={{ fontSize: 12 }}>{r.hint}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {link && link.tipo === "empresa" && (
            <label className="row ink2" style={{ gap: 6, fontSize: 12.5, cursor: "pointer" }}>
              <input type="checkbox" checked={mover} onChange={(e) => setMover(e.target.checked)} /> Pasar a “Propuesta Enviada”
            </label>
          )}
          <a className="btn btn-outline btn-sm" href={src} target="_blank" rel="noreferrer" title="En una pestaña aparte las cotizaciones no se registran en el CRM">
            Abrir en pestaña nueva
          </a>
        </div>
        <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
          Cotizá y generá el PDF como siempre: cada PDF que generes se guarda solo en la ficha vinculada (planes, valores y cápitas) y queda en su historial como propuesta.
        </div>
        {pendiente && link && (
          <div className="note t-warn row between wrap" style={{ marginTop: 10, gap: 8 }}>
            <span>Hay una cotización sin guardar: {resumenPlanes(pendiente)}</span>
            <Btn size="sm" variant="primary" onClick={() => { registrarCotizacion(link, pendiente, mover); setRegistradas((r) => [{ ...pendiente, label: link.label }, ...r]); setPendiente(null); }}>
              Guardar en {link.label}
            </Btn>
          </div>
        )}
        {registradas.length > 0 && (
          <div className="stack-sm" style={{ marginTop: 10 }}>
            {registradas.map((r, i) => (
              <div key={i} className="note t-good">✓ Guardada en {r.label}: {resumenPlanes(r)}</div>
            ))}
          </div>
        )}
      </Card>
      <iframe
        key={src}
        src={src}
        title="Cotizador Omint"
        style={{ width: "100%", height: "calc(100vh - 150px)", minHeight: 640, border: "1px solid var(--border)", borderRadius: 16, background: "#fff" }}
      />
    </div>
  );
}

// Historial de cotizaciones de una empresa o paciente.
function CotizacionesList({ items }) {
  if (!items || !items.length) return null;
  return (
    <div>
      <div className="label">Cotizaciones ({items.length})</div>
      <div className="stack-sm">
        {items.slice(0, 8).map((c) => (
          <div key={c.id} className="tile" style={{ fontSize: 12.5 }}>
            <div className="row between">
              <span style={{ fontWeight: 700 }}>{fmtFecha(c.fecha, { day: "2-digit", month: "short", year: "numeric" })}</span>
              <span className="muted">
                {c.origen === "rapido" ? "Cálculo rápido" : c.tipo === "empresa" ? "Empresa · nómina" : "Particular"}
                {c.capitas ? ` · ${c.capitas} cápitas` : ""}
              </span>
            </div>
            {c.planes.map((p) => (
              <div key={p.plan} className="row between tnum" style={{ marginTop: 3 }}>
                <span>{p.plan.replace("Plan ", "")}</span>
                <span>
                  <span className="muted" style={{ textDecoration: p.bonificado < p.lista ? "line-through" : "none" }}>{money(p.lista)}</span>{" "}
                  <strong>{money(p.aPagar)}</strong>/mes
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Cuando el CRM no encuentra el cotizador: qué probó y cómo resolverlo.
function CotizadorNoEncontrado({ cotBase, detectarCotizador }) {
  const [url, setUrl] = useState("");
  if (cotBase.estado === "buscando") {
    return (
      <Card>
        <EmptyNote>
          <RefreshCw size={16} className="spin" style={{ verticalAlign: -3, marginRight: 6 }} />
          Buscando el Cotizador Omint…
        </EmptyNote>
      </Card>
    );
  }
  return (
    <Card title="No encuentro el Cotizador Omint" icon={AlertTriangle}>
      <div className="stack">
        <div className="ink2">
          El CRM abre el cotizador que instalaste en tu hosting (la carpeta <strong>cotizador</strong> del paquete). Probé estas direcciones y en ninguna está:
        </div>
        <div className="tile" style={{ fontSize: 12.5 }}>
          {cotBase.probados.map((p) => (
            <div key={p.url} className="row between wrap" style={{ padding: "3px 0" }}>
              <code style={{ wordBreak: "break-all" }}>{p.url}</code>
              <span className="muted">{p.resultado}</span>
            </div>
          ))}
        </div>
        <div className="note t-info" style={{ lineHeight: 1.6 }}>
          <strong>Cómo resolverlo:</strong>
          <br />1. Abrí en otra pestaña la dirección donde entrás al cotizador nuevo (la pantalla azul de “Cotizador comercial”) y copiala.
          <br />2. Pegala acá abajo y tocá <strong>Probar</strong>. Queda guardada.
          <br />Si no lo subiste todavía: en Hostinger, subí el contenido de la carpeta <strong>cotizador</strong> del paquete a <code>public_html/cotizador</code>.
        </div>
        <div className="row" style={{ gap: 8 }}>
          <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://tu-dominio.com/cotizador/" />
          <Btn variant="primary" disabled={!url.trim()} onClick={() => detectarCotizador(url.trim())}>Probar</Btn>
          <Btn icon={RefreshCw} onClick={() => detectarCotizador()}>Buscar de nuevo</Btn>
        </div>
      </div>
    </Card>
  );
}
