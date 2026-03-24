import { BookOpen, FileText, GraduationCap, Compass, Wind, Plane, ChevronRight, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface ContentItem {
  id: string;
  title: string;
  description: string;
  type: "course" | "quiz" | "guide" | "tool";
  phase: string;
  icon: typeof BookOpen;
  progress?: number;
}

const contents: ContentItem[] = [
  {
    id: "meteo-polynesie",
    title: "Météorologie Polynésienne",
    description: "Guide complet sur la météo locale : climat tropical, masses d'air, ZCPS et phénomènes spécifiques à la Polynésie.",
    type: "course",
    phase: "PPL",
    icon: Wind,
    progress: 60,
  },
  {
    id: "test-ppl",
    title: "Le Test PPL",
    description: "Quiz interactif pour tester vos connaissances PPL avec checklist de révision intégrée.",
    type: "quiz",
    phase: "PPL",
    icon: GraduationCap,
    progress: 100,
  },
  {
    id: "livret-progression",
    title: "Livret de Progression PPL(A)",
    description: "Suivi de votre progression en vol avec les phases PB, PP, NB, NP et compétences associées.",
    type: "guide",
    phase: "PPL",
    icon: Compass,
    progress: 40,
  },
  {
    id: "calcul-combat",
    title: "Calcul Combat",
    description: "Outil d'entraînement au calcul mental pour le pilotage : cap, vitesse, conversions rapides.",
    type: "tool",
    phase: "PPL",
    icon: Plane,
    progress: 0,
  },
  {
    id: "guide-pilote",
    title: "Guide du Pilote C3P",
    description: "Manuel complet du pilote incluant procédures, consignes et bonnes pratiques de l'école.",
    type: "guide",
    phase: "PPL",
    icon: FileText,
    progress: 25,
  },
  {
    id: "guide-fi",
    title: "Guide FI C3P",
    description: "Guide de l'instructeur : méthodologie, pédagogie et standards de formation C3P.",
    type: "guide",
    phase: "FI",
    icon: FileText,
    progress: 0,
  },
  {
    id: "guide-boulet",
    title: "Guide du Boulet VT2 PN",
    description: "Guide de survie humoristique pour les élèves — conseils pratiques et pièges à éviter.",
    type: "guide",
    phase: "PPL",
    icon: BookOpen,
    progress: 0,
  },
  {
    id: "retours-ppl",
    title: "Retours PPL C3P",
    description: "Compilation des retours d'expérience des anciens élèves sur le test PPL.",
    type: "guide",
    phase: "PPL",
    icon: FileText,
    progress: 0,
  },
];

const typeLabels: Record<string, { label: string; className: string }> = {
  course: { label: "Cours", className: "bg-info/15 text-info border-info/20" },
  quiz: { label: "Quiz", className: "bg-success/15 text-success border-success/20" },
  guide: { label: "Guide", className: "bg-primary/15 text-primary border-primary/20" },
  tool: { label: "Outil", className: "bg-warning/15 text-warning border-warning/20" },
};

const typeFilters = ["all", "course", "quiz", "guide", "tool"] as const;
const typeFilterLabels: Record<string, string> = {
  all: "Tout",
  course: "Cours",
  quiz: "Quiz",
  guide: "Guides",
  tool: "Outils",
};

export default function Library() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const filtered = contents.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || c.type === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">Bibliothèque</h1>
        <p className="text-muted-foreground mt-1">Tous tes contenus de formation, au même endroit.</p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un contenu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
        <div className="flex gap-1.5">
          {typeFilters.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === t
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              {typeFilterLabels[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map((item) => (
          <Card
            key={item.id}
            className="bg-card border-border shadow-card hover:border-primary/30 transition-all cursor-pointer group"
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-lg bg-accent flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                  <item.icon className="w-5 h-5 text-accent-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-foreground truncate">{item.title}</h3>
                    <Badge variant="outline" className={`shrink-0 text-[10px] ${typeLabels[item.type].className}`}>
                      {typeLabels[item.type].label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
                      {item.phase}
                    </Badge>
                    <div className="flex items-center gap-2">
                      {item.progress !== undefined && item.progress > 0 && (
                        <span className="text-[10px] text-muted-foreground">{item.progress}%</span>
                      )}
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Aucun contenu trouvé.</p>
        </div>
      )}
    </div>
  );
}
