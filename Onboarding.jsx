import { useState } from "react";
import { useAuth } from "./auth.jsx";

const API = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;

const OBIETTIVI = [
  { v: "dimagrimento", t: "Lose weight", d: "A gentle deficit, never below what's safe." },
  { v: "mantenimento", t: "Stay where I am", d: "Eat well, keep the balance." },
  { v: "massa", t: "Build up", d: "A small surplus, protein-forward." },
];

const ATTIVITA = [
  { v: 1.4, t: "Mostly sitting", d: "Desk job, little exercise" },
  { v: 1.6, t: "Somewhat active", d: "On your feet, or 2–3 workouts a week" },
  { v: 1.8, t: "Active", d: "Physical job, or training most days" },
  { v: 2.0, t: "Very active", d: "Hard training, or heavy manual work" },
];

const CUCINE = [
  { v: "europea", t: "European" },
  { v: "asiatica", t: "Asian" },
  { v: "usa", t: "American" },
  { v: "sud_americana", t: "South American" },
  { v: "australiana", t: "Australian" },
];

const ZONE = [
  { v: "nord", t: "North" },
  { v: "centro", t: "Centre" },
  { v: "sud", t: "South" },
];

function Passo({ n, totale, titolo, sottotitolo, children }) {
  return (
    <div className="fade-up">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-800">
        Step {n} of {totale}
      </p>
      <h2
        style={{ fontFamily: "'Fraunces', serif" }}
        className="mt-4 text-[34px] leading-[1.1] tracking-tight sm:text-[40px]"
      >
        {titolo}
      </h2>
      {sottotitolo && <p className="mt-3 text-[15px] leading-relaxed text-stone-500">{sottotitolo}</p>}
      <div className="mt-8">{children}</div>
    </div>
  );
}

