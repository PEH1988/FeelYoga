
// ============================================================== Pipeline ===

const KANBAN_CARDS_POR_COLUMNA = 25;

function Pipeline({ companies, updateCompany, setSelectedId, setShowNewCompany, setShowWhatsApp, setLogFor }) {
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState("todos");
  const [ocultarProspeccion, setOcultarProspeccion] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [dragId, setDragId] = useState(null);
  const [overStage, setOverStage] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return companies.filter((c) => {
      if (tier !== "todos" && c.tier !== tier) return false;
      if (q && !(c.empresa.toLowerCase().includes(q) || (c.contacto || "").toLowerCase().includes(q) || (c.cuit || "").includes(q))) return false;
      return true;
    });
  }, [companies, search, tier]);

  const columnas = STAGES.filter((s) => !(ocultarProspeccion && s.key === "prospeccion"));
  const hoy = hoyISO();

  return (
    <div className="stack">
      <PageHeader title="Pipeline" subtitle="Arrastrá las tarjetas entre columnas para cambiar de etapa">
        <SearchBox value={search} onChange={setSearch} placeholder="Buscar empresa, contacto o CUIT…" />
        <div className="seg">
          {[["todos", "Todas"], ["caliente", "Calientes"], ["tibio", "Tibias"]].map(([k, l]) => (
            <button key={k} className={tier === k ? "on" : ""} onClick={() => setTier(k)}>{l}</button>
          ))}
        </div>
        <label className="row ink2" style={{ fontSize: 12.5, gap: 6, cursor: "pointer" }}>
          <input type="checkbox" checked={ocultarProspeccion} onChange={(e) => setOcultarProspeccion(e.target.checked)} /> Ocultar prospección
        </label>
        <Btn variant="primary" icon={Plus} onClick={() => setShowNewCompany(true)}>Empresa</Btn>
      </PageHeader>

      <div className="kanban">
        {columnas.map((stage) => {
          const all = filtered.filter((c) => c.stage === stage.key);
          // Las acciones vencidas y lo más grande primero.
          all.sort((a, b) => {
            const va = a.fechaProximaAccion && a.fechaProximaAccion <= hoy ? 0 : 1;
            const vb = b.fechaProximaAccion && b.fechaProximaAccion <= hoy ? 0 : 1;
            return va - vb || num(b.capitas) - num(a.capitas);
          });
          const isExp = !!expanded[stage.key];
          const items = isExp ? all : all.slice(0, KANBAN_CARDS_POR_COLUMNA);
          const cap = all.reduce((s, c) => s + num(c.capitas), 0);
          return (
            <div
              key={stage.key}
              className={"kcol" + (overStage === stage.key ? " over" : "")}
              onDragOver={(e) => {
                e.preventDefault();
                if (overStage !== stage.key) setOverStage(stage.key);
              }}
              onDragLeave={() => setOverStage(null)}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain") || dragId;
                if (id) updateCompany(id, { stage: stage.key });
                setDragId(null);
                setOverStage(null);
              }}
            >
              <div style={{ padding: "2px 4px 10px" }}>
                <div className="row between">
                  <span style={{ fontWeight: 700, fontSize: 13.5 }}>{stage.label}</span>
                  <Chip tone="neutral">{all.length}</Chip>
                </div>
                <div className="muted tnum" style={{ fontSize: 11.5, marginTop: 3 }}>
                  {fmtN(cap)} cáp. {stage.prob > 0 && stage.prob < 1 ? `· ${fmtN(cap * stage.prob)} ponderadas (${Math.round(stage.prob * 100)}%)` : ""}
                </div>
              </div>
              <div className="stack-sm" style={{ minHeight: 60 }}>
                {items.map((c) => {
                  const vencida = c.fechaProximaAccion && c.fechaProximaAccion <= hoy && isOpen(c);
                  return (
                    <div
                      key={c.id}
                      className={"kcard" + (dragId === c.id ? " dragging" : "")}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", c.id);
                        e.dataTransfer.effectAllowed = "move";
                        setDragId(c.id);
                      }}
                      onDragEnd={() => {
                        setDragId(null);
                        setOverStage(null);
                      }}
                      onClick={() => setSelectedId(c.id)}
                    >
                      <div style={{ fontWeight: 650, fontSize: 13, lineHeight: 1.3 }}>{c.empresa}</div>
                      {c.contacto && <div className="muted" style={{ fontSize: 12, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.contacto}</div>}
                      <div className="row wrap" style={{ gap: 5, marginTop: 7 }}>
                        <TierBadge tier={c.tier} />
                        {num(c.capitas) > 0 && <Chip tone="accent">{c.capitas} cáp.</Chip>}
                        {c.montoMensual > 0 && <Chip tone="neutral">{moneyK(c.montoMensual)}/mes</Chip>}
                        <AgingChip c={c} />
                      </div>
                      {c.proximaAccion || c.fechaProximaAccion ? (
                        <div style={{ fontSize: 11.5, marginTop: 7, color: vencida ? "var(--bad)" : "var(--ink-2)", fontWeight: vencida ? 600 : 500 }}>
                          → {c.proximaAccion || "Próxima acción"}{c.fechaProximaAccion ? ` · ${fmtRelativo(c.fechaProximaAccion)}` : ""}
                        </div>
                      ) : (
                        isOpen(c) && c.stage !== "prospeccion" && <div style={{ fontSize: 11.5, marginTop: 7, color: "var(--warn)" }}>Sin próxima acción</div>
                      )}
                      <div className="row" style={{ gap: 5, marginTop: 8 }}>
                        <button className="icon-btn wa" style={{ width: 26, height: 26 }} disabled={!c.telefono} title="WhatsApp" onClick={(e) => { e.stopPropagation(); setShowWhatsApp(c.id); }}>
                          <MessageCircle size={13} />
                        </button>
                        <button className="icon-btn" style={{ width: 26, height: 26 }} title="Registrar actividad" onClick={(e) => { e.stopPropagation(); setLogFor({ companyId: c.id }); }}>
                          <Activity size={13} />
                        </button>
                        <select
                          className="select"
                          style={{ flex: 1, minWidth: 0, padding: "3px 6px", fontSize: 11.5, height: 26 }}
                          value={c.stage}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => updateCompany(c.id, { stage: e.target.value })}
                          aria-label="Etapa"
                        >
                          {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                        </select>
                      </div>
                    </div>
                  );
                })}
                {all.length > items.length && (
                  <button className="btn btn-ghost btn-sm" style={{ width: "100%" }} onClick={() => setExpanded((p) => ({ ...p, [stage.key]: true }))}>
                    Ver {all.length - items.length} más
                  </button>
                )}
                {isExp && all.length > KANBAN_CARDS_POR_COLUMNA && (
                  <button className="btn btn-ghost btn-sm" style={{ width: "100%" }} onClick={() => setExpanded((p) => ({ ...p, [stage.key]: false }))}>
                    Mostrar menos
                  </button>
                )}
                {all.length === 0 && <div className="muted" style={{ fontSize: 12, textAlign: "center", padding: 12 }}>Soltá una tarjeta acá</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================== Cartera ===

const EMPRESAS_POR_PAGINA = 50;

function Cartera({ companies, setSelectedId, setShowNewCompany, setShowWhatsApp, showToast }) {
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState("todos");
  const [stage, setStage] = useState("todos");
  const [foco, setFoco] = useState("todas"); // todas | vencidas | sinAccion | frias | cotizadas
  const [sort, setSort] = useState({ key: "empresa", dir: 1 });
  const [page, setPage] = useState(1);
  const hoy = hoyISO();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const out = companies.filter((c) => {
      if (tier !== "todos" && c.tier !== tier) return false;
      if (stage !== "todos" && c.stage !== stage) return false;
      if (foco === "vencidas" && !(isOpen(c) && c.fechaProximaAccion && c.fechaProximaAccion <= hoy)) return false;
      if (foco === "sinAccion" && !(ACTIVE_STAGES.includes(c.stage) && !c.fechaProximaAccion)) return false;
      if (foco === "frias" && !(ACTIVE_STAGES.includes(c.stage) && (diasSinActividad(c) ?? 999) >= 14)) return false;
      if (foco === "cotizadas" && !c.cotizacion) return false;
      if (q) {
        return (
          c.empresa.toLowerCase().includes(q) ||
          (c.nombreFantasia || "").toLowerCase().includes(q) ||
          (c.contacto || "").toLowerCase().includes(q) ||
          (c.mail || "").toLowerCase().includes(q) ||
          (c.cuit || "").includes(q) ||
          (c.telefono || "").includes(q)
        );
      }
      return true;
    });
    const val = {
      empresa: (c) => c.empresa.toLowerCase(),
      etapa: (c) => STAGES.findIndex((s) => s.key === c.stage),
      capitas: (c) => num(c.capitas),
      actividad: (c) => ultimaActividad(c) || "",
      accion: (c) => c.fechaProximaAccion || "9999",
    }[sort.key];
    out.sort((a, b) => {
      const x = val(a), y = val(b);
      return (x < y ? -1 : x > y ? 1 : 0) * sort.dir;
    });
    return out;
  }, [companies, search, tier, stage, foco, sort, hoy]);

  useEffect(() => setPage(1), [search, tier, stage, foco, sort]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / EMPRESAS_POR_PAGINA));
  const p = Math.min(page, totalPages);
  const pageItems = filtered.slice((p - 1) * EMPRESAS_POR_PAGINA, p * EMPRESAS_POR_PAGINA);

  const Th = ({ k, children, right }) => (
    <th className="sortable" style={{ textAlign: right ? "right" : "left" }} onClick={() => setSort((s) => ({ key: k, dir: s.key === k ? -s.dir : 1 }))}>
      {children} {sort.key === k ? (sort.dir === 1 ? "↑" : "↓") : ""}
    </th>
  );

  return (
    <div className="stack">
      <PageHeader title="Cartera de empresas" subtitle={`${fmtN(filtered.length)} de ${fmtN(companies.length)} empresas`}>
        <Btn
          icon={Download}
          onClick={() =>
            exportarExcel(
              filtered.map((c) => ({
                Empresa: c.empresa,
                "Nombre fantasía": c.nombreFantasia || "",
                CUIT: c.cuit || "",
                Contacto: c.contacto || "",
                Teléfono: c.telefono || "",
                Mail: c.mail || "",
                Prioridad: c.tier,
                Etapa: STAGE_BY_KEY[c.stage]?.label,
                Cápitas: num(c.capitas) || "",
                "Plan cotizado": c.planCotizado || "",
                "$ mensual": c.montoMensual || "",
                "Última actividad": ultimaActividad(c) || "",
                "Próxima acción": c.proximaAccion || "",
                "Fecha próxima acción": c.fechaProximaAccion || "",
                "Motivo pérdida": c.motivoPerdida || "",
              })),
              "Cartera",
              `cartera-${hoyISO()}.xlsx`
            )
          }
        >
          Excel
        </Btn>
        <Btn
          icon={Phone}
          title="Archivo .vcf para importar estos contactos a la agenda del celular"
          onClick={() => {
            descargarVCF(filtered.map((c) => ({ nombre: c.contacto || c.empresa, telefono: c.telefono, org: c.empresa, nota: c.cuit ? `CUIT: ${c.cuit}` : "" })), `empresas-${hoyISO()}.vcf`);
            showToast(`Se descargaron ${filtered.filter((c) => c.telefono).length} contactos para tu celular.`);
          }}
        >
          A mi celular
        </Btn>
        <Btn variant="primary" icon={Plus} onClick={() => setShowNewCompany(true)}>Empresa</Btn>
      </PageHeader>

      <div className="row wrap">
        <SearchBox value={search} onChange={setSearch} placeholder="Empresa, contacto, CUIT, teléfono…" />
        <select className="select" value={tier} onChange={(e) => setTier(e.target.value)} aria-label="Prioridad">
          <option value="todos">Toda prioridad</option>
          <option value="caliente">Calientes</option>
          <option value="tibio">Tibias</option>
        </select>
        <select className="select" value={stage} onChange={(e) => setStage(e.target.value)} aria-label="Etapa">
          <option value="todos">Toda etapa</option>
          {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <div className="seg">
          {[
            ["todas", "Todas"],
            ["vencidas", "Acción vencida"],
            ["sinAccion", "Sin próxima acción"],
            ["frias", "Frías +14 d"],
            ["cotizadas", "Cotizadas"],
          ].map(([k, l]) => (
            <button key={k} className={foco === k ? "on" : ""} onClick={() => setFoco(k)}>{l}</button>
          ))}
        </div>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="tbl">
            <thead>
              <tr>
                <Th k="empresa">Empresa</Th>
                <th>Contacto</th>
                <th>Prioridad</th>
                <Th k="etapa">Etapa</Th>
                <Th k="capitas" right>Cápitas</Th>
                <Th k="actividad">Última act.</Th>
                <Th k="accion">Próxima acción</Th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((c) => {
                const ua = ultimaActividad(c);
                const venc = isOpen(c) && c.fechaProximaAccion && c.fechaProximaAccion <= hoy;
                return (
                  <tr key={c.id} className="click" onClick={() => setSelectedId(c.id)}>
                    <td className="strong">
                      {c.empresa}
                      <div className="muted" style={{ fontSize: 11.5, fontWeight: 500 }}>{[c.nombreFantasia && c.nombreFantasia !== c.empresa ? c.nombreFantasia : null, c.cuit].filter(Boolean).join(" · ")}</div>
                    </td>
                    <td>
                      {c.contacto || "—"}
                      <div className="muted" style={{ fontSize: 11.5 }}>{c.telefono || c.mail || ""}</div>
                    </td>
                    <td><TierBadge tier={c.tier} /></td>
                    <td><StageChip stage={c.stage} /></td>
                    <td className="tnum" style={{ textAlign: "right" }}>{num(c.capitas) || "—"}</td>
                    <td className="tnum">{ua ? fmtRelativo(ua) : "—"}</td>
                    <td style={{ color: venc ? "var(--bad)" : undefined, fontWeight: venc ? 600 : undefined, maxWidth: 220 }}>
                      {c.fechaProximaAccion ? `${fmtFecha(c.fechaProximaAccion)} · ` : ""}
                      {c.proximaAccion || (c.fechaProximaAccion ? "" : "—")}
                    </td>
                    <td>
                      <button className="icon-btn wa" disabled={!c.telefono} title="WhatsApp" onClick={(e) => { e.stopPropagation(); setShowWhatsApp(c.id); }}>
                        <MessageCircle size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <EmptyNote>No hay empresas que coincidan con el filtro.</EmptyNote>}
        {filtered.length > 0 && <Paginador page={p} totalPages={totalPages} setPage={setPage} total={filtered.length} porPagina={EMPRESAS_POR_PAGINA} />}
      </div>
    </div>
  );
}

function Paginador({ page, totalPages, setPage, total, porPagina }) {
  return (
    <div className="row between wrap" style={{ padding: "10px 14px", fontSize: 13 }}>
      <span className="muted tnum">Mostrando {fmtN((page - 1) * porPagina + 1)}–{fmtN(Math.min(page * porPagina, total))} de {fmtN(total)}</span>
      <div className="row">
        <Btn size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Btn>
        <span className="muted tnum">{page} / {totalPages}</span>
        <Btn size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Siguiente</Btn>
      </div>
    </div>
  );
}

// ======================================================= Ficha de empresa ===

function QuickDates({ onPick }) {
  return (
    <div className="row wrap" style={{ gap: 4, marginTop: 6 }}>
      {[["Hoy", 0], ["Mañana", 1], ["+3 d", 3], ["+1 sem", 7], ["+2 sem", 14], ["+1 mes", 30]].map(([l, n]) => (
        <button key={l} type="button" className="btn btn-ghost btn-sm" style={{ padding: "3px 7px", border: "1px solid var(--border)" }} onClick={() => onPick(addDaysISO(n))}>
          {l}
        </button>
      ))}
    </div>
  );
}

function CompanyDetail({ company, onClose, updateCompany, addHistorial, deleteCompany, meetings, setShowNewMeeting, removeMeeting, retryMeetingSync, setShowWhatsApp, stopWhatsAppSequence, askConfirm, setLogFor, abrirCotizador }) {
  const [tab, setTab] = useState("gestion");
  const [note, setNote] = useState("");
  const [f, setF] = useState({});
  useEffect(() => {
    setF({
      _id: company.id,
      empresa: company.empresa || "",
      nombreFantasia: company.nombreFantasia || "",
      cuit: company.cuit || "",
      contacto: company.contacto || "",
      telefono: company.telefono || "",
      mail: company.mail || "",
      rubro: company.rubro || "",
      capitas: company.capitas || "",
      proximaAccion: company.proximaAccion || "",
      fechaProximaAccion: company.fechaProximaAccion || "",
    });
    setNote("");
  }, [company.id]);
  // Mantener sincronizados los campos que pueden cambiar desde afuera (modal de actividad, cotizador).
  useEffect(() => {
    setF((p) => ({ ...p, proximaAccion: company.proximaAccion || "", fechaProximaAccion: company.fechaProximaAccion || "", capitas: company.capitas || "" }));
  }, [company.proximaAccion, company.fechaProximaAccion, company.capitas]);

  // Si la ficha se cierra (Esc, clic afuera) con un campo todavía en edición,
  // lo guardamos igual: ningún cambio se pierde por no haber salido del campo.
  const latest = useRef(null);
  latest.current = { f, company };
  useEffect(
    () => () => {
      const { f: ff, company: cc } = latest.current;
      if (ff._id !== cc.id) return;
      const patch = {};
      Object.keys(ff).forEach((k) => {
        if (k !== "_id" && ff[k] !== (cc[k] || "") && !(k === "empresa" && !ff[k].trim())) patch[k] = ff[k];
      });
      if (Object.keys(patch).length) updateCompany(cc.id, patch);
    },
    []
  );

  const commit = (k) => {
    if (f[k] === undefined || f[k] === (company[k] || "")) return;
    if (k === "empresa" && !f[k].trim()) return;
    updateCompany(company.id, { [k]: k === "empresa" ? f[k].trim() : f[k] });
  };
  const inp = (k, props = {}) => (
    <input className="input" value={f[k] ?? ""} onChange={(e) => setF({ ...f, [k]: e.target.value })} onBlur={() => commit(k)} {...props} />
  );
  const seq = getSequenceStatus(company);
  const idx = STAGES.findIndex((s) => s.key === company.stage);
  const timeline = company.historial || [];

  return (
    <Drawer onClose={onClose}>
      <div style={{ position: "sticky", top: 0, background: "var(--surface)", zIndex: 2, borderBottom: "1px solid var(--border)" }}>
        <div className="row between" style={{ padding: "16px 18px 10px", alignItems: "flex-start" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-.01em" }}>{company.empresa}</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
              {[company.nombreFantasia && company.nombreFantasia !== company.empresa ? company.nombreFantasia : null, company.cuit ? `CUIT ${company.cuit}` : "Sin CUIT"].filter(Boolean).join(" · ")}
            </div>
            <div className="row wrap" style={{ gap: 6, marginTop: 8 }}>
              <button
                style={{ background: "none", border: 0, padding: 0, cursor: "pointer" }}
                title="Cambiar prioridad"
                onClick={() => updateCompany(company.id, { tier: company.tier === "caliente" ? "tibio" : "caliente" })}
              >
                <TierBadge tier={company.tier} />
              </button>
              <StageChip stage={company.stage} />
              <AgingChip c={company} />
              {company.motivoPerdida && <Chip tone="neutral">{company.motivoPerdida}</Chip>}
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar"><X size={16} /></button>
        </div>
        {/* Stepper de etapas */}
        <div style={{ display: "flex", gap: 3, padding: "0 18px 12px" }}>
          {STAGES.filter((s) => s.key !== "perdido").map((s, i) => {
            const done = company.stage !== "perdido" && i <= idx;
            return (
              <button
                key={s.key}
                onClick={() => updateCompany(company.id, { stage: s.key })}
                title={s.label}
                style={{ flex: 1, height: 26, border: 0, borderRadius: 6, cursor: "pointer", fontSize: 10.5, fontWeight: 700, background: done ? (s.key === "ganado" ? "var(--good)" : "var(--accent)") : "var(--surface-3)", color: done ? "#fff" : "var(--muted)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", padding: "0 3px" }}
              >
                {s.label.split(" ")[0]}
              </button>
            );
          })}
          <button
            onClick={() => updateCompany(company.id, { stage: "perdido" })}
            title="Marcar como perdida"
            style={{ width: 30, height: 26, border: 0, borderRadius: 6, cursor: "pointer", background: company.stage === "perdido" ? "var(--bad)" : "var(--surface-3)", color: company.stage === "perdido" ? "#fff" : "var(--muted)" }}
          >
            <XCircle size={13} />
          </button>
        </div>
        <div className="row" style={{ gap: 6, padding: "0 18px 12px" }}>
          <Btn variant="wa" size="sm" icon={MessageCircle} disabled={!company.telefono} onClick={() => setShowWhatsApp(company.id)}>WhatsApp</Btn>
          {company.telefono && (
            <a className="btn btn-outline btn-sm" href={`tel:+${normalizePhoneAR(company.telefono)}`} onClick={() => setLogFor({ companyId: company.id, tipo: "llamada" })}>
              <Phone size={13} /> Llamar
            </a>
          )}
          {company.mail && (
            <a className="btn btn-outline btn-sm" href={`mailto:${company.mail}`} onClick={() => setLogFor({ companyId: company.id, tipo: "mail" })}>
              <Mail size={13} /> Mail
            </a>
          )}
          <Btn size="sm" icon={CalIcon} onClick={() => setShowNewMeeting(company.id)}>Reunión</Btn>
          <Btn size="sm" icon={Calculator} onClick={() => abrirCotizador({ tipo: "empresa", id: company.id, label: company.empresa })}>Cotizar</Btn>
        </div>
        <div className="seg" style={{ margin: "0 18px 10px" }}>
          {[["gestion", "Gestión"], ["historial", `Historial (${timeline.length})`], ["datos", "Datos"]].map(([k, l]) => (
            <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: 18 }} className="stack">
        {tab === "gestion" && (
          <>
            <div className="card" style={{ padding: 14, boxShadow: "none" }}>
              <div className="label" style={{ marginBottom: 6 }}>Próxima acción</div>
              <div className="row" style={{ gap: 8 }}>
                {inp("proximaAccion", { placeholder: "Ej: llamar para confirmar cápitas", style: { flex: 1 } })}
                <input
                  type="date"
                  className="input"
                  style={{ width: 150 }}
                  value={f.fechaProximaAccion || ""}
                  onChange={(e) => setF({ ...f, fechaProximaAccion: e.target.value })}
                  onBlur={() => commit("fechaProximaAccion")}
                />
              </div>
              <QuickDates onPick={(d) => { setF({ ...f, fechaProximaAccion: d }); updateCompany(company.id, { fechaProximaAccion: d }); }} />
            </div>

            <div className="grid g2" style={{ gap: 10 }}>
              <Field label="Cápitas estimadas / cerradas">{inp("capitas", { type: "number", min: 0, placeholder: "Ej: 15" })}</Field>
              <Field label="Plan / $ mensual cotizado">
                <div className="input" style={{ background: "var(--surface-2)", color: company.planCotizado ? "var(--ink)" : "var(--muted)" }}>
                  {company.planCotizado ? `${company.planCotizado} · ${money(company.montoMensual)}` : "Sin cotización"}
                </div>
              </Field>
            </div>
            {num(company.capitas) > 0 && num(company.capitas) < MIN_CAPITAS_PYME && <div className="note t-warn">La línea PYME requiere desde {MIN_CAPITAS_PYME} cápitas (titulares + familiares).</div>}

            <div>
              <div className="label">Registrar actividad</div>
              <div className="row wrap" style={{ gap: 6 }}>
                {["llamada", "mail", "reunion", "propuesta"].map((t) => {
                  const I = TIPOS_ACT[t].icon;
                  return (
                    <Btn key={t} size="sm" icon={I} onClick={() => setLogFor({ companyId: company.id, tipo: t })}>{TIPOS_ACT[t].label}</Btn>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="label">Nota rápida</div>
              <div className="row" style={{ gap: 6 }}>
                <input
                  className="input"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ej: habló con el dueño, pidió cotización… (Enter para guardar)"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && note.trim()) {
                      addHistorial(company.id, note.trim(), "nota");
                      setNote("");
                    }
                  }}
                />
                <button className="icon-btn" style={{ width: 38, height: 38 }} onClick={() => { if (note.trim()) { addHistorial(company.id, note.trim(), "nota"); setNote(""); } }} aria-label="Guardar nota">
                  <Save size={15} />
                </button>
              </div>
            </div>

            {company.telefono && (
              <div className="row between tile">
                <SequenceBadge seq={seq} />
                <button className="btn btn-ghost btn-sm" onClick={() => stopWhatsAppSequence(company.id, !company.waSequenceStopped)}>
                  {company.waSequenceStopped ? "Reactivar secuencia" : "Detener secuencia"}
                </button>
              </div>
            )}

            <CotizacionesList items={company.cotizaciones} />

            {company.nota && <div className="note t-accent">{company.nota}</div>}

            {meetings.length > 0 && (
              <div>
                <div className="label">Reuniones</div>
                <div className="stack-sm">
                  {meetings.map((m) => (
                    <div key={m.id} className="tile row between" style={{ fontSize: 12.5 }}>
                      <span className="row" style={{ gap: 6 }}>
                        <Clock size={12} /> {fmtFecha(m.fecha)} {m.hora} — {m.notas || "sin notas"}
                        {m.syncStatus === "synced" && <Link2 size={12} color="var(--accent)" />}
                        {m.syncStatus === "syncing" && <RefreshCw size={12} className="spin" />}
                        {m.syncStatus === "error" && (
                          <button className="btn btn-ghost btn-sm" style={{ color: "var(--bad)", padding: "0 4px" }} onClick={() => retryMeetingSync(m)}>Reintentar sync</button>
                        )}
                      </span>
                      <button className="icon-btn" style={{ width: 24, height: 24 }} onClick={() => removeMeeting(m)} aria-label="Borrar reunión"><Trash2 size={12} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {timeline.length > 0 && (
              <div>
                <div className="row between"><span className="label">Últimos movimientos</span><button className="btn btn-ghost btn-sm" onClick={() => setTab("historial")}>Ver todo</button></div>
                <Timeline items={timeline.slice(0, 4)} />
              </div>
            )}
          </>
        )}

        {tab === "historial" && (timeline.length ? <Timeline items={timeline} /> : <EmptyNote>Sin movimientos todavía.</EmptyNote>)}

        {tab === "datos" && (
          <>
            <Field label="Razón social">{inp("empresa")}</Field>
            <Field label="Nombre de fantasía">{inp("nombreFantasia", { placeholder: "Nombre comercial, si es distinto" })}</Field>
            <div className="grid g2" style={{ gap: 10 }}>
              <Field label="CUIT">{inp("cuit", { placeholder: "30-12345678-9" })}</Field>
              <Field label="Rubro">{inp("rubro", { placeholder: "Ej: comercio, salud, construcción" })}</Field>
            </div>
            <Field label="Contacto">{inp("contacto", { placeholder: "Nombre y apellido" })}</Field>
            <div className="grid g2" style={{ gap: 10 }}>
              <Field label="Teléfono">{inp("telefono")}</Field>
              <Field label="Mail">{inp("mail")}</Field>
            </div>
            {company.fechaAlta && <div className="muted" style={{ fontSize: 12 }}>Fecha de alta: {fmtFecha(company.fechaAlta, { day: "2-digit", month: "2-digit", year: "numeric" })}</div>}
            <div className="divider" />
            <Btn variant="danger" icon={Trash2} onClick={() => askConfirm(`¿Eliminar ${company.empresa} de tu cartera?`, () => deleteCompany(company.id))}>Eliminar empresa</Btn>
          </>
        )}
      </div>
    </Drawer>
  );
}

function Timeline({ items }) {
  return (
    <div className="tl">
      {items.map((h, i) => {
        const t = tipoDe(h);
        const I = TIPOS_ACT[t]?.icon || PencilLine;
        const tone = t === "whatsapp" ? "t-good" : t === "propuesta" ? "t-warn" : t === "reunion" ? "t-info" : t === "llamada" ? "t-accent" : "";
        return (
          <div key={i} className="tl-item">
            <span className={"tl-dot " + tone}><I size={13} /></span>
            <div style={{ minWidth: 0, fontSize: 13 }}>
              <div style={{ color: "var(--ink)" }}>{h.texto}</div>
              <div className="muted" style={{ fontSize: 11.5 }}>{fmtFecha(h.fecha, { day: "2-digit", month: "short", year: "numeric" })} · {fmtRelativo(h.fecha)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ================================================= Registrar actividad ===

function LogActividadModal({ preset, companies, onClose, onSave }) {
  const [companyId, setCompanyId] = useState(preset.companyId || "");
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState(preset.tipo || "llamada");
  const [texto, setTexto] = useState(preset.texto || "");
  const c = companies.find((x) => x.id === companyId);
  const [proxima, setProxima] = useState("");
  const [fecha, setFecha] = useState(addDaysISO(3));
  const [stage, setStage] = useState("");
  const [programar, setProgramar] = useState(true);

  const sugerencias = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return [];
    return companies.filter((x) => x.empresa.toLowerCase().includes(q) || (x.contacto || "").toLowerCase().includes(q)).slice(0, 6);
  }, [busca, companies]);

  // Sugerencia de etapa según el tipo de actividad.
  useEffect(() => {
    if (!c) return;
    const i = STAGES.findIndex((s) => s.key === c.stage);
    const target = tipo === "propuesta" ? "propuesta" : tipo === "reunion" ? "reunion" : (tipo === "llamada" || tipo === "mail") && c.stage === "prospeccion" ? "contacto" : "";
    const ti = STAGES.findIndex((s) => s.key === target);
    setStage(target && ti > i && isOpen(c) ? target : "");
  }, [tipo, companyId]);

  return (
    <Modal title="Registrar actividad" onClose={onClose} width={520}>
      <div className="stack">
        {c ? (
          <div className="tile row between">
            <div>
              <div style={{ fontWeight: 700 }}>{c.empresa}</div>
              <div className="muted" style={{ fontSize: 12 }}>{STAGE_BY_KEY[c.stage]?.label}{c.contacto ? ` · ${c.contacto}` : ""}</div>
            </div>
            {!preset.companyId && <button className="btn btn-ghost btn-sm" onClick={() => setCompanyId("")}>Cambiar</button>}
          </div>
        ) : (
          <div>
            <span className="label">Empresa</span>
            <SearchBox value={busca} onChange={setBusca} placeholder="Escribí para buscar…" />
            <div className="stack-sm" style={{ marginTop: 6 }}>
              {sugerencias.map((x) => (
                <button key={x.id} className="item" onClick={() => { setCompanyId(x.id); setBusca(""); }}>
                  <Building2 size={14} /> <span style={{ fontWeight: 600 }}>{x.empresa}</span> <span className="muted" style={{ fontSize: 12 }}>{x.contacto}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <span className="label">Tipo</span>
          <div className="row wrap" style={{ gap: 6 }}>
            {TIPOS_LOG.map((t) => {
              const I = TIPOS_ACT[t].icon;
              return (
                <button key={t} className={"btn btn-sm " + (tipo === t ? "btn-primary" : "btn-outline")} onClick={() => setTipo(t)}>
                  <I size={13} /> {TIPOS_ACT[t].label}
                </button>
              );
            })}
          </div>
        </div>

        <Field label="Detalle (opcional)">
          <textarea className="textarea" rows={2} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Ej: atendió RRHH, son 18 empleados, pidió cotización 6500" />
        </Field>

        <div className="tile">
          <label className="row" style={{ gap: 8, fontWeight: 600, cursor: "pointer" }}>
            <input type="checkbox" checked={programar} onChange={(e) => setProgramar(e.target.checked)} /> Programar próxima acción
            {c && c.proximaAccion && <span className="muted" style={{ fontWeight: 500, fontSize: 12 }}>(reemplaza: “{c.proximaAccion}”)</span>}
          </label>
          {programar && (
            <>
              <div className="grid g2" style={{ gap: 10, marginTop: 10 }}>
                <Field label="Qué">
                  <input className="input" value={proxima} onChange={(e) => setProxima(e.target.value)} placeholder="Ej: enviar propuesta" />
                </Field>
                <Field label="Cuándo">
                  <input type="date" className="input" value={fecha} onChange={(e) => setFecha(e.target.value)} />
                </Field>
              </div>
              <QuickDates onPick={setFecha} />
            </>
          )}
        </div>

        {c && isOpen(c) && (
          <Field label="Mover a etapa">
            <select className="select full" value={stage} onChange={(e) => setStage(e.target.value)}>
              <option value="">Mantener en {STAGE_BY_KEY[c.stage]?.label}</option>
              {STAGES.filter((s) => s.key !== c.stage).map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </Field>
        )}

        <Btn
          variant="primary"
          icon={Check}
          disabled={!c}
          style={{ width: "100%" }}
          onClick={() =>
            onSave({
              companyId,
              tipo,
              texto: texto.trim(),
              programar,
              proximaAccion: proxima.trim() || (fecha ? "Seguimiento" : ""),
              fechaProximaAccion: fecha,
              stage,
            })
          }
        >
          Guardar {TIPOS_ACT[tipo].label.toLowerCase()}
        </Btn>
      </div>
    </Modal>
  );
}

function MotivoPerdidaModal({ company, onClose, onSave }) {
  const [motivo, setMotivo] = useState(company.motivoPerdida || MOTIVOS_PERDIDA[0]);
  const [detalle, setDetalle] = useState("");
  return (
    <Modal title={`¿Por qué se perdió ${company.empresa}?`} onClose={onClose}>
      <div className="stack">
        <div className="stack-sm">
          {MOTIVOS_PERDIDA.map((m) => (
            <label key={m} className="item" style={{ cursor: "pointer", borderColor: motivo === m ? "var(--accent)" : "transparent" }}>
              <input type="radio" name="motivo" checked={motivo === m} onChange={() => setMotivo(m)} /> {m}
            </label>
          ))}
        </div>
        <Field label="Detalle (opcional)">
          <input className="input" value={detalle} onChange={(e) => setDetalle(e.target.value)} placeholder="Ej: renovó con su prepaga por 12 meses" />
        </Field>
        <div className="muted" style={{ fontSize: 12 }}>Esto alimenta el indicador “Motivos de pérdida” para detectar patrones.</div>
        <Btn variant="primary" style={{ width: "100%" }} onClick={() => onSave(motivo, detalle.trim())}>Guardar motivo</Btn>
      </div>
    </Modal>
  );
}
