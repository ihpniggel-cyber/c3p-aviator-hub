# CLAUDE.md — C3P Aviator Hub
## Note permanente de Claude pour reprendre le travail immédiatement

**Lis ce fichier en entier avant de faire quoi que ce soit.**
Dernière mise à jour : 27 juillet 2026

---

## 0. QUI EST PASCAL

Pascal Niggel — instructeur FI (Flight Instructor) et psychologue clinicien.
École : **C3P — Centre Polynésien de Perfectionnement au Pilotage**
Certificat ATO : FR.ATO.0055 | Aéroport : NTAA Tahiti-Faa'a (Polynésie française)
Email : ihpniggel@gmail.com

**Style de travail de Pascal :**
- Exigeant sur la rigueur factuelle : ne jamais inventer de contenu pédagogique
- Apprécie l'honnêteté sur les erreurs plutôt que la correction silencieuse
- "Des faits, rien que des faits" — pas de dramatisation narrative
- Sanctionne les fausses précisions (numéros inventés, intitulés de vol fabriqués)

---

## 1. DEUX PROJETS EN COURS

### A) C3P Aviator Hub (ce repo)
Application web React pour les élèves et instructeurs C3P.

**Stack :** React 18 + TypeScript + Vite + Supabase + Tailwind CSS + shadcn/ui
**Auth :** Supabase Auth (email/password)
**Base de données :** Supabase (PostgreSQL)

**Routes actuelles :**
- `/` → Dashboard (page principale après connexion)
- `/auth` → AuthPage (login/signup)
- `/library` → Library (bibliothèque de ressources)
- `/quizzes` → Quizzes (tests et exercices)
- `/profile` → Profile (profil élève)
- `/atterrissage` → LandingAnimation (animation atterrissage piste 04 NTAA)

**Derniers commits significatifs :**
- feat: animation atterrissage avion léger piste 04 NTAA Tahiti-Faa'a
- Amélioré affichage auth
- Fix auth client path / Fix Supabase keys mismatch

**Branche de travail Claude :** `claude/auto-save-drive-ppl-2pgw4w`

**Pour démarrer en dev :**
```bash
npm install   # ou bun install
npm run dev   # ou bun dev
```

---

### B) Planning Prépa PPL (projet HTML autonome — SÉPARÉ)
Outil HTML interactif pour la Promotion PPL(A) 2026 (7 élèves, E1-E7).
Couvre théorie intensive (31 août–9 sept) + vols (à partir 10 sept–fin mars/avril).

**Fichier livrable :** `C3P_Planning_Septembre2026_PrepaPPL_Vn.html` (n = dernier numéro)
**Dernière version connue :** V13 (147 Ko, complet)

**LECTURE OBLIGATOIRE avant toute modification du Planning :**
→ Lire le document **"Genèse Planning Prépa PPL"** sur Drive (ID: `1uaP676ugz-rTodEFFkEgWCLmYdkw_xdYsM9HnuMgejM`)
Il contient l'historique complet des V1-V13, les 51 PDP, les principes, les bugs corrigés.

---

## 2. DOSSIERS DRIVE (IDs)

| Dossier | ID Drive |
|---------|----------|
| Source "Planning Prépa PPL" | `1gXzQ4_eOn55p3KhmvJrr_VEKOgQEQ5JH` |
| "Reprise du projet" (backups) | `1rZpn8WPjNMlA93UMWORqxGXf8-Yt04De` |
| "Planning Prépa PPL 2026-Septembre" (backup) | `1YEFHbBGgX6-8Zs2ZV6T4Ju0PLUU1ZFl5` |
| Genèse (Google Doc) | `1uaP676ugz-rTodEFFkEgWCLmYdkw_xdYsM9HnuMgejM` |
| V13 HTML (fichier source) | `1uNJocf4o6bhlFjVwV6P6vr93NQgR5hNG` |

**Méthode upload Drive pour gros fichiers HTML (>45 Ko) :**
Toujours utiliser `copy_file` (copie interne Drive) plutôt que `create_file` (upload depuis contenu).
`create_file` tronque les fichiers volumineux. `copy_file` est fiable à n'importe quelle taille.

