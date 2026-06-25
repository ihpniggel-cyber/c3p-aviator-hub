import { useRef, useState, useEffect, useMemo, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls, PerspectiveCamera, Text } from "@react-three/drei";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Radio, RotateCcw, Play, Pause, FastForward } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CharDef {
  id: string;
  short: string;   // prénom seul
  full: string;    // prénom + nom
  role: "FI" | "ELEVE" | "PILOTE";
  hex: string;     // couleur Three.js
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

// ─── Données ──────────────────────────────────────────────────────────────────

const CHARS: CharDef[] = [
  // Instructeurs — rangée arrière / zone whiteboard
  { id: "fi_pascal",    short: "Pascal",    full: "Pascal NIGGEL",    role: "FI",    hex: "#f59e0b", basePos: [-3.5, 0, -3.2] },
  { id: "fi_frederic",  short: "Frédéric",  full: "Frédéric AXUS",    role: "FI",    hex: "#f97316", basePos: [-2.5, 0, -3.2] },
  { id: "fi_arnaud",    short: "Arnaud",    full: "Arnaud BOULANGER", role: "FI",    hex: "#ef4444", basePos: [-1.5, 0, -3.2] },
  { id: "fi_didier",    short: "Didier",    full: "Didier JUERY",     role: "FI",    hex: "#f43f5e", basePos: [-0.5, 0, -3.2] },
  { id: "fi_jeanyves",  short: "Jean-Yves", full: "Jean-Yves MARTINO",role: "FI",    hex: "#ec4899", basePos: [ 0.5, 0, -3.2] },
  { id: "fi_florian",   short: "Florian",   full: "Florian REYREAU",  role: "FI",    hex: "#d946ef", basePos: [ 1.5, 0, -3.2] },
  { id: "fi_vincent",   short: "Vincent",   full: "Vincent ROUX",     role: "FI",    hex: "#8b5cf6", basePos: [ 2.5, 0, -3.2] },
  { id: "fi_philippe",  short: "Philippe",  full: "Philippe TAPETA",  role: "FI",    hex: "#3b82f6", basePos: [ 3.5, 0, -3.2] },
  { id: "fi_manahere",  short: "Manahere",  full: "Manahere TEHEIURA",role: "FI",    hex: "#06b6d4", basePos: [ 4.5, 0, -3.2] },
  // Élèves — zones table et canapé
  { id: "el_charuel",   short: "Aurélie",   full: "Aurélie CHARUEL",  role: "PILOTE",hex: "#10b981", basePos: [-4,   0,  0  ] },
  { id: "el_carpi",     short: "Patrice",   full: "Patrice CARPI",    role: "ELEVE", hex: "#0ea5e9", basePos: [-3,   0,  0  ] },
  { id: "el_nouveau",   short: "Teariki",   full: "Teariki NOUVEAU",  role: "PILOTE",hex: "#14b8a6", basePos: [-2,   0,  0  ] },
  { id: "el_iannaci",   short: "Daniele",   full: "Daniele IANNACI",  role: "PILOTE",hex: "#22c55e", basePos: [-1,   0,  0  ] },
  { id: "el_vaiho",     short: "Viriamu",   full: "Viriamu VAIHO",    role: "ELEVE", hex: "#84cc16", basePos: [ 0,   0,  0  ] },
  { id: "el_chant",     short: "Ranitea",   full: "Ranitea CHANT",    role: "ELEVE", hex: "#fbbf24", basePos: [ 1,   0,  0  ] },
  { id: "el_tuihani",   short: "Teihotu",   full: "Teihotu TUIHANI",  role: "PILOTE",hex: "#fb923c", basePos: [ 2,   0,  0  ] },
  { id: "el_lardillier",short: "Keanee",    full: "Keanee LARDILLIER",role: "ELEVE", hex: "#f87171", basePos: [ 3,   0,  0  ] },
  { id: "el_conroy",    short: "Tetaitu",   full: "Tetaitu CONROY",   role: "ELEVE", hex: "#c084fc", basePos: [ 4,   0,  0  ] },
  { id: "el_estall",    short: "Teaki",     full: "Teaki ESTALL",     role: "ELEVE", hex: "#818cf8", basePos: [-3,   0,  2  ] },
  { id: "el_maiau",     short: "Akeval",    full: "Akeval MAIAU",     role: "ELEVE", hex: "#38bdf8", basePos: [-2,   0,  2  ] },
  { id: "el_temu",      short: "Tamahei",   full: "Tamahei TEMU",     role: "ELEVE", hex: "#34d399", basePos: [-1,   0,  2  ] },
  { id: "el_chang",     short: "Herman",    full: "Herman CHANG",     role: "ELEVE", hex: "#a3e635", basePos: [ 0,   0,  2  ] },
  { id: "el_tamu",      short: "Tevaihau",  full: "Tevaihau TAMU",    role: "ELEVE", hex: "#fde047", basePos: [ 1,   0,  2  ] },
  { id: "el_pater",     short: "Teheiani",  full: "Teheiani PATER",   role: "ELEVE", hex: "#fdba74", basePos: [ 2,   0,  2  ] },
  { id: "el_labeaume",  short: "Timothée",  full: "Timothée LABEAUME",role: "ELEVE", hex: "#f9a8d4", basePos: [ 3,   0,  2  ] },
  { id: "el_hauata",    short: "Maarau",    full: "Maarau HAUATA",    role: "ELEVE", hex: "#86efac", basePos: [-4,   0,  2  ] },
  { id: "el_monnier",   short: "Tohaumoana",full: "Tohaumoana MONNIER",role:"ELEVE", hex: "#7dd3fc", basePos: [ 4,   0,  2  ] },
  { id: "el_triponel",  short: "Ewen",      full: "Ewen TRIPONEL",    role: "ELEVE", hex: "#c4b5fd", basePos: [-2,   0,  3.5] },
  { id: "el_chang2",    short: "Charline",  full: "Charline JOLLIEN", role: "ELEVE", hex: "#fca5a5", basePos: [ 2,   0,  3.5] },
  { id: "el_sandford",  short: "Manuarii",  full: "Manuarii SANDFORD",role: "PILOTE",hex: "#6ee7b7", basePos: [ 0,   0,  3.5] },
  { id: "el_fareea",    short: "Bonno",     full: "Bonno FAREEA",     role: "ELEVE", hex: "#a78bfa", basePos: [ 4,   0,  1  ] },
];

function getChar(id: string): CharDef | undefined {
  return CHARS.find((c) => c.id === id);
}

// ─── Scénarios (beats) ────────────────────────────────────────────────────────

const SCENARIOS: Scenario[] = [
  {
    id: "briefing",
    label: "Briefing du matin",
    sublabel: "06h30 — tout le monde se lève",
    beats: [
      { characterId: "fi_didier",   type: "system", text: "Salle des ops — Jeudi 25 juin — 06h30" },
      { characterId: "fi_didier",   type: "atis",   text: "METAR NTAA: vent 080/08kt — vis 10km — QNH 1012 — NOSIG" },
      { characterId: "fi_didier",   type: "dialog", text: "F-ONCF reste clouée — maintenance. On absorbe sur F-ORVZ, F-ONCD et F-OIQZ.", targetId: "fi_philippe" },
      { characterId: "fi_philippe", type: "dialog", text: "Reçu. J'ai Keanee à 07h, Manea à midi, Bonno sur F-OIQZ l'après-midi. Chargé mais faisable.", targetId: "fi_didier" },
      { characterId: "fi_florian",  type: "dialog", text: "Moi j'ai Aurélie tôt sur F-ORVZ, puis Daniele sur F-OIQZ.", targetId: "fi_didier" },
      { characterId: "el_charuel",  type: "dialog", text: "J'ai fait mon brief météo et les NOTAMs. NOTAM actif sur fréquence Papeete 06h-07h.", targetId: "fi_florian" },
      { characterId: "fi_florian",  type: "dialog", text: "Parfait Aurélie. On décolle à 06h20 alors.", targetId: "el_charuel" },
      { characterId: "fi_frederic", type: "dialog", text: "J'ai Tevaihau et Teheiani en salle de cours toute la matinée — théorie navigation.", targetId: "fi_didier" },
      { characterId: "el_tamu",     type: "dialog", text: "Chef, question — on fait quoi si on finit la théorie avant midi ?", targetId: "fi_frederic" },
      { characterId: "fi_frederic", type: "dialog", text: "Vous passerez l'examen blanc que j'ai préparé.", targetId: "el_tamu" },
      { characterId: "el_pater",    type: "action", text: "pousse un léger soupir" },
      { characterId: "fi_didier",   type: "dialog", text: "Teaki, Akeval, Herman — simulateur ce matin. Revoyez vos procédures pannes moteur avant.", targetId: "fi_vincent" },
      { characterId: "el_estall",   type: "dialog", text: "Reçu. J'ai relu hier soir.", targetId: "fi_didier" },
      { characterId: "el_maiau",    type: "dialog", text: "Moi aussi... presque.", targetId: "fi_vincent" },
      { characterId: "fi_vincent",  type: "dialog", text: "Akeval — 'presque' c'est pas une réponse valide pour une panne moteur.", targetId: "el_maiau" },
    ],
  },
  {
    id: "debriefing",
    label: "Débriefing piste",
    sublabel: "Aurélie + Florian — retour F-ORVZ",
    beats: [
      { characterId: "fi_florian",  type: "system", text: "Retour F-ORVZ — 08h15 — Phase PP" },
      { characterId: "fi_florian",  type: "dialog", text: "Aurélie, pose-toi. Debriefing à chaud.", targetId: "el_charuel" },
      { characterId: "el_charuel",  type: "dialog", text: "Je me suis sentie bien. Sauf le 3e tour — j'ai rattrapé une assiette trop cabrée à l'arrondi.", targetId: "fi_florian" },
      { characterId: "fi_florian",  type: "dialog", text: "Tu t'en es aperçue toi-même — c'est bon signe. La vitesse seuil c'était combien ?", targetId: "el_charuel" },
      { characterId: "el_charuel",  type: "dialog", text: "J'avais 80kt. Vref sur le Tecnam c'est 70.", targetId: "fi_florian" },
      { characterId: "fi_florian",  type: "dialog", text: "10kt de trop. Sur piste courte ici ça rallonge l'atterro de 150m. On va rejouer ça sur le whiteboard.", targetId: "el_charuel" },
      { characterId: "el_iannaci",  type: "action", text: "passe avec son café, tend l'oreille au debriefing" },
      { characterId: "fi_florian",  type: "dialog", text: "Daniele tu peux rester — ça te concerne aussi, même défaut dans tes comptes-rendus.", targetId: "el_iannaci" },
      { characterId: "el_iannaci",  type: "dialog", text: "Je savais même pas que j'avais ce défaut.", targetId: "fi_florian" },
      { characterId: "fi_florian",  type: "dialog", text: "C'est exactement pour ça que t'es là. Assieds-toi.", targetId: "el_iannaci" },
      { characterId: "el_charuel",  type: "dialog", text: "Pour la radio — j'ai appelé tour au lieu de sol. J'ai mélangé les fréquences.", targetId: "fi_florian" },
      { characterId: "fi_florian",  type: "dialog", text: "La radio ça se prépare avant l'action, pas pendant. Elle est dans ta checklist — tu la lis ou tu la récites ?", targetId: "el_charuel" },
      { characterId: "el_charuel",  type: "dialog", text: "...Je la récitais.", targetId: "fi_florian" },
      { characterId: "fi_florian",  type: "dialog", text: "On la lit. Toujours. Même après 50 heures.", targetId: "el_charuel" },
    ],
  },
  {
    id: "sansvol",
    label: "Trop longtemps sans voler",
    sublabel: "Ranitea 29j · Viriamu 18j · Teaki 20j",
    beats: [
      { characterId: "fi_pascal",   type: "system", text: "Coin canapé — 09h00" },
      { characterId: "el_chant",    type: "dialog", text: "Pascal, ça fait 29 jours que j'ai pas volé. Je vais perdre tout ce que j'avais acquis.", targetId: "fi_pascal" },
      { characterId: "fi_pascal",   type: "dialog", text: "29 jours c'est significatif. T'as révisé tes points clés de phase depuis ?", targetId: "el_chant" },
      { characterId: "el_chant",    type: "dialog", text: "J'ai relu la théorie oui. Mais la théorie c'est pas le cockpit.", targetId: "fi_pascal" },
      { characterId: "fi_pascal",   type: "dialog", text: "Non. Mais c'est mieux que rien. On se cale un vol de remise en condition — biplace, je reprends les bases avec toi.", targetId: "el_chant" },
      { characterId: "el_vaiho",    type: "dialog", text: "Moi c'est 18 jours. Mes quarts aux Armées — impossible de prévoir.", targetId: "fi_pascal" },
      { characterId: "fi_pascal",   type: "dialog", text: "Viriamu, t'as un tour de contrôle FI prévu avant le prochain solo. J'ai mis ça dans le planning du 9 juillet.", targetId: "el_vaiho" },
      { characterId: "el_vaiho",    type: "dialog", text: "Le 9 juillet c'est bon pour moi. Merci chef.", targetId: "fi_pascal" },
      { characterId: "el_estall",   type: "dialog", text: "20 jours pour moi. Sur simu aujourd'hui — c'est frustrant.", targetId: "fi_didier" },
      { characterId: "fi_didier",   type: "dialog", text: "Teaki — le simu c'est pas 'mieux que rien'. Les pannes moteur qu'on fait, tu peux pas les faire en vrai.", targetId: "el_estall" },
      { characterId: "el_chant",    type: "dialog", text: "C'est quand même pénible d'être sur une île paradisiaque et de pas pouvoir voler.", targetId: "fi_pascal" },
      { characterId: "fi_pascal",   type: "dialog", text: "C'est la réalité de la formation en Polynésie. Ce qui compte c'est comment tu uses le temps entre les vols.", targetId: "el_chant" },
    ],
  },
  {
    id: "bases",
    label: "Rappels élémentaires",
    sublabel: "Didier — carnets, CR, NOTAMs",
    beats: [
      { characterId: "fi_didier",   type: "system", text: "Salle de cours — 10h00" },
      { characterId: "fi_didier",   type: "dialog", text: "J'ai passé hier soir à éplucher les carnets de vol. On a des problèmes.", targetId: undefined },
      { characterId: "el_maiau",    type: "action", text: "échange un regard inquiet avec Herman" },
      { characterId: "fi_didier",   type: "dialog", text: "Akeval — ton carnet a un vol non signé du 14 juin. Tohaumoana — F-OIQA sur un vol fait en F-OIQZ. C'est pas la même immat.", targetId: "el_monnier" },
      { characterId: "el_monnier",  type: "dialog", text: "Je me suis trompé de lettre...", targetId: "fi_didier" },
      { characterId: "fi_didier",   type: "dialog", text: "L'immatriculation c'est le premier truc que tu lis avant de voler. C'est un document légal.", targetId: "el_monnier" },
      { characterId: "fi_didier",   type: "dialog", text: "Comptes-rendus de vol. Je veux un CR écrit dans les 24h. Pas une semaine après.", targetId: undefined },
      { characterId: "el_hauata",   type: "dialog", text: "Chef, j'arrive pas bien à exprimer ce qui s'est passé en vol.", targetId: "fi_didier" },
      { characterId: "fi_didier",   type: "dialog", text: "C'est exactement pour ça qu'on les écrit Maarau. Une phrase par manœuvre : ce que t'as fait, ce qui t'a surpris, ce que tu referais.", targetId: "el_hauata" },
      { characterId: "fi_didier",   type: "dialog", text: "Et les NOTAMs font partie du brief. Toujours. Même par ciel bleu.", targetId: undefined },
      { characterId: "el_fareea",   type: "dialog", text: "Y'a des NOTAMs importants aujourd'hui ?", targetId: "fi_didier" },
      { characterId: "fi_didier",   type: "dialog", text: "Bonno — c'est toi qui dois me le dire. T'aurais dû les consulter avant de venir.", targetId: "el_fareea" },
    ],
  },
  {
    id: "findejournee",
    label: "Fin de journée",
    sublabel: "17h00 — retours de vols",
    beats: [
      { characterId: "fi_didier",   type: "system", text: "Salle des ops — 17h00 — Fin des vols" },
      { characterId: "el_triponel", type: "dialog", text: "Chef, j'ai fait mon premier virage incliné à 45° tout seul. Arnaud était là mais il a rien touché.", targetId: "fi_arnaud" },
      { characterId: "fi_arnaud",   type: "dialog", text: "Exact. Bien stabilisé. Tu regardais dehors au lieu de fixer les instruments — c'est le bon réflexe.", targetId: "el_triponel" },
      { characterId: "el_triponel", type: "action", text: "sourire qui s'étend jusqu'aux oreilles" },
      { characterId: "el_chang",    type: "dialog", text: "Moi sur le simu j'ai foiré la panne moteur. Deux fois.", targetId: "fi_vincent" },
      { characterId: "fi_vincent",  type: "dialog", text: "Herman — les foirages sur simu c'est ce qu'on cherche. T'as compris pourquoi ça a raté ?", targetId: "el_chang" },
      { characterId: "el_chang",    type: "dialog", text: "La deuxième fois oui — j'ai voulu recaler moteur au lieu de poser droit devant.", targetId: "fi_vincent" },
      { characterId: "fi_vincent",  type: "dialog", text: "Exactement. En dessous de 200ft on pose. Point. La répétition sur simu va ancrer ça.", targetId: "el_chang" },
      { characterId: "el_charuel",  type: "action", text: "rassemble ses affaires, sourit" },
      { characterId: "fi_pascal",   type: "dialog", text: "Beau travail tout le monde. F-ONCF revient lundi. Bon repos.", targetId: undefined },
      { characterId: "el_charuel",  type: "dialog", text: "Ia ora na à tous !", targetId: undefined },
      { characterId: "fi_didier",   type: "action", text: "rince les tasses, éteint les lumières" },
    ],
  },
];

// ─── Fonctions utilitaires ─────────────────────────────────────────────────────

// Spots de "prise de parole" : vers le centre depuis la base
function speakPos(base: [number, number, number]): [number, number, number] {
  const dir = new THREE.Vector3(-base[0], 0, -base[2]).normalize().multiplyScalar(0.7);
  return [base[0] + dir.x, 0, base[2] + dir.z];
}

// ─── Composants 3D ────────────────────────────────────────────────────────────

/** Sol, murs, mobilier de la salle */
function Room() {
  return (
    <group>
      {/* Sol */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[14, 10]} />
        <meshLambertMaterial color="#1e293b" />
      </mesh>
      {/* Carrelage (lignes) */}
      <gridHelper args={[14, 14, "#334155", "#1e3a5f"]} position={[0, 0, 0]} />

      {/* Mur arrière */}
      <mesh position={[0, 2, -5]} receiveShadow>
        <boxGeometry args={[14, 4, 0.15]} />
        <meshLambertMaterial color="#0f172a" />
      </mesh>
      {/* Mur gauche */}
      <mesh position={[-7, 2, 0]} receiveShadow>
        <boxGeometry args={[0.15, 4, 10]} />
        <meshLambertMaterial color="#0f172a" />
      </mesh>
      {/* Mur droit (partiel — entrée) */}
      <mesh position={[7, 2, 0]} receiveShadow>
        <boxGeometry args={[0.15, 4, 10]} />
        <meshLambertMaterial color="#0f172a" />
      </mesh>

      {/* Plafond (semi-transparent) */}
      <mesh position={[0, 4, 0]}>
        <boxGeometry args={[14, 0.1, 10]} />
        <meshLambertMaterial color="#0f172a" transparent opacity={0.4} />
      </mesh>

      {/* Tableau blanc (whiteboard) */}
      <mesh position={[-4.5, 2, -4.9]} castShadow>
        <boxGeometry args={[2.5, 1.4, 0.08]} />
        <meshStandardMaterial color="#e2e8f0" emissive="#94a3b8" emissiveIntensity={0.05} />
      </mesh>
      {/* Texte whiteboard */}
      <Text position={[-4.5, 2, -4.8]} fontSize={0.16} color="#1e293b" anchorX="center" anchorY="middle" maxWidth={2.2}>
        {"BRIEFING MATIN\nQNH 1012 · Vent 080/08kt\nF-ONCF MAINT."}
      </Text>

      {/* Table de briefing centrale */}
      <mesh position={[0, 0.4, -1.5]} castShadow receiveShadow>
        <boxGeometry args={[5, 0.12, 1.8]} />
        <meshStandardMaterial color="#1e3a5f" />
      </mesh>
      {/* Pieds table */}
      {[[-2.2, -1.5], [2.2, -1.5], [-2.2, -0.6], [2.2, -0.6]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.18, z]} castShadow>
          <boxGeometry args={[0.08, 0.36, 0.08]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
      ))}

      {/* Chaises autour de la table */}
      {[-1.8, -0.9, 0, 0.9, 1.8].map((x, i) => (
        <group key={`chair-front-${i}`} position={[x, 0, -0.4]}>
          <mesh position={[0, 0.22, 0]}>
            <boxGeometry args={[0.4, 0.06, 0.4]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <mesh position={[0, 0.55, -0.17]}>
            <boxGeometry args={[0.4, 0.55, 0.05]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
        </group>
      ))}
      {[-1.8, -0.9, 0, 0.9, 1.8].map((x, i) => (
        <group key={`chair-back-${i}`} position={[x, 0, -2.6]}>
          <mesh position={[0, 0.22, 0]}>
            <boxGeometry args={[0.4, 0.06, 0.4]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <mesh position={[0, 0.55, 0.17]}>
            <boxGeometry args={[0.4, 0.55, 0.05]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
        </group>
      ))}

      {/* Canapé coin droit */}
      <mesh position={[4.5, 0.3, 3.5]} castShadow>
        <boxGeometry args={[2.5, 0.5, 0.9]} />
        <meshStandardMaterial color="#1e3a5f" />
      </mesh>
      <mesh position={[4.5, 0.65, 3.95]}>
        <boxGeometry args={[2.5, 0.55, 0.12]} />
        <meshStandardMaterial color="#1e3a5f" />
      </mesh>

      {/* Bureau radio / comms (arrière droit) */}
      <mesh position={[5.5, 0.45, -3.5]} castShadow>
        <boxGeometry args={[1.8, 0.08, 0.9]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      {/* Écrans */}
      {[-0.5, 0.5].map((x, i) => (
        <mesh key={`screen-${i}`} position={[5.5 + x, 0.85, -3.7]}>
          <boxGeometry args={[0.55, 0.45, 0.04]} />
          <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.4} />
        </mesh>
      ))}

      {/* Lumières au plafond */}
      {[[-3, 3.8, -2], [0, 3.8, -2], [3, 3.8, -2], [0, 3.8, 2]].map(([x, y, z], i) => (
        <group key={`light-${i}`} position={[x, y, z]}>
          <mesh>
            <boxGeometry args={[0.8, 0.06, 0.2]} />
            <meshStandardMaterial color="#e2e8f0" emissive="#e2e8f0" emissiveIntensity={0.8} />
          </mesh>
          <pointLight intensity={8} distance={6} color="#e2e8f0" castShadow />
        </group>
      ))}
    </group>
  );
}

/** Un personnage 3D avec animation */
function Character({
  def,
  speaking,
  speechText,
  isAction,
}: {
  def: CharDef;
  speaking: boolean;
  speechText: string;
  isAction: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const headRef = useRef<THREE.Mesh>(null!);
  const bodyRef = useRef<THREE.Mesh>(null!);

  const currentPos = useRef(new THREE.Vector3(...def.basePos));
  const targetPos = useMemo(
    () => speaking ? new THREE.Vector3(...speakPos(def.basePos)) : new THREE.Vector3(...def.basePos),
    [speaking, def.basePos]
  );

  const walkPhase = useRef(Math.random() * Math.PI * 2);
  const idlePhase = useRef(Math.random() * Math.PI * 2);
  const prevSpeaking = useRef(false);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Lerp position
    currentPos.current.lerp(targetPos, Math.min(1, delta * 4));
    groupRef.current.position.set(currentPos.current.x, 0, currentPos.current.z);

    // Walk bob (when moving)
    const dist = currentPos.current.distanceTo(targetPos);
    if (dist > 0.05) {
      walkPhase.current += delta * 8;
      groupRef.current.position.y = Math.abs(Math.sin(walkPhase.current)) * 0.08;
    } else {
      // Idle bob
      idlePhase.current += delta * (speaking ? 3 : 1.2);
      const bobAmp = speaking ? 0.04 : 0.015;
      groupRef.current.position.y = Math.sin(idlePhase.current) * bobAmp;
    }

    // Head turn when speaking
    if (headRef.current) {
      const targetRot = speaking ? Math.PI * 0.08 : 0;
      headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, targetRot, delta * 5);
    }

    // Body scale bounce when starts speaking
    if (bodyRef.current) {
      const scaleTarget = speaking ? 1.06 : 1.0;
      bodyRef.current.scale.setScalar(THREE.MathUtils.lerp(bodyRef.current.scale.x, scaleTarget, delta * 8));
    }

    prevSpeaking.current = speaking;
  });

  return (
    <group ref={groupRef} position={def.basePos}>
      {/* Corps */}
      <mesh ref={bodyRef} position={[0, 0.5, 0]} castShadow>
        <capsuleGeometry args={[0.18, 0.42, 4, 8]} />
        <meshStandardMaterial color={def.hex} roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Tête */}
      <mesh ref={headRef} position={[0, 1.08, 0]} castShadow>
        <sphereGeometry args={[0.22, 12, 10]} />
        <meshStandardMaterial color={def.hex} roughness={0.3} />
      </mesh>

      {/* Yeux */}
      {[-0.08, 0.08].map((x, i) => (
        <mesh key={i} position={[x, 1.11, 0.19]} castShadow>
          <sphereGeometry args={[0.03, 6, 6]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
      ))}

      {/* Halo FI */}
      {def.role === "FI" && (
        <mesh position={[0, 1.4, 0]}>
          <torusGeometry args={[0.26, 0.03, 8, 24]} />
          <meshStandardMaterial color={def.hex} emissive={def.hex} emissiveIntensity={0.8} />
        </mesh>
      )}

      {/* Nom */}
      <Html position={[0, 1.75, 0]} center distanceFactor={8} zIndexRange={[0, 10]}>
        <div style={{
          background: def.hex + "cc",
          color: "#fff",
          padding: "1px 5px",
          borderRadius: 4,
          fontSize: 9,
          fontWeight: 700,
          whiteSpace: "nowrap",
          letterSpacing: "0.03em",
          pointerEvents: "none",
        }}>
          {def.short}
        </div>
      </Html>

      {/* Bulle de dialogue */}
      {speaking && speechText && (
        <Html position={[0, 2.1, 0]} center distanceFactor={6} zIndexRange={[100, 200]}>
          <div style={{
            background: isAction ? "rgba(30,30,50,0.85)" : "rgba(15,23,42,0.92)",
            border: `1.5px solid ${def.hex}`,
            color: "#f1f5f9",
            padding: "5px 8px",
            borderRadius: 8,
            fontSize: 10,
            maxWidth: 160,
            lineHeight: 1.4,
            fontStyle: isAction ? "italic" : "normal",
            pointerEvents: "none",
            boxShadow: `0 0 12px ${def.hex}55`,
            whiteSpace: "pre-wrap",
            textAlign: "center",
          }}>
            {isAction ? `*${speechText}*` : speechText}
            {/* Flèche bas */}
            <div style={{
              position: "absolute",
              bottom: -6,
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: `6px solid ${def.hex}`,
            }} />
          </div>
        </Html>
      )}
    </group>
  );
}

/** Afficheur de message en overlay bas de l'écran */
function OverlayMessage({ beat, char }: { beat: Beat | null; char: CharDef | null }) {
  if (!beat || !char || beat.type === "system") return null;
  return (
    <Html fullscreen zIndexRange={[300, 400]}>
      <div style={{
        position: "absolute",
        bottom: 16,
        left: "50%",
        transform: "translateX(-50%)",
        maxWidth: 520,
        background: "rgba(15,23,42,0.92)",
        border: `1.5px solid ${char.hex}`,
        borderRadius: 10,
        padding: "8px 14px",
        color: "#f1f5f9",
        fontSize: 12,
        lineHeight: 1.5,
        boxShadow: `0 0 20px ${char.hex}44`,
        pointerEvents: "none",
        textAlign: "center",
      }}>
        <span style={{ color: char.hex, fontWeight: 700 }}>
          {char.full}
          {beat.type === "atis" ? " · METAR" : beat.type === "radio" ? " · Radio" : ""}
        </span>
        <br />
        <span style={{ fontStyle: beat.type === "action" ? "italic" : "normal" }}>
          {beat.type === "action" ? `*${beat.text}*` : beat.text}
        </span>
      </div>
    </Html>
  );
}

/** La scène 3D complète */
function Scene({
  scenario,
  beatIdx,
}: {
  scenario: Scenario;
  beatIdx: number;
}) {
  const currentBeat = scenario.beats[beatIdx] ?? null;

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 10, 5]} intensity={0.6} castShadow />

      <Room />

      {CHARS.map((c) => {
        const isSpeaker = currentBeat?.characterId === c.id;
        const isTarget = currentBeat?.targetId === c.id;
        const speaking = isSpeaker || isTarget;
        const speechText = isSpeaker ? currentBeat?.text ?? "" : "";
        const isAction = isSpeaker && currentBeat?.type === "action";

        return (
          <Character
            key={c.id}
            def={c}
            speaking={speaking}
            speechText={speechText}
            isAction={isAction}
          />
        );
      })}

      <OverlayMessage
        beat={currentBeat}
        char={currentBeat ? (getChar(currentBeat.characterId) ?? null) : null}
      />
    </>
  );
}

