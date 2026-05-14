import { useState, useRef, useEffect } from "react";

// ─── Supabase & Email config ──────────────────────────────────
const SUPABASE_URL = "https://lyajfohlpaszfvcskeep.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5YWpmb2hscGFzemZ2Y3NrZWVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NzY0NzcsImV4cCI6MjA2MzM1MjQ3N30.placeholder";
const RESEND_KEY = "re_bGk4wEZh_AR1TeqM1k3DXvSZsuWsp7VYp";
const FROM_EMAIL = "desantis.empire@gmail.com";

async function saveOrder(orderData) {
  try {
    const res = await fetch(SUPABASE_URL + "/rest/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
        "Authorization": "Bearer " + SUPABASE_KEY,
        "Prefer": "return=representation"
      },
      body: JSON.stringify(orderData)
    });
    const data = await res.json();
    return { ok: res.ok, data };
  } catch(e) {
    console.error("Supabase error:", e);
    return { ok: false };
  }
}

async function sendConfirmEmail(order) {
  const participantsRows = order.participants.map(function(p) {
    return "<tr style='border-top:1px solid #eee'><td style='padding:10px 16px;font-size:14px;color:#222;font-weight:600'>" + p.name + "</td><td style='padding:10px 16px;font-size:14px;color:#666'>" + p.type + (p.age !== null ? " (" + p.age + " anni)" : "") + "</td><td style='padding:10px 16px;font-size:14px;text-align:right;font-weight:600;color:" + (p.free ? "#22c55e" : "#222") + "'>" + (p.free ? "GRATUITO" : "CHF " + order.event.tickets.find(function(t){ return t.type===p.type; })?.price + ".-") + "</td></tr>";
  }).join("");

  const html = "<!DOCTYPE html><html><head><meta charset='UTF-8'/></head><body style='margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif'>" +
  "<table width='100%' cellpadding='0' cellspacing='0' style='background:#f4f4f4;padding:30px 0'><tr><td align='center'>" +
  "<table width='600' cellpadding='0' cellspacing='0' style='background:#fff;border-radius:16px;overflow:hidden;max-width:600px;width:100%'>" +

  // Header
  "<tr><td style='background:linear-gradient(135deg,#1a0a2e,#2d1060);padding:36px 40px;text-align:center'>" +
  "<div style='font-size:36px;margin-bottom:8px'>🎟️</div>" +
  "<div style='color:#fff;font-size:13px;letter-spacing:3px;text-transform:uppercase;opacity:0.7;margin-bottom:6px'>TICKETING PLATFORM</div>" +
  "<div style='color:#fff;font-size:26px;font-weight:700;font-family:Georgia,serif'>Acquisto Confermato!</div>" +
  "</td></tr>" +

  // Green bar
  "<tr><td style='background:#22c55e;padding:12px 40px;text-align:center'><span style='color:#fff;font-weight:700;font-size:14px'>✅ Biglietto acquistato con successo</span></td></tr>" +

  // Event info
  "<tr><td style='padding:32px 40px 20px'><div style='background:#f8f8f8;border-radius:12px;padding:20px 24px;border-left:4px solid " + order.event.color + "'>" +
  "<div style='font-size:22px;font-weight:700;color:#1a1a1a;font-family:Georgia,serif;margin-bottom:4px'>" + order.event.title + "</div>" +
  "<div style='color:#666;font-size:14px;margin-bottom:12px'>" + order.event.subtitle + "</div>" +
  "<div style='color:#444;font-size:14px;line-height:2'>📅 " + new Date(order.event.date).toLocaleDateString("it-IT",{weekday:"long",day:"numeric",month:"long",year:"numeric"}) + "<br/>⏰ " + order.event.time + "<br/>📍 " + order.event.location + "</div>" +
  "</div></td></tr>" +

  // Participants table
  "<tr><td style='padding:0 40px 20px'>" +
  "<div style='font-size:13px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px'>Partecipanti</div>" +
  "<table width='100%' cellpadding='0' cellspacing='0' style='border:1px solid #eee;border-radius:10px;overflow:hidden'>" +
  "<tr style='background:#f8f8f8'><th style='padding:10px 16px;text-align:left;font-size:12px;color:#888'>Nome</th><th style='padding:10px 16px;text-align:left;font-size:12px;color:#888'>Tipo</th><th style='padding:10px 16px;text-align:right;font-size:12px;color:#888'>Prezzo</th></tr>" +
  participantsRows +
  "<tr style='border-top:2px solid #eee;background:#f8f8f8'><td colspan='2' style='padding:12px 16px;font-size:15px;font-weight:700;color:#222'>Totale</td><td style='padding:12px 16px;font-size:18px;font-weight:800;color:" + order.event.color + ";text-align:right'>CHF " + order.total + ".-</td></tr>" +
  "</table></td></tr>" +

  // QR Code
  "<tr><td style='padding:0 40px 20px;text-align:center'>" +
  "<div style='background:#1a1a2e;border-radius:16px;padding:28px'>" +
  "<div style='color:#fff;font-size:13px;letter-spacing:2px;text-transform:uppercase;opacity:0.6;margin-bottom:16px'>Il tuo QR Code</div>" +
  "<div style='background:#fff;border-radius:10px;width:160px;height:160px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center'>" +
  "<img src='https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" + encodeURIComponent(order.code) + "' width='150' height='150' alt='QR Code' style='border-radius:6px;display:block;margin:auto'/>" +
  "</div>" +
  "<div style='font-family:monospace;font-size:11px;color:rgba(255,255,255,0.4);letter-spacing:2px'>" + order.code + "</div>" +
  "<div style='color:rgba(255,255,255,0.5);font-size:12px;margin-top:10px'>📲 Mostra questo QR all'ingresso</div>" +
  "</div></td></tr>" +

  // Important info
  "<tr><td style='padding:0 40px 20px'><div style='background:#fff8e1;border:1px solid #ffc107;border-radius:10px;padding:16px 20px'>" +
  "<div style='font-weight:700;color:#e65100;font-size:14px;margin-bottom:8px'>⚠️ Informazioni importanti</div>" +
  "<ul style='margin:0;padding-left:18px;color:#555;font-size:13px;line-height:1.8'>" +
  "<li>Presenta il QR Code all'ingresso (screenshot o schermo)</li>" +
  "<li>Il biglietto è personale e nominativo</li>" +
  "<li>Porta un documento d'identità valido</li>" +
  "<li>Bambini sotto i 6 anni entrano gratuitamente</li>" +
  "<li>Per assistenza: desantis.empire@gmail.com</li>" +
  "</ul></div></td></tr>" +

  // Footer
  "<tr><td style='background:#f8f8f8;padding:20px 40px;text-align:center;border-top:1px solid #eee'>" +
  "<div style='color:#aaa;font-size:12px;line-height:1.8'>Messaggio automatico · Non rispondere a questa email<br/><strong style='color:#888'>Danza & Fitness Events</strong> · Powered by SumUp</div>" +
  "</td></tr>" +

  "</table></td></tr></table></body></html>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + RESEND_KEY
      },
      body: JSON.stringify({
        from: "Danza & Fitness Events <onboarding@resend.dev>",
        to: [order.buyerEmail],
        subject: "🎟️ Biglietto confermato - " + order.event.title,
        html: html
      })
    });
    return { ok: res.ok };
  } catch(e) {
    console.error("Resend error:", e);
    return { ok: false };
  }
}


