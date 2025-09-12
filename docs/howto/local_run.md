# How to Run Pi Voice Assistant Locally

This document contains all commands needed to run the Pi Voice Assistant POC on your local Windows/WSL2 environment. Commands are formatted for easy copy-paste.

## DAILY STARTUP COMMANDS (Execute these to run the project)

### Step 1: Navigate to Project
cd /home/tommy/Project/Pi

### Step 2: Start All Services
docker compose up -d

### Step 3: Check Service Status (wait ~30 seconds for initialization)
docker compose ps

### Step 4: View Logs (optional - to monitor startup)
docker compose logs -f

Press Ctrl+C to exit log view

### Step 5: Access Services
Open your browser and navigate to:
- Web UI: http://localhost:8080
- n8n: http://localhost:5678
  Username: admin
  Password: (the one you set in .env file)

## STOPPING THE PROJECT

### Stop All Services
docker compose down

### Stop and Remove All Data (CAUTION - deletes everything)
docker compose down -v

## TROUBLESHOOTING COMMANDS

### Check Individual Service Logs
docker compose logs n8n
docker compose logs stt
docker compose logs tts
docker compose logs web

### Restart a Specific Service
docker compose restart n8n
docker compose restart stt
docker compose restart tts
docker compose restart web

### Rebuild TTS Service (if you modified the code)
docker compose build tts
docker compose up -d tts

### Check Service Health
curl http://localhost:5678/healthz
curl http://localhost:8000/health
curl http://localhost:5000/health
curl http://localhost:8080

### View Running Containers
docker ps

### View Docker Networks
docker network ls

### Check Port Usage
netstat -tulpn | grep LISTEN

## DEVELOPMENT COMMANDS

### Enter a Container Shell
docker exec -it pi-n8n /bin/sh
docker exec -it pi-stt /bin/bash
docker exec -it pi-tts /bin/bash
docker exec -it pi-web /bin/sh

### View Container Resource Usage
docker stats

### Update a Service Image
docker compose pull n8n
docker compose up -d n8n

### Clean Docker System (free space)
docker system prune -a

## MIGRATION COMMANDS (One-time when updating)

### Update All Images
docker compose pull
docker compose up -d

### Backup n8n Data
docker run --rm -v pi_n8n_data:/data -v $(pwd):/backup alpine tar czf /backup/n8n_backup.tar.gz -C /data .

### Restore n8n Data
docker run --rm -v pi_n8n_data:/data -v $(pwd):/backup alpine tar xzf /backup/n8n_backup.tar.gz -C /data

## TESTING COMMANDS

### Test STT Service (requires a test.wav file)
curl -X POST http://localhost:8000/v1/audio/transcriptions -F "audio=@test.wav" -F "model=small.en"

### Test TTS Service
curl -X POST http://localhost:5000/api/tts -H "Content-Type: application/json" -d '{"text":"Hello from Docker"}' --output response.wav

### Test n8n Webhook
curl -X POST http://localhost:5678/webhook/test -H "Content-Type: application/json" -d '{"message":"test"}'

## NOTES

1. First startup may take 5-10 minutes as Docker downloads images
2. n8n takes 30-60 seconds to fully initialize
3. STT model download happens on first run (may take a few minutes)
4. Keep your .env passwords secure and never commit them to git
5. The Web UI currently runs in demo mode - full integration pending

## QUICK COMMAND REFERENCE

Start: docker compose up -d
Stop: docker compose down
Logs: docker compose logs -f
Status: docker compose ps
Restart: docker compose restart

Remember: Always run commands from /home/tommy/Project/Pi directory