// ─── Page principale ───────────────────────────────────────────────────────────

export default function OpsRoom3D() {
  const [scenario, setScenario] = useState<Scenario>(SCENARIOS[0]);
  const [beatIdx, setBeatIdx] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<1 | 2 | 3>(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const DELAY = { 1: 2800, 2: 1400, 3: 600 }[speed];

  function loadScenario(s: Scenario) {
    setScenario(s);
    setBeatIdx(-1);
    setPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  useEffect(() => {
    if (!playing) { if (timerRef.current) clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => {
      setBeatIdx((i) => {
        if (i + 1 >= scenario.beats.length) {
          setPlaying(false);
          clearInterval(timerRef.current!);
          return i;
        }
        return i + 1;
      });
    }, DELAY);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [playing, scenario, DELAY]);

  const done = beatIdx >= scenario.beats.length - 1;
  const currentBeat = beatIdx >= 0 ? scenario.beats[beatIdx] : null;
  const currentChar = currentBeat ? getChar(currentBeat.characterId) : null;

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl text-foreground flex items-center gap-3">
            <Radio className="w-7 h-7 text-primary" />
            Salle des Ops — 3D
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            C3P · Faa'a · 25 juin 2026 · Simulation fictive
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-[10px] text-muted-foreground">
            {CHARS.length} personnages · {scenario.beats.length} échanges
          </Badge>
          <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/30">
            Halo = Instructeur
          </Badge>
        </div>
      </div>

      {/* Scénarios */}
      <div className="flex gap-2 flex-wrap">
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            onClick={() => loadScenario(s)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              scenario.id === s.id
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {s.label}
            <span className="block text-[10px] font-normal opacity-60">{s.sublabel}</span>
          </button>
        ))}
      </div>

      {/* Canvas 3D */}
      <div className="relative rounded-xl overflow-hidden border border-border" style={{ height: 560 }}>
        <Canvas shadows gl={{ antialias: true }}>
          <PerspectiveCamera makeDefault position={[0, 11, 10]} fov={42} />
          <OrbitControls
            target={[0, 0, 0]}
            enablePan={false}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.2}
            minDistance={8}
            maxDistance={22}
          />
          <Suspense fallback={null}>
            <Scene scenario={scenario} beatIdx={beatIdx} />
          </Suspense>
        </Canvas>

        {/* Contrôles overlay */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          {/* Vitesse */}
          <div className="flex gap-0.5 bg-background/80 backdrop-blur rounded-md border border-border p-0.5">
            {([1, 2, 3] as const).map((v) => (
              <button
                key={v}
                onClick={() => setSpeed(v)}
                className={`px-2 py-1 text-xs rounded transition-colors ${speed === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {v === 1 ? "×1" : v === 2 ? "×2" : "×4"}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            variant={playing ? "outline" : "default"}
            className="h-7 text-xs gap-1 backdrop-blur bg-background/80"
            onClick={() => {
              if (done) { setBeatIdx(-1); setPlaying(true); }
              else if (playing) setPlaying(false);
              else { if (beatIdx < 0) setBeatIdx(0); setPlaying(true); }
            }}
          >
            {done ? <><RotateCcw className="w-3 h-3" /> Rejouer</> :
             playing ? <><Pause className="w-3 h-3" /> Pause</> :
             beatIdx < 0 ? <><Play className="w-3 h-3" /> Lancer</> :
             <><Play className="w-3 h-3" /> Reprendre</>}
          </Button>
        </div>

        {/* Indicateur beat */}
        {beatIdx >= 0 && (
          <div className="absolute top-3 left-3 bg-background/80 backdrop-blur border border-border rounded-md px-2 py-1 text-xs text-muted-foreground">
            {beatIdx + 1} / {scenario.beats.length}
          </div>
        )}

        {/* Hint orbite */}
        <div className="absolute bottom-3 right-3 text-[10px] text-muted-foreground/60 pointer-events-none">
          Clic + glisser pour orbiter · Scroll pour zoomer
        </div>

        {/* Idle state */}
        {beatIdx < 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-muted-foreground bg-background/60 backdrop-blur rounded-xl px-6 py-4 border border-border">
              <p className="text-sm font-medium">Sélectionne un scénario</p>
              <p className="text-xs mt-1">puis clique Lancer pour animer la salle</p>
            </div>
          </div>
        )}
      </div>

      {/* Feed texte actuel */}
      {currentBeat && currentChar && (
        <div
          className="rounded-xl border p-4 flex items-start gap-3 transition-all"
          style={{ borderColor: currentChar.hex + "55", background: currentChar.hex + "0a" }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: currentChar.hex }}
          >
            {currentChar.short[0]}
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: currentChar.hex }}>
              {currentChar.full}
              <span className="ml-2 text-[10px] font-normal text-muted-foreground uppercase tracking-wider">
                {currentChar.role === "FI" ? "Instructeur" : currentChar.role === "PILOTE" ? "Pilote" : "Élève"}
              </span>
            </p>
            <p className={`text-sm mt-0.5 ${currentBeat.type === "action" ? "italic text-muted-foreground" : "text-foreground"}`}>
              {currentBeat.type === "action" ? `*${currentBeat.text}*` : currentBeat.text}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
