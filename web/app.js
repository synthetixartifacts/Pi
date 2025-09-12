class VoiceAssistant {
    constructor() {
        this.isListening = false;
        this.audioContext = null;
        this.mediaRecorder = null;
        this.stream = null;
        this.audioChunks = [];
        this.initializeUI();
        this.testServices();
    }
    
    initializeUI() {
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.status = document.getElementById('status');
        this.log = document.getElementById('log');
        this.transcript = document.getElementById('transcript');
        this.sensitivity = document.getElementById('sensitivity');
        this.sensitivityValue = document.getElementById('sensitivityValue');
        
        this.startBtn.addEventListener('click', () => this.start());
        this.stopBtn.addEventListener('click', () => this.stop());
        this.sensitivity.addEventListener('input', (e) => {
            this.sensitivityValue.textContent = e.target.value;
        });
        
        // Add test buttons
        this.addTestButtons();
        
        this.addLog('Voice Assistant initialized');
    }
    
    addTestButtons() {
        // Create test panel
        const testPanel = document.createElement('div');
        testPanel.style.cssText = 'background: #e5e7eb; padding: 15px; border-radius: 10px; margin: 20px 0;';
        testPanel.innerHTML = `
            <h3>Test Controls</h3>
            <div style="display: flex; gap: 10px; margin: 10px 0;">
                <button id="testRecordBtn" style="padding: 10px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Test Record (3s)
                </button>
                <button id="testTTSBtn" style="padding: 10px; background: #10b981; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Test TTS
                </button>
                <button id="testPipelineBtn" style="padding: 10px; background: #8b5cf6; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Test Full Pipeline
                </button>
            </div>
        `;
        
        // Insert after control panel
        const controlPanel = document.querySelector('.control-panel');
        controlPanel.parentNode.insertBefore(testPanel, controlPanel.nextSibling);
        
        // Add event listeners
        document.getElementById('testRecordBtn').addEventListener('click', () => this.testRecording());
        document.getElementById('testTTSBtn').addEventListener('click', () => this.testTTS());
        document.getElementById('testPipelineBtn').addEventListener('click', () => this.testFullPipeline());
    }
    
    async testServices() {
        this.addLog('Testing service connectivity...');
        
        // Test STT health
        try {
            const sttResponse = await fetch('/api/stt/health');
            if (sttResponse.ok) {
                this.addLog('✓ STT service connected');
            } else {
                this.addLog('✗ STT service error: ' + sttResponse.status);
            }
        } catch (error) {
            this.addLog('✗ STT service unreachable: ' + error.message);
        }
        
        // Test TTS health
        try {
            const ttsResponse = await fetch('/api/tts/health');
            const ttsData = await ttsResponse.json();
            if (ttsData.status === 'healthy') {
                this.addLog('✓ TTS service connected');
            } else {
                this.addLog('✗ TTS service unhealthy');
            }
        } catch (error) {
            this.addLog('✗ TTS service unreachable: ' + error.message);
        }
        
        // Test n8n health
        try {
            const n8nResponse = await fetch('/api/n8n/healthz');
            const n8nData = await n8nResponse.json();
            if (n8nData.status === 'ok') {
                this.addLog('✓ n8n service connected');
            } else {
                this.addLog('✗ n8n service unhealthy');
            }
        } catch (error) {
            this.addLog('✗ n8n service unreachable: ' + error.message);
        }
    }
    
    async testRecording() {
        this.addLog('Starting 3-second test recording...');
        this.transcript.textContent = 'Recording for 3 seconds...';
        
        try {
            // Get microphone access if not already
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
            
            // Record for 3 seconds
            const audioBlob = await this.recordAudio(3000);
            this.addLog(`Recorded ${(audioBlob.size / 1024).toFixed(1)}KB of audio`);
            
            // Send to STT
            this.transcript.textContent = 'Processing audio...';
            const text = await this.sendToSTT(audioBlob);
            
            if (text) {
                this.transcript.textContent = `Recognized: "${text}"`;
                this.addLog(`STT Result: ${text}`);
            } else {
                this.transcript.textContent = 'No speech detected or empty response';
                this.addLog('STT returned empty text');
            }
            
        } catch (error) {
            this.addLog(`Recording error: ${error.message}`, 'error');
            this.transcript.textContent = `Error: ${error.message}`;
        }
    }
    
    async testTTS() {
        const testText = "Hello! This is the Pi voice assistant. Text to speech is working correctly.";
        this.addLog('Testing TTS...');
        this.transcript.textContent = `Speaking: "${testText}"`;
        
        try {
            const audioUrl = await this.textToSpeech(testText);
            const audio = new Audio(audioUrl);
            
            audio.onended = () => {
                this.addLog('TTS playback completed');
                URL.revokeObjectURL(audioUrl);
            };
            
            await audio.play();
            this.addLog('TTS audio playing...');
            
        } catch (error) {
            this.addLog(`TTS error: ${error.message}`, 'error');
            this.transcript.textContent = `TTS Error: ${error.message}`;
        }
    }
    
    async testFullPipeline() {
        this.addLog('Testing full pipeline: Record → STT → TTS');
        
        try {
            // Step 1: Record
            this.transcript.textContent = 'Step 1/3: Recording for 3 seconds...';
            const audioBlob = await this.recordAudio(3000);
            
            // Step 2: STT
            this.transcript.textContent = 'Step 2/3: Converting speech to text...';
            const text = await this.sendToSTT(audioBlob);
            
            if (!text) {
                throw new Error('No speech detected');
            }
            
            this.addLog(`Recognized: "${text}"`);
            
            // Step 3: TTS
            this.transcript.textContent = `Step 3/3: Speaking: "You said: ${text}"`;
            const response = `You said: ${text}`;
            const audioUrl = await this.textToSpeech(response);
            
            const audio = new Audio(audioUrl);
            await audio.play();
            
            this.addLog('✓ Full pipeline test completed successfully!');
            
        } catch (error) {
            this.addLog(`Pipeline error: ${error.message}`, 'error');
            this.transcript.textContent = `Pipeline Error: ${error.message}`;
        }
    }
    
    async recordAudio(duration = 3000) {
        return new Promise((resolve, reject) => {
            if (!this.stream) {
                reject(new Error('No microphone access'));
                return;
            }
            
            const chunks = [];
            const mediaRecorder = new MediaRecorder(this.stream, {
                mimeType: 'audio/webm;codecs=opus'
            });
            
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.push(e.data);
                }
            };
            
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm;codecs=opus' });
                resolve(blob);
            };
            
            mediaRecorder.onerror = (e) => {
                reject(new Error(`Recording error: ${e.error}`));
            };
            
            mediaRecorder.start();
            
            setTimeout(() => {
                if (mediaRecorder.state === 'recording') {
                    mediaRecorder.stop();
                }
            }, duration);
        });
    }
    
    async sendToSTT(audioBlob) {
        try {
            // Convert WebM to WAV if needed (for now, send as-is)
            const formData = new FormData();
            formData.append('file', audioBlob, 'audio.webm');
            formData.append('model', 'small.en');
            
            const response = await fetch('/api/stt/v1/audio/transcriptions', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`STT error: ${response.status}`);
            }
            
            const data = await response.json();
            return data.text || '';
            
        } catch (error) {
            this.addLog(`STT Error: ${error.message}`, 'error');
            throw error;
        }
    }
    
    async textToSpeech(text) {
        try {
            const response = await fetch('/api/tts/api/tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text })
            });
            
            if (!response.ok) {
                throw new Error(`TTS error: ${response.status}`);
            }
            
            const blob = await response.blob();
            return URL.createObjectURL(blob);
            
        } catch (error) {
            this.addLog(`TTS Error: ${error.message}`, 'error');
            throw error;
        }
    }
    
    async start() {
        try {
            this.addLog('Requesting microphone access...');
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    channelCount: 1,
                    sampleRate: 16000,
                    echoCancellation: true,
                    noiseSuppression: true
                } 
            });
            
            this.audioContext = new AudioContext({ sampleRate: 16000 });
            this.setupAudioProcessing(this.stream);
            
            this.isListening = true;
            this.updateStatus('Listening');
            this.startBtn.disabled = true;
            this.stopBtn.disabled = false;
            
            this.transcript.textContent = 'Ready! Use test buttons or wait for continuous recording...';
            this.addLog('Voice assistant started - Microphone active');
            
            // Start continuous recording loop
            this.startContinuousRecording();
            
        } catch (error) {
            this.addLog(`Error: ${error.message}`, 'error');
            this.transcript.textContent = `Error: ${error.message}`;
        }
    }
    
    async startContinuousRecording() {
        while (this.isListening) {
            try {
                this.transcript.textContent = 'Listening... (Say something)';
                const audioBlob = await this.recordAudio(4000);
                
                if (!this.isListening) break;
                
                this.transcript.textContent = 'Processing...';
                const text = await this.sendToSTT(audioBlob);
                
                if (text && text.length > 0) {
                    this.transcript.textContent = `Heard: "${text}"`;
                    this.addLog(`Speech: ${text}`);
                    
                    // Check for wake word or process command
                    if (text.toLowerCase().includes('hey pi') || text.toLowerCase().includes('okay pi')) {
                        this.addLog('Wake word detected!');
                        // Process command after wake word
                        const command = text.toLowerCase().replace(/hey pi|okay pi/g, '').trim();
                        if (command) {
                            await this.processCommand(command);
                        }
                    }
                }
                
                // Small pause between recordings
                await new Promise(resolve => setTimeout(resolve, 500));
                
            } catch (error) {
                this.addLog(`Recording loop error: ${error.message}`, 'error');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }
    
    async processCommand(command) {
        this.addLog(`Processing command: ${command}`);
        
        // Simple command processing for demo
        let response = '';
        
        if (command.includes('hello') || command.includes('hi')) {
            response = 'Hello! How can I help you today?';
        } else if (command.includes('time')) {
            const now = new Date();
            response = `The time is ${now.toLocaleTimeString()}`;
        } else if (command.includes('date')) {
            const now = new Date();
            response = `Today is ${now.toLocaleDateString()}`;
        } else {
            response = `You said: ${command}`;
        }
        
        // Speak response
        try {
            const audioUrl = await this.textToSpeech(response);
            const audio = new Audio(audioUrl);
            await audio.play();
            this.transcript.textContent = `Response: "${response}"`;
        } catch (error) {
            this.addLog(`Response error: ${error.message}`, 'error');
        }
    }
    
    stop() {
        this.isListening = false;
        this.updateStatus('Inactive');
        
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
        }
        
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        this.startBtn.disabled = false;
        this.stopBtn.disabled = true;
        this.transcript.textContent = 'Voice assistant stopped.';
        this.addLog('Voice assistant stopped');
    }
    
    updateStatus(status) {
        this.status.textContent = status;
        this.status.className = `status status-${status.toLowerCase()}`;
    }
    
    addLog(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = type === 'error' ? '❌' : '📝';
        const logEntry = `[${timestamp}] ${prefix} ${message}\n`;
        this.log.textContent = logEntry + this.log.textContent;
        
        // Keep log size manageable
        const lines = this.log.textContent.split('\n');
        if (lines.length > 50) {
            this.log.textContent = lines.slice(0, 50).join('\n');
        }
    }
    
    setupAudioProcessing(stream) {
        const source = this.audioContext.createMediaStreamSource(stream);
        const analyser = this.audioContext.createAnalyser();
        source.connect(analyser);
        this.visualizeAudio(analyser);
    }
    
    visualizeAudio(analyser) {
        const canvas = document.getElementById('waveform');
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const draw = () => {
            if (!this.isListening) return;
            
            requestAnimationFrame(draw);
            analyser.getByteTimeDomainData(dataArray);
            
            ctx.fillStyle = 'rgb(26, 26, 26)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'rgb(16, 185, 129)';
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