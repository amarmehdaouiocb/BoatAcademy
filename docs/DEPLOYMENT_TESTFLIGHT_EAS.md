# Deployment Guide - TestFlight & EAS

> Guide complet pour builder, deployer et mettre a jour l'app student-mobile via EAS.

## Vue d'ensemble

| Mode | Usage | Push Notifs | Supabase |
|------|-------|-------------|----------|
| **Expo Go** | Dev rapide, pas de modules natifs | Non | Local |
| **Dev Client** | Dev avec modules natifs (push, etc.) | Oui | Local (LAN IP) |
| **Preview/TestFlight** | Tests internes | Oui | Staging |
| **Production** | App Store | Oui | Production |

---

## 1. Setup initial (une seule fois)

### 1.1 Installer EAS CLI

```powershell
npm install -g eas-cli
```

### 1.2 Se connecter a Expo

```powershell
eas login
```

### 1.3 Configurer le projet EAS

```powershell
cd apps/student-mobile
eas init
```

Ceci va:
- Creer un projet sur expo.dev
- Generer un `projectId`
- **IMPORTANT**: Copier le projectId genere dans `app.json`:

```json
{
  "expo": {
    "updates": {
      "url": "https://u.expo.dev/VOTRE_PROJECT_ID"
    },
    "extra": {
      "eas": {
        "projectId": "VOTRE_PROJECT_ID"
      }
    }
  }
}
```

### 1.4 Configurer les variables d'environnement

Editer `eas.json` et remplacer les placeholders:

**Development** (Supabase local):
```json
"env": {
  "EXPO_PUBLIC_SUPABASE_URL": "http://192.168.1.XX:54321",
  "EXPO_PUBLIC_SUPABASE_ANON_KEY": "eyJ..."
}
```

> Obtenir votre IP LAN: `ipconfig` (Windows) ou `ifconfig` (Mac/Linux)

**Preview/Production** (Supabase cloud):
```json
"env": {
  "EXPO_PUBLIC_SUPABASE_URL": "https://xxxxx.supabase.co",
  "EXPO_PUBLIC_SUPABASE_ANON_KEY": "eyJ..."
}
```

### 1.5 (Optionnel) Utiliser EAS Secrets

Pour ne pas commiter les secrets:

```powershell
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://xxx.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "eyJ..."
```

Puis dans `eas.json`, remplacer les valeurs par des references:
```json
"env": {
  "EXPO_PUBLIC_SUPABASE_URL": "${EXPO_PUBLIC_SUPABASE_URL}",
  "EXPO_PUBLIC_SUPABASE_ANON_KEY": "${EXPO_PUBLIC_SUPABASE_ANON_KEY}"
}
```

---

## 2. Dev Client (tests natifs locaux)

Le Dev Client est une version custom d'Expo Go avec vos modules natifs.

### 2.1 Builder le Dev Client

**Android:**
```powershell
cd apps/student-mobile
pnpm build:dev:android
# ou: eas build -p android --profile development
```

**iOS (build cloud):**
```powershell
pnpm build:dev:ios
# ou: eas build -p ios --profile development
```

### 2.2 Installer le Dev Client

1. Aller sur https://expo.dev/accounts/[votre-compte]/projects/boat-academy-student/builds
2. Telecharger le build `.apk` (Android) ou scanner le QR code (iOS)
3. Installer sur votre device

### 2.3 Lancer le dev server

```powershell
pnpm start:devclient
# ou: expo start --dev-client
```

Scanner le QR code avec l'app Dev Client installee.

---

## 3. TestFlight (tests internes iOS)

### 3.1 Prerequis Apple

1. Compte Apple Developer ($99/an)
2. App creee sur App Store Connect
3. Certificats configures (EAS peut les generer automatiquement)

### 3.2 Build Preview pour TestFlight

```powershell
pnpm build:preview:ios
# ou: eas build -p ios --profile preview
```

### 3.3 Soumettre a TestFlight

```powershell
pnpm submit:ios
# ou: eas submit -p ios --latest
```

Configurer dans `eas.json` > `submit` > `production` > `ios`:
- `appleId`: votre email Apple Developer
- `ascAppId`: ID de l'app sur App Store Connect

### 3.4 Inviter des testeurs

1. App Store Connect > TestFlight > Internal Testing
2. Ajouter des testeurs (email)
3. Ils recevront une invitation

---

## 4. Updates OTA (Over-The-Air)

Les updates OTA permettent de pousser du code JS sans rebuild.

### 4.1 Quand utiliser OTA vs Rebuild

