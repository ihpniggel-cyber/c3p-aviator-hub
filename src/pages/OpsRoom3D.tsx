import { useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Button } from "@/components/ui/button";
import { Radio, Play, Pause, RotateCcw } from "lucide-react";

interface CharDef {
  id: string;
  short: string;
  full: string;
  role: "FI" | "ELEVE" | "PILOTE";
  hex: string;
  pos: [number, number, number];
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
  { id: "fi_pascal",     short: "Pascal",     full: "Pascal NIGGEL",      role: "FI",     hex: "#f59e0b", pos: [-4.5, 0, -3]   },
  { id: "fi_frederic",   short: "Frédéric",   full: "Frédéric AXUS",      role: "FI",     hex: "#f97316", pos: [-3,   0, -3]   },
  { id: "fi_arnaud",     short: "Arnaud",     full: "Arnaud BOULANGER",   role: "FI",     hex: "#ef4444", pos: [-1.5, 0, -3]   },
  { id: "fi_didier",     short: "Didier",     full: "Didier JUERY",       role: "FI",     hex: "#f43f5e", pos: [ 0,   0, -3]   },
  { id: "fi_jeanyves",   short: "Jean-Yves",  full: "J-Y MARTINO",        role: "FI",     hex: "#ec4899", pos: [ 1.5, 0, -3]   },
  { id: "fi_florian",    short: "Florian",    full: "Florian REYREAU",    role: "FI",     hex: "#d946ef", pos: [ 3,   0, -3]   },
  { id: "fi_vincent",    short: "Vincent",    full: "Vincent ROUX",       role: "FI",     hex: "#8b5cf6", pos: [ 4.5, 0, -3]   },
  { id: "fi_philippe",   short: "Philippe",   full: "Philippe TAPETA",    role: "FI",     hex: "#3b82f6", pos: [-4.5, 0, -1.5] },
  { id: "fi_manahere",   short: "Manahere",   full: "M. TEHEIURA",        role: "FI",     hex: "#06b6d4", pos: [-3,   0, -1.5] },
  { id: "el_charuel",    short: "Aurélie",    full: "Aurélie CHARUEL",    role: "PILOTE", hex: "#10b981", pos: [-1.5, 0,  0]   },
  { id: "el_carpi",      short: "Patrice",    full: "Patrice CARPI",      role: "ELEVE",  hex: "#0ea5e9", pos: [ 0,   0,  0]   },
  { id: "el_nouveau",    short: "Teariki",    full: "Teariki NOUVEAU",    role: "PILOTE", hex: "#14b8a6", pos: [ 1.5, 0,  0]   },
  { id: "el_iannaci",    short: "Daniele",    full: "Daniele IANNACI",    role: "PILOTE", hex: "#22c55e", pos: [ 3,   0,  0]   },
  { id: "el_vaiho",      short: "Viriamu",    full: "Viriamu VAIHO",      role: "ELEVE",  hex: "#84cc16", pos: [ 4.5, 0,  0]   },
  { id: "el_chant",      short: "Ranitea",    full: "Ranitea CHANT",      role: "ELEVE",  hex: "#fbbf24", pos: [-4.5, 0,  1.5] },
  { id: "el_tuihani",    short: "Teihotu",    full: "Teihotu TUIHANI",    role: "PILOTE", hex: "#fb923c", pos: [-3,   0,  1.5] },
  { id: "el_lardillier", short: "Keanee",     full: "Keanee LARDILLIER",  role: "ELEVE",  hex: "#f87171", pos: [-1.5, 0,  1.5] },
  { id: "el_conroy",     short: "Tetaitu",    full: "Tetaitu CONROY",     role: "ELEVE",  hex: "#c084fc", pos: [ 0,   0,  1.5] },
  { id: "el_estall",     short: "Teaki",      full: "Teaki ESTALL",       role: "ELEVE",  hex: "#818cf8", pos: [ 1.5, 0,  1.5] },
  { id: "el_maiau",      short: "Akeval",     full: "Akeval MAIAU",       role: "ELEVE",  hex: "#38bdf8", pos: [ 3,   0,  1.5] },
  { id: "el_temu",       short: "Tamahei",    full: "Tamahei TEMU",       role: "ELEVE",  hex: "#34d399", pos: [ 4.5, 0,  1.5] },
  { id: "el_chang",      short: "Herman",     full: "Herman CHANG",       role: "ELEVE",  hex: "#a3e635", pos: [-4.5, 0,  3]   },
  { id: "el_tamu",       short: "Tevaihau",   full: "Tevaihau TAMU",      role: "ELEVE",  hex: "#fde047", pos: [-3,   0,  3]   },
  { id: "el_pater",      short: "Teheiani",   full: "Teheiani PATER",     role: "ELEVE",  hex: "#fdba74", pos: [-1.5, 0,  3]   },
  { id: "el_labeaume",   short: "Timothée",   full: "Timothée LABEAUME",  role: "ELEVE",  hex: "#f9a8d4", pos: [ 0,   0,  3]   },
  { id: "el_hauata",     short: "Maarau",     full: "Maarau HAUATA",      role: "ELEVE",  hex: "#86efac", pos: [ 1.5, 0,  3]   },
  { id: "el_monnier",    short: "Tohaumoana", full: "Tohaumoana M.",       role: "ELEVE",  hex: "#7dd3fc", pos: [ 3,   0,  3]   },
  { id: "el_triponel",   short: "Ewen",       full: "Ewen TRIPONEL",      role: "ELEVE",  hex: "#c4b5fd", pos: [ 4.5, 0,  3]   },
  { id: "el_fareea",     short: "Bonno",      full: "Bonno FAREEA",       role: "ELEVE",  hex: "#a78bfa", pos: [-3,   0,  4.5] },
  { id: "el_sandford",   short: "Manuarii",   full: "Manuarii SANDFORD",  role: "PILOTE", hex: "#6ee7b7", pos: [ 0,   0,  4.5] },
  { id: "el_chang2",     short: "Charline",   full: "Charline JOLLIEN",   role: "ELEVE",  hex: "#fca5a5", pos: [ 3,   0,  4.5] },
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
      { characterId: "fi_florian",  type: "dialog", text: "10kt de trop. Ça rallonge l'atterro de 150m. On rejoue ça sur le whiteboard.", targetId: "el_charuel" },
      { characterId: "el_charuel",  type: "dialog", text: "Pour la radio — j'ai appelé tour au lieu de sol.", targetId: "fi_florian" },
      { characterId: "fi_florian",  type: "dialog", text: "La radio se prépare avant l'action. Elle est dans ta checklist — tu la lis ou tu la récites ?", targetId: "el_charuel" },
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
      { characterId: "fi_pascal",   type: "dialog", text: "Non. Mais c'est mieux que rien. On se cale un vol de remise en condition — biplace.", targetId: "el_chant" },
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
      { characterId: "fi_didier",   type: "dialog", text: "Akeval — vol non signé du 14 juin. Tohaumoana — F-OIQA sur un vol fait en F-OIQZ.", targetId: "el_monnier" },
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

// ─── Personnage 3D simple — aucun useFrame, aucune ref ────────────────────────

function Char({ def, speaking, targeted }: { def: CharDef; speaking: boolean; targeted: boolean }) {
  const c = def.hex;
  const glow = speaking ? 2.5 : targeted ? 0.8 : 0.0;
  const scale = speaking ? 1.18 : 1.0;

  return (
    <group position={def.pos} scale={[scale, scale, scale]}>
      {/* Corps */}
      <mesh position={[0, 0.48, 0]}>
        <capsuleGeometry args={[0.17, 0.4, 4, 8]} />
        <meshStandardMaterial color={c} emissive={c} emissiveIntensity={glow} roughness={0.5} />
      </mesh>
      {/* Tête */}
      <mesh position={[0, 1.05, 0]}>
        <sphereGeometry args={[0.21, 10, 8]} />
        <meshStandardMaterial color={c} emissive={c} emissiveIntensity={glow} roughness={0.4} />
      </mesh>
      {/* Yeux */}
      <mesh position={[-0.08, 1.08, 0.18]}>
        <sphereGeometry args={[0.028, 5, 5]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[0.08, 1.08, 0.18]}>
        <sphereGeometry args={[0.028, 5, 5]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      {/* Halo FI */}
      {def.role === "FI" && (
        <mesh position={[0, 1.38, 0]}>
          <torusGeometry args={[0.25, 0.025, 6, 20]} />
          <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={1.5} />
        </mesh>
      )}
      {/* Disque "en train de parler" */}
      {speaking && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.28, 0.42, 24]} />
          <meshStandardMaterial color={c} emissive={c} emissiveIntensity={3} transparent opacity={0.9} />
        </mesh>
      )}
    </group>
  );
}

function Room() {
  return (
    <group>
      {/* Sol */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[16, 12]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} />
      </mesh>
      <gridHelper args={[16, 16, "#334155", "#1e3a5f"]} />
      {/* Mur fond */}
      <mesh position={[0, 2, -6]}>
        <boxGeometry args={[16, 4, 0.15]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      {/* Mur gauche */}
      <mesh position={[-8, 2, 0]}>
        <boxGeometry args={[0.15, 4, 12]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      {/* Mur droit */}
      <mesh position={[8, 2, 0]}>
        <boxGeometry args={[0.15, 4, 12]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      {/* Tableau blanc */}
      <mesh position={[-3, 1.8, -5.9]}>
        <boxGeometry args={[3, 1.6, 0.08]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.8} />
      </mesh>
      {/* Table briefing */}
      <mesh position={[0, 0.42, -1.2]}>
        <boxGeometry args={[5.5, 0.1, 1.6]} />
        <meshStandardMaterial color="#1e3a5f" />
      </mesh>
      {/* Canapé */}
      <mesh position={[5, 0.3, 4]}>
        <boxGeometry args={[2.5, 0.5, 1]} />
        <meshStandardMaterial color="#1e3a5f" />
      </mesh>
      {/* Lumières */}
      {([ [-3, 3.8, -2], [3, 3.8, -2], [0, 3.8, 2], [0, 3.8, 4.5] ] as [number,number,number][]).map(([x,y,z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh>
            <boxGeometry args={[0.8, 0.06, 0.2]} />
            <meshStandardMaterial color="#e2e8f0" emissive="#e2e8f0" emissiveIntensity={0.9} />
          </mesh>
          <pointLight intensity={8} distance={7} color="#f8fafc" />
        </group>
      ))}
    </group>
  );
}

function Scene({ speakerId, targetId }: { speakerId: string; targetId: string }) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[4, 8, 4]} intensity={0.6} />
      <Room />
      {CHARS.map(c => (
        <Char key={c.id} def={c} speaking={c.id === speakerId} targeted={c.id === targetId} />
      ))}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Radio className="w-6 h-6 text-sky-400" />
          Salle des Ops C3P — 3D
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Faa'a · 25 juin 2026 · Simulation fictive à but pédagogique</p>
      </div>

      {/* Scénarios */}
      <div className="flex gap-2 flex-wrap">
        {SCENARIOS.map(s => (
          <button key={s.id} onClick={() => loadScenario(s)}
            className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all text-left ${
              scenario.id === s.id
                ? "border-sky-500 bg-sky-500/20 text-white"
                : "border-slate-600 bg-slate-800 text-slate-300 hover:border-sky-500/50 hover:text-white"
            }`}>
            <span className="block font-semibold">{s.label}</span>
            <span className="block text-[10px] opacity-60">{s.sublabel}</span>
          </button>
        ))}
      </div>

      {/* Contrôles */}
      <div className="flex items-center gap-3">
        <button onClick={handlePlay}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm bg-sky-500 hover:bg-sky-400 text-white transition-colors">
          {done ? <><RotateCcw className="w-4 h-4" /> Rejouer</> :
           playing ? <><Pause className="w-4 h-4" /> Pause</> :
           <><Play className="w-4 h-4" />{beatIdx < 0 ? "Lancer la scène" : "Reprendre"}</>}
        </button>
        <div className="flex gap-0.5 bg-slate-800 border border-slate-600 rounded-lg p-0.5">
          {([1, 2, 3] as const).map(v => (
            <button key={v} onClick={() => setSpeed(v)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${speed === v ? "bg-sky-500 text-white" : "text-slate-400 hover:text-white"}`}>
              {v === 1 ? "×1" : v === 2 ? "×2" : "×4"}
            </button>
          ))}
        </div>
        {beatIdx >= 0 && (
          <span className="text-xs text-slate-400">{beatIdx + 1} / {scenario.beats.length}</span>
        )}
        <div className="ml-auto flex gap-3 text-xs text-slate-400">
          <span>🟡 Halo = Instructeur</span>
          <span>💡 Brillant = parle</span>
        </div>
      </div>

      {/* Canvas 3D */}
      <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-900" style={{ height: 480 }}>
        <Canvas camera={{ position: [0, 11, 11], fov: 44 }}>
          <OrbitControls target={[0, 0, 0]} enablePan={false} minDistance={8} maxDistance={22} minPolarAngle={Math.PI / 6} maxPolarAngle={Math.PI / 2.2} />
          <Scene speakerId={beat?.characterId ?? ""} targetId={beat?.targetId ?? ""} />
        </Canvas>
      </div>

      {/* Message */}
      {beat && char && beat.type !== "system" && (
        <div className="rounded-xl border p-4 flex items-start gap-3"
          style={{ borderColor: char.hex + "66", background: char.hex + "11" }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
            style={{ background: char.hex }}>
            {char.short[0]}
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: char.hex }}>
              {char.full}
              <span className="ml-2 text-[10px] font-normal text-slate-400 uppercase tracking-wider">
                {char.role === "FI" ? "Instructeur" : char.role === "PILOTE" ? "Pilote" : "Élève"}
                {beat.type === "atis" ? " · METAR" : beat.type === "radio" ? " · Radio" : ""}
              </span>
            </p>
            <p className={`text-sm mt-1 ${beat.type === "action" ? "italic text-slate-400" : "text-slate-100"}`}>
              {beat.type === "action" ? `*${beat.text}*` : beat.text}
            </p>
          </div>
        </div>
      )}

      {beat?.type === "system" && (
        <div className="rounded-lg border border-slate-600 bg-slate-800/50 px-4 py-2 text-center text-sm text-slate-300">
          🕐 {beat.text}
        </div>
      )}
    </div>
  );
}
