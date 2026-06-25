import { useRef, useState, useEffect, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Radio, Play, Pause, RotateCcw } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CharDef {
  id: string;
  short: string;
  full: string;
  role: "FI" | "ELEVE" | "PILOTE";
  hex: string;
  basePos: [number, number, number];
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

// ─── Personnages ──────────────────────────────────────────────────────────────

const CHARS: CharDef[] = [
  { id: "fi_pascal",     short: "Pascal",     full: "Pascal NIGGEL",      role: "FI",     hex: "#f59e0b", basePos: [-4.5, 0, -3] },
  { id: "fi_frederic",   short: "Frédéric",   full: "Frédéric AXUS",      role: "FI",     hex: "#f97316", basePos: [-3,   0, -3] },
  { id: "fi_arnaud",     short: "Arnaud",     full: "Arnaud BOULANGER",   role: "FI",     hex: "#ef4444", basePos: [-1.5, 0, -3] },
  { id: "fi_didier",     short: "Didier",     full: "Didier JUERY",       role: "FI",     hex: "#f43f5e", basePos: [ 0,   0, -3] },
  { id: "fi_jeanyves",   short: "Jean-Yves",  full: "J-Y MARTINO",        role: "FI",     hex: "#ec4899", basePos: [ 1.5, 0, -3] },
  { id: "fi_florian",    short: "Florian",    full: "Florian REYREAU",    role: "FI",     hex: "#d946ef", basePos: [ 3,   0, -3] },
  { id: "fi_vincent",    short: "Vincent",    full: "Vincent ROUX",       role: "FI",     hex: "#8b5cf6", basePos: [ 4.5, 0, -3] },
  { id: "fi_philippe",   short: "Philippe",   full: "Philippe TAPETA",    role: "FI",     hex: "#3b82f6", basePos: [-4.5, 0, -1.5] },
  { id: "fi_manahere",   short: "Manahere",   full: "M. TEHEIURA",        role: "FI",     hex: "#06b6d4", basePos: [-3,   0, -1.5] },
  { id: "el_charuel",    short: "Aurélie",    full: "Aurélie CHARUEL",    role: "PILOTE", hex: "#10b981", basePos: [-1.5, 0,  0  ] },
  { id: "el_carpi",      short: "Patrice",    full: "Patrice CARPI",      role: "ELEVE",  hex: "#0ea5e9", basePos: [ 0,   0,  0  ] },
  { id: "el_nouveau",    short: "Teariki",    full: "Teariki NOUVEAU",    role: "PILOTE", hex: "#14b8a6", basePos: [ 1.5, 0,  0  ] },
  { id: "el_iannaci",    short: "Daniele",    full: "Daniele IANNACI",    role: "PILOTE", hex: "#22c55e", basePos: [ 3,   0,  0  ] },
  { id: "el_vaiho",      short: "Viriamu",    full: "Viriamu VAIHO",      role: "ELEVE",  hex: "#84cc16", basePos: [ 4.5, 0,  0  ] },
  { id: "el_chant",      short: "Ranitea",    full: "Ranitea CHANT",      role: "ELEVE",  hex: "#fbbf24", basePos: [-4.5, 0,  1.5] },
  { id: "el_tuihani",    short: "Teihotu",    full: "Teihotu TUIHANI",    role: "PILOTE", hex: "#fb923c", basePos: [-3,   0,  1.5] },
  { id: "el_lardillier", short: "Keanee",     full: "Keanee LARDILLIER",  role: "ELEVE",  hex: "#f87171", basePos: [-1.5, 0,  1.5] },
  { id: "el_conroy",     short: "Tetaitu",    full: "Tetaitu CONROY",     role: "ELEVE",  hex: "#c084fc", basePos: [ 0,   0,  1.5] },
  { id: "el_estall",     short: "Teaki",      full: "Teaki ESTALL",       role: "ELEVE",  hex: "#818cf8", basePos: [ 1.5, 0,  1.5] },
  { id: "el_maiau",      short: "Akeval",     full: "Akeval MAIAU",       role: "ELEVE",  hex: "#38bdf8", basePos: [ 3,   0,  1.5] },
  { id: "el_temu",       short: "Tamahei",    full: "Tamahei TEMU",       role: "ELEVE",  hex: "#34d399", basePos: [ 4.5, 0,  1.5] },
  { id: "el_chang",      short: "Herman",     full: "Herman CHANG",       role: "ELEVE",  hex: "#a3e635", basePos: [-4.5, 0,  3  ] },
  { id: "el_tamu",       short: "Tevaihau",   full: "Tevaihau TAMU",      role: "ELEVE",  hex: "#fde047", basePos: [-3,   0,  3  ] },
  { id: "el_pater",      short: "Teheiani",   full: "Teheiani PATER",     role: "ELEVE",  hex: "#fdba74", basePos: [-1.5, 0,  3  ] },
  { id: "el_labeaume",   short: "Timothée",   full: "Timothée LABEAUME",  role: "ELEVE",  hex: "#f9a8d4", basePos: [ 0,   0,  3  ] },
  { id: "el_hauata",     short: "Maarau",     full: "Maarau HAUATA",      role: "ELEVE",  hex: "#86efac", basePos: [ 1.5, 0,  3  ] },
  { id: "el_monnier",    short: "Tohaumoana", full: "Tohaumoana M.",       role: "ELEVE",  hex: "#7dd3fc", basePos: [ 3,   0,  3  ] },
  { id: "el_triponel",   short: "Ewen",       full: "Ewen TRIPONEL",      role: "ELEVE",  hex: "#c4b5fd", basePos: [ 4.5, 0,  3  ] },
  { id: "el_fareea",     short: "Bonno",      full: "Bonno FAREEA",       role: "ELEVE",  hex: "#a78bfa", basePos: [-3,   0,  4.5] },
  { id: "el_sandford",   short: "Manuarii",   full: "Manuarii SANDFORD",  role: "PILOTE", hex: "#6ee7b7", basePos: [ 0,   0,  4.5] },
  { id: "el_chang2",     short: "Charline",   full: "Charline JOLLIEN",   role: "ELEVE",  hex: "#fca5a5", basePos: [ 3,   0,  4.5] },
];

function getChar(id: string) { return CHARS.find(c => c.id === id); }

// ─── Scénarios ────────────────────────────────────────────────────────────────

const SCENARIOS: Scenario[] = [
  {
    id: "briefing", label: "Briefing du matin", sublabel: "06h30 — tout le monde se lève",
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
    id: "debriefing", label: "Débriefing piste", sublabel: "Aurélie + Florian — retour F-ORVZ",
    beats: [
      { characterId: "fi_florian",  type: "system", text: "Retour F-ORVZ — 08h15 — Phase PP" },
      { characterId: "fi_florian",  type: "dialog", text: "Aurélie, pose-toi. Debriefing à chaud.", targetId: "el_charuel" },
      { characterId: "el_charuel",  type: "dialog", text: "Je me suis sentie bien. Sauf le 3e tour — assiette trop cabrée à l'arrondi.", targetId: "fi_florian" },
      { characterId: "fi_florian",  type: "dialog", text: "La vitesse seuil c'était combien ?", targetId: "el_charuel" },
      { characterId: "el_charuel",  type: "dialog", text: "J'avais 80kt. Vref sur le Tecnam c'est 70.", targetId: "fi_florian" },
      { characterId: "fi_florian",  type: "dialog", text: "10kt de trop. Ça rallonge l'atterro de 150m. On rejoue ça sur le whiteboard.", targetId: "el_charuel" },
      { characterId: "el_iannaci",  type: "action", text: "passe avec son café, tend l'oreille" },
      { characterId: "fi_florian",  type: "dialog", text: "Daniele reste — même défaut dans tes comptes-rendus.", targetId: "el_iannaci" },
      { characterId: "el_charuel",  type: "dialog", text: "Pour la radio — j'ai appelé tour au lieu de sol.", targetId: "fi_florian" },
      { characterId: "fi_florian",  type: "dialog", text: "La radio se prépare avant l'action. Elle est dans ta checklist — tu la lis ou tu la récites ?", targetId: "el_charuel" },
      { characterId: "el_charuel",  type: "dialog", text: "...Je la récitais.", targetId: "fi_florian" },
      { characterId: "fi_florian",  type: "dialog", text: "On la lit. Toujours.", targetId: "el_charuel" },
    ],
  },
  {
    id: "sansvol", label: "Sans vol depuis longtemps", sublabel: "Ranitea 29j · Viriamu 18j · Teaki 20j",
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
    id: "bases", label: "Rappels élémentaires", sublabel: "Didier — carnets, CR, NOTAMs",
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
    id: "findejournee", label: "Fin de journée", sublabel: "17h00 — retours de vols",
    beats: [
      { characterId: "fi_didier",   type: "system", text: "17h00 — Fin des vols du jour" },
      { characterId: "el_triponel", type: "dialog", text: "Chef, j'ai fait mon premier virage à 45° tout seul. Arnaud a rien touché !", targetId: "fi_arnaud" },
      { characterId: "fi_arnaud",   type: "dialog", text: "Exact. Tu regardais dehors au lieu de fixer les instruments — c'est le bon réflexe.", targetId: "el_triponel" },
      { characterId: "el_chang",    type: "dialog", text: "Moi sur le simu j'ai foiré la panne moteur. Deux fois.", targetId: "fi_vincent" },
      { characterId: "fi_vincent",  type: "dialog", text: "Herman — les foirages sur simu c'est ce qu'on cherche. T'as compris pourquoi ?", targetId: "el_chang" },
      { characterId: "el_chang",    type: "dialog", text: "J'ai voulu recaler moteur au lieu de poser droit devant. Réflexe faux.", targetId: "fi_vincent" },
      { characterId: "fi_vincent",  type: "dialog", text: "Exactement. En dessous de 200ft on pose. Point.", targetId: "el_chang" },
      { characterId: "fi_pascal",   type: "dialog", text: "Beau travail tout le monde. F-ONCF revient lundi. Bon repos." },
      { characterId: "el_charuel",  type: "dialog", text: "Ia ora na à tous !" },
    ],
  },
];

// ─── Composants 3D ────────────────────────────────────────────────────────────

function Room() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[16, 12]} />
        <meshLambertMaterial color="#1e293b" />
      </mesh>
      <gridHelper args={[16, 16, "#334155", "#1e3a5f"]} />

      {/* Murs */}
      <mesh position={[0, 2, -6]}>
        <boxGeometry args={[16, 4, 0.15]} />
        <meshLambertMaterial color="#0f172a" />
      </mesh>
      <mesh position={[-8, 2, 0]}>
        <boxGeometry args={[0.15, 4, 12]} />
        <meshLambertMaterial color="#0f172a" />
      </mesh>
      <mesh position={[8, 2, 0]}>
        <boxGeometry args={[0.15, 4, 12]} />
        <meshLambertMaterial color="#0f172a" />
      </mesh>

      {/* Tableau blanc */}
      <mesh position={[-3, 1.8, -5.9]}>
        <boxGeometry args={[3, 1.6, 0.08]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>
      <Text position={[-3, 1.8, -5.8]} fontSize={0.14} color="#1e293b" anchorX="center" anchorY="middle" maxWidth={2.6}>
        {"BRIEFING C3P\nQNH 1012 · Vent 080/08kt\nF-ONCF MAINT."}
      </Text>

      {/* Table briefing */}
      <mesh position={[0, 0.42, -1.2]} castShadow>
        <boxGeometry args={[5.5, 0.1, 1.6]} />
        <meshStandardMaterial color="#1e3a5f" />
      </mesh>

      {/* Canapé */}
      <mesh position={[5, 0.3, 4]} castShadow>
        <boxGeometry args={[2.5, 0.5, 1]} />
        <meshStandardMaterial color="#1e3a5f" />
      </mesh>
      <mesh position={[5, 0.7, 4.5]}>
        <boxGeometry args={[2.5, 0.6, 0.12]} />
        <meshStandardMaterial color="#1e3a5f" />
      </mesh>

      {/* Bureau radio */}
      <mesh position={[6, 0.45, -3]}>
        <boxGeometry args={[2, 0.08, 1]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      {[-0.4, 0.4].map((x, i) => (
        <mesh key={i} position={[6 + x, 0.9, -3.3]}>
          <boxGeometry args={[0.6, 0.5, 0.04]} />
          <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.5} />
        </mesh>
      ))}

      {/* Lumières */}
      {[[-3, 3.8, -2], [3, 3.8, -2], [0, 3.8, 2], [0, 3.8, 4.5]].map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh>
            <boxGeometry args={[0.8, 0.06, 0.2]} />
            <meshStandardMaterial color="#e2e8f0" emissive="#e2e8f0" emissiveIntensity={0.9} />
          </mesh>
          <pointLight intensity={10} distance={7} color="#f8fafc" />
        </group>
      ))}
    </group>
  );
}

