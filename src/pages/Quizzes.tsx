import { GraduationCap, ChevronRight, CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Quiz {
  id: string;
  title: string;
  questions: number;
  completed: boolean;
  score?: number;
  phase: string;
}

const quizzes: Quiz[] = [
  { id: "test-ppl", title: "Le Test PPL", questions: 40, completed: true, score: 85, phase: "PPL" },
  { id: "meteo-qcm", title: "QCM Météo Polynésie", questions: 20, completed: false, phase: "PPL" },
  { id: "reglementation", title: "Réglementation Aérienne", questions: 30, completed: false, phase: "PPL" },
  { id: "navigation", title: "Navigation & Cartographie", questions: 25, completed: false, phase: "PPL" },
  { id: "meca-vol", title: "Mécanique du Vol", questions: 20, completed: false, phase: "PPL" },
  { id: "facteurs-humains", title: "Facteurs Humains", questions: 15, completed: false, phase: "PPL" },
];

export default function Quizzes() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">Quiz & Tests</h1>
        <p className="text-muted-foreground mt-1">Teste tes connaissances et prépare tes examens.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {quizzes.map((quiz) => (
          <Card
            key={quiz.id}
            className={`bg-card border-border shadow-card hover:border-primary/30 transition-all cursor-pointer group ${
              quiz.completed ? "border-success/20" : ""
            }`}
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${
                  quiz.completed ? "bg-success/10" : "bg-accent"
                }`}>
                  {quiz.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  ) : (
                    <GraduationCap className="w-5 h-5 text-accent-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground">{quiz.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {quiz.questions} questions · {quiz.phase}
                  </p>
                  {quiz.completed && quiz.score !== undefined && (
                    <div className="mt-2">
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs">
                        Score : {quiz.score}%
                      </Badge>
                    </div>
                  )}
                  {!quiz.completed && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-primary group-hover:text-gold-light transition-colors">
                      Commencer <ChevronRight className="w-3 h-3" />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
