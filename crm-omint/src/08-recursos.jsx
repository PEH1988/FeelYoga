
// ================================================= Producto y objeciones ===

function ProductoReferencia({ go }) {
  const [abierta, setAbierta] = useState(0);
  const [tramo, setTramo] = useState("11 a 99");
  const [linea, setLinea] = useState("todas");
  const lineas = ["Génesis", "Global", "Clásico", "Premium"];
  const planesVista = PLANES_EMPRESA.filter((p) => linea === "todas" || p.linea === linea);
  const COLS = ["00-25", "26-35", "36-54", "55-59", "60+", "hijo1", "hijo2"];
  return (
    <div className="stack">
      <PageHeader title="Producto y objeciones" subtitle={`${LISTA_PRECIOS} · ${PLANES_EMPRESA.length} planes · campaña ${CAMPANA.descuento}% por ${CAMPANA.meses} meses`}>
        <Btn variant="primary" icon={Calculator} onClick={() => go("cotizador")}>Abrir cotizador</Btn>
      </PageHeader>

      <Card
        title="Precios de lista por cápita (sin IVA)"
        icon={FileText}
        pad={false}
        action={
          <div className="row wrap" style={{ gap: 6 }}>
            <div className="seg">
              {TRAMOS.map((t) => (
                <button key={t.key} className={tramo === t.key ? "on" : ""} onClick={() => setTramo(t.key)}>{t.key}</button>
              ))}
            </div>
            <select className="select" value={linea} onChange={(e) => setLinea(e.target.value)} aria-label="Línea">
              <option value="todas">Todas las líneas</option>
              {lineas.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        }
      >
        <div style={{ overflowX: "auto", padding: "8px 0 0" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Plan</th>
                <th>Línea</th>
                {["0–25", "26–35", "36–54", "55–59", "60+", "Hijo 1", "Hijo 2+"].map((h) => <th key={h} style={{ textAlign: "right" }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {planesVista.map((p) => {
                const t = p.tarifas[tramo];
                const fueraB = p.tipo === "Plan B" && TRAMOS.find((x) => x.key === tramo).min > MAX_CAPITAS_PLAN_B;
                return (
                  <tr key={p.plan}>
                    <td className="strong">{p.plan}</td>
                    <td>{p.linea}{p.tipo !== "Estándar" ? <span className="muted"> · {p.tipo}</span> : ""}</td>
                    {t && !fueraB ? (
                      COLS.map((k) => <td key={k} className="tnum" style={{ textAlign: "right" }}>{money(t[k])}</td>)
                    ) : (
                      <td colSpan={7} className="muted" style={{ textAlign: "right" }}>
                        {fueraB ? `Solo hasta ${MAX_CAPITAS_PLAN_B} cápitas` : tramo === "200 a 499" ? "Consultar con Producto" : p.tipo === "PYME" ? `Desde ${MIN_CAPITAS_PYME} cápitas` : "No se vende en este tramo"}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="muted" style={{ fontSize: 12, padding: "10px 18px 14px", lineHeight: 1.5 }}>
          Adulto / cónyuge / familiar a cargo / hijo de 25 o más se cotizan por franja de edad; hijos menores de 25 como Hijo 1 e Hijo 2 o +. Planes B: exclusivos para empresas PYME, holdings de hasta {MAX_CAPITAS_PLAN_B} cápitas, precio único. Los precios no incluyen IVA (aplicable solo a socios directos).
        </div>
      </Card>

      <div className="grid g3">
        {planesVista.map((p) => (
          <Card key={p.plan} title={p.plan} icon={Stethoscope} action={<Chip tone={p.tipo === "PYME" ? "info" : p.tipo === "Plan B" ? "warn" : "accent"}>{p.linea}{p.tipo !== "Estándar" ? ` · ${p.tipo}` : ""}</Chip>}>
            <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6, color: "var(--ink-2)", fontSize: 13 }}>
              {p.tipo === "PYME" && PYME_EXTRA[p.plan] ? (
                <>
                  <li>Farmacia {PYME_EXTRA[p.plan].farmacia}</li>
                  <li>Asistencia al viajero {PYME_EXTRA[p.plan].modulo}</li>
                  <li>Óptica (1 caso/año), ortodoncia sin límite de edad y check-up anual</li>
                  <li>Desde {MIN_CAPITAS_PYME} cápitas · solo empresas nuevas</li>
                </>
              ) : (
                p.bullets.map((b) => <li key={b}>{b}</li>)
              )}
            </ul>
          </Card>
        ))}
      </div>

      <div className="grid g2">
        <Card title="Requisitos para ofrecer PYME" icon={ClipboardList}>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7, color: "var(--ink-2)" }}>
            <li>Solo para captación de empresas <strong>nuevas</strong> (CUIT nuevo para Omint).</li>
            <li>Desde <strong>11 cápitas</strong> en adelante (no hay escala PYME de 1 a 10).</li>
            <li>No disponible para “1er renglón de empresas”.</li>
            <li>Reemplazan a 4500_24/4500_23C, 6500_21C/22C y 8500_21/22 cuando corresponda.</li>
            <li>Aplican a la campaña de descuento vigente.</li>
          </ul>
        </Card>
        <Card title="Preguntas de calificación" icon={Target}>
          <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7, color: "var(--ink-2)" }}>
            <li>¿Cuántos empleados son y cuántos tienen grupo familiar a cargo?</li>
            <li>¿Qué cobertura tienen hoy y qué les gustaría mejorar?</li>
            <li>¿Quién decide y quién más participa (dueño, RRHH, contador)?</li>
            <li>¿La empresa paga el plan o lo cubre cada empleado con sus aportes?</li>
            <li>¿Para cuándo necesitan tenerlo resuelto?</li>
          </ol>
        </Card>
      </div>

      <Card title="Manejo de objeciones" icon={Sparkles}>
        <div className="stack-sm">
          {OBJECIONES.map((o, i) => (
            <div key={i} className="tile" style={{ padding: 0 }}>
              <button onClick={() => setAbierta(abierta === i ? -1 : i)} className="row between" style={{ width: "100%", padding: "10px 12px", background: "none", border: 0, cursor: "pointer", font: "inherit", color: "var(--ink)", fontWeight: 700 }} aria-expanded={abierta === i}>
                {o.q}
                <ChevronRight size={15} style={{ transform: abierta === i ? "rotate(90deg)" : "none", transition: "transform .15s" }} />
              </button>
              {abierta === i && <div style={{ padding: "0 12px 12px", color: "var(--ink-2)", lineHeight: 1.55 }}>{o.a}</div>}
            </div>
          ))}
        </div>
      </Card>

      <div className="note t-warn">
        Valores de referencia rápida para la conversación de venta. Antes de confirmar un monto o cobertura puntual, verificá el cuadro de beneficios oficial o el sistema: algunos PDFs de julio mostraron columnas corridas en filas específicas (ej. Cirugía cardiovascular / Honorarios cesárea en 4500 y 6500 PYME).
      </div>
    </div>
  );
}

// ============================================================= Contenido ===

function ContenidoPlanner({ contenido, addContenido, updateContenido, deleteContenido, askConfirm }) {
  const [showNew, setShowNew] = useState(false);
  const [filtro, setFiltro] = useState("todos");
  const vacio = { plataforma: "instagram", titulo: "", texto: "", fecha: "", nota: "" };
  const [form, setForm] = useState(vacio);
  const lista = contenido
    .filter((c) => filtro === "todos" || c.status === filtro)
    .sort((a, b) => (a.fecha || "9999").localeCompare(b.fecha || "9999"));

  return (
    <div className="stack">
      <PageHeader title="Planificador de contenido" subtitle="Instagram y estados de WhatsApp: organizá ideas y textos; publicás vos desde cada app.">
        <div className="seg">
          <button className={filtro === "todos" ? "on" : ""} onClick={() => setFiltro("todos")}>Todos</button>
          {CONTENIDO_STATUS.map((s) => (
            <button key={s.key} className={filtro === s.key ? "on" : ""} onClick={() => setFiltro(s.key)}>
              {s.label} ({contenido.filter((c) => c.status === s.key).length})
            </button>
          ))}
        </div>
        <Btn variant="primary" icon={Plus} onClick={() => setShowNew(true)}>Nueva idea</Btn>
      </PageHeader>

      {lista.length === 0 && <Card><EmptyNote>No hay contenido en esta vista.</EmptyNote></Card>}
      <div className="grid g2">
        {lista.map((c) => (
          <div key={c.id} className="card" style={{ padding: 16 }}>
            <div className="row between">
              <span className="row" style={{ gap: 8, fontWeight: 700 }}>
                {c.plataforma === "instagram" ? <Instagram size={16} color="var(--bad)" /> : <MessageCircle size={16} color="var(--wa)" />}
                {c.titulo}
              </span>
              <div className="row" style={{ gap: 6 }}>
                <select className="select" style={{ padding: "4px 24px 4px 8px", fontSize: 12 }} value={c.status} onChange={(e) => updateContenido(c.id, { status: e.target.value })}>
                  {CONTENIDO_STATUS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
                <button className="icon-btn" title="Copiar texto" onClick={() => copiarTexto(c.texto)}><Copy size={13} /></button>
                <button className="icon-btn" title="Eliminar" onClick={() => askConfirm("¿Eliminar esta idea de contenido?", () => deleteContenido(c.id))}><Trash2 size={13} /></button>
              </div>
            </div>
            <textarea key={c.id + "t"} className="textarea" style={{ marginTop: 10 }} defaultValue={c.texto} onBlur={(e) => updateContenido(c.id, { texto: e.target.value })} rows={5} />
            {c.nota && <div className="note t-accent" style={{ marginTop: 8 }}>💡 {c.nota}</div>}
            <div className="row" style={{ marginTop: 8, gap: 8 }}>
              <CalIcon size={13} className="muted" />
              <input type="date" className="input" style={{ width: 160, padding: "4px 8px" }} defaultValue={c.fecha} onBlur={(e) => updateContenido(c.id, { fecha: e.target.value })} />
              <span className="muted" style={{ fontSize: 12 }}>fecha de publicación</span>
            </div>
          </div>
        ))}
      </div>

      {showNew && (
        <Modal title="Nueva idea de contenido" onClose={() => setShowNew(false)}>
          <div className="stack">
            <Field label="Plataforma">
              <select className="select full" value={form.plataforma} onChange={(e) => setForm({ ...form, plataforma: e.target.value })}>
                <option value="instagram">Instagram</option>
                <option value="whatsapp">WhatsApp (estado/difusión)</option>
              </select>
            </Field>
            <Field label="Título / tema"><input className="input" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} /></Field>
            <Field label="Texto / caption"><textarea className="textarea" rows={5} value={form.texto} onChange={(e) => setForm({ ...form, texto: e.target.value })} /></Field>
            <Field label="Fecha planificada"><input type="date" className="input" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} /></Field>
            <Btn variant="primary" disabled={!form.titulo.trim()} style={{ width: "100%" }} onClick={() => { addContenido(form); setShowNew(false); setForm(vacio); }}>Guardar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// =============================================================== Ajustes ===

function SettingsModal({ settings, onClose, onSave }) {
  const [s, setS] = useState(settings);
  const setObj = (k, v) => setS({ ...s, objetivos: { ...s.objetivos, [k]: Math.max(0, Math.round(num(v))) } });
  return (
    <Modal title="Ajustes" onClose={onClose}>
      <div className="stack">
        <Field label="Tu nombre (se usa en los mensajes de WhatsApp y cotizaciones)"><input className="input" value={s.asesor} onChange={(e) => setS({ ...s, asesor: e.target.value })} /></Field>
        <div className="grid g2" style={{ gap: 10 }}>
          <Field label="Meta mensual (cápitas)"><input className="input tnum" type="number" min="1" value={s.metaMensual} onChange={(e) => setS({ ...s, metaMensual: Math.max(1, Math.round(num(e.target.value))) })} /></Field>
          <Field label="Descuento de campaña %"><input className="input tnum" type="number" min="0" max="100" value={s.descuento} onChange={(e) => setS({ ...s, descuento: num(e.target.value) })} /></Field>
          <Field label="Duración de la campaña (meses)"><input className="input tnum" type="number" min="1" max="60" value={s.mesesCampana} onChange={(e) => setS({ ...s, mesesCampana: Math.max(1, Math.round(num(e.target.value))) })} /></Field>
        </div>
        <div>
          <span className="label">Objetivos diarios de actividad</span>
          <div className="grid g2" style={{ gap: 10 }}>
            {[["llamada", "Llamadas"], ["whatsapp", "WhatsApp"], ["reunion", "Reuniones"], ["propuesta", "Propuestas"]].map(([k, l]) => (
              <Field key={k} label={l}><input className="input tnum" type="number" min="0" value={s.objetivos[k]} onChange={(e) => setObj(k, e.target.value)} /></Field>
            ))}
          </div>
          {s.objetivos.whatsapp > WA_DAILY_HARD_LIMIT && <div className="note t-warn" style={{ marginTop: 8 }}>El tope de seguridad anti-bloqueo es {WA_DAILY_HARD_LIMIT} WhatsApp por día.</div>}
        </div>
        <Field label="Tema">
          <div className="seg">
            <button className={s.theme !== "dark" ? "on" : ""} onClick={() => setS({ ...s, theme: "light" })}><Sun size={13} style={{ verticalAlign: -2 }} /> Claro</button>
            <button className={s.theme === "dark" ? "on" : ""} onClick={() => setS({ ...s, theme: "dark" })}><Moon size={13} style={{ verticalAlign: -2 }} /> Oscuro</button>
          </div>
        </Field>
        {HOSTED && (
          <div className="note t-info">
            Tus datos se guardan en <strong>este navegador</strong> (no en el servidor). No se comparten entre dispositivos y se pierden si borrás los datos del sitio: hacé <strong>Backup</strong> seguido y usá <strong>Restaurar</strong> para pasar la base a otra computadora.
          </div>
        )}
        <Btn variant="primary" style={{ width: "100%" }} onClick={() => onSave(s)}>Guardar ajustes</Btn>
      </div>
    </Modal>
  );
}

// ======================================================== Paleta (Ctrl K) ===

function CommandPalette({ companies, personas, actions, onClose, onPickCompany, onPickPersona }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef(null);
  useEffect(() => {
    inputRef.current && inputRef.current.focus();
  }, []);
  useEscape(onClose);

  const results = useMemo(() => {
    const t = stripAccents(q.trim().toLowerCase());
    const out = [];
    const match = (s) => stripAccents((s || "").toLowerCase()).includes(t);
    actions.filter((a) => !t || match(a.label)).slice(0, t ? 4 : 5).forEach((a) => out.push({ kind: "accion", label: a.label, icon: a.icon, run: () => { onClose(); a.run(); } }));
    if (t.length >= 2) {
      companies
        .filter((c) => match(c.empresa) || match(c.contacto) || match(c.nombreFantasia) || (c.cuit || "").includes(t))
        .slice(0, 7)
        .forEach((c) => out.push({ kind: "empresa", label: c.empresa, hint: `${STAGE_BY_KEY[c.stage]?.label}${c.contacto ? " · " + c.contacto : ""}`, icon: Building2, run: () => onPickCompany(c.id) }));
      personas
        .filter((p) => match(p.nombre) || (p.telefono || "").includes(t) || (p.dni || "").includes(t))
        .slice(0, 5)
        .forEach((p) => out.push({ kind: "paciente", label: p.nombre, hint: p.obraSocial || "Paciente", icon: Users, run: () => onPickPersona(p.id) }));
    }
    return out;
  }, [q, companies, personas, actions]);
  useEffect(() => setSel(0), [q]);

  return (
    <div className="crm-overlay" style={{ alignItems: "flex-start", paddingTop: "12vh" }} onClick={onClose}>
      <div className="modal" style={{ maxWidth: 580 }} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Buscar">
        <div className="row" style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
          <Search size={17} className="muted" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, results.length - 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
              if (e.key === "Enter" && results[sel]) results[sel].run();
            }}
            placeholder="Buscar empresa, paciente, CUIT, teléfono… o una acción"
            style={{ flex: 1, border: 0, outline: "none", background: "transparent", font: "inherit", fontSize: 15, color: "var(--ink)" }}
          />
          <span className="kbd">Esc</span>
        </div>
        <div style={{ maxHeight: 420, overflowY: "auto", padding: 6 }}>
          {results.length === 0 && <EmptyNote>{q.trim().length < 2 ? "Escribí al menos 2 letras para buscar en la base." : "Sin resultados."}</EmptyNote>}
          {results.map((r, i) => (
            <button
              key={r.kind + r.label + i}
              onMouseEnter={() => setSel(i)}
              onClick={r.run}
              className="row"
              style={{ width: "100%", gap: 10, padding: "9px 10px", borderRadius: 10, border: 0, cursor: "pointer", font: "inherit", textAlign: "left", background: i === sel ? "var(--accent-soft)" : "transparent", color: "var(--ink)" }}
            >
              <r.icon size={15} className="muted" />
              <span style={{ fontWeight: 600, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</span>
              {r.hint && <span className="muted" style={{ fontSize: 12, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.hint}</span>}
              <Chip tone={r.kind === "accion" ? "accent" : "neutral"}>{r.kind}</Chip>
            </button>
          ))}
        </div>
        <div className="row muted" style={{ gap: 12, padding: "8px 14px", borderTop: "1px solid var(--border)", fontSize: 11.5 }}>
          <span><span className="kbd">↑↓</span> moverse</span>
          <span><span className="kbd">Enter</span> abrir</span>
          <span style={{ marginLeft: "auto" }}><Command size={11} style={{ verticalAlign: -1 }} /> Ctrl/⌘ K desde cualquier pantalla</span>
        </div>
      </div>
    </div>
  );
}
