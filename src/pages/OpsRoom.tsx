import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plane, Radio, Clock, AlertTriangle, Coffee, ChevronDown } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = "FI" | "PPL" | "STAGIAIRE";
type Mood = "neutre" | "ronchon" | "motivé" | "fatigué" | "pédago" | "humour";

interface Character {
  id: string;
  /** Prénom affiché — remplacer par le vrai prénom quand on associe un membre réel */
  name: string;
  /** Initiales pour l'avatar */
  initials: string;
  role: Role;
  /** Phase de formation courante */
  phase?: "PB" | "PP" | "NB" | "NP" | "FI";
  /** Heures depuis le dernier vol (null = instructeur) */
  daysSinceLastFlight?: number;
  mood: Mood;
  /** ID du membre réel associé (null = personnage fictif) */
  realMemberId?: string;
  color: string;
}

interface Message {
  id: string;
  characterId: string;
  text: string;
  timestamp: Date;
  type: "dialog" | "action" | "system" | "radio";
  /** Référence à un autre personnage (pour les interactions directes) */
  targetId?: string;
}

interface Scenario {
  id: string;
  label: string;
  icon: typeof Plane;
  description: string;
  messages: Omit<Message, "id" | "timestamp">[];
}

// ─── Personnages ──────────────────────────────────────────────────────────────

const CHARACTERS: Character[] = [
  {
    id: "fi_marc",
    name: "Marc",
    initials: "MA",
    role: "FI",
    mood: "pédago",
    color: "bg-amber-500",
    daysSinceLastFlight: null,
  },
  {
    id: "fi_claire",
    name: "Claire",
    initials: "CL",
    role: "FI",
    mood: "neutre",
    color: "bg-orange-500",
    daysSinceLastFlight: null,
  },
  {
    id: "eleve_theo",
    name: "Théo",
    initials: "TH",
    role: "PPL",
    phase: "NB",
    mood: "ronchon",
    color: "bg-sky-500",
    daysSinceLastFlight: 23,
  },
  {
    id: "eleve_lucie",
    name: "Lucie",
    initials: "LU",
    role: "PPL",
    phase: "PP",
    mood: "motivé",
    color: "bg-emerald-500",
    daysSinceLastFlight: 8,
  },
  {
    id: "eleve_kevin",
    name: "Kévin",
    initials: "KV",
    role: "PPL",
    phase: "PB",
    mood: "fatigué",
    color: "bg-purple-500",
    daysSinceLastFlight: 12,
  },
  {
    id: "eleve_reva",
    name: "Reva",
    initials: "RE",
    role: "PPL",
    phase: "NP",
    mood: "humour",
    color: "bg-rose-500",
    daysSinceLastFlight: 5,
  },
  {
    id: "stagiaire_ana",
    name: "Ana",
    initials: "AN",
    role: "STAGIAIRE",
    phase: "PB",
    mood: "motivé",
    color: "bg-teal-500",
    daysSinceLastFlight: 45,
  },
];

// ─── Scénarios ────────────────────────────────────────────────────────────────

