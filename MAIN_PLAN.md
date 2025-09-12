# MAIN_PLAN.md - Comprehensive Implementation Plan

## 🎯 Project Overview
Build a fully containerized voice assistant POC with wake word detection, STT, TTS, and n8n automation, running on Windows/WSL2 Docker environment.

## 📊 Current Status Tracking
> **Last Updated**: 2025-09-12 (Late Evening)
> **Current Phase**: ⚡ Phase 3 - Integration & Orchestration
> **Progress**: ▓▓▓▓▓▓░░░░ 60%

### Completed Milestones ✅
- [x] CLAUDE.md setup and configuration
- [x] Project documentation cleaned and structured
- [x] Technical research and validation
- [x] Comprehensive plan creation
- [x] Docker environment fully operational
- [x] All core services deployed (n8n v1.110.1, STT, TTS, nginx)
- [x] Web UI with debug dashboard created
- [x] STT issue root cause identified (browser microphone capture)

### Active Work 🔄
- [ ] Fix browser audio recording (microphone permission/settings)
- [ ] Complete end-to-end pipeline testing
- [ ] Create n8n workflows

### Upcoming 📅
- [ ] Wake word detection implementation
- [ ] Performance optimization
- [ ] Raspberry Pi preparation

---

## 📋 Phase 1: Foundation Setup
**Timeline**: Day 1-2
**Goal**: Establish complete development environment with proper structure

### 1.1 Project Structure Creation
**Status**: ✅ Completed

```bash
/home/tommy/Project/Pi/
├── docker-compose.yml          # Main orchestration
├── docker-compose.override.yml # Local overrides
├── .env                        # Environment variables
├── .env.example               # Template for env vars
├── services/
│   ├── n8n/
│   │   ├── Dockerfile        # Custom n8n if needed
│   │   └── data/            # Persistent storage
│   ├── stt/
│   │   ├── config.yml       # STT configuration
│   │   └── models/          # Model cache
│   ├── tts/
│   │   ├── config.yml       # TTS configuration
│   │   └── voices/          # Voice models
│   └── wake-word/
│       └── config/          # Wake word configs
├── web/
│   ├── index.html           # Main UI
│   ├── app.js              # Application logic
│   ├── style.css           # Styling
│   └── lib/                # Libraries (Porcupine, etc.)
├── scripts/
│   ├── setup.sh            # Initial setup script
│   ├── test-services.sh    # Service testing
│   └── health-check.sh     # Health monitoring
├── docs/
│   ├── API.md              # API documentation
│   ├── TROUBLESHOOTING.md  # Common issues
│   └── DEPLOYMENT.md       # Pi deployment guide
└── tests/
    ├── audio/              # Test audio files
    └── integration/        # Integration tests
```

**Actions**:
1. Create directory structure
2. Initialize git repository
3. Setup .gitignore with proper exclusions
4. Create initial README.md

### 1.2 Environment Configuration
**Status**: ✅ Completed (using defaults, no .env file needed for POC)

Create `.env` file with:
```env
# Service Ports
N8N_PORT=5678
STT_PORT=8000
TTS_PORT=5000
WEB_PORT=8080

# n8n Configuration
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=changeme123
N8N_ENCRYPTION_KEY=n8n-encryption-key-min-24-chars
GENERIC_TIMEZONE=America/Toronto

# STT Configuration
WHISPER_MODEL=small.en
WHISPER_DEVICE=cpu
WHISPER_COMPUTE_TYPE=int8

# TTS Configuration
PIPER_VOICE=en_US-amy-medium
PIPER_SPEAKER=0

# Wake Word Configuration
WAKE_WORD_SENSITIVITY=0.5
WAKE_WORDS=hey_pi,okay_pi

# Resource Limits
MEMORY_LIMIT=4g
CPU_LIMIT=4
```

### 1.3 Docker Compose Base Configuration
**Status**: ✅ Completed (all services running)

