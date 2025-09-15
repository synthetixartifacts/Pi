// Debug Dashboard - Modular Architecture for Pi Voice Assistant
class DebugDashboard {
    constructor() {
        this.modules = new Map();
        this.currentModule = 'overview';
        this.services = {
            stt: null,
            tts: null,
            n8n: null
        };

        // Global access to core functionalities
        window.piCore = new PiCore();

        this.initializeDashboard();
        this.registerModules();
        this.checkServiceHealth();
    }

    initializeDashboard() {
        // Navigation handling
        document.querySelectorAll('.feature-nav button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const moduleId = e.target.dataset.module;
                this.switchModule(moduleId);
            });
        });

        this.log('info', 'Dashboard initialized');
    }

    registerModules() {
        // Register all feature modules
        this.registerModule('overview', new OverviewModule());
        this.registerModule('tts', new TTSModule());
        this.registerModule('stt', new STTModule());
        this.registerModule('pipeline', new PipelineModule());
        this.registerModule('system', new SystemModule());

        this.log('success', `Registered ${this.modules.size} feature modules`);
    }

    registerModule(id, moduleInstance) {
        moduleInstance.dashboard = this;
        this.modules.set(id, moduleInstance);
        moduleInstance.initialize();
    }

    switchModule(moduleId) {
        // Update navigation
        document.querySelectorAll('.feature-nav button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-module="${moduleId}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.feature-module').forEach(module => {
            module.classList.remove('active');
        });
        document.getElementById(`${moduleId}-module`).classList.add('active');

        this.currentModule = moduleId;

        // Activate the module
        const module = this.modules.get(moduleId);
        if (module && module.activate) {
            module.activate();
        }

        this.log('info', `Switched to ${moduleId} module`);
    }

    async checkServiceHealth() {
        const statusElements = {
            stt: document.getElementById('sttStatus'),
            tts: document.getElementById('ttsStatus'),
            n8n: document.getElementById('n8nStatus')
        };

        // Check STT
        try {
            const sttResponse = await fetch('/api/stt/health', {
                method: 'GET',
                timeout: 5000
            });
            if (sttResponse.ok) {
                statusElements.stt.textContent = 'STT Online';
                statusElements.stt.className = 'status-badge status-connected';
                this.services.stt = 'connected';
            } else {
                throw new Error(`HTTP ${sttResponse.status}`);
            }
        } catch (error) {
            statusElements.stt.textContent = 'STT Offline';
            statusElements.stt.className = 'status-badge status-disconnected';
            this.services.stt = 'disconnected';
            this.log('error', `STT service: ${error.message}`);
        }

        // Check TTS
        try {
            const ttsResponse = await fetch('/api/tts/health', {
                method: 'GET',
                timeout: 5000
            });
            const ttsData = await ttsResponse.json();
            if (ttsData.status === 'healthy') {
                statusElements.tts.textContent = 'TTS Online';
                statusElements.tts.className = 'status-badge status-connected';
                this.services.tts = 'connected';
            } else {
                throw new Error('Service unhealthy');
            }
        } catch (error) {
            statusElements.tts.textContent = 'TTS Offline';
            statusElements.tts.className = 'status-badge status-disconnected';
            this.services.tts = 'disconnected';
            this.log('error', `TTS service: ${error.message}`);
        }

        // Check n8n
        try {
            const n8nResponse = await fetch('/api/n8n/healthz', {
                method: 'GET',
                timeout: 5000
            });
            const n8nData = await n8nResponse.json();
            if (n8nData.status === 'ok') {
                statusElements.n8n.textContent = 'n8n Online';
                statusElements.n8n.className = 'status-badge status-connected';
                this.services.n8n = 'connected';
            } else {
                throw new Error('Service unhealthy');
            }
        } catch (error) {
            statusElements.n8n.textContent = 'n8n Offline';
            statusElements.n8n.className = 'status-badge status-disconnected';
            this.services.n8n = 'disconnected';
            this.log('error', `n8n service: ${error.message}`);
        }
    }

    log(level, message) {
        const logsContainer = document.getElementById('debugLogs');
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry log-${level}`;

        const icons = {
            error: '❌',
            success: '✅',
            warning: '⚠️',
            info: '📝'
        };

        logEntry.textContent = `[${timestamp}] ${icons[level] || '📝'} ${message}`;
        logsContainer.insertBefore(logEntry, logsContainer.firstChild);

        // Keep log size manageable
        const entries = logsContainer.children;
        if (entries.length > 100) {
            logsContainer.removeChild(entries[entries.length - 1]);
        }
    }

    clearLogs() {
        document.getElementById('debugLogs').innerHTML = '';
        this.log('info', 'Logs cleared');
    }
}

// Core Pi functionality - globally accessible
class PiCore {
    constructor() {
        this.audioContext = null;
        this.mediaRecorder = null;
        this.stream = null;
        this.isRecording = false;
    }

    async getAudioStream() {
        if (!this.stream) {
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: 16000,
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });
        }
        return this.stream;
    }

    async recordAudio(duration = 3000) {
        return new Promise(async (resolve, reject) => {
            try {
                const stream = await this.getAudioStream();
                const chunks = [];
                const mediaRecorder = new MediaRecorder(stream, {
                    mimeType: 'audio/webm;codecs=opus'
                });

                mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) chunks.push(e.data);
                };

                mediaRecorder.onstop = () => {
                    const blob = new Blob(chunks, { type: 'audio/webm;codecs=opus' });
                    resolve(blob);
                };

                mediaRecorder.onerror = (e) => reject(new Error(`Recording error: ${e.error}`));

                mediaRecorder.start();
                this.isRecording = true;

                setTimeout(() => {
                    if (mediaRecorder.state === 'recording') {
                        mediaRecorder.stop();
                        this.isRecording = false;
                    }
                }, duration);

            } catch (error) {
                reject(error);
            }
        });
    }

    async sendToSTT(audioBlob, model = 'small.en') {
        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.webm');
        formData.append('model', model);

        const response = await fetch('/api/stt/v1/audio/transcriptions', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`STT error: ${response.status}`);
        }

        const data = await response.json();
        return data.text || '';
    }

    async textToSpeech(text, options = {}) {
        const response = await fetch('/api/tts/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, ...options })
        });

        if (!response.ok) {
            throw new Error(`TTS error: ${response.status}`);
        }

        const blob = await response.blob();
        return URL.createObjectURL(blob);
    }

    setupAudioVisualizer(canvasId, stream) {
        const canvas = document.getElementById(canvasId);
        if (!canvas || !stream) return;

        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            if (!this.isRecording && this.stream) return;

            requestAnimationFrame(draw);
            analyser.getByteTimeDomainData(dataArray);

            ctx.fillStyle = '#111827';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.lineWidth = 2;
            ctx.strokeStyle = '#10b981';
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
        return { audioContext, analyser };
    }
}

// Base Module Class
class BaseModule {
    constructor() {
        this.dashboard = null;
    }

    initialize() {
        // Override in subclasses
    }

    activate() {
        // Override in subclasses
    }

    log(level, message) {
        if (this.dashboard) {
            this.dashboard.log(level, `[${this.constructor.name}] ${message}`);
        }
    }

    updateOutput(moduleId, content) {
        const output = document.getElementById(`${moduleId}Output`);
        if (output) {
            output.innerHTML = content;
        }
    }
}

// Overview Module
class OverviewModule extends BaseModule {
    initialize() {
        document.getElementById('testAllBtn').addEventListener('click', () => this.testAllServices());
        document.getElementById('healthCheckBtn').addEventListener('click', () => this.healthCheck());
    }

    async healthCheck() {
        this.log('info', 'Running health check...');
        await this.dashboard.checkServiceHealth();

        const services = this.dashboard.services;
        const results = Object.entries(services).map(([name, status]) => {
            const icon = status === 'connected' ? '✅' : '❌';
            const statusText = status === 'connected' ? 'Online' : 'Offline';
            return `<div>${icon} ${name.toUpperCase()}: ${statusText}</div>`;
        }).join('');

        this.updateOutput('overview', `
            <div style="color: #d1d5db;">
                <h4>Service Status:</h4>
                ${results}
                <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #4b5563;">
                    <em>Health check completed at ${new Date().toLocaleTimeString()}</em>
                </div>
            </div>
        `);
    }

    async testAllServices() {
        this.log('info', 'Testing all services...');
        this.updateOutput('overview', '<div style="color: #f59e0b;">Running comprehensive tests...</div>');

        // This would trigger tests across all modules
        await this.dashboard.modules.get('tts')?.quickTest?.();
        await this.dashboard.modules.get('stt')?.quickTest?.();
        await this.dashboard.modules.get('pipeline')?.quickTest?.();
    }
}

// TTS Module
class TTSModule extends BaseModule {
    initialize() {
        document.getElementById('ttsTestBtn').addEventListener('click', () => this.quickTest());
        document.getElementById('ttsCustomBtn').addEventListener('click', () => this.customTest());
        document.getElementById('ttsVoicesBtn').addEventListener('click', () => this.listVoices());

        // Settings handlers
        document.getElementById('ttsSpeed').addEventListener('input', (e) => {
            document.getElementById('ttsSpeedValue').textContent = e.target.value + 'x';
        });
    }

    async quickTest() {
        const testText = "Pi debug dashboard TTS test successful!";
        this.log('info', 'Running TTS quick test');
        this.updateOutput('tts', '<div style="color: #f59e0b;">Synthesizing speech...</div>');

        try {
            const audioUrl = await window.piCore.textToSpeech(testText);
            const audio = new Audio(audioUrl);

            audio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                this.log('success', 'TTS test completed successfully');
            };

            await audio.play();

            this.updateOutput('tts', `
                <div style="color: #10b981;">
                    ✅ TTS Test Successful<br>
                    📝 Text: "${testText}"<br>
                    🎵 Audio playing...
                </div>
            `);

        } catch (error) {
            this.log('error', `TTS test failed: ${error.message}`);
            this.updateOutput('tts', `<div style="color: #ef4444;">❌ TTS Error: ${error.message}</div>`);
        }
    }

    async customTest() {
        const customText = document.getElementById('ttsCustomText').value;
        if (!customText.trim()) {
            this.log('warning', 'No custom text provided');
            return;
        }

        this.log('info', 'Testing custom TTS text');
        this.updateOutput('tts', `<div style="color: #f59e0b;">Synthesizing: "${customText}"</div>`);

        try {
            const audioUrl = await window.piCore.textToSpeech(customText);
            const audio = new Audio(audioUrl);

            await audio.play();

            this.updateOutput('tts', `
                <div style="color: #10b981;">
                    ✅ Custom TTS Successful<br>
                    📝 Text: "${customText}"<br>
                    🎵 Audio played successfully
                </div>
            `);

        } catch (error) {
            this.log('error', `Custom TTS failed: ${error.message}`);
            this.updateOutput('tts', `<div style="color: #ef4444;">❌ Custom TTS Error: ${error.message}</div>`);
        }
    }

    async listVoices() {
        this.log('info', 'Fetching available voices');
        this.updateOutput('tts', '<div style="color: #f59e0b;">Fetching voice list...</div>');

        // This would fetch from TTS service
        this.updateOutput('tts', `
            <div style="color: #3b82f6;">
                📋 Available Voices:<br>
                • Default (en-US neural)<br>
                • More voices coming soon...
            </div>
        `);
    }
}

// STT Module
class STTModule extends BaseModule {
    initialize() {
        document.getElementById('sttRecordBtn').addEventListener('click', () => this.quickTest());
        document.getElementById('sttContinuousBtn').addEventListener('click', () => this.startContinuous());
        document.getElementById('sttStopBtn').addEventListener('click', () => this.stopContinuous());

        // Settings
        document.getElementById('sttSensitivity').addEventListener('input', (e) => {
            document.getElementById('sttSensitivityValue').textContent = e.target.value;
        });

        this.continuousRecording = false;
    }

    activate() {
        // Setup visualizer when module is activated
        if (window.piCore.stream) {
            window.piCore.setupAudioVisualizer('audioVisualizer', window.piCore.stream);
        }
    }

    async quickTest() {
        this.log('info', 'Starting STT 3-second test');
        this.updateOutput('stt', '<div style="color: #f59e0b;">🎙️ Recording for 3 seconds...</div>');

        try {
            const audioBlob = await window.piCore.recordAudio(3000);
            this.updateOutput('stt', '<div style="color: #f59e0b;">🔄 Processing audio...</div>');

            const model = document.getElementById('sttModelSelect').value;
            const text = await window.piCore.sendToSTT(audioBlob, model);

            if (text) {
                this.log('success', `STT recognized: "${text}"`);
                this.updateOutput('stt', `
                    <div style="color: #10b981;">
                        ✅ STT Test Successful<br>
                        📝 Recognized: "${text}"<br>
                        🎯 Model: ${model}<br>
                        📊 Audio size: ${(audioBlob.size / 1024).toFixed(1)}KB
                    </div>
                `);
            } else {
                this.log('warning', 'STT returned empty text');
                this.updateOutput('stt', '<div style="color: #f59e0b;">⚠️ No speech detected</div>');
            }

        } catch (error) {
            this.log('error', `STT test failed: ${error.message}`);
            this.updateOutput('stt', `<div style="color: #ef4444;">❌ STT Error: ${error.message}</div>`);
        }
    }

    async startContinuous() {
        if (this.continuousRecording) return;

        this.continuousRecording = true;
        document.getElementById('sttContinuousBtn').disabled = true;
        document.getElementById('sttStopBtn').disabled = false;

        this.log('info', 'Starting continuous STT');
        this.updateOutput('stt', '<div style="color: #10b981;">🔴 Continuous recording active...</div>');

        // Setup audio visualization
        try {
            const stream = await window.piCore.getAudioStream();
            window.piCore.setupAudioVisualizer('audioVisualizer', stream);
        } catch (error) {
            this.log('error', `Audio setup failed: ${error.message}`);
        }

        this.continuousLoop();
    }

    async continuousLoop() {
        while (this.continuousRecording) {
            try {
                const audioBlob = await window.piCore.recordAudio(4000);
                if (!this.continuousRecording) break;

                const model = document.getElementById('sttModelSelect').value;
                const text = await window.piCore.sendToSTT(audioBlob, model);

                if (text && text.length > 0) {
                    this.log('info', `Continuous STT: "${text}"`);
                    this.updateOutput('stt', `
                        <div style="color: #10b981;">
                            🔴 Live Recognition<br>
                            📝 Latest: "${text}"<br>
                            ⏰ ${new Date().toLocaleTimeString()}
                        </div>
                    `);
                }

                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (error) {
                this.log('error', `Continuous STT error: ${error.message}`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }

    stopContinuous() {
        this.continuousRecording = false;
        document.getElementById('sttContinuousBtn').disabled = false;
        document.getElementById('sttStopBtn').disabled = true;

        this.log('info', 'Stopped continuous STT');
        this.updateOutput('stt', '<div style="color: #6b7280;">⏸️ Continuous recording stopped</div>');
    }
}

// Pipeline Module
class PipelineModule extends BaseModule {
    initialize() {
        document.getElementById('pipelineTestBtn').addEventListener('click', () => this.fullPipelineTest());
        document.getElementById('pipelineWakewordBtn').addEventListener('click', () => this.testWakeword());
        document.getElementById('pipelineN8nBtn').addEventListener('click', () => this.testN8nIntegration());
    }

    async fullPipelineTest() {
        this.log('info', 'Starting full pipeline test');
        this.updateOutput('pipeline', '<div style="color: #f59e0b;">🔄 Step 1/3: Recording...</div>');

        try {
            // Step 1: Record
            const audioBlob = await window.piCore.recordAudio(3000);

            // Step 2: STT
            this.updateOutput('pipeline', '<div style="color: #f59e0b;">🔄 Step 2/3: Speech to text...</div>');
            const text = await window.piCore.sendToSTT(audioBlob);

            if (!text) throw new Error('No speech detected');

            // Step 3: TTS
            this.updateOutput('pipeline', '<div style="color: #f59e0b;">🔄 Step 3/3: Text to speech...</div>');
            const response = `You said: ${text}`;
            const audioUrl = await window.piCore.textToSpeech(response);

            const audio = new Audio(audioUrl);
            await audio.play();

            this.log('success', 'Full pipeline test completed');
            this.updateOutput('pipeline', `
                <div style="color: #10b981;">
                    ✅ Pipeline Test Complete!<br>
                    🎙️ Input: "${text}"<br>
                    🔊 Output: "${response}"<br>
                    ⏱️ Full cycle completed
                </div>
            `);

        } catch (error) {
            this.log('error', `Pipeline test failed: ${error.message}`);
            this.updateOutput('pipeline', `<div style="color: #ef4444;">❌ Pipeline Error: ${error.message}</div>`);
        }
    }

    async testWakeword() {
        this.log('info', 'Testing wake word detection');
        this.updateOutput('pipeline', '<div style="color: #3b82f6;">👋 Say "Hey Pi" or "Okay Pi"...</div>');

        // This would implement wake word detection
        setTimeout(() => {
            this.updateOutput('pipeline', `
                <div style="color: #10b981;">
                    👋 Wake word test simulation<br>
                    🎯 Listening for: "Hey Pi", "Okay Pi"<br>
                    📝 Feature coming soon...
                </div>
            `);
        }, 2000);
    }

    async testN8nIntegration() {
        this.log('info', 'Testing n8n integration');
        this.updateOutput('pipeline', '<div style="color: #f59e0b;">🤖 Testing n8n webhook...</div>');

        try {
            // This would test n8n webhook integration
            const response = await fetch('/api/n8n/webhook/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ test: 'debug-dashboard', timestamp: Date.now() })
            });

            if (response.ok) {
                this.updateOutput('pipeline', `
                    <div style="color: #10b981;">
                        ✅ n8n Integration Active<br>
                        🔗 Webhook responding<br>
                        📊 Status: ${response.status}
                    </div>
                `);
            } else {
                throw new Error(`HTTP ${response.status}`);
            }

        } catch (error) {
            this.log('warning', `n8n integration: ${error.message}`);
            this.updateOutput('pipeline', `<div style="color: #f59e0b;">⚠️ n8n Integration: ${error.message}</div>`);
        }
    }
}

// System Module
class SystemModule extends BaseModule {
    initialize() {
        document.getElementById('systemRefreshBtn').addEventListener('click', () => this.refresh());
        document.getElementById('systemDockerBtn').addEventListener('click', () => this.dockerStatus());
    }

    async refresh() {
        this.log('info', 'Refreshing system status');
        await this.dashboard.checkServiceHealth();
        this.updateOutput('system', `
            <div style="color: #10b981;">
                🔄 System status refreshed<br>
                ⏰ ${new Date().toLocaleString()}<br>
                📊 Check service badges in header
            </div>
        `);
    }

    async dockerStatus() {
        this.log('info', 'Checking Docker containers');
        this.updateOutput('system', `
            <div style="color: #3b82f6;">
                🐳 Docker Container Status<br>
                📦 STT: faster-whisper-server<br>
                📦 TTS: piper-tts<br>
                📦 n8n: workflow automation<br>
                🌐 nginx: reverse proxy<br>
                <br>
                <em>Detailed status via docker-compose logs</em>
            </div>
        `);
    }
}

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
    window.debugDashboard = new DebugDashboard();
});