// Un seul composant Character, 100% WebGL, zéro Html
function Character({ def, speakerId, targetId }: {
  def: CharDef;
  speakerId: string;
  targetId: string;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const bodyRef = useRef<THREE.Mesh>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);

  const isSpeaker = def.id === speakerId;
  const isTarget  = def.id === targetId;
  const active    = isSpeaker || isTarget;

  const baseVec = useMemo(() => new THREE.Vector3(...def.basePos), [def.basePos]);
  const talkVec = useMemo(() => {
    const dir = new THREE.Vector3(-def.basePos[0], 0, -def.basePos[2]).normalize().multiplyScalar(0.8);
    return new THREE.Vector3(def.basePos[0] + dir.x, 0, def.basePos[2] + dir.z);
  }, [def.basePos]);

  const phase = useRef(Math.random() * Math.PI * 2);
  const walkPhase = useRef(0);
  const curPos = useRef(new THREE.Vector3(...def.basePos));

  useFrame((_, dt) => {
    if (!groupRef.current) return;
    const target = active ? talkVec : baseVec;
    const moving = curPos.current.distanceTo(target) > 0.05;
    curPos.current.lerp(target, Math.min(1, dt * 5));

    if (moving) {
      walkPhase.current += dt * 10;
      groupRef.current.position.set(curPos.current.x, Math.abs(Math.sin(walkPhase.current)) * 0.07, curPos.current.z);
    } else {
      phase.current += dt * (isSpeaker ? 4 : 1.5);
      groupRef.current.position.set(curPos.current.x, Math.sin(phase.current) * (isSpeaker ? 0.05 : 0.015), curPos.current.z);
    }

    if (bodyRef.current) {
      const s = isSpeaker ? 1.08 : 1.0;
      bodyRef.current.scale.setScalar(THREE.MathUtils.lerp(bodyRef.current.scale.x, s, dt * 8));
    }
    if (ringRef.current) {
      ringRef.current.rotation.y += dt * 2;
      const op = (ringRef.current.material as THREE.MeshStandardMaterial);
      op.opacity = THREE.MathUtils.lerp(op.opacity, isSpeaker ? 1 : 0, dt * 6);
    }
  });

  const color = new THREE.Color(def.hex);

  return (
    <group ref={groupRef} position={def.basePos}>
      {/* Corps */}
      <mesh ref={bodyRef} position={[0, 0.48, 0]} castShadow>
        <capsuleGeometry args={[0.17, 0.4, 4, 8]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      {/* Tête */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <sphereGeometry args={[0.21, 10, 8]} />
        <meshStandardMaterial color={color} roughness={0.4} />
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
          <meshStandardMaterial color={def.hex} emissive={def.hex} emissiveIntensity={0.9} />
        </mesh>
      )}

      {/* Anneau "en train de parler" */}
      <mesh ref={ringRef} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.28, 0.36, 24]} />
        <meshStandardMaterial color={def.hex} emissive={def.hex} emissiveIntensity={1} transparent opacity={0} />
      </mesh>

      {/* Prénom (Text WebGL — pas de Html) */}
      <Text
        position={[0, 1.55, 0]}
        fontSize={0.18}
        color={def.hex}
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.02}
        outlineColor="#0f172a"
      >
        {def.short}
      </Text>
    </group>
  );
}

