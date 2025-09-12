# 🎯 CRITICAL CONTEXT FOR NEXT ITERATION

## WHO YOU ARE
You are Claude, continuing development of the Pi Voice Assistant POC. The human (Tommy) expects you to understand the project state and continue from where the previous iteration left off.

## IMMEDIATE SITUATION
**Date**: 2025-09-12 (Late evening)
**Current Working Directory**: `/home/tommy/Project/Pi`
**Environment**: WSL2 Ubuntu on Windows
**All services are running**: Docker containers are up (n8n, STT, TTS, nginx)

## 🚨 CRITICAL ISSUES - UPDATE

### Issue #1: STT Service Works, Browser Audio Capture Issue
**RESOLVED**: STT service itself is working perfectly with both WAV and WebM formats
**ACTUAL PROBLEM**: Browser is recording silence or very quiet audio
**Evidence**:
- STT works with test speech files (both WAV and WebM)
- Browser sends valid WebM files but they contain silence
- Duration is correct (3-4 seconds) but no audio content

**ROOT CAUSE**: Likely microphone permission or audio constraints issue
**Debug Tools Added**:
1. Enhanced audio level monitoring in debug.js
2. Download button to save recorded WebM for inspection
3. Microphone test page at http://localhost:8080/mic_test.html
4. Simple recording test at http://localhost:8080/test_record.html

**Next Steps**:
1. Use mic_test.html to verify microphone is working
2. Check browser console for permission errors
3. Test with different audio constraints (disable echo cancellation)
4. Verify correct microphone device is selected

### Issue #2: Debug Dashboard Just Created
**Location**: http://localhost:8080/debug.html
**Purpose**: Central debugging interface for all services
**Key Features**:
- Service health monitoring
- Audio recording with visualization
- STT/TTS testing panels
- "Copy Debug Info" button for sharing issues
- System console with detailed logging

## 📁 PROJECT STRUCTURE & KEY FILES

