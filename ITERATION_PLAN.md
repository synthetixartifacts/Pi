# Iteration-Based Execution Plan for Pi Voice Assistant

## 🎯 Project Goal Reminder
Build a functional voice assistant POC that:
- Detects wake word ("Hey Pi")
- Converts speech to text
- Processes commands via n8n
- Responds with synthesized speech
- Achieves < 2 second end-to-end latency

## 📊 Current State Assessment (Updated: 2025-09-12 Evening)
- ✅ Docker infrastructure running (n8n v1.110.1, STT, TTS, nginx)
- ✅ Web UI created with test controls
- ✅ Debug dashboard fully functional (http://localhost:8080/debug.html)
- ✅ TTS service working and tested
- ✅ nginx reverse proxy with CORS configured
- ⚠️ STT returning empty/partial results (".. Thank you")
- ⚠️ Audio pipeline partially working (recording works, STT issue)
- ❌ No true wake word detection (only text matching)
- ❌ No n8n workflow integration yet

## 🔄 Iteration Strategy
Each iteration should be:
1. **Small & Testable** - Complete in 1-2 hours
2. **Validated** - Test before moving forward
3. **Documented** - Update progress tracking
4. **Reversible** - Can rollback if needed

---

# ITERATION 1: Validate Core Services
**Goal**: Ensure all services are truly functional
**Time**: 30 minutes

## Tasks:
1. [x] Test STT service with actual audio file ✅
2. [x] Test TTS service and verify audio generation ✅
3. [x] Create test n8n webhook workflow ✅
4. [x] Document API endpoints and formats ✅

## Validation Criteria:
- STT returns text from audio file
- TTS generates playable WAV file
- n8n webhook responds to POST request
- All health checks pass

## Commands to Execute:
```bash
# Create test audio file
docker exec pi-web sh -c "apk add --no-cache sox && sox -n -r 16000 test.wav synth 3 sine 440"

# Test STT
curl -X POST http://localhost:8000/v1/audio/transcriptions \
  -F "audio=@web/test.wav" \
  -F "model=small.en"

# Test TTS
curl -X POST http://localhost:5000/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello, this is a test"}' \
  --output test_response.wav

# Play generated audio (in WSL)
aplay test_response.wav 2>/dev/null || echo "Audio generated, playback not available in WSL"
```

---

# ITERATION 2: Fix Web-to-Service Communication
**Goal**: Enable browser to communicate with backend services
**Time**: 1 hour
**Actual Time**: 45 minutes

## Tasks:
1. [x] Fix CORS issues between browser and services ✅
2. [x] Implement proper audio format conversion (WebM to WAV) ✅
3. [x] Create simple test button for STT ✅
4. [x] Add response display in UI ✅

## Technical Considerations:
- Browser records in WebM/Opus format
- STT expects WAV 16kHz mono
- Need server-side conversion or client-side library
- CORS headers required for cross-origin requests

## Implementation:
1. Update nginx.conf for proper CORS and proxying
2. Add audio conversion utility
3. Test browser → STT → display flow

---

# ITERATION 3: Debug and Fix STT Issue (COMPLETED)
**Goal**: Get STT working with browser-recorded audio
**Time**: 1 hour
**Actual Time**: 45 minutes
**Status**: ✅ Root cause identified

## Tasks:
1. [x] Debug why STT returns empty/".. Thank you" ✅
2. [x] Test with different audio formats ✅
3. [x] Verify Whisper model is loading ✅
4. [x] Check audio levels and quality ✅
5. [x] Test with pre-recorded known good audio ✅

## Findings:
- STT service works perfectly with both WAV and WebM
- Browser is recording silence (microphone issue)
- Added debug tools: mic_test.html, enhanced monitoring
- Need user to test microphone with new debug tools

## Debug Steps:
- Use debug dashboard at http://localhost:8080/debug.html
- Check docker logs: `docker compose logs stt`
- Test STT endpoint directly with curl
- Verify WebM/Opus compatibility

## Original ITERATION 3: Implement Audio Recording Pipeline
*POSTPONED until STT is fixed*

## Key Features:
- 16kHz sampling rate
- Mono channel
- 3-5 second recording window
- Visual feedback during recording

---

# ITERATION 4: Basic Command Processing
**Goal**: Connect STT → n8n → TTS pipeline
**Time**: 1 hour

## Tasks:
1. [ ] Create n8n webhook workflow for commands
2. [ ] Parse common commands (weather, time, hello)
3. [ ] Generate appropriate responses
4. [ ] Return response to browser

## n8n Workflow Structure:
- Webhook trigger: /webhook/voice-command
- Switch node for command routing
- HTTP nodes for external APIs (optional)
- Response formatting
- JSON response with TTS text

---

# ITERATION 5: Wake Word Detection - Realistic Approach
**Goal**: Implement practical wake word detection
**Time**: 2 hours

## Options (Choose based on testing):

### Option A: Simple Button Trigger (MVP)
- User clicks button instead of wake word
- Fastest to implement
- Good for initial testing

### Option B: OpenWakeWord Backend
- Create Python service with openWakeWord
- Stream audio from browser via WebSocket
- More complex but production-ready

### Option C: Continuous Recording with Command Detection
- Always recording in chunks
- Send to STT periodically
- Check if text starts with "Hey Pi"

## Decision Criteria:
- Latency requirements
- Browser compatibility
- Development time available

---

# ITERATION 6: Audio Playback & Response
**Goal**: Complete the conversation loop
**Time**: 1 hour

## Tasks:
1. [ ] Implement TTS response playback
2. [ ] Handle audio queue for multiple responses
3. [ ] Add visual indicators during playback
4. [ ] Prevent recording during response

## Technical Requirements:
- Web Audio API for playback
- Proper audio format handling
- State management for recording/playing

---

# ITERATION 7: Error Handling & Resilience
**Goal**: Make system robust
**Time**: 1.5 hours

## Tasks:
1. [ ] Add timeout handling for all API calls
2. [ ] Implement retry logic with exponential backoff
3. [ ] User-friendly error messages
4. [ ] Service health monitoring

## Error Scenarios:
- Microphone permission denied
- Service temporarily unavailable
- Network timeout
- Invalid audio format
- No speech detected

---

# ITERATION 8: Performance Optimization
**Goal**: Achieve < 2 second latency
**Time**: 2 hours

## Measurements:
1. [ ] Add timing logs at each step
2. [ ] Identify bottlenecks
3. [ ] Optimize slowest components

## Optimization Targets:
- Recording end → STT start: < 100ms
- STT processing: < 800ms
- n8n workflow: < 200ms
- TTS generation: < 500ms
- Audio playback start: < 100ms
- **Total: < 1700ms**

## Potential Optimizations:
- Pre-warm services
- Use smaller Whisper model (tiny.en)
- Cache common TTS responses
- WebSocket instead of HTTP polling
- Streaming STT/TTS if available

---

# ITERATION 9: Polish & UX
**Goal**: Professional user experience
**Time**: 1.5 hours

## Tasks:
1. [ ] Improve UI design and responsiveness
2. [ ] Add configuration panel
3. [ ] Implement conversation history
4. [ ] Add keyboard shortcuts
5. [ ] Mobile-responsive design

---

# ITERATION 10: Integration Testing
**Goal**: Validate complete system
**Time**: 1 hour

## Test Scenarios:
1. [ ] Basic conversation flow
2. [ ] Multiple rapid commands
3. [ ] Long audio input
4. [ ] Service failure recovery
5. [ ] Browser compatibility (Chrome, Edge, Firefox)

## Success Metrics:
- 95% command recognition accuracy
- < 2 second average response time
- Zero crashes in 10-minute session
- Graceful degradation on errors

---

# 🚨 Risk Mitigation

## Known Challenges:
1. **Browser Audio Formats**: WebM/Opus → WAV conversion needed
2. **CORS**: All services need proper headers
3. **WSL Audio**: Can't play audio directly, browser only
4. **Wake Word**: Browser-based detection is limited
5. **Latency**: Multiple service hops add delay

## Fallback Plans:
- If wake word fails → Use button activation
- If latency too high → Use tiny.en model
- If CORS issues persist → Proxy through nginx
- If WebSocket complex → Stay with HTTP polling

---

# 📈 Progress Tracking

## After Each Iteration:
1. Update this document with ✅ or ❌
2. Note actual time taken
3. Document issues encountered
4. Record performance metrics
5. Adjust next iteration if needed

## Go/No-Go Criteria:
- If iteration fails → Debug and retry
- If blocked > 2 hours → Move to fallback plan
- If core functionality broken → Rollback and reassess

---

# 🎯 Definition of Done (POC)

## Minimum Success:
- [ ] User can click button to start recording
- [ ] Speech is converted to text
- [ ] n8n processes at least 3 command types
- [ ] Response is spoken back to user
- [ ] Complete cycle works 3 times in a row

## Stretch Goals:
- [ ] Wake word detection working
- [ ] < 1 second response time
- [ ] 10+ command types supported
- [ ] Conversation context maintained
- [ ] Visual feedback polished

---

# Next Action

**Start with ITERATION 1**: Validate Core Services

Before writing any new code, we must confirm our foundation is solid. Run the test commands and verify each service responds correctly.

Remember: 
- Test everything
- Document results
- Small steps
- Validate before proceeding