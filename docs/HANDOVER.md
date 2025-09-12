# Project Handover Document

## Critical Information for Next Session

### 🚨 CURRENT BLOCKER
**STT is not working correctly** - User reports it only shows ".. Thank you" instead of actual transcription. This MUST be fixed before proceeding with any other features.

### Where We Are
- **Date**: 2025-09-12 (Evening)
- **Iteration**: Between 2 and 3 (STT issue blocking progress)
- **Last Action**: Created comprehensive debug dashboard at http://localhost:8080/debug.html

### What's Running
All Docker services are up:
```bash
docker compose ps  # Should show all healthy
```

- n8n: http://localhost:5678 (admin/changeme123)
- Debug Dashboard: http://localhost:8080/debug.html
- Original UI: http://localhost:8080

### Known Issues

1. **STT Problem** (CRITICAL):
   - Symptom: Returns empty or ".. Thank you" only
   - Not yet diagnosed
   - Could be: audio format, volume, duration, or model issue
   - Debug using: http://localhost:8080/debug.html

2. **No Wake Word**:
   - Currently only text matching "hey pi" in transcription
   - Not a true wake word detector

3. **No n8n Integration**:
   - Service is running but no workflows created
   - Webhook endpoint would be: /webhook/voice-command

### File Locations

#### Key Documentation:
- `next_iteration.md` - START HERE! Has all context
- `ITERATION_PLAN.md` - Shows progress through iterations
- `docs/API.md` - How to test each service
- `docs/howto/local_run.md` - All commands

#### Code Files:
- `web/debug.html` & `web/debug.js` - Debug dashboard (just created)
- `web/app.js` - Original voice assistant logic
- `web/nginx.conf` - Proxy configuration
- `docker-compose.yml` - Service definitions

### Testing Commands

```bash
# Quick health check
curl http://localhost:8080/api/stt/health
curl http://localhost:8080/api/tts/health
curl http://localhost:8080/api/n8n/healthz

# Test TTS (working)
curl -X POST http://localhost:8080/api/tts/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello world"}' \
  --output test.wav

# Test STT (broken - returns empty)
curl -X POST http://localhost:8080/api/stt/v1/audio/transcriptions \
  -F "file=@test.wav" \
  -F "model=small.en"
```

### Architecture Summary

```
Browser (Web UI)
    ↓ Records WebM/Opus audio
nginx (port 8080)
    ↓ Reverse proxy with CORS
Services:
    - STT (port 8000) - Whisper faster-whisper-server
    - TTS (port 5000) - Piper custom wrapper
    - n8n (port 5678) - Workflow automation
```

### What Was Working
- ✅ All services starting and healthy
- ✅ TTS generating valid audio files
- ✅ Browser recording audio
- ✅ nginx proxying requests
- ✅ Debug dashboard showing metrics

### What Needs Fixing
- ❌ STT not transcribing audio correctly
- ❌ End-to-end pipeline not tested
- ❌ No n8n workflows
- ❌ No real wake word detection

### Debugging Strategy

1. First, use the debug dashboard:
   - Go to http://localhost:8080/debug.html
   - Record 3 seconds of clear speech
   - Test with STT
   - Click "Copy Debug Info" if it fails

2. Check container logs:
   ```bash
   docker compose logs stt --tail=100
   ```

3. Test with known good audio:
   ```bash
   # Generate speech audio
   espeak "Testing one two three" -w test_speech.wav
   # Test STT
   curl -X POST http://localhost:8000/v1/audio/transcriptions \
     -F "file=@test_speech.wav" \
     -F "model=small.en"
   ```

### Next Steps Priority

1. **FIX STT** - Nothing else matters until this works
2. Test full pipeline (record → STT → TTS → play)
3. Create basic n8n workflow
4. Implement proper wake word or button trigger
5. Optimize latency

### Important Notes

- User wants debugging visibility over polish
- POC quality is fine, not production
- Browser must handle all audio I/O (WSL2 limitation)
- Keep using debug dashboard for all testing
- Update `next_iteration.md` before ending session

### Success Criteria

When STT is fixed, you should be able to:
1. Record audio in browser
2. See actual transcription (not ".. Thank you")
3. Generate TTS response
4. Play audio back in browser

Everything else is secondary to getting this basic flow working.

---

*Remember: Read `next_iteration.md` first when starting - it has the complete context and immediate action items.*