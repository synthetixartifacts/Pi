class VoiceAssistant {
    constructor() {
        this.isListening = false;
        this.audioContext = null;
        this.mediaRecorder = null;
        this.stream = null;
        this.initializeUI();
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
        
        this.addLog('Voice Assistant initialized');
    }
    
    async start() {
        try {
            this.addLog('Requesting microphone access...');
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    channelCount: 1,
                    sampleRate: 16000
                } 
            });
            
            this.audioContext = new AudioContext({ sampleRate: 16000 });
            this.setupAudioProcessing(this.stream);
            
            this.isListening = true;
            this.updateStatus('Listening');
            this.startBtn.disabled = true;
            this.stopBtn.disabled = false;
            
            this.transcript.textContent = 'Listening for commands... (Note: Wake word detection not yet implemented)';
            this.addLog('Voice assistant started - Microphone active');
            
            // For POC, start recording after 2 seconds (simulating wake word)
            setTimeout(() => {
                if (this.isListening) {
                    this.addLog('Demo: Simulating wake word detection...');
                    this.recordCommand();
                }
            }, 2000);
            
        } catch (error) {
            this.addLog(`Error: ${error.message}`, 'error');
            this.transcript.textContent = `Error: ${error.message}`;
        }
    }
    
    async recordCommand() {
        if (!this.isListening) return;
        
        this.addLog('Recording audio for 3 seconds...');
        this.transcript.textContent = 'Recording your command...';
        
        const chunks = [];
        this.mediaRecorder = new MediaRecorder(this.stream);
        
        this.mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        this.mediaRecorder.onstop = async () => {
            const blob = new Blob(chunks, { type: 'audio/webm' });
            await this.processCommand(blob);
        };
        
        this.mediaRecorder.start();
        
        setTimeout(() => {
            if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
                this.mediaRecorder.stop();
            }
        }, 3000);
    }
    
    async processCommand(audioBlob) {
        try {
            this.addLog('Processing audio...');
            this.transcript.textContent = 'Processing your command...';
            
            // For demo, just show a message
            // In production, this would send to STT service
            this.transcript.textContent = 'Demo mode: Audio captured successfully. STT service integration pending.';
            this.addLog('Audio captured - STT integration needed');
            
            // Demo: Record again after 5 seconds
            if (this.isListening) {
                setTimeout(() => this.recordCommand(), 5000);
            }
            
        } catch (error) {
            this.addLog(`Processing error: ${error.message}`, 'error');
            this.transcript.textContent = `Error: ${error.message}`;
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
        }
        
        if (this.audioContext) {
            this.audioContext.close();
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
        const logEntry = `[${timestamp}] ${message}\n`;
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
