import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plane, Radio, Clock, AlertTriangle, Coffee, Users,
  Wrench, BookOpen, ChevronDown, Wind,
} from "lucide-react";

// ─── NOTE ─────────────────────────────────────────────────────────────────────
// Les personnages sont des membres réels de C3P.
// Les dialogues sont 100 % fictifs et illustratifs — simulation pédagogique.
// ─────────────────────────────────────────────────────────────────────────────

type Role = "FI" | "ELEVE" | "PILOTE";

interface Character {
  id: string;
  firstName: string;
  lastName: string;
  role: Role;
  /** Niveau / remarque courte */
  level?: string;
  /** Jours depuis le dernier vol (null = non renseigné) */
  daysSinceLastFlight?: number | null;
  color: string;
  /** Avion affecté aujourd'hui */
  aircraft?: string;
}

interface Message {
  id: string;
  characterId: string;
  text: string;
  timestamp: Date;
  type: "dialog" | "action" | "system" | "radio" | "atis";
  targetId?: string;
}

interface Scenario {
  id: string;
  label: string;
  sublabel: string;
  icon: typeof Plane;
  color: string;
  messages: Omit<Message, "id" | "timestamp">[];
}

// ─── Personnages (données planning réel 25/06/2026) ───────────────────────────

const FI: Character[] = [
  { id: "fi_pascal",    firstName: "Pascal",     lastName: "NIGGEL",    role: "FI", level: "Instructeur", color: "bg-amber-500",  aircraft: "F-ORVZ / F-ONCD / ALX" },
  { id: "fi_frederic",  firstName: "Frédéric",   lastName: "AXUS",      role: "FI", level: "Instructeur", color: "bg-orange-500", aircraft: "Salle de cours" },
  { id: "fi_arnaud",    firstName: "Arnaud",     lastName: "BOULANGER", role: "FI", level: "Instructeur", color: "bg-red-500",    aircraft: "F-ORCP / ALX" },
  { id: "fi_didier",    firstName: "Didier",     lastName: "JUERY",     role: "FI", level: "Instructeur", color: "bg-rose-500",   aircraft: "F-OIQZ / ALX / Box" },
  { id: "fi_jeanyves",  firstName: "Jean-Yves",  lastName: "MARTINO",   role: "FI", level: "Instructeur", color: "bg-pink-500",   aircraft: "N1QS" },
  { id: "fi_florian",   firstName: "Florian",    lastName: "REYREAU",   role: "FI", level: "Instructeur", color: "bg-fuchsia-500",aircraft: "F-ORVZ / F-OIQZ" },
  { id: "fi_vincent",   firstName: "Vincent",    lastName: "ROUX",      role: "FI", level: "Instructeur", color: "bg-violet-500", aircraft: "ALX" },
  { id: "fi_philippe",  firstName: "Philippe",   lastName: "TAPETA",    role: "FI", level: "Instructeur", color: "bg-blue-500",   aircraft: "F-ONCD / F-OIQZ" },
  { id: "fi_manahere",  firstName: "Manahere",   lastName: "TEHEIURA",  role: "FI", level: "Instructeur", color: "bg-cyan-500",   aircraft: "F-ORVZ" },
];

