# How to Start the Pi Voice Assistant - Detailed Guide

This guide provides detailed instructions and troubleshooting for starting the Pi Voice Assistant. For quick start, see the main [README](../../README.md).

## 🚀 Using the Universal Start Script

The project includes a universal start script that auto-detects your platform:

```bash
./start.sh          # Works on macOS, Linux, WSL, and Raspberry Pi
start.bat           # For Windows Command Prompt
```

## 📋 What Happens During Startup

### Phase 1: Platform Detection
- Identifies your OS (macOS, Windows WSL, Raspberry Pi, Linux)
- Detects architecture (Intel, Apple Silicon, ARM)
- Sets appropriate environment variables

### Phase 2: Docker Check
- Verifies Docker is installed and running
- Attempts to start Docker if needed
- On Pi: Installs Docker if missing

### Phase 3: Configuration
- Checks for existing `.env` file
- Preserves your custom settings
- Updates only platform-specific values
- Creates backup before modifications

### Phase 4: Service Initialization
- Selects correct docker-compose file
- Pulls required Docker images
- Builds custom services if needed
- Creates necessary directories

### Phase 5: Health Verification
- Starts all containers
- Waits for services to be healthy
- Reports status of each service
- Opens browser automatically

## ⏱️ Expected Startup Times

| Platform | First Run | Subsequent | Notes |
|----------|-----------|------------|-------|
| macOS Intel | 3-5 min | 30-60 sec | Rosetta not needed |
| macOS M1/M2/M3 | 4-6 min | 30-60 sec | Uses Rosetta emulation |
| Windows WSL2 | 3-5 min | 30-60 sec | Depends on WSL2 resources |
| Raspberry Pi 5 | 5-10 min | 1-2 min | Slower due to ARM and SD card |
| Linux | 2-4 min | 20-40 sec | Native performance |

## 🔧 Manual Commands Reference

### Service Management
```bash
# Check status
docker compose ps

# View logs (all services)
docker compose logs -f

# View specific service logs
docker compose logs -f n8n
docker compose logs -f stt
docker compose logs -f tts

# Restart service
docker compose restart [service]

# Stop everything
docker compose down

# Stop and remove data
docker compose down -v
```

### Health Checks
```bash
# Check individual services
curl http://localhost:5678/healthz  # n8n
curl http://localhost:8000/health   # STT
curl http://localhost:5000/health   # TTS
curl http://localhost:8080          # Web UI
```

### Container Debugging
```bash
# Enter container shell
docker exec -it pi-n8n /bin/sh
docker exec -it pi-stt /bin/bash
docker exec -it pi-tts /bin/bash

# View resource usage
docker stats

# Check container logs
docker logs pi-n8n
docker logs pi-stt
docker logs pi-tts
```

### Testing Services
```bash
# Test STT with audio file
curl -X POST http://localhost:8000/v1/audio/transcriptions \
  -F "audio=@test.wav" \
  -F "model=small.en"

# Test TTS
curl -X POST http://localhost:5000/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello from Pi Assistant"}' \
  --output response.wav

# Test n8n webhook
curl -X POST http://localhost:5678/webhook/test \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}'
```

## 🚨 Common Issues

### "Docker not running"
- **macOS**: Open Docker Desktop app
- **Windows**: Start Docker Desktop, check WSL integration
- **Linux/Pi**: `sudo systemctl start docker`

### "Port already in use"
```bash
# Find process using port
lsof -i :5678  # macOS/Linux
netstat -ano | findstr :5678  # Windows

# Change port in .env file
N8N_PORT=5679
```

### "Services unhealthy"
1. Check logs: `docker compose logs [service]`
2. Restart service: `docker compose restart [service]`
3. Rebuild if needed: `docker compose build [service]`

### "Permission denied"
```bash
# Make scripts executable
chmod +x start.sh
chmod +x start/*.sh
```

## 📊 Monitoring

### Real-time Monitoring
```bash
# Watch container status
watch docker ps

# Monitor resource usage
docker stats

# Follow all logs
docker compose logs -f
```

### Service URLs
After successful startup, access:
- **Web UI**: http://localhost:8080
- **n8n**: http://localhost:5678 (admin/changeme123)
- **STT API**: http://localhost:8000/docs
- **TTS API**: http://localhost:5000/health

## 🔄 Backup & Restore

### Backup n8n workflows
```bash
docker run --rm -v pi_n8n_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/n8n_backup.tar.gz -C /data .
```

### Restore n8n workflows
```bash
docker run --rm -v pi_n8n_data:/data -v $(pwd):/backup \
  alpine tar xzf /backup/n8n_backup.tar.gz -C /data
```

## 📝 Configuration Tips

### Adjust Resources
Edit `.env` file:
```bash
# For limited RAM systems
MEMORY_LIMIT=2g
CPU_LIMIT=2

# For better performance
MEMORY_LIMIT=6g
CPU_LIMIT=4
```

### Change Models
```bash
# Faster (less accurate)
WHISPER_MODEL=tiny.en

# Balanced
WHISPER_MODEL=small.en

# More accurate (slower)
WHISPER_MODEL=base.en
```

## 🔗 Related Documentation
- [Platform-Specific Guide](./PLATFORMS.md) - Detailed platform configurations
- [API Documentation](../API.md) - Service API references
- [Troubleshooting](../TROUBLESHOOTING.md) - Extended problem solving
- [Deployment Guide](../DEPLOYMENT.md) - Production deployment