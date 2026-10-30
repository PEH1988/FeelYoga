
// ================================================================ Mi día ===

function MiDia({ companies, settings, metrics, pendientes, agenda, actividad, personas, setSelectedId, setShowWhatsApp, go, setLogFor, setShowNewMeeting, setShowNewCompany, setSelectedPersonaId, setShowPersonaWhatsApp, cotPendientes = [], abrirPorVincular }) {
  const hoy = hoyISO();
  const act = actividad.get(hoy) || { llamada: 0, whatsapp: 0, mail: 0, reunion: 0, propuesta: 0 };
  const obj = settings.objetivos;
  const metas = [
    { key: "llamada", label: "Llamadas", icon: Phone },
    { key: "whatsapp", label: "WhatsApp", icon: MessageCircle },
    { key: "reunion", label: "Reuniones", icon: Users },
    { key: "propuesta", label: "Propuestas", icon: FileText },
  ];
  const cumplidas = metas.filter((m) => act[m.key] >= (obj[m.key] || 0)).length;
  const nombre = (settings.asesor || "").split(" ")[0];
  const metaOk = metrics.faltan === 0;

  // Racha: días hábiles consecutivos con al menos un toque.
  const racha = useMemo(() => {
    let n = 0;
    const d = new Date();
    if (totalToques(actividad.get(isoLocal(d))) === 0) d.setDate(d.getDate() - 1);
    for (let i = 0; i < 120; i++) {
      if (d.getDay() === 0 || d.getDay() === 6) {
        d.setDate(d.getDate() - 1);
        continue;
      }
      if (totalToques(actividad.get(isoLocal(d))) > 0) n++;
      else break;
      d.setDate(d.getDate() - 1);
    }
    return n;
  }, [actividad]);

  return (
    <div className="stack">
      <PageHeader title={`${saludo()}, ${nombre}`} subtitle={`${capitalizar(fechaLarga())} · ${metrics.habiles} días hábiles para cerrar el mes`}>
        <Btn variant="primary" icon={Activity} onClick={() => setLogFor({})}>Registrar actividad</Btn>
        <Btn icon={CalIcon} onClick={() => setShowNewMeeting(true)}>Agendar reunión</Btn>
        <Btn icon={Plus} onClick={() => setShowNewCompany(true)}>Empresa</Btn>
      </PageHeader>

      <div className="grid g3">
        <div className="hero">
          <div className="row between">
            <span style={{ fontWeight: 700, fontSize: 14 }}>Meta del mes</span>
            <span className="chip" style={{ background: "rgba(255,255,255,.12)", color: "#fff" }}>{metrics.metaMensual} cápitas</span>
          </div>
          <div className="row" style={{ gap: 18, marginTop: 10 }}>
            <Ring value={metrics.capitasEsteMes} max={metrics.metaMensual} size={128} stroke={11} color={metaOk ? "#7BE0A4" : "#7FE3D5"}>
              <div className="tnum" style={{ fontSize: 34, fontWeight: 800, lineHeight: 1 }}>{fmtN(metrics.capitasEsteMes)}</div>
              <div style={{ fontSize: 11, color: "#A9BCD3", marginTop: 2 }}>de {metrics.metaMensual}</div>
            </Ring>
            <div style={{ fontSize: 13, color: "#D6E2F0", lineHeight: 1.5, minWidth: 0 }}>
              {metaOk ? (
                <>🎉 <strong style={{ color: "#fff" }}>Meta alcanzada.</strong> Lo que sumes ahora va al premio trimestral.</>
              ) : (
                <>
                  Faltan <strong style={{ color: "#fff" }}>{fmtN(metrics.faltan)} cápitas</strong>: ≈ {metrics.porDiaHabil.toLocaleString("es-AR", { maximumFractionDigits: 1 })} por día hábil.
                  <div style={{ marginTop: 6, color: "#A9BCD3", fontSize: 12 }}>Forecast ponderado del pipeline: {fmtN(metrics.forecast)} cápitas.</div>
                </>
              )}
            </div>
          </div>
        </div>

        <Card title="Objetivos de hoy" icon={Target} className="span2" action={<Chip tone={cumplidas === metas.length ? "good" : "neutral"}>{cumplidas}/{metas.length} cumplidos</Chip>}>
          <div className="grid g4" style={{ gap: 12 }}>
            {metas.map((m) => {
              const v = act[m.key];
              const o = obj[m.key] || 0;
              const ok = v >= o && o > 0;
              return (
                <div key={m.key} className="tile">
                  <div className="row between">
                    <span className="row ink2" style={{ gap: 6, fontSize: 12.5, fontWeight: 600 }}>
                      <m.icon size={14} /> {m.label}
                    </span>
                    {ok && <CheckCircle2 size={15} color="var(--good)" aria-label="cumplido" />}
                  </div>
                  <div className="tnum" style={{ fontSize: 24, fontWeight: 800, margin: "4px 0 6px" }}>
                    {v}
                    <span className="muted" style={{ fontSize: 13, fontWeight: 600 }}> / {o}</span>
                  </div>
                  <ProgressBar value={v} max={o} tone={ok ? "good" : undefined} height={6} />
                  {m.key !== "whatsapp" && (
                    <button className="btn btn-ghost btn-sm" style={{ marginTop: 6, padding: "3px 6px" }} onClick={() => setLogFor({ tipo: m.key })}>
                      <Plus size={12} /> Registrar
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <div className="row between wrap muted" style={{ fontSize: 12, marginTop: 10 }}>
            <span>Llamadas, mails y propuestas se cuentan al registrarlas; los WhatsApp se cuentan solos al enviarlos desde el CRM.</span>
            {racha > 1 && <Chip tone="warn" icon={Flame}>Racha: {racha} días hábiles activos</Chip>}
          </div>
        </Card>
      </div>

      {cotPendientes.length > 0 && (
        <div className="note t-warn row between wrap" style={{ gap: 10 }}>
          <span>
            <strong>{cotPendientes.length} cotización{cotPendientes.length > 1 ? "es" : ""} del cotizador</strong> sin ficha en el CRM ({cotPendientes.slice(0, 3).map((q) => q.cliente || "sin nombre").join(", ")}{cotPendientes.length > 3 ? "…" : ""}). Vinculalas para hacerles seguimiento.
          </span>
          <Btn size="sm" variant="primary" onClick={abrirPorVincular}>Vincular ahora</Btn>
        </div>
      )}

      <div className="grid g3">
        <Card title="Reuniones de hoy" icon={CalIcon} action={<LinkBtn onClick={() => go("agenda")}>Agenda</LinkBtn>}>
          {agenda.hoy.length === 0 ? (
            <EmptyNote>
              Sin reuniones hoy.
              {agenda.upcoming[0] && <div style={{ marginTop: 4 }}>Próxima: {agenda.upcoming[0].empresa} · {fmtFecha(agenda.upcoming[0].fecha)} {agenda.upcoming[0].hora}</div>}
            </EmptyNote>
          ) : (
            <div className="stack-sm">
              {agenda.hoy.map((m) => (
                <div key={m.id} className="item" onClick={() => m.companyId && setSelectedId(m.companyId)}>
                  <span className="chip t-warn tnum" style={{ fontSize: 13 }}>{m.hora}</span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.empresa}</div>
                    {m.notas && <div className="muted" style={{ fontSize: 12 }}>{m.notas}</div>}
                  </div>
                  {m.companyId && (
                    <button className="btn btn-soft btn-sm" onClick={(e) => { e.stopPropagation(); setLogFor({ companyId: m.companyId, tipo: "reunion" }); }}>
                      Hecha
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Acciones vencidas y de hoy" icon={AlertTriangle} className="span2" action={<Chip tone={pendientes.vencidas.length ? "bad" : "good"}>{pendientes.vencidas.length}</Chip>}>
          {pendientes.vencidas.length === 0 ? (
            <EmptyNote>Estás al día. Cargá una “próxima acción” en cada empresa activa para que aparezca acá.</EmptyNote>
          ) : (
            <div className="stack-sm">
              {pendientes.vencidas.slice(0, 7).map((c) => {
                const atraso = diasEntre(c.fechaProximaAccion, hoyISO());
                return (
                  <div key={c.id} className="item" onClick={() => setSelectedId(c.id)}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="row" style={{ gap: 6 }}>
                        <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.empresa}</span>
                        <StageChip stage={c.stage} />
                      </div>
                      <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                        {c.proximaAccion || "Acción sin detalle"} · <span style={{ color: atraso > 0 ? "var(--bad)" : "var(--warn)", fontWeight: 600 }}>{atraso > 0 ? `vencida hace ${atraso} d` : "hoy"}</span>
                      </div>
                    </div>
                    <button className="icon-btn wa" disabled={!c.telefono} title="WhatsApp" onClick={(e) => { e.stopPropagation(); setShowWhatsApp(c.id); }}>
                      <MessageCircle size={14} />
                    </button>
                    <button className="btn btn-soft btn-sm" onClick={(e) => { e.stopPropagation(); setLogFor({ companyId: c.id, texto: c.proximaAccion }); }}>
                      <Check size={13} /> Hecho
                    </button>
                  </div>
                );
              })}
              {pendientes.vencidas.length > 7 && <div className="muted" style={{ fontSize: 12 }}>y {pendientes.vencidas.length - 7} más — filtralas en Cartera.</div>}
            </div>
          )}
        </Card>
      </div>

      <div className="grid g3">
        <Card title="Oportunidades enfriándose" icon={Timer} action={<LinkBtn onClick={() => go("pipeline")}>Pipeline</LinkBtn>}>
          {pendientes.enRiesgo.length === 0 ? (
            <EmptyNote>Ninguna oportunidad avanzada lleva 7+ días sin actividad.</EmptyNote>
          ) : (
            <div className="stack-sm">
              {pendientes.enRiesgo.slice(0, 5).map((c) => (
                <button key={c.id} className="item" onClick={() => setSelectedId(c.id)}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.empresa}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{STAGE_BY_KEY[c.stage].label}{num(c.capitas) ? ` · ${c.capitas} cáp.` : ""}</div>
                  </div>
                  <AgingChip c={c} />
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card title="Seguimientos WhatsApp" icon={MessageCircle} action={<LinkBtn onClick={() => go("campana")}>Campaña</LinkBtn>}>
          {pendientes.waDue.length === 0 ? (
            <EmptyNote>No hay seguimientos pendientes de la secuencia.</EmptyNote>
          ) : (
            <div className="stack-sm">
              {pendientes.waDue.slice(0, 5).map(({ c, seq }) => (
                <button key={c.id} className="item" onClick={() => setShowWhatsApp(c.id)}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.empresa}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{seq.step.label}</div>
                  </div>
                  <MessageCircle size={15} color="var(--wa)" />
                </button>
              ))}
              {pendientes.waDue.length > 5 && <div className="muted" style={{ fontSize: 12 }}>y {pendientes.waDue.length - 5} más en Campaña.</div>}
            </div>
          )}
        </Card>

        <Card title="Calientes sin contactar" icon={Flame} action={<Chip tone="bad">{pendientes.calientes.length}</Chip>}>
          {pendientes.calientes.length === 0 ? (
            <EmptyNote>Ya contactaste a todos los prospectos calientes. 💪</EmptyNote>
          ) : (
            <div className="stack-sm">
              {pendientes.calientes.slice(0, 5).map((c) => (
                <div key={c.id} className="item" onClick={() => setSelectedId(c.id)}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.empresa}</div>
                    <div className="muted" style={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.contacto || "Sin contacto"}</div>
                  </div>
                  <button className="icon-btn wa" title="Primer WhatsApp" onClick={(e) => { e.stopPropagation(); setShowWhatsApp(c.id); }}>
                    <MessageCircle size={14} />
                  </button>
                  <button className="icon-btn" title="Registrar llamada" onClick={(e) => { e.stopPropagation(); setLogFor({ companyId: c.id, tipo: "llamada" }); }}>
                    <Phone size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {(pendientes.b2c.length > 0 || personas.some((p) => p.status === "interesado")) && (
        <Card title="Particulares para seguir hoy" icon={Heart} action={<LinkBtn onClick={() => go("personas")}>Pacientes</LinkBtn>}>
          {pendientes.b2c.length === 0 ? (
            <EmptyNote>
              Tenés {personas.filter((p) => p.status === "interesado").length} interesados sin fecha de seguimiento. Abrí su ficha y cargale una fecha.
            </EmptyNote>
          ) : (
            <div className="grid g3" style={{ gap: 8 }}>
              {pendientes.b2c.slice(0, 9).map((p) => (
                <div key={p.id} className="item" onClick={() => setSelectedPersonaId(p.id)}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nombre}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{PERSONA_STATUS.find((s) => s.key === p.status)?.label} · seguimiento {fmtRelativo(p.seguimiento)}</div>
                  </div>
                  <button className="icon-btn wa" disabled={!p.telefono} onClick={(e) => { e.stopPropagation(); setShowPersonaWhatsApp(p.id); }}>
                    <MessageCircle size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// ============================================================ Indicadores ===

function Tablero({ companies, settings, metrics, actividad, meetings, setSelectedId, go }) {
  const ch = useChart();
  const [rango, setRango] = useState(8);

  const semanas = useMemo(() => {
    const out = [];
    const lunes = new Date();
    lunes.setHours(0, 0, 0, 0);
    lunes.setDate(lunes.getDate() - ((lunes.getDay() + 6) % 7));
    for (let w = rango - 1; w >= 0; w--) {
      const ini = new Date(lunes);
      ini.setDate(ini.getDate() - w * 7);
      const tot = { llamada: 0, whatsapp: 0, mail: 0, reunion: 0, propuesta: 0 };
      for (let i = 0; i < 7; i++) {
        const d = new Date(ini);
        d.setDate(d.getDate() + i);
        const o = actividad.get(isoLocal(d));
        if (o) Object.keys(tot).forEach((k) => (tot[k] += o[k]));
      }
      out.push({ semana: `${pad2(ini.getDate())}/${pad2(ini.getMonth() + 1)}`, tooltipLabel: `Semana del ${ini.getDate()} de ${MESES_ES[ini.getMonth()]}`, toques: totalToques(tot), ...tot });
    }
    return out;
  }, [actividad, rango]);
  const estaSemana = semanas[semanas.length - 1];
  const semanaAnterior = semanas[semanas.length - 2];
  const delta = semanaAnterior && semanaAnterior.toques ? Math.round(((estaSemana.toques - semanaAnterior.toques) / semanaAnterior.toques) * 100) : null;

  const funnelStages = STAGES.filter((s) => s.key !== "perdido");
  // Embudo acumulado: una empresa en Propuesta ya pasó por Contacto y Reunión.
  const alcanzaron = useMemo(() => {
    const idx = Object.fromEntries(funnelStages.map((s, i) => [s.key, i]));
    const counts = funnelStages.map(() => 0);
    companies.forEach((c) => {
      let i = idx[c.stage];
      if (c.stage === "perdido") {
        const sd = c.stageDates || {};
        i = Math.max(-1, ...funnelStages.filter((s) => sd[s.key]).map((s) => idx[s.key]));
        if (i < 0) i = 1; // perdida sin rastro: al menos hubo contacto
      }
      for (let k = 0; k <= i; k++) counts[k]++;
    });
    return counts;
  }, [companies]);

  const top = useMemo(
    () => companies.filter((c) => ["propuesta", "negociacion"].includes(c.stage)).sort((a, b) => num(b.capitas) * STAGE_BY_KEY[b.stage].prob - num(a.capitas) * STAGE_BY_KEY[a.stage].prob).slice(0, 6),
    [companies]
  );

  const tasaReunion = useMemo(() => {
    const desde = addDaysISO(-30);
    const r = meetings.filter((m) => m.fecha >= desde && m.fecha <= hoyISO()).length;
    return r;
  }, [meetings]);

  return (
    <div className="stack">
      <PageHeader title="Indicadores de gestión" subtitle={`Resultados, pipeline y actividad · ${metrics.qLabel}`}>
        <Btn icon={Download} onClick={() => exportarExcel(kpiFilas(metrics, semanas), "KPIs", `kpis-${hoyISO()}.xlsx`)}>Exportar KPIs</Btn>
      </PageHeader>

      <div className="grid g6">
        <Kpi icon={Target} label="Cápitas del mes" value={fmtN(metrics.capitasEsteMes)} sub={`Meta ${metrics.metaMensual} · proyección ${fmtN(metrics.proyeccionMes)}`} tone={metrics.faltan === 0 ? "good" : "accent"} />
        <Kpi icon={TrendingUp} label="Forecast ponderado" value={fmtN(metrics.forecast)} sub={`${fmtN(metrics.capitasPipeline)} cápitas en pipeline`} tone="info" onClick={() => go("pipeline")} />
        <Kpi icon={Trophy} label="Tasa de cierre" value={metrics.winRate === null ? "—" : `${Math.round(metrics.winRate * 100)}%`} sub={`${metrics.ganadasN} ganadas · ${metrics.perdidasN} perdidas`} tone="good" />
        <Kpi icon={Users} label="Ticket promedio" value={metrics.ticket === null ? "—" : metrics.ticket.toLocaleString("es-AR", { maximumFractionDigits: 1 })} sub="cápitas por empresa ganada" tone="accent" />
        <Kpi icon={Clock} label="Ciclo de venta" value={metrics.cicloPromedio === null ? "—" : `${Math.round(metrics.cicloPromedio)} d`} sub="del primer contacto al cierre" tone="warn" />
        <Kpi icon={Briefcase} label="Cartera ganada / mes" value={metrics.mrrGanado ? moneyK(metrics.mrrGanado) : "—"} sub={metrics.mrrPipeline ? `+ ${moneyK(metrics.mrrPipeline)} ponderado en curso` : "según cotizaciones guardadas"} tone="good" />
      </div>

      <div className="grid g3">
        <Card title="Cápitas ganadas por mes" icon={Award} className="span2" action={<span className="muted" style={{ fontSize: 12 }}>Línea punteada: meta mensual</span>}>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.porMes} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={ch.grid} />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={{ fill: ch.axis, fontSize: 12 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: ch.axis, fontSize: 12 }} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: ch.grid, opacity: 0.5 }} />
                <ReferenceLine y={metrics.metaMensual} stroke={ch.ref} strokeDasharray="5 4" strokeWidth={1.5} />
                <Bar dataKey="capitas" name="Cápitas" radius={[4, 4, 0, 0]} maxBarSize={44}>
                  {metrics.porMes.map((d, i) => (
                    <Cell key={d.key} fill={i === metrics.porMes.length - 1 ? ch.accent : ch.accent2} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Escalera de comisión" icon={TrendingUp}>
          <div className="row" style={{ alignItems: "baseline", gap: 8, marginBottom: 10 }}>
            <span className="tnum" style={{ fontSize: 34, fontWeight: 800, color: "var(--accent-ink)" }}>{metrics.tier.pct}%</span>
            <span className="muted" style={{ fontSize: 12 }}>{metrics.tier.label}</span>
          </div>
          <div className="stack-sm">
            {ESCALA_COMISION.map((t) => {
              const actual = metrics.tier.pct === t.pct;
              return (
                <div key={t.pct} className="row between" style={{ padding: "6px 10px", borderRadius: 8, fontSize: 12.5, background: actual ? "var(--accent-soft)" : "var(--surface-2)", color: actual ? "var(--accent-ink)" : "var(--ink-2)", fontWeight: actual ? 700 : 500 }}>
                  <span>{t.hasta ? `${t.desde} a ${t.hasta} cápitas` : `Más de ${t.desde - 1} cápitas`}</span>
                  <span className="tnum">{t.pct}%</span>
                </div>
              );
            })}
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>
            {fmtN(metrics.capitasGanadas)} cápitas cerradas. {(() => {
              const next = ESCALA_COMISION.find((t) => t.desde > metrics.capitasGanadas);
              return next ? `Te faltan ${fmtN(next.desde - metrics.capitasGanadas)} para el ${next.pct}%.` : "Estás en el tramo máximo.";
            })()}
          </div>
        </Card>
      </div>

      <Card title={`Premios del trimestre · ${metrics.qLabel}`} icon={Award}>
        <div className="grid g2" style={{ gap: 28 }}>
          <div>
            <div className="row between">
              <span className="ink2" style={{ fontSize: 12.5, fontWeight: 600 }}>Cápitas netas</span>
              <span className="tnum" style={{ fontWeight: 800 }}>{fmtN(metrics.capitasNetasTrimestre)}</span>
            </div>
            <MilestoneBar value={metrics.capitasNetasTrimestre} max={170} marks={[96, 121, 151]} />
            <Chip tone={metrics.premioCapitas.sueldos > 0 ? "good" : "neutral"}>
              {metrics.premioCapitas.sueldos > 0 ? `Premio: ${metrics.premioCapitas.sueldos} sueldo${metrics.premioCapitas.sueldos > 1 ? "s" : ""} (${metrics.premioCapitas.label})` : metrics.premioCapitas.label}
            </Chip>
          </div>
          <div>
            <div className="row between">
              <span className="ink2" style={{ fontSize: 12.5, fontWeight: 600 }}>Empresas con más de 20 cápitas</span>
              <span className="tnum" style={{ fontWeight: 800 }}>{metrics.empresas20Trimestre}</span>
            </div>
            <MilestoneBar value={metrics.empresas20Trimestre} max={9} marks={[4, 6, 8]} />
            <Chip tone={metrics.premioEmpresas.sueldos > 0 ? "good" : "neutral"}>
              {metrics.premioEmpresas.sueldos > 0 ? `Premio: ${metrics.premioEmpresas.sueldos} sueldo${metrics.premioEmpresas.sueldos > 1 ? "s" : ""} (${metrics.premioEmpresas.label})` : metrics.premioEmpresas.label}
            </Chip>
          </div>
        </div>
        <div className="note t-accent" style={{ marginTop: 14 }}>
          Comisión OA (socio y no socio): 20% + 0,20 cápitas por voucher vendido para premios y comisiones de salud (5 OA = 1 cápita de salud).
        </div>
      </Card>

      <div className="grid g3">
        <Card title="Embudo de conversión" icon={ClipboardList} className="span2" action={<LinkBtn onClick={() => go("pipeline")}>Abrir pipeline</LinkBtn>}>
          <div className="stack-sm">
            {funnelStages.map((s, i) => {
              const n = alcanzaron[i];
              const conv = i > 0 && alcanzaron[i - 1] ? Math.round((n / alcanzaron[i - 1]) * 100) : null;
              return (
                <HBar
                  key={s.key}
                  label={s.label}
                  value={n}
                  max={alcanzaron[1] || 1}
                  tone={s.key === "ganado" ? "good" : s.key === "prospeccion" ? "muted" : undefined}
                  right={conv !== null ? `${fmtN(n)} · ${conv}%` : fmtN(n)}
                  title={`${s.label}: ${fmtN(n)} empresas llegaron a esta etapa`}
                />
              );
            })}
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>Empresas que alguna vez llegaron a cada etapa; el % es la conversión desde la etapa anterior. Prospección se muestra fuera de escala.</div>
        </Card>

        <Card title="Motivos de pérdida" icon={XCircle}>
          {metrics.motivos.length === 0 ? (
            <EmptyNote>Todavía no hay oportunidades perdidas. Cuando pases una a “Perdido” te vamos a pedir el motivo.</EmptyNote>
          ) : (
            <div className="stack-sm">
              {metrics.motivos.slice(0, 7).map(([m, n]) => (
                <HBar key={m} label={m} value={n} max={metrics.motivos[0][1]} tone="warn" />
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid g3">
        <Card
          title="Actividad comercial por semana"
          icon={Activity}
          className="span2"
          action={
            <div className="seg">
              {[4, 8, 12].map((n) => (
                <button key={n} className={rango === n ? "on" : ""} onClick={() => setRango(n)}>{n} sem</button>
              ))}
            </div>
          }
        >
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={semanas} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={ch.grid} />
                <XAxis dataKey="semana" tickLine={false} axisLine={false} tick={{ fill: ch.axis, fontSize: 12 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: ch.axis, fontSize: 12 }} />
                <Tooltip content={<ActividadTooltip />} cursor={{ fill: ch.grid, opacity: 0.5 }} />
                <Bar dataKey="toques" name="Toques" fill={ch.accent} radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="muted" style={{ fontSize: 12 }}>Toques = llamadas + WhatsApp + mails + reuniones + propuestas.</div>
        </Card>

        <Card title="Esta semana" icon={Zap}>
          <div className="row" style={{ alignItems: "baseline", gap: 8 }}>
            <span className="tnum" style={{ fontSize: 34, fontWeight: 800 }}>{estaSemana?.toques || 0}</span>
            <span className="muted">toques</span>
            {delta !== null && <Chip tone={delta >= 0 ? "good" : "bad"}>{delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}% vs. anterior</Chip>}
          </div>
          <table className="tbl" style={{ marginTop: 8 }}>
            <tbody>
              {["llamada", "whatsapp", "mail", "reunion", "propuesta"].map((k) => {
                const I = TIPOS_ACT[k].icon;
                return (
                  <tr key={k}>
                    <td style={{ padding: "7px 4px" }}>
                      <span className="row" style={{ gap: 8 }}><I size={14} /> {TIPOS_ACT[k].label}</span>
                    </td>
                    <td className="tnum strong" style={{ padding: "7px 4px", textAlign: "right" }}>{estaSemana?.[k] || 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>{tasaReunion} reuniones en los últimos 30 días.</div>
        </Card>
      </div>

      <div className="grid g2">
        <Card title="Top oportunidades para cerrar" icon={Zap} action={<span className="muted" style={{ fontSize: 12 }}>orden: cápitas × probabilidad</span>}>
          {top.length === 0 ? (
            <EmptyNote>Cuando una empresa pase a Propuesta o Negociación, aparece acá.</EmptyNote>
          ) : (
            <table className="tbl">
              <thead>
                <tr><th>Empresa</th><th>Etapa</th><th style={{ textAlign: "right" }}>Cápitas</th><th style={{ textAlign: "right" }}>$/mes</th></tr>
              </thead>
              <tbody>
                {top.map((c) => (
                  <tr key={c.id} className="click" onClick={() => setSelectedId(c.id)}>
                    <td className="strong">{c.empresa}</td>
                    <td><StageChip stage={c.stage} /></td>
                    <td className="tnum" style={{ textAlign: "right" }}>{num(c.capitas) || "—"}</td>
                    <td className="tnum" style={{ textAlign: "right" }}>{c.montoMensual ? moneyK(c.montoMensual) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="Composición de la cartera" icon={Building2} action={<LinkBtn onClick={() => go("empresas")}>Cartera</LinkBtn>}>
          <div className="grid g2" style={{ gap: 10 }}>
            <div className="tile"><div className="muted" style={{ fontSize: 12 }}>Empresas en cartera</div><div className="tnum" style={{ fontSize: 22, fontWeight: 800 }}>{fmtN(metrics.total)}</div></div>
            <div className="tile"><div className="muted" style={{ fontSize: 12 }}>Sin contactar</div><div className="tnum" style={{ fontSize: 22, fontWeight: 800 }}>{fmtN(metrics.byStage.prospeccion)}</div></div>
            <div className="tile"><div className="muted" style={{ fontSize: 12 }}>En conversación</div><div className="tnum" style={{ fontSize: 22, fontWeight: 800 }}>{fmtN(metrics.activos)}</div></div>
            <div className="tile"><div className="muted" style={{ fontSize: 12 }}>Calientes</div><div className="tnum" style={{ fontSize: 22, fontWeight: 800 }}>{fmtN(metrics.calientes)}</div></div>
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>
            Cobertura: contactaste {metrics.total ? Math.round(((metrics.total - metrics.byStage.prospeccion) / metrics.total) * 100) : 0}% de la base.
          </div>
          <div style={{ marginTop: 6 }}>
            <ProgressBar value={metrics.total - metrics.byStage.prospeccion} max={metrics.total} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function ActividadTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 10px", fontSize: 12, boxShadow: "var(--shadow-lg)", color: "var(--ink)" }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{d.tooltipLabel}</div>
      <div className="tnum">Toques: <strong>{d.toques}</strong></div>
      <div className="tnum" style={{ color: "var(--ink-2)" }}>
        {d.llamada} llamadas · {d.whatsapp} WA · {d.mail} mails · {d.reunion} reuniones · {d.propuesta} propuestas
      </div>
    </div>
  );
}

function kpiFilas(m, semanas) {
  return [
    { Indicador: "Cápitas del mes", Valor: m.capitasEsteMes },
    { Indicador: "Meta mensual", Valor: m.metaMensual },
    { Indicador: "Forecast ponderado (cápitas)", Valor: Math.round(m.forecast) },
    { Indicador: "Cápitas en pipeline", Valor: m.capitasPipeline },
    { Indicador: "Tasa de cierre", Valor: m.winRate === null ? "" : Math.round(m.winRate * 100) + "%" },
    { Indicador: "Ticket promedio (cápitas)", Valor: m.ticket === null ? "" : Number(m.ticket.toFixed(1)) },
    { Indicador: "Ciclo de venta (días)", Valor: m.cicloPromedio === null ? "" : Math.round(m.cicloPromedio) },
    { Indicador: "Cápitas netas trimestre", Valor: m.capitasNetasTrimestre },
    { Indicador: "Empresas +20 cápitas trimestre", Valor: m.empresas20Trimestre },
    { Indicador: "Comisión actual", Valor: m.tier.pct + "%" },
    ...semanas.map((s) => ({ Indicador: `Toques semana ${s.semana}`, Valor: s.toques })),
  ];
}
