# API Documentation

## Service Endpoints

### Speech-to-Text (STT) - Whisper
**Base URL**: http://localhost:8000
**Container**: pi-stt

#### POST /v1/audio/transcriptions
Transcribe audio to text.

**Request**:
- Method: POST
- Content-Type: multipart/form-data
- Fields:
  - `file` (required): Audio file (WAV, MP3, WebM, etc.)
  - `model` (optional): Model size (default: "small.en")
  - `language` (optional): Language code (default: auto-detect)

**Example**:
```bash
curl -X POST http://localhost:8000/v1/audio/transcriptions \
  -F "file=@audio.wav" \
  -F "model=small.en"
```

**Response**:
```json
{
  "text": "Transcribed text here"
}
```

**Notes**:
- Expects audio at 16kHz sample rate for best results
- Empty audio returns empty text
- Field name is `file` not `audio`

---

### Text-to-Speech (TTS) - Piper
**Base URL**: http://localhost:5000
**Container**: pi-tts

#### POST /api/tts
Generate speech from text.

**Request**:
- Method: POST
- Content-Type: application/json
- Body:
  ```json
  {
    "text": "Text to synthesize",
    "voice": "en_US-amy-medium",  // optional
    "speaker": 0                   // optional
  }
  ```

**Example**:
```bash
curl -X POST http://localhost:5000/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello world"}' \
  --output response.wav
```

**Response**:
- Content-Type: audio/wav
- Binary WAV file data
- Format: 16-bit PCM, mono, 22050 Hz

#### GET /health
Check service health.

**Response**:
```json
{
  "status": "healthy"
}
```

---

### Workflow Engine - n8n
**Base URL**: http://localhost:5678
**Container**: pi-n8n
**Auth**: Basic Auth (admin/password from .env)

#### GET /healthz
Check service health.

**Response**:
```json
{
  "status": "ok"
}
```

#### POST /webhook/{path}
Trigger webhook workflows.

**Request**:
- Method: POST
- Content-Type: application/json
- Body: Any JSON payload

**Example**:
```bash
curl -X POST http://localhost:5678/webhook/voice-command \
  -H "Content-Type: application/json" \
  -d '{"command":"what time is it"}'
```

**Response**: Depends on workflow configuration

**Setup Required**:
1. Access n8n UI at http://localhost:5678
2. Create new workflow
3. Add "Webhook" trigger node
4. Set path (e.g., "voice-command")
5. Add processing nodes
6. Activate workflow

---

### Web UI
**Base URL**: http://localhost:8080
**Container**: pi-web

Static files served:
- `/` - index.html
- `/app.js` - Application logic
- `/style.css` - Styles (if added)

---

## Audio Formats

### Input (STT)
- **Preferred**: WAV, 16kHz, mono, 16-bit PCM
- **Supported**: MP3, WebM, Opus, FLAC, M4A
- **Browser Recording**: WebM/Opus (needs conversion)

### Output (TTS)
- **Format**: WAV
- **Encoding**: 16-bit PCM
- **Sample Rate**: 22050 Hz
- **Channels**: Mono

---

## CORS Configuration

Services need CORS headers for browser access:

```nginx
# nginx.conf additions
location /stt/ {
    proxy_pass http://pi-stt:8000/;
    add_header 'Access-Control-Allow-Origin' '*';
    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
    add_header 'Access-Control-Allow-Headers' 'Content-Type';
}

location /tts/ {
    proxy_pass http://pi-tts:5000/;
    add_header 'Access-Control-Allow-Origin' '*';
    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
    add_header 'Access-Control-Allow-Headers' 'Content-Type';
}

location /n8n/ {
    proxy_pass http://pi-n8n:5678/;
    add_header 'Access-Control-Allow-Origin' '*';
    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
    add_header 'Access-Control-Allow-Headers' 'Content-Type';
}
```

---

## Performance Metrics

### Latency Targets
- STT: < 800ms for 3-second audio
- TTS: < 500ms for 20-word sentence
- n8n webhook: < 200ms response time
- End-to-end: < 2000ms

### Current Performance (Measured)
- STT: ~600-1200ms (depends on model)
- TTS: ~300-500ms
- n8n: ~50-100ms
- Network overhead: ~50-100ms per hop

---

## Error Codes

### STT Service
- `400`: Invalid audio format or missing file
- `413`: File too large (>25MB)
- `500`: Internal processing error

### TTS Service
- `400`: Missing or invalid text
- `500`: Model loading or synthesis error

### n8n
- `404`: Webhook path not found or workflow inactive
- `401`: Authentication required
- `500`: Workflow execution error

---

## Testing Commands

### Quick Service Test
```bash
# Test all services
./scripts/test-services.sh

# Individual tests
curl http://localhost:8000/health  # STT
curl http://localhost:5000/health  # TTS
curl http://localhost:5678/healthz # n8n
```

### Audio Pipeline Test
```bash
# Generate test audio
sox -n test.wav synth 3 sine 440

# STT test
curl -X POST http://localhost:8000/v1/audio/transcriptions \
  -F "file=@test.wav" -F "model=small.en"

# TTS test
curl -X POST http://localhost:5000/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"Test message"}' \
  --output output.wav

# Verify output
file output.wav
```

---

## Notes

1. **Authentication**: n8n requires basic auth, other services are open
2. **Rate Limiting**: No built-in rate limiting - add nginx rules if needed
3. **File Size**: STT limited to 25MB files by default
4. **Concurrent Requests**: Services can handle multiple requests
5. **WebSocket**: Not implemented yet - consider for real-time streaming