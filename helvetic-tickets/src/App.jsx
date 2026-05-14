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
  return (
    <img
      src="/hdc-logo.jpeg"
      alt="Helvetic Dance Competition"
      style={{ width: size || 160, objectFit: "contain", display: "block" }}
    />
  );
}


