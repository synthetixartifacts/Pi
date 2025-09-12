// Debug Dashboard JavaScript
class DebugDashboard {
    constructor() {
        this.mediaRecorder = null;
        this.audioContext = null;
        this.stream = null;
        this.recordedBlob = null;
        this.ttsBlob = null;
        this.isRecording = false;
        this.isContinuous = false;
        this.recordingStartTime = null;
        this.logs = [];
        
        this.config = {
            duration: 3000,
            model: 'small.en',
            echoCancellation: true,
            noiseSuppression: true
        };
        
        this.init();
    }
    
    init() {
        this.log('System', '🚀 Debug Dashboard Initialized');
        this.checkBrowserCapabilities();
        this.checkServices();
        this.setupEventListeners();
        this.startWaveformVisualization();
        
        // Check services every 30 seconds
        setInterval(() => this.checkServices(), 30000);
    }
    
    log(category, message, type = 'info') {
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        const logEntry = {
            timestamp,
            category,
            message,
            type
        };
        
        this.logs.push(logEntry);
        
        const consoleLog = document.getElementById('console-log');
        const colorClass = type === 'error' ? 'error-text' : 
                          type === 'success' ? 'success-text' : 
                          type === 'warning' ? 'warning-text' : '';
        
        const logHtml = `<span class="timestamp">[${timestamp}]</span> <span style="color: #0ff">[${category}]</span> <span class="${colorClass}">${message}</span>\n`;
        
        consoleLog.innerHTML += logHtml;
        
        if (document.getElementById('auto-scroll').checked) {
            consoleLog.scrollTop = consoleLog.scrollHeight;
        }
        
        // Also log to browser console for debugging
        console.log(`[${category}] ${message}`);
    }
    
    async checkBrowserCapabilities() {
        const caps = {
            'MediaRecorder': typeof MediaRecorder !== 'undefined',
            'getUserMedia': navigator.mediaDevices && navigator.mediaDevices.getUserMedia,
            'AudioContext': typeof AudioContext !== 'undefined',
            'WebRTC': typeof RTCPeerConnection !== 'undefined'
        };
        
        // Check supported audio formats
        if (typeof MediaRecorder !== 'undefined') {
            caps['webm/opus'] = MediaRecorder.isTypeSupported('audio/webm;codecs=opus');
            caps['webm'] = MediaRecorder.isTypeSupported('audio/webm');
            caps['ogg'] = MediaRecorder.isTypeSupported('audio/ogg');
        }
        
        document.getElementById('browser-caps').textContent = JSON.stringify(caps, null, 2);
        
        for (const [feature, supported] of Object.entries(caps)) {
            if (!supported && feature !== 'ogg') {  // ogg is optional
                this.log('Browser', `⚠️ ${feature} not supported`, 'warning');
            }
        }
    }
    
    async checkServices() {
        // Check STT
        try {
            const sttStart = Date.now();
            const sttRes = await fetch('/api/stt/health');
            const sttTime = Date.now() - sttStart;
            
            if (sttRes.ok) {
                document.getElementById('stt-status').className = 'status-card healthy';
                document.getElementById('stt-status-text').textContent = `OK (${sttTime}ms)`;
                this.log('Health', `✅ STT service healthy (${sttTime}ms)`, 'success');
            } else {
                throw new Error(`Status ${sttRes.status}`);
            }
        } catch (error) {
            document.getElementById('stt-status').className = 'status-card error';
            document.getElementById('stt-status-text').textContent = 'ERROR';
            this.log('Health', `❌ STT service error: ${error.message}`, 'error');
        }
        
        // Check TTS
        try {
            const ttsStart = Date.now();
            const ttsRes = await fetch('/api/tts/health');
            const ttsTime = Date.now() - ttsStart;
            const ttsData = await ttsRes.json();
            
            if (ttsData.status === 'healthy') {
                document.getElementById('tts-status').className = 'status-card healthy';
                document.getElementById('tts-status-text').textContent = `OK (${ttsTime}ms)`;
                this.log('Health', `✅ TTS service healthy (${ttsTime}ms)`, 'success');
            } else {
                throw new Error('Unhealthy status');
            }
        } catch (error) {
            document.getElementById('tts-status').className = 'status-card error';
            document.getElementById('tts-status-text').textContent = 'ERROR';
            this.log('Health', `❌ TTS service error: ${error.message}`, 'error');
        }
        
        // Check n8n
        try {
            const n8nStart = Date.now();
            const n8nRes = await fetch('/api/n8n/healthz');
            const n8nTime = Date.now() - n8nStart;
            const n8nData = await n8nRes.json();
            
            if (n8nData.status === 'ok') {
                document.getElementById('n8n-status').className = 'status-card healthy';
                document.getElementById('n8n-status-text').textContent = `OK (${n8nTime}ms)`;
                this.log('Health', `✅ n8n service healthy (${n8nTime}ms)`, 'success');
            } else {
                throw new Error('Unhealthy status');
            }
        } catch (error) {
            document.getElementById('n8n-status').className = 'status-card error';
            document.getElementById('n8n-status-text').textContent = 'ERROR';
            this.log('Health', `❌ n8n service error: ${error.message}`, 'error');
        }
    }
    
