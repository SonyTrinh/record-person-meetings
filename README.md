# Record In-Person Meetings

Expo app + FastAPI backend for recording in-person meetings, uploading audio to Supabase Storage, and generating transcript/summary.

## Features

- Record meetings from mobile app
- Background recording support (iOS + Android config plugin)
- Upload audio to Supabase Storage
- Trigger backend processing workflow
- Store transcript/summary in Supabase
- Push notification when processing completes

## Tech Stack

- Mobile: Expo (React Native, Expo Router, Expo Audio, Expo Notifications)
- Backend: FastAPI + OpenAI + Supabase Python client
- Data: Supabase Postgres + Supabase Storage

## Prerequisites

- Node.js 18+
- npm
- Python 3.10+
- Xcode (for iOS build) / Android Studio (for Android build)
- Supabase project
- OpenAI API key (optional for real transcription/summary)

## Environment Variables

### Mobile (`.env`)

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Required values:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_BACKEND_URL` (for real devices, use reachable LAN/public URL)

### Backend (`backend/.env`)

Copy `backend/.env.example` to `backend/.env`:

```bash
cp backend/.env.example backend/.env
```

Required values:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `APP_SCHEME` (default in sample: `recpersonmettings`)
- `AUDIO_BUCKET` (default: `meeting-audio`)

## Install

```bash
npm install
```

## Run the Mobile App

Start Metro:

```bash
npm run start
```

Run native builds:

```bash
npm run ios
npm run android
```

Note: This project uses native modules (`expo-audio`, notifications, config plugin), so use a development build (`expo run:*`) instead of relying only on Expo Go.

## Run the Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Health check:

```bash
curl http://localhost:8000/health
```

## Background Recording Plugin

Configured in `app.json`:

- `./plugins/with-background-recording`

It applies:

- iOS `UIBackgroundModes: ["audio"]`
- iOS `NSMicrophoneUsageDescription` fallback
- Android permissions:
  - `android.permission.RECORD_AUDIO`
  - `android.permission.WAKE_LOCK`
  - `android.permission.FOREGROUND_SERVICE`
  - `android.permission.FOREGROUND_SERVICE_MICROPHONE`

After changing plugin/config, regenerate native files:

```bash
npx expo prebuild --clean
```

## Troubleshooting

- **`NSMicrophoneUsageDescription` missing**
  - Ensure key exists in `app.json` (`expo.ios.infoPlist`)
  - Rebuild app (`npm run ios`), hot reload is not enough

- **`prepareToRecordAsync` fails on iOS Simulator**
  - Simulator microphone/audio session can be unreliable
  - Prefer testing recording on a real iPhone

- **Pull-to-refresh white flash**
  - Keep list mounted while refreshing (already handled in current UI implementation)

- **Backend not reachable from phone**
  - Set `EXPO_PUBLIC_BACKEND_URL` to your computer LAN IP and backend port

## Security Notes

- Never commit real secrets in `.env` files
- Rotate keys immediately if they were exposed
- Service role key must stay server-side only (`backend/.env`)
