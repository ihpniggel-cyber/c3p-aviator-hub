import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Radio } from "lucide-react";

interface CharDef {
  id: string;
  short: string;
  full: string;
  role: "FI" | "ELEVE" | "PILOTE";
  hex: string;
  x: number; // % left
  y: number; // % top
}

interface Beat {
  characterId: string;
  text: string;
  type: "dialog" | "action" | "system" | "radio" | "atis";
  targetId?: string;
}

interface Scenario {
  id: string;
  label: string;
  sublabel: string;
  beats: Beat[];
}

const CHARS: CharDef[] = [
  // Instructeurs — rangée du fond
  { id: "fi_pascal",     short: "Pascal",     full: "Pascal NIGGEL",      role: "FI",     hex: "#f59e0b", x: 8,  y: 8  },
  { id: "fi_frederic",   short: "Frédéric",   full: "Frédéric AXUS",      role: "FI",     hex: "#f97316", x: 18, y: 8  },
  { id: "fi_arnaud",     short: "Arnaud",     full: "Arnaud BOULANGER",   role: "FI",     hex: "#ef4444", x: 28, y: 8  },
  { id: "fi_didier",     short: "Didier",     full: "Didier JUERY",       role: "FI",     hex: "#f43f5e", x: 38, y: 8  },
  { id: "fi_jeanyves",   short: "Jean-Yves",  full: "J-Y MARTINO",        role: "FI",     hex: "#ec4899", x: 48, y: 8  },
  { id: "fi_florian",    short: "Florian",    full: "Florian REYREAU",    role: "FI",     hex: "#d946ef", x: 58, y: 8  },
  { id: "fi_vincent",    short: "Vincent",    full: "Vincent ROUX",       role: "FI",     hex: "#8b5cf6", x: 68, y: 8  },
  { id: "fi_philippe",   short: "Philippe",   full: "Philippe TAPETA",    role: "FI",     hex: "#3b82f6", x: 78, y: 8  },
  { id: "fi_manahere",   short: "Manahere",   full: "M. TEHEIURA",        role: "FI",     hex: "#06b6d4", x: 88, y: 8  },
  // Élèves / pilotes — rangées du milieu
  { id: "el_charuel",    short: "Aurélie",    full: "Aurélie CHARUEL",    role: "PILOTE", hex: "#10b981", x: 8,  y: 30 },
  { id: "el_carpi",      short: "Patrice",    full: "Patrice CARPI",      role: "ELEVE",  hex: "#0ea5e9", x: 20, y: 30 },
  { id: "el_nouveau",    short: "Teariki",    full: "Teariki NOUVEAU",    role: "PILOTE", hex: "#14b8a6", x: 32, y: 30 },
  { id: "el_iannaci",    short: "Daniele",    full: "Daniele IANNACI",    role: "PILOTE", hex: "#22c55e", x: 44, y: 30 },
  { id: "el_vaiho",      short: "Viriamu",    full: "Viriamu VAIHO",      role: "ELEVE",  hex: "#84cc16", x: 56, y: 30 },
  { id: "el_chant",      short: "Ranitea",    full: "Ranitea CHANT",      role: "ELEVE",  hex: "#fbbf24", x: 68, y: 30 },
  { id: "el_tuihani",    short: "Teihotu",    full: "Teihotu TUIHANI",    role: "PILOTE", hex: "#fb923c", x: 80, y: 30 },
  { id: "el_lardillier", short: "Keanee",     full: "Keanee LARDILLIER",  role: "ELEVE",  hex: "#f87171", x: 92, y: 30 },
  { id: "el_conroy",     short: "Tetaitu",    full: "Tetaitu CONROY",     role: "ELEVE",  hex: "#c084fc", x: 8,  y: 52 },
  { id: "el_estall",     short: "Teaki",      full: "Teaki ESTALL",       role: "ELEVE",  hex: "#818cf8", x: 20, y: 52 },
  { id: "el_maiau",      short: "Akeval",     full: "Akeval MAIAU",       role: "ELEVE",  hex: "#38bdf8", x: 32, y: 52 },
  { id: "el_temu",       short: "Tamahei",    full: "Tamahei TEMU",       role: "ELEVE",  hex: "#34d399", x: 44, y: 52 },
  { id: "el_chang",      short: "Herman",     full: "Herman CHANG",       role: "ELEVE",  hex: "#a3e635", x: 56, y: 52 },
  { id: "el_tamu",       short: "Tevaihau",   full: "Tevaihau TAMU",      role: "ELEVE",  hex: "#fde047", x: 68, y: 52 },
  { id: "el_pater",      short: "Teheiani",   full: "Teheiani PATER",     role: "ELEVE",  hex: "#fdba74", x: 80, y: 52 },
  { id: "el_labeaume",   short: "Timothée",   full: "Timothée LABEAUME",  role: "ELEVE",  hex: "#f9a8d4", x: 92, y: 52 },
  { id: "el_hauata",     short: "Maarau",     full: "Maarau HAUATA",      role: "ELEVE",  hex: "#86efac", x: 14, y: 74 },
  { id: "el_monnier",    short: "Tohaumoana", full: "Tohaumoana M.",       role: "ELEVE",  hex: "#7dd3fc", x: 32, y: 74 },
  { id: "el_triponel",   short: "Ewen",       full: "Ewen TRIPONEL",      role: "ELEVE",  hex: "#c4b5fd", x: 50, y: 74 },
  { id: "el_fareea",     short: "Bonno",      full: "Bonno FAREEA",       role: "ELEVE",  hex: "#a78bfa", x: 68, y: 74 },
  { id: "el_sandford",   short: "Manuarii",   full: "Manuarii SANDFORD",  role: "PILOTE", hex: "#6ee7b7", x: 80, y: 74 },
  { id: "el_chang2",     short: "Charline",   full: "Charline JOLLIEN",   role: "ELEVE",  hex: "#fca5a5", x: 92, y: 74 },
];

