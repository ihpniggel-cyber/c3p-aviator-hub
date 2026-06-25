import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Radio } from "lucide-react";

interface CharDef {
  id: string;
  short: string;
  full: string;
  role: "FI" | "ELEVE" | "PILOTE";
  hex: string;
  baseX: number;
  baseY: number;
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

interface Pos { x: number; y: number }

const CHARS: CharDef[] = [
  { id:"fi_pascal",     short:"Pascal",     full:"Pascal NIGGEL",      role:"FI",     hex:"#f59e0b", baseX:8,  baseY:12 },
  { id:"fi_frederic",   short:"Frédéric",   full:"Frédéric AXUS",      role:"FI",     hex:"#f97316", baseX:18, baseY:10 },
  { id:"fi_arnaud",     short:"Arnaud",     full:"Arnaud BOULANGER",   role:"FI",     hex:"#ef4444", baseX:28, baseY:12 },
  { id:"fi_didier",     short:"Didier",     full:"Didier JUERY",       role:"FI",     hex:"#f43f5e", baseX:38, baseY:10 },
  { id:"fi_jeanyves",   short:"Jean-Yves",  full:"J-Y MARTINO",        role:"FI",     hex:"#ec4899", baseX:48, baseY:12 },
  { id:"fi_florian",    short:"Florian",    full:"Florian REYREAU",    role:"FI",     hex:"#d946ef", baseX:58, baseY:10 },
  { id:"fi_vincent",    short:"Vincent",    full:"Vincent ROUX",       role:"FI",     hex:"#8b5cf6", baseX:68, baseY:12 },
  { id:"fi_philippe",   short:"Philippe",   full:"Philippe TAPETA",    role:"FI",     hex:"#3b82f6", baseX:78, baseY:10 },
  { id:"fi_manahere",   short:"Manahere",   full:"M. TEHEIURA",        role:"FI",     hex:"#06b6d4", baseX:88, baseY:12 },
  { id:"el_charuel",    short:"Aurélie",    full:"Aurélie CHARUEL",    role:"PILOTE", hex:"#10b981", baseX:8,  baseY:35 },
  { id:"el_carpi",      short:"Patrice",    full:"Patrice CARPI",      role:"ELEVE",  hex:"#0ea5e9", baseX:20, baseY:33 },
  { id:"el_nouveau",    short:"Teariki",    full:"Teariki NOUVEAU",    role:"PILOTE", hex:"#14b8a6", baseX:32, baseY:35 },
  { id:"el_iannaci",    short:"Daniele",    full:"Daniele IANNACI",    role:"PILOTE", hex:"#22c55e", baseX:44, baseY:33 },
  { id:"el_vaiho",      short:"Viriamu",    full:"Viriamu VAIHO",      role:"ELEVE",  hex:"#84cc16", baseX:56, baseY:35 },
  { id:"el_chant",      short:"Ranitea",    full:"Ranitea CHANT",      role:"ELEVE",  hex:"#fbbf24", baseX:68, baseY:33 },
  { id:"el_tuihani",    short:"Teihotu",    full:"Teihotu TUIHANI",    role:"PILOTE", hex:"#fb923c", baseX:80, baseY:35 },
  { id:"el_lardillier", short:"Keanee",     full:"Keanee LARDILLIER",  role:"ELEVE",  hex:"#f87171", baseX:92, baseY:33 },
  { id:"el_conroy",     short:"Tetaitu",    full:"Tetaitu CONROY",     role:"ELEVE",  hex:"#c084fc", baseX:8,  baseY:57 },
  { id:"el_estall",     short:"Teaki",      full:"Teaki ESTALL",       role:"ELEVE",  hex:"#818cf8", baseX:20, baseY:55 },
  { id:"el_maiau",      short:"Akeval",     full:"Akeval MAIAU",       role:"ELEVE",  hex:"#38bdf8", baseX:32, baseY:57 },
  { id:"el_temu",       short:"Tamahei",    full:"Tamahei TEMU",       role:"ELEVE",  hex:"#34d399", baseX:44, baseY:55 },
  { id:"el_chang",      short:"Herman",     full:"Herman CHANG",       role:"ELEVE",  hex:"#a3e635", baseX:56, baseY:57 },
  { id:"el_tamu",       short:"Tevaihau",   full:"Tevaihau TAMU",      role:"ELEVE",  hex:"#fde047", baseX:68, baseY:55 },
  { id:"el_pater",      short:"Teheiani",   full:"Teheiani PATER",     role:"ELEVE",  hex:"#fdba74", baseX:80, baseY:57 },
  { id:"el_labeaume",   short:"Timothée",   full:"Timothée LABEAUME",  role:"ELEVE",  hex:"#f9a8d4", baseX:92, baseY:55 },
  { id:"el_hauata",     short:"Maarau",     full:"Maarau HAUATA",      role:"ELEVE",  hex:"#86efac", baseX:14, baseY:78 },
  { id:"el_monnier",    short:"Tohaumoana", full:"Tohaumoana M.",       role:"ELEVE",  hex:"#7dd3fc", baseX:32, baseY:80 },
  { id:"el_triponel",   short:"Ewen",       full:"Ewen TRIPONEL",      role:"ELEVE",  hex:"#c4b5fd", baseX:50, baseY:78 },
  { id:"el_fareea",     short:"Bonno",      full:"Bonno FAREEA",       role:"ELEVE",  hex:"#a78bfa", baseX:68, baseY:80 },
  { id:"el_sandford",   short:"Manuarii",   full:"Manuarii SANDFORD",  role:"PILOTE", hex:"#6ee7b7", baseX:82, baseY:78 },
  { id:"el_chang2",     short:"Charline",   full:"Charline JOLLIEN",   role:"ELEVE",  hex:"#fca5a5", baseX:92, baseY:80 },
];

const SCENARIOS: Scenario[] = [
  {
    id:"briefing", label:"Briefing matin", sublabel:"06h30",
    beats:[
      { characterId:"fi_didier",   type:"system", text:"Salle des ops — 25 juin — 06h30" },
      { characterId:"fi_didier",   type:"atis",   text:"METAR NTAA : vent 080/08kt — QNH 1012 — NOSIG" },
      { characterId:"fi_didier",   type:"dialog", text:"F-ONCF en maintenance. On absorbe sur F-ORVZ et F-OIQZ.", targetId:"fi_philippe" },
      { characterId:"fi_philippe", type:"dialog", text:"Reçu. J'ai Keanee à 07h, Manea à midi. Chargé mais faisable.", targetId:"fi_didier" },
      { characterId:"fi_florian",  type:"dialog", text:"Moi j'ai Aurélie tôt sur F-ORVZ, puis Daniele sur F-OIQZ." },
      { characterId:"el_charuel",  type:"dialog", text:"J'ai fait mon brief météo. NOTAM actif fréquence Papeete 06h-07h.", targetId:"fi_florian" },
      { characterId:"fi_florian",  type:"dialog", text:"Parfait Aurélie. On décolle à 06h20.", targetId:"el_charuel" },
      { characterId:"fi_didier",   type:"dialog", text:"Teaki, Akeval, Herman — simulateur ce matin. Procédures pannes moteur.", targetId:"fi_vincent" },
      { characterId:"el_maiau",    type:"dialog", text:"Moi aussi... presque.", targetId:"fi_vincent" },
      { characterId:"fi_vincent",  type:"dialog", text:"'Presque' c'est pas une réponse valide pour une panne moteur.", targetId:"el_maiau" },
    ],
  },
  {
    id:"debriefing", label:"Débriefing piste", sublabel:"Aurélie + Florian",
    beats:[
      { characterId:"fi_florian",  type:"system", text:"Retour F-ORVZ — 08h15 — Phase PP" },
      { characterId:"fi_florian",  type:"dialog", text:"Aurélie, pose-toi. Debriefing à chaud.", targetId:"el_charuel" },
      { characterId:"el_charuel",  type:"dialog", text:"Sauf le 3e tour — assiette trop cabrée à l'arrondi.", targetId:"fi_florian" },
      { characterId:"fi_florian",  type:"dialog", text:"La vitesse seuil c'était combien ?", targetId:"el_charuel" },
      { characterId:"el_charuel",  type:"dialog", text:"J'avais 80kt. Vref sur le Tecnam c'est 70.", targetId:"fi_florian" },
      { characterId:"fi_florian",  type:"dialog", text:"10kt de trop. Ça rallonge l'atterro de 150m.", targetId:"el_charuel" },
      { characterId:"el_charuel",  type:"dialog", text:"Pour la radio — j'ai appelé tour au lieu de sol.", targetId:"fi_florian" },
      { characterId:"fi_florian",  type:"dialog", text:"La radio se prépare avant l'action. Tu lis ou tu récites la checklist ?", targetId:"el_charuel" },
      { characterId:"el_charuel",  type:"dialog", text:"...Je la récitais.", targetId:"fi_florian" },
      { characterId:"fi_florian",  type:"dialog", text:"On la lit. Toujours.", targetId:"el_charuel" },
    ],
  },
  {
    id:"sansvol", label:"Sans vol", sublabel:"Ranitea 29j · Viriamu 18j",
    beats:[
      { characterId:"fi_pascal",   type:"system", text:"Coin canapé — 09h00" },
      { characterId:"el_chant",    type:"dialog", text:"Pascal, ça fait 29 jours que j'ai pas volé. Je vais tout perdre.", targetId:"fi_pascal" },
      { characterId:"fi_pascal",   type:"dialog", text:"29 jours c'est significatif. T'as révisé tes points clés de phase ?", targetId:"el_chant" },
      { characterId:"el_chant",    type:"dialog", text:"J'ai relu la théorie. Mais la théorie c'est pas le cockpit.", targetId:"fi_pascal" },
      { characterId:"fi_pascal",   type:"dialog", text:"Non. Mais c'est mieux que rien. On se cale un vol de remise en condition.", targetId:"el_chant" },
      { characterId:"el_vaiho",    type:"dialog", text:"Moi c'est 18 jours. Mes quarts aux Armées — impossible de prévoir.", targetId:"fi_pascal" },
      { characterId:"fi_pascal",   type:"dialog", text:"Viriamu, tour de contrôle FI prévu avant le prochain solo. Le 9 juillet.", targetId:"el_vaiho" },
      { characterId:"el_estall",   type:"dialog", text:"20 jours pour moi. Sur simu aujourd'hui — c'est frustrant.", targetId:"fi_didier" },
      { characterId:"fi_didier",   type:"dialog", text:"Teaki — le simu c'est pas 'mieux que rien'. Les pannes moteur, tu peux pas les faire en vrai.", targetId:"el_estall" },
    ],
  },
  {
    id:"bases", label:"Rappels bases", sublabel:"carnets, CR, NOTAMs",
    beats:[
      { characterId:"fi_didier",   type:"system", text:"Salle de cours — 10h00" },
      { characterId:"fi_didier",   type:"dialog", text:"J'ai épluché les carnets de vol hier soir. On a des problèmes." },
      { characterId:"fi_didier",   type:"dialog", text:"Akeval — vol non signé du 14 juin. Tohaumoana — mauvaise immatriculation.", targetId:"el_monnier" },
      { characterId:"el_monnier",  type:"dialog", text:"Je me suis trompé de lettre...", targetId:"fi_didier" },
      { characterId:"fi_didier",   type:"dialog", text:"L'immatriculation c'est le premier truc que tu lis. C'est un document légal.", targetId:"el_monnier" },
      { characterId:"el_hauata",   type:"dialog", text:"Chef, j'arrive pas bien à exprimer ce qui s'est passé en vol.", targetId:"fi_didier" },
      { characterId:"fi_didier",   type:"dialog", text:"Une phrase par manœuvre : ce que t'as fait, ce qui t'a surpris, ce que tu referais.", targetId:"el_hauata" },
      { characterId:"el_fareea",   type:"dialog", text:"Y'a des NOTAMs importants aujourd'hui ?", targetId:"fi_didier" },
      { characterId:"fi_didier",   type:"dialog", text:"Bonno — c'est toi qui dois me le dire. T'aurais dû les consulter avant de venir.", targetId:"el_fareea" },
    ],
  },
  {
    id:"findejournee", label:"Fin de journée", sublabel:"17h00",
    beats:[
      { characterId:"fi_didier",   type:"system", text:"17h00 — Fin des vols du jour" },
      { characterId:"el_triponel", type:"dialog", text:"Chef, j'ai fait mon premier virage à 45° tout seul !", targetId:"fi_arnaud" },
      { characterId:"fi_arnaud",   type:"dialog", text:"Exact. Tu regardais dehors — c'est le bon réflexe.", targetId:"el_triponel" },
      { characterId:"el_chang",    type:"dialog", text:"Moi sur le simu j'ai foiré la panne moteur. Deux fois.", targetId:"fi_vincent" },
      { characterId:"fi_vincent",  type:"dialog", text:"Les foirages sur simu c'est ce qu'on cherche. T'as compris pourquoi ?", targetId:"el_chang" },
      { characterId:"el_chang",    type:"dialog", text:"J'ai voulu recaler moteur au lieu de poser droit devant.", targetId:"fi_vincent" },
      { characterId:"fi_vincent",  type:"dialog", text:"Exactement. En dessous de 200ft on pose. Point.", targetId:"el_chang" },
      { characterId:"fi_pascal",   type:"dialog", text:"Beau travail tout le monde. F-ONCF revient lundi. Bon repos." },
      { characterId:"el_charuel",  type:"dialog", text:"Ia ora na à tous !" },
    ],
  },
];

// Dessin d'un bonhomme SVG avec animation walk
function Bonhomme({ c, speaking, targeted, walkPhase }: {
  c: CharDef; speaking: boolean; targeted: boolean; walkPhase: number;
}) {
  const legSwing = speaking ? 0 : Math.sin(walkPhase) * 12;
  const armSwing = Math.sin(walkPhase) * 10;
  const bodyBob = speaking ? Math.abs(Math.sin(walkPhase * 2)) * 2 : 0;

  return (
    <g>
      {/* Ombre */}
      <ellipse cx="0" cy="42" rx="14" ry="4" fill="#000" opacity="0.2" />

      {/* Anneau tournant si parle */}
      {speaking && <>
        <circle cx="0" cy="10" r="30" fill="none" stroke={c.hex} strokeWidth="2.5" opacity="0.6" strokeDasharray="8 4">
          <animateTransform attributeName="transform" type="rotate" from="0 0 10" to="360 0 10" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="0" cy="10" r="24" fill={c.hex} opacity="0.08" />
      </>}

      {/* Ciblé */}
      {targeted && !speaking && (
        <circle cx="0" cy="10" r="26" fill="none" stroke={c.hex} strokeWidth="1.5" opacity="0.35" strokeDasharray="5 5" />
      )}

      {/* Jambes */}
      <line x1="-5" y1={28 + bodyBob} x2={-8 + legSwing * 0.5} y2="42" stroke={c.hex} strokeWidth="4" strokeLinecap="round" />
      <line x1="5" y1={28 + bodyBob} x2={8 - legSwing * 0.5} y2="42" stroke={c.hex} strokeWidth="4" strokeLinecap="round" />

      {/* Corps */}
      <rect x="-9" y={12 + bodyBob} width="18" height="18" rx="5" fill={c.hex} />

      {/* Bras */}
      <line x1="-9" y1={18 + bodyBob} x2={-18 - armSwing * 0.5} y2={26 + bodyBob} stroke={c.hex} strokeWidth="3.5" strokeLinecap="round" />
      <line x1="9" y1={18 + bodyBob} x2={18 + armSwing * 0.5} y2={26 + bodyBob} stroke={c.hex} strokeWidth="3.5" strokeLinecap="round" />

      {/* Tête */}
      <circle cx="0" cy={4 + bodyBob} r="10" fill={c.hex} />

      {/* Yeux */}
      <circle cx="-3.5" cy={3 + bodyBob} r={speaking ? 2.5 : 1.8} fill="#0a1628" />
      <circle cx="3.5" cy={3 + bodyBob} r={speaking ? 2.5 : 1.8} fill="#0a1628" />
      {/* Reflet yeux */}
      <circle cx="-2" cy={1.5 + bodyBob} r="0.8" fill="white" opacity="0.6" />
      <circle cx="5" cy={1.5 + bodyBob} r="0.8" fill="white" opacity="0.6" />

      {/* Bouche */}
      {speaking
        ? <path d={`M -4 ${8 + bodyBob} Q 0 ${12 + bodyBob} 4 ${8 + bodyBob}`} stroke="#0a1628" strokeWidth="1.5" fill="none" />
        : <line x1="-3" y1={8 + bodyBob} x2="3" y2={8 + bodyBob} stroke="#0a1628" strokeWidth="1.2" />
      }

      {/* Auréole FI */}
      {c.role === "FI" && (
        <ellipse cx="0" cy={-9 + bodyBob} rx="13" ry="3.5" fill="none" stroke="#f59e0b" strokeWidth="3">
          <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
        </ellipse>
      )}

      {/* Prénom */}
      <text y="56" textAnchor="middle" fontSize="9" fontWeight={speaking ? "bold" : "normal"}
        fill={speaking ? c.hex : "#94a3b8"} fontFamily="system-ui">
        {c.short}
      </text>
    </g>
  );
}

// Bulle de dialogue SVG
function SpeechBubble({ text, color, flip }: { text: string; color: string; flip?: boolean }) {
  const lines: string[] = [];
  const words = text.split(" ");
  let line = "";
  for (const w of words) {
    if ((line + w).length > 28) { lines.push(line.trim()); line = w + " "; }
    else line += w + " ";
  }
  if (line.trim()) lines.push(line.trim());
  const bw = 200, bh = lines.length * 18 + 16, tailX = flip ? bw - 20 : 20;
  return (
    <g>
      <rect x={flip ? -bw : 0} y={-bh - 18} width={bw} height={bh} rx="8"
        fill="#0f172a" stroke={color} strokeWidth="1.5" opacity="0.97" />
      <polygon points={`${flip ? -bw + tailX : tailX},-18 ${flip ? -bw + tailX + 10 : tailX + 10},-18 ${flip ? -bw + tailX + 5 : tailX + 5},0`}
        fill="#0f172a" stroke={color} strokeWidth="1.5" />
      {lines.map((l, i) => (
        <text key={i} x={flip ? -bw / 2 : bw / 2} y={-bh - 18 + 14 + i * 18}
          textAnchor="middle" fontSize="11" fill="#f1f5f9" fontFamily="system-ui">{l}</text>
      ))}
    </g>
  );
}

export default function OpsRoom3D() {
  const [scenario, setScenario] = useState<Scenario>(SCENARIOS[0]);
  const [beatIdx, setBeatIdx] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<1 | 2 | 3>(1);

  // Positions actuelles (% du SVG 900×480)
  const [positions, setPositions] = useState<Record<string, Pos>>(() =>
    Object.fromEntries(CHARS.map(c => [c.id, { x: c.baseX, y: c.baseY }]))
  );
  // Phase de marche par personnage
  const [walkPhases, setWalkPhases] = useState<Record<string, number>>(() =>
    Object.fromEntries(CHARS.map(c => [c.id, Math.random() * Math.PI * 2]))
  );

  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const walkTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const wanderTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const DELAY = { 1: 3200, 2: 1600, 3: 750 }[speed];

  const beat = beatIdx >= 0 ? scenario.beats[beatIdx] : null;
  const speakerId = beat?.characterId ?? "";
  const targetId = beat?.targetId ?? "";
  const done = beatIdx >= scenario.beats.length - 1;

  // Animation de marche (phase)
  useEffect(() => {
    walkTimer.current = setInterval(() => {
      setWalkPhases(prev => {
        const next = { ...prev };
        CHARS.forEach(c => { next[c.id] = (prev[c.id] + 0.35) % (Math.PI * 2); });
        return next;
      });
    }, 80);
    return () => { if (walkTimer.current) clearInterval(walkTimer.current); };
  }, []);

  // Déambulation aléatoire des personnages non-actifs
  useEffect(() => {
    if (wanderTimer.current) clearInterval(wanderTimer.current);
    wanderTimer.current = setInterval(() => {
      setPositions(prev => {
        const next = { ...prev };
        CHARS.forEach(c => {
          if (c.id !== speakerId && c.id !== targetId) {
            next[c.id] = {
              x: Math.max(3, Math.min(96, c.baseX + (Math.random() - 0.5) * 10)),
              y: Math.max(5, Math.min(90, c.baseY + (Math.random() - 0.5) * 8)),
            };
          }
        });
        return next;
      });
    }, 1800);
    return () => { if (wanderTimer.current) clearInterval(wanderTimer.current); };
  }, [speakerId, targetId]);

  // Rapprochement lors d'une conversation
  useEffect(() => {
    if (!speakerId) return;
    const speaker = CHARS.find(c => c.id === speakerId);
    const target = targetId ? CHARS.find(c => c.id === targetId) : null;
    if (!speaker) return;
    setPositions(prev => {
      const next = { ...prev };
      if (target) {
        const mx = (speaker.baseX + target.baseX) / 2;
        const my = (speaker.baseY + target.baseY) / 2;
        next[speakerId] = { x: mx + (speaker.baseX - mx) * 0.35 + 2, y: my + (speaker.baseY - my) * 0.35 };
        next[targetId] = { x: mx + (target.baseX - mx) * 0.35 - 2, y: my + (target.baseY - my) * 0.35 };
      } else {
        next[speakerId] = { x: speaker.baseX, y: speaker.baseY - 5 };
      }
      return next;
    });
  }, [speakerId, targetId]);

  // Retour aux positions de base quand plus actif
  useEffect(() => {
    setPositions(prev => {
      const next = { ...prev };
      CHARS.forEach(c => {
        if (c.id !== speakerId && c.id !== targetId) {
          next[c.id] = { x: c.baseX, y: c.baseY };
        }
      });
      return next;
    });
  }, [speakerId, targetId]);

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

  function handlePlay() {
    if (done) { setBeatIdx(0); setPlaying(true); }
    else if (playing) { setPlaying(false); }
    else { setBeatIdx(b => b < 0 ? 0 : b); setPlaying(true); }
  }

  const speakerDef = CHARS.find(c => c.id === speakerId);
  const targetDef  = CHARS.find(c => c.id === targetId);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "12px 16px", fontFamily: "system-ui, sans-serif", background: "#020c1b", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <Radio size={20} color="#38bdf8" />
        <h1 style={{ color: "#f8fafc", fontSize: 20, fontWeight: 700, margin: 0 }}>Salle des Ops C3P</h1>
        <span style={{ color: "#475569", fontSize: 12, marginLeft: 4 }}>Faa'a · 25 juin 2026 · Simulation fictive pédagogique</span>
      </div>

      {/* Scénarios */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        {SCENARIOS.map(s => (
          <button key={s.id} onClick={() => loadScenario(s)} style={{
            padding: "5px 11px", borderRadius: 8, border: `1px solid ${scenario.id === s.id ? "#38bdf8" : "#1e3a5f"}`,
            background: scenario.id === s.id ? "rgba(56,189,248,0.12)" : "#0d1f3a",
            color: scenario.id === s.id ? "#f0f9ff" : "#64748b", cursor: "pointer", fontSize: 12, fontWeight: 600,
          }}>
            {s.label} <span style={{ fontWeight: 400, opacity: 0.6 }}>· {s.sublabel}</span>
          </button>
        ))}
      </div>

      {/* Contrôles */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <button onClick={handlePlay} style={{
          display: "flex", alignItems: "center", gap: 8, padding: "9px 20px", borderRadius: 8,
          background: playing ? "#0f3460" : "#0ea5e9", color: "white", border: "none", cursor: "pointer",
          fontSize: 13, fontWeight: 700, boxShadow: "0 0 20px rgba(14,165,233,0.4)",
        }}>
          {done ? <><RotateCcw size={15} /> Rejouer</> :
           playing ? <><Pause size={15} /> Pause</> :
           <><Play size={15} />{beatIdx < 0 ? "▶  Lancer la scène" : "▶  Reprendre"}</>}
        </button>
        <div style={{ display: "flex", gap: 2, background: "#0d1f3a", border: "1px solid #1e3a5f", borderRadius: 8, padding: 3 }}>
          {([1, 2, 3] as const).map(v => (
            <button key={v} onClick={() => setSpeed(v)} style={{
              padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12,
              background: speed === v ? "#0ea5e9" : "transparent", color: speed === v ? "white" : "#475569",
            }}>
              {v === 1 ? "×1" : v === 2 ? "×2" : "×4"}
            </button>
          ))}
        </div>
        {beatIdx >= 0 && <span style={{ fontSize: 12, color: "#334155" }}>{beatIdx + 1} / {scenario.beats.length}</span>}
        <div style={{ marginLeft: "auto", fontSize: 11, color: "#334155", display: "flex", gap: 14 }}>
          <span>🟡 Auréole = Instructeur</span>
          <span>⭕ Anneau = parole</span>
          <span>- - → Direction du message</span>
        </div>
      </div>

      {/* Salle SVG */}
      <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #0d2847", position: "relative" }}>
        <svg width="100%" viewBox="0 0 900 480" style={{ display: "block", background: "linear-gradient(175deg, #050d1a 0%, #0a1628 60%, #050e1c 100%)" }}>
          {/* Grille plancher */}
          {Array.from({ length: 10 }, (_, i) => (
            <line key={`v${i}`} x1={i * 100} y1="0" x2={i * 100} y2="480" stroke="#0d2847" strokeWidth="0.8" />
          ))}
          {Array.from({ length: 6 }, (_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 80} x2="900" y2={i * 80} stroke="#0d2847" strokeWidth="0.8" />
          ))}

          {/* Murs */}
          <rect x="0" y="0" width="900" height="480" fill="none" stroke="#1e3a5f" strokeWidth="3" />

          {/* Tableau blanc */}
          <rect x="15" y="15" width="220" height="65" rx="5" fill="#dde4f0" />
          <rect x="17" y="17" width="216" height="61" rx="4" fill="#eef2f8" />
          <text x="125" y="36" textAnchor="middle" fontSize="10" fill="#1e293b" fontWeight="bold">BRIEFING C3P — 25/06/2026</text>
          <text x="125" y="50" textAnchor="middle" fontSize="9" fill="#3b5278">QNH 1012 · Vent 080/08kt · NOSIG</text>
          <text x="125" y="65" textAnchor="middle" fontSize="9" fill="#dc2626" fontWeight="bold">⚠ F-ONCF INDISPONIBLE</text>

          {/* Table de briefing */}
          <rect x="280" y="185" width="340" height="75" rx="8" fill="#0d2040" stroke="#1e3a5f" strokeWidth="1.5" />
          <text x="450" y="228" textAnchor="middle" fontSize="10" fill="#1e3a5f" letterSpacing="3">TABLE BRIEFING</text>
          {/* Chaises */}
          {[310, 360, 410, 460, 510, 560].map((x, i) => (
            <rect key={i} x={x} y="268" width="20" height="12" rx="3" fill="#1e3a5f" />
          ))}

          {/* Canapé */}
          <rect x="720" y="370" width="160" height="55" rx="10" fill="#0d2040" stroke="#1e3a5f" strokeWidth="1.5" />
          <rect x="720" y="370" width="160" height="20" rx="10" fill="#162a4a" />
          <rect x="720" y="370" width="18" height="55" rx="5" fill="#162a4a" />
          <rect x="862" y="370" width="18" height="55" rx="5" fill="#162a4a" />
          <text x="800" y="408" textAnchor="middle" fontSize="9" fill="#1e3a5f">canapé</text>

          {/* Bureau radio */}
          <rect x="775" y="15" width="110" height="65" rx="5" fill="#050d1a" stroke="#0ea5e9" strokeWidth="1.5" />
          <rect x="782" y="22" width="42" height="28" rx="3" fill="#0d2a47" stroke="#0ea5e9" strokeWidth="1" />
          <rect x="835" y="22" width="42" height="28" rx="3" fill="#0d2a47" stroke="#0ea5e9" strokeWidth="1" />
          <text x="803" y="40" textAnchor="middle" fontSize="8" fill="#0ea5e9">VHF1</text>
          <text x="856" y="40" textAnchor="middle" fontSize="8" fill="#0ea5e9">VHF2</text>
          <text x="830" y="68" textAnchor="middle" fontSize="8" fill="#38bdf8">◉ RADIO</text>
          {/* LED clignotante */}
          <circle cx="787" cy="60" r="4" fill="#22c55e">
            <animate attributeName="opacity" values="1;0.2;1" dur="1.2s" repeatCount="indefinite" />
          </circle>

          {/* Lumières plafond */}
          {[[200, 30], [500, 30], [750, 30], [200, 250], [500, 250], [750, 250]].map(([x, y], i) => (
            <g key={i}>
              <rect x={x - 30} y={y - 5} width="60" height="10" rx="4" fill="#e2e8f0" opacity="0.9" />
              <ellipse cx={x} cy={y + 30} rx="60" ry="40" fill="url(#light)" opacity="0.06" />
            </g>
          ))}
          <defs>
            <radialGradient id="light" cx="50%" cy="0%" r="100%">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>

          {/* Séparateur zones */}
          <line x1="15" y1="155" x2="885" y2="155" stroke="#0d2847" strokeWidth="1" strokeDasharray="8 6" />
          <text x="450" y="150" textAnchor="middle" fontSize="8" fill="#1e3a5f" letterSpacing="4">· · · ÉLÈVES & PILOTES · · ·</text>
          <text x="130" y="105" textAnchor="middle" fontSize="8" fill="#1e3a5f" letterSpacing="3">INSTRUCTEURS</text>

          {/* Flèche conversation */}
          {speakerDef && targetDef && (() => {
            const sx = (positions[speakerId]?.x ?? speakerDef.baseX) / 100 * 900;
            const sy = (positions[speakerId]?.y ?? speakerDef.baseY) / 100 * 480;
            const tx = (positions[targetId]?.x ?? targetDef.baseX) / 100 * 900;
            const ty = (positions[targetId]?.y ?? targetDef.baseY) / 100 * 480;
            const cx = (sx + tx) / 2, cy = (sy + ty) / 2 - 30;
            return (
              <>
                <defs>
                  <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                    <path d="M0,0 L8,4 L0,8 Z" fill={speakerDef.hex} opacity="0.7" />
                  </marker>
                </defs>
                <path d={`M${sx},${sy - 55} Q${cx},${cy} ${tx},${ty - 55}`}
                  fill="none" stroke={speakerDef.hex} strokeWidth="1.5" strokeDasharray="6 4"
                  markerEnd="url(#arrowhead)" opacity="0.6" />
              </>
            );
          })()}

          {/* Personnages */}
          {CHARS.map(c => {
            const pos = positions[c.id] ?? { x: c.baseX, y: c.baseY };
            const px = (pos.x / 100) * 900;
            const py = (pos.y / 100) * 480;
            const speaking = c.id === speakerId;
            const targeted = c.id === targetId;
            const wp = walkPhases[c.id] ?? 0;
            const flip = pos.x > 50;
            return (
              <g key={c.id}
                style={{ transition: "transform 0.9s cubic-bezier(0.34,1.56,0.64,1)" }}
                transform={`translate(${px}, ${py})`}>
                <Bonhomme c={c} speaking={speaking} targeted={targeted} walkPhase={wp} />
                {/* Bulle de dialogue */}
                {speaking && beat && beat.type !== "system" && (
                  <SpeechBubble text={beat.text} color={c.hex} flip={flip} />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Bandeau statut */}
      <div style={{ marginTop: 8, minHeight: 56, borderRadius: 10, border: "1px solid #1e3a5f", background: "#050d1a", padding: "10px 14px", display: "flex", alignItems: "center", gap: 12 }}>
        {!beat && (
          <span style={{ color: "#334155", fontSize: 13 }}>
            {beatIdx < 0 ? "Choisis un scénario → Lancer la scène" : "Scène terminée — Rejouer ou choisir un autre scénario"}
          </span>
        )}
        {beat?.type === "system" && (
          <span style={{ color: "#64748b", fontSize: 13 }}>🕐 {beat.text}</span>
        )}
        {beat && beat.type !== "system" && (() => {
          const c = CHARS.find(x => x.id === beat.characterId);
          if (!c) return null;
          const tgt = beat.targetId ? CHARS.find(x => x.id === beat.targetId) : null;
          return (
            <>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: c.hex, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#0a1628", fontSize: 15, flexShrink: 0 }}>
                {c.short[0]}
              </div>
              <div>
                <div style={{ fontSize: 12, color: c.hex, fontWeight: 600 }}>
                  {c.full}
                  <span style={{ color: "#475569", fontWeight: 400, marginLeft: 8 }}>
                    {c.role === "FI" ? "Instructeur" : c.role === "PILOTE" ? "Pilote" : "Élève"}
                    {tgt ? ` → ${tgt.short}` : ""}
                    {beat.type === "atis" ? " · METAR" : ""}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: beat.type === "action" ? "#64748b" : "#cbd5e1", fontStyle: beat.type === "action" ? "italic" : "normal", marginTop: 2 }}>
                  {beat.type === "action" ? `*${beat.text}*` : `"${beat.text}"`}
                </div>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
