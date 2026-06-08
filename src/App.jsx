import { useState, useEffect } from "react";

const DEFAULT_HABITS = [
  { id: 1, label: "Despertar a las 9:00 am", icon: "🌅" },
  { id: 2, label: "Hidratarme (3-4 ltrs)", icon: "💧" },
  { id: 3, label: "Caminar / Caminadora", icon: "🚶" },
  { id: 4, label: "Entrenar", icon: "💪" },
  { id: 5, label: "Meditar 5 min", icon: "🧘" },
  { id: 6, label: "Ducha", icon: "🚿" },
  { id: 7, label: "Desayuno", icon: "🍳" },
  { id: 8, label: "Preparar comida", icon: "🥗" },
  { id: 9, label: "Preparar cena", icon: "🍽️" },
  { id: 10, label: "Trabajo 4 horas", icon: "💼" },
  { id: 11, label: "Leer 30 min", icon: "📖" },
  { id: 12, label: "Dormir antes de las 2 am", icon: "🌙" },
  { id: 13, label: "Trabajo para la casa", icon: "🏠" },
];

const ICONS = ["🌅","💧","🚶","💪","🧘","🚿","🍳","🥗","🍽️","💼","📖","🌙","🏠","🎯","🏃","🧹","✍️","🎵","🌿","🧠","💊","🛏️","🥤","🍎","🧺","💰","📝","🤸","🚴","🏋️"];