Create `docker-compose.yml`:
```yaml
version: '3.8'

x-common-variables: &common-variables
  TZ: ${GENERIC_TIMEZONE}
  
x-resource-limits: &resource-limits
  deploy:
    resources:
      limits:
        cpus: ${CPU_LIMIT:-4}
        memory: ${MEMORY_LIMIT:-4g}

services:
  n8n:
    image: n8nio/n8n:1.23.0
    container_name: pi-n8n
    restart: unless-stopped
    ports:
      - "${N8N_PORT}:5678"
    environment:
      <<: *common-variables
      N8N_BASIC_AUTH_ACTIVE: "true"
      N8N_BASIC_AUTH_USER: ${N8N_BASIC_AUTH_USER}
      N8N_BASIC_AUTH_PASSWORD: ${N8N_BASIC_AUTH_PASSWORD}
      N8N_ENCRYPTION_KEY: ${N8N_ENCRYPTION_KEY}
      N8N_HOST: 0.0.0.0
      N8N_PORT: 5678
      N8N_PROTOCOL: http
      DB_TYPE: sqlite
      N8N_DEFAULT_BINARY_DATA_MODE: filesystem
    volumes:
      - n8n_data:/home/node/.n8n
      - ./services/n8n/files:/files
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5678/healthz"]
      interval: 30s
      timeout: 10s
      retries: 3
    <<: *resource-limits

  stt:
    image: fedirz/faster-whisper-server:latest-cpu
    container_name: pi-stt
    restart: unless-stopped
    ports:
      - "${STT_PORT}:8000"
    environment:
      <<: *common-variables
      WHISPER__MODEL: Systran/faster-whisper-${WHISPER_MODEL}
      WHISPER__INFERENCE_DEVICE: ${WHISPER_DEVICE}
      WHISPER__COMPUTE_TYPE: ${WHISPER_COMPUTE_TYPE}
      UVICORN_HOST: 0.0.0.0
      UVICORN_PORT: 8000
    volumes:
      - stt_models:/root/.cache/huggingface
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    <<: *resource-limits

  tts:
    build:
      context: ./services/tts
      dockerfile: Dockerfile
    container_name: pi-tts
    restart: unless-stopped
    ports:
      - "${TTS_PORT}:5000"
    environment:
      <<: *common-variables
      PIPER_VOICE: ${PIPER_VOICE}
      PIPER_SPEAKER: ${PIPER_SPEAKER}
    volumes:
      - tts_models:/app/models
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    <<: *resource-limits

  web:
    image: nginx:alpine
    container_name: pi-web
    restart: unless-stopped
    ports:
      - "${WEB_PORT}:80"
    volumes:
      - ./web:/usr/share/nginx/html:ro
      - ./web/nginx.conf:/etc/nginx/nginx.conf:ro
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3
    depends_on:
      - n8n
      - stt
      - tts

volumes:
  n8n_data:
  stt_models:
  tts_models:

networks:
  default:
    name: pi-network
```

---

## 📋 Phase 2: Core Services Implementation
**Timeline**: Day 3-5
**Goal**: Deploy and configure individual services

### 2.1 Custom TTS Service with HTTP API
**Status**: ✅ Completed (TTS wrapper created and working)

Since Piper doesn't have a direct HTTP API, create a wrapper:

`services/tts/Dockerfile`:
```dockerfile
FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .
COPY download_model.sh .

RUN chmod +x download_model.sh && ./download_model.sh

EXPOSE 5000

CMD ["python", "app.py"]
```

`services/tts/app.py`:
```python
from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
import subprocess
import tempfile
import os
from typing import Optional

app = FastAPI()

class TTSRequest(BaseModel):
    text: str
    voice: Optional[str] = "en_US-amy-medium"
    speaker: Optional[int] = 0

@app.post("/api/tts")
async def synthesize(request: TTSRequest):
    try:
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_file:
            cmd = [
                "piper",
                "--model", f"/app/models/{request.voice}.onnx",
                "--output_file", tmp_file.name
            ]
            
            process = subprocess.run(
                cmd,
                input=request.text.encode(),
                capture_output=True
            )
            
            if process.returncode != 0:
                raise HTTPException(500, f"TTS failed: {process.stderr.decode()}")
            
            with open(tmp_file.name, "rb") as f:
                audio_data = f.read()
            
            os.unlink(tmp_file.name)
            
            return Response(content=audio_data, media_type="audio/wav")
    
    except Exception as e:
        raise HTTPException(500, str(e))

@app.get("/health")
async def health():
    return {"status": "healthy"}
```