function Scelta({ attiva, onClick, titolo, desc }) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-2xl border px-5 py-4 text-left transition-all duration-300 ${
        attiva
          ? "border-emerald-800 bg-emerald-50/70 shadow-[0_6px_18px_-10px_rgba(6,78,59,0.5)]"
          : "border-stone-200 bg-white/60 hover:-translate-y-0.5 hover:border-emerald-800/40 hover:bg-white"
      }`}
    >
      <span className="block text-[16px] font-medium">{titolo}</span>
      {desc && <span className="mt-0.5 block text-[13px] text-stone-500">{desc}</span>}
    </button>
  );
}

function Numero({ label, value, onChange, suffisso, min, max }) {
  return (
    <div>
      <label className="text-[11px] font-medium uppercase tracking-[0.14em] text-stone-400">
        {label}
      </label>
      <div className="mt-1.5 flex items-baseline gap-2 border-b-2 border-stone-200 pb-2 focus-within:border-emerald-800">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          min={min}
          max={max}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-[24px] tabular-nums outline-none placeholder:text-stone-300"
          placeholder="—"
        />
        <span className="text-[14px] text-stone-400">{suffisso}</span>
      </div>
    </div>
  );
}

export default function Onboarding({ onFatto }) {
  const { token } = useAuth();
  const [passo, setPasso] = useState(1);
  const TOT = 5;

  const [goal, setGoal] = useState("");
  const [sex, setSex] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [pal, setPal] = useState(null);
  const [city, setCity] = useState("");
  const [zona, setZona] = useState("");
  const [esclusi, setEsclusi] = useState("");
  const [cucine, setCucine] = useState([]);

  const [errore, setErrore] = useState("");
  const [attesa, setAttesa] = useState(false);

  const anno = new Date().getFullYear();

  function toggleCucina(v) {
    setCucine((c) => (c.includes(v) ? c.filter((x) => x !== v) : [...c, v]));
  }

  const puoProseguire = {
    1: Boolean(goal),
    2: Boolean(sex && birthYear >= anno - 100 && birthYear <= anno - 16 && heightCm >= 120 && heightCm <= 230 && weightKg >= 35 && weightKg <= 300),
    3: Boolean(pal),
    4: true,
    5: cucine.length > 0,
  }[passo];

  async function invia() {
    setErrore("");
    setAttesa(true);

    const constraints = esclusi
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => ({ kind: "non_gradito", subject: s, severity: "preferibile" }));

    try {
      const res = await fetch(`${API}/onboarding`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          goal,
          sex,
          birth_year: Number(birthYear),
          height_cm: Number(heightCm),
          weight_kg: Number(weightKg),
          pal,
          city: city.trim() || null,
          region_zone: zona || null,
          constraints,
          cuisines: cucine,
        }),
      });

      const dati = await res.json();
      if (!res.ok) throw new Error(dati.errore || "Something went wrong.");
      onFatto();
    } catch (e) {
      setErrore(e.message);
      setAttesa(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f2f7f1] text-stone-900">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-[0.12]"
        style={{
          backgroundImage: "radial-gradient(#16a34a 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />
      <div aria-hidden="true" className="pointer-events-none fixed -left-56 -top-52 h-[38rem] w-[38rem] rounded-full bg-emerald-300/35 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none fixed -right-64 bottom-[-16rem] h-[36rem] w-[36rem] rounded-full bg-lime-300/30 blur-3xl" />

      <div className="relative mx-auto max-w-lg px-6 pb-20 pt-10">

        <div className="mb-10 flex items-end gap-1.5" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors duration-500 ${
                i <= passo ? "bg-emerald-800" : "bg-emerald-900/15"
              }`}
            />
          ))}
        </div>

        {passo === 1 && (
          <Passo n={1} totale={TOT} titolo="What are you after?" sottotitolo="This sets the calorie target — nothing here is a promise, just a starting point.">
            <div className="space-y-3">
              {OBIETTIVI.map((o) => (
                <Scelta key={o.v} attiva={goal === o.v} onClick={() => setGoal(o.v)} titolo={o.t} desc={o.d} />
              ))}
            </div>
          </Passo>
        )}

        {passo === 2 && (
          <Passo n={2} totale={TOT} titolo="A bit about your body." sottotitolo="Used to work out your energy needs. Stored privately, never shared.">
            <div className="space-y-7">
              <div className="grid grid-cols-2 gap-3">
                <Scelta attiva={sex === "M"} onClick={() => setSex("M")} titolo="Male" />
                <Scelta attiva={sex === "F"} onClick={() => setSex("F")} titolo="Female" />
              </div>
              <Numero label="Year of birth" value={birthYear} onChange={setBirthYear} suffisso="" min={anno - 100} max={anno - 16} />
              <Numero label="Height" value={heightCm} onChange={setHeightCm} suffisso="cm" min={120} max={230} />
              <Numero label="Weight" value={weightKg} onChange={setWeightKg} suffisso="kg" min={35} max={300} />
            </div>
          </Passo>
        )}

        {passo === 3 && (
          <Passo n={3} totale={TOT} titolo="How much do you move?" sottotitolo="Be honest rather than aspirational — it makes the numbers useful.">
            <div className="space-y-3">
              {ATTIVITA.map((a) => (
                <Scelta key={a.v} attiva={pal === a.v} onClick={() => setPal(a.v)} titolo={a.t} desc={a.d} />
              ))}
            </div>
          </Passo>
        )}

        {passo === 4 && (
          <Passo n={4} totale={TOT} titolo="Anything you don't eat?" sottotitolo="Allergies, intolerances, or things you simply never want to see. Optional.">
            <div className="space-y-7">
              <div>
                <label className="text-[11px] font-medium uppercase tracking-[0.14em] text-stone-400">
                  Separate with commas
                </label>
                <input
                  value={esclusi}
                  onChange={(e) => setEsclusi(e.target.value)}
                  placeholder="peanuts, shellfish, blue cheese"
                  className="mt-1.5 w-full border-b-2 border-stone-200 bg-transparent pb-2 text-[17px] outline-none placeholder:text-stone-300 focus:border-emerald-800"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium uppercase tracking-[0.14em] text-stone-400">
                  Your city
                </label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Milan"
                  className="mt-1.5 w-full border-b-2 border-stone-200 bg-transparent pb-2 text-[17px] outline-none placeholder:text-stone-300 focus:border-emerald-800"
                />
              </div>

              <div>
                <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-stone-400">
                  Which part of Italy?
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {ZONE.map((z) => (
                    <Scelta key={z.v} attiva={zona === z.v} onClick={() => setZona(z.v)} titolo={z.t} />
                  ))}
                </div>
              </div>
            </div>
          </Passo>
        )}

        {passo === 5 && (
          <Passo n={5} totale={TOT} titolo="What do you like to cook?" sottotitolo="Pick as many as you want — the order matters. The first one shows up most.">
            <div className="space-y-3">
              {CUCINE.map((c) => {
                const posizione = cucine.indexOf(c.v);
                return (
                  <button
                    key={c.v}
                    onClick={() => toggleCucina(c.v)}
                    className={`flex w-full items-center gap-4 rounded-2xl border px-5 py-4 text-left transition-all duration-300 ${
                      posizione >= 0
                        ? "border-emerald-800 bg-emerald-50/70"
                        : "border-stone-200 bg-white/60 hover:-translate-y-0.5 hover:border-emerald-800/40 hover:bg-white"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold tabular-nums ${
                        posizione >= 0 ? "bg-emerald-800 text-white" : "bg-stone-100 text-stone-400"
                      }`}
                    >
                      {posizione >= 0 ? posizione + 1 : "–"}
                    </span>
                    <span className="text-[16px] font-medium">{c.t}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-4 text-[13px] text-stone-400">
              Tap to add, tap again to remove.
            </p>
          </Passo>
        )}

        {errore && (
          <p key={errore} className="auth-error mt-7 border-l-2 border-amber-700 bg-amber-50/80 py-2.5 pl-3 pr-3 text-[13px] leading-relaxed text-amber-900">
            {errore}
          </p>
        )}

        <div className="mt-10 flex items-center gap-4">
          {passo > 1 && !attesa && (
            <button
              onClick={() => { setPasso(passo - 1); setErrore(""); }}
              className="text-[14px] text-stone-400 transition-colors hover:text-emerald-900"
            >
              Back
            </button>
          )}

          <button
            onClick={() => (passo === TOT ? invia() : setPasso(passo + 1))}
            disabled={!puoProseguire || attesa}
            className="group ml-auto rounded-full bg-emerald-900 px-8 py-4 text-[15px] font-medium text-white shadow-[0_6px_20px_-8px_rgba(6,78,59,0.7)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-800 active:translate-y-0 active:scale-[0.985] disabled:opacity-40 disabled:hover:translate-y-0"
          >
            <span className="flex items-center gap-2.5">
              {attesa && (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
                  <path d="M14.5 8A6.5 6.5 0 0 0 8 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
              {attesa ? "Building your week" : passo === TOT ? "Build my week" : "Continue"}
              {!attesa && <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>}
            </span>
          </button>
        </div>

        {attesa && (
          <p className="mt-5 text-center text-[13px] text-stone-400">
            This takes a few seconds — it's checking a thousand dishes against your limits.
          </p>
        )}
      </div>
    </div>
  );
}