const STANDARD_TICKETS = [
  { type: "Ragazzi", price: 10, description: "Eta 7-15 anni", emoji: "🧒" },
  { type: "Adulti",  price: 15, description: "Eta 16 anni e oltre", emoji: "🧑" },
];

const ELLEVEL_TICKETS = [
  { type: "Partecipante", price: 30, originalPrice: 35, description: "Gara · Promozione attiva!", emoji: "🏃", promo: true, available: 1000 },
  { type: "Spettatore",   price: 5,  description: "Ingresso pubblico", emoji: "👁️", available: 300 },
];

// ─── Events ──────────────────────────────────────────────────
const EVENTS = [
  {
    id: 1,
    title: "Latin Fever Night",
    subtitle: "Salsa · Bachata · Merengue",
    date: "2026-06-14",
    time: "21:00",
    location: "Studio DanzArte, Lugano",
    emoji: "🕺",
    color: "#E63946",
    accent: "#FF6B6B",
    tickets: STANDARD_TICKETS,
    available: 0,
    soldOut: true,
    category: "Danza",
  },
  {
    id: 2,
    title: "Ellevel",
    subtitle: "Wellness & Fitness",
    date: "2026-09-05",
    time: "10:00 - 19:00",
    location: "Palapenz, Chiasso",
    emoji: null,
    color: "#CC0000",
    accent: "#FF3333",
    tickets: ELLEVEL_TICKETS,
    available: 1300,
    soldOut: false,
    category: "Fitness",
    sumupUrl: "https://pay.sumup.com/b2c/QJKKER2O",
  },
  {
    id: 3,
    title: "Helvetic Dance Competition",
    subtitle: "Spettacolo · Competizione · Showcase",
    date: "2026-11-28",
    time: "14:00",
    location: "Sala Giona, Balerna",
    emoji: null,
    color: "#2d6a2d",
    accent: "#4a9e4a",
    tickets: STANDARD_TICKETS,
    available: 300,
    soldOut: false,
    category: "Danza",
    sumupUrl: "https://pay.sumup.com/b2c/QJKKER2O",
  },
];