// Élèves Pascal (Students = formation initiale, Pilot = avancé/perfectionnement)
const ELEVES: Character[] = [
  // Avec Pascal NIGGEL
  { id: "el_carpi",      firstName: "Patrice",     lastName: "CARPI",       role: "ELEVE",  level: "Student",    color: "bg-sky-500",     daysSinceLastFlight: 14 },
  { id: "el_nouveau",    firstName: "Teariki",     lastName: "NOUVEAU",     role: "PILOTE", level: "Pilot",      color: "bg-teal-500",    daysSinceLastFlight: 7 },
  { id: "el_iannaci",    firstName: "Daniele",     lastName: "IANNACI",     role: "PILOTE", level: "Pilot",      color: "bg-green-500",   daysSinceLastFlight: 21, aircraft: "F-OIQZ" },
  { id: "el_charuel",    firstName: "Aurélie",     lastName: "CHARUEL",     role: "PILOTE", level: "Pilot",      color: "bg-emerald-500", daysSinceLastFlight: 10, aircraft: "F-ORVZ" },
  { id: "el_vaiho",      firstName: "Viriamu",     lastName: "VAIHO",       role: "ELEVE",  level: "Student",    color: "bg-lime-500",    daysSinceLastFlight: 18 },
  { id: "el_sandford",   firstName: "Manuarii",    lastName: "SANDFORD",    role: "PILOTE", level: "Pilot",      color: "bg-yellow-500",  daysSinceLastFlight: 3 },
  { id: "el_chant",      firstName: "Ranitea",     lastName: "CHANT",       role: "ELEVE",  level: "Student",    color: "bg-amber-400",   daysSinceLastFlight: 29 },
  { id: "el_tuihani",    firstName: "Teihotu",     lastName: "TUIHANI",     role: "PILOTE", level: "Pilot",      color: "bg-orange-400",  daysSinceLastFlight: 6 },
  // Autres élèves du planning
  { id: "el_lardillier", firstName: "Keanee",      lastName: "LARDILLIER",  role: "ELEVE",  level: "Student",    color: "bg-red-400",     daysSinceLastFlight: 5,  aircraft: "F-ONCD" },
  { id: "el_conroy",     firstName: "Tetaitu",     lastName: "CONROY",      role: "ELEVE",  level: "Student",    color: "bg-rose-400",    daysSinceLastFlight: 9,  aircraft: "F-ONCD" },
  { id: "el_tatarata",   firstName: "Manea",       lastName: "TATARATA",    role: "ELEVE",  level: "Student",    color: "bg-pink-400",    daysSinceLastFlight: 11, aircraft: "F-ONCD" },
  { id: "el_hauata",     firstName: "Maarau",      lastName: "HAUATA",      role: "ELEVE",  level: "Student",    color: "bg-fuchsia-400", daysSinceLastFlight: 6,  aircraft: "F-OIQZ" },
  { id: "el_monnier",    firstName: "Tohaumoana",  lastName: "MONNIER",     role: "ELEVE",  level: "Student",    color: "bg-violet-400",  daysSinceLastFlight: 13, aircraft: "F-OIQZ" },
  { id: "el_fareea",     firstName: "Bonno",       lastName: "FAREEA",      role: "ELEVE",  level: "Student",    color: "bg-indigo-400",  daysSinceLastFlight: 8,  aircraft: "F-OIQZ" },
  { id: "el_tefaaafana", firstName: "Benjamin",    lastName: "TEFAAAFANA",  role: "ELEVE",  level: "Student",    color: "bg-blue-400",    daysSinceLastFlight: 4,  aircraft: "N1QS" },
  { id: "el_taaroa",     firstName: "Hinaïly",     lastName: "TAAROA",      role: "ELEVE",  level: "Student",    color: "bg-cyan-400",    daysSinceLastFlight: 2,  aircraft: "N1QS" },
  { id: "el_goyat",      firstName: "Vincent",     lastName: "GOYAT",       role: "ELEVE",  level: "Student",    color: "bg-teal-400",    daysSinceLastFlight: 15, aircraft: "N1QS" },
  { id: "el_triponel",   firstName: "Ewen",        lastName: "TRIPONEL",    role: "ELEVE",  level: "Student",    color: "bg-green-400",   daysSinceLastFlight: 7,  aircraft: "F-ORCP" },
  { id: "el_theveniault",firstName: "Lucas",       lastName: "THEVENIAULT", role: "ELEVE",  level: "Student",    color: "bg-lime-400",    daysSinceLastFlight: 12, aircraft: "F-OCPR" },
  { id: "el_estall",     firstName: "Teaki",       lastName: "ESTALL",      role: "ELEVE",  level: "Student",    color: "bg-amber-300",   daysSinceLastFlight: 20, aircraft: "ALX" },
  { id: "el_maiau",      firstName: "Akeval",      lastName: "MAIAU-RICHARD",role:"ELEVE",  level: "Student",    color: "bg-orange-300",  daysSinceLastFlight: 16, aircraft: "ALX" },
  { id: "el_temu",       firstName: "Tamahei",     lastName: "TEMU",        role: "ELEVE",  level: "Student",    color: "bg-red-300",     daysSinceLastFlight: 9,  aircraft: "ALX" },
  { id: "el_chang",      firstName: "Herman",      lastName: "CHANG",       role: "ELEVE",  level: "Student",    color: "bg-rose-300",    daysSinceLastFlight: 5,  aircraft: "ALX" },
  { id: "el_tamu",       firstName: "Tevaihau",    lastName: "TAMU",        role: "ELEVE",  level: "Student",    color: "bg-pink-300",    daysSinceLastFlight: 3,  aircraft: "Salle cours" },
  { id: "el_pater",      firstName: "Teheiani",    lastName: "PATER",       role: "ELEVE",  level: "Student",    color: "bg-fuchsia-300", daysSinceLastFlight: 6,  aircraft: "Salle cours" },
  { id: "el_labeaume",   firstName: "Timothée",    lastName: "LABEAUME",    role: "ELEVE",  level: "Student",    color: "bg-violet-300",  daysSinceLastFlight: 8,  aircraft: "Box briefing" },
  { id: "el_jourdain",   firstName: "Miliana",     lastName: "JOURDAIN",    role: "ELEVE",  level: "Student",    color: "bg-indigo-300",  daysSinceLastFlight: 4,  aircraft: "F-ORVZ" },
  { id: "el_jollien",    firstName: "Charline",    lastName: "JOLLIEN",     role: "ELEVE",  level: "Student",    color: "bg-blue-300",    daysSinceLastFlight: 7,  aircraft: "F-ORVZ" },
  { id: "el_voune",      firstName: "Noatini",     lastName: "VOUNE",       role: "ELEVE",  level: "Student",    color: "bg-cyan-300",    daysSinceLastFlight: 11, aircraft: "F-ORVZ" },
  { id: "el_kohumoetini",firstName: "Mataihau",    lastName: "KOHUMOETINI", role: "ELEVE",  level: "Student",    color: "bg-teal-300",    daysSinceLastFlight: 19, aircraft: "F-OIQZ" },
];

const ALL_CHARS = [...FI, ...ELEVES];

function getChar(id: string): Character | undefined {
  return ALL_CHARS.find((c) => c.id === id);
}

function initials(c: Character) {
  return (c.firstName[0] + c.lastName[0]).toUpperCase();
}

