# Raspberry Pi Deployment Guide

## Overview
This guide covers deploying the Pi Voice Assistant from your Windows/WSL2 development environment to a Raspberry Pi 5.

## Prerequisites

### Hardware Requirements
- Raspberry Pi 5 (8GB recommended)
- MicroSD card (32GB minimum) or NVMe SSD via M.2 HAT
- Power supply (27W official recommended)
- Ethernet cable or WiFi configuration
- USB microphone or ReSpeaker Mic Array
- Speakers (3.5mm or USB)
- Optional: Camera Module 3

### Software Requirements
- Raspberry Pi OS 64-bit (Bookworm)
- Docker and Docker Compose installed
- Git

## Preparation Phase

### Step 1: Prepare Raspberry Pi OS

1. Download Raspberry Pi Imager
2. Flash Raspberry Pi OS (64-bit) to SD card/SSD
3. Enable SSH and configure WiFi (if needed) during imaging
4. Set hostname to `piassistant`

### Step 2: Initial Pi Setup

Connect to your Pi via SSH:
```bash
ssh pi@piassistant.local
```

Update system:
```bash
sudo apt update && sudo apt upgrade -y
```

Install Docker:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
# Logout and login again for group changes
```

Install Docker Compose:
```bash
sudo apt install docker-compose -y
```

## Deployment Process

### Step 1: Transfer Project Files

On your Windows/WSL2 machine:
```bash
cd /home/tommy/Project/Pi
tar czf pi-assistant.tar.gz --exclude='.git' --exclude='*.log' --exclude='node_modules' .
scp pi-assistant.tar.gz pi@piassistant.local:~/
```

On the Raspberry Pi:
```bash
mkdir -p ~/pi-assistant
cd ~/pi-assistant
tar xzf ~/pi-assistant.tar.gz
rm ~/pi-assistant.tar.gz
```

### Step 2: Adapt for ARM64

Create `docker-compose.arm64.yml`:
```yaml
version: '3.8'

services:
  stt:
    # Override with ARM64 compatible image
    image: lscr.io/linuxserver/faster-whisper:latest
    environment:
      - PUID=1000
      - PGID=1000
      - WHISPER_MODEL=tiny.en  # Smaller model for Pi
    
  tts:
    # Use pre-built ARM64 image if available
    image: lscr.io/linuxserver/piper:latest
    environment:
      - PUID=1000
      - PGID=1000
      - PIPER_VOICE=en_US-lessac-medium
    ports:
      - "10200:10200"  # Wyoming protocol port
    
  # n8n already supports ARM64 natively
  # web (nginx) already supports ARM64 natively
```

### Step 3: Configure for Pi Hardware

Update `.env` for Pi constraints:
```bash
# Reduce resource limits for Pi
MEMORY_LIMIT=2g
CPU_LIMIT=3

# Use smaller models
WHISPER_MODEL=tiny.en
PIPER_VOICE=en_US-lessac-medium

# Adjust for Pi performance
N8N_DEFAULT_BINARY_DATA_MODE=filesystem
```

### Step 4: Audio Setup

Configure USB microphone:
```bash
# List audio devices
arecord -l
aplay -l

# Set default audio devices
sudo nano /etc/asound.conf
```

Add to `/etc/asound.conf`:
```
pcm.!default {
    type asym
    playback.pcm "plughw:0,0"  # Adjust based on aplay -l
    capture.pcm "plughw:1,0"   # Adjust based on arecord -l
}
```

Test audio:
```bash
# Test recording
arecord -d 5 test.wav
# Test playback
aplay test.wav
```

### Step 5: Native Audio Bridge

Since Pi has direct audio access, create a native bridge instead of browser:

Create `services/audio-bridge/audio_bridge.py`:
```python
#!/usr/bin/env python3
import asyncio
import sounddevice as sd
import numpy as np
import requests
import json
import wave
import io
from datetime import datetime

class AudioBridge:
    def __init__(self):
        self.sample_rate = 16000
        self.channels = 1
        self.is_listening = False
        
    async def listen_for_wake_word(self):
        """Continuously listen for wake word"""
        print("Listening for wake word...")
        # Implement wake word detection
        # For now, record on button press or timer
        
    async def record_command(self, duration=3):
        """Record audio command"""
        print(f"Recording for {duration} seconds...")
        recording = sd.rec(
            int(duration * self.sample_rate),
            samplerate=self.sample_rate,
            channels=self.channels,
            dtype='int16'
        )
        sd.wait()
        return recording
    
    def audio_to_wav(self, audio_data):
        """Convert numpy array to WAV bytes"""
        buffer = io.BytesIO()
        with wave.open(buffer, 'wb') as wf:
            wf.setnchannels(self.channels)
            wf.setsampwidth(2)
            wf.setframerate(self.sample_rate)
            wf.writeframes(audio_data.tobytes())
        return buffer.getvalue()
    
    async def send_to_stt(self, audio_bytes):
        """Send audio to STT service"""
        try:
            response = requests.post(
                'http://localhost:8000/v1/audio/transcriptions',
                files={'audio': ('command.wav', audio_bytes, 'audio/wav')},
                data={'model': 'tiny.en'}
            )
            return response.json().get('text', '')
        except Exception as e:
            print(f"STT Error: {e}")
            return None
    
    async def send_to_tts(self, text):
        """Send text to TTS service"""
        try:
            response = requests.post(
                'http://localhost:10200/api/synthesize',
                json={'text': text}
            )
            return response.content
        except Exception as e:
            print(f"TTS Error: {e}")
            return None
    
    def play_audio(self, audio_bytes):
        """Play WAV audio"""
        with wave.open(io.BytesIO(audio_bytes)) as wf:
            frames = wf.readframes(wf.getnframes())
            audio_data = np.frombuffer(frames, dtype=np.int16)
            sd.play(audio_data, wf.getframerate())
            sd.wait()
    
    async def run(self):
        """Main loop"""
        print("Audio Bridge Started")
        while True:
            # Wait for trigger (button, wake word, etc.)
            await asyncio.sleep(5)
            
            # Record command
            audio = await self.record_command()
            wav_bytes = self.audio_to_wav(audio)
            
            # Process with STT
            text = await self.send_to_stt(wav_bytes)
            if text:
                print(f"Recognized: {text}")
                
                # Send to n8n
                response = requests.post(
                    'http://localhost:5678/webhook/voice-command',
                    json={'command': text}
                )
                
                # Get response and speak
                if response.ok:
                    result = response.json()
                    if 'response' in result:
                        tts_audio = await self.send_to_tts(result['response'])
                        if tts_audio:
                            self.play_audio(tts_audio)

