
// ============================================================ Tablero B2C ===

function DashboardB2C({ personas, waLog, go, setShowNewPersona }) {
  const waGate = useWaGate(waLog);
  const d = useMemo(() => {
    const total = personas.length;
    let conTel = 0, contactados = 0, pendConTel = 0;
    const porStatus = {};
    PERSONA_STATUS.forEach((s) => (porStatus[s.key] = 0));
    const os = new Map();
    const edades = RANGOS_EDAD.map(() => ({ total: 0, contactados: 0 }));
    let sinEdad = 0;
    personas.forEach((p) => {
      if (p.telefono) conTel++;
      if (p.contactado) contactados++;
      const pend = !p.contactado && p.telefono && !["cliente", "descartado"].includes(p.status);
      if (pend) pendConTel++;
      porStatus[p.status] = (porStatus[p.status] || 0) + 1;
      const k = p.obraSocial || "Sin obra social";
      const o = os.get(k) || { nombre: k, total: 0, contactados: 0, pendConTel: 0, clientes: 0 };
      o.total++;
      if (p.contactado) o.contactados++;
      if (pend) o.pendConTel++;
      if (p.status === "cliente") o.clientes++;
      os.set(k, o);
      const edad = calcularEdad(p.fechaNacimiento);
      if (edad === null || edad < 0 || edad > 120) sinEdad++;
      else {
        const i = RANGOS_EDAD.findIndex((r) => edad >= r.min && edad <= r.max);
        if (i >= 0) {
          edades[i].total++;
          if (p.contactado) edades[i].contactados++;
        }
      }
    });
    const lista = [...os.values()].sort((a, b) => b.total - a.total);
    return { total, conTel, contactados, pendConTel, porStatus, obras: lista.slice(0, 10), edades, sinEdad, mejorPend: [...lista].sort((a, b) => b.pendConTel - a.pendConTel)[0] };
  }, [personas]);
  const ch = useChart();

  if (d.total === 0) {
    return (
      <div className="stack">
        <PageHeader title="Particulares (B2C)" />
        <Card>
          <EmptyNote>
            Todavía no hay pacientes cargados. Importá tu base (Excel/CSV) desde “Pacientes” o sumá uno a mano.
            <div className="row" style={{ justifyContent: "center", marginTop: 12 }}>
              <Btn variant="primary" icon={Upload} onClick={() => go("personas")}>Ir a Pacientes</Btn>
              <Btn icon={Plus} onClick={() => setShowNewPersona(true)}>Nuevo paciente</Btn>
            </div>
          </EmptyNote>
        </Card>
      </div>
    );
  }

  const pct = Math.round((d.contactados / d.total) * 100);
  const ritmo = 15;
  const conv = d.contactados ? ((d.porStatus.cliente || 0) / d.contactados) * 100 : 0;
  const respuesta = d.contactados ? (((d.porStatus.interesado || 0) + (d.porStatus.cliente || 0)) / d.contactados) * 100 : 0;
  const edadData = d.edades.map((e, i) => ({ rango: RANGOS_EDAD[i].label, tooltipLabel: `${RANGOS_EDAD[i].label} años`, total: e.total, contactados: e.contactados }));

  return (
    <div className="stack">
      <PageHeader title="Particulares (B2C)" subtitle={`${fmtN(d.total)} personas en la base · ${fmtN(d.pendConTel)} listas para contactar`}>
        <Btn variant="primary" icon={MessageCircle} onClick={() => go("campanab2c")}>Contactar hoy</Btn>
        <Btn icon={Plus} onClick={() => setShowNewPersona(true)}>Paciente</Btn>
      </PageHeader>

      <div className="grid g3">
        <div className="hero">
          <div className="row between">
            <span style={{ fontWeight: 700 }}>Cobertura de la base</span>
            <span className="chip tnum" style={{ background: "rgba(255,255,255,.12)", color: "#fff" }}>{fmtN(d.contactados)} / {fmtN(d.total)}</span>
          </div>
          <div className="row" style={{ gap: 18, marginTop: 10 }}>
            <Ring value={d.contactados} max={d.total} size={124} stroke={11}>
              <div className="tnum" style={{ fontSize: 30, fontWeight: 800 }}>{pct}%</div>
              <div style={{ fontSize: 11, color: "#A9BCD3" }}>contactada</div>
            </Ring>
            <div style={{ fontSize: 13, color: "#D6E2F0", lineHeight: 1.5 }}>
              {d.pendConTel === 0 ? "No quedan personas con teléfono por contactar." : `A ${ritmo} mensajes por día terminás los pendientes en ≈ ${fmtN(Math.ceil(d.pendConTel / ritmo))} días hábiles.`}
            </div>
          </div>
        </div>
        <div className="span2 grid g2">
          <Kpi icon={Phone} label="Pendientes con teléfono" value={fmtN(d.pendConTel)} sub="listos para escribirles" onClick={() => go("campanab2c")} />
          <Kpi icon={Sparkles} label="Tasa de respuesta" value={`${respuesta.toFixed(1)}%`} sub="interesados + clientes / contactados" tone="info" />
          <Kpi icon={Heart} label="Interesados" value={fmtN(d.porStatus.interesado || 0)} sub="seguir con cotización" tone="warn" onClick={() => go("personas")} />
          <Kpi icon={CheckCircle2} label="Clientes" value={fmtN(d.porStatus.cliente || 0)} sub={`conversión ${conv.toFixed(1)}% de contactados`} tone="good" />
        </div>
      </div>

      <div className="grid g3">
        <Card title="Obra social de origen" icon={Building2} className="span2" action={<LinkBtn onClick={() => go("personas")}>Filtrar</LinkBtn>}>
          <table className="tbl">
            <thead>
              <tr><th>Obra social</th><th style={{ textAlign: "right" }}>Base</th><th style={{ width: "40%" }}>Contactados</th><th style={{ textAlign: "right" }}>Pendientes</th><th style={{ textAlign: "right" }}>Clientes</th></tr>
            </thead>
            <tbody>
              {d.obras.map((o) => (
                <tr key={o.nombre}>
                  <td className="strong">{o.nombre}</td>
                  <td className="tnum" style={{ textAlign: "right" }}>{fmtN(o.total)}</td>
                  <td>
                    <div className="row" style={{ gap: 8 }}>
                      <div style={{ flex: 1 }}><ProgressBar value={o.contactados} max={o.total} height={6} /></div>
                      <span className="tnum" style={{ fontSize: 12, width: 36, textAlign: "right" }}>{Math.round((o.contactados / o.total) * 100)}%</span>
                    </div>
                  </td>
                  <td className="tnum" style={{ textAlign: "right" }}>{fmtN(o.pendConTel)}</td>
                  <td className="tnum" style={{ textAlign: "right" }}>{fmtN(o.clientes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {d.mejorPend && d.mejorPend.pendConTel > 0 && (
            <div className="note t-accent" style={{ marginTop: 10 }}>Mayor bolsa sin contactar: <strong>{d.mejorPend.nombre}</strong>, con {fmtN(d.mejorPend.pendConTel)} personas con teléfono.</div>
          )}
        </Card>

        <Card title="WhatsApp de hoy" icon={MessageCircle}>
          <div className="row" style={{ alignItems: "baseline", gap: 6 }}>
            <span className="tnum" style={{ fontSize: 34, fontWeight: 800, color: waGate.superoLimite ? "var(--bad)" : "var(--ink)" }}>{waGate.enviadosHoy}</span>
            <span className="muted">de {WA_DAILY_HARD_LIMIT} mensajes</span>
          </div>
          <ProgressBar value={waGate.enviadosHoy} max={WA_DAILY_HARD_LIMIT} tone={waGate.superoLimite ? "bad" : undefined} />
          <div style={{ marginTop: 10 }}><WaGateBanner waGate={waGate} /></div>
          <div className="divider" />
          <div className="label">Estado de los pacientes</div>
          <div className="stack-sm">
            {PERSONA_STATUS.map((s) => (
              <HBar key={s.key} label={s.label} value={d.porStatus[s.key] || 0} max={Math.max(1, ...PERSONA_STATUS.map((x) => d.porStatus[x.key] || 0))} tone={s.key === "cliente" ? "good" : s.key === "descartado" ? "muted" : undefined} />
            ))}
          </div>
        </Card>
      </div>

      <Card title="Edades de la base" icon={Users} action={<span className="muted" style={{ fontSize: 12 }}>azul: base total · verde: contactados</span>}>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={edadData} margin={{ top: 10, right: 8, left: -10, bottom: 0 }} barGap={2}>
              <CartesianGrid vertical={false} stroke={ch.grid} />
              <XAxis dataKey="rango" tickLine={false} axisLine={false} tick={{ fill: ch.axis, fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: ch.axis, fontSize: 12 }} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: ch.grid, opacity: 0.5 }} />
              <Bar dataKey="total" name="Base" fill={ch.accent2} radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="contactados" name="Contactados" fill={ch.accent} radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {d.sinEdad > 0 && <div className="muted" style={{ fontSize: 12 }}>{fmtN(d.sinEdad)} personas sin fecha de nacimiento válida no figuran en el gráfico.</div>}
      </Card>
    </div>
  );
}

// ============================================================== Pacientes ===

const PERSONAS_POR_PAGINA = 50;

function PersonasList({ personas, setSelectedPersonaId, setShowNewPersona, setShowPersonaWhatsApp, importPersonas, clearPersonas, askConfirm, showToast, updatePersona }) {
  const [search, setSearch] = useState("");
  const [obraSocialFiltro, setObraSocialFiltro] = useState("todas");
  const [statusFiltro, setStatusFiltro] = useState("todos");
  const [contactadoFiltro, setContactadoFiltro] = useState("todos");
  const [edadFiltro, setEdadFiltro] = useState("todas");
  const [page, setPage] = useState(1);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const obrasSociales = useMemo(() => {
    const cnt = new Map();
    personas.forEach((p) => p.obraSocial && cnt.set(p.obraSocial, (cnt.get(p.obraSocial) || 0) + 1));
    return [...cnt.entries()].sort((a, b) => b[1] - a[1]);
  }, [personas]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rango = RANGOS_EDAD.find((r) => r.key === edadFiltro);
    return personas.filter((p) => {
      if (obraSocialFiltro !== "todas" && p.obraSocial !== obraSocialFiltro) return false;
      if (statusFiltro !== "todos" && p.status !== statusFiltro) return false;
      if (contactadoFiltro === "pendientes" && p.contactado) return false;
      if (contactadoFiltro === "contactados" && !p.contactado) return false;
      if (rango) {
        const e = calcularEdad(p.fechaNacimiento);
        if (e === null || e < rango.min || e > rango.max) return false;
      }
      if (q) return (p.nombre || "").toLowerCase().includes(q) || (p.telefono || "").includes(q) || (p.mail || "").toLowerCase().includes(q) || (p.dni || "").includes(q);
      return true;
    });
  }, [personas, obraSocialFiltro, statusFiltro, contactadoFiltro, edadFiltro, search]);

  useEffect(() => setPage(1), [search, obraSocialFiltro, statusFiltro, contactadoFiltro, edadFiltro]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PERSONAS_POR_PAGINA));
  const pg = Math.min(page, totalPages);
  const pageItems = filtered.slice((pg - 1) * PERSONAS_POR_PAGINA, pg * PERSONAS_POR_PAGINA);

  const handleFile = async (file) => {
    setImporting(true);
    try {
      const nuevas = await parsePersonasFile(file);
      const existentes = new Set(personas.map((p) => normEmpresa(p.nombre) + "|" + normcuitStr(p.telefono)));
      const aAgregar = nuevas.filter((p) => !existentes.has(normEmpresa(p.nombre) + "|" + normcuitStr(p.telefono)));
      importPersonas(aAgregar);
      showToast(`Se importaron ${fmtN(aAgregar.length)} personas nuevas (de ${fmtN(nuevas.length)} filas; ${fmtN(nuevas.length - aAgregar.length)} ya existían).`);
    } catch (e) {
      showToast("No se pudo leer el archivo: " + e.message);
    }
    setImporting(false);
  };

  return (
    <div className="stack">
      <PageHeader title="Pacientes" subtitle={`${fmtN(filtered.length)} de ${fmtN(personas.length)} personas`}>
        <Btn variant="primary" icon={Plus} onClick={() => setShowNewPersona(true)}>Paciente</Btn>
        <Btn icon={Upload} disabled={importing} onClick={() => fileInputRef.current && fileInputRef.current.click()}>{importing ? "Importando…" : "Importar base"}</Btn>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
        {filtered.length > 0 && (
          <>
            <Btn
              icon={Download}
              onClick={() =>
                exportarExcel(
                  filtered.map((p) => ({ Nombre: p.nombre, Edad: calcularEdad(p.fechaNacimiento) ?? "", "Obra social": p.obraSocial || "", Teléfono: p.telefono || "", Mail: p.mail || "", Estado: PERSONA_STATUS.find((s) => s.key === p.status)?.label || p.status, Contactado: p.contactado ? "Sí" : "No", Seguimiento: p.seguimiento || "", Nota: p.nota || "" })),
                  "Pacientes",
                  `pacientes-${hoyISO()}.xlsx`
                )
              }
            >
              Excel
            </Btn>
            <Btn
              icon={Phone}
              onClick={() => {
                const contactos = filtered.map((p) => ({ nombre: p.nombre, telefono: p.telefono, nota: p.obraSocial ? `Obra social: ${p.obraSocial}` : "" }));
                descargarVCF(contactos, `personas-${hoyISO()}.vcf`);
                showToast(`Se descargaron ${fmtN(contactos.filter((c) => c.telefono).length)} contactos. Importalos desde tu celular.`);
              }}
            >
              A mi celular
            </Btn>
          </>
        )}
        {personas.length > 0 && (
          <Btn variant="danger" icon={Trash2} onClick={() => askConfirm(`Esto va a borrar las ${fmtN(personas.length)} personas cargadas en B2C. No afecta a las empresas. ¿Confirmás?`, clearPersonas)}>
            Vaciar
          </Btn>
        )}
      </PageHeader>

      <div className="row wrap">
        <SearchBox value={search} onChange={setSearch} placeholder="Nombre, teléfono, mail o DNI…" />
        <select className="select" value={obraSocialFiltro} onChange={(e) => setObraSocialFiltro(e.target.value)}>
          <option value="todas">Toda obra social</option>
          {obrasSociales.map(([os, n]) => <option key={os} value={os}>{os} ({fmtN(n)})</option>)}
        </select>
        <select className="select" value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)}>
          <option value="todos">Todo estado</option>
          {PERSONA_STATUS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <select className="select" value={edadFiltro} onChange={(e) => setEdadFiltro(e.target.value)}>
          <option value="todas">Toda edad</option>
          {RANGOS_EDAD.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
        </select>
        <div className="seg">
          {[["todos", "Todos"], ["pendientes", "Pendientes"], ["contactados", "Contactados"]].map(([k, l]) => (
            <button key={k} className={contactadoFiltro === k ? "on" : ""} onClick={() => setContactadoFiltro(k)}>{l}</button>
          ))}
        </div>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="tbl">
            <thead>
              <tr><th style={{ width: 36 }}>✓</th><th>Nombre</th><th>Edad</th><th>Obra social</th><th>Teléfono</th><th>Estado</th><th>Seguimiento</th><th></th></tr>
            </thead>
            <tbody>
              {pageItems.map((p) => {
                const edad = calcularEdad(p.fechaNacimiento);
                return (
                  <tr key={p.id} className="click" onClick={() => setSelectedPersonaId(p.id)} style={{ opacity: p.contactado ? 0.72 : 1 }}>
                    <td>
                      <input type="checkbox" checked={!!p.contactado} onClick={(e) => e.stopPropagation()} onChange={(e) => updatePersona(p.id, { contactado: e.target.checked })} title="Marcar como contactado/a" />
                    </td>
                    <td className="strong">{p.nombre}</td>
                    <td className="tnum">{edad != null ? `${edad}` : "—"}</td>
                    <td>{p.obraSocial || "—"}</td>
                    <td className="tnum">{p.telefono || "—"}</td>
                    <td>
                      <select className="select" style={{ padding: "3px 24px 3px 6px", fontSize: 12 }} value={p.status} onClick={(e) => e.stopPropagation()} onChange={(e) => updatePersona(p.id, { status: e.target.value })} aria-label="Estado">
                        {PERSONA_STATUS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                      </select>
                    </td>
                    <td style={{ color: p.seguimiento && p.seguimiento <= hoyISO() ? "var(--bad)" : undefined }}>{p.seguimiento ? fmtFecha(p.seguimiento) : "—"}</td>
                    <td>
                      <button className="icon-btn wa" disabled={!p.telefono} onClick={(e) => { e.stopPropagation(); setShowPersonaWhatsApp(p.id); }} aria-label="WhatsApp"><MessageCircle size={14} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <EmptyNote>{personas.length === 0 ? "Todavía no cargaste ninguna persona. Usá “Importar base” o agregá una manualmente." : "No hay personas que coincidan con el filtro."}</EmptyNote>}
        {filtered.length > 0 && <Paginador page={pg} totalPages={totalPages} setPage={setPage} total={filtered.length} porPagina={PERSONAS_POR_PAGINA} />}
      </div>
    </div>
  );
}

function PersonaDetail({ persona, onClose, updatePersona, deletePersona, setShowPersonaWhatsApp, askConfirm }) {
  const [f, setF] = useState({});
  useEffect(() => {
    setF({ _id: persona.id, nombre: persona.nombre || "", telefono: persona.telefono || "", mail: persona.mail || "", obraSocial: persona.obraSocial || "", fechaNacimiento: persona.fechaNacimiento || "", nota: persona.nota || "", seguimiento: persona.seguimiento || "", grupo: persona.grupo || "" });
  }, [persona.id]);
  const latest = useRef(null);
  latest.current = { f, persona };
  useEffect(
    () => () => {
      const { f: ff, persona: pp } = latest.current;
      if (ff._id !== pp.id) return;
      const patch = {};
      Object.keys(ff).forEach((k) => k !== "_id" && ff[k] !== (pp[k] || "") && (patch[k] = ff[k]));
      if (Object.keys(patch).length) updatePersona(pp.id, patch);
    },
    []
  );
  const commit = (k) => f[k] !== undefined && f[k] !== (persona[k] || "") && updatePersona(persona.id, { [k]: f[k] });
  const edad = calcularEdad(persona.fechaNacimiento);
  const inp = (k, props = {}) => <input className="input" value={f[k] ?? ""} onChange={(e) => setF({ ...f, [k]: e.target.value })} onBlur={() => commit(k)} {...props} />;

  return (
    <Drawer onClose={onClose}>
      <div className="row between" style={{ padding: "16px 18px", borderBottom: "1px solid var(--border)", alignItems: "flex-start", position: "sticky", top: 0, background: "var(--surface)", zIndex: 2 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{persona.nombre}</div>
          <div className="muted" style={{ fontSize: 12 }}>{[edad != null ? `${edad} años` : "Sin fecha de nacimiento", persona.obraSocial, persona.dni ? `DNI ${persona.dni}` : null].filter(Boolean).join(" · ")}</div>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Cerrar"><X size={16} /></button>
      </div>
      <div style={{ padding: 18 }} className="stack">
        <div className="row wrap">
          <Btn variant="wa" icon={MessageCircle} disabled={!persona.telefono} onClick={() => setShowPersonaWhatsApp(persona.id)}>WhatsApp</Btn>
          {persona.telefono && <a className="btn btn-outline" href={`tel:+${normalizePhoneAR(persona.telefono)}`}><Phone size={15} /> Llamar</a>}
        </div>
        <div className="grid g2" style={{ gap: 10 }}>
          <Field label="Estado">
            <select className="select full" value={persona.status} onChange={(e) => updatePersona(persona.id, { status: e.target.value })}>
              {PERSONA_STATUS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Próximo seguimiento">
            <input type="date" className="input" value={f.seguimiento || ""} onChange={(e) => setF({ ...f, seguimiento: e.target.value })} onBlur={() => commit("seguimiento")} />
          </Field>
        </div>
        <QuickDates onPick={(d) => { setF({ ...f, seguimiento: d }); updatePersona(persona.id, { seguimiento: d }); }} />
        <label className="tile row" style={{ gap: 8, cursor: "pointer" }}>
          <input type="checkbox" checked={!!persona.contactado} onChange={(e) => updatePersona(persona.id, { contactado: e.target.checked })} /> Ya la contacté (por acá o desde mi celular)
        </label>
        <Field label="Grupo familiar a cotizar"><input className="input" value={f.grupo ?? ""} onChange={(e) => setF({ ...f, grupo: e.target.value })} onBlur={() => commit("grupo")} placeholder="Ej: titular 38 + cónyuge 36 + 2 hijos" /></Field>
        <Field label="Nota"><textarea className="textarea" rows={3} value={f.nota ?? ""} onChange={(e) => setF({ ...f, nota: e.target.value })} onBlur={() => commit("nota")} /></Field>
        <div className="divider" />
        <Field label="Nombre y apellido">{inp("nombre")}</Field>
        <div className="grid g2" style={{ gap: 10 }}>
          <Field label="Teléfono">{inp("telefono")}</Field>
          <Field label="Mail">{inp("mail")}</Field>
          <Field label="Obra social">{inp("obraSocial")}</Field>
          <Field label="Fecha de nacimiento">{inp("fechaNacimiento", { type: "date" })}</Field>
        </div>
        {(persona.historial || []).length > 0 && (
          <div>
            <div className="label">Historial</div>
            <Timeline items={persona.historial} />
          </div>
        )}
        <Btn variant="danger" icon={Trash2} onClick={() => askConfirm(`¿Eliminar a ${persona.nombre}?`, () => { deletePersona(persona.id); onClose(); })}>Eliminar paciente</Btn>
      </div>
    </Drawer>
  );
}

function CampanaB2C({ personas, setSelectedPersonaId, setShowPersonaWhatsApp, updatePersona }) {
  const [obraSocialFiltro, setObraSocialFiltro] = useState("todas");
  const [edadFiltro, setEdadFiltro] = useState("todas");
  const [incluirContactados, setIncluirContactados] = useState(false);
  const [index, setIndex] = useState(0);
  const obrasSociales = useMemo(() => Array.from(new Set(personas.map((p) => p.obraSocial).filter(Boolean))).sort(), [personas]);
  const queue = useMemo(() => {
    const rango = RANGOS_EDAD.find((r) => r.key === edadFiltro);
    return personas.filter((p) => {
      if (!p.telefono || ["cliente", "descartado"].includes(p.status)) return false;
      if (!incluirContactados && p.contactado) return false;
      if (obraSocialFiltro !== "todas" && p.obraSocial !== obraSocialFiltro) return false;
      if (rango) {
        const e = calcularEdad(p.fechaNacimiento);
        if (e === null || e < rango.min || e > rango.max) return false;
      }
      return true;
    });
  }, [personas, obraSocialFiltro, edadFiltro, incluirContactados]);
  useEffect(() => setIndex(0), [obraSocialFiltro, edadFiltro, incluirContactados]);
  const current = queue[index];
  const siguiente = () => setIndex((i) => Math.min(i + 1, queue.length));

  return (
    <div className="stack">
      <PageHeader title="Campaña B2C" subtitle={`${fmtN(queue.length)} personas en la cola`}>
        <select className="select" value={obraSocialFiltro} onChange={(e) => setObraSocialFiltro(e.target.value)}>
          <option value="todas">Toda obra social</option>
          {obrasSociales.map((os) => <option key={os} value={os}>{os}</option>)}
        </select>
        <select className="select" value={edadFiltro} onChange={(e) => setEdadFiltro(e.target.value)}>
          <option value="todas">Toda edad</option>
          {RANGOS_EDAD.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
        </select>
        <label className="row ink2" style={{ gap: 6, fontSize: 12.5, cursor: "pointer" }}>
          <input type="checkbox" checked={incluirContactados} onChange={(e) => setIncluirContactados(e.target.checked)} /> Incluir ya contactados
        </label>
      </PageHeader>
      <Card title={queue.length ? `Persona ${Math.min(index + 1, queue.length)} de ${fmtN(queue.length)}` : "Cola vacía"} icon={Megaphone}>
        {!current ? (
          <EmptyNote>{personas.length === 0 ? "Todavía no hay personas cargadas. Importá tu base desde Pacientes." : "No hay más personas pendientes con este filtro."}</EmptyNote>
        ) : (
          <div className="stack">
            <div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{current.nombre}</div>
              <div className="muted">{current.telefono} · {current.obraSocial || "sin obra social"} · {calcularEdad(current.fechaNacimiento) != null ? `${calcularEdad(current.fechaNacimiento)} años` : "edad desconocida"}</div>
            </div>
            <div className="row wrap">
              <Btn variant="wa" icon={MessageCircle} onClick={() => setShowPersonaWhatsApp(current.id)}>Enviar WhatsApp</Btn>
              <Btn icon={CheckCircle2} onClick={() => { updatePersona(current.id, { contactado: true, status: current.status === "nuevo" ? "contactado" : current.status }); siguiente(); }}>Ya la contacté</Btn>
              <Btn icon={Heart} onClick={() => { updatePersona(current.id, { contactado: true, status: "interesado", seguimiento: addDaysISO(2) }); siguiente(); }}>Interesada (+2 d)</Btn>
              <Btn icon={XCircle} onClick={() => { updatePersona(current.id, { contactado: true, status: "descartado" }); siguiente(); }}>Descartar</Btn>
              <Btn variant="ghost" onClick={() => setSelectedPersonaId(current.id)}>Ficha</Btn>
              <Btn variant="ghost" icon={SkipForward} style={{ marginLeft: "auto" }} onClick={siguiente}>Saltar</Btn>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function PersonaWhatsAppModal({ persona, onClose, onSent, waLog, vars }) {
  const nombre = getPersonaFirstName(persona.nombre);
  const build = (k) => fillVars((PERSONA_TEMPLATES.find((t) => t.key === k) || PERSONA_TEMPLATES[0]).text, { ...vars, nombre });
  const [templateKey, setTemplateKey] = useState(PERSONA_TEMPLATES[0].key);
  const [phone, setPhone] = useState(normalizePhoneAR(persona.telefono));
  const [message, setMessage] = useState(build(PERSONA_TEMPLATES[0].key));
  const [sent, setSent] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const waGate = useWaGate(waLog);
  return (
    <Modal title={`WhatsApp · ${persona.nombre}`} onClose={onClose} width={540}>
      <div className="stack">
        <WaGateBanner waGate={waGate} />
        <div>
          <span className="label">Plantilla</span>
          <div className="seg" style={{ width: "100%", flexWrap: "wrap" }}>
            {PERSONA_TEMPLATES.map((t) => (
              <button key={t.key} style={{ flex: 1 }} className={templateKey === t.key ? "on" : ""} onClick={() => { setTemplateKey(t.key); setMessage(build(t.key)); }}>{t.label}</button>
            ))}
          </div>
        </div>
        <Field label="Número (formato internacional, solo dígitos)"><input className="input tnum" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ""))} /></Field>
        <Field label={`Mensaje · {Nombre} = “${nombre || "sin nombre"}”`}><textarea className="textarea" rows={6} value={message} onChange={(e) => setMessage(e.target.value)} /></Field>
        <Btn
          variant="wa"
          icon={MessageCircle}
          style={{ width: "100%" }}
          disabled={!phone || sent || !waGate.puedeEnviar}
          onClick={() => {
            if (!phone || !waGate.puedeEnviar) return;
            window.open(buildWaLink(phone, message), "_blank");
            onSent();
            setSent(true);
          }}
        >
          {sent ? "Abierto en WhatsApp ✓" : waGate.superoLimite ? "Límite diario alcanzado" : !waGate.puedeEnviar ? `Esperá ${Math.ceil(waGate.msRestantesCooldown / 1000)} s` : "Abrir WhatsApp"}
        </Btn>
        <Btn icon={Copy} style={{ width: "100%" }} onClick={async () => { if (await copiarTexto(message)) { setCopiado(true); setTimeout(() => setCopiado(false), 2500); } }}>
          {copiado ? "Copiado ✓" : "Copiar mensaje (para enviar a mano)"}
        </Btn>
        <div className="muted" style={{ fontSize: 12, textAlign: "center" }}>Escribir a mano desde tu celular es la forma más segura de no arriesgar tu cuenta.</div>
      </div>
    </Modal>
  );
}

function NewPersonaModal({ onClose, onSave }) {
  const [form, setForm] = useState({ nombre: "", telefono: "", mail: "", fechaNacimiento: "", obraSocial: "", nota: "" });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  return (
    <Modal title="Nuevo paciente" onClose={onClose}>
      <div className="stack">
        <Field label="Nombre y apellido *"><input className="input" autoFocus value={form.nombre} onChange={set("nombre")} /></Field>
        <div className="grid g2" style={{ gap: 10 }}>
          <Field label="Teléfono"><input className="input" value={form.telefono} onChange={set("telefono")} /></Field>
          <Field label="Mail"><input className="input" value={form.mail} onChange={set("mail")} /></Field>
          <Field label="Fecha de nacimiento"><input type="date" className="input" value={form.fechaNacimiento} onChange={set("fechaNacimiento")} /></Field>
          <Field label="Obra social"><input className="input" value={form.obraSocial} onChange={set("obraSocial")} /></Field>
        </div>
        <Btn variant="primary" disabled={!form.nombre.trim()} style={{ width: "100%" }} onClick={() => onSave(form)}>Guardar</Btn>
      </div>
    </Modal>
  );
}