### 2.2 Web UI Implementation
**Status**: ✅ Completed (Basic UI + Debug Dashboard created)

Create comprehensive browser interface:

`web/index.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pi Voice Assistant</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div id="app">
        <header>
            <h1>🎙️ Pi Voice Assistant</h1>
            <div id="status" class="status-inactive">Inactive</div>
        </header>
        
        <main>
            <div class="control-panel">
                <button id="startBtn" class="btn-primary">Start Listening</button>
                <button id="stopBtn" class="btn-secondary" disabled>Stop</button>
            </div>
            
            <div class="visualization">
                <canvas id="waveform"></canvas>
                <div id="transcript"></div>
            </div>
            
            <div class="settings">
                <label>
                    Wake Word Sensitivity:
                    <input type="range" id="sensitivity" min="0" max="1" step="0.1" value="0.5">
                    <span id="sensitivityValue">0.5</span>
                </label>
            </div>
            
            <div class="logs">
                <h3>Activity Log</h3>
                <pre id="log"></pre>
            </div>
        </main>
    </div>
    
    <script src="app.js" type="module"></script>
</body>
</html>
```

`web/app.js`:
```javascript
// Main application logic
class VoiceAssistant {
    constructor() {
        this.isListening = false;
        this.audioContext = null;
        this.mediaRecorder = null;
        this.wakeWordDetector = null;
        this.initializeUI();
    }
    
    initializeUI() {
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.status = document.getElementById('status');
        this.log = document.getElementById('log');
        this.transcript = document.getElementById('transcript');
        
        this.startBtn.addEventListener('click', () => this.start());
        this.stopBtn.addEventListener('click', () => this.stop());
    }
    
    async start() {
        try {
            this.addLog('Requesting microphone access...');
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            this.audioContext = new AudioContext({ sampleRate: 16000 });
            this.setupAudioProcessing(stream);
            
            await this.initializeWakeWord();
            
            this.isListening = true;
            this.updateStatus('Listening');
            this.startBtn.disabled = true;
            this.stopBtn.disabled = false;
            
            this.addLog('Voice assistant started');
        } catch (error) {
            this.addLog(`Error: ${error.message}`, 'error');
        }
    }
    
    async initializeWakeWord() {
        // Initialize Porcupine or alternative wake word detection
        // This would integrate with Porcupine WASM or send audio to backend
        this.addLog('Wake word detection initialized');
    }
    
    async processCommand(audioBlob) {
        try {
            // Send to STT
            const formData = new FormData();
            formData.append('audio', audioBlob, 'command.wav');
            formData.append('model', 'small.en');
            
            const sttResponse = await fetch('http://localhost:8000/v1/audio/transcriptions', {
                method: 'POST',
                body: formData
            });
            
            const { text } = await sttResponse.json();
            this.transcript.textContent = `You said: "${text}"`;
            this.addLog(`Transcribed: ${text}`);
            
            // Send to n8n
            const n8nResponse = await fetch('http://localhost:5678/webhook/voice-command', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: text })
            });
            
            const result = await n8nResponse.json();
            
            // Get TTS response
            if (result.response) {
                await this.speak(result.response);
            }
            
        } catch (error) {
            this.addLog(`Processing error: ${error.message}`, 'error');
        }
    }
    
    async speak(text) {
        try {
            const response = await fetch('http://localhost:5000/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            
            this.addLog(`Speaking: ${text}`);
            await audio.play();
            
        } catch (error) {
            this.addLog(`TTS error: ${error.message}`, 'error');
        }
    }
    
    stop() {
        this.isListening = false;
        this.updateStatus('Inactive');
        // Clean up resources
        if (this.audioContext) {
            this.audioContext.close();
        }
        this.startBtn.disabled = false;
        this.stopBtn.disabled = true;
        this.addLog('Voice assistant stopped');
    }
    
    updateStatus(status) {
        this.status.textContent = status;
        this.status.className = `status-${status.toLowerCase()}`;
    }
    
    addLog(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `[${timestamp}] ${message}\n`;
        this.log.textContent = logEntry + this.log.textContent;
    }
    
    setupAudioProcessing(stream) {
        // Setup audio visualization and processing
        const source = this.audioContext.createMediaStreamSource(stream);
        const analyser = this.audioContext.createAnalyser();
        source.connect(analyser);
        
        this.visualizeAudio(analyser);
    }
    
    visualizeAudio(analyser) {
        const canvas = document.getElementById('waveform');
        const ctx = canvas.getContext('2d');
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const draw = () => {
            if (!this.isListening) return;
            
            requestAnimationFrame(draw);
            analyser.getByteTimeDomainData(dataArray);
            
            ctx.fillStyle = 'rgb(20, 20, 20)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'rgb(0, 200, 100)';
            ctx.beginPath();
            
            const sliceWidth = canvas.width / bufferLength;
            let x = 0;
            
            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = v * canvas.height / 2;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
                
                x += sliceWidth;
            }
            
            ctx.lineTo(canvas.width, canvas.height / 2);
            ctx.stroke();
        };
        
        draw();
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    new VoiceAssistant();
});
```

