import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plane } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"student" | "instructor">("student");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, role },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast({
          title: "Compte créé !",
          description: "Vérifiez votre email pour confirmer votre inscription.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-navy p-4">
      {/* Background texture */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(-8deg, transparent, transparent 38px, hsl(42 60% 53%) 38px, hsl(42 60% 53%) 39px)`,
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-gold shadow-gold mb-4">
            <Plane className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl text-foreground">C3P</h1>
          <p className="text-muted-foreground text-sm mt-1">Centre de Formation Aéronautique — Polynésie</p>
        </div>

        {/* Form Card */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-card">
          <h2 className="font-display text-xl text-foreground mb-6">
            {isLogin ? "Connexion" : "Créer un compte"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <Label htmlFor="fullName" className="text-muted-foreground text-xs uppercase tracking-wider">Nom complet</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jean Dupont"
                    className="mt-1 bg-muted border-border"
                    required
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Rôle</Label>
                  <div className="flex gap-2 mt-1">
                    <Button
                      type="button"
                      variant={role === "student" ? "gold" : "gold-outline"}
                      size="sm"
                      onClick={() => setRole("student")}
                      className="flex-1"
                    >
                      Élève
                    </Button>
                    <Button
                      type="button"
                      variant={role === "instructor" ? "gold" : "gold-outline"}
                      size="sm"
                      onClick={() => setRole("instructor")}
                      className="flex-1"
                    >
                      Instructeur
                    </Button>
                  </div>
                </div>
              </>
            )}

            <div>
              <Label htmlFor="email" className="text-muted-foreground text-xs uppercase tracking-wider">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pilote@c3p.pf"
                className="mt-1 bg-muted border-border"
                required
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-muted-foreground text-xs uppercase tracking-wider">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 bg-muted border-border"
                required
                minLength={6}
              />
            </div>

            <Button type="submit" variant="gold" className="w-full" disabled={loading}>
              {loading ? "Chargement..." : isLogin ? "Se connecter" : "S'inscrire"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:text-gold-light transition-colors"
            >
              {isLogin ? "Pas encore de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
