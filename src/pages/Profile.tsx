import { User, Mail, Award, BookOpen, GraduationCap, Calendar, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

const achievements = [
  { label: "Premier cours lu", icon: "📖", earned: true },
  { label: "Quiz parfait", icon: "🏆", earned: false },
  { label: "7 jours consécutifs", icon: "🔥", earned: false },
  { label: "Météo maîtrisée", icon: "🌤", earned: false },
  { label: "Navigateur", icon: "🧭", earned: false },
  { label: "Prêt pour le test", icon: "✈️", earned: false },
];

const progressByDomain = [
  { domain: "Météorologie", progress: 60 },
  { domain: "Réglementation", progress: 0 },
  { domain: "Navigation", progress: 10 },
  { domain: "Mécanique du vol", progress: 0 },
  { domain: "Facteurs humains", progress: 0 },
  { domain: "Procédures C3P", progress: 25 },
];

export default function Profile() {
  const { user } = useAuth();
  const name = user?.user_metadata?.full_name || "Pilote";
  const role = user?.user_metadata?.role || "student";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card className="bg-card border-border shadow-card overflow-hidden">
        <div className="h-24 bg-gradient-gold relative">
          <div className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `repeating-linear-gradient(-8deg, transparent, transparent 20px, rgba(255,255,255,0.1) 20px, rgba(255,255,255,0.1) 21px)`,
            }}
          />
        </div>
        <CardContent className="pt-0 pb-6 px-6 relative">
          <div className="flex items-end gap-4 -mt-8">
            <div className="w-16 h-16 rounded-xl bg-secondary border-4 border-card flex items-center justify-center shrink-0">
              <User className="w-7 h-7 text-primary" />
            </div>
            <div className="pb-1">
              <h1 className="font-display text-2xl text-foreground">{name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                  {role === "instructor" ? "Instructeur" : "Élève"}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Mail className="w-3 h-3" /> {user?.email}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-card border-border shadow-card">
          <CardContent className="p-4 text-center">
            <BookOpen className="w-5 h-5 text-info mx-auto mb-1" />
            <p className="text-2xl font-display text-foreground">3</p>
            <p className="text-xs text-muted-foreground">Cours lus</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-card">
          <CardContent className="p-4 text-center">
            <GraduationCap className="w-5 h-5 text-success mx-auto mb-1" />
            <p className="text-2xl font-display text-foreground">1</p>
            <p className="text-xs text-muted-foreground">Quiz réussis</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-card">
          <CardContent className="p-4 text-center">
            <Calendar className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-display text-foreground">2</p>
            <p className="text-xs text-muted-foreground">Jours actifs</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress by domain */}
      <Card className="bg-card border-border shadow-card">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Progression par domaine
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {progressByDomain.map((d) => (
            <div key={d.domain} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-foreground">{d.domain}</span>
                <span className="text-muted-foreground">{d.progress}%</span>
              </div>
              <Progress value={d.progress} className="h-2" />
              {d.progress === 0 && (
                <p className="text-[11px] text-warning">
                  💡 Ce domaine attend tes premières révisions !
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card className="bg-card border-border shadow-card">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Badges & Récompenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {achievements.map((a) => (
              <div
                key={a.label}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
                  a.earned
                    ? "border-primary/30 bg-primary/5"
                    : "border-border bg-muted/30 opacity-40"
                }`}
              >
                <span className="text-2xl">{a.icon}</span>
                <span className="text-[10px] text-center text-muted-foreground leading-tight">{a.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
