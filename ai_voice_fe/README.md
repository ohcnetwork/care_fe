# AI Voice Frontend - Medical Transcription Plugin for CARE

React frontend plugin for real-time medical transcription and AI-powered SOAP note generation.

## Features

- **Real-time audio recording** with visual level meter and waveform feedback
- **Live transcription display** with confidence scores and timestamps
- **AI-generated SOAP notes** (Subjective, Objective, Assessment, Plan)
- **Inline SOAP note editing** for physician review and corrections
- **Physician review workflow** with review status tracking
- **Session history** - browse previous transcription sessions per encounter
- **Encounter tab integration** - appears as "AI Voice" tab in patient encounters

## Architecture

```
Browser Microphone
    |
    v
Web Audio API (16kHz PCM capture)
    |
    v
WebSocket --> Django Channels --> AssemblyAI
    |                                  |
    v                                  v
Live Transcript Display    TranscriptionSegments (DB)
    |                                  |
    v                                  v
Generate SOAP Note --> Celery Task --> LLM --> SOAPNote (DB)
    |
    v
Physician Review & Approval
```

## Plugin Integration

This plugin registers:
- **Encounter Tab** (`ai_voice`): Full transcription and SOAP note workflow
- **EncounterActions** component: Quick action indicator on encounter cards

## Development

```bash
npm install
npm run dev
```

Set `VITE_CARE_URL` in `.env` to point to your local CARE backend.

## Configuration

Register in CARE Admin Dashboard with the remote entry URL:
```
http://localhost:4175/assets/remoteEntry.js
```

Or add to `REACT_ENABLED_APPS`:
```
REACT_ENABLED_APPS=ohcnetwork/ai_voice_fe
```