// ─── HDC Logo ────────────────────────────────────────────────
function HDCLogo({ size }) {
  const w = size || 160;
  const h = Math.round(w * 0.62);
  return (
    <svg width={w} height={h} viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <text x="160" y="58" textAnchor="middle" fontFamily="Georgia,serif" fontSize="42" fill="#1a5c1a" fontStyle="italic">Helvetic</text>
      <text x="160" y="130" textAnchor="middle" fontFamily="Georgia,serif" fontSize="76" fill="#1a5c1a" fontStyle="italic">Dance</text>
      <text x="160" y="168" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="28" fill="#1a5c1a" fontWeight="900" letterSpacing="4">COMPETITION</text>
    </svg>
  );
}

// ─── Ellevel Logo ────────────────────────────────────────────
function EllevelLogo({ size }) {
  return (
    <img
      src="/ellevel-logo.png"
      alt="Ellevel"
      style={{ width: size || 220, objectFit: "contain", display: "block", maxHeight: 120 }}
    />
  );
}
      <defs>
        <linearGradient id="rbg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ff3300"/>
          <stop offset="50%" stopColor="#bb0000"/>
          <stop offset="100%" stopColor="#550000"/>
        </linearGradient>
        <linearGradient id="stxt" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff"/>
          <stop offset="35%" stopColor="#eeeeee"/>
          <stop offset="65%" stopColor="#ddaaaa"/>
          <stop offset="100%" stopColor="#ffffff"/>
        </linearGradient>
      </defs>
      {/* Ombra 3D */}
      <rect x="8" y="18" width="432" height="142" fill="#330000" rx="6"/>
      {/* Corpo principale */}
      <rect x="0" y="8" width="432" height="142" fill="url(#rbg)" rx="6"/>
      {/* Striscia arancione in basso */}
      <rect x="0" y="140" width="432" height="10" fill="#ff6600" rx="0"/>
      {/* Bordo chiaro in alto */}
      <rect x="0" y="8" width="432" height="6" fill="#ff5533" rx="6"/>
      {/* Testo ELLEVEL */}
      <text x="216" y="118" textAnchor="middle"
        fontFamily="Arial Black, Impact, sans-serif"
        fontSize="100" fontWeight="900"
        fill="url(#stxt)"
        letterSpacing="2">ELLEVEL</text>
      {/* Bordo bianco testo */}
      <text x="216" y="118" textAnchor="middle"
        fontFamily="Arial Black, Impact, sans-serif"
        fontSize="100" fontWeight="900"
        fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.5"
        letterSpacing="2">ELLEVEL</text>
      {/* Corno */}
      <path d="M362,5 C374,-16 400,-20 394,4 C408,-8 416,12 400,28 C392,14 376,8 362,5Z" fill="#cc0000"/>
      <path d="M374,2 C382,-8 394,-10 391,2" fill="none" stroke="#ff8888" strokeWidth="2" opacity="0.8"/>
    </svg>
  );
}

// ─── QR Code ─────────────────────────────────────────────────
function QRCode({ data, size }) {
  const sz = size || 160;
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const cells = 25;
    const cell = sz / cells;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, sz, sz);
    const hash = data.split("").reduce(function(a, c) { return a ^ (c.charCodeAt(0) * 31 + a); }, 0x5f3759df);
    function rand(seed) {
      var s = seed ^ 0x9e3779b9;
      s = ((s >>> 16) ^ s) * 0x45d9f3b;
      s = ((s >>> 16) ^ s) * 0x45d9f3b;
      return ((s >>> 16) ^ s) >>> 0;
    }
    ctx.fillStyle = "#111";
    for (var r = 0; r < cells; r++) {
      for (var c = 0; c < cells; c++) {
        var inTL = r < 7 && c < 7;
        var inTR = r < 7 && c >= cells - 7;
        var inBL = r >= cells - 7 && c < 7;
        if (inTL || inTR || inBL) {
          var draw = false;
          if (inTL && (r===0||r===6||c===0||c===6||(r>=2&&r<=4&&c>=2&&c<=4))) draw = true;
          if (inTR && (r===0||r===6||c===cells-7||c===cells-1||(r>=2&&r<=4&&c>=cells-5&&c<=cells-3))) draw = true;
          if (inBL && (r===cells-7||r===cells-1||c===0||c===6||(r>=cells-5&&r<=cells-3&&c>=2&&c<=4))) draw = true;
          if (draw) ctx.fillRect(c * cell, r * cell, cell, cell);
          continue;
        }
        if (rand(hash ^ (r * cells + c) * 0x6b43a9) & 1) ctx.fillRect(c * cell, r * cell, cell, cell);
      }
    }
  }, [data, sz]);
  return React.createElement("canvas", { ref: canvasRef, width: sz, height: sz, style: { borderRadius: 8 } });
}