const SCENARIOS: Scenario[] = [
  {
    id: "meteo_annule",
    label: "Météo → vol annulé",
    icon: AlertTriangle,
    description: "La météo polynésienne force l'annulation des vols du matin. Les réactions divergent.",
    messages: [
      {
        characterId: "fi_marc",
        type: "radio",
        text: "Attention tout le monde — METAR de Faaa à 07h30 : vent 120/25kt, rafales 38kt, averses convectives sur le lagon. Vol du matin annulé.",
        targetId: undefined,
      },
      {
        characterId: "eleve_theo",
        type: "dialog",
        text: "Encore ?! C'est la troisième fois ce mois-ci. J'ai pas volé depuis 23 jours. À ce rythme je vais perdre mes acquis.",
        targetId: undefined,
      },
      {
        characterId: "fi_claire",
        type: "dialog",
        text: "Théo, 23 jours c'est pas si long. Mais je comprends la frustration. On va faire une séance sol sur la navigation NB pendant que c'est fermé.",
        targetId: "eleve_theo",
      },
      {
        characterId: "eleve_lucie",
        type: "dialog",
        text: "Moi ça m'arrange, j'avais pas eu le temps de relire mes procédures VFR spéciales Polynésie.",
        targetId: undefined,
      },
      {
        characterId: "eleve_kevin",
        type: "action",
        text: "saisit son deuxième café et s'affale dans le canapé de la salle des ops",
        targetId: undefined,
      },
      {
        characterId: "eleve_kevin",
        type: "dialog",
        text: "De toute façon j'ai pas dormi. La fenêtre de vol de l'après-midi elle tient ?",
        targetId: "fi_marc",
      },
      {
        characterId: "fi_marc",
        type: "dialog",
        text: "La TAF donne une amélioration après 13h. Mais Kévin — dormir avant de voler c'est pas optionnel. On repassera les critères d'aptitude ensemble.",
        targetId: "eleve_kevin",
      },
      {
        characterId: "eleve_reva",
        type: "dialog",
        text: "Pendant ce temps, moi je révise mes limitations VFR de nuit... oh wait, on fait pas de VFR de nuit ici. Belle journée.",
        targetId: undefined,
      },
      {
        characterId: "stagiaire_ana",
        type: "dialog",
        text: "Chef, j'ai pas volé depuis 45 jours à cause de mes quarts de service. Je peux me mettre dans la liste de l'après-midi ?",
        targetId: "fi_marc",
      },
      {
        characterId: "fi_marc",
        type: "dialog",
        text: "Ana — 45 jours, ça va nécessiter un vol de remise en condition avec moi avant de te remettre en solo. On va revoir les points clés ensemble ce matin.",
        targetId: "stagiaire_ana",
      },
      {
        characterId: "stagiaire_ana",
        type: "action",
        text: "hoche la tête, sort son livret de progression",
        targetId: undefined,
      },
    ],
  },
  {
    id: "debriefing_piste",
    label: "Débriefing piste",
    icon: Plane,
    description: "Retour de vol — Marc débrieffe Lucie sur ses tours de piste.",
    messages: [
      {
        characterId: "fi_marc",
        type: "system",
        text: "— Retour de vol F-GXYZ, phase PP —",
        targetId: undefined,
      },
      {
        characterId: "fi_marc",
        type: "dialog",
        text: "Lucie, pose ton casque. Debriefing. Globalement c'était bien. Mais on va parler du 4e tour.",
        targetId: "eleve_lucie",
      },
      {
        characterId: "eleve_lucie",
        type: "dialog",
        text: "Oui, j'ai senti que j'étais un peu haute sur le plan...",
        targetId: "fi_marc",
      },
      {
        characterId: "fi_marc",
        type: "dialog",
        text: "Haute ET trop vite. Tu avais 85kt sur le seuil. La vitesse de référence c'est combien ?",
        targetId: "eleve_lucie",
      },
      {
        characterId: "eleve_lucie",
        type: "dialog",
        text: "75 knots... vref + 0.",
        targetId: "fi_marc",
      },
      {
        characterId: "fi_marc",
        type: "dialog",
        text: "Exactement. 10kt de plus c'est presque 30m de flottement en plus. En Polynésie avec les pistes courtes et les vents variables, ça devient vite un problème. Tu retiens ça.",
        targetId: "eleve_lucie",
      },
      {
        characterId: "eleve_theo",
        type: "action",
        text: "lève les yeux de son livre, fait semblant de pas écouter mais écoute",
        targetId: undefined,
      },
      {
        characterId: "eleve_lucie",
        type: "dialog",
        text: "Compris. Et pour la séquence radio au point d'arrêt — j'ai hésité.",
        targetId: "fi_marc",
      },
      {
        characterId: "fi_marc",
        type: "dialog",
        text: "J'ai entendu. L'hésitation c'est normal au début. Mais la radio ça se prépare avant, pas pendant. Check radio dans la checklist avant roulage. On fait un jeu de rôle maintenant.",
        targetId: "eleve_lucie",
      },
      {
        characterId: "fi_claire",
        type: "dialog",
        text: "Marc, j'ai F-GABC dispo à 14h si tu veux enchaîner un vol avec Théo.",
        targetId: "fi_marc",
      },
      {
        characterId: "fi_marc",
        type: "dialog",
        text: "Parfait. Théo — prépare-moi un briefing météo et un plan de vol LSART-NTAA pour 14h. C'est toi le commandant de bord cet après-midi.",
        targetId: "eleve_theo",
      },
      {
        characterId: "eleve_theo",
        type: "action",
        text: "se redresse d'un coup, motivation revenue",
        targetId: undefined,
      },
      {
        characterId: "eleve_theo",
        type: "dialog",
        text: "Reçu chef. Je prends le manual de navigation et je commence.",
        targetId: "fi_marc",
      },
    ],
  },
  {
    id: "rappel_bases",
    label: "Rappel élémentaire",
    icon: Coffee,
    description: "Claire rappelle des fondamentaux... que tout le monde devrait déjà savoir.",
    messages: [
      {
        characterId: "fi_claire",
        type: "action",
        text: "entre dans la salle avec une pile de carnets de vol",
        targetId: undefined,
      },
      {
        characterId: "fi_claire",
        type: "dialog",
        text: "OK les gars — j'ai regardé vos carnets de vol hier soir. On a un problème.",
        targetId: undefined,
      },
      {
        characterId: "eleve_kevin",
        type: "dialog",
        text: "C'est quoi encore...",
        targetId: undefined,
      },
      {
        characterId: "fi_claire",
        type: "dialog",
        text: "Kévin, ton carnet de vol est vide depuis le 3. Théo, tes heures de la semaine dernière sont pas signées. Reva, tu as mis 'NB' sur un vol qui était en phase PP. C'est un document officiel, pas un post-it.",
        targetId: undefined,
      },
      {
        characterId: "eleve_reva",
        type: "dialog",
        text: "J'avais la tête dans les étoiles... littéralement. J'étais en train de faire des étoiles filantes dans la marge.",
        targetId: undefined,
      },
      {
        characterId: "fi_claire",
        type: "dialog",
        text: "Reva...",
        targetId: "eleve_reva",
      },
      {
        characterId: "eleve_reva",
        type: "dialog",
        text: "Compris. Carnet sérieux. C'est noté — dans la bonne colonne.",
        targetId: "fi_claire",
      },
      {
        characterId: "fi_claire",
        type: "dialog",
        text: "Autre point : les comptes-rendus de vol. Je veux un CR écrit dans les 24h après chaque vol. Pas 3 jours après, 24h. C'est comme ça qu'on progresse.",
        targetId: undefined,
      },
      {
        characterId: "eleve_lucie",
        type: "dialog",
        text: "Moi j'écris le mien le soir même, dans l'appli.",
        targetId: "fi_claire",
      },
      {
        characterId: "fi_claire",
        type: "dialog",
        text: "Je sais Lucie, le tien est exemplaire. Les autres peuvent s'en inspirer.",
        targetId: undefined,
      },
      {
        characterId: "eleve_theo",
        type: "dialog",
        text: "Question — pour les 23 jours sans vol, j'ai quand même le droit de voler solo ou il faut un vol avec instructeur ?",
        targetId: "fi_claire",
      },
      {
        characterId: "fi_claire",
        type: "dialog",
        text: "Theo, règle interne C3P : plus de 15 jours sans vol en phase solo, on fait un tour de contrôle avec un FI avant de te remettre en solo. C'est pas une punition, c'est de la sécurité.",
        targetId: "eleve_theo",
      },
      {
        characterId: "eleve_theo",
        type: "dialog",
        text: "OK. Je le savais mais j'espérais que...",
        targetId: undefined,
      },
      {
        characterId: "fi_claire",
        type: "dialog",
        text: "... que j'aurais oublié ? Non.",
        targetId: "eleve_theo",
      },
      {
        characterId: "stagiaire_ana",
        type: "action",
        text: "lève timidement la main",
        targetId: undefined,
      },
      {
        characterId: "stagiaire_ana",
        type: "dialog",
        text: "Et pour moi avec 45 jours... c'est quoi le protocole exactement ?",
        targetId: "fi_claire",
      },
      {
        characterId: "fi_claire",
        type: "dialog",
        text: "Ana : vol de remise en condition complet avec un FI, review de tes points de progrès, puis décision conjointe pour la suite. Marc l'a déjà noté pour toi.",
        targetId: "stagiaire_ana",
      },
    ],
  },
  {
    id: "vie_escadron",
    label: "Vie d'escadron",
    icon: Radio,
    description: "Une matinée ordinaire dans la salle des ops — café, blagues et briefing imprévu.",
    messages: [
      {
        characterId: "eleve_kevin",
        type: "action",
        text: "arrive le premier, 7h45, met la cafetière en route",
        targetId: undefined,
      },
      {
        characterId: "eleve_reva",
        type: "dialog",
        text: "Kévin qui arrive avant l'ouverture de la salle ? Le ciel va tomber.",
        targetId: "eleve_kevin",
      },
      {
        characterId: "eleve_kevin",
        type: "dialog",
        text: "J'ai pas dormi. C'est pas pareil.",
        targetId: undefined,
      },
      {
        characterId: "fi_marc",
        type: "action",
        text: "entre avec le planning de vol modifié sous le bras",
        targetId: undefined,
      },
      {
        characterId: "fi_marc",
        type: "dialog",
        text: "Briefing dans 10 minutes. Théo, Lucie, Kévin — prévus au vol ce matin. Ana, séance sol avec Claire.",
        targetId: undefined,
      },
      {
        characterId: "eleve_theo",
        type: "dialog",
        text: "J'ai fait mon brief météo. Vent calme, visibilité 10km+, QNH 1012. Conditions parfaites.",
        targetId: "fi_marc",
      },
      {
        characterId: "fi_marc",
        type: "dialog",
        text: "Bien. T'as regardé les NOTAMs ?",
        targetId: "eleve_theo",
      },
      {
        characterId: "eleve_theo",
        type: "action",
        text: "silence gêné de 3 secondes",
        targetId: undefined,
      },
      {
        characterId: "eleve_theo",
        type: "dialog",
        text: "...Je les regarde maintenant.",
        targetId: "fi_marc",
      },
      {
        characterId: "fi_marc",
        type: "dialog",
        text: "Les NOTAMs font partie du brief météo. Toujours. Même par beau temps. Surtout par beau temps parce que tout le monde vole.",
        targetId: "eleve_theo",
      },
      {
        characterId: "eleve_lucie",
        type: "dialog",
        text: "Il y a un NOTAM sur la fréquence de Papeete ce matin — test équipement radio 08h-09h.",
        targetId: "fi_marc",
      },
      {
        characterId: "fi_marc",
        type: "dialog",
        text: "Lucie 1, Théo 0.",
        targetId: undefined,
      },
      {
        characterId: "eleve_reva",
        type: "dialog",
        text: "Théo t'inquiète, moi aussi j'ai raté les NOTAMs lors de mon premier brief. Marc m'avait regardé exactement pareil.",
        targetId: "eleve_theo",
      },
      {
        characterId: "fi_marc",
        type: "dialog",
        text: "Reva... t'étais stagiaire à l'époque. Théo est en NB. C'est moins excusable.",
        targetId: "eleve_reva",
      },
      {
        characterId: "eleve_reva",
        type: "action",
        text: "se tait en buvant son café",
        targetId: undefined,
      },
      {
        characterId: "fi_claire",
        type: "dialog",
        text: "Ana, pendant qu'on les attend — on ouvre le livret de progression. Phase PB, exercice 4 : effets primaires des gouvernes. Explique-moi.",
        targetId: "stagiaire_ana",
      },
      {
        characterId: "stagiaire_ana",
        type: "dialog",
        text: "Manche latéral : roulis. Manche longitudinal : tangage. Palonniers : lacet. Et... effet secondaire du roulis, c'est le lacet adverse.",
        targetId: "fi_claire",
      },
      {
        characterId: "fi_claire",
        type: "dialog",
        text: "Parfait. Tu as révisé.",
        targetId: "stagiaire_ana",
      },
      {
        characterId: "stagiaire_ana",
        type: "dialog",
        text: "J'ai le temps depuis 45 jours que je vole pas.",
        targetId: undefined,
      },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCharacter(id: string): Character | undefined {
  return CHARACTERS.find((c) => c.id === id);
}

function roleLabel(role: Role): string {
  return { FI: "Instructeur", PPL: "Élève PPL", STAGIAIRE: "Stagiaire" }[role];
}

function flightStatusBadge(char: Character) {
  if (char.daysSinceLastFlight === null || char.daysSinceLastFlight === undefined) return null;
  const days = char.daysSinceLastFlight;
  if (days >= 30) return <Badge className="text-[10px] bg-red-500/15 text-red-400 border-red-500/30">{days}j sans vol</Badge>;
  if (days >= 15) return <Badge className="text-[10px] bg-amber-500/15 text-amber-400 border-amber-500/30">{days}j sans vol</Badge>;
  return <Badge className="text-[10px] bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Volé il y a {days}j</Badge>;
}

// ─── Composants ───────────────────────────────────────────────────────────────

function Avatar({ char }: { char: Character }) {
  return (
    <div className={`w-9 h-9 rounded-full ${char.color} flex items-center justify-center shrink-0 text-white text-xs font-bold shadow`}>
      {char.initials}
    </div>
  );
}

function MessageBubble({ msg, characters }: { msg: Message; characters: Character[] }) {
  const char = getCharacter(msg.characterId);
  const target = msg.targetId ? getCharacter(msg.targetId) : null;
  if (!char) return null;

  if (msg.type === "system") {
    return (
      <div className="flex items-center gap-3 my-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-[11px] text-muted-foreground px-2">{msg.text}</span>
        <div className="flex-1 h-px bg-border" />
      </div>
    );
  }

  if (msg.type === "radio") {
    return (
      <div className="my-3 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex gap-3">
        <Radio className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
        <div>
          <span className="text-xs font-bold text-amber-400">{char.name} (radio) </span>
          <span className="text-sm text-foreground">{msg.text}</span>
        </div>
      </div>
    );
  }

  if (msg.type === "action") {
    return (
      <div className="flex items-center gap-2 my-1 px-2">
        <Avatar char={char} />
        <span className="text-xs text-muted-foreground italic">
          <span className="font-semibold text-foreground/60">{char.name}</span> {msg.text}
        </span>
      </div>
    );
  }

  return (
    <div className="flex gap-3 my-2 items-start">
      <Avatar char={char} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-sm font-semibold text-foreground">{char.name}</span>
          <span className={`text-[10px] uppercase tracking-wider ${char.role === "FI" ? "text-amber-400" : char.role === "STAGIAIRE" ? "text-teal-400" : "text-sky-400"}`}>
            {char.role === "FI" ? "FI" : char.phase ?? char.role}
          </span>
          {target && (
            <span className="text-[10px] text-muted-foreground">→ {target.name}</span>
          )}
          <span className="text-[10px] text-muted-foreground ml-auto">
            {msg.timestamp.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        <div className="bg-card border border-border rounded-xl rounded-tl-sm p-3 text-sm text-foreground">
          {msg.text}
        </div>
      </div>
    </div>
  );
}

function CharacterCard({ char }: { char: Character }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors">
      <Avatar char={char} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-foreground truncate">{char.name}</span>
          {char.realMemberId && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="Membre réel associé" />
          )}
        </div>
        <span className="text-[10px] text-muted-foreground">{roleLabel(char.role)}{char.phase ? ` · ${char.phase}` : ""}</span>
      </div>
      {flightStatusBadge(char)}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function OpsRoom() {
  const [activeScenario, setActiveScenario] = useState<Scenario>(SCENARIOS[0]);
  const [displayedMessages, setDisplayedMessages] = useState<Message[]>([]);
  const [playing, setPlaying] = useState(false);
  const [msgIndex, setMsgIndex] = useState(0);
  const [speed, setSpeed] = useState<1 | 2 | 3>(1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const DELAY_MS = { 1: 2200, 2: 1100, 3: 500 }[speed];

  function startScenario(scenario: Scenario) {
    setActiveScenario(scenario);
    setDisplayedMessages([]);
    setMsgIndex(0);
    setPlaying(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  function buildMessage(raw: Omit<Message, "id" | "timestamp">, index: number): Message {
    // Each message gets a timestamp spaced ~2min apart from 08:00
    const base = new Date();
    base.setHours(8, 0, 0, 0);
    base.setMinutes(base.getMinutes() + index * 2);
    return { ...raw, id: `msg-${index}`, timestamp: base };
  }

  useEffect(() => {
    if (!playing) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    if (msgIndex >= activeScenario.messages.length) {
      setPlaying(false);
      return;
    }
    intervalRef.current = setInterval(() => {
      setMsgIndex((i) => {
        if (i >= activeScenario.messages.length) {
          setPlaying(false);
          clearInterval(intervalRef.current!);
          return i;
        }
        const msg = buildMessage(activeScenario.messages[i], i);
        setDisplayedMessages((prev) => [...prev, msg]);
        return i + 1;
      });
    }, DELAY_MS);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, msgIndex, activeScenario, DELAY_MS]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayedMessages]);

  const done = msgIndex >= activeScenario.messages.length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl text-foreground flex items-center gap-3">
            <Radio className="w-7 h-7 text-primary" />
            Salle des Ops
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Simulation de la vie d'escadron C3P — personnages fictifs, situations réelles.
          </p>
        </div>
        <Badge variant="outline" className="text-[10px] text-muted-foreground border-border">
          FICTIF — SIMULATION
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Panneau gauche : membres & scénarios */}
        <div className="space-y-4">
          {/* Effectifs */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Plane className="w-3.5 h-3.5" /> Effectifs
            </h2>
            <div className="space-y-0.5">
              {CHARACTERS.map((c) => <CharacterCard key={c.id} char={c} />)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-3 border-t border-border pt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block mr-1" />
              = membre réel associé (à configurer)
            </p>
          </div>

          {/* Légende statut vol */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" /> Statut vol
            </h2>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Badge className="text-[10px] bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Volé il y a Xj</Badge>
                <span className="text-[10px] text-muted-foreground">&lt; 15 jours</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="text-[10px] bg-amber-500/15 text-amber-400 border-amber-500/30">Xj sans vol</Badge>
                <span className="text-[10px] text-muted-foreground">15–29 jours → contrôle FI</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="text-[10px] bg-red-500/15 text-red-400 border-red-500/30">Xj sans vol</Badge>
                <span className="text-[10px] text-muted-foreground">30j+ → remise en condition</span>
              </div>
            </div>
          </div>
        </div>

        {/* Zone principale : scénarios + conversations */}
        <div className="space-y-4">
          {/* Sélecteur de scénarios */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Scénarios
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => startScenario(s)}
                  className={`text-left p-3 rounded-lg border transition-all text-sm ${
                    activeScenario.id === s.id
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-background hover:border-primary/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <s.icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-medium text-xs">{s.label}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">{s.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Lecteur de conversation */}
          <div className="bg-card border border-border rounded-xl flex flex-col" style={{ minHeight: "460px" }}>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-semibold text-foreground">{activeScenario.label}</span>
              <div className="flex items-center gap-2">
                {/* Vitesse */}
                <div className="flex items-center gap-1 bg-background rounded-md border border-border p-0.5">
                  {([1, 2, 3] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setSpeed(v)}
                      className={`px-2 py-0.5 text-xs rounded transition-colors ${speed === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      {v === 1 ? "×1" : v === 2 ? "×2" : "×4"}
                    </button>
                  ))}
                </div>
                {/* Contrôles */}
                <Button
                  size="sm"
                  variant={playing ? "outline" : "default"}
                  className="h-7 text-xs"
                  onClick={() => {
                    if (done) {
                      setDisplayedMessages([]);
                      setMsgIndex(0);
                      setPlaying(true);
                    } else {
                      setPlaying(!playing);
                    }
                  }}
                >
                  {done ? "Rejouer" : playing ? "Pause" : msgIndex === 0 ? "Lancer" : "Reprendre"}
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-4 py-4">
              {displayedMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                  <ChevronDown className="w-8 h-8 mb-2 opacity-30 animate-bounce" />
                  <p className="text-sm">Lance un scénario pour voir la salle des ops s'animer</p>
                </div>
              )}
              {displayedMessages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} characters={CHARACTERS} />
              ))}
              {playing && !done && (
                <div className="flex items-center gap-2 px-12 py-2 text-muted-foreground">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-xs">en cours...</span>
                </div>
              )}
              <div ref={bottomRef} />
            </ScrollArea>

            {/* Footer */}
            {done && displayedMessages.length > 0 && (
              <div className="px-4 py-2 border-t border-border text-[11px] text-muted-foreground text-center">
                Fin de séquence · {displayedMessages.length} échanges · Cliquer "Rejouer" pour recommencer
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