| Changement | OTA possible | Rebuild obligatoire |
|------------|--------------|---------------------|
| Code JS/TS | Oui | Non |
| Styles/UI | Oui | Non |
| Assets (images) | Oui | Non |
| Nouveau plugin expo | Non | Oui |
| Changement app.json (version, permissions) | Non | Oui |
| Nouvelle dependance native | Non | Oui |

### 4.2 Pousser une update

**Preview (testeurs internes):**
```powershell
pnpm update:preview
# ou: eas update --channel preview --message "Description du changement"
```

**Production:**
```powershell
pnpm update:prod
# ou: eas update --channel production --message "Description du changement"
```

### 4.3 Voir les updates

```powershell
eas update:list
```

---

## 5. Production (App Store / Play Store)

### 5.1 Build Production

**iOS:**
```powershell
pnpm build:prod:ios
```

**Android:**
```powershell
pnpm build:prod:android
```

### 5.2 Soumettre

**iOS (App Store):**
```powershell
pnpm submit:ios
```

**Android (Play Store):**
```powershell
pnpm submit:android
```

---

## 6. Supabase par environnement

### Schema des environnements

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Development   │     │     Preview     │     │   Production    │
│   (Dev Client)  │     │  (TestFlight)   │     │   (App Store)   │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ Supabase Local  │     │ Supabase Cloud  │     │ Supabase Cloud  │
│ http://LAN:54321│     │ (staging)       │     │ (production)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Lancer Supabase local

```powershell
cd C:\Users\amarm\SaaS\BoatAcademy
supabase start
```

Obtenir l'URL et la cle:
```powershell
supabase status
```

### Configurer l'IP LAN pour Dev Client

1. Trouver votre IP: `ipconfig`
2. Mettre a jour `eas.json` > `build` > `development` > `env`:
   ```json
   "EXPO_PUBLIC_SUPABASE_URL": "http://192.168.1.XX:54321"
   ```

---

## 7. Scripts disponibles

| Script | Commande | Description |
|--------|----------|-------------|
| `pnpm dev` | `expo start` | Expo Go (dev rapide) |
| `pnpm start:devclient` | `expo start --dev-client` | Dev Client |
| `pnpm build:dev:android` | `eas build -p android --profile development` | Build Dev Client Android |
| `pnpm build:dev:ios` | `eas build -p ios --profile development` | Build Dev Client iOS |
| `pnpm build:preview:ios` | `eas build -p ios --profile preview` | Build TestFlight |
| `pnpm build:prod:ios` | `eas build -p ios --profile production` | Build Production iOS |
| `pnpm submit:ios` | `eas submit -p ios --latest` | Soumettre a TestFlight/App Store |
| `pnpm update:preview` | `eas update --channel preview` | OTA update preview |
| `pnpm update:prod` | `eas update --channel production` | OTA update production |

---

## 8. Troubleshooting

### "localhost" ne fonctionne pas sur device

Utiliser l'IP LAN de votre PC:
```
http://192.168.1.XX:54321
```

### Push notifications ne fonctionnent pas

1. Les push ne marchent PAS dans Expo Go
2. Utiliser un Dev Client ou un build TestFlight
3. Verifier que le token est enregistre dans `device_tokens`

### Build echoue

```powershell
# Voir les logs
eas build:list

# Nettoyer le cache
cd apps/student-mobile
pnpm clean
```

### Update OTA n'apparait pas

1. Verifier le channel (`development`, `preview`, `production`)
2. Verifier que le `runtimeVersion` correspond
3. Redemarrer l'app (pas juste refresh)

---

## 9. Checklist de deploiement

### Premier deploiement

- [ ] `eas login`
- [ ] `eas init` (obtenir projectId)
- [ ] Mettre a jour `app.json` avec projectId
- [ ] Configurer `eas.json` avec les URLs Supabase
- [ ] Build Dev Client: `pnpm build:dev:android`
- [ ] Tester sur device physique

### Deploiement TestFlight

- [ ] Configurer Apple Developer account
- [ ] Creer l'app sur App Store Connect
- [ ] Configurer `eas.json` > `submit` > `production` > `ios`
- [ ] Build: `pnpm build:preview:ios`
- [ ] Submit: `pnpm submit:ios`
- [ ] Inviter testeurs sur TestFlight

### Update OTA

- [ ] Verifier que le changement est JS-only (pas de native)
- [ ] `pnpm update:preview --message "Description"`
- [ ] Tester sur TestFlight
- [ ] `pnpm update:prod --message "Description"`
