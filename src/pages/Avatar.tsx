import { useState, useRef, useCallback } from "react";
import {
  Video, Upload, Play, Download, RefreshCw, Loader2,
  Settings2, Image, Mic, CheckCircle2, AlertCircle, ExternalLink
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

type Status = "idle" | "uploading" | "generating" | "done" | "error";

interface Params {
  still_mode: boolean;
  use_enhancer: boolean;
  expression_scale: number;
  pose_style: number;
  preprocess: "crop" | "extcrop" | "resize" | "full";
}

const DEFAULT_URL = "http://localhost:7860";

async function uploadToGradio(serverUrl: string, file: File): Promise<string> {
  const form = new FormData();
  form.append("files", file);
  const res = await fetch(`${serverUrl}/upload`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Upload échoué (HTTP ${res.status})`);
  const json = await res.json();
  return json[0].name as string;
}

async function callSadTalker(
  serverUrl: string,
  imagePath: string,
  audioPath: string,
  params: Params
): Promise<string> {
  const body = {
    data: [
      { name: imagePath, data: null, is_file: true },
      { name: audioPath, data: null, is_file: true },
      params.preprocess,
      params.still_mode,
      params.use_enhancer,
      1,
      256,
      params.pose_style,
      params.expression_scale,
      false, null, "pose", false, 10, false, false,
    ],
    fn_index: 0,
  };

  const res = await fetch(`${serverUrl}/api/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Génération échouée (HTTP ${res.status})`);
  const json = await res.json();

  if (json.error) throw new Error(json.error);
  const output = json.data?.[0];
  if (!output) throw new Error("Aucune vidéo retournée par SadTalker");
  const path = typeof output === "string" ? output : output.name;
  return `${serverUrl}/file=${path}`;
}

function DropZone({
  label, icon: Icon, accept, file, onFile,
}: {
  label: string;
  icon: typeof Image;
  accept: string;
  file: File | null;
  onFile: (f: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  }, [onFile]);

  return (
    <div
      className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
        ${dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
      />
      {file ? (
        <div className="flex flex-col items-center gap-2">
          <CheckCircle2 className="w-6 h-6 text-success" />
          <p className="text-sm font-medium text-foreground truncate max-w-[200px]">{file.name}</p>
          <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} Ko</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Icon className="w-8 h-8 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">Glisser-déposer ou cliquer</p>
        </div>
      )}
    </div>
  );
}

export default function Avatar() {
  const { toast } = useToast();
  const [serverUrl, setServerUrl] = useState(DEFAULT_URL);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [params, setParams] = useState<Params>({
    still_mode: true,
    use_enhancer: false,
    expression_scale: 1.0,
    pose_style: 0,
    preprocess: "crop",
  });
  const [status, setStatus] = useState<Status>("idle");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canGenerate = imageFile && audioFile && status !== "uploading" && status !== "generating";

  const handleGenerate = async () => {
    if (!imageFile || !audioFile) return;
    setStatus("uploading");
    setVideoUrl(null);
    setErrorMsg(null);

    try {
      const [imgPath, audPath] = await Promise.all([
        uploadToGradio(serverUrl, imageFile),
        uploadToGradio(serverUrl, audioFile),
      ]);

      setStatus("generating");
      const url = await callSadTalker(serverUrl, imgPath, audPath, params);
      setVideoUrl(url);
      setStatus("done");
      toast({ title: "Vidéo générée", description: "SadTalker a terminé." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      setStatus("error");
      toast({ title: "Erreur SadTalker", description: msg, variant: "destructive" });
    }
  };

  const handleReset = () => {
    setStatus("idle");
    setVideoUrl(null);
    setErrorMsg(null);
    setImageFile(null);
    setAudioFile(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-foreground flex items-center gap-3">
            <Video className="w-7 h-7 text-primary" />
            Instructeur Virtuel
          </h1>
          <p className="text-muted-foreground mt-1">
            Anime un portrait avec une piste audio via SadTalker (local).
          </p>
        </div>
        <Badge
          variant="outline"
          className={status === "done"
            ? "border-success/40 text-success"
            : status === "error"
            ? "border-destructive/40 text-destructive"
            : status === "generating" || status === "uploading"
            ? "border-primary/40 text-primary animate-pulse"
            : "border-border text-muted-foreground"
          }
        >
          {status === "idle" && "En attente"}
          {status === "uploading" && "Envoi…"}
          {status === "generating" && "Génération…"}
          {status === "done" && "Terminé"}
          {status === "error" && "Erreur"}
        </Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left — Inputs */}
        <div className="space-y-4">
          {/* Server URL */}
          <Card className="bg-card border-border shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-primary" />
                Serveur SadTalker
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value.replace(/\/$/, ""))}
                  placeholder="http://localhost:7860"
                  className="font-mono text-sm bg-background border-border"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const res = await fetch(`${serverUrl}/info`, { signal: AbortSignal.timeout(3000) });
                      if (res.ok) toast({ title: "SadTalker accessible ✓" });
                      else throw new Error(`HTTP ${res.status}`);
                    } catch {
                      toast({ title: "Serveur inaccessible", description: "Lance SadTalker via Pinokio.", variant: "destructive" });
                    }
                  }}
                >
                  Test
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Lance SadTalker dans Pinokio, puis colle l'URL affichée.
              </p>
            </CardContent>
          </Card>

          {/* Files */}
          <Card className="bg-card border-border shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Upload className="w-4 h-4 text-primary" />
                Fichiers source
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Portrait (JPG / PNG)</Label>
                <DropZone label="Photo du visage" icon={Image} accept="image/*" file={imageFile} onFile={setImageFile} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Audio pilote (MP3 / WAV)</Label>
                <DropZone label="Piste audio" icon={Mic} accept="audio/*" file={audioFile} onFile={setAudioFile} />
              </div>
            </CardContent>
          </Card>

          {/* Params */}
          <Card className="bg-card border-border shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-primary" />
                Paramètres
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">Mode stable</p>
                  <p className="text-xs text-muted-foreground">Réduit les mouvements de tête</p>
                </div>
                <Switch
                  checked={params.still_mode}
                  onCheckedChange={(v) => setParams((p) => ({ ...p, still_mode: v }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">Enhancer GFPGAN</p>
                  <p className="text-xs text-muted-foreground">Améliore la qualité du visage (plus lent)</p>
                </div>
                <Switch
                  checked={params.use_enhancer}
                  onCheckedChange={(v) => setParams((p) => ({ ...p, use_enhancer: v }))}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground">Expression</span>
                  <span className="text-muted-foreground font-mono">{params.expression_scale.toFixed(1)}</span>
                </div>
                <Slider
                  min={0.5} max={2.0} step={0.1}
                  value={[params.expression_scale]}
                  onValueChange={([v]) => setParams((p) => ({ ...p, expression_scale: v }))}
                />
                <p className="text-xs text-muted-foreground">Amplitude des expressions faciales</p>
              </div>
            </CardContent>
          </Card>

          {/* Action */}
          <div className="flex gap-3">
            <Button
              className="flex-1 bg-gradient-gold hover:opacity-90 text-primary-foreground font-semibold shadow-gold"
              disabled={!canGenerate}
              onClick={handleGenerate}
            >
              {(status === "uploading" || status === "generating") ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {status === "uploading" ? "Envoi des fichiers…" : "Génération en cours…"}
                </>
              ) : (
                <><Play className="w-4 h-4 mr-2" />Générer la vidéo</>
              )}
            </Button>
            {(status === "done" || status === "error") && (
              <Button variant="outline" onClick={handleReset}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Right — Result */}
        <div className="space-y-4">
          <Card className="bg-card border-border shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Video className="w-4 h-4 text-primary" />
                Résultat
              </CardTitle>
            </CardHeader>
            <CardContent>
              {status === "idle" && (
                <div className="aspect-video bg-muted/30 rounded-lg flex flex-col items-center justify-center gap-3 border border-dashed border-border">
                  <Video className="w-10 h-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">La vidéo apparaîtra ici</p>
                </div>
              )}

              {(status === "uploading" || status === "generating") && (
                <div className="aspect-video bg-muted/30 rounded-lg flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <p className="text-sm text-foreground font-medium">
                    {status === "uploading" ? "Envoi des fichiers vers SadTalker…" : "Animation en cours…"}
                  </p>
                  <p className="text-xs text-muted-foreground">Peut prendre 1 à 3 minutes selon le GPU</p>
                </div>
              )}

              {status === "error" && (
                <div className="aspect-video bg-destructive/5 rounded-lg flex flex-col items-center justify-center gap-3 border border-destructive/20">
                  <AlertCircle className="w-10 h-10 text-destructive" />
                  <p className="text-sm font-medium text-destructive">Erreur de génération</p>
                  <p className="text-xs text-muted-foreground text-center px-4">{errorMsg}</p>
                </div>
              )}

              {status === "done" && videoUrl && (
                <div className="space-y-3">
                  <video
                    src={videoUrl}
                    controls
                    autoPlay
                    className="w-full rounded-lg border border-border"
                  />
                  <Button asChild variant="outline" className="w-full">
                    <a href={videoUrl} download="avatar-c3p.mp4">
                      <Download className="w-4 h-4 mr-2" />
                      Télécharger la vidéo
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="bg-accent/30 border-border shadow-card">
            <CardContent className="p-4 space-y-2">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Conseils</p>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li>• Photo nette, visage bien cadré, fond neutre</li>
                <li>• Audio clair, sans bruit de fond</li>
                <li>• Mode stable recommandé pour cours pédagogiques</li>
                <li>• Enhancer améliore la qualité mais double le temps</li>
                <li>• Longueur max conseillée : 30–60 secondes</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