---

## 3. CHARTE GRAPHIQUE C3P (pour tous les outils HTML)

```css
--c3p-navy:      #1B2A4A   /* fond header, titres forts */
--c3p-navy-soft: #2A3A5C
--c3p-navy-deep: #0F1A30
--c3p-gold:      #C8A951   /* accents, bordures titre */
--c3p-gold-soft: #D4BB6E
--c3p-gold-deep: #A8893A
--c3p-paper:     #F5F2EA   /* fond page */
--c3p-ink:       #1A1A1A
--c3p-success:   #4A7A4A
--c3p-warning:   #C87A2A
--c3p-danger:    #A8453A
```

**Polices :** Playfair Display (titres) · Source Serif 4 (corps) · JetBrains Mono (données/code)
**Composants :** filets or plutôt qu'ombres portées
**Skill disponible :** `c3p-design-system` (invoke avec Skill tool avant tout travail HTML C3P)

---

## 4. AUTO-SAVE DRIVE — PROTOCOLE

Un système de sauvegarde automatique est en place :
- **Routine horaire** (Trigger ID: `trig_01Y22EHgph7SpHKFRoa639QZ`) — relance cette session
- **send_later chaîné** toutes les 20 min — actif pendant les sessions ouvertes

**Pour sauvegarder à la demande** : Pascal dit "sauvegarde" ou "save now" →
1. Chercher le dernier HTML dans le dossier source
2. Copier dans le bon sous-dossier de "Reprise du projet" avec `copy_file`
3. Confirmer en une ligne

**Pour remettre en place la chaîne 20 min si la session a été interrompue :**
```
send_later(delay_minutes=20, message="AUTO-SAVE 20MIN...")
```

---

## 5. PRINCIPES À NE JAMAIS VIOLER

1. **Ne jamais inventer** de contenu pédagogique (intitulés de vol, numéros de module, progressions fictives)
2. **Versionnage strict** : toujours un numéro qui s'incrémente, jamais "final" ou "v2-bis"
3. **Valider avant livraison** (checklist du skill `c3p-design-system`) : IDs HTML uniques, JS validé par `node --check`, boutons testés mentalement
4. **Cohérence PDP↔VOL** : tout PDP théorique nécessaire à un vol doit être enseigné l'après-midi qui précède, jamais après coup
5. **Auto-critique** sur les bugs plutôt que correction silencieuse

---

## 6. PROTOCOLE DE REPRISE DE SESSION

Quand une nouvelle session démarre (reset de contexte, nouvelle conversation) :

**Étape 1 — Contexte automatique** (déjà fait si tu lis ce fichier)

**Étape 2 — Pour le Planning PPL** : lire la Genèse sur Drive
```
mcp__Google_Drive__read_file_content(fileId: "1uaP676ugz-rTodEFFkEgWCLmYdkw_xdYsM9HnuMgejM")
```

**Étape 3 — Pour l'Aviator Hub** : lire l'état du repo
```bash
git log --oneline -10
git status
```

**Étape 4 — Remettre l'auto-save en place**
```
send_later(delay_minutes=20, message="AUTO-SAVE 20MIN — [même procédure]")
```

**Étape 5 — Demander à Pascal** : "Je suis de retour. J'ai relu le contexte. Sur quoi on continue ?"

---

## 7. CE QUI RESTE OUVERT

### Planning PPL :
- Contenu Aérogligli réel (Pascal doit fournir les modules précis)
- Incrustations Guide du Boulet / manuel sécu non cochées
- 10 séances du livret DC avec "connaissances requises" incomplètes (44/54 extraites)
- Suite octobre → mars (non construite jour par jour)
- Noms réels E1-E7 (placeholders à remplacer par find/replace dans le HTML)

### Aviator Hub :
- Contenu Dashboard (page principale à construire)
- Library (bibliothèque à connecter à Supabase)
- Quizzes (moteur de quiz à brancher sur les données C3P)
- Profile (fiche élève liée à Supabase)
