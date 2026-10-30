import React, { useEffect } from "react";

export const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@600;700&display=swap');
.cz { --bg:#F4F3EF; --paper:#FFFFFF; --soft:#F8F7F4; --soft2:#EFEDE7; --line:#E4E1DA; --line2:#CFCBC1;
  --ink:#1B2340; --ink2:#4D5470; --muted:#7A8098; --navy:#17296E; --navy-deep:#0F1E52; --cyan:#0BBBE6; --cyan-soft:#E3F7FC;
  --lilac:#8F80B7; --lilac-soft:#EDEAF6; --good:#2F7A5C; --good-soft:#E4F2EC; --warn:#A8620A; --warn-soft:#FCF0DC; --bad:#B9382F; --bad-soft:#FBE7E5;
  --shadow:0 1px 2px rgba(15,30,82,.05),0 4px 14px rgba(15,30,82,.05); --shadow-lg:0 18px 50px rgba(15,30,82,.22);
  font-family:'Inter',system-ui,-apple-system,sans-serif; color:var(--ink); background:var(--bg); min-height:100vh; font-size:14px; -webkit-font-smoothing:antialiased; }
.cz * { box-sizing:border-box; }
.cz .tnum { font-variant-numeric:tabular-nums; }
.cz h1, .cz h2, .cz h3 { font-family:'Poppins','Inter',sans-serif; margin:0; color:var(--navy-deep); letter-spacing:-.01em; }
.cz h1 { font-size:22px; } .cz h2 { font-size:17px; } .cz h3 { font-size:14.5px; }
.cz .muted { color:var(--muted); } .cz .ink2 { color:var(--ink2); }
.cz .row { display:flex; align-items:center; gap:8px; } .cz .wrap { flex-wrap:wrap; } .cz .between { justify-content:space-between; }
.cz .stack > * + * { margin-top:14px; } .cz .stack-sm > * + * { margin-top:8px; }
.cz .grid { display:grid; gap:14px; } .cz .g2 { grid-template-columns:repeat(2,minmax(0,1fr)); } .cz .g3 { grid-template-columns:repeat(3,minmax(0,1fr)); } .cz .g4 { grid-template-columns:repeat(4,minmax(0,1fr)); }

