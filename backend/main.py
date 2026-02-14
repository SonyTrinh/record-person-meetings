import os
from dataclasses import dataclass
from pathlib import Path

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from openai import OpenAI
from pydantic import BaseModel
from supabase import create_client

ENV_FILE = Path(__file__).resolve().parent / '.env'
load_dotenv(dotenv_path=ENV_FILE, override=True)

app = FastAPI(title='Meeting Processor')

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
APP_SCHEME = os.getenv('APP_SCHEME', 'recpersonmettings')
EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'
AUDIO_BUCKET = os.getenv('AUDIO_BUCKET', 'meeting-audio')

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
  raise RuntimeError('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None


class ProcessMeetingPayload(BaseModel):
  meetingId: str
  userId: str
  audioPath: str
  pushToken: str | None = None


@dataclass
class ProcessResult:
  transcript: str
  summary: str


def _build_summary(transcript: str) -> str:
  if not openai_client:
    return 'OpenAI key not configured. Transcript generated with fallback summary.'

  completion = openai_client.responses.create(
    model='gpt-4o-mini',
    input=(
      'You are an assistant that summarizes client meetings. '
      'Return concise bullet points: decisions, action items, and follow-ups.\n\n'
      f'Transcript:\n{transcript}'
    ),
  )
  return completion.output_text


def _transcribe_audio(file_bytes: bytes) -> str:
  if not openai_client:
    return 'Transcription placeholder. Configure OPENAI_API_KEY for real transcription.'

  response = openai_client.audio.transcriptions.create(
    model='gpt-4o-transcribe',
    file=('meeting.m4a', file_bytes),
  )
  return response.text


async def _download_audio(audio_path: str) -> bytes:
  signed_url_data = supabase.storage.from_(AUDIO_BUCKET).create_signed_url(audio_path, 900)
  signed_url = signed_url_data.get('signedURL')
  if not signed_url:
    raise HTTPException(status_code=400, detail='Unable to create signed URL.')

  async with httpx.AsyncClient(timeout=60) as client:
    response = await client.get(signed_url)
    response.raise_for_status()
    return response.content


async def _send_push(push_token: str, meeting_id: str):
  payload = {
    'to': push_token,
    'title': 'Transcript ready',
    'body': 'Your meeting transcript and summary are now available.',
    'data': {
      'meetingId': meeting_id,
      'url': f'{APP_SCHEME}://meetings/{meeting_id}',
    },
  }

  async with httpx.AsyncClient(timeout=30) as client:
    await client.post(EXPO_PUSH_URL, json=payload)


async def _process(audio_path: str) -> ProcessResult:
  audio_bytes = await _download_audio(audio_path)
  transcript = _transcribe_audio(audio_bytes)
  summary = _build_summary(transcript)
  return ProcessResult(transcript=transcript, summary=summary)


@app.get('/health')
async def health():
  return {'ok': True}


@app.post('/process-meeting')
async def process_meeting(payload: ProcessMeetingPayload):
  try:
    result = await _process(payload.audioPath)
    supabase.table('meetings').update(
      {
        'status': 'completed',
        'transcript': result.transcript,
        'summary': result.summary,
      }
    ).eq('id', payload.meetingId).execute()

    if payload.pushToken:
      await _send_push(payload.pushToken, payload.meetingId)

    return {'ok': True}
  except Exception as exc:
    supabase.table('meetings').update({'status': 'failed'}).eq('id', payload.meetingId).execute()
    raise HTTPException(status_code=500, detail=str(exc)) from exc