function displayName(c: Character, short = false) {
  if (short) return c.firstName;
  return `${c.firstName} ${c.lastName}`;
}

// ─── Scénarios ────────────────────────────────────────────────────────────────

const SCENARIOS: Scenario[] = [
  // ── 1. Briefing du matin — Jour J (25/06) ──────────────────────────────────
  {
    id: "briefing_matin",
    label: "Briefing du matin",
    sublabel: "Jeudi 25 juin — 06 h 30",
    icon: Radio,
    color: "text-amber-400",
    messages: [
      { characterId: "fi_didier",   type: "system",  text: "— Salle des ops C3P — Jeudi 25 juin 2026 — 06 h 30 —", targetId: undefined },
      { characterId: "fi_didier",   type: "atis",    text: "METAR NTAA 250530Z 08008KT 9999 FEW018 27/23 Q1012 NOSIG — Beau temps, vent 080/08kt, vis 10+. QNH 1012.", targetId: undefined },
      { characterId: "fi_didier",   type: "dialog",  text: "Bien. Météo clémente ce matin. F-ONCF reste clouée au sol — maintenance. On absorbe sur F-ORVZ, F-ONCD et F-OIQZ. Philippe, tu récupères le créneau Keanee en premier ?", targetId: "fi_philippe" },
      { characterId: "fi_philippe", type: "dialog",  text: "Reçu. J'ai Keanee à 07h, Manea à midi, Bonno sur F-OIQZ l'après-midi. Chargé mais faisable.", targetId: "fi_didier" },
      { characterId: "fi_florian",  type: "dialog",  text: "Moi j'ai Aurélie tôt sur F-ORVZ, puis Patrice mid-morning. Daniele en fin de mat sur F-OIQZ.", targetId: undefined },
      { characterId: "el_charuel",  type: "dialog",  text: "Florian, j'ai fait mon brief météo et les NOTAMs. NOTAM actif sur fréquence Papeete 06h-07h — test équipement.", targetId: "fi_florian" },
      { characterId: "fi_florian",  type: "dialog",  text: "Parfait Aurélie. On décolle à 06h20 alors, on sera hors de la fenêtre.", targetId: "el_charuel" },
      { characterId: "fi_frederic", type: "dialog",  text: "J'ai Tevaihau et Teheiani en salle de cours toute la matinée — théorie navigation. Pas de concurrence avec les créneaux avion.", targetId: undefined },
      { characterId: "el_tamu",     type: "dialog",  text: "Chef, question — on fait quoi si on finit la théorie avant midi ?", targetId: "fi_frederic" },
      { characterId: "fi_frederic", type: "dialog",  text: "Vous réviserez les cartes VAC de Papeete et Moorea. Et vous passerez l'examen blanc que j'ai préparé.", targetId: "el_tamu" },
      { characterId: "el_pater",    type: "action",  text: "pousse un léger soupir imperceptible", targetId: undefined },
      { characterId: "fi_arnaud",   type: "dialog",  text: "Ewen sur F-ORCP avec moi à 14h. Et je prends le simulateur avec Tamahei en fin d'après-midi.", targetId: undefined },
      { characterId: "fi_didier",   type: "dialog",  text: "Teaki, Akeval, Herman — vous êtes sur le simu ce matin avec Vincent et moi. Revoyez vos procédures pannes moteur avant de descendre.", targetId: "fi_vincent" },
      { characterId: "el_estall",   type: "dialog",  text: "Reçu. J'ai relu hier soir.", targetId: "fi_didier" },
      { characterId: "el_maiau",    type: "dialog",  text: "Moi aussi... presque.", targetId: undefined },
      { characterId: "fi_vincent",  type: "dialog",  text: "Akeval — 'presque' c'est pas une réponse valide pour une procédure de panne.", targetId: "el_maiau" },
      { characterId: "el_maiau",    type: "action",  text: "sort son carnet et commence à relire discrètement", targetId: undefined },
    ],
  },

  // ── 2. Débriefing piste — Aurélie / Florian ────────────────────────────────
  {
    id: "debriefing_aurélie",
    label: "Débriefing piste",
    sublabel: "Aurélie C. — Retour vol F-ORVZ",
    icon: Plane,
    color: "text-sky-400",
    messages: [
      { characterId: "fi_florian",  type: "system",  text: "— Retour F-ORVZ — 08 h 15 — Phase PP —", targetId: undefined },
      { characterId: "fi_florian",  type: "dialog",  text: "Aurélie, pose-toi. Debriefing à chaud pendant qu'on se souvient de tout.", targetId: "el_charuel" },
      { characterId: "el_charuel",  type: "dialog",  text: "Globalement je me suis sentie bien. Sauf le 3e tour — j'ai rattrapé une assiette trop cabrée à l'arrondi.", targetId: "fi_florian" },
      { characterId: "fi_florian",  type: "dialog",  text: "Tu t'en es aperçue toi-même — c'est bon signe. La vitesse seuil sur cet arrondi c'était combien ?", targetId: "el_charuel" },
      { characterId: "el_charuel",  type: "dialog",  text: "J'avais 80 kt. Vref sur le Tecnam c'est 70.", targetId: "fi_florian" },
      { characterId: "fi_florian",  type: "dialog",  text: "10 kt de trop. Sur une piste courte ici ça rallonge l'atterro de 150 m facilement. On va rejouer ça sur le whiteboard.", targetId: "el_charuel" },
      { characterId: "el_iannaci",  type: "action",  text: "passe avec son café, tend l'oreille au debriefing", targetId: undefined },
      { characterId: "fi_florian",  type: "dialog",  text: "Daniele tu peux rester — ça te concerne aussi, tu as le même défaut dans tes comptes-rendus.", targetId: "el_iannaci" },
      { characterId: "el_iannaci",  type: "dialog",  text: "Je savais même pas que j'avais ce défaut.", targetId: "fi_florian" },
      { characterId: "fi_florian",  type: "dialog",  text: "C'est exactement pour ça que t'es là. Assieds-toi.", targetId: "el_iannaci" },
      { characterId: "el_charuel",  type: "dialog",  text: "Pour la radio — je me suis emmêlée sur la fréquence Papeete/tour locale. J'ai appelé tour alors qu'on était encore en fréquence sol.", targetId: "fi_florian" },
      { characterId: "fi_florian",  type: "dialog",  text: "Changement de fréquence : ça se prépare avant l'action, pas pendant. C'est dans la checklist avant roulage. Tu la lis ou tu la récites ?", targetId: "el_charuel" },
      { characterId: "el_charuel",  type: "dialog",  text: "...Je la récitais.", targetId: "fi_florian" },
      { characterId: "fi_florian",  type: "dialog",  text: "On la lit. Toujours. Même après 50 heures. Les pros la lisent aussi.", targetId: "el_charuel" },
      { characterId: "el_iannaci",  type: "dialog",  text: "Je confirme — je faisais pareil. Maintenant je lis.", targetId: undefined },
    ],
  },

  // ── 3. Les "longue date sans vol" — Ranitea, Viriamu, Teaki ───────────────
  {
    id: "sans_vol",
    label: "Trop longtemps sans voler",
    sublabel: "Ranitea (29j) · Viriamu (18j) · Teaki (20j)",
    icon: Clock,
    color: "text-red-400",
    messages: [
      { characterId: "fi_pascal",   type: "system",  text: "— Coin canapé — 09 h 00 —", targetId: undefined },
      { characterId: "el_chant",    type: "dialog",  text: "Pascal, ça fait 29 jours que j'ai pas volé. À chaque fois que j'ai un créneau il y a soit la météo, soit le boulot. Je vais perdre tout ce que j'avais acquis.", targetId: "fi_pascal" },
      { characterId: "fi_pascal",   type: "dialog",  text: "Je vois Ranitea. 29 jours c'est significatif — en dessous de 15 on surveille, au-delà on agit. T'as révisé tes points clés de phase depuis ?", targetId: "el_chant" },
      { characterId: "el_chant",    type: "dialog",  text: "J'ai relu la théorie oui. Mais la théorie c'est pas le cockpit.", targetId: "fi_pascal" },
      { characterId: "fi_pascal",   type: "dialog",  text: "Non. Mais c'est mieux que rien. On va se caler un vol de remise en condition la semaine prochaine — en biplace, je reprends les manœuvres de base avec toi. Pas de panique.", targetId: "el_chant" },
      { characterId: "el_vaiho",    type: "dialog",  text: "Moi c'est 18 jours. Mes quarts de service aux Armées — impossible de prévoir.", targetId: "fi_pascal" },
      { characterId: "fi_pascal",   type: "dialog",  text: "Viriamu je sais. On en avait parlé. 18 jours ça reste dans la zone rouge-orange — t'as un tour de contrôle FI prévu avant le prochain solo. J'ai mis ça dans le planning du 9 juillet.", targetId: "el_vaiho" },
      { characterId: "el_vaiho",    type: "dialog",  text: "Le 9 juillet c'est bon pour moi. Merci chef.", targetId: "fi_pascal" },
      { characterId: "el_estall",   type: "dialog",  text: "20 jours pour moi. Et là je passe sur simu — c'est mieux que rien mais c'est frustrant.", targetId: undefined },
      { characterId: "fi_didier",   type: "dialog",  text: "Teaki — le simu c'est pas 'mieux que rien'. Le travail de pannes moteur qu'on fait ce matin, tu peux pas le faire en vrai. C'est complémentaire, pas substitut.", targetId: "el_estall" },
      { characterId: "el_estall",   type: "dialog",  text: "Oui Chef. Compris.", targetId: "fi_didier" },
      { characterId: "el_chant",    type: "dialog",  text: "C'est quand même pénible d'être sur une île paradisiaque avec des avions devant toi et de pas pouvoir voler.", targetId: undefined },
      { characterId: "fi_pascal",   type: "dialog",  text: "C'est la réalité de la formation en Polynésie. La météo est capricieuse, les contraintes perso sont réelles. Ce qui compte c'est comment tu uses le temps entre les vols.", targetId: "el_chant" },
      { characterId: "el_kohumoetini", type: "action", text: "lève la main depuis le fond de la salle", targetId: undefined },
      { characterId: "el_kohumoetini", type: "dialog", text: "Et moi j'ai 19 jours Chef...", targetId: "fi_pascal" },
      { characterId: "fi_pascal",   type: "dialog",  text: "Mataihau — t'étais dans la liste. Je te vois à 14h sur le planning de Florian si la météo tient.", targetId: "el_kohumoetini" },
    ],
  },

  // ── 4. Rappels élémentaires — Didier en mode FI ────────────────────────────
  {
    id: "rappels_bases",
    label: "Rappels élémentaires",
    sublabel: "Didier — carnets, CR et rigueur",
    icon: BookOpen,
    color: "text-violet-400",
    messages: [
      { characterId: "fi_didier",   type: "system",  text: "— Salle de cours — 10 h 00 —", targetId: undefined },
      { characterId: "fi_didier",   type: "dialog",  text: "J'ai passé hier soir à éplucher les carnets de vol. On a des problèmes.", targetId: undefined },
      { characterId: "el_maiau",    type: "action",  text: "échange un regard inquiet avec Herman", targetId: undefined },
      { characterId: "fi_didier",   type: "dialog",  text: "Akeval — ton carnet a un vol non signé du 14 juin. Tohaumoana — tu as mis 'F-OIQA' sur un vol fait en F-OIQZ. C'est pas la même immat.", targetId: "el_monnier" },
      { characterId: "el_monnier",  type: "dialog",  text: "Je me suis trompé de lettre...", targetId: "fi_didier" },
      { characterId: "fi_didier",   type: "dialog",  text: "L'immatriculation c'est le premier truc que tu lis dans le carnet avion avant de voler. Si tu te trompes là tu te trompes aussi en radio. C'est un document légal.", targetId: "el_monnier" },
      { characterId: "fi_didier",   type: "dialog",  text: "Les comptes-rendus de vol. Je veux un CR écrit dans les 24h. Pas une semaine après quand t'as oublié les détails.", targetId: undefined },
      { characterId: "el_hauata",   type: "dialog",  text: "Chef, j'en fais pas parce que j'arrive pas bien à exprimer ce qui s'est passé en vol.", targetId: "fi_didier" },
      { characterId: "fi_didier",   type: "dialog",  text: "Maarau — c'est exactement pour ça qu'on les écrit. Pour apprendre à nommer ce qu'on ressent en vol. Une phrase par manœuvre. Ce que t'as fait, ce qui t'a surpris, ce que tu referais différemment.", targetId: "el_hauata" },
      { characterId: "el_hauata",   type: "dialog",  text: "D'accord. Je vais essayer.", targetId: "fi_didier" },
      { characterId: "fi_didier",   type: "dialog",  text: "Autre chose. Certains d'entre vous briefent météo sans les NOTAMs. Les NOTAMs font partie du brief. Toujours. Même par ciel bleu.", targetId: undefined },
      { characterId: "el_fareea",   type: "dialog",  text: "Y'a des NOTAMs importants aujourd'hui ?", targetId: "fi_didier" },
      { characterId: "fi_didier",   type: "dialog",  text: "Bonno — c'est toi qui dois me le dire. T'aurais dû les consulter avant de venir.", targetId: "el_fareea" },
      { characterId: "el_fareea",   type: "action",  text: "sort son téléphone, ouvre l'appli NOTAMs", targetId: undefined },
      { characterId: "fi_didier",   type: "dialog",  text: "Bien. Lis-les à voix haute pour tout le monde.", targetId: "el_fareea" },
      { characterId: "el_temu",     type: "dialog",  text: "Chef — question sur le CR. On peut le faire dans l'appli C3P ou il faut papier ?", targetId: "fi_didier" },
      { characterId: "fi_didier",   type: "dialog",  text: "Les deux sont valides. L'important c'est que ce soit fait et daté sous 24h.", targetId: "el_temu" },
    ],
  },

  // ── 5. F-ONCF en maintenance — réorganisation ────────────────────────────
  {
    id: "maintenance",
    label: "F-ONCF immobilisée",
    sublabel: "Réorganisation à chaud — planning revu",
    icon: Wrench,
    color: "text-orange-400",
    messages: [
      { characterId: "fi_didier",   type: "system",  text: "— 06 h 45 — Annonce maintenance F-ONCF —", targetId: undefined },
      { characterId: "fi_didier",   type: "radio",   text: "Attention équipe — F-ONCF en maintenance non programmée. Sortie terrain du Tecnam repoussée à lundi au mieux. On réorganise.", targetId: undefined },
      { characterId: "fi_philippe", type: "dialog",  text: "J'avais Keanee sur F-ONCF à 07h et Manea à midi. Je les passe sur F-ONCD si c'est libre.", targetId: "fi_didier" },
      { characterId: "fi_didier",   type: "dialog",  text: "F-ONCD est prise par Florian jusqu'à 09h. À partir de 09h elle est dispo. Keanee peut décaler à 09h, Manea garde son créneau midi.", targetId: "fi_philippe" },
      { characterId: "el_lardillier", type: "dialog", text: "Donc mon vol décale de 2 heures ?", targetId: "fi_philippe" },
      { characterId: "fi_philippe", type: "dialog",  text: "Oui Keanee. Profite pour finaliser ton brief nav.", targetId: "el_lardillier" },
      { characterId: "el_lardillier", type: "action", text: "hoche la tête, ressort ses cartes secteur", targetId: undefined },
      { characterId: "fi_florian",  type: "dialog",  text: "Tetaitu était aussi sur F-ONCF non ?", targetId: "fi_didier" },
      { characterId: "fi_didier",   type: "dialog",  text: "Oui. Tetaitu passe en séance sol avec Frédéric ce matin, vol en fin de journée si on récupère un créneau.", targetId: undefined },
      { characterId: "el_conroy",   type: "dialog",  text: "Encore une séance sol... j'en peux plus de la théorie, je veux voler.", targetId: undefined },
      { characterId: "fi_frederic", type: "dialog",  text: "Tetaitu — on a tous des journées comme ça. Un pilote qui maîtrise la théorie vole mieux et plus vite. C'est pas du temps perdu.", targetId: "el_conroy" },
      { characterId: "el_conroy",   type: "dialog",  text: "Je sais. C'est juste frustrant.", targetId: "fi_frederic" },
      { characterId: "fi_frederic", type: "dialog",  text: "La frustration fait partie du métier aussi. On apprend à la gérer.", targetId: "el_conroy" },
      { characterId: "fi_manahere", type: "dialog",  text: "Noatini — on part à quelle heure finalement ?", targetId: "el_voune" },
      { characterId: "el_voune",    type: "dialog",  text: "Je pensais 10h... mais avec le réarrangement ?", targetId: "fi_manahere" },
      { characterId: "fi_manahere", type: "dialog",  text: "F-ORVZ libre à 08h20 normalement — Aurélie rentre vers là. On part à 08h30, briefing ici à 08h15.", targetId: "el_voune" },
    ],
  },

  // ── 6. Fin de journée — debriefs croisés, ambiance escadron ───────────────
  {
    id: "fin_journee",
    label: "Fin de journée",
    sublabel: "17 h 00 — Retours de vols, ambiance escadron",
    icon: Coffee,
    color: "text-teal-400",
    messages: [
      { characterId: "fi_didier",   type: "system",  text: "— Salle des ops — 17 h 00 — Fin des vols du jour —", targetId: undefined },
      { characterId: "el_triponel", type: "dialog",  text: "Chef, j'ai fait mon premier virage incliné à 45° tout seul aujourd'hui. Arnaud était là mais il a rien touché.", targetId: "fi_arnaud" },
      { characterId: "fi_arnaud",   type: "dialog",  text: "Exact. Bien stabilisé. Tu regardais dehors au lieu de fixer les instruments — c'est le bon réflexe.", targetId: "el_triponel" },
      { characterId: "el_triponel", type: "action",  text: "sourire qui s'étend jusqu'aux oreilles", targetId: undefined },
      { characterId: "el_chang",    type: "dialog",  text: "Moi sur le simu j'ai foiré la panne moteur au décollage. Deux fois.", targetId: undefined },
      { characterId: "fi_vincent",  type: "dialog",  text: "Herman — les foirages sur simu c'est exactement ce qu'on cherche. Tu peux foirer autant de fois qu'il faut. T'as compris pourquoi ça a raté ?", targetId: "el_chang" },
      { characterId: "el_chang",    type: "dialog",  text: "La deuxième fois oui — j'ai voulu recaler moteur au lieu de poser droit devant. Réflexe instinctif mais faux.", targetId: "fi_vincent" },
      { characterId: "fi_vincent",  type: "dialog",  text: "Exactement. En dessous de 200 ft on pose. Point. La répétition sur simu va ancrer ça.", targetId: "el_chang" },
      { characterId: "fi_jeanyves", type: "dialog", text: "Benjamin et Hinaïly — belle journée sur N1QS. Hinaïly t'as eu une belle correction de vent de travers au troisième tour.", targetId: "el_taaroa" },
      { characterId: "el_taaroa",   type: "dialog",  text: "J'ai senti le drift sur la finale et j'ai anticipé. C'est ce que vous m'aviez dit.", targetId: "fi_jeanyves" },
      { characterId: "fi_jeanyves", type: "dialog",  text: "Et t'as appliqué. C'est ça l'important.", targetId: "el_taaroa" },
      { characterId: "el_tefaaafana", type: "dialog", text: "Moi j'étais moins bien. Je me suis cramponné aux commandes.", targetId: "fi_jeanyves" },
      { characterId: "fi_jeanyves", type: "dialog",  text: "Benjamin — souviens-toi : l'avion veut voler. Tu guides, tu conduis pas. Demain on recommence, t'auras progressé rien qu'avec une nuit de recul.", targetId: "el_tefaaafana" },
      { characterId: "fi_pascal",   type: "dialog",  text: "Beau travail tout le monde. F-ONCF revient lundi, planning de la semaine prochaine sera mis à jour ce soir. Bon repos.", targetId: undefined },
      { characterId: "el_charuel",  type: "dialog",  text: "Ia ora na à tous.", targetId: undefined },
      { characterId: "fi_didier",   type: "action",  text: "rince les tasses du canapé, éteint les lumières de la salle de cours", targetId: undefined },
    ],
  },
];

