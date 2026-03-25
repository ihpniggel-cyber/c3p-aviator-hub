import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw } from "lucide-react";

type Phase = "idle" | "approach" | "flare" | "touchdown" | "rollout" | "complete";

const PHASES: Record<Phase, { label: string; detail: string; color: string }> = {
  idle:      { label: "EN ATTENTE",     detail: "Piste 04 libre · Vent 040°/12 kt · QNH 1013",        color: "#9ca3af" },
  approach:  { label: "FINALE",          detail: "IAS 75 kt · Volets 30° · VS −500 ft/min · ~500 ft sol", color: "#60a5fa" },
  flare:     { label: "ARRONDI",         detail: "Gaz réduits · Cabré 3° · VS −80 ft/min",               color: "#fbbf24" },
  touchdown: { label: "ATTERRISSAGE ✓", detail: "Train principal en contact · Piste 04",                 color: "#4ade80" },
  rollout:   { label: "ROULEMENT",       detail: "Freinage progressif · Maintien de l'axe central",      color: "#fb923c" },
  complete:  { label: "DÉGAGEMENT",      detail: "Bienvenue à Tahiti-Faa'a (NTAA) · Taxiway Alpha",      color: "#d4a042" },
};

const FLIGHT_DATA: Record<Phase, { alt: string; ias: string; vs: string }> = {
  idle:      { alt: "---",    ias: "---",   vs: "---"  },
  approach:  { alt: "500 ft", ias: "75 kt", vs: "−500" },
  flare:     { alt: "20 ft",  ias: "68 kt", vs: "−80"  },
  touchdown: { alt: "0 ft",   ias: "65 kt", vs: "0"    },
  rollout:   { alt: "0 ft",   ias: "40 kt", vs: "0"    },
  complete:  { alt: "0 ft",   ias: "10 kt", vs: "0"    },
};

// PAPI: 4 lights (left=outermost). 2R2W = on slope, 4W = high, 4R = low
const PAPI_COLORS: Record<Phase, string[]> = {
  idle:      ["#fff", "#fff", "#fff", "#fff"],
  approach:  ["#fff", "#fff", "#f00", "#f00"],
  flare:     ["#f00", "#f00", "#f00", "#f00"],
  touchdown: ["#f00", "#f00", "#f00", "#f00"],
  rollout:   ["#f00", "#f00", "#f00", "#f00"],
  complete:  ["#f00", "#f00", "#f00", "#f00"],
};

function buildAnimCSS(): string {
  return `
    .ac-body {
      animation: ac-fly 12s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
    @keyframes ac-fly {
      0%     { transform: translate(875px, 50px)  rotate(22deg); }
      58.3%  { transform: translate(348px, 296px) rotate(22deg); }
      70.8%  { transform: translate(270px, 316px) rotate(4deg);  }
      76.7%  { transform: translate(244px, 322px) rotate(0deg);  }
      100%   { transform: translate(52px,  322px) rotate(0deg);  }
    }
    .ac-prop {
      transform-origin: 0px 0px;
      animation: prop-spin 0.07s linear infinite;
    }
    @keyframes prop-spin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    .ac-smoke {
      opacity: 0;
      animation: smoke-puff 3s ease-out forwards;
      animation-delay: 9.2s;
    }
    @keyframes smoke-puff {
      0%   { opacity: 0;   transform: scale(0.3) translateY(6px);  }
      15%  { opacity: 0.7; transform: scale(1)   translateY(0);     }
      100% { opacity: 0;   transform: scale(3)   translateY(-18px); }
    }
    .cloud-a { animation: cloud-a 22s linear infinite; }
    .cloud-b { animation: cloud-b 30s linear infinite; }
    .cloud-c { animation: cloud-c 38s linear infinite; }
    @keyframes cloud-a { from { transform: translateX(0); } to { transform: translateX(-130px); } }
    @keyframes cloud-b { from { transform: translateX(0); } to { transform: translateX(-90px);  } }
    @keyframes cloud-c { from { transform: translateX(0); } to { transform: translateX(-60px);  } }
  `;
}