---

## 📋 Phase 3: Integration & Orchestration
**Timeline**: Day 6-7
**Goal**: Connect all services and create workflows

### 3.1 n8n Workflow Setup
**Status**: 🔄 In Progress (Service running, workflows not created yet)

Create essential n8n workflows:

1. **Voice Command Handler**
   - Webhook trigger: `/webhook/voice-command`
   - Command parsing and routing
   - Integration with external APIs
   - Response generation

2. **System Health Monitor**
   - Cron trigger: Every 5 minutes
   - Check all service health endpoints
   - Alert on failures

3. **Data Pipeline**
   - Process and store voice interactions
   - Analytics and reporting

### 3.2 Service Integration Tests
**Status**: ⚠️ Partially Complete (STT works, browser audio issue)

Create `scripts/test-services.sh`:
```bash
#!/bin/bash

echo "Testing Pi Voice Assistant Services..."

# Test n8n
echo -n "Testing n8n... "
if curl -s http://localhost:5678/healthz > /dev/null; then
    echo "✓"
else
    echo "✗"
fi

# Test STT
echo -n "Testing STT... "
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✓"
else
    echo "✗"
fi

# Test TTS
echo -n "Testing TTS... "
if curl -s http://localhost:5000/health > /dev/null; then
    echo "✓"
else
    echo "✗"
fi

# Test Web UI
echo -n "Testing Web UI... "
if curl -s http://localhost:8080 > /dev/null; then
    echo "✓"
else
    echo "✗"
fi

# Test end-to-end
echo "Testing end-to-end flow..."
# Add comprehensive integration test
```

---

## 📋 Phase 4: Optimization & Enhancement
**Timeline**: Day 8-9
**Goal**: Performance tuning and feature additions

### 4.1 Performance Optimization
**Status**: ⬜ Not Started

1. **Docker Optimization**
   - Multi-stage builds for smaller images
   - Layer caching optimization
   - Resource limit tuning

2. **Service Optimization**
   - Model preloading
   - Connection pooling
   - Caching strategies

3. **Network Optimization**
   - Internal Docker network
   - Service mesh consideration

### 4.2 Enhanced Features
**Status**: ⬜ Not Started

1. **Multi-Wake-Word Support**
   - Configure multiple trigger phrases
   - Context-aware activation

2. **Vision Integration**
   - Camera capture API
   - Object detection service
   - Integration with n8n

3. **Advanced n8n Workflows**
   - Smart home integration
   - Calendar management
   - Email/notification handling

---

## 📋 Phase 5: Documentation & Testing
**Timeline**: Day 10
**Goal**: Complete documentation and testing suite

### 5.1 Documentation
**Status**: ⬜ Not Started