const SCENARIOS: Scenario[] = [
  {
    id: "briefing", label: "Briefing matin", sublabel: "06h30",
    beats: [
      { characterId: "fi_didier",   type: "system", text: "Salle des ops — 25 juin — 06h30" },
      { characterId: "fi_didier",   type: "atis",   text: "METAR NTAA: vent 080/08kt — QNH 1012 — NOSIG" },
      { characterId: "fi_didier",   type: "dialog", text: "F-ONCF en maintenance. On absorbe sur F-ORVZ et F-OIQZ.", targetId: "fi_philippe" },
      { characterId: "fi_philippe", type: "dialog", text: "Reçu. J'ai Keanee à 07h, Manea à midi. Chargé mais faisable.", targetId: "fi_didier" },
      { characterId: "fi_florian",  type: "dialog", text: "Moi j'ai Aurélie tôt sur F-ORVZ, puis Daniele sur F-OIQZ." },
      { characterId: "el_charuel",  type: "dialog", text: "J'ai fait mon brief météo. NOTAM actif sur fréquence Papeete 06h-07h.", targetId: "fi_florian" },
      { characterId: "fi_florian",  type: "dialog", text: "Parfait Aurélie. On décolle à 06h20.", targetId: "el_charuel" },
      { characterId: "fi_didier",   type: "dialog", text: "Teaki, Akeval, Herman — simulateur ce matin. Revoyez vos procédures pannes moteur.", targetId: "fi_vincent" },
      { characterId: "el_maiau",    type: "dialog", text: "Moi aussi... presque.", targetId: "fi_vincent" },
      { characterId: "fi_vincent",  type: "dialog", text: "Akeval — 'presque' c'est pas une réponse valide pour une panne moteur.", targetId: "el_maiau" },
    ],
  },
  {
    id: "debriefing", label: "Débriefing piste", sublabel: "Aurélie + Florian",
    beats: [
      { characterId: "fi_florian",  type: "system", text: "Retour F-ORVZ — 08h15 — Phase PP" },
      { characterId: "fi_florian",  type: "dialog", text: "Aurélie, pose-toi. Debriefing à chaud.", targetId: "el_charuel" },
      { characterId: "el_charuel",  type: "dialog", text: "Je me suis sentie bien. Sauf le 3e tour — assiette trop cabrée à l'arrondi.", targetId: "fi_florian" },
      { characterId: "fi_florian",  type: "dialog", text: "La vitesse seuil c'était combien ?", targetId: "el_charuel" },
      { characterId: "el_charuel",  type: "dialog", text: "J'avais 80kt. Vref sur le Tecnam c'est 70.", targetId: "fi_florian" },
      { characterId: "fi_florian",  type: "dialog", text: "10kt de trop. Ça rallonge l'atterro de 150m.", targetId: "el_charuel" },
      { characterId: "el_charuel",  type: "dialog", text: "Pour la radio — j'ai appelé tour au lieu de sol.", targetId: "fi_florian" },
      { characterId: "fi_florian",  type: "dialog", text: "La radio se prépare avant l'action. Tu lis ou tu récites la checklist ?", targetId: "el_charuel" },
      { characterId: "el_charuel",  type: "dialog", text: "...Je la récitais.", targetId: "fi_florian" },
      { characterId: "fi_florian",  type: "dialog", text: "On la lit. Toujours.", targetId: "el_charuel" },
    ],
  },
  {
    id: "sansvol", label: "Sans vol", sublabel: "Ranitea 29j · Viriamu 18j",
    beats: [
      { characterId: "fi_pascal",   type: "system", text: "Coin canapé — 09h00" },
      { characterId: "el_chant",    type: "dialog", text: "Pascal, ça fait 29 jours que j'ai pas volé. Je vais perdre tout ce que j'avais acquis.", targetId: "fi_pascal" },
      { characterId: "fi_pascal",   type: "dialog", text: "29 jours c'est significatif. T'as révisé tes points clés de phase depuis ?", targetId: "el_chant" },
      { characterId: "el_chant",    type: "dialog", text: "J'ai relu la théorie. Mais la théorie c'est pas le cockpit.", targetId: "fi_pascal" },
      { characterId: "fi_pascal",   type: "dialog", text: "Non. Mais c'est mieux que rien. On se cale un vol de remise en condition.", targetId: "el_chant" },
      { characterId: "el_vaiho",    type: "dialog", text: "Moi c'est 18 jours. Mes quarts aux Armées — impossible de prévoir.", targetId: "fi_pascal" },
      { characterId: "fi_pascal",   type: "dialog", text: "Viriamu, t'as un tour de contrôle FI prévu avant le prochain solo. Le 9 juillet.", targetId: "el_vaiho" },
      { characterId: "el_estall",   type: "dialog", text: "20 jours pour moi. Sur simu aujourd'hui — c'est frustrant.", targetId: "fi_didier" },
      { characterId: "fi_didier",   type: "dialog", text: "Teaki — le simu c'est pas 'mieux que rien'. Les pannes moteur, tu peux pas les faire en vrai.", targetId: "el_estall" },
      { characterId: "fi_pascal",   type: "dialog", text: "Ce qui compte c'est comment tu uses le temps entre les vols.", targetId: "el_chant" },
    ],
  },
  {
    id: "bases", label: "Rappels bases", sublabel: "carnets, CR, NOTAMs",
    beats: [
      { characterId: "fi_didier",   type: "system", text: "Salle de cours — 10h00" },
      { characterId: "fi_didier",   type: "dialog", text: "J'ai épluché les carnets de vol hier soir. On a des problèmes." },
      { characterId: "fi_didier",   type: "dialog", text: "Akeval — vol non signé du 14 juin. Tohaumoana — mauvaise immatriculation.", targetId: "el_monnier" },
      { characterId: "el_monnier",  type: "dialog", text: "Je me suis trompé de lettre...", targetId: "fi_didier" },
      { characterId: "fi_didier",   type: "dialog", text: "L'immatriculation c'est le premier truc que tu lis avant de voler. C'est un document légal.", targetId: "el_monnier" },
      { characterId: "el_hauata",   type: "dialog", text: "Chef, j'arrive pas bien à exprimer ce qui s'est passé en vol.", targetId: "fi_didier" },
      { characterId: "fi_didier",   type: "dialog", text: "Une phrase par manœuvre Maarau : ce que t'as fait, ce qui t'a surpris, ce que tu referais.", targetId: "el_hauata" },
      { characterId: "el_fareea",   type: "dialog", text: "Y'a des NOTAMs importants aujourd'hui ?", targetId: "fi_didier" },
      { characterId: "fi_didier",   type: "dialog", text: "Bonno — c'est toi qui dois me le dire. T'aurais dû les consulter avant de venir.", targetId: "el_fareea" },
    ],
  },
  {
    id: "findejournee", label: "Fin de journée", sublabel: "17h00",
    beats: [
      { characterId: "fi_didier",   type: "system", text: "17h00 — Fin des vols du jour" },
      { characterId: "el_triponel", type: "dialog", text: "Chef, j'ai fait mon premier virage à 45° tout seul. Arnaud a rien touché !", targetId: "fi_arnaud" },
      { characterId: "fi_arnaud",   type: "dialog", text: "Exact. Tu regardais dehors au lieu de fixer les instruments.", targetId: "el_triponel" },
      { characterId: "el_chang",    type: "dialog", text: "Moi sur le simu j'ai foiré la panne moteur. Deux fois.", targetId: "fi_vincent" },
      { characterId: "fi_vincent",  type: "dialog", text: "Herman — les foirages sur simu c'est ce qu'on cherche. T'as compris pourquoi ?", targetId: "el_chang" },
      { characterId: "el_chang",    type: "dialog", text: "J'ai voulu recaler moteur au lieu de poser droit devant.", targetId: "fi_vincent" },
      { characterId: "fi_vincent",  type: "dialog", text: "Exactement. En dessous de 200ft on pose. Point.", targetId: "el_chang" },
      { characterId: "fi_pascal",   type: "dialog", text: "Beau travail tout le monde. F-ONCF revient lundi. Bon repos." },
      { characterId: "el_charuel",  type: "dialog", text: "Ia ora na à tous !" },
    ],
  },
];