### Essential Files You MUST Read First:
1. **CLAUDE.md** - Your operating instructions and rules
2. **ITERATION_PLAN.md** - Current progress (we're on Iteration 2, partially into 3)
3. **docs/howto/local_run.md** - All commands to run the project
4. **docs/API.md** - Service endpoints and how to test them

### Current File Structure:
```
/home/tommy/Project/Pi/
├── docker-compose.yml       # Services orchestration (n8n:1.110.1, STT, TTS, nginx)
├── web/
│   ├── index.html          # Original UI (partially working)
│   ├── app.js              # Original voice assistant logic
│   ├── debug.html          # NEW: Debug dashboard
│   ├── debug.js            # NEW: Debug dashboard logic
│   └── nginx.conf          # Proxy config with CORS
├── services/
│   └── tts/                # Custom TTS wrapper (Docker build)
├── docs/
│   ├── API.md              # API documentation
│   ├── howto/local_run.md  # Step-by-step commands
│   └── TROUBLESHOOTING.md  # Common issues
└── ITERATION_PLAN.md        # Detailed plan with progress
```

## 🔄 CURRENT PROJECT STATE

### What's Working ✅
1. **Docker Infrastructure**: All containers running
   - n8n v1.110.1 at http://localhost:5678 (admin/changeme123)
   - STT (faster-whisper) at http://localhost:8000
   - TTS (Piper) at http://localhost:5000
   - nginx proxy at http://localhost:8080

2. **Basic Pipeline Components**:
   - nginx reverse proxy with CORS configured
   - TTS generates valid WAV files
   - Browser can record audio (WebM/Opus format)
   - Debug dashboard created and functional

### What's NOT Working ❌
1. **STT Transcription**: Returns empty or partial results
2. **Wake Word Detection**: Only text-based detection (no true wake word)
3. **n8n Integration**: No workflows created yet
4. **End-to-End Pipeline**: Not fully tested

### Current Performance Metrics
- STT: ~800-1200ms (when working)
- TTS: ~300-500ms (working)
- Target: < 2 second total latency
- Current: ~4-5 seconds (not optimized)

## 🎮 HOW TO RESUME WORK

### Step 1: Verify Services
```bash
cd /home/tommy/Project/Pi
docker compose ps
# All should show "healthy" or "running"
```

### Step 2: Open Debug Dashboard
Navigate to: http://localhost:8080/debug.html
- Check all services show green
- Test recording manually
- Use "Copy Debug Info" if issues

### Step 3: Debug STT Issue
The main issue is STT not transcribing properly. Test with:
```bash
# Generate test audio with speech
docker exec pi-stt sh -c "apt-get update && apt-get install -y espeak"
docker exec pi-stt sh -c "espeak 'Hello, this is a test' -w /tmp/test.wav"
docker cp pi-stt:/tmp/test.wav ./test_speech.wav

# Test STT
curl -X POST http://localhost:8000/v1/audio/transcriptions \
  -F "file=@test_speech.wav" \
  -F "model=small.en"
```

### Step 4: Check Browser Console
Open http://localhost:8080/debug.html and:
1. Press F12 for browser console
2. Click "Start Recording"
3. Speak clearly: "Testing one two three"
4. Click "Stop Recording"
5. Click "Test with Current Audio"
6. Check console for errors

## 🔑 KEY TECHNICAL DETAILS

### Audio Pipeline
- **Browser records**: WebM with Opus codec
- **STT accepts**: WAV, WebM, MP3, etc. (Whisper is flexible)
- **Sample rate**: 16kHz (configured in MediaRecorder)
- **Channels**: Mono
- **TTS outputs**: WAV 22050Hz mono 16-bit PCM

### Service URLs (through nginx proxy)
- STT: `/api/stt/v1/audio/transcriptions`
- TTS: `/api/tts/api/tts`
- n8n: `/api/n8n/webhook/*`
- Health checks: `/api/stt/health`, `/api/tts/health`, `/api/n8n/healthz`

### Docker Networks
- Internal network: `pi-network`
- Containers can reach each other by name: `pi-stt`, `pi-tts`, `pi-n8n`, `pi-web`

## 🎯 NEXT IMMEDIATE TASKS

### Priority 1: Fix STT
1. Test with known good audio file
2. Check if Whisper model is loading correctly
3. Verify audio format compatibility
4. Check container logs: `docker compose logs stt`

### Priority 2: Complete Pipeline
1. Get recording → STT working
2. Connect STT → simple command processing
3. Generate TTS response
4. Play audio in browser

### Priority 3: Create n8n Workflow
1. Access http://localhost:5678
2. Create webhook node at `/webhook/voice-command`
3. Add switch for basic commands
4. Return JSON with response text

## ⚠️ IMPORTANT CONTEXT

### User Expectations
- Tommy wants a working POC, not production code
- Debug visibility is more important than UX polish
- The debug dashboard should show everything happening
- STT issue is the current blocker

### Technical Constraints
- Running in WSL2 (can't play audio directly)
- Browser handles all audio I/O
- Docker containers for all services
- No GPU acceleration

### Design Philosophy
- Small, testable iterations
- Validate each component before integration
- Keep detailed logs for debugging
- Fail fast with clear error messages

## 📝 YOUR FIRST ACTIONS

1. **Read these files in order**:
   - CLAUDE.md
   - ITERATION_PLAN.md
   - docs/API.md

2. **Check current status**:
   ```bash
   docker compose ps
   docker compose logs --tail=50
   ```

3. **Test the debug dashboard**:
   - Open http://localhost:8080/debug.html
   - Try recording and testing STT
   - Copy debug info if there are issues

4. **Fix the STT issue**:
   - This is the main blocker
   - User reports only seeing ".. Thank you"
   - Likely audio capture or format issue

5. **Update this file** (`next_iteration.md`) with:
   - What you discovered
   - What you fixed
   - What the next iteration should focus on

## 🧠 REMEMBER

You are picking up mid-development. The infrastructure is running, but the STT transcription is broken. The user has a debug dashboard at http://localhost:8080/debug.html to help diagnose issues. Your goal is to get a working voice assistant POC where:

1. User speaks into microphone
2. Audio is transcribed correctly
3. Commands are processed
4. TTS responds with speech

Everything else is secondary. Focus on making the basic pipeline work.

## 🔄 ITERATION TRACKING

**Last Completed**: ITERATION 2 in ITERATION_PLAN.md
**Current Work**: Debugging STT issue (blocking ITERATION 3)
**Next Planned**: ITERATION 3 - Audio Recording Pipeline

Update ITERATION_PLAN.md with your progress!

---

**Final Note**: When you're done with your session, update this file with the current state so the next iteration (possibly you with wiped memory) knows exactly where to continue. Include any error messages, partial solutions, or insights you discovered.

Good luck! The debug dashboard is your friend - use it extensively.