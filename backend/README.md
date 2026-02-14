# Backend (FastAPI)

## Run locally

1. Create env file:
   - `cp .env.example .env`
2. Install dependencies:
   - `pip install -r requirements.txt`
3. Start server:
   - `uvicorn main:app --reload --host 0.0.0.0 --port 8000`

## Mobile connectivity note

If the app runs on a physical device, `http://127.0.0.1:8000` points to the phone itself.
Set `EXPO_PUBLIC_BACKEND_URL` to your computer LAN IP, for example:
- `http://192.168.1.10:8000`

## Endpoint

- `POST /process-meeting`
  - Body:
    - `meetingId` (string)
    - `userId` (string)
    - `audioPath` (string, path in Supabase Storage bucket `meeting-audio`)
    - `pushToken` (optional string, Expo push token)

The backend downloads audio from Supabase Storage, generates transcript + summary,
updates `meetings` table, then sends Expo push notification with deep link:
`recpersonmettings://meetings/<meetingId>`.