// Dessin SVG d'un bonhomme (vue de face)
function Bonhomme({ char, speaking, targeted }: { char: CharDef; speaking: boolean; targeted: boolean }) {
  const c = char.hex;
  return (
    <g>
      {/* Anneau de parole */}
      {speaking && (
        <circle cx="0" cy="0" r="22" fill="none" stroke={c} strokeWidth="3" opacity="0.9">
          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="1.5s" repeatCount="indefinite" />
        </circle>
      )}
      {targeted && !speaking && (
        <circle cx="0" cy="0" r="20" fill="none" stroke={c} strokeWidth="1.5" opacity="0.4" strokeDasharray="4 4" />
      )}
      {/* Corps */}
      <ellipse cx="0" cy="6" rx="7" ry="9" fill={c} opacity={speaking ? 1 : 0.75} />
      {/* Tête */}
      <circle cx="0" cy="-8" r="8" fill={c} opacity={speaking ? 1 : 0.75} />
      {/* Yeux */}
      <circle cx="-3" cy="-9" r="1.5" fill="#0f172a" />
      <circle cx="3" cy="-9" r="1.5" fill="#0f172a" />
      {/* Bouche souriante si parle */}
      {speaking && <path d="M -3 -5 Q 0 -3 3 -5" stroke="#0f172a" strokeWidth="1.2" fill="none" />}
      {/* Halo FI */}
      {char.role === "FI" && (
        <ellipse cx="0" cy="-18" rx="10" ry="3" fill="none" stroke="#f59e0b" strokeWidth="2.5" />
      )}
      {/* Bulle de dialogue si parle */}
      {speaking && (
        <g transform="translate(12, -22)">
          <rect x="0" y="-10" width="36" height="16" rx="5" fill={c} opacity="0.95" />
          <polygon points="-5,0 0,-5 0,5" fill={c} opacity="0.95" />
          <text x="18" y="-1" textAnchor="middle" fontSize="8" fill="#0f172a" fontWeight="bold">💬</text>
        </g>
      )}
    </g>
  );
}

