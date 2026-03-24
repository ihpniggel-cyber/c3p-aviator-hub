import { BookOpen, Trophy, Clock, TrendingUp, Flame, Target, Star, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

const stats = [
  { label: "Cours lus", value: 3, total: 12, icon: BookOpen, color: "text-info" },
  { label: "Quiz réussis", value: 1, total: 8, icon: Trophy, color: "text-success" },
  { label: "Heures d'étude", value: 4.5, icon: Clock, color: "text-primary" },
  { label: "Série en cours", value: 2, suffix: "jours", icon: Flame, color: "text-warning" },
];

const recentContent = [
  { title: "Météorologie Polynésienne", type: "Cours", progress: 60, phase: "PPL" },
  { title: "Le Test PPL", type: "Quiz", progress: 100, phase: "PPL" },
  { title: "Guide du Pilote C3P", type: "Guide", progress: 25, phase: "PPL" },
];

const encouragements = [
  "Continue comme ça ! 🛫 Tu progresses bien en météo.",
  "N'oublie pas de réviser le guide FI cette semaine.",
  "2 jours de suite d'étude — maintiens le cap ! ✈️",
];

export default function Dashboard() {
  const { user } = useAuth();
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "Pilote";

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="font-display text-3xl text-foreground">
          Ia ora na, <span className="text-gradient-gold">{firstName}</span> 👋
        </h1>
        <p className="text-muted-foreground mt-1">Voici ton tableau de bord de progression.</p>
      </div>

      {/* Encouragement Banner */}
      <div className="bg-gradient-gold rounded-xl p-4 shadow-gold">
        <div className="flex items-center gap-3">
          <Star className="w-5 h-5 text-primary-foreground shrink-0" />
          <p className="text-primary-foreground font-medium text-sm">
            {encouragements[Math.floor(Math.random() * encouragements.length)]}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-card border-border shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-display text-foreground">{stat.value}</span>
                {stat.total && <span className="text-sm text-muted-foreground">/{stat.total}</span>}
                {stat.suffix && <span className="text-sm text-muted-foreground">{stat.suffix}</span>}
              </div>
              {stat.total && (
                <Progress value={(stat.value / stat.total) * 100} className="mt-2 h-1.5" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Overall Progress */}
      <Card className="bg-card border-border shadow-card">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Progression globale — PPL
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Progress value={25} className="h-3" />
            </div>
            <span className="text-2xl font-display text-primary">25%</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Tu as complété 5 éléments sur 20. Continue à explorer la bibliothèque !
          </p>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-foreground flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Activité récente
          </h2>
          <Link to="/library" className="text-sm text-primary hover:text-gold-light flex items-center gap-1">
            Voir tout <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="space-y-3">
          {recentContent.map((item) => (
            <div
              key={item.title}
              className="flex items-center gap-4 bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-accent-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.type} · {item.phase}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Progress value={item.progress} className="w-20 h-1.5" />
                <span className="text-xs text-muted-foreground w-8 text-right">{item.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
