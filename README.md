# Réunion IA

Application mobile Expo/React Native en TypeScript qui enregistre une réunion, transcrit le français, l’anglais et la darija marocaine, génère un résumé factuel en français avec un tableau Action / Responsable / Délai et le lit à voix haute. Aucun historique n’est conservé.

## Télécharger l’APK Android

[Télécharger IA-Meet.apk](https://github.com/Jawad84-ghaly/IA-Meet/releases/download/v1.0.0/IA-Meet.apk)

L’APK installe l’interface mobile. Dans la rubrique **Serveur sécurisé** de l’application, saisissez l’URL HTTPS d’un déploiement du proxy `server/`. La clé OpenAI doit rester uniquement sur ce serveur.

## Architecture

```text
.
├── App.tsx
├── components/
│   ├── AudioRecorder.tsx
│   └── SummaryView.tsx
├── hooks/useAudioRecorder.ts
├── screens/HomeScreen.tsx
├── services/aiService.ts        # appelle uniquement le proxy
├── types/meeting.ts
└── server/
    └── src/index.ts             # clé OpenAI et appels IA côté serveur
```

Le téléphone n’appelle jamais OpenAI directement. Une variable `EXPO_PUBLIC_*` est visible dans le bundle mobile : elle doit donc contenir uniquement l’URL du proxy, jamais `OPENAI_API_KEY`. En production, déployez le dossier `server/` sur un service HTTPS et ajoutez authentification, limitation de débit, journalisation minimale et politique de rétention adaptée.

## Prérequis

- Node.js 20 ou version LTS plus récente
- Un appareil avec Expo Go, Android Emulator ou iOS Simulator
- Une clé API OpenAI avec facturation API activée

## Installation

À la racine :

```bash
npm install
copy .env.example .env
```

Puis pour le proxy :

```bash
cd server
npm install
copy .env.example .env
```

Le modèle `server/.env.example` démarre en `DEMO_MODE=true`. Ce mode permet de lancer l’interface mais ne fabrique plus de faux résumé. Pour une transcription et un résumé réels, renseignez `OPENAI_API_KEY`, puis remplacez `DEMO_MODE=true` par `DEMO_MODE=false`. Ne commitez jamais ce fichier.

## Choisir l’URL du proxy

Dans le fichier `.env` racine :

- iOS Simulator : `EXPO_PUBLIC_API_BASE_URL=http://localhost:3000`
- Android Emulator : `EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000`
- téléphone physique : `EXPO_PUBLIC_API_BASE_URL=http://IP_LOCALE_DU_PC:3000`

Le téléphone et le PC doivent être sur le même réseau pour le développement local. Pour une application distribuée, utilisez obligatoirement une URL HTTPS publique.

## Démarrage

Terminal 1, depuis `server/` :

```bash
npm run dev
```

Terminal 2, depuis la racine :

```bash
npm start
```

Scannez le QR code avec Expo Go ou appuyez sur `a`/`i` pour lancer un simulateur. Après modification de `.env`, redémarrez Expo en vidant le cache avec `npx expo start -c`.

Sans émulateur ni accès réseau entrant, un aperçu sur le même PC reste disponible avec `npm run web`. Il utilise le proxy sur `http://localhost:3000` et ne demande aucun droit administrateur.

## Comportement et limites

- Les fichiers audio sont conservés en mémoire par le proxy le temps de la requête, avec une limite de 25 Mo, puis libérés.
- Aucun historique n’est conservé. Au premier lancement de cette version, l’ancien historique AsyncStorage est effacé. Le résumé courant reste visible seulement pendant la session et le fichier audio n’est pas conservé après analyse.
- `expo-speech` utilise la voix française installée sur l’appareil.
- Les modèles de qualité `gpt-4o-transcribe` et `gpt-4o` sont utilisés par défaut. Ils restent configurables dans `server/.env`.
- Le mode démonstration n’envoie pas le fichier à OpenAI et désactive clairement l’analyse au lieu d’afficher un résumé fictif.
- Sur iOS, l’enregistrement doit être testé sur appareil ou simulateur compatible. Les permissions sont déclarées dans `app.json`.

## Vérifications

```bash
npm run typecheck
npm --prefix server run typecheck
```

Pour préparer un déploiement réel, ajoutez une authentification au proxy et définissez une origine autorisée précise si vous exposez aussi une interface web.