// ─── Helpers visuels ──────────────────────────────────────────────────────────

const ROLE_STYLE: Record<Role, string> = {
  FI:     "text-amber-400",
  ELEVE:  "text-sky-400",
  PILOTE: "text-emerald-400",
};

function flightBadge(c: Character) {
  const d = c.daysSinceLastFlight;
  if (d === null || d === undefined) return null;
  if (d >= 30) return <Badge className="text-[10px] bg-red-500/15 text-red-400 border-red-500/30 shrink-0">{d}j</Badge>;
  if (d >= 15) return <Badge className="text-[10px] bg-amber-500/15 text-amber-400 border-amber-500/30 shrink-0">{d}j</Badge>;
  return <Badge className="text-[10px] bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shrink-0">{d}j</Badge>;
}

// ─── Sous-composants ─────────────────────────────────────────────────────────

function Avatar({ char, size = "md" }: { char: Character; size?: "sm" | "md" }) {
  const sz = size === "sm" ? "w-7 h-7 text-[10px]" : "w-9 h-9 text-xs";
  return (
    <div className={`${sz} rounded-full ${char.color} flex items-center justify-center shrink-0 text-white font-bold shadow`}>
      {initials(char)}
    </div>
  );
}

function MsgBubble({ msg }: { msg: Message }) {
  const char = getChar(msg.characterId);
  const target = msg.targetId ? getChar(msg.targetId) : null;
  if (!char) return null;

  if (msg.type === "system") {
    return (
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-[11px] text-muted-foreground px-2 shrink-0">{msg.text}</span>
        <div className="flex-1 h-px bg-border" />
      </div>
    );
  }

  if (msg.type === "atis") {
    return (
      <div className="my-3 bg-sky-500/10 border border-sky-500/20 rounded-lg p-3 flex gap-3">
        <Wind className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
        <div>
          <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block mb-0.5">METAR / ATIS</span>
          <span className="text-xs text-foreground font-mono">{msg.text}</span>
        </div>
      </div>
    );
  }

  if (msg.type === "radio") {
    return (
      <div className="my-3 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex gap-3">
        <Radio className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
        <div>
          <span className="text-xs font-bold text-amber-400">{displayName(char, true)} · </span>
          <span className="text-sm text-foreground">{msg.text}</span>
        </div>
      </div>
    );
  }

  if (msg.type === "action") {
    return (
      <div className="flex items-center gap-2 my-1.5 px-2">
        <Avatar char={char} size="sm" />
        <span className="text-xs text-muted-foreground italic">
          <span className="font-medium text-foreground/70">{displayName(char, true)}</span> {msg.text}
        </span>
      </div>
    );
  }

  return (
    <div className="flex gap-3 my-2.5 items-start">
      <Avatar char={char} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1 flex-wrap">
          <span className="text-sm font-semibold text-foreground">{displayName(char, false)}</span>
          <span className={`text-[10px] uppercase tracking-wider ${ROLE_STYLE[char.role]}`}>
            {char.role === "FI" ? "FI" : char.level}
          </span>
          {target && <span className="text-[10px] text-muted-foreground">→ {displayName(target, true)}</span>}
          <span className="text-[10px] text-muted-foreground ml-auto">
            {msg.timestamp.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        <div className={`rounded-xl rounded-tl-sm p-3 text-sm text-foreground border ${
          char.role === "FI" ? "bg-amber-500/5 border-amber-500/15" : "bg-card border-border"
        }`}>
          {msg.text}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OpsRoom() {
  const [scenario, setScenario] = useState<Scenario>(SCENARIOS[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<1 | 2 | 3>(1);
  const [tab, setTab] = useState<"fi" | "eleves">("fi");
  const bottomRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const DELAY = { 1: 2200, 2: 1100, 3: 450 }[speed];

  function loadScenario(s: Scenario) {
    setScenario(s);
    setMessages([]);
    setIdx(0);
    setPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function buildMsg(raw: Omit<Message, "id" | "timestamp">, i: number): Message {
    const t = new Date();
    t.setHours(6, 30, 0, 0);
    t.setMinutes(t.getMinutes() + i * 3);
    return { ...raw, id: `m${i}`, timestamp: t };
  }

  useEffect(() => {
    if (!playing) { if (timerRef.current) clearInterval(timerRef.current); return; }
    if (idx >= scenario.messages.length) { setPlaying(false); return; }
    timerRef.current = setInterval(() => {
      setIdx((i) => {
        if (i >= scenario.messages.length) { setPlaying(false); clearInterval(timerRef.current!); return i; }
        setMessages((prev) => [...prev, buildMsg(scenario.messages[i], i)]);
        return i + 1;
      });
    }, DELAY);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [playing, idx, scenario, DELAY]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const done = idx >= scenario.messages.length;

  const displayedFI = FI;
  const displayedEleves = ELEVES.filter((e) => e.daysSinceLastFlight !== null && e.daysSinceLastFlight !== undefined)
    .sort((a, b) => (b.daysSinceLastFlight ?? 0) - (a.daysSinceLastFlight ?? 0));

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl text-foreground flex items-center gap-3">
            <Radio className="w-7 h-7 text-primary" />
            Salle des Ops — C3P
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Simulation · Jeudi 25 juin 2026 · Aérodrome de Tahiti-Faa'a
          </p>
        </div>
        <Badge variant="outline" className="text-[10px] text-muted-foreground border-border shrink-0">
          Dialogues fictifs — simulation pédagogique
        </Badge>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-5">

        {/* ── Panneau gauche ── */}
        <div className="space-y-4">

          {/* Onglets FI / Élèves */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex border-b border-border">
              <button
                onClick={() => setTab("fi")}
                className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${tab === "fi" ? "bg-amber-500/10 text-amber-400 border-b-2 border-amber-400" : "text-muted-foreground hover:text-foreground"}`}
              >
                Instructeurs ({FI.length})
              </button>
              <button
                onClick={() => setTab("eleves")}
                className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${tab === "eleves" ? "bg-sky-500/10 text-sky-400 border-b-2 border-sky-400" : "text-muted-foreground hover:text-foreground"}`}
              >
                Élèves ({ELEVES.length})
              </button>
            </div>

            <ScrollArea className="h-64 p-2">
              {tab === "fi" && displayedFI.map((c) => (
                <div key={c.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-accent/40 transition-colors">
                  <Avatar char={c} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{displayName(c)}</p>
                    {c.aircraft && <p className="text-[10px] text-muted-foreground truncate">{c.aircraft}</p>}
                  </div>
                </div>
              ))}
              {tab === "eleves" && displayedEleves.map((c) => (
                <div key={c.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-accent/40 transition-colors">
                  <Avatar char={c} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{displayName(c)}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{c.aircraft ?? c.level}</p>
                  </div>
                  {flightBadge(c)}
                </div>
              ))}
            </ScrollArea>
          </div>

          {/* Légende */}
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">Délai sans vol</p>
            <div className="space-y-1.5">
              {[
                { cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", label: "< 15j — OK solo" },
                { cls: "bg-amber-500/15 text-amber-400 border-amber-500/30",   label: "15-29j — tour FI requis" },
                { cls: "bg-red-500/15 text-red-400 border-red-500/30",         label: "30j+ — remise en condition" },
              ].map(({ cls, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <Badge className={`text-[10px] ${cls}`}>Xj</Badge>
                  <span className="text-[10px] text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Fleet du jour */}
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
              <Plane className="w-3 h-3" /> Fleet 25/06
            </p>
            <div className="space-y-1">
              {[
                { ac: "F-ORVZ", type: "Tecnam P2008 JC", ok: true },
                { ac: "F-ONCD", type: "Tecnam P2008 JC", ok: true },
                { ac: "F-ONCF", type: "Tecnam P2008 JC", ok: false },
                { ac: "F-OIQZ", type: "Piper PA28",      ok: true },
                { ac: "N1QS",   type: "Cessna 172",      ok: true },
                { ac: "F-GVFA", type: "Cessna 172",      ok: true },
                { ac: "F-ORCP", type: "Tecnam P2008 T",  ok: true },
                { ac: "F-OIQA", type: "Piper PA-31",     ok: true },
                { ac: "F-OCPR", type: "Piper PA28",      ok: true },
                { ac: "ALX",    type: "Simulateur",      ok: true },
              ].map(({ ac, type, ok }) => (
                <div key={ac} className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${ok ? "bg-emerald-400" : "bg-red-400"}`} />
                  <span className="text-xs font-mono text-foreground">{ac}</span>
                  <span className="text-[10px] text-muted-foreground">{type}</span>
                  {!ok && <Badge className="text-[10px] bg-red-500/15 text-red-400 border-red-500/30 ml-auto">MAINT.</Badge>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Zone principale ── */}
        <div className="space-y-4">

          {/* Sélecteur de scénarios */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                onClick={() => loadScenario(s)}
                className={`text-left p-3 rounded-xl border transition-all ${
                  scenario.id === s.id
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
                  <span className="text-xs font-semibold text-foreground">{s.label}</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-snug">{s.sublabel}</p>
              </button>
            ))}
          </div>

          {/* Lecteur */}
          <div className="bg-card border border-border rounded-xl flex flex-col" style={{ minHeight: "500px" }}>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-wrap gap-2">
              <div>
                <span className="text-sm font-semibold text-foreground">{scenario.label}</span>
                <span className="text-[11px] text-muted-foreground ml-2">{scenario.sublabel}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5 bg-background rounded-md border border-border p-0.5">
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
                  className="h-7 text-xs"
                  onClick={() => {
                    if (done) { setMessages([]); setIdx(0); setPlaying(true); }
                    else setPlaying(!playing);
                  }}
                >
                  {done ? "Rejouer" : playing ? "Pause" : idx === 0 ? "Lancer" : "Reprendre"}
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-4 py-3">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-56 text-muted-foreground">
                  <ChevronDown className="w-8 h-8 mb-2 opacity-20 animate-bounce" />
                  <p className="text-sm">Sélectionne un scénario et lance la simulation</p>
                  <p className="text-xs mt-1">6 séquences disponibles — dialogues fictifs</p>
                </div>
              )}
              {messages.map((m) => <MsgBubble key={m.id} msg={m} />)}
              {playing && !done && (
                <div className="flex items-center gap-2 px-12 py-2 text-muted-foreground">
                  <div className="flex gap-1">
                    {[0, 150, 300].map((delay) => (
                      <span key={delay} className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                    ))}
                  </div>
                  <span className="text-xs">{idx}/{scenario.messages.length}</span>
                </div>
              )}
              <div ref={bottomRef} />
            </ScrollArea>

            {done && messages.length > 0 && (
              <div className="px-4 py-2 border-t border-border text-[11px] text-muted-foreground text-center">
                Séquence terminée · {messages.length} échanges · Cliquer "Rejouer" pour recommencer
              </div>
            )}
          </div>

          {/* Users */}
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-[11px] text-muted-foreground">
              {FI.length} instructeurs · {ELEVES.length} élèves & pilotes · Données planning C3P 25/06/2026 · Dialogues fictifs à titre pédagogique
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