    setupEventListeners() {
        // Recording controls
        document.getElementById('start-recording').addEventListener('click', () => this.startRecording());
        document.getElementById('stop-recording').addEventListener('click', () => this.stopRecording());
        document.getElementById('play-recorded').addEventListener('click', () => this.playRecorded());
        
        // STT controls
        document.getElementById('test-stt-current').addEventListener('click', () => this.testSTTCurrent());
        document.getElementById('test-stt-file').addEventListener('click', () => this.testSTTFile());
        
        // TTS controls
        document.getElementById('test-tts').addEventListener('click', () => this.testTTS());
        document.getElementById('play-tts').addEventListener('click', () => this.playTTS());
        document.getElementById('download-tts').addEventListener('click', () => this.downloadTTS());
        
        // Pipeline controls
        document.getElementById('test-pipeline-simple').addEventListener('click', () => this.testSimplePipeline());
        document.getElementById('test-pipeline-wake').addEventListener('click', () => this.testWakeWordPipeline());
        document.getElementById('test-continuous').addEventListener('click', () => this.startContinuous());
        document.getElementById('stop-continuous').addEventListener('click', () => this.stopContinuous());
    }
    
    async startRecording() {
        try {
            this.log('Audio', '🎙️ Requesting microphone access...');
            
            if (!this.stream) {
                this.stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        channelCount: 1,
                        sampleRate: 16000,
                        echoCancellation: this.config.echoCancellation,
                        noiseSuppression: this.config.noiseSuppression
                    }
                });
                
                // Update audio info
                const tracks = this.stream.getAudioTracks();
                const settings = tracks[0].getSettings();
                document.getElementById('sample-rate').textContent = settings.sampleRate || '16000';
                document.getElementById('channels').textContent = settings.channelCount || '1';
                