1. **README.md** - Getting started guide
2. **API.md** - Service API documentation
3. **TROUBLESHOOTING.md** - Common issues
4. **DEPLOYMENT.md** - Production deployment

### 5.2 Testing Suite
**Status**: ⬜ Not Started

1. **Unit Tests** - Individual service tests
2. **Integration Tests** - Service interaction tests
3. **Performance Tests** - Load and stress testing
4. **User Acceptance Tests** - End-to-end scenarios

---

## 📋 Phase 6: Raspberry Pi Preparation
**Timeline**: Day 11-12
**Goal**: Prepare for Pi deployment

### 6.1 ARM64 Compatibility
**Status**: ⬜ Not Started

1. Verify all images have ARM64 support
2. Create Pi-specific docker-compose
3. Document hardware setup

### 6.2 Performance Profiling
**Status**: ⬜ Not Started

1. Resource usage analysis
2. Optimization for Pi constraints
3. Battery/power considerations

---

## 🎯 Success Metrics

### Phase Completion Criteria
- [ ] All services running without errors
- [ ] Wake word detection accuracy > 95%
- [ ] STT accuracy > 90%
- [ ] TTS clarity rating > 4/5
- [ ] End-to-end latency < 2 seconds
- [ ] n8n workflows executing correctly
- [ ] Documentation complete

### Performance Targets
- **Memory Usage**: < 4GB total
- **CPU Usage**: < 50% average
- **Response Time**: < 1s for simple commands
- **Uptime**: > 99.9%

---

## 🚨 Risk Management

### Identified Risks
1. **Audio Quality Issues**
   - Mitigation: Multiple audio format support
   - Fallback: Backend audio processing

2. **Service Failures**
   - Mitigation: Health checks and auto-restart
   - Fallback: Graceful degradation

3. **Performance Bottlenecks**
   - Mitigation: Profiling and optimization
   - Fallback: Service scaling

4. **Compatibility Issues**
   - Mitigation: Version pinning
   - Fallback: Alternative implementations

---

## 📝 Daily Checklist

### Before Starting Work
- [ ] Check service health
- [ ] Pull latest changes
- [ ] Review current phase objectives

### During Development
- [ ] Commit changes frequently
- [ ] Update documentation
- [ ] Test changes locally

### End of Day
- [ ] Update status in MAIN_PLAN.md
- [ ] Document any blockers
- [ ] Plan next day's tasks

---

## 🔄 Iteration Notes
> Space for recording decisions, changes, and learnings during implementation

### 2025-09-12 (Morning)
- Initial plan created
- Research completed on all technologies
- Decided on fedirz/faster-whisper-server for better OpenAI compatibility
- Custom TTS wrapper needed for Piper HTTP API

### 2025-09-12 (Evening)
- All Docker services deployed and running
- Updated n8n from v1.23.0 to v1.110.1 (latest stable)
- Fixed faster-whisper-server tag issue (using latest-cpu)
- Created comprehensive debug dashboard
- **Critical Finding**: STT service works perfectly, but browser is recording silence
- Added debug tools: mic_test.html, enhanced monitoring, download capability
- Root cause: Microphone permission or audio constraints issue in browser
- Next: User needs to test with mic_test.html to verify microphone settings

---

## 📚 References & Resources

### Official Documentation
- [n8n Docker Guide](https://docs.n8n.io/hosting/installation/docker/)
- [Faster Whisper API](https://github.com/fedirz/faster-whisper-server)
- [Piper TTS](https://github.com/rhasspy/piper)
- [Docker Compose Spec](https://docs.docker.com/compose/compose-file/)

### Community Resources
- [Rhasspy Forums](https://community.rhasspy.org/)
- [n8n Community](https://community.n8n.io/)
- [Home Assistant Voice](https://www.home-assistant.io/voice_control/)

### Troubleshooting Guides
- [WSL2 Networking](https://docs.microsoft.com/en-us/windows/wsl/networking)
- [Docker Desktop Issues](https://docs.docker.com/desktop/troubleshoot/)

---

**Remember**: This is a living document. Update progress markers and status as you work through each phase. Use the iteration notes to document important decisions and learnings.