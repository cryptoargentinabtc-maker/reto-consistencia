import { useState } from "react";

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

const DATA_KEY = "reto-data-v2";
const HABITS_KEY = "reto-habits-v2";

function load(key, fallback) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; }
  catch { return fallback; }
}
function save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

function getTodayKey() { return new Date().toISOString().split("T")[0]; }

function getDayNumber(data) {
  const keys = Object.keys(data).sort();
  if (!keys.length) return 1;
  const start = keys[0];
  const today = getTodayKey();
  return Math.floor((new Date(today) - new Date(start)) / 86400000) + 1;
}

function getDayRecord(data, key) {
  return data[key] || { checked: {}, gratitud: "", nota: "" };
}

export default function App() {
  const [habits, setHabits] = useState(() => load(HABITS_KEY, DEFAULT_HABITS));
  const [data, setDataState] = useState(() => load(DATA_KEY, {}));
  const [view, setView] = useState("hoy");
  const [editMode, setEditMode] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newIcon, setNewIcon] = useState("🎯");
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [notesView, setNotesView] = useState("lista"); // lista | nueva
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteBody, setNewNoteBody] = useState("");
  const todayKey = getTodayKey();

  const dayRecord = getDayRecord(data, todayKey);
  const dayNumber = getDayNumber(data);

  function setData(val) { setDataState(val); save(DATA_KEY, val); }
  function updateHabits(val) { setHabits(val); save(HABITS_KEY, val); }

  function toggle(id) {
    const updated = { ...data, [todayKey]: { ...dayRecord, checked: { ...dayRecord.checked, [id]: !dayRecord.checked[id] } } };
    setData(updated);
  }

  function updateField(field, value) {
    setData({ ...data, [todayKey]: { ...dayRecord, [field]: value } });
  }

  function completedCount(record, habitList) {
    return habitList.filter((h) => record.checked?.[h.id]).length;
  }

  function addHabit() {
    if (!newLabel.trim()) return;
    const newId = Date.now();
    const updated = [...habits, { id: newId, label: newLabel.trim(), icon: newIcon }];
    updateHabits(updated);
    setNewLabel("");
    setNewIcon("🎯");
  }

  function removeHabit(id) {
    updateHabits(habits.filter((h) => h.id !== id));
  }

  function addNote() {
    if (!newNoteTitle.trim() && !newNoteBody.trim()) return;
    const notes = load("reto-notes", []);
    const updated = [{ id: Date.now(), title: newNoteTitle.trim(), body: newNoteBody.trim(), date: getTodayKey() }, ...notes];
    save("reto-notes", updated);
    setNewNoteTitle("");
    setNewNoteBody("");
    setNotesView("lista");
  }

  function deleteNote(id) {
    const notes = load("reto-notes", []);
    save("reto-notes", notes.filter((n) => n.id !== id));
    // force re-render
    setDataState({ ...data });
  }

  const allKeys = Object.keys(data).sort().reverse();
  const totalDays = allKeys.length;
  const perfectDays = allKeys.filter((k) => completedCount(data[k], habits) === habits.length).length;
  const todayDone = completedCount(dayRecord, habits);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)", fontFamily: "'Georgia', serif", color: "#f0ece4", paddingBottom: 60 }}>

      {/* Header */}
      <div style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "20px 24px 16px", position: "sticky", top: 0, backdropFilter: "blur(12px)", zIndex: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 3, color: "#a89be0", textTransform: "uppercase", marginBottom: 2 }}>Reto de Consistencia</div>
            <div style={{ fontSize: 26, fontWeight: "bold", lineHeight: 1 }}>Día {dayNumber}<span style={{ color: "#a89be0", fontWeight: 300 }}>/30</span></div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: "#a89be0" }}>{totalDays} días registrados</div>
            <div style={{ fontSize: 12, color: "#f9c74f" }}>⭐ {perfectDays} perfectos</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
          {[
            { key: "hoy", label: "Hoy" },
            { key: "notas", label: "📝 Notas" },
            { key: "historial", label: "Historial" },
            { key: "editar lista", label: "✏️ Lista" },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => { setView(key); setEditMode(key === "editar lista"); }} style={{
              background: view === key ? "rgba(168,155,224,0.25)" : "transparent",
              border: view === key ? "1px solid #a89be0" : "1px solid rgba(255,255,255,0.1)",
              color: view === key ? "#f0ece4" : "#a89be0",
              padding: "6px 16px", borderRadius: 20, fontSize: 13, cursor: "pointer", letterSpacing: 0.5,
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px" }}>

        {/* ── HOY ── */}
        {view === "hoy" && (
          <>
            <div style={{ textAlign: "center", padding: "28px 0 20px" }}>
              <ProgressRing done={todayDone} total={habits.length} />
              <div style={{ marginTop: 10, fontSize: 13, color: "#a89be0" }}>
                {new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
              </div>
            </div>

            {/* Hábitos */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {habits.map((h) => {
                const done = !!dayRecord.checked?.[h.id];
                return (
                  <div key={h.id} onClick={() => toggle(h.id)} style={{ display: "flex", alignItems: "center", gap: 14, background: done ? "rgba(144,224,174,0.1)" : "rgba(255,255,255,0.04)", border: done ? "1px solid rgba(144,224,174,0.3)" : "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "13px 16px", cursor: "pointer", transition: "all 0.15s" }}>
                    <span style={{ fontSize: 20, minWidth: 28 }}>{h.icon}</span>
                    <span style={{ flex: 1, fontSize: 14, color: done ? "#90e0ae" : "#d8d4ec", textDecoration: done ? "line-through" : "none", textDecorationColor: "rgba(144,224,174,0.5)" }}>{h.label}</span>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", border: done ? "none" : "2px solid rgba(255,255,255,0.2)", background: done ? "#90e0ae" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#1a1a2e", fontWeight: "bold", flexShrink: 0 }}>{done ? "✓" : ""}</div>
                  </div>
                );
              })}
            </div>

            {/* Gratitud / Nota */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              {[["gratitud", "Gratitud del día", "Estoy agradecido/a por..."], ["nota", "Nota / Reflexión", "¿Cómo estuvo el día?"]].map(([field, lbl, ph]) => (
                <div key={field}>
                  <label style={{ fontSize: 11, letterSpacing: 2, color: "#a89be0", textTransform: "uppercase", display: "block", marginBottom: 6 }}>{lbl}</label>
                  <textarea value={dayRecord[field] || ""} onChange={(e) => updateField(field, e.target.value)} placeholder={ph} rows={2} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 12px", color: "#f0ece4", fontSize: 13, resize: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── NOTAS ── */}
        {view === "notas" && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 11, letterSpacing: 3, color: "#a89be0", textTransform: "uppercase" }}>Notas</div>
              <button onClick={() => setNotesView(notesView === "nueva" ? "lista" : "nueva")} style={{ background: notesView === "nueva" ? "rgba(244,114,82,0.15)" : "rgba(144,224,174,0.15)", border: notesView === "nueva" ? "1px solid rgba(244,114,82,0.35)" : "1px solid rgba(144,224,174,0.35)", color: notesView === "nueva" ? "#f4a261" : "#90e0ae", borderRadius: 10, padding: "7px 16px", fontSize: 13, cursor: "pointer" }}>
                {notesView === "nueva" ? "✕ Cancelar" : "+ Nueva nota"}
              </button>
            </div>

            {/* Form nueva nota */}
            {notesView === "nueva" && (
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(168,155,224,0.25)", borderRadius: 14, padding: "18px 16px", marginBottom: 20 }}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, letterSpacing: 2, color: "#a89be0", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Título</label>
                  <input
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    placeholder="Ej: Reflexión del entrenamiento"
                    style={{ width: "100%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "10px 12px", color: "#f0ece4", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 11, letterSpacing: 2, color: "#a89be0", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Contenido</label>
                  <textarea
                    value={newNoteBody}
                    onChange={(e) => setNewNoteBody(e.target.value)}
                    placeholder="Escribí lo que quieras..."
                    rows={5}
                    style={{ width: "100%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "10px 12px", color: "#f0ece4", fontSize: 14, resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
                  />
                </div>
                <button onClick={addNote} style={{ width: "100%", background: "rgba(144,224,174,0.15)", border: "1px solid rgba(144,224,174,0.35)", color: "#90e0ae", borderRadius: 10, padding: "11px", fontSize: 14, cursor: "pointer" }}>
                  Guardar nota
                </button>
              </div>
            )}

            {/* Lista de notas */}
            {notesView === "lista" && (() => {
              const notes = load("reto-notes", []);
              if (notes.length === 0) return (
                <div style={{ textAlign: "center", color: "#a89be0", marginTop: 40, fontSize: 14 }}>No hay notas todavía.</div>
              );
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {notes.map((n) => (
                    <div key={n.id} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div>
                          {n.title && <div style={{ fontSize: 15, fontWeight: "bold", color: "#f0ece4", marginBottom: 2 }}>{n.title}</div>}
                          <div style={{ fontSize: 11, color: "#a89be0" }}>{new Date(n.date + "T12:00:00").toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" })}</div>
                        </div>
                        <button onClick={() => deleteNote(n.id)} style={{ background: "rgba(244,114,82,0.12)", border: "1px solid rgba(244,114,82,0.25)", color: "#f4a261", borderRadius: 8, padding: "4px 10px", fontSize: 12, cursor: "pointer", flexShrink: 0 }}>✕</button>
                      </div>
                      {n.body && <div style={{ fontSize: 13, color: "#c8c4e0", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{n.body}</div>}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* ── EDITAR LISTA ── */}
        {view === "editar lista" && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ fontSize: 11, letterSpacing: 3, color: "#a89be0", textTransform: "uppercase", marginBottom: 16 }}>Gestionar hábitos</div>

            {/* Lista actual */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
              {habits.map((h) => (
                <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 14px" }}>
                  <span style={{ fontSize: 20, minWidth: 28 }}>{h.icon}</span>
                  <span style={{ flex: 1, fontSize: 14, color: "#d8d4ec" }}>{h.label}</span>
                  <button onClick={() => removeHabit(h.id)} style={{ background: "rgba(244,114,82,0.15)", border: "1px solid rgba(244,114,82,0.3)", color: "#f4a261", borderRadius: 8, padding: "5px 12px", fontSize: 13, cursor: "pointer" }}>✕</button>
                </div>
              ))}
            </div>

            {/* Agregar nuevo */}
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(168,155,224,0.25)", borderRadius: 14, padding: "18px 16px" }}>
              <div style={{ fontSize: 11, letterSpacing: 2, color: "#a89be0", textTransform: "uppercase", marginBottom: 14 }}>Agregar hábito</div>

              {/* Icon picker trigger */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: "#a89be0", display: "block", marginBottom: 6 }}>Ícono</label>
                <button onClick={() => setShowIconPicker(!showIconPicker)} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "8px 16px", fontSize: 20, cursor: "pointer", color: "#f0ece4" }}>
                  {newIcon} <span style={{ fontSize: 12, color: "#a89be0", marginLeft: 8 }}>{showIconPicker ? "▲ cerrar" : "▼ elegir"}</span>
                </button>
                {showIconPicker && (
                  <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {ICONS.map((ic) => (
                      <button key={ic} onClick={() => { setNewIcon(ic); setShowIconPicker(false); }} style={{ fontSize: 22, background: newIcon === ic ? "rgba(168,155,224,0.3)" : "rgba(255,255,255,0.05)", border: newIcon === ic ? "1px solid #a89be0" : "1px solid transparent", borderRadius: 8, padding: "4px 6px", cursor: "pointer" }}>{ic}</button>
                    ))}
                  </div>
                )}
              </div>

              {/* Label input */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: "#a89be0", display: "block", marginBottom: 6 }}>Nombre</label>
                <input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addHabit()}
                  placeholder="Ej: Tomar vitaminas"
                  style={{ width: "100%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "10px 12px", color: "#f0ece4", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" }}
                />
              </div>

              <button onClick={addHabit} style={{ width: "100%", background: "rgba(144,224,174,0.15)", border: "1px solid rgba(144,224,174,0.35)", color: "#90e0ae", borderRadius: 10, padding: "11px", fontSize: 14, cursor: "pointer", letterSpacing: 0.5 }}>
                + Agregar hábito
              </button>
            </div>
          </div>
        )}

        {/* ── HISTORIAL ── */}
        {view === "historial" && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ fontSize: 11, letterSpacing: 3, color: "#a89be0", textTransform: "uppercase", marginBottom: 16 }}>Historial completo</div>
            {allKeys.length === 0 && <div style={{ textAlign: "center", color: "#a89be0", marginTop: 40, fontSize: 14 }}>Todavía no hay días registrados.</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {allKeys.map((key, i) => {
                const rec = data[key];
                const done = completedCount(rec, habits);
                const pct = Math.round((done / habits.length) * 100);
                const isPerfect = done === habits.length;
                const dateObj = new Date(key + "T12:00:00");
                const dayNum = allKeys.length - i;
                return (
                  <div key={key} style={{ background: isPerfect ? "rgba(144,224,174,0.07)" : "rgba(255,255,255,0.04)", border: isPerfect ? "1px solid rgba(144,224,174,0.25)" : "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: "bold", marginBottom: 2 }}>{isPerfect && "⭐ "}Día {dayNum}</div>
                        <div style={{ fontSize: 11, color: "#a89be0" }}>{dateObj.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" })}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 20, fontWeight: "bold", color: isPerfect ? "#90e0ae" : pct >= 70 ? "#f9c74f" : "#f4a261" }}>{pct}%</div>
                        <div style={{ fontSize: 11, color: "#a89be0" }}>{done}/{habits.length}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 10, height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 4 }}>
                      <div style={{ height: "100%", width: `${pct}%`, borderRadius: 4, background: isPerfect ? "#90e0ae" : pct >= 70 ? "#f9c74f" : "#f4a261", transition: "width 0.4s" }} />
                    </div>
                    {rec.gratitud && <div style={{ marginTop: 8, fontSize: 12, color: "#a89be0", fontStyle: "italic" }}>"{rec.gratitud}"</div>}
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
  const offset = circ * (1 - pct);
  const color = pct === 1 ? "#90e0ae" : pct >= 0.7 ? "#f9c74f" : "#a89be0";
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <svg width={130} height={130}>
        <circle cx={65} cy={65} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={8} />
        <circle cx={65} cy={65} r={r} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} transform="rotate(-90 65 65)" style={{ transition: "stroke-dashoffset 0.5s, stroke 0.3s" }} />
      </svg>
      <div style={{ position: "absolute", top: 0, left: 0, width: 130, height: 130, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 28, fontWeight: "bold", color }}>{done}</div>
        <div style={{ fontSize: 12, color: "#a89be0" }}>de {total}</div>
      </div>
    </div>
  );
}