                this.log('Audio', `✅ Microphone access granted - Sample Rate: ${settings.sampleRate}, Channels: ${settings.channelCount}`, 'success');
            }
            
            // Setup audio context for visualization
            if (!this.audioContext) {
                this.audioContext = new AudioContext({ sampleRate: 16000 });
                document.getElementById('audio-context-info').textContent = JSON.stringify({
                    state: this.audioContext.state,
                    sampleRate: this.audioContext.sampleRate,
                    baseLatency: this.audioContext.baseLatency,
                    outputLatency: this.audioContext.outputLatency
                }, null, 2);
            }
            
            const chunks = [];
            const mimeType = 'audio/webm;codecs=opus';
            
            document.getElementById('audio-format').textContent = mimeType;
            
            this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });
            
            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.push(e.data);
                    const totalSize = chunks.reduce((acc, chunk) => acc + chunk.size, 0);
                    document.getElementById('audio-size').textContent = `${(totalSize / 1024).toFixed(1)} KB`;
                }
            };
            
            this.mediaRecorder.onstop = () => {
                this.recordedBlob = new Blob(chunks, { type: mimeType });
                this.log('Audio', `✅ Recording complete - Size: ${(this.recordedBlob.size / 1024).toFixed(1)} KB`, 'success');
                
                // Update audio data display
                document.getElementById('audio-data').textContent = JSON.stringify({
                    type: this.recordedBlob.type,
                    size: this.recordedBlob.size,
                    duration: ((Date.now() - this.recordingStartTime) / 1000).toFixed(1) + 's'
                }, null, 2);
                
                document.getElementById('play-recorded').disabled = false;
                document.getElementById('stop-recording').disabled = true;
                document.getElementById('recording-indicator').classList.remove('active');
                
                this.updateRecorderState();
            };
            
            this.mediaRecorder.onerror = (e) => {
                this.log('Audio', `❌ Recording error: ${e.error}`, 'error');
            };
            
            this.mediaRecorder.start(100); // Collect data every 100ms for real-time size updates
            this.recordingStartTime = Date.now();
            this.isRecording = true;
            
            document.getElementById('start-recording').disabled = true;
            document.getElementById('stop-recording').disabled = false;
            document.getElementById('recording-indicator').classList.add('active');
            
            this.log('Audio', '🔴 Recording started');
            this.updateRecorderState();
            
            // Update duration counter
            const durationInterval = setInterval(() => {
                if (!this.isRecording) {
                    clearInterval(durationInterval);
                    return;
                }
                const duration = ((Date.now() - this.recordingStartTime) / 1000).toFixed(1);
                document.getElementById('recording-duration').textContent = `${duration}s`;
            }, 100);
            
        } catch (error) {
            this.log('Audio', `❌ Failed to start recording: ${error.message}`, 'error');
        }
    }
    
    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
            this.isRecording = false;
            document.getElementById('start-recording').disabled = false;
            this.log('Audio', '⏹️ Recording stopped');
        }
    }
    
    playRecorded() {
        if (!this.recordedBlob) {
            this.log('Audio', '⚠️ No recording available', 'warning');
            return;
        }
        
        const audio = new Audio(URL.createObjectURL(this.recordedBlob));
        audio.play();
        this.log('Audio', '▶️ Playing recorded audio');
    }
    
    async testSTTCurrent() {
        if (!this.recordedBlob) {
            this.log('STT', '⚠️ No recording available. Record audio first.', 'warning');
            return;
        }
        
        await this.testSTT(this.recordedBlob);
    }
    
    async testSTTFile() {
        // Create a simple test audio
        this.log('STT', '🎵 Generating test audio...');
        
        // For now, use the recorded blob if available
        if (this.recordedBlob) {
            await this.testSTT(this.recordedBlob);
        } else {
            this.log('STT', '⚠️ Please record some audio first', 'warning');
        }
    }
    
    async testSTT(audioBlob) {
        try {
            this.log('STT', `📤 Sending audio to STT service (${(audioBlob.size / 1024).toFixed(1)} KB)...`);
            
            const formData = new FormData();
            formData.append('file', audioBlob, 'audio.webm');
            formData.append('model', this.config.model);
            
            document.getElementById('stt-request-time').textContent = new Date().toLocaleTimeString();
            const startTime = Date.now();
            
            const response = await fetch('/api/stt/v1/audio/transcriptions', {
                method: 'POST',
                body: formData
            });
            
            const responseTime = Date.now() - startTime;
            document.getElementById('stt-response-time').textContent = `${responseTime}ms`;
            
            const data = await response.json();
            
            // Update displays
            document.getElementById('stt-result').textContent = data.text || '(empty response)';
            document.getElementById('stt-raw-response').textContent = JSON.stringify(data, null, 2);
            
            if (data.text) {
                this.log('STT', `✅ Transcription: "${data.text}" (${responseTime}ms)`, 'success');
            } else {
                this.log('STT', `⚠️ Empty transcription received (${responseTime}ms)`, 'warning');
            }
            
            return data.text;
            
        } catch (error) {
            this.log('STT', `❌ STT Error: ${error.message}`, 'error');
            document.getElementById('stt-result').textContent = `Error: ${error.message}`;
        }
    }
    
    async testTTS() {
        try {
            const text = document.getElementById('tts-input').value;
            if (!text) {
                this.log('TTS', '⚠️ Please enter text to synthesize', 'warning');
                return;
            }
            
            this.log('TTS', `📤 Sending text to TTS: "${text.substring(0, 50)}..."`);
            
            const startTime = Date.now();
            
            const response = await fetch('/api/tts/api/tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    text,
                    voice: document.getElementById('tts-voice').textContent
                })
            });
            
            const genTime = Date.now() - startTime;
            document.getElementById('tts-gen-time').textContent = `${genTime}ms`;
            
            if (!response.ok) {
                throw new Error(`TTS error: ${response.status}`);
            }
            
            this.ttsBlob = await response.blob();
            
            document.getElementById('tts-result').textContent = `Generated ${(this.ttsBlob.size / 1024).toFixed(1)} KB WAV file in ${genTime}ms`;
            document.getElementById('play-tts').disabled = false;
            document.getElementById('download-tts').disabled = false;
            
            this.log('TTS', `✅ Speech generated: ${(this.ttsBlob.size / 1024).toFixed(1)} KB in ${genTime}ms`, 'success');
            
        } catch (error) {
            this.log('TTS', `❌ TTS Error: ${error.message}`, 'error');
            document.getElementById('tts-result').textContent = `Error: ${error.message}`;
        }
    }
    
    playTTS() {
        if (!this.ttsBlob) {
            this.log('TTS', '⚠️ No TTS audio available', 'warning');
            return;
        }
        
        const audio = new Audio(URL.createObjectURL(this.ttsBlob));
        audio.play();
        this.log('TTS', '▶️ Playing TTS audio');
    }
    
    downloadTTS() {
        if (!this.ttsBlob) return;
        
        const url = URL.createObjectURL(this.ttsBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tts-${Date.now()}.wav`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.log('TTS', '💾 Downloaded TTS audio');
    }
    
    async testSimplePipeline() {
        this.log('Pipeline', '🔄 Starting simple pipeline test...');
        
        const pipelineStart = Date.now();
        
        // Step 1: Record
        this.log('Pipeline', '1️⃣ Recording 3 seconds...');
        await this.recordForDuration(3000);
        
        const recordTime = Date.now();
        
        // Step 2: STT
        this.log('Pipeline', '2️⃣ Converting to text...');
        const text = await this.testSTT(this.recordedBlob);
        
        const sttTime = Date.now();
        
        if (!text) {
            this.log('Pipeline', '❌ Pipeline failed: No text from STT', 'error');
            return;
        }
        
        // Step 3: TTS
        this.log('Pipeline', '3️⃣ Generating speech...');
        document.getElementById('tts-input').value = `You said: ${text}`;
        await this.testTTS();
        
        const ttsTime = Date.now();
        
        // Step 4: Play
        this.log('Pipeline', '4️⃣ Playing response...');
        this.playTTS();
        
        const playTime = Date.now();
        
        // Update metrics
        const totalLatency = playTime - pipelineStart;
        document.getElementById('total-latency').textContent = `${totalLatency}ms`;
        document.getElementById('record-stt-latency').textContent = `${sttTime - recordTime}ms`;
        document.getElementById('stt-tts-latency').textContent = `${ttsTime - sttTime}ms`;
        document.getElementById('tts-play-latency').textContent = `${playTime - ttsTime}ms`;
        
        this.log('Pipeline', `✅ Pipeline complete! Total latency: ${totalLatency}ms`, 'success');
    }
    
    async recordForDuration(duration) {
        return new Promise((resolve) => {
            this.startRecording().then(() => {
                setTimeout(() => {
                    this.stopRecording();
                    setTimeout(resolve, 500); // Wait for recording to finalize
                }, duration);
            });
        });
    }
    
    async testWakeWordPipeline() {
        this.log('Pipeline', '🎤 Starting wake word test... Say "Hey Pi" followed by a command');
        
        await this.recordForDuration(5000);
        
        const text = await this.testSTT(this.recordedBlob);
        
        if (text && text.toLowerCase().includes('hey pi')) {
            this.log('Pipeline', '✅ Wake word detected!', 'success');
            const command = text.toLowerCase().replace(/hey pi/g, '').trim();
            
            if (command) {
                this.log('Pipeline', `📝 Command: "${command}"`);
                document.getElementById('tts-input').value = `Processing command: ${command}`;
                await this.testTTS();
                this.playTTS();
            }
        } else {
            this.log('Pipeline', '❌ Wake word not detected in: ' + text, 'warning');
        }
    }
    
    async startContinuous() {
        this.isContinuous = true;
        document.getElementById('test-continuous').disabled = true;
        document.getElementById('stop-continuous').disabled = false;
        
        this.log('Continuous', '♾️ Starting continuous recording mode...');
        
        while (this.isContinuous) {
            await this.recordForDuration(4000);
            
            if (!this.isContinuous) break;
            
            const text = await this.testSTT(this.recordedBlob);
            
            if (text) {
                this.log('Continuous', `Heard: "${text}"`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    
    stopContinuous() {
        this.isContinuous = false;
        document.getElementById('test-continuous').disabled = false;
        document.getElementById('stop-continuous').disabled = true;
        this.log('Continuous', '⏹️ Stopped continuous mode');
    }
    
    updateRecorderState() {
        const state = this.mediaRecorder ? {
            state: this.mediaRecorder.state,
            mimeType: this.mediaRecorder.mimeType,
            audioBitsPerSecond: this.mediaRecorder.audioBitsPerSecond,
            videoBitsPerSecond: this.mediaRecorder.videoBitsPerSecond
        } : { state: 'Not initialized' };
        
        document.getElementById('recorder-state').textContent = JSON.stringify(state, null, 2);
    }
    
    startWaveformVisualization() {
        const canvas = document.getElementById('waveform');
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = 100;
        
        const draw = () => {
            requestAnimationFrame(draw);
            
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            if (!this.audioContext || !this.stream) {
                ctx.strokeStyle = '#333';
                ctx.beginPath();
                ctx.moveTo(0, canvas.height / 2);
                ctx.lineTo(canvas.width, canvas.height / 2);
                ctx.stroke();
                return;
            }
            
            try {
                const source = this.audioContext.createMediaStreamSource(this.stream);
                const analyser = this.audioContext.createAnalyser();
                source.connect(analyser);
                
                const bufferLength = analyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);
                analyser.getByteTimeDomainData(dataArray);
                
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#00ff00';
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
                
            } catch (e) {
                // Silently handle if audio context is not ready
            }
        };
        
        draw();
    }
}

// Utility functions
function toggleExpand(element) {
    element.classList.toggle('expanded');
    const nextElement = element.nextElementSibling;
    if (nextElement) {
        nextElement.classList.toggle('hidden');
    }
}

function clearConsole() {
    document.getElementById('console-log').innerHTML = '';
    dashboard.log('System', '🧹 Console cleared');
}

function downloadLogs() {
    const logs = dashboard.logs.map(log => 
        `[${log.timestamp}] [${log.category}] ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-logs-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

function copyDebugInfo() {
    // Gather all debug information
    const debugInfo = {
        timestamp: new Date().toISOString(),
        services: {
            stt: document.getElementById('stt-status-text').textContent,
            tts: document.getElementById('tts-status-text').textContent,
            n8n: document.getElementById('n8n-status-text').textContent
        },
        audio: {
            sampleRate: document.getElementById('sample-rate').textContent,
            format: document.getElementById('audio-format').textContent,
            lastDuration: document.getElementById('recording-duration').textContent,
            lastSize: document.getElementById('audio-size').textContent
        },
        lastSTT: {
            result: document.getElementById('stt-result').textContent,
            responseTime: document.getElementById('stt-response-time').textContent,
            model: document.getElementById('stt-model').textContent
        },
        config: dashboard.config,
        recentLogs: dashboard.logs.slice(-20).map(log => 
            `[${log.timestamp}] [${log.category}] ${log.message}`
        ),
        browserCaps: document.getElementById('browser-caps').textContent,
        recorderState: document.getElementById('recorder-state').textContent
    };
    
    const debugText = `
=== Pi Voice Assistant Debug Info ===
Generated: ${debugInfo.timestamp}

SERVICE STATUS:
- STT: ${debugInfo.services.stt}
- TTS: ${debugInfo.services.tts}
- n8n: ${debugInfo.services.n8n}

AUDIO CAPTURE:
- Sample Rate: ${debugInfo.audio.sampleRate}
- Format: ${debugInfo.audio.format}
- Last Recording: ${debugInfo.audio.lastDuration} / ${debugInfo.audio.lastSize}

STT RESULTS:
- Last Result: ${debugInfo.lastSTT.result}
- Response Time: ${debugInfo.lastSTT.responseTime}
- Model: ${debugInfo.lastSTT.model}

CONFIG:
${JSON.stringify(debugInfo.config, null, 2)}

RECENT LOGS:
${debugInfo.recentLogs.join('\n')}

BROWSER CAPABILITIES:
${debugInfo.browserCaps}

RECORDER STATE:
${debugInfo.recorderState}
=== End Debug Info ===`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(debugText).then(() => {
        dashboard.log('System', '📋 Debug info copied to clipboard!', 'success');
        
        // Visual feedback
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        btn.style.background = '#0f0';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '#0ff';
        }, 2000);
    }).catch(err => {
        dashboard.log('System', `❌ Failed to copy: ${err}`, 'error');
    });
}

function applyConfig() {
    dashboard.config.duration = parseInt(document.getElementById('config-duration').value);
    dashboard.config.model = document.getElementById('config-model').value;
    dashboard.config.echoCancellation = document.getElementById('config-echo').checked;
    dashboard.config.noiseSuppression = document.getElementById('config-noise').checked;
    
    dashboard.log('Config', `✅ Configuration updated: ${JSON.stringify(dashboard.config)}`);
    
    // Update displayed model
    document.getElementById('stt-model').textContent = dashboard.config.model;
}

// Initialize dashboard
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new DebugDashboard();
});