// ─── Name Input (stable, no iOS freeze) ──────────────────────
function NameInput({ pkey, initial, onSave, color, ok }) {
  const [val, setVal] = useState(initial || "");
  return (
    <input
      value={val}
      onChange={function(e) { var v = e.target.value; setVal(v); onSave(v); }}
      placeholder="Nome e Cognome"
      autoComplete="off"
      style={{
        width: "100%", padding: "0.75rem 1rem", background: "rgba(255,255,255,0.08)",
        border: "1px solid " + (ok ? color + "99" : "rgba(255,255,255,0.15)"),
        borderRadius: 10, color: "#fff", fontSize: "1rem",
        outline: "none", boxSizing: "border-box", fontFamily: "inherit",
        display: "block", marginBottom: 10, WebkitAppearance: "none"
      }}
    />
  );
}

// ─── Ticket Modal ─────────────────────────────────────────────
function TicketModal({ event, onClose }) {
  const [qtys, setQtys] = useState({});
  const [step, setStep] = useState("select");
  const [names, setNames] = useState({});
  const [dobs, setDobs] = useState({});
  const [form, setForm] = useState({ nome: "", cognome: "", email: "", telefono: "" });
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState(null);

  var totalTickets = Object.values(qtys).reduce(function(s, v) { return s + v; }, 0);
  var hasSelection = totalTickets > 0;

  function setQty(i, val) {
    var next = Object.assign({}, qtys);
    var v = Math.max(0, Math.min(10, val));
    if (v === 0) delete next[i]; else next[i] = v;
    setQtys(next);
  }

  var participants = [];
  event.tickets.forEach(function(t, i) {
    for (var n = 0; n < (qtys[i] || 0); n++) {
      participants.push({ type: t.type, price: t.price, emoji: t.emoji, key: i + "_" + n });
    }
  });

  function calcAge(dobStr) {
    if (!dobStr) return null;
    var dob = new Date(dobStr);
    var today = new Date();
    var age = today.getFullYear() - dob.getFullYear();
    var m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
  }

  function isFree(key) {
    var age = calcAge(dobs[key]);
    return age !== null && age <= 6;
  }

  var total = participants.reduce(function(sum, p) {
    return sum + (isFree(p.key) ? 0 : p.price);
  }, 0);

  var freeCount = participants.filter(function(p) { return isFree(p.key); }).length;

  var namesComplete = participants.every(function(p) {
    return (names[p.key] || "").trim().length > 0 && (dobs[p.key] || "").trim().length > 0;
  });

  function formatDate(d) {
    return new Date(d).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }

  function handlePay() {
    setLoading(true);
    setTimeout(async function() {
      var code = "EVT" + event.id + "-" + Date.now() + "-" + Math.random().toString(36).slice(2,8).toUpperCase();
      var lines = event.tickets.filter(function(_, i) { return qtys[i]; }).map(function(t, i) { return t.type + " x" + qtys[i]; });
      var pList = participants.map(function(p) {
        return { name: names[p.key], dob: dobs[p.key], age: calcAge(dobs[p.key]), free: isFree(p.key), type: p.type };
      });

      var orderData = {
        ticket_code: code,
        event_id: event.id,
        event_title: event.title,
        event_date: event.date,
        event_location: event.location,
        buyer_name: form.nome,
        buyer_surname: form.cognome,
        buyer_email: form.email,
        buyer_phone: form.telefono,
        ticket_lines: lines.join(", "),
        total_chf: total,
        free_count: freeCount,
        participants: pList,
        status: "confirmed",
        paid_at: new Date().toISOString(),
        qr_data: code
      };

      // 1. Salva su Supabase
      await saveOrder(orderData);

      // 2. Invia email con Resend
      await sendConfirmEmail({
        code: code,
        event: event,
        participants: pList,
        total: total,
        buyerEmail: form.email,
        lines: lines
      });

      setTicket({ code: code, form: form, event: event, lines: lines, total: total, freeCount: freeCount, pList: pList });
      setStep("confirm");
      setLoading(false);
    }, 500);
  }

  var C = event.color;
  var A = event.accent;

  function btn(label, onClick, disabled) {
    return (
      <button onClick={onClick} disabled={disabled} style={{
        flex: 2, padding: "0.9rem",
        background: disabled ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg," + C + "," + A + ")",
        border: "none", borderRadius: 12,
        color: disabled ? "rgba(255,255,255,0.3)" : "#fff",
        fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", fontSize: "1rem"
      }}>{label}</button>
    );
  }

  function backBtn(to) {
    return (
      <button onClick={function() { setStep(to); }} style={{
        flex: 1, padding: "0.9rem", background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12,
        color: "#fff", cursor: "pointer", fontWeight: 600
      }}>{"<- Indietro"}</button>
    );
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" }}
      onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "#0f0f13", borderRadius: 24, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", border: "1px solid rgba(255,255,255,0.08)" }}>

        {/* Header */}
        <div style={{ background: event.id === 3 ? "linear-gradient(135deg,#e8f5e844,#d4edda22)" : "linear-gradient(135deg," + C + "22," + A + "11)", padding: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)", position: "relative" }}>
          <button onClick={onClose} style={{ position: "absolute", top: "1rem", right: "1rem", background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 16 }}>x</button>
          <div style={{ marginBottom: 10 }}>
            {event.id === 3 ? <HDCLogo size={150}/> : event.id === 2 ? <EllevelLogo size={180}/> : <span style={{ fontSize: 36 }}>{event.emoji}</span>}
          </div>
          <div style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: "1.4rem", fontWeight: 700 }}>{event.title}</div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.82rem", marginTop: 4, lineHeight: 1.7 }}>
            <div>{"Data: " + formatDate(event.date)}</div>
            <div>{"Orario: " + event.time + "  |  " + event.location}</div>
          </div>
        </div>

        <div style={{ padding: "1.5rem" }}>

          {/* STEP: select */}
          {step === "select" && (
            <div>
              <div style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: "1.1rem", marginBottom: "0.25rem" }}>Scegli i biglietti</div>
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.8rem", marginBottom: "1.25rem" }}>Puoi selezionare piu tipologie insieme</div>

              {event.tickets.map(function(t, i) {
                var qty = qtys[i] || 0;
                var active = qty > 0;
                return (
                  <div key={i} style={{ border: "2px solid " + (active ? C : "rgba(255,255,255,0.08)"), borderRadius: 14, padding: "1rem", marginBottom: "0.75rem", background: active ? C + "15" : "rgba(255,255,255,0.03)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 24 }}>{t.emoji}</span>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ color: "#fff", fontWeight: 600, fontSize: "0.95rem" }}>{t.type}</span>
                            {t.promo && <span style={{ background: "#f59e0b22", border: "1px solid #f59e0b66", color: "#f59e0b", fontSize: "0.65rem", fontWeight: 800, padding: "1px 7px", borderRadius: 20 }}>PROMO</span>}
                          </div>
                          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem" }}>{t.description}</div>
                          {t.available && <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.72rem" }}>{t.available} posti</div>}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        {t.originalPrice && <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.75rem", textDecoration: "line-through" }}>CHF {t.originalPrice}.-</div>}
                        <div style={{ color: C, fontWeight: 700, fontSize: "1.1rem" }}>CHF {t.price}.-</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.875rem" }}>
                      <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.8rem" }}>Quantita</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <button onClick={function() { setQty(i, qty - 1); }} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 18 }}>-</button>
                        <span style={{ color: "#fff", fontWeight: 700, fontSize: "1.1rem", minWidth: 24, textAlign: "center" }}>{qty}</span>
                        <button onClick={function() { setQty(i, qty + 1); }} style={{ background: active ? "linear-gradient(135deg," + C + "," + A + ")" : "rgba(255,255,255,0.1)", border: "none", color: "#fff", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 18 }}>+</button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {hasSelection && (
                <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "0.875rem 1rem", border: "1px solid rgba(255,255,255,0.08)", marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.82rem" }}>{totalTickets} {totalTickets === 1 ? "biglietto" : "biglietti"}</span>
                  <span style={{ color: C, fontWeight: 800, fontSize: "1.4rem" }}>CHF {event.tickets.reduce(function(s, t, i) { return s + t.price * (qtys[i] || 0); }, 0)}.-</span>
                </div>
              )}

              <button onClick={function() { if (hasSelection) setStep("names"); }} style={{ width: "100%", padding: "0.9rem", background: hasSelection ? "linear-gradient(135deg," + C + "," + A + ")" : "rgba(255,255,255,0.08)", border: "none", borderRadius: 12, color: hasSelection ? "#fff" : "rgba(255,255,255,0.3)", fontWeight: 700, fontSize: "1rem", cursor: hasSelection ? "pointer" : "not-allowed" }}>
                {hasSelection ? "Continua ->" : "Seleziona almeno un biglietto"}
              </button>
            </div>
          )}

          {/* STEP: names */}
          {step === "names" && (
            <div>
              <div style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: "1.1rem", marginBottom: "0.25rem" }}>Dati dei partecipanti</div>
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.8rem", marginBottom: "1.25rem" }}>Nome, cognome e data di nascita · Bambini fino a 6 anni gratis</div>

              {participants.map(function(p, n) {
                var age = calcAge(dobs[p.key]);
                var free = isFree(p.key);
                var nameOk = (names[p.key] || "").trim().length > 0;
                var dobOk = (dobs[p.key] || "").trim().length > 0;
                return (
                  <div key={p.key} style={{ background: free ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.03)", borderRadius: 14, border: "1px solid " + (free ? "#22c55e55" : "rgba(255,255,255,0.08)"), padding: "0.875rem 1rem", marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 18 }}>{p.emoji}</span>
                        <span style={{ color: C, fontWeight: 700, fontSize: "0.82rem" }}>{p.type} - Partecipante {n + 1}</span>
                      </div>
                      {free && <span style={{ background: "#22c55e22", border: "1px solid #22c55e66", color: "#22c55e", fontSize: "0.7rem", fontWeight: 800, padding: "2px 8px", borderRadius: 20 }}>GRATUITO</span>}
                      {!free && age !== null && <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.75rem" }}>{age} anni</span>}
                    </div>

                    <NameInput
                      pkey={p.key}
                      initial={names[p.key] || ""}
                      onSave={function(v) { setNames(function(prev) { return Object.assign({}, prev, { [p.key]: v }); }); }}
                      color={C}
                      ok={nameOk}
                    />

                    <label style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.78rem", display: "block", marginBottom: 5 }}>Data di nascita</label>
                    <input
                      type="date"
                      value={dobs[p.key] || ""}
                      max={new Date().toISOString().split("T")[0]}
                      onChange={function(e) { var v = e.target.value; setDobs(function(prev) { return Object.assign({}, prev, { [p.key]: v }); }); }}
                      style={{ width: "100%", padding: "0.75rem 1rem", background: "rgba(255,255,255,0.08)", border: "1px solid " + (dobOk ? (free ? "#22c55e99" : C + "99") : "rgba(255,255,255,0.15)"), borderRadius: 10, color: dobOk ? "#fff" : "rgba(255,255,255,0.35)", fontSize: "1rem", outline: "none", boxSizing: "border-box", fontFamily: "inherit", colorScheme: "dark", display: "block", WebkitAppearance: "none" }}
                    />
                    {free && dobOk && <div style={{ color: "#22c55e", fontSize: "0.75rem", marginTop: 6 }}>Bambino di {age} anni - ingresso gratuito!</div>}
                  </div>
                );
              })}

              <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "0.875rem 1rem", border: "1px solid rgba(255,255,255,0.08)", marginBottom: "1rem" }}>
                {freeCount > 0 && <div style={{ color: "#22c55e", fontSize: "0.8rem", marginBottom: 6 }}>{freeCount} {freeCount === 1 ? "bambino gratuito" : "bambini gratuiti"} inclusi</div>}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.82rem" }}>{totalTickets} partecipanti</span>
                  <span style={{ color: C, fontWeight: 800, fontSize: "1.4rem" }}>{total === 0 ? "GRATUITO" : "CHF " + total + ".-"}</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                {backBtn("select")}
                {btn(namesComplete ? "Continua ->" : "Compila tutti i campi", function() { if (namesComplete) setStep("form"); }, !namesComplete)}
              </div>
            </div>
          )}

          {/* STEP: form */}
          {step === "form" && (
            <div>
              <div style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: "1.1rem", marginBottom: "1rem" }}>I tuoi dati di contatto</div>
              {[
                { key: "nome", label: "Nome", ph: "Mario" },
                { key: "cognome", label: "Cognome", ph: "Rossi" },
                { key: "email", label: "Email", ph: "mario@email.com" },
                { key: "telefono", label: "Telefono", ph: "+41 79 000 00 00" },
              ].map(function(f) {
                return (
                  <div key={f.key} style={{ marginBottom: "0.875rem" }}>
                    <label style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.8rem", display: "block", marginBottom: 4 }}>{f.label}</label>
                    <input
                      value={form[f.key]}
                      onChange={function(e) { var v = e.target.value; setForm(function(prev) { return Object.assign({}, prev, { [f.key]: v }); }); }}
                      placeholder={f.ph}
                      style={{ width: "100%", padding: "0.75rem 1rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, color: "#fff", fontSize: "0.95rem", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                    />
                  </div>
                );
              })}
              <div style={{ display: "flex", gap: 10, marginTop: "1.5rem" }}>
                {backBtn("names")}
                {btn("Vai al Pagamento ->", function() { if (form.email && form.nome) setStep("payment"); }, !form.email || !form.nome)}
              </div>
            </div>
          )}

          {/* STEP: payment */}
          {step === "payment" && (
            <div>
              <div style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: "1.1rem", marginBottom: "1rem" }}>Riepilogo & Pagamento</div>

              <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: "1rem", border: "1px solid rgba(255,255,255,0.08)", marginBottom: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.85rem" }}>Evento</span>
                  <span style={{ color: "#fff", fontSize: "0.85rem", fontWeight: 600 }}>{event.title}</span>
                </div>
                {event.tickets.filter(function(_, i) { return qtys[i]; }).map(function(t, i) {
                  return (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.85rem" }}>{t.emoji} {t.type}</span>
                      <span style={{ color: "#fff", fontSize: "0.85rem" }}>x{qtys[i]}  CHF {t.price * qtys[i]}.-</span>
                    </div>
                  );
                })}
                {freeCount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ color: "#22c55e", fontSize: "0.85rem" }}>Bambini gratuiti</span>
                    <span style={{ color: "#22c55e", fontSize: "0.85rem" }}>-CHF {event.tickets.reduce(function(s, t, i) { return s + t.price * (qtys[i] || 0); }, 0) - total}.-</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <span style={{ color: "#fff", fontWeight: 700 }}>Totale</span>
                  <span style={{ color: C, fontWeight: 700, fontSize: "1.2rem" }}>CHF {total}.-</span>
                </div>
              </div>

              <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: "1rem", border: "1px solid rgba(255,255,255,0.08)", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ background: "#00B8C8", borderRadius: 8, padding: "4px 10px", color: "#fff", fontWeight: 800, fontSize: "0.85rem" }}>SumUp</div>
                  <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem" }}>Pagamento sicuro</span>
                </div>
                {event.sumupUrl
                  ? <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.78rem" }}>Verrai reindirizzato alla pagina di pagamento SumUp</div>
                  : (
                    <div>
                      <input placeholder="Numero carta" style={{ width: "100%", padding: "0.7rem 1rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, color: "#fff", fontSize: "0.9rem", marginBottom: 8, boxSizing: "border-box", fontFamily: "monospace" }}/>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input placeholder="MM/YY" style={{ flex: 1, padding: "0.7rem 1rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, color: "#fff", fontSize: "0.9rem", fontFamily: "monospace", boxSizing: "border-box" }}/>
                        <input placeholder="CVV" style={{ flex: 1, padding: "0.7rem 1rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, color: "#fff", fontSize: "0.9rem", fontFamily: "monospace", boxSizing: "border-box" }}/>
                      </div>
                    </div>
                  )
                }
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                {backBtn("form")}
                {event.sumupUrl
                  ? <a href={event.sumupUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 2, padding: "0.9rem", background: "linear-gradient(135deg," + C + "," + A + ")", border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, fontSize: "1rem", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      Paga CHF {total}.- →
                    </a>
                  : btn(loading ? "Elaborazione..." : "Paga CHF " + total + ".-", handlePay, loading)
                }
              </div>
            </div>
          )}

          {/* STEP: confirm */}
          {step === "confirm" && ticket && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
              <div style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: "1.4rem", marginBottom: 4 }}>Acquisto Confermato!</div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>Biglietto inviato a {ticket.form.email}</div>
              <div style={{ background: "linear-gradient(135deg," + C + "22," + A + "11)", border: "1px solid " + C + "44", borderRadius: 20, padding: "1.5rem", marginBottom: "1rem" }}>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: "1.1rem", marginBottom: 4 }}>{event.title}</div>
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.8rem", marginBottom: "0.75rem" }}>{ticket.lines.join(" · ")} · {ticket.total === 0 ? "GRATUITO" : "CHF " + ticket.total + ".-"}</div>
                {ticket.pList && ticket.pList.length > 0 && (
                  <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: "0.6rem 0.875rem", marginBottom: "1rem", textAlign: "left" }}>
                    {ticket.pList.map(function(p, i) {
                      return (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: i < ticket.pList.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.8rem" }}>👤 {p.name} ({p.age} anni)</span>
                          {p.free && <span style={{ color: "#22c55e", fontSize: "0.7rem", fontWeight: 700 }}>GRATUITO</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
                  <QRCode data={ticket.code} size={140}/>
                </div>
                <div style={{ fontFamily: "monospace", fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", letterSpacing: 2, wordBreak: "break-all" }}>{ticket.code}</div>
              </div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.78rem" }}>Mostra il QR all'ingresso per la validazione</div>
              <button onClick={onClose} style={{ marginTop: "1.25rem", width: "100%", padding: "0.9rem", background: "linear-gradient(135deg," + C + "," + A + ")", border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "1rem" }}>Chiudi</button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ─── Event Card ───────────────────────────────────────────────
function EventCard({ event, onBuy }) {
  function formatDate(d) {
    return new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
  }
  var minPrice = Math.min.apply(null, event.tickets.map(function(t) { return t.price; }));
  var C = event.color;
  var A = event.accent;

  return (
    <div
      style={{ background: "#0f0f13", border: event.soldOut ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(255,255,255,0.07)", borderRadius: 22, overflow: "hidden", boxShadow: "0 4px 30px " + C + "15", opacity: event.soldOut ? 0.72 : 1, transition: "transform 0.2s, box-shadow 0.2s" }}
      onMouseEnter={function(e) { if (!event.soldOut) { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 16px 50px " + C + "30"; } }}
      onMouseLeave={function(e) { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 30px " + C + "15"; }}
    >
      {/* Banner */}
      <div style={{ background: event.id === 3 ? "linear-gradient(135deg,#e8f5e8,#f0faf0)" : event.id === 2 ? "linear-gradient(135deg,#1a0000,#2d0000)" : "linear-gradient(135deg," + C + "33," + A + "22)", padding: "2rem", textAlign: "center", position: "relative", borderBottom: "1px solid " + C + "22" }}>
        <span style={{ position: "absolute", top: "1rem", left: "1rem", background: C + "33", border: "1px solid " + C + "55", borderRadius: 20, padding: "3px 12px", color: event.id === 3 ? "#2d6a2d" : C, fontSize: "0.72rem", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>{event.category}</span>
        {event.soldOut && (
          <div style={{ position: "absolute", top: "1rem", right: "1rem", background: "#E63946", borderRadius: 20, padding: "4px 14px", color: "#fff", fontSize: "0.72rem", fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>SOLD OUT</div>
        )}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 80 }}>
          {event.id === 3 ? <HDCLogo size={160}/> : event.id === 2 ? <EllevelLogo size={190}/> : <span style={{ fontSize: 52, filter: event.soldOut ? "grayscale(0.5)" : "none" }}>{event.emoji}</span>}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "1.25rem" }}>
        <div style={{ color: event.soldOut ? "rgba(255,255,255,0.45)" : "#fff", fontFamily: "Georgia,serif", fontSize: "1.2rem", fontWeight: 700, lineHeight: 1.2 }}>{event.title}</div>
        <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.8rem", marginTop: 3 }}>{event.subtitle}</div>
        <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.82rem" }}>{"📅 " + formatDate(event.date)}</div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.82rem" }}>{"⏰ " + event.time}</div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.82rem" }}>{"📍 " + event.location}</div>
          <div style={{ color: event.soldOut ? "#E63946" : "rgba(255,255,255,0.6)", fontSize: "0.82rem", fontWeight: event.soldOut ? 700 : 400 }}>{"🎟️ " + (event.soldOut ? "Esaurito" : event.available + " posti disponibili")}</div>
        </div>
        <div style={{ marginTop: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            {event.soldOut
              ? <div style={{ color: "#E63946", fontWeight: 800, fontSize: "1rem", letterSpacing: 1 }}>SOLD OUT</div>
              : <div><div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem" }}>DA</div><div style={{ color: C, fontWeight: 800, fontSize: "1.5rem" }}>CHF {minPrice}.-</div></div>
            }
          </div>
          <button
            onClick={function() { if (!event.soldOut) onBuy(event); }}
            disabled={event.soldOut}
            style={{ background: event.soldOut ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg," + C + "," + A + ")", border: event.soldOut ? "1px solid rgba(255,255,255,0.1)" : "none", borderRadius: 12, padding: "0.7rem 1.4rem", color: event.soldOut ? "rgba(255,255,255,0.3)" : "#fff", fontWeight: 700, cursor: event.soldOut ? "not-allowed" : "pointer", fontSize: "0.9rem" }}
          >
            {event.soldOut ? "Non disponibile" : "Acquista ->"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────
export default function App() {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("Tutti");
  var categories = ["Tutti", "Danza", "Fitness"];
  var filtered = filter === "Tutti" ? EVENTS : EVENTS.filter(function(e) { return e.category === filter; });

  return (
    <div style={{ minHeight: "100vh", background: "#08080c", fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>

      {/* Hero */}
      <div style={{ background: "linear-gradient(180deg,#1a0a2e 0%,#08080c 100%)", padding: "3rem 1.5rem 2rem", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.06)", borderRadius: 20, padding: "5px 14px", marginBottom: "1rem" }}>
          <span>🎟️</span>
          <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.8rem", letterSpacing: 1 }}>TICKETING PLATFORM</span>
        </div>
        <h1 style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: "clamp(2rem,6vw,3.5rem)", margin: "0 0 0.5rem", lineHeight: 1.1 }}>
          Danza &amp; Fitness<br/>
          <span style={{ background: "linear-gradient(135deg,#E63946,#6C63FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Events</span>
        </h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.95rem", margin: 0 }}>Acquista il tuo biglietto in pochi secondi · QR Code immediato</p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: "1.25rem 1rem" }}>
        {categories.map(function(cat) {
          return (
            <button key={cat} onClick={function() { setFilter(cat); }} style={{ padding: "0.5rem 1.25rem", borderRadius: 20, fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", background: filter === cat ? "#fff" : "rgba(255,255,255,0.06)", border: filter === cat ? "none" : "1px solid rgba(255,255,255,0.1)", color: filter === cat ? "#08080c" : "rgba(255,255,255,0.6)" }}>{cat}</button>
          );
        })}
      </div>

      {/* Grid */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 1rem 3rem", display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))", gap: "1.25rem" }}>
        {filtered.map(function(event) {
          return <EventCard key={event.id} event={event} onBuy={setSelected}/>;
        })}
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.25)", fontSize: "0.78rem" }}>
        Pagamenti sicuri tramite <strong style={{ color: "#00B8C8" }}>SumUp</strong> · QR Code verificato all'ingresso
      </div>

      {selected && <TicketModal event={selected} onClose={function() { setSelected(null); }}/>}
    </div>
  );
}