export default function OpsRoom3D() {
  const [scenario, setScenario] = useState<Scenario>(SCENARIOS[0]);
  const [beatIdx, setBeatIdx] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<1 | 2 | 3>(1);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const DELAY = { 1: 3000, 2: 1500, 3: 700 }[speed];

  function loadScenario(s: Scenario) {
    if (timer.current) clearInterval(timer.current);
    setScenario(s);
    setBeatIdx(-1);
    setPlaying(false);
  }

  useEffect(() => {
    if (timer.current) clearInterval(timer.current);
    if (!playing) return;
    timer.current = setInterval(() => {
      setBeatIdx(i => {
        if (i + 1 >= scenario.beats.length) {
          setPlaying(false);
          if (timer.current) clearInterval(timer.current);
          return i;
        }
        return i + 1;
      });
    }, DELAY);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [playing, scenario, DELAY]);

  const beat = beatIdx >= 0 ? scenario.beats[beatIdx] : null;
  const char = beat ? CHARS.find(c => c.id === beat.characterId) : null;
  const done = beatIdx >= scenario.beats.length - 1;

  function handlePlay() {
    if (done) { setBeatIdx(0); setPlaying(true); }
    else if (playing) { setPlaying(false); }
    else { setBeatIdx(b => b < 0 ? 0 : b); setPlaying(true); }
  }

  const speakerId = beat?.characterId ?? "";
  const targetId = beat?.targetId ?? "";

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 12 }}>
        <h1 style={{ color: "#f8fafc", fontSize: 22, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <Radio size={20} color="#38bdf8" /> Salle des Ops C3P
        </h1>
        <p style={{ color: "#94a3b8", fontSize: 12, margin: "4px 0 0" }}>
          Faa'a · 25 juin 2026 · Simulation fictive à but pédagogique
        </p>
      </div>

      {/* Scénarios */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {SCENARIOS.map(s => (
          <button key={s.id} onClick={() => loadScenario(s)} style={{
            padding: "6px 12px", borderRadius: 8, border: `1px solid ${scenario.id === s.id ? "#38bdf8" : "#334155"}`,
            background: scenario.id === s.id ? "rgba(56,189,248,0.15)" : "#1e293b",
            color: scenario.id === s.id ? "#f8fafc" : "#94a3b8", cursor: "pointer", textAlign: "left",
          }}>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontSize: 10, opacity: 0.6 }}>{s.sublabel}</div>
          </button>
        ))}
      </div>

      {/* Contrôles */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <button onClick={handlePlay} style={{
          display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 8,
          background: "#0ea5e9", color: "white", border: "none", cursor: "pointer",
          fontSize: 14, fontWeight: 700,
        }}>
          {done ? <><RotateCcw size={16} /> Rejouer</> :
           playing ? <><Pause size={16} /> Pause</> :
           <><Play size={16} />{beatIdx < 0 ? "Lancer la scène" : "Reprendre"}</>}
        </button>
        <div style={{ display: "flex", gap: 2, background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: 2 }}>
          {([1, 2, 3] as const).map(v => (
            <button key={v} onClick={() => setSpeed(v)} style={{
              padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12,
              background: speed === v ? "#0ea5e9" : "transparent", color: speed === v ? "white" : "#64748b",
            }}>
              {v === 1 ? "×1" : v === 2 ? "×2" : "×4"}
            </button>
          ))}
        </div>
        {beatIdx >= 0 && (
          <span style={{ fontSize: 12, color: "#64748b" }}>{beatIdx + 1} / {scenario.beats.length}</span>
        )}
        <span style={{ marginLeft: "auto", fontSize: 11, color: "#64748b" }}>
          🟡 Auréole = Instructeur · ⭕ Anneau = parle
        </span>
      </div>

      {/* Salle SVG */}
      <div style={{
        borderRadius: 12, overflow: "hidden", border: "1px solid #1e3a5f",
        background: "linear-gradient(160deg, #0a1628 0%, #0f2042 50%, #0a1628 100%)",
        position: "relative",
      }}>
        <svg width="100%" viewBox="0 0 900 400" style={{ display: "block" }}>
          {/* Sol */}
          <rect x="10" y="10" width="880" height="380" rx="8" fill="#0d1f3a" stroke="#1e3a5f" strokeWidth="1" />
          {/* Grille */}
          {Array.from({ length: 9 }, (_, i) => (
            <line key={`v${i}`} x1={10 + i * 110} y1="10" x2={10 + i * 110} y2="390" stroke="#1e3a5f" strokeWidth="0.5" />
          ))}
          {Array.from({ length: 5 }, (_, i) => (
            <line key={`h${i}`} x1="10" y1={10 + i * 95} x2="890" y2={10 + i * 95} stroke="#1e3a5f" strokeWidth="0.5" />
          ))}

          {/* Tableau blanc */}
          <rect x="30" y="20" width="200" height="55" rx="4" fill="#e2e8f0" />
          <text x="130" y="40" textAnchor="middle" fontSize="9" fill="#1e293b" fontWeight="bold">BRIEFING C3P</text>
          <text x="130" y="52" textAnchor="middle" fontSize="8" fill="#475569">QNH 1012 · Vent 080/08kt</text>
          <text x="130" y="64" textAnchor="middle" fontSize="8" fill="#ef4444">⚠ F-ONCF MAINTENANCE</text>

          {/* Table de briefing */}
          <rect x="280" y="160" width="340" height="80" rx="6" fill="#1e3a5f" stroke="#334155" strokeWidth="1" />
          <text x="450" y="205" textAnchor="middle" fontSize="10" fill="#64748b">TABLE BRIEFING</text>

          {/* Canapé */}
          <rect x="720" y="310" width="150" height="60" rx="8" fill="#1e3a5f" stroke="#334155" strokeWidth="1" />
          <text x="795" y="345" textAnchor="middle" fontSize="9" fill="#64748b">canapé</text>

          {/* Bureau radio */}
          <rect x="780" y="20" width="100" height="55" rx="4" fill="#0f172a" stroke="#0ea5e9" strokeWidth="1" />
          <rect x="790" y="28" width="35" height="22" rx="2" fill="#0ea5e9" opacity="0.7" />
          <rect x="835" y="28" width="35" height="22" rx="2" fill="#0ea5e9" opacity="0.7" />
          <text x="830" y="64" textAnchor="middle" fontSize="8" fill="#38bdf8">RADIO</text>

          {/* Étiquette zones */}
          <text x="450" y="100" textAnchor="middle" fontSize="9" fill="#1e3a5f" fontWeight="bold" letterSpacing="3">— INSTRUCTEURS —</text>

          {/* Personnages */}
          {CHARS.map(c => {
            const sx = 10 + (c.x / 100) * 880;
            const sy = 10 + (c.y / 100) * 380;
            const speaking = c.id === speakerId;
            const targeted = c.id === targetId;
            return (
              <g key={c.id} transform={`translate(${sx}, ${sy})`}>
                <Bonhomme char={c} speaking={speaking} targeted={targeted} />
                {/* Prénom */}
                <text y="24" textAnchor="middle" fontSize="8" fill={speaking ? c.hex : "#94a3b8"}
                  fontWeight={speaking ? "bold" : "normal"}>
                  {c.short}
                </text>
              </g>
            );
          })}

          {/* Flèche entre locuteur et destinataire */}
          {beat && beat.targetId && (() => {
            const s = CHARS.find(c => c.id === beat.characterId);
            const t = CHARS.find(c => c.id === beat.targetId);
            if (!s || !t) return null;
            const sx = 10 + (s.x / 100) * 880;
            const sy = 10 + (s.y / 100) * 380;
            const tx = 10 + (t.x / 100) * 880;
            const ty = 10 + (t.y / 100) * 380;
            const mx = (sx + tx) / 2;
            const my = (sy + ty) / 2 - 20;
            return (
              <g opacity="0.6">
                <path d={`M ${sx} ${sy - 10} Q ${mx} ${my} ${tx} ${ty - 10}`}
                  fill="none" stroke={s.hex} strokeWidth="1.5" strokeDasharray="5 3"
                  markerEnd="url(#arrow)" />
                <defs>
                  <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 Z" fill={s.hex} />
                  </marker>
                </defs>
              </g>
            );
          })()}
        </svg>
      </div>

      {/* Message courant */}
      {beat && char && beat.type !== "system" && (
        <div style={{
          marginTop: 12, borderRadius: 12, border: `1px solid ${char.hex}55`,
          background: `${char.hex}11`, padding: "12px 16px",
          display: "flex", alignItems: "flex-start", gap: 12,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%", background: char.hex,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, color: "#0f172a", fontSize: 16, flexShrink: 0,
          }}>
            {char.short[0]}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: char.hex }}>
              {char.full}
              <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 400, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>
                {char.role === "FI" ? "Instructeur" : char.role === "PILOTE" ? "Pilote" : "Élève"}
                {beat.type === "atis" ? " · METAR" : ""}
              </span>
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 14, color: beat.type === "action" ? "#64748b" : "#f1f5f9", fontStyle: beat.type === "action" ? "italic" : "normal" }}>
              {beat.type === "action" ? `*${beat.text}*` : `"${beat.text}"`}
            </p>
          </div>
        </div>
      )}

      {beat?.type === "system" && (
        <div style={{ marginTop: 12, borderRadius: 8, border: "1px solid #334155", background: "#1e293b", padding: "8px 16px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
          🕐 {beat.text}
        </div>
      )}

      {beatIdx < 0 && (
        <div style={{ marginTop: 12, borderRadius: 8, border: "1px solid #1e3a5f", background: "#0f172a", padding: "10px 16px", textAlign: "center", color: "#64748b", fontSize: 12 }}>
          Choisis un scénario puis clique sur <strong style={{ color: "#38bdf8" }}>Lancer la scène</strong>
        </div>
      )}
    </div>
  );
}
