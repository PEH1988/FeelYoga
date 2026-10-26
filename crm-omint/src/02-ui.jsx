
// ============================================================== Estilos ===

const APP_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
.crm {
  --bg:#F3F5F9; --surface:#FFFFFF; --surface-2:#F6F8FB; --surface-3:#EDF1F6; --border:#E2E7EF; --border-strong:#CBD3DF;
  --ink:#0F1B2D; --ink-2:#44546A; --muted:#6B788C;
  --brand:#0B2A4F; --accent:#0E8C7F; --accent-hover:#0B776C; --accent-soft:#E2F4F1; --accent-ink:#0A6B61;
  --good:#1E8A4C; --good-soft:#E3F3E9; --warn:#A8620A; --warn-soft:#FCF0DC; --bad:#C8372D; --bad-soft:#FBE7E5;
  --info:#2A6FC4; --info-soft:#E6EFFB; --wa:#1E8A4C;
  --side:#0B1E38; --side-2:#13294A; --side-ink:#AFC0D8; --side-active:#7FE3D5;
  --shadow:0 1px 2px rgba(15,27,45,.04),0 2px 8px rgba(15,27,45,.04);
  --shadow-lg:0 12px 40px rgba(15,27,45,.18);
  color-scheme: light;
}
.crm[data-theme="dark"] {
  --bg:#0B111B; --surface:#121A27; --surface-2:#172131; --surface-3:#1D293B; --border:#243147; --border-strong:#33435E;
  --ink:#E7EDF5; --ink-2:#AEBBCD; --muted:#8392A8;
  --brand:#E7EDF5; --accent:#2FB5A5; --accent-hover:#3CC7B6; --accent-soft:rgba(47,181,165,.14); --accent-ink:#62D4C5;
  --good:#45C07A; --good-soft:rgba(69,192,122,.14); --warn:#E5A646; --warn-soft:rgba(229,166,70,.14); --bad:#F07068; --bad-soft:rgba(240,112,104,.14);
  --info:#5A9FEF; --info-soft:rgba(90,159,239,.14); --wa:#45C07A;
  --side:#080D16; --side-2:#111A29; --side-ink:#93A3BA; --side-active:#62D4C5;
  --shadow:0 1px 2px rgba(0,0,0,.3); --shadow-lg:0 12px 40px rgba(0,0,0,.5);
  color-scheme: dark;
}
.crm { background:var(--bg); color:var(--ink); font-family:'Inter',system-ui,-apple-system,sans-serif; font-size:14px; display:flex; min-height:100vh; -webkit-font-smoothing:antialiased; }
.crm * { box-sizing:border-box; }
.crm .tnum { font-variant-numeric:tabular-nums; }
.crm h1 { font-size:24px; font-weight:800; letter-spacing:-.02em; margin:0; color:var(--ink); }
.crm .sub { color:var(--muted); font-size:13px; margin-top:2px; }
.crm .muted { color:var(--muted); }
.crm .ink2 { color:var(--ink-2); }