if __name__ == '__main__':
    bridge = AudioBridge()
    asyncio.run(bridge.run())
```

### Step 6: Start Services

```bash
cd ~/pi-assistant

# Use ARM64 overrides
docker compose -f docker-compose.yml -f docker-compose.arm64.yml up -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

### Step 7: Setup Autostart

Create systemd service:
```bash
sudo nano /etc/systemd/system/pi-assistant.service
```

Add:
```ini
[Unit]
Description=Pi Voice Assistant
After=docker.service
Requires=docker.service

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/pi-assistant
ExecStart=/usr/bin/docker compose up
ExecStop=/usr/bin/docker compose down
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable service:
```bash
sudo systemctl enable pi-assistant.service
sudo systemctl start pi-assistant.service
```

## Performance Optimization

### 1. Use Smaller Models
- Whisper: Use `tiny.en` or `base.en`
- Piper: Use lighter voices
- Limit concurrent services

### 2. Swap Configuration
```bash
# Increase swap for memory-intensive operations
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# Set CONF_SWAPSIZE=2048
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

### 3. GPU Memory Split
```bash
sudo raspi-config
# Advanced Options > Memory Split
# Set to 128 or 256 for headless operation
```

### 4. Overclocking (Optional)
```bash
sudo nano /boot/config.txt
# Add (for Pi 5):
over_voltage=4
arm_freq=2400
gpu_freq=700
```

## Hardware Additions

### Camera Module
```bash
# Enable camera
sudo raspi-config
# Interface Options > Camera > Enable

# Test camera
libcamera-still -o test.jpg
```

### GPIO Integration
```python
# For LED indicators, buttons, etc.
import RPi.GPIO as GPIO

GPIO.setmode(GPIO.BCM)
GPIO.setup(18, GPIO.OUT)  # LED
GPIO.setup(23, GPIO.IN, pull_up_down=GPIO.PUD_UP)  # Button
```

### ReSpeaker Mic Array
```bash
# Install drivers if needed
git clone https://github.com/respeaker/seeed-voicecard
cd seeed-voicecard
sudo ./install.sh
sudo reboot
```

## Monitoring

### Resource Monitoring
```bash
# Install monitoring tools
sudo apt install htop iotop

# Monitor Docker
docker stats

# Check temperature
vcgencmd measure_temp
```

### Service Health
```bash
# Create health check script
cat > check_health.sh << 'EOF'
#!/bin/bash
echo "Checking services..."
curl -s http://localhost:5678/healthz || echo "n8n: Failed"
curl -s http://localhost:8000/health || echo "STT: Failed"
curl -s http://localhost:10200/health || echo "TTS: Failed"
EOF

chmod +x check_health.sh
```

## Troubleshooting Pi-Specific Issues

### Issue: Services crash due to memory
**Solution**: Reduce model sizes, increase swap, limit concurrent services

### Issue: Audio device not found
**Solution**: Check USB connection, verify with `arecord -l`, update asound.conf

### Issue: Slow performance
**Solution**: Use faster SD card (A2 rated), consider SSD via M.2 HAT, reduce model complexity

### Issue: Network connectivity
**Solution**: Use ethernet for stability, configure WiFi properly, check firewall

## Backup and Recovery

### Backup Configuration
```bash
# On Pi
cd ~/pi-assistant
tar czf backup-$(date +%Y%m%d).tar.gz .env services/n8n/data

# Transfer to development machine
scp backup-*.tar.gz user@devmachine:~/backups/
```

### Full System Backup
```bash
# Create image of SD card
sudo dd if=/dev/mmcblk0 of=pi-backup.img bs=4M status=progress
```

## Security Considerations

1. Change default passwords in `.env`
2. Setup firewall:
```bash
sudo ufw allow ssh
sudo ufw allow 5678  # n8n
sudo ufw enable
```
3. Use secure passwords for n8n
4. Consider VPN for remote access
5. Regular updates: `sudo apt update && sudo apt upgrade`

## Next Steps

1. Configure n8n workflows for your use cases
2. Add custom wake words
3. Integrate with smart home devices
4. Set up remote access (VPN/Tailscale)
5. Add camera-based features
6. Optimize for battery operation (if needed)

## Resources

- [Raspberry Pi Documentation](https://www.raspberrypi.com/documentation/)
- [Docker on Raspberry Pi](https://docs.docker.com/engine/install/debian/)
- [n8n on ARM](https://docs.n8n.io/hosting/installation/docker/)
- [Rhasspy Documentation](https://rhasspy.readthedocs.io/)