// Scène globale
function Scene({ speakerId, targetId }: { speakerId: string; targetId: string }) {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 8, 4]} intensity={0.7} castShadow />
      <Room />
      {CHARS.map(c => (
        <Character key={c.id} def={c} speakerId={speakerId} targetId={targetId} />
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

  const DELAY = { 1: 2800, 2: 1400, 3: 650 }[speed];

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
          clearInterval(timer.current!);
          return i;
        }
        return i + 1;
      });
    }, DELAY);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [playing, scenario, DELAY]);

  const beat = beatIdx >= 0 ? scenario.beats[beatIdx] : null;
  const char = beat ? getChar(beat.characterId) : null;
  const done = beatIdx >= scenario.beats.length - 1;

  const speakerId = beat?.characterId ?? "";
  const targetId  = beat?.targetId ?? "";

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl text-foreground flex items-center gap-3">
            <Radio className="w-7 h-7 text-primary" />
            Salle des Ops — 3D
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">C3P · Faa'a · 25 juin 2026 · Dialogues fictifs</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/30">Halo doré = Instructeur</Badge>
          <Badge variant="outline" className="text-[10px] text-muted-foreground">Anneau brillant = parle</Badge>
        </div>
      </div>

      {/* Boutons scénarios */}
      <div className="flex gap-2 flex-wrap">
        {SCENARIOS.map(s => (
          <button
            key={s.id}
            onClick={() => loadScenario(s)}
            className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all text-left ${
              scenario.id === s.id
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            <span className="block font-semibold">{s.label}</span>
            <span className="block text-[10px] opacity-60">{s.sublabel}</span>
          </button>
        ))}
      </div>

      {/* Canvas 3D */}
      <div className="relative rounded-xl overflow-hidden border border-border bg-[#0a1628]" style={{ height: 520 }}>
        <Canvas shadows dpr={[1, 1.5]} gl={{ antialias: true, powerPreference: "high-performance" }}>
          <PerspectiveCamera makeDefault position={[0, 11, 11]} fov={44} />
          <OrbitControls target={[0, 0, 0]} enablePan={false} minDistance={8} maxDistance={22} minPolarAngle={Math.PI/6} maxPolarAngle={Math.PI/2.2} />
          <Suspense fallback={null}>
            <Scene speakerId={speakerId} targetId={targetId} />
          </Suspense>
        </Canvas>

        {/* Contrôles */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <div className="flex gap-0.5 bg-black/60 backdrop-blur rounded-md border border-white/10 p-0.5">
            {([1, 2, 3] as const).map(v => (
              <button key={v} onClick={() => setSpeed(v)}
                className={`px-2 py-1 text-xs rounded transition-colors ${speed === v ? "bg-primary text-white" : "text-white/50 hover:text-white"}`}>
                {v === 1 ? "×1" : v === 2 ? "×2" : "×4"}
              </button>
            ))}
          </div>
          <Button size="sm" variant={playing ? "outline" : "default"} className="h-7 text-xs gap-1 bg-black/60 backdrop-blur border-white/20 text-white hover:bg-black/80"
            onClick={() => {
              if (done) { setBeatIdx(-1); setPlaying(true); }
              else if (playing) setPlaying(false);
              else { if (beatIdx < 0) setBeatIdx(0); setPlaying(true); }
            }}>
            {done ? <><RotateCcw className="w-3 h-3" />Rejouer</> :
             playing ? <><Pause className="w-3 h-3" />Pause</> :
             <><Play className="w-3 h-3" />{beatIdx < 0 ? "Lancer" : "Reprendre"}</>}
          </Button>
        </div>

        {beatIdx >= 0 && (
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur border border-white/10 rounded-md px-2 py-1 text-xs text-white/60">
            {beatIdx + 1} / {scenario.beats.length}
          </div>
        )}

        {beatIdx < 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/60 backdrop-blur border border-white/10 rounded-xl px-6 py-4 text-center text-white">
              <p className="text-sm font-semibold">Choisis un scénario → Lancer</p>
              <p className="text-xs mt-1 opacity-50">Clic + glisser pour orbiter · Scroll pour zoomer</p>
            </div>
          </div>
        )}
      </div>

      {/* Message courant */}
      {beat && char && beat.type !== "system" && (
        <div className="rounded-xl border p-4 flex items-start gap-3 transition-all duration-300"
          style={{ borderColor: char.hex + "55", background: char.hex + "0d" }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
            style={{ background: char.hex }}>
            {char.short[0]}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: char.hex }}>
              {char.full}
              <span className="ml-2 text-[10px] font-normal text-muted-foreground uppercase tracking-wider">
                {char.role === "FI" ? "Instructeur" : char.role === "PILOTE" ? "Pilote" : "Élève"}
                {beat.type === "atis" ? " · METAR" : beat.type === "radio" ? " · Radio" : ""}
              </span>
            </p>
            <p className={`text-sm mt-0.5 ${beat.type === "action" ? "italic text-muted-foreground" : "text-foreground"}`}>
              {beat.type === "action" ? `*${beat.text}*` : beat.text}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
