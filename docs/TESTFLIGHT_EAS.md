Contexte:
- Repo: BoatAcademy
- App cible: apps/student-mobile (Expo / React Native)
- Dev actuel: Expo Go + Supabase local
- Objectif: Mettre en place workflow TestFlight + EAS Update (OTA) + Dev Client pour tests natifs/push notifications.
- Contrainte: Je suis sur Windows donc pas de build iOS local; on utilise EAS Build cloud.

Livrables attendus (OBLIGATOIRES):
1) Ajouter et configurer EAS Build + EAS Update:
   - Créer/mettre à jour eas.json avec 3 profils:
     a) development: dev-client (distribution internal), channel "development"
     b) preview: distribution "store" (TestFlight), channel "preview"
     c) production: channel "production"
   - Configurer expo-updates via `eas update:configure` (ou équivalent manuel), en s'assurant que:
     - app.json/app.config contient updates.url (EAS project URL)
     - runtimeVersion est défini (policy: "appVersion" recommandé)
     - extra.eas.projectId est présent

2) Variables d'environnement Supabase par environnement:
   - Development (dev-client) doit pointer vers Supabase local accessible depuis device:
     - EXPO_PUBLIC_SUPABASE_URL = "http://<LAN_IP_PC>:54321" (pas localhost)
     - EXPO_PUBLIC_SUPABASE_ANON_KEY = valeur locale (placeholder si nécessaire)
   - Preview/Production doivent pointer vers Supabase cloud (staging/prod):
     - EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
   - Mettre la config env dans eas.json (champ "env") ET documenter comment remplacer par EAS Secrets si souhaité.
   - Ajouter une vérification au runtime (console.warn) si URL contient "localhost" sur device.

3) Scripts DX:
   - Ajouter dans package.json (apps/student-mobile) des scripts utiles:
     - "start:devclient": "expo start --dev-client"
     - "build:dev:android": "eas build -p android --profile development"
     - "build:dev:ios": "eas build -p ios --profile development"
     - "build:preview:ios": "eas build -p ios --profile preview"
     - "submit:ios": "eas submit -p ios --latest"
     - "update:preview": "eas update --channel preview --message"
     - "update:prod": "eas update --channel production --message"

4) Documentation:
   - Créer un doc clair: docs/DEPLOYMENT_TESTFLIGHT_EAS.md (ou update docs/PHASES.md) expliquant:
     - Expo Go vs Dev Client vs TestFlight
     - Commandes exactes pour:
       a) créer dev client (android et ios cloud)
       b) installer dev client et lancer `expo start --dev-client`
       c) build preview iOS + submit TestFlight
       d) push une update OTA sur channel preview
       e) quand un rebuild est obligatoire (changement natif/config/plugins)
     - Comment gérer Supabase local vs staging/prod

5) Robustesse:
   - S'assurer que le projet compile.
   - Ne pas casser Expo Go (tant que pas de modules natifs ajoutés).
   - Si des plugins/config iOS sont nécessaires (ex: notifications), les laisser compatibles EAS.

Contraintes / style:
- Fais des modifications minimales, propres, commentées.
- Donne-moi un plan de commandes à exécuter sur Windows à la fin.
- Indique clairement les placeholders (ex: SUPABASE_STAGING_URL) et où les remplir.
- Fais un commit par groupe logique (config EAS, scripts, docs) et propose des messages de commit.

Étapes d’exécution attendues par Claude:
A) Inspecter la config actuelle (app.json/app.config, package.json, structure monorepo)
B) Implémenter EAS update: configure, eas.json, runtimeVersion
C) Ajouter env par profils et scripts
D) Ajouter doc + checklist
E) Afficher les commandes finales à lancer (eas login, eas build, eas submit, eas update)

Go.