export default function LandingAnimation() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [animKey, setAnimKey] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const handleStart = () => {
    setAnimKey((k) => k + 1);
    setPhase("approach");
    setIsRunning(true);
  };

  const handleReset = () => {
    setPhase("idle");
    setIsRunning(false);
    setAnimKey((k) => k + 1);
  };

  useEffect(() => {
    if (!isRunning) return;
    const timers = [
      setTimeout(() => setPhase("flare"),     7000),
      setTimeout(() => setPhase("touchdown"), 8500),
      setTimeout(() => setPhase("rollout"),   9200),
      setTimeout(() => { setPhase("complete"); setIsRunning(false); }, 12000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [isRunning, animKey]);

  const active = isRunning || phase === "complete";
  const info = PHASES[phase];
  const fdata = FLIGHT_DATA[phase];
  const papi = PAPI_COLORS[phase];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display text-foreground">Atterrissage Piste 04</h1>
        <p className="text-muted-foreground text-sm mt-1">
          NTAA Tahiti-Faa'a · Cap magnétique 040° · Simulateur d'approche visuelle
        </p>
      </div>

      {/* Scene */}
      <div key={animKey} className="relative rounded-xl overflow-hidden border border-border shadow-card">
        <style>{buildAnimCSS()}</style>

        <svg viewBox="0 0 900 500" className="w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#0c2340" />
              <stop offset="55%"  stopColor="#1b6fa8" />
              <stop offset="100%" stopColor="#5ba8cc" />
            </linearGradient>
            <linearGradient id="ocean" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#0096c7" />
              <stop offset="100%" stopColor="#005f87" />
            </linearGradient>
            <linearGradient id="lagoon" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#5dd3f0" />
              <stop offset="100%" stopColor="#00b4d8" />
            </linearGradient>
            <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#606050" />
              <stop offset="100%" stopColor="#454538" />
            </linearGradient>
            <radialGradient id="sun-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#ffe066" stopOpacity="0.9" />
              <stop offset="60%"  stopColor="#ffd700" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ffd700" stopOpacity="0"   />
            </radialGradient>
          </defs>

          {/* ── SKY ── */}
          <rect x="0" y="0" width="900" height="500" fill="url(#sky)" />

          {/* ── SUN ── */}
          <circle cx="808" cy="62" r="65" fill="url(#sun-glow)" />
          <circle cx="808" cy="62" r="24" fill="#ffe066" opacity="0.95" />

          {/* ── CLOUDS ── */}
          <g className="cloud-a">
            <ellipse cx="160" cy="82"  rx="62"  ry="21" fill="white" opacity="0.65" />
            <ellipse cx="188" cy="68"  rx="42"  ry="19" fill="white" opacity="0.75" />
            <ellipse cx="138" cy="74"  rx="36"  ry="17" fill="white" opacity="0.68" />
          </g>
          <g className="cloud-b">
            <ellipse cx="470" cy="105" rx="72"  ry="23" fill="white" opacity="0.48" />
            <ellipse cx="502" cy="90"  rx="46"  ry="21" fill="white" opacity="0.52" />
            <ellipse cx="446" cy="97"  rx="40"  ry="19" fill="white" opacity="0.46" />
          </g>
          <g className="cloud-c">
            <ellipse cx="680" cy="58"  rx="56"  ry="19" fill="white" opacity="0.42" />
            <ellipse cx="708" cy="46"  rx="36"  ry="17" fill="white" opacity="0.47" />
          </g>

          {/* ── TAHITI MOUNTAINS — 3 layers ── */}
          {/* Far / blue-hazy peaks */}
          <polygon
            points="0,295 35,205 75,232 115,165 165,190 215,132 265,158 318,110 368,140 418,102 465,128 515,97 548,120 585,108 622,133 662,152 702,138 742,162 782,193 825,215 868,235 900,255 900,340 0,340"
            fill="#1a3a50" opacity="0.58"
          />
          {/* Mid mountains — greener */}
          <polygon
            points="0,315 42,258 84,273 134,234 182,250 224,214 272,230 314,202 352,220 392,197 432,217 472,202 512,222 555,208 592,232 642,218 682,242 722,263 782,282 842,302 900,318 900,362 0,362"
            fill="#2a5a3c" opacity="0.82"
          />
          {/* Near hills — left/inland side */}
          <polygon
            points="0,332 48,292 98,308 148,274 198,290 248,268 290,283 332,270 372,288 412,312 435,332 0,342"
            fill="#3a6b48"
          />

          {/* ── OCEAN (right background — lagoon side) ── */}
          <rect x="540" y="318" width="360" height="182" fill="url(#ocean)" />
          <ellipse cx="762" cy="378" rx="165" ry="58" fill="url(#lagoon)" opacity="0.55" />
          {/* Reef line */}
          <line x1="614" y1="358" x2="900" y2="343" stroke="white" strokeWidth="1.5" strokeDasharray="9,6" opacity="0.35" />
          {/* Wave shimmer */}
          <path d="M558,334 Q578,329 598,334 Q618,339 638,334" stroke="white" strokeWidth="1" fill="none" opacity="0.35" />
          <path d="M664,344 Q684,339 704,344 Q724,349 744,344" stroke="white" strokeWidth="1" fill="none" opacity="0.28" />

          {/* ── GROUND / AIRPORT ── */}
          <rect x="0" y="338" width="900" height="162" fill="url(#ground)" />
          <rect x="0" y="338" width="680" height="162" fill="#525242" />
          {/* Apron area */}
          <rect x="52" y="368" width="130" height="72" rx="2" fill="#484838" opacity="0.6" />
          {/* Ground line */}
          <line x1="0" y1="358" x2="680" y2="358" stroke="#888" strokeWidth="0.8" opacity="0.25" />

          {/* ── RUNWAY 04/22 ── */}
          {/* Surface */}
          <rect x="76" y="337" width="648" height="25" fill="#383830" rx="1" />
          {/* Edge lines */}
          <line x1="76"  y1="337" x2="724" y2="337" stroke="white" strokeWidth="1.4" opacity="0.55" />
          <line x1="76"  y1="362" x2="724" y2="362" stroke="white" strokeWidth="1.4" opacity="0.55" />
          {/* Centreline dashes */}
          {[108,158,208,258,308,358,408,458,508,558,608].map((x) => (
            <rect key={x} x={x} y="348" width="32" height="2" fill="white" opacity="0.75" />
          ))}

          {/* ── THRESHOLD RWY 04 (right / south end) ── */}
          {/* Piano keys */}
          {Array.from({ length: 8 }, (_, i) => (
            <rect key={i} x={646 + i * 9} y="337" width="5" height="25" fill="white" opacity="0.88" />
          ))}
          {/* Threshold bar */}
          <line x1="642" y1="337" x2="642" y2="362" stroke="#ffd700" strokeWidth="2" />
          {/* Runway number 04 */}
          <text x="610" y="356" fill="white" fontSize="15" fontFamily="monospace" fontWeight="bold" opacity="0.88" textAnchor="middle">04</text>

          {/* ── FAR END RWY 22 ── */}
          {/* Piano keys */}
          {Array.from({ length: 8 }, (_, i) => (
            <rect key={i} x={76 + i * 9} y="337" width="5" height="25" fill="white" opacity="0.6" />
          ))}
          <text x="110" y="356" fill="white" fontSize="13" fontFamily="monospace" fontWeight="bold" opacity="0.65" textAnchor="middle">22</text>

          {/* ── RUNWAY EDGE LIGHTS ── */}
          {[100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700].map((x) => (
            <g key={x}>
              <circle cx={x} cy="337" r="2.5" fill="#ffd700" opacity="0.8" />
              <circle cx={x} cy="362" r="2.5" fill="#ffd700" opacity="0.8" />
            </g>
          ))}

          {/* ── PAPI (left of rwy, near 04 threshold) ── */}
          {papi.map((color, i) => (
            <g key={i}>
              <rect x={642 - 20 - i * 20} y="363" width="14" height="9" fill="#1a1a1a" rx="1" />
              <circle cx={642 - 13 - i * 20} cy="367" r="4.5" fill={color} opacity="0.95" />
            </g>
          ))}
          <text x="608" y="380" fill="#9ca3af" fontSize="8" fontFamily="monospace" textAnchor="middle" opacity="0.7">PAPI</text>

          {/* ── APPROACH LIGHTS (extended centreline) ── */}
          {[726, 762, 798, 834, 870].map((x, i) => (
            <g key={x}>
              <line x1={x} y1="340" x2={x} y2="345" stroke="white" strokeWidth="1.2" />
              <circle cx={x} cy="341" r={i === 0 ? 2.8 : 2.2} fill="white" opacity={0.92 - i * 0.14} />
            </g>
          ))}

          {/* ── TAXIWAY A ── */}
          <rect x="148" y="362" width="28" height="90" fill="#363628" opacity="0.85" />
          <line x1="162" y1="362" x2="162" y2="452" stroke="#ffd700" strokeWidth="1.5" strokeDasharray="8,5" opacity="0.65" />
          <text x="178" y="432" fill="#ffd700" fontSize="9" fontFamily="monospace" opacity="0.75">TWY A</text>

          {/* ── PALM TREES (right side near threshold) ── */}
          {([[738, 328], [760, 322], [750, 332]] as [number, number][]).map(([px, py], i) => (
            <g key={i}>
              <path d={`M${px},${py} Q${px + 3},${py + 9} ${px + 1},${py + 18}`} stroke="#7a6040" strokeWidth="3.5" fill="none" />
              <path d={`M${px + 1},${py} Q${px - 14},${py - 9} ${px - 18},${py - 13}`} stroke="#2e7030" strokeWidth="2.2" fill="none" />
              <path d={`M${px + 1},${py} Q${px + 13},${py - 7} ${px + 20},${py - 9}`}  stroke="#387840" strokeWidth="2.2" fill="none" />
              <path d={`M${px + 1},${py} Q${px},${py - 15}  ${px - 2},${py - 20}`}     stroke="#2e7030" strokeWidth="2.2" fill="none" />
              <path d={`M${px + 1},${py} Q${px - 9},${py - 5} ${px - 15},${py - 5}`}   stroke="#387840" strokeWidth="2.2" fill="none" />
              <path d={`M${px + 1},${py} Q${px + 9},${py - 11} ${px + 14},${py - 16}`} stroke="#2e7030" strokeWidth="2.2" fill="none" />
            </g>
          ))}

          {/* ── GLIDE SLOPE LINE ── */}
          {active && (
            <line x1="875" y1="50" x2="244" y2="338"
              stroke="#60a5fa" strokeWidth="1.2" strokeDasharray="14,9" opacity="0.3" />
          )}

          {/* ── TOUCHDOWN SMOKE ── */}
          <g style={{ transform: "translate(244px, 330px)" }}>
            <g className={active ? "ac-smoke" : ""}>
              <ellipse cx="0"   cy="0" rx="20" ry="9" fill="#ccc" opacity="0.65" />
              <ellipse cx="12"  cy="-4" rx="13" ry="7" fill="#ddd" opacity="0.55" />
              <ellipse cx="-10" cy="-3" rx="11" ry="6" fill="#bbb" opacity="0.45" />
            </g>
          </g>

          {/* ── AIRCRAFT — Cessna 172 facing left ── */}
          <g
            className={active ? "ac-body" : ""}
            style={!active ? { transform: "translate(875px, 50px) rotate(22deg)" } : undefined}
          >
            {/* Horizontal stabilizer */}
            <polygon points="26,-4 44,-4 40,-14 30,-8" fill="#c5c5c5" />
            {/* Vertical stabilizer */}
            <polygon points="28,-4 33,-4 28,-23 24,-10" fill="#bebebe" />
            {/* Fuselage */}
            <path d="M-40,-5 L25,-5 Q33,-3 33,0 Q33,4 25,5 L-40,5 Q-46,2 -46,-1 Q-46,-4 -40,-5 Z" fill="#e8e8e8" />
            {/* High wing */}
            <rect x="-22" y="-17" width="54" height="10" rx="3" fill="#d8d8d8" />
            {/* Wing struts */}
            <line x1="-2"  y1="-7" x2="-2"  y2="5" stroke="#aaa" strokeWidth="1.2" />
            <line x1="16"  y1="-7" x2="11"  y2="5" stroke="#aaa" strokeWidth="1.2" />
            {/* Engine cowl */}
            <ellipse cx="-39" cy="0" rx="7" ry="5.5" fill="#888" />
            <circle  cx="-42" cy="0" r="3.5" fill="#666" />
            {/* Propeller disc — rotates around its own center */}
            <g transform="translate(-43, 0)">
              <ellipse
                className={active ? "ac-prop" : ""}
                cx="0" cy="0" rx="1.5" ry="21"
                fill="#444" opacity="0.5"
              />
            </g>
            {/* Windshield / windows */}
            <rect x="-12" y="-4" width="24" height="8" rx="2.5" fill="#a8d8ea" opacity="0.88" />
            <line x1="1" y1="-4" x2="1" y2="4" stroke="#c0c0c0" strokeWidth="0.8" />
            {/* Gold C3P stripe */}
            <rect x="-36" y="-1.2" width="66" height="2.4" fill="#d4a042" opacity="0.9" />
            {/* Registration */}
            <text x="-22" y="2.2" fill="#d4a042" fontSize="5" fontFamily="monospace" opacity="0.75">F-OTAH</text>
            {/* Nose gear */}
            <line x1="-22" y1="5" x2="-22" y2="14" stroke="#888" strokeWidth="1.8" />
            <circle cx="-22" cy="15" r="3" fill="#555" />
            {/* Main gear left */}
            <line x1="6"  y1="5" x2="4"  y2="17" stroke="#888" strokeWidth="1.8" />
            <circle cx="4"  cy="18" r="4" fill="#444" />
            {/* Main gear right */}
            <line x1="16" y1="5" x2="14" y2="17" stroke="#888" strokeWidth="1.8" />
            <circle cx="14" cy="18" r="4" fill="#444" />
          </g>

          {/* ── LABELS / OVERLAY TEXT ── */}
          <text x="120" y="422" fill="#d4a042" fontSize="11" fontFamily="monospace" fontWeight="bold" opacity="0.85">NTAA — TAHITI-FAA'A</text>
          <text x="120" y="435" fill="#9ca3af" fontSize="8.5"  fontFamily="monospace" opacity="0.65">ELEV 5 ft · MAG VAR 10°E · RWY 04/22</text>

          {/* Wind rose */}
          <g>
            <circle cx="848" cy="422" r="30" fill="none" stroke="#9ca3af" strokeWidth="0.8" opacity="0.45" />
            <text x="848" y="399" fill="#9ca3af" fontSize="7.5" textAnchor="middle" fontFamily="monospace" opacity="0.75">N</text>
            <text x="848" y="448" fill="#9ca3af" fontSize="7.5" textAnchor="middle" fontFamily="monospace" opacity="0.75">S</text>
            <text x="823" y="426" fill="#9ca3af" fontSize="7.5" textAnchor="middle" fontFamily="monospace" opacity="0.75">W</text>
            <text x="872" y="426" fill="#9ca3af" fontSize="7.5" textAnchor="middle" fontFamily="monospace" opacity="0.75">E</text>
            {/* Wind arrow 040° */}
            <line x1="848" y1="422" x2="853" y2="396" stroke="#60a5fa" strokeWidth="2.2" opacity="0.85" />
            <polygon points="848,391 851,400 855,399" fill="#60a5fa" opacity="0.85" />
            <text x="848" y="458" fill="#60a5fa" fontSize="8" textAnchor="middle" fontFamily="monospace" opacity="0.85">040°/12kt</text>
          </g>
        </svg>

        {/* Phase info overlay */}
        <div
          className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-5 py-4"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.78), transparent)" }}
        >
          <div>
            <span className="block text-xs font-mono font-bold tracking-[3px]" style={{ color: info.color }}>
              {info.label}
            </span>
            <span className="block text-white/70 text-xs font-mono mt-0.5">{info.detail}</span>
          </div>

          {/* Flight data */}
          <div className="flex gap-5 text-right">
            {[
              { label: "ALT", value: fdata.alt },
              { label: "IAS", value: fdata.ias },
              { label: "VS",  value: fdata.vs  },
            ].map(({ label, value }) => (
              <div key={label}>
                <span className="block text-[10px] font-mono text-white/40 tracking-widest">{label}</span>
                <span className="block text-sm font-mono font-semibold text-white/90">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3 items-center flex-wrap">
        <Button onClick={handleStart} disabled={isRunning} className="bg-gradient-gold text-primary-foreground">
          <Play className="w-4 h-4 mr-2" />
          Lancer la simulation
        </Button>
        <Button onClick={handleReset} variant="outline" disabled={isRunning}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Réinitialiser
        </Button>
        {phase === "complete" && (
          <span className="text-sm font-mono font-medium" style={{ color: "#d4a042" }}>
            Simulation terminée — Bienvenue à Tahiti !
          </span>
        )}
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Données Piste 04</h3>
          <dl className="space-y-1.5 text-xs font-mono">
            {[
              ["Aéroport",        "NTAA Tahiti-Faa'a"],
              ["Cap magnétique",  "040°"],
              ["Cap vrai",        "050°"],
              ["Longueur",        "3 430 m"],
              ["Largeur",         "45 m"],
              ["Revêtement",      "Asphalte"],
              ["Altitude seuil",  "5 ft AMSL"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="text-foreground text-right">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Procédure d'approche</h3>
          <dl className="space-y-1.5 text-xs font-mono">
            {[
              ["Type",           "Visuelle / ILS"],
              ["Pente ILS",      "3°"],
              ["IAS finale",     "75 kt (C172)"],
              ["Volets",         "30° (plein)"],
              ["VS cible",       "−500 ft/min"],
              ["Arrondi",        "~20 ft sol"],
              ["Aide visuelle",  "PAPI 3°"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="text-foreground text-right">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Particularités NTAA</h3>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li className="flex gap-2"><span className="text-primary shrink-0">→</span>Vent dominant du nord-est (alizés) — favorable en piste 04</li>
            <li className="flex gap-2"><span className="text-primary shrink-0">→</span>Relief encerclant : Mont Orohena 2 241 m — turbulences possibles</li>
            <li className="flex gap-2"><span className="text-primary shrink-0">→</span>Seuil 04 proche de la côte — corriger dérive latérale</li>
            <li className="flex gap-2"><span className="text-primary shrink-0">→</span>Lagon visible à droite en finale — repère visuel utile</li>
            <li className="flex gap-2"><span className="text-primary shrink-0">→</span>Trafic mixte civil/militaire — écoute obligatoire 118.10</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