/* Barra superior */
.cz .top { position:sticky; top:0; z-index:30; background:var(--navy-deep); color:#fff; box-shadow:0 2px 0 var(--cyan); }
.cz .top-in { max-width:1360px; margin:0 auto; padding:10px 20px; display:flex; align-items:center; gap:14px; }
.cz .brand { font-family:'Poppins',sans-serif; font-weight:700; font-size:19px; letter-spacing:-.01em; display:flex; align-items:center; gap:10px; white-space:nowrap; }
.cz .brand small { font-family:'Inter'; font-weight:500; font-size:11.5px; color:#A9B6E0; display:block; margin-top:-2px; }
.cz .tabs { display:flex; gap:4px; margin-left:8px; }
.cz .tab { background:transparent; border:0; color:#C7D0EE; font:inherit; font-weight:600; font-size:13.5px; padding:8px 12px; border-radius:9px; cursor:pointer; white-space:nowrap; }
.cz .tab:hover { background:rgba(255,255,255,.08); color:#fff; } .cz .tab.on { background:rgba(11,187,230,.16); color:#7FDDF5; }
.cz .prov { margin-left:auto; display:flex; align-items:center; gap:8px; background:rgba(255,255,255,.08); border-radius:11px; padding:4px 6px 4px 12px; }
.cz .prov label { font-size:11.5px; color:#A9B6E0; font-weight:600; white-space:nowrap; }
.cz .prov select { background:#fff; color:var(--navy-deep); border:0; border-radius:8px; font:inherit; font-weight:700; padding:7px 28px 7px 10px; cursor:pointer; }
.cz .user-btn { background:rgba(255,255,255,.08); color:#fff; border:0; border-radius:10px; padding:7px 10px; font:inherit; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:8px; white-space:nowrap; }
.cz .avatar { width:28px; height:28px; border-radius:50%; background:var(--cyan); color:var(--navy-deep); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:12px; flex-shrink:0; }
.cz .main { max-width:1360px; margin:0 auto; padding:20px 20px 90px; }

/* Superficies */
.cz .card { background:var(--paper); border:1px solid var(--line); border-radius:16px; box-shadow:var(--shadow); }
.cz .card-p { padding:18px; }
.cz .sec-t { font-size:11.5px; font-weight:700; letter-spacing:.07em; text-transform:uppercase; color:var(--lilac); margin-bottom:8px; }
.cz .note { font-size:12.5px; padding:9px 12px; border-radius:10px; line-height:1.45; }
.cz .n-info { background:var(--cyan-soft); color:#075A70; } .cz .n-warn { background:var(--warn-soft); color:var(--warn); } .cz .n-bad { background:var(--bad-soft); color:var(--bad); } .cz .n-good { background:var(--good-soft); color:var(--good); } .cz .n-lilac { background:var(--lilac-soft); color:var(--navy); }
.cz .divider { height:1px; background:var(--line); margin:14px 0; }

/* Controles */
.cz .btn { display:inline-flex; align-items:center; justify-content:center; gap:7px; font:inherit; font-weight:600; font-size:13.5px; padding:9px 14px; border-radius:10px; border:1px solid transparent; cursor:pointer; white-space:nowrap; text-decoration:none; transition:background .12s,border-color .12s; }
.cz .btn:disabled { opacity:.45; cursor:not-allowed; }
.cz .btn-sm { padding:6px 10px; font-size:12.5px; border-radius:8px; }
.cz .b-primary { background:var(--navy); color:#fff; } .cz .b-primary:hover:not(:disabled) { background:var(--navy-deep); }
.cz .b-cyan { background:var(--cyan); color:var(--navy-deep); } .cz .b-cyan:hover:not(:disabled) { filter:brightness(.95); }
.cz .b-outline { background:var(--paper); border-color:var(--line2); color:var(--ink); } .cz .b-outline:hover:not(:disabled) { background:var(--soft); }
.cz .b-ghost { background:transparent; color:var(--ink2); } .cz .b-ghost:hover:not(:disabled) { background:var(--soft2); }
.cz .b-wa { background:#1E8A4C; color:#fff; } .cz .b-danger { background:transparent; border-color:var(--bad); color:var(--bad); }
.cz .input, .cz .select, .cz .textarea { width:100%; font:inherit; font-size:14px; color:var(--ink); background:var(--paper); border:1px solid var(--line2); border-radius:10px; padding:9px 11px; outline:none; }
.cz .input:focus, .cz .select:focus, .cz .textarea:focus { border-color:var(--navy); box-shadow:0 0 0 3px rgba(23,41,110,.12); }
.cz .input.sm { padding:6px 8px; font-size:13px; border-radius:8px; }
.cz .label { display:block; font-size:12.5px; font-weight:600; color:var(--ink2); margin-bottom:5px; }
.cz .hint { font-size:11.5px; color:var(--muted); margin-top:4px; }
.cz .seg { display:inline-flex; background:var(--soft2); border-radius:12px; padding:4px; gap:3px; }
.cz .seg button { font:inherit; font-weight:600; font-size:13.5px; padding:8px 14px; border:0; border-radius:9px; background:transparent; color:var(--ink2); cursor:pointer; display:flex; align-items:center; gap:7px; }
.cz .seg button.on { background:var(--paper); color:var(--navy-deep); box-shadow:var(--shadow); }
.cz .opt { display:block; width:100%; text-align:left; font:inherit; background:var(--paper); border:1.5px solid var(--line); border-radius:12px; padding:10px 12px; cursor:pointer; color:var(--ink); }
.cz .opt:hover { border-color:var(--line2); } .cz .opt.on { border-color:var(--navy); background:#F3F5FC; box-shadow:0 0 0 3px rgba(23,41,110,.08); }
.cz .opt b { display:block; font-size:13.5px; } .cz .opt span { font-size:12px; color:var(--muted); }
.cz .chip { display:inline-flex; align-items:center; gap:4px; font-size:11.5px; font-weight:600; padding:2px 8px; border-radius:999px; white-space:nowrap; background:var(--soft2); color:var(--ink2); }
.cz .switch { display:inline-flex; align-items:center; gap:8px; cursor:pointer; font-weight:600; font-size:13.5px; user-select:none; }
.cz .switch input { width:18px; height:18px; accent-color:var(--navy); }
.cz .kid { display:inline-flex; align-items:center; gap:6px; background:var(--soft); border:1px solid var(--line); border-radius:10px; padding:4px 6px 4px 10px; }
.cz .kid input { width:52px; }
.cz .icon-btn { display:inline-flex; align-items:center; justify-content:center; width:30px; height:30px; border-radius:8px; border:1px solid var(--line); background:var(--paper); color:var(--ink2); cursor:pointer; flex-shrink:0; }
.cz .icon-btn:hover { background:var(--soft2); }

/* Planes */
.cz .plan { position:relative; background:var(--paper); border:1.5px solid var(--line); border-radius:14px; padding:14px 14px 12px 18px; overflow:hidden; }
.cz .plan.sel { border-color:var(--navy); box-shadow:0 0 0 3px rgba(23,41,110,.10); }
.cz .plan .bar { position:absolute; left:0; top:0; bottom:0; width:5px; }
.cz .plan .big { font-family:'Poppins',sans-serif; font-size:24px; font-weight:700; color:var(--navy-deep); line-height:1.1; }
.cz .plan .strike { text-decoration:line-through; color:var(--muted); }
.cz .badge-best { background:var(--good-soft); color:var(--good); }
.cz table.t { width:100%; border-collapse:collapse; font-size:13px; }
.cz table.t th { text-align:left; font-size:11.5px; font-weight:700; color:var(--muted); padding:9px 10px; background:var(--soft); border-bottom:1px solid var(--line); white-space:nowrap; }
.cz table.t td { padding:8px 10px; border-bottom:1px solid var(--line); vertical-align:middle; }
.cz table.t tr.click { cursor:pointer; } .cz table.t tr.click:hover td { background:var(--soft); }
.cz .r { text-align:right; white-space:nowrap; }
.cz .kpi { background:var(--soft); border:1px solid var(--line); border-radius:12px; padding:10px 12px; }
.cz .kpi b { display:block; font-family:'Poppins',sans-serif; font-size:20px; color:var(--navy-deep); }
.cz .kpi span { font-size:12px; color:var(--muted); }
.cz .layout { display:grid; grid-template-columns:minmax(340px,430px) minmax(0,1fr); gap:18px; align-items:start; }
.cz .sticky { position:sticky; top:76px; }
.cz .actionbar { position:sticky; bottom:12px; z-index:20; background:var(--navy-deep); color:#fff; border-radius:14px; padding:10px 12px; display:flex; align-items:center; gap:10px; flex-wrap:wrap; box-shadow:var(--shadow-lg); }
.cz .drop { border:2px dashed var(--line2); border-radius:14px; padding:18px; text-align:center; background:var(--soft); cursor:pointer; }
.cz .drop.over { border-color:var(--navy); background:#F3F5FC; }

/* Overlays */
.cz-ov { position:fixed; inset:0; z-index:60; background:rgba(15,30,82,.45); display:flex; align-items:center; justify-content:center; padding:16px; }
.cz .modal { background:var(--paper); border-radius:16px; width:100%; max-height:calc(100vh - 32px); overflow:auto; box-shadow:var(--shadow-lg); }
.cz .modal-h { display:flex; align-items:center; justify-content:space-between; padding:14px 18px; border-bottom:1px solid var(--line); position:sticky; top:0; background:var(--paper); z-index:1; }
.cz .modal-b { padding:16px 18px 18px; }
.cz .toast { position:fixed; left:50%; transform:translateX(-50%); top:76px; z-index:70; background:var(--navy-deep); color:#fff; padding:11px 16px; border-radius:12px; box-shadow:var(--shadow-lg); font-size:13.5px; max-width:92vw; }
.cz .menu { position:absolute; right:0; top:calc(100% + 6px); background:var(--paper); color:var(--ink); border:1px solid var(--line); border-radius:12px; box-shadow:var(--shadow-lg); min-width:210px; padding:6px; z-index:40; }
.cz .menu button { display:flex; width:100%; align-items:center; gap:8px; background:none; border:0; font:inherit; padding:9px 10px; border-radius:8px; cursor:pointer; color:var(--ink); text-align:left; }
.cz .menu button:hover { background:var(--soft); }

.cz.embed .top { position:static; }
@media (max-width: 980px) {
  .cz .layout { grid-template-columns:minmax(0,1fr); }
  .cz .sticky { position:static; }
  .cz .g3, .cz .g4 { grid-template-columns:repeat(2,minmax(0,1fr)); }
}
@media (max-width: 640px) {
  .cz .top-in { flex-wrap:wrap; padding:8px 12px; gap:8px; }
  .cz .tabs { order:3; width:100%; margin:0; overflow-x:auto; }
  .cz .prov { margin-left:auto; padding-left:8px; }
  .cz .prov label { display:none; }
  .cz .main { padding:14px 12px 100px; }
  .cz .g2, .cz .g3 { grid-template-columns:minmax(0,1fr); }
  .cz .g4 { grid-template-columns:repeat(2,minmax(0,1fr)); }
  .cz .hide-sm { display:none !important; }
  .cz .plan .big { font-size:21px; }
}
.cz button:focus-visible, .cz a:focus-visible, .cz input:focus-visible, .cz select:focus-visible { outline:2px solid var(--cyan); outline-offset:2px; }
@media (prefers-reduced-motion: reduce) { .cz * { transition:none !important; } }
`;

export function Btn({ v = "outline", sm, icon, children, className = "", ...p }) {
  return (
    <button className={`btn b-${v} ${sm ? "btn-sm" : ""} ${className}`} {...p}>
      {icon}
      {children}
    </button>
  );
}

export function Field({ label, hint, children, style }) {
  return (
    <label style={{ display: "block", ...style }}>
      {label && <span className="label">{label}</span>}
      {children}
      {hint && <div className="hint">{hint}</div>}
    </label>
  );
}

export function useEscape(fn) {
  useEffect(() => {
    const h = (e) => e.key === "Escape" && fn();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [fn]);
}

export function Modal({ title, onClose, children, width = 520 }) {
  useEscape(onClose);
  return (
    <div className="cz-ov" onClick={onClose}>
      <div className="modal" style={{ maxWidth: width }} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-h">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
        <div className="modal-b">{children}</div>
      </div>
    </div>
  );
}

export const money = (n) => "$" + Math.round(n || 0).toLocaleString("es-AR");
export const numOr = (v) => (v === "" || v == null || !isFinite(Number(v)) ? "" : Number(v));

// Íconos mínimos en SVG (sin dependencias).
const I = (d, s = 16) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);
export const Ico = {
  user: I(<><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-7 8-7s8 3 8 7" /></>),
  users: I(<><circle cx="9" cy="8" r="3.5" /><path d="M2 21c0-3.5 3-6 7-6s7 2.5 7 6" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M22 21c0-3-2-5-5-5.8" /></>),
  building: I(<><rect x="4" y="3" width="16" height="18" rx="1" /><path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1M10 21v-3h4v3" /></>),
  pdf: I(<><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></>),
  wa: I(<path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.7-5.2A8.5 8.5 0 1 1 21 11.5z" />),
  share: I(<><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" /></>),
  upload: I(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5M12 3v12" /></>),
  download: I(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5M12 15V3" /></>),
  plus: I(<path d="M12 5v14M5 12h14" />),
  trash: I(<><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></>),
  check: I(<path d="M20 6L9 17l-5-5" />),
  clock: I(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  gear: I(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>),
  calc: I(<><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h8" /></>),
  logout: I(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></>),
  crm: I(<><path d="M4 4h16v12H5.2L4 17.2z" /><path d="M8 9h8M8 12h5" /></>),
  pin: I(<><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" /></>),
};