/* Layout */
.crm .side { width:240px; flex-shrink:0; height:100vh; position:sticky; top:0; overflow-y:auto; background:var(--side); display:flex; flex-direction:column; gap:14px; padding:16px 12px; }
.crm .main { flex:1; min-width:0; }
.crm .inner { max-width:1440px; padding:24px 32px 64px; }
.crm .nav-group { font-size:10.5px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:#6F84A3; padding:10px 10px 4px; }
.crm .nav-btn { display:flex; align-items:center; gap:10px; width:100%; padding:8px 10px; border-radius:10px; font-size:13.5px; font-weight:600; color:var(--side-ink); background:transparent; border:0; cursor:pointer; text-align:left; white-space:nowrap; }
.crm .nav-btn:hover { background:rgba(255,255,255,.06); color:#fff; }
.crm .nav-btn.on { background:rgba(127,227,213,.13); color:var(--side-active); }
.crm .nav-badge { margin-left:auto; font-size:11px; font-weight:700; padding:1px 7px; border-radius:999px; background:rgba(255,255,255,.1); color:#E3EAF4; }
.crm .nav-badge.hot { background:#C8372D; color:#fff; }
.crm .topbar { display:none; }
.crm .grid { display:grid; gap:16px; }
.crm .g2 { grid-template-columns:repeat(2,minmax(0,1fr)); }
.crm .g3 { grid-template-columns:repeat(3,minmax(0,1fr)); }
.crm .g4 { grid-template-columns:repeat(4,minmax(0,1fr)); }
.crm .g6 { grid-template-columns:repeat(6,minmax(0,1fr)); }
.crm .span2 { grid-column:span 2; }
.crm .span3 { grid-column:span 3; }
.crm .row { display:flex; align-items:center; gap:8px; }
.crm .wrap { flex-wrap:wrap; }
.crm .between { justify-content:space-between; }
.crm .stack > * + * { margin-top:16px; }
.crm .stack-sm > * + * { margin-top:8px; }
@media (max-width: 1100px) { .crm .g4, .crm .g6 { grid-template-columns:repeat(2,minmax(0,1fr)); } .crm .g3 { grid-template-columns:repeat(2,minmax(0,1fr)); } .crm .span3 { grid-column:span 2; } }
@media (max-width: 820px) {
  .crm { display:block; }
  .crm .side { display:none; }
  .crm .topbar { display:flex; position:sticky; top:0; z-index:30; background:var(--side); padding:10px 12px; gap:6px; overflow-x:auto; align-items:center; }
  .crm .inner { padding:16px 16px 72px; }
  .crm .g2, .crm .g3, .crm .g4 { grid-template-columns:minmax(0,1fr); }
  .crm .g6 { grid-template-columns:repeat(2,minmax(0,1fr)); }
  .crm .span2, .crm .span3 { grid-column:auto; }
  .crm h1 { font-size:20px; }
}

/* Superficies */
.crm .card { background:var(--surface); border:1px solid var(--border); border-radius:16px; box-shadow:var(--shadow); min-width:0; }
.crm .card-h { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:14px 18px 4px; }
.crm .card-t { display:flex; align-items:center; gap:8px; font-weight:700; font-size:14px; color:var(--ink); }
.crm .card-t svg { color:var(--muted); }
.crm .card-b { padding:12px 18px 18px; }
.crm .hero { background:linear-gradient(155deg,#0B2A4F 0%,#0E4A5E 100%); color:#fff; border-radius:16px; padding:20px; }
.crm[data-theme="dark"] .hero { background:linear-gradient(155deg,#10284A 0%,#0D3A44 100%); border:1px solid var(--border); }
.crm .tile { background:var(--surface-2); border:1px solid var(--border); border-radius:12px; padding:10px 12px; }
.crm .item { display:flex; align-items:center; gap:10px; width:100%; text-align:left; background:var(--surface-2); border:1px solid transparent; border-radius:12px; padding:9px 11px; color:var(--ink); cursor:pointer; }
.crm .item:hover { border-color:var(--border-strong); background:var(--surface-3); }
.crm .divider { height:1px; background:var(--border); margin:12px 0; }

/* Controles */
.crm .btn { display:inline-flex; align-items:center; justify-content:center; gap:6px; font:inherit; font-size:13px; font-weight:600; padding:8px 13px; border-radius:10px; border:1px solid transparent; cursor:pointer; white-space:nowrap; text-decoration:none; transition:background .12s, border-color .12s; }
.crm .btn:disabled { opacity:.45; cursor:not-allowed; }
.crm .btn-sm { padding:5px 9px; font-size:12px; border-radius:8px; }
.crm .btn-primary { background:var(--accent); color:#fff; }
.crm[data-theme="dark"] .btn-primary { color:#062420; }
.crm .btn-primary:hover:not(:disabled) { background:var(--accent-hover); }
.crm .btn-outline { background:var(--surface); border-color:var(--border); color:var(--ink); }
.crm .btn-outline:hover:not(:disabled) { border-color:var(--border-strong); background:var(--surface-2); }
.crm .btn-ghost { background:transparent; color:var(--ink-2); }
.crm .btn-ghost:hover:not(:disabled) { background:var(--surface-3); color:var(--ink); }
.crm .btn-wa { background:var(--wa); color:#fff; }
.crm[data-theme="dark"] .btn-wa { color:#06210F; }
.crm .btn-danger { background:transparent; border-color:var(--bad); color:var(--bad); }
.crm .btn-soft { background:var(--accent-soft); color:var(--accent-ink); }
.crm .icon-btn { display:inline-flex; align-items:center; justify-content:center; width:30px; height:30px; border-radius:8px; border:1px solid var(--border); background:var(--surface); color:var(--ink-2); cursor:pointer; flex-shrink:0; }
.crm .icon-btn:hover:not(:disabled) { background:var(--surface-3); color:var(--ink); }
.crm .icon-btn:disabled { opacity:.35; cursor:not-allowed; }
.crm .icon-btn.wa { color:var(--wa); background:var(--good-soft); border-color:transparent; }
.crm .input, .crm .select, .crm .textarea { width:100%; font:inherit; font-size:13.5px; color:var(--ink); background:var(--surface); border:1px solid var(--border); border-radius:10px; padding:8px 10px; outline:none; }
.crm .input:focus, .crm .select:focus, .crm .textarea:focus { border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-soft); }
.crm .select { width:auto; padding-right:28px; }
.crm .select.full { width:100%; }
.crm .label { display:block; font-size:12px; font-weight:600; color:var(--ink-2); margin-bottom:4px; }
.crm .search { position:relative; }
.crm .search svg { position:absolute; left:10px; top:50%; transform:translateY(-50%); color:var(--muted); }
.crm .search .input { padding-left:32px; min-width:220px; }
.crm .seg { display:inline-flex; background:var(--surface-3); border-radius:10px; padding:3px; gap:2px; }
.crm .seg button { font:inherit; font-size:12.5px; font-weight:600; padding:5px 10px; border:0; border-radius:8px; background:transparent; color:var(--ink-2); cursor:pointer; }
.crm .seg button.on { background:var(--surface); color:var(--ink); box-shadow:var(--shadow); }
.crm .chip { display:inline-flex; align-items:center; gap:4px; font-size:11.5px; font-weight:600; padding:2px 8px; border-radius:999px; white-space:nowrap; }
.crm .t-neutral { background:var(--surface-3); color:var(--ink-2); }
.crm .t-accent { background:var(--accent-soft); color:var(--accent-ink); }
.crm .t-good { background:var(--good-soft); color:var(--good); }
.crm .t-warn { background:var(--warn-soft); color:var(--warn); }
.crm .t-bad { background:var(--bad-soft); color:var(--bad); }
.crm .t-info { background:var(--info-soft); color:var(--info); }
.crm .note { font-size:12.5px; padding:9px 12px; border-radius:10px; line-height:1.45; }
.crm .bar-track { height:8px; border-radius:999px; background:var(--surface-3); overflow:hidden; }
.crm .bar-fill { height:100%; border-radius:999px; background:var(--accent); transition:width .5s ease; }
.crm .kbd { font-size:11px; font-weight:600; padding:1px 6px; border-radius:6px; border:1px solid var(--border-strong); color:var(--muted); background:var(--surface-2); }

/* Tablas */
.crm table.tbl { width:100%; border-collapse:collapse; font-size:13px; }
.crm table.tbl th { text-align:left; font-size:11.5px; font-weight:700; letter-spacing:.02em; color:var(--muted); padding:10px 12px; background:var(--surface-2); border-bottom:1px solid var(--border); white-space:nowrap; }
.crm table.tbl th.sortable { cursor:pointer; user-select:none; }
.crm table.tbl th.sortable:hover { color:var(--ink); }
.crm table.tbl td { padding:9px 12px; border-bottom:1px solid var(--border); color:var(--ink-2); vertical-align:middle; }
.crm table.tbl tr.click { cursor:pointer; }
.crm table.tbl tr.click:hover td { background:var(--surface-2); }
.crm table.tbl td.strong { color:var(--ink); font-weight:600; }

/* Kanban */
.crm .kanban { display:flex; gap:12px; overflow-x:auto; padding-bottom:12px; align-items:flex-start; }
.crm .kcol { width:272px; min-width:272px; background:var(--surface-2); border:1px solid var(--border); border-radius:14px; padding:10px; }
.crm .kcol.over { border-color:var(--accent); background:var(--accent-soft); }
.crm .kcard { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:10px 11px; cursor:grab; box-shadow:var(--shadow); }
.crm .kcard:hover { border-color:var(--border-strong); }
.crm .kcard.dragging { opacity:.4; }

/* Overlays */
.crm-overlay { position:fixed; inset:0; z-index:50; background:rgba(8,15,28,.48); display:flex; align-items:center; justify-content:center; padding:16px; }
.crm-overlay.right { justify-content:flex-end; padding:0; align-items:stretch; }
.crm .modal { background:var(--surface); color:var(--ink); border-radius:16px; width:100%; max-width:480px; max-height:calc(100vh - 32px); overflow:auto; box-shadow:var(--shadow-lg); border:1px solid var(--border); }
.crm .modal-h { display:flex; align-items:center; justify-content:space-between; padding:14px 18px; border-bottom:1px solid var(--border); position:sticky; top:0; background:var(--surface); z-index:1; font-weight:700; }
.crm .modal-b { padding:16px 18px 18px; }
.crm .drawer { background:var(--surface); width:100%; max-width:520px; height:100%; overflow-y:auto; box-shadow:var(--shadow-lg); border-left:1px solid var(--border); }
.crm .toast { position:fixed; bottom:16px; right:16px; z-index:60; max-width:380px; background:var(--side); color:#fff; padding:12px 14px; border-radius:12px; font-size:13px; box-shadow:var(--shadow-lg); }
.crm .savestate { position:fixed; bottom:12px; left:256px; font-size:11.5px; color:var(--muted); z-index:20; }
@media (max-width: 820px) { .crm .savestate { left:12px; } }

/* Timeline */
.crm .tl { position:relative; }
.crm .tl-item { display:flex; gap:10px; padding:6px 0; }
.crm .tl-dot { width:26px; height:26px; border-radius:999px; display:flex; align-items:center; justify-content:center; flex-shrink:0; background:var(--surface-3); color:var(--ink-2); }

.crm button:focus-visible, .crm a:focus-visible, .crm input:focus-visible, .crm select:focus-visible, .crm textarea:focus-visible { outline:2px solid var(--accent); outline-offset:2px; }
.crm ::-webkit-scrollbar { height:8px; width:8px; }
.crm ::-webkit-scrollbar-thumb { background:var(--border-strong); border-radius:4px; }
@keyframes crmspin { to { transform:rotate(360deg); } }
.crm .spin { animation:crmspin 1s linear infinite; }
@media (prefers-reduced-motion: reduce) { .crm * { transition:none !important; animation:none !important; } }
`;

// ============================================================ Primitivas ===

function Btn({ variant = "outline", size, icon: Icon, children, className = "", ...props }) {
  return (
    <button className={`btn btn-${variant} ${size === "sm" ? "btn-sm" : ""} ${className}`} {...props}>
      {Icon && <Icon size={size === "sm" ? 13 : 15} />}
      {children}
    </button>
  );
}

function Card({ title, icon: Icon, action, children, className = "", pad = true, style }) {
  return (
    <div className={"card " + className} style={style}>
      {(title || action) && (
        <div className="card-h">
          <div className="card-t">
            {Icon && <Icon size={16} />}
            {title}
          </div>
          {action}
        </div>
      )}
      {pad ? <div className="card-b">{children}</div> : children}
    </div>
  );
}

function LinkBtn({ onClick, children }) {
  return (
    <button onClick={onClick} className="btn btn-ghost btn-sm" style={{ color: "var(--accent-ink)" }}>
      {children} <ChevronRight size={13} />
    </button>
  );
}

function Kpi({ icon: Icon, label, value, sub, tone = "accent", onClick, footer }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag onClick={onClick} className="card" style={{ padding: 16, textAlign: "left", cursor: onClick ? "pointer" : "default", font: "inherit", color: "inherit", display: "block", width: "100%" }}>
      <div className="row between">
        <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-2)" }}>{label}</span>
        {Icon && (
          <span className={`chip t-${tone}`} style={{ padding: 6, borderRadius: 9 }}>
            <Icon size={14} />
          </span>
        )}
      </div>
      <div className="tnum" style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-.02em", marginTop: 6, lineHeight: 1.1 }}>{value}</div>
      {sub && <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{sub}</div>}
      {footer}
    </Tag>
  );
}

function Chip({ tone = "neutral", icon: Icon, children, title }) {
  return (
    <span className={`chip t-${tone}`} title={title}>
      {Icon && <Icon size={11} />}
      {children}
    </span>
  );
}

function Field({ label, children, style }) {
  return (
    <label style={{ display: "block", ...style }}>
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

function ProgressBar({ value, max, tone, height = 8 }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const color = tone === "good" ? "var(--good)" : tone === "warn" ? "var(--warn)" : tone === "bad" ? "var(--bad)" : "var(--accent)";
  return (
    <div className="bar-track" style={{ height }} role="progressbar" aria-valuenow={value} aria-valuemax={max}>
      <div className="bar-fill" style={{ width: pct + "%", background: color }} />
    </div>
  );
}

function Ring({ value, max, size = 156, stroke = 13, color = "#7FE3D5", track = "rgba(255,255,255,0.14)", children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: "stroke-dashoffset .8s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>{children}</div>
    </div>
  );
}

function MilestoneBar({ value, max, marks = [] }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ position: "relative", margin: "8px 0 22px" }}>
      <div className="bar-track" style={{ height: 10 }}>
        <div className="bar-fill" style={{ width: pct + "%", background: "var(--warn)" }} />
      </div>
      {marks.map((m) => (
        <div key={m} style={{ position: "absolute", top: -3, left: `${(m / max) * 100}%`, transform: "translateX(-50%)", textAlign: "center" }}>
          <div style={{ width: 2, height: 16, background: value >= m ? "var(--good)" : "var(--border-strong)", margin: "0 auto" }} />
          <div className="tnum" style={{ fontSize: 10.5, fontWeight: 700, color: value >= m ? "var(--good)" : "var(--muted)" }}>{m}</div>
        </div>
      ))}
    </div>
  );
}

function EmptyNote({ children }) {
  return (
    <div className="muted" style={{ textAlign: "center", fontSize: 13, padding: "18px 8px" }}>
      {children}
    </div>
  );
}

function PageHeader({ title, subtitle, children }) {
  return (
    <div className="row between wrap" style={{ alignItems: "flex-end", gap: 12 }}>
      <div>
        <h1>{title}</h1>
        {subtitle && <div className="sub">{subtitle}</div>}
      </div>
      {children && <div className="row wrap">{children}</div>}
    </div>
  );
}

function SearchBox({ value, onChange, placeholder = "Buscar…", inputRef }) {
  return (
    <div className="search">
      <Search size={14} />
      <input ref={inputRef} className="input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function useEscape(onClose) {
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
}

// Los overlays se renderizan dentro de .crm para heredar el tema.
function Modal({ title, onClose, children, width = 480 }) {
  useEscape(onClose);
  return (
    <div className="crm-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: width }} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-h">
          <span>{title}</span>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar">
            <X size={16} />
          </button>
        </div>
        <div className="modal-b">{children}</div>
      </div>
    </div>
  );
}

function Drawer({ onClose, children }) {
  useEscape(onClose);
  return (
    <div className="crm-overlay right" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  );
}

function TierBadge({ tier }) {
  return tier === "caliente" ? <Chip tone="bad" icon={Flame}>Caliente</Chip> : <Chip tone="info" icon={Snowflake}>Tibio</Chip>;
}

function StageChip({ stage }) {
  const tone = stage === "ganado" ? "good" : stage === "perdido" ? "neutral" : stage === "negociacion" || stage === "propuesta" ? "warn" : stage === "prospeccion" ? "neutral" : "accent";
  return <Chip tone={tone}>{STAGE_BY_KEY[stage]?.label || stage}</Chip>;
}

// Antigüedad sin actividad: cuanto más tiempo, más "frío" el deal.
function AgingChip({ c }) {
  if (!isOpen(c) || c.stage === "prospeccion") return null;
  const d = diasSinActividad(c);
  if (d === null) return null;
  if (d >= 14) return <Chip tone="bad" icon={Timer} title="Días sin actividad">{d} d</Chip>;
  if (d >= 7) return <Chip tone="warn" icon={Timer} title="Días sin actividad">{d} d</Chip>;
  return <Chip tone="neutral" icon={Timer} title="Días sin actividad">{d} d</Chip>;
}

function SequenceBadge({ seq }) {
  if (seq.status === "stopped") return <Chip tone="neutral">Secuencia detenida</Chip>;
  if (seq.status === "completed") return <Chip tone="accent">Secuencia completa</Chip>;
  if (seq.status === "due") return <Chip tone="good" icon={MessageCircle}>Enviar {seq.step.label}</Chip>;
  return <Chip tone="warn">{seq.step.label} desde el {seq.dueDate.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })}</Chip>;
}

function ChartTooltip({ active, payload, label, unit = "" }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 10px", fontSize: 12, boxShadow: "var(--shadow-lg)", color: "var(--ink)" }}>
      <div style={{ fontWeight: 700, marginBottom: 2 }}>{payload[0].payload.tooltipLabel || label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="tnum" style={{ color: "var(--ink-2)" }}>
          {p.name}: <strong style={{ color: "var(--ink)" }}>{fmtN(p.value)}{unit}</strong>
        </div>
      ))}
    </div>
  );
}

// Barra horizontal simple (embudos, rankings) en HTML, con etiqueta y valor visibles.
function HBar({ label, value, max, tone, right, onClick, title }) {
  const Tag = onClick ? "button" : "div";
  const color = tone === "good" ? "var(--good)" : tone === "muted" ? "var(--border-strong)" : tone === "warn" ? "var(--warn)" : "var(--accent)";
  return (
    <Tag onClick={onClick} title={title} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", background: "none", border: 0, padding: 0, font: "inherit", cursor: onClick ? "pointer" : "default", color: "inherit" }}>
      <span style={{ width: 132, flexShrink: 0, fontSize: 12.5, fontWeight: 600, color: "var(--ink-2)", textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      <span style={{ flex: 1, height: 22, background: "var(--surface-3)", borderRadius: 6, overflow: "hidden" }}>
        {value > 0 && <span style={{ display: "block", height: "100%", width: `${Math.max(3, (value / Math.max(1, max)) * 100)}%`, background: color, borderRadius: "0 4px 4px 0", transition: "width .5s ease" }} />}
      </span>
      <span className="tnum" style={{ width: 64, textAlign: "right", fontSize: 12.5, fontWeight: 700 }}>{right ?? fmtN(value)}</span>
    </Tag>
  );
}

async function copiarTexto(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch (e) {
    return false;
  }
}