// Zona horaria fija Argentina
function getTodayKey() {
  const now = new Date();
  const ar = new Date(now.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
  const y = ar.getFullYear();
  const m = String(ar.getMonth() + 1).padStart(2, "0");
  const d = String(ar.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateAR(key) {
  const [y, mo, d] = key.split("-").map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function getDayNumber(data) {
  const keys = Object.keys(data).sort();
  if (!keys.length) return 1;
  const [sy, sm, sd] = keys[0].split("-").map(Number);
  const [ty, tm, td] = getTodayKey().split("-").map(Number);
  return Math.floor((new Date(ty, tm-1, td) - new Date(sy, sm-1, sd)) / 86400000) + 1;
}

// Storage: usa window.storage (artifacts) si existe, sino localStorage
async function storageGet(key, fallback) {
  try {
    if (window.storage) {
      const r = await window.storage.get(key);
      return r ? JSON.parse(r.value) : fallback;
    } else {
      const r = localStorage.getItem(key);
      return r ? JSON.parse(r) : fallback;
    }
  } catch { return fallback; }
}

async function storageSet(key, val) {
  try {
    if (window.storage) {
      await window.storage.set(key, JSON.stringify(val));
    } else {
      localStorage.setItem(key, JSON.stringify(val));
    }
  } catch {}
}

export default function App() {
  const [habits, setHabits] = useState(DEFAULT_HABITS);
  const [data, setDataState] = useState({});
  const [notes, setNotes] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState("hoy");
  const [newLabel, setNewLabel] = useState("");
  const [newIcon, setNewIcon] = useState("🎯");
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [notesView, setNotesView] = useState("lista");
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteBody, setNewNoteBody] = useState("");

  const todayKey = getTodayKey();
  const dayRecord = data[todayKey] || { checked: {}, gratitud: "", nota: "" };
  const dayNumber = getDayNumber(data);
  const allKeys = Object.keys(data).sort().reverse();
  const totalDays = allKeys.length;
  const perfectDays = allKeys.filter(k => habits.filter(h => data[k]?.checked?.[h.id]).length === habits.length).length;
  const todayDone = habits.filter(h => dayRecord.checked?.[h.id]).length;

  // Cargar datos al inicio
  useEffect(() => {
    (async () => {
      const h = await storageGet("reto-habits", DEFAULT_HABITS);
      const d = await storageGet("reto-data", {});
      const n = await storageGet("reto-notes", []);
      setHabits(h);
      setDataState(d);
      setNotes(n);
      setLoaded(true);
    })();
  }, []);

  async function setData(val) {
    setDataState(val);
    await storageSet("reto-data", val);
  }

  async function updateHabits(val) {
    setHabits(val);
    await storageSet("reto-habits", val);
  }

  async function updateNotes(val) {
    setNotes(val);
    await storageSet("reto-notes", val);
  }

  function toggle(id) {
    setData({ ...data, [todayKey]: { ...dayRecord, checked: { ...dayRecord.checked, [id]: !dayRecord.checked[id] } } });
  }

  function updateField(field, value) {
    setData({ ...data, [todayKey]: { ...dayRecord, [field]: value } });
  }

  function addHabit() {
    if (!newLabel.trim()) return;
    updateHabits([...habits, { id: Date.now(), label: newLabel.trim(), icon: newIcon }]);
    setNewLabel(""); setNewIcon("🎯");
  }

  function addNote() {
    if (!newNoteTitle.trim() && !newNoteBody.trim()) return;
    updateNotes([{ id: Date.now(), title: newNoteTitle.trim(), body: newNoteBody.trim(), date: todayKey }, ...notes]);
    setNewNoteTitle(""); setNewNoteBody(""); setNotesView("lista");
  }

  function exportPDF() {
    const sorted = [...allKeys].reverse();
    const total = sorted.length;
    const perfect = sorted.filter(k => habits.filter(h => data[k]?.checked?.[h.id]).length === habits.length).length;
    const avg = total === 0 ? 0 : Math.round(sorted.reduce((a, k) => a + habits.filter(h => data[k]?.checked?.[h.id]).length, 0) / (total * habits.length) * 100);

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Reto de Consistencia</title>
<style>
  body{font-family:Georgia,serif;color:#1a1a2e;padding:32px;max-width:720px;margin:0 auto}
  h1{font-size:22px;margin-bottom:4px}
  .sub{color:#6b63a8;font-size:13px;margin-bottom:28px}
  .stats{background:#f9f7ff;border-radius:10px;padding:16px 24px;margin-bottom:28px;display:flex;gap:40px;flex-wrap:wrap}
  .sv{font-size:26px;font-weight:bold;color:#302b63}.sl{font-size:12px;color:#888}
  .day{border:1px solid #ddd;border-radius:10px;padding:14px 18px;margin-bottom:14px;page-break-inside:avoid}
  .dh{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px}
  .dt{font-size:15px;font-weight:bold}.dd{font-size:11px;color:#888;margin-top:2px}
  .pct{font-size:20px;font-weight:bold;text-align:right}
  .p{color:#2d9e6b}.g{color:#c9930a}.l{color:#c0532a}
  .bar{height:5px;background:#eee;border-radius:4px;margin-bottom:10px}
  .bf{height:5px;border-radius:4px}
  .habits{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:6px}
  .habit{font-size:11px;padding:2px 7px;border-radius:10px}
  .done{background:#d4f5e4;color:#1a6b45}.miss{background:#f5e4e4;color:#7a2020;text-decoration:line-through}
  .grat{font-size:12px;color:#6b63a8;margin-top:4px;font-style:italic}
  .nota{font-size:12px;color:#555;margin-top:3px}
  @media print{.day{page-break-inside:avoid}}
</style></head><body>
<h1>🎯 Reto de Consistencia — Historial</h1>
<div class="sub">Exportado el ${formatDateAR(todayKey)}</div>
<div class="stats">
  <div><div class="sv">${total}</div><div class="sl">Días registrados</div></div>
  <div><div class="sv">⭐ ${perfect}</div><div class="sl">Días perfectos</div></div>
  <div><div class="sv">${avg}%</div><div class="sl">Promedio general</div></div>
</div>
${sorted.reverse().map((key, i) => {
  const rec = data[key] || {};
  const done = habits.filter(h => rec.checked?.[h.id]).length;
  const pct = Math.round(done / habits.length * 100);
  const ip = done === habits.length;
  const cls = ip ? "p" : pct >= 70 ? "g" : "l";
  const bg = ip ? "#2d9e6b" : pct >= 70 ? "#c9930a" : "#c0532a";
  return `<div class="day">
  <div class="dh">
    <div><div class="dt">${ip?"⭐ ":""}Día ${sorted.length - i}</div><div class="dd">${formatDateAR(key)}</div></div>
    <div class="pct ${cls}">${pct}%<br><span style="font-size:11px;font-weight:normal;color:#888">${done}/${habits.length}</span></div>
  </div>
  <div class="bar"><div class="bf" style="width:${pct}%;background:${bg}"></div></div>
  <div class="habits">${habits.map(h=>`<span class="habit ${rec.checked?.[h.id]?"done":"miss"}">${h.icon} ${h.label}</span>`).join("")}</div>
  ${rec.gratitud?`<div class="grat">🙏 "${rec.gratitud}"</div>`:""}
  ${rec.nota?`<div class="nota">📝 ${rec.nota}</div>`:""}
</div>`;
}).join("")}
<script>window.onload=()=>window.print()</script>
</body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `reto-${todayKey}.html`; a.click();
    URL.revokeObjectURL(url);
  }

  if (!loaded) return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0f0c29,#302b63,#24243e)", display: "flex", alignItems: "center", justifyContent: "center", color: "#a89be0", fontSize: 16 }}>
      Cargando...
    </div>
  );

  const S = { // shared styles
    card: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "13px 16px" },
    label: { fontSize: 11, letterSpacing: 2, color: "#a89be0", textTransform: "uppercase", display: "block", marginBottom: 6 },
    input: { width: "100%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "10px 12px", color: "#f0ece4", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" },
    textarea: { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 12px", color: "#f0ece4", fontSize: 13, resize: "none", fontFamily: "inherit", boxSizing: "border-box" },
    btnGreen: { background: "rgba(144,224,174,0.15)", border: "1px solid rgba(144,224,174,0.35)", color: "#90e0ae", borderRadius: 10, padding: "11px", fontSize: 14, cursor: "pointer", width: "100%" },
    btnRed: { background: "rgba(244,114,82,0.15)", border: "1px solid rgba(244,114,82,0.3)", color: "#f4a261", borderRadius: 8, padding: "5px 12px", fontSize: 13, cursor: "pointer" },
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0f0c29,#302b63,#24243e)", fontFamily: "Georgia,serif", color: "#f0ece4", paddingBottom: 60 }}>

      {/* HEADER */}
      <div style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "18px 20px 14px", position: "sticky", top: 0, backdropFilter: "blur(12px)", zIndex: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "#a89be0", textTransform: "uppercase", marginBottom: 2 }}>Reto de Consistencia</div>
            <div style={{ fontSize: 24, fontWeight: "bold", lineHeight: 1 }}>Día {dayNumber}<span style={{ color: "#a89be0", fontWeight: 300 }}>/30</span></div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "#a89be0" }}>{totalDays} días</div>
            <div style={{ fontSize: 11, color: "#f9c74f" }}>⭐ {perfectDays} perfectos</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
          {[["hoy","Hoy"],["notas","📝 Notas"],["historial","Historial"],["editar lista","✏️ Lista"]].map(([k,lbl]) => (
            <button key={k} onClick={() => setView(k)} style={{ background: view===k ? "rgba(168,155,224,0.25)" : "transparent", border: view===k ? "1px solid #a89be0" : "1px solid rgba(255,255,255,0.1)", color: view===k ? "#f0ece4" : "#a89be0", padding: "5px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer" }}>{lbl}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px" }}>

        {/* ── HOY ── */}
        {view === "hoy" && (
          <>
            <div style={{ textAlign: "center", padding: "24px 0 18px" }}>
              <ProgressRing done={todayDone} total={habits.length} />
              <div style={{ marginTop: 8, fontSize: 12, color: "#a89be0" }}>
                {formatDateAR(todayKey)}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {habits.map(h => {
                const done = !!dayRecord.checked?.[h.id];
                return (
                  <div key={h.id} onClick={() => toggle(h.id)} style={{ display: "flex", alignItems: "center", gap: 14, background: done ? "rgba(144,224,174,0.1)" : "rgba(255,255,255,0.04)", border: done ? "1px solid rgba(144,224,174,0.3)" : "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "12px 16px", cursor: "pointer" }}>
                    <span style={{ fontSize: 20, minWidth: 28 }}>{h.icon}</span>
                    <span style={{ flex: 1, fontSize: 14, color: done ? "#90e0ae" : "#d8d4ec", textDecoration: done ? "line-through" : "none" }}>{h.label}</span>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", border: done ? "none" : "2px solid rgba(255,255,255,0.2)", background: done ? "#90e0ae" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#1a1a2e", fontWeight: "bold", flexShrink: 0 }}>{done ? "✓" : ""}</div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
              {[["gratitud","Gratitud del día","Estoy agradecido/a por..."],["nota","Nota / Reflexión","¿Cómo estuvo el día?"]].map(([field,lbl,ph]) => (
                <div key={field}>
                  <label style={S.label}>{lbl}</label>
                  <textarea value={dayRecord[field]||""} onChange={e => updateField(field, e.target.value)} placeholder={ph} rows={2} style={S.textarea} />
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── NOTAS ── */}
        {view === "notas" && (
          <div style={{ paddingTop: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 11, letterSpacing: 3, color: "#a89be0", textTransform: "uppercase" }}>Notas</div>
              <button onClick={() => setNotesView(notesView==="nueva"?"lista":"nueva")} style={{ background: notesView==="nueva" ? "rgba(244,114,82,0.15)" : "rgba(144,224,174,0.15)", border: notesView==="nueva" ? "1px solid rgba(244,114,82,0.35)" : "1px solid rgba(144,224,174,0.35)", color: notesView==="nueva" ? "#f4a261" : "#90e0ae", borderRadius: 10, padding: "6px 14px", fontSize: 13, cursor: "pointer" }}>
                {notesView === "nueva" ? "✕ Cancelar" : "+ Nueva nota"}
              </button>
            </div>

            {notesView === "nueva" && (
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(168,155,224,0.25)", borderRadius: 14, padding: "16px", marginBottom: 20 }}>
                <div style={{ marginBottom: 12 }}>
                  <label style={S.label}>Título</label>
                  <input value={newNoteTitle} onChange={e => setNewNoteTitle(e.target.value)} placeholder="Ej: Reflexión del entrenamiento" style={S.input} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={S.label}>Contenido</label>
                  <textarea value={newNoteBody} onChange={e => setNewNoteBody(e.target.value)} placeholder="Escribí lo que quieras..." rows={5} style={{ ...S.textarea, resize: "vertical" }} />
                </div>
                <button onClick={addNote} style={S.btnGreen}>Guardar nota</button>
              </div>
            )}

            {notesView === "lista" && (
              notes.length === 0
                ? <div style={{ textAlign: "center", color: "#a89be0", marginTop: 40, fontSize: 14 }}>No hay notas todavía.</div>
                : <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {notes.map(n => (
                      <div key={n.id} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "14px 16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                          <div>
                            {n.title && <div style={{ fontSize: 15, fontWeight: "bold", marginBottom: 2 }}>{n.title}</div>}
                            <div style={{ fontSize: 11, color: "#a89be0" }}>{formatDateAR(n.date)}</div>
                          </div>
                          <button onClick={() => updateNotes(notes.filter(x => x.id !== n.id))} style={{ ...S.btnRed, padding: "3px 9px", fontSize: 12 }}>✕</button>
                        </div>
                        {n.body && <div style={{ fontSize: 13, color: "#c8c4e0", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{n.body}</div>}
                      </div>
                    ))}
                  </div>
            )}
          </div>
        )}

        {/* ── EDITAR LISTA ── */}
        {view === "editar lista" && (
          <div style={{ paddingTop: 22 }}>
            <div style={{ fontSize: 11, letterSpacing: 3, color: "#a89be0", textTransform: "uppercase", marginBottom: 14 }}>Gestionar hábitos</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
              {habits.map(h => (
                <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 12, ...S.card }}>
                  <span style={{ fontSize: 20, minWidth: 28 }}>{h.icon}</span>
                  <span style={{ flex: 1, fontSize: 14, color: "#d8d4ec" }}>{h.label}</span>
                  <button onClick={() => updateHabits(habits.filter(x => x.id !== h.id))} style={S.btnRed}>✕</button>
                </div>
              ))}
            </div>
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(168,155,224,0.25)", borderRadius: 14, padding: "16px" }}>
              <div style={{ fontSize: 11, letterSpacing: 2, color: "#a89be0", textTransform: "uppercase", marginBottom: 14 }}>Agregar hábito</div>
              <div style={{ marginBottom: 12 }}>
                <label style={S.label}>Ícono</label>
                <button onClick={() => setShowIconPicker(!showIconPicker)} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "7px 14px", fontSize: 20, cursor: "pointer", color: "#f0ece4" }}>
                  {newIcon} <span style={{ fontSize: 12, color: "#a89be0", marginLeft: 6 }}>{showIconPicker ? "▲" : "▼"}</span>
                </button>
                {showIconPicker && (
                  <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {ICONS.map(ic => (
                      <button key={ic} onClick={() => { setNewIcon(ic); setShowIconPicker(false); }} style={{ fontSize: 22, background: newIcon===ic ? "rgba(168,155,224,0.3)" : "rgba(255,255,255,0.05)", border: newIcon===ic ? "1px solid #a89be0" : "1px solid transparent", borderRadius: 8, padding: "4px 6px", cursor: "pointer" }}>{ic}</button>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={S.label}>Nombre</label>
                <input value={newLabel} onChange={e => setNewLabel(e.target.value)} onKeyDown={e => e.key==="Enter" && addHabit()} placeholder="Ej: Tomar vitaminas" style={S.input} />
              </div>
              <button onClick={addHabit} style={S.btnGreen}>+ Agregar hábito</button>
            </div>
          </div>
        )}

        {/* ── HISTORIAL ── */}
        {view === "historial" && (
          <div style={{ paddingTop: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 11, letterSpacing: 3, color: "#a89be0", textTransform: "uppercase" }}>Historial</div>
              {allKeys.length > 0 && (
                <button onClick={exportPDF} style={{ background: "rgba(249,199,79,0.15)", border: "1px solid rgba(249,199,79,0.35)", color: "#f9c74f", borderRadius: 10, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>
                  ⬇️ Exportar PDF
                </button>
              )}
            </div>
            {allKeys.length === 0 && <div style={{ textAlign: "center", color: "#a89be0", marginTop: 40, fontSize: 14 }}>Todavía no hay días registrados.</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {allKeys.map((key, i) => {
                const rec = data[key] || {};
                const done = habits.filter(h => rec.checked?.[h.id]).length;
                const pct = Math.round(done / habits.length * 100);
                const ip = done === habits.length;
                return (
                  <div key={key} style={{ background: ip ? "rgba(144,224,174,0.07)" : "rgba(255,255,255,0.04)", border: ip ? "1px solid rgba(144,224,174,0.25)" : "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "13px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: "bold", marginBottom: 2 }}>{ip && "⭐ "}Día {allKeys.length - i}</div>
                        <div style={{ fontSize: 11, color: "#a89be0" }}>{formatDateAR(key)}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 20, fontWeight: "bold", color: ip ? "#90e0ae" : pct>=70 ? "#f9c74f" : "#f4a261" }}>{pct}%</div>
                        <div style={{ fontSize: 11, color: "#a89be0" }}>{done}/{habits.length}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 8, height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 4 }}>
                      <div style={{ height: "100%", width: `${pct}%`, borderRadius: 4, background: ip ? "#90e0ae" : pct>=70 ? "#f9c74f" : "#f4a261" }} />
                    </div>
                    {rec.gratitud && <div style={{ marginTop: 6, fontSize: 12, color: "#a89be0", fontStyle: "italic" }}>"{rec.gratitud}"</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function ProgressRing({ done, total }) {
  const pct = total > 0 ? done / total : 0;
  const r = 52, circ = 2 * Math.PI * r;
  const color = pct === 1 ? "#90e0ae" : pct >= 0.7 ? "#f9c74f" : "#a89be0";
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <svg width={130} height={130}>
        <circle cx={65} cy={65} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={8} />
        <circle cx={65} cy={65} r={r} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
          transform="rotate(-90 65 65)" style={{ transition: "stroke-dashoffset 0.5s, stroke 0.3s" }} />
      </svg>
      <div style={{ position: "absolute", top: 0, left: 0, width: 130, height: 130, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 28, fontWeight: "bold", color }}>{done}</div>
        <div style={{ fontSize: 12, color: "#a89be0" }}>de {total}</div>
      </div>
    </div>
  );
}
