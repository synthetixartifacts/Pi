# Troubleshooting Guide

## Common Issues and Solutions

### Docker Issues

#### Problem: "Cannot connect to Docker daemon"
**Symptoms**: Error message when running docker commands
**Solution**:
1. Ensure Docker Desktop is running
2. Check Docker service status: `docker version`
3. Restart Docker Desktop from system tray
4. If on WSL2, ensure integration is enabled in Docker Desktop settings

#### Problem: "Port already in use"
**Symptoms**: Error starting containers about port binding
**Solution**:
1. Check what's using the port: `netstat -tulpn | grep <PORT>`
2. Stop conflicting service or change port in `.env` file
3. Common conflicts:
   - 5678: Another n8n instance
   - 8000: Python development servers
   - 8080: Web servers
   - 5000: Flask applications

#### Problem: "No space left on device"
**Symptoms**: Containers fail to start or download
**Solution**:
1. Clean Docker system: `docker system prune -a`
2. Remove unused volumes: `docker volume prune`
3. Check WSL2 disk usage: `df -h`
4. Increase Docker Desktop disk allocation in settings

### Service-Specific Issues

#### n8n Not Starting
**Symptoms**: n8n container exits or restarts continuously
**Solution**:
1. Check logs: `docker compose logs n8n`
2. Verify encryption key is 24+ characters in `.env`
3. Ensure database volume has proper permissions
4. Wait 60 seconds for initial setup
5. Try removing volume and restarting: `docker volume rm pi_n8n_data`

#### STT Service Errors
**Symptoms**: Speech-to-text not working or timing out
**Solution**:
1. Check if model is downloading: `docker compose logs stt`
2. First run may take 5-10 minutes to download model
3. Verify audio format is correct (16kHz, mono, WAV)
4. Check available memory: `docker stats`
5. Try smaller model in `.env`: `WHISPER_MODEL=tiny.en`

#### TTS Build Failures
**Symptoms**: TTS container fails to build
**Solution**:
1. Ensure TTS files exist: `ls services/tts/`
2. Check Docker build logs: `docker compose build tts --no-cache`
3. Verify internet connection for model download
4. Try manual build: `cd services/tts && docker build -t pi-tts .`

#### Web UI Not Loading
**Symptoms**: Cannot access http://localhost:8080
**Solution**:
1. Check if nginx is running: `docker compose ps web`
2. Verify files exist: `ls web/`
3. Check nginx logs: `docker compose logs web`
4. Clear browser cache and try incognito mode
5. Try direct file access: `cat web/index.html`

### Audio/Microphone Issues

#### Problem: "Microphone access denied"
**Symptoms**: Browser shows error about microphone
**Solution**:
1. Click padlock icon in browser address bar
2. Allow microphone permissions for localhost
3. Try different browser (Chrome/Edge recommended)
4. Check Windows microphone privacy settings
5. Ensure no other app is using microphone

#### Problem: "No audio output"
**Symptoms**: TTS generates file but no sound
**Solution**:
1. Check browser console for errors (F12)
2. Verify audio file is valid: Download and play locally
3. Check browser autoplay policies
4. Try user interaction before playing audio
5. Test with simple audio: `new Audio('test.wav').play()`

### Network Issues

#### Problem: "Connection refused"
**Symptoms**: Cannot connect to services
**Solution**:
1. Verify services are running: `docker compose ps`
2. Check if ports are exposed: `docker port <container>`
3. Try localhost instead of 127.0.0.1
4. Check Windows Firewall settings
5. Restart Docker network: `docker network prune`

#### Problem: "CORS errors"
**Symptoms**: Browser console shows CORS policy errors
**Solution**:
1. Ensure nginx config has CORS headers
2. Use proper URL format: `http://localhost:PORT`
3. Check service allows origin: See nginx.conf
4. Try browser with disabled security (development only)
5. Use proxy through nginx for all services

### Performance Issues

#### Problem: "Services running slowly"
**Symptoms**: High latency, timeouts
**Solution**:
1. Check resource usage: `docker stats`
2. Increase memory limits in `.env`
3. Reduce model size (use tiny/base instead of small/medium)
4. Close other applications
5. Allocate more resources to Docker Desktop

#### Problem: "WSL2 using too much memory"
**Symptoms**: System slowdown, high RAM usage
**Solution**:
1. Create `.wslconfig` in Windows user directory:
```
[wsl2]
memory=4GB
processors=2
```
2. Restart WSL: `wsl --shutdown`
3. Limit Docker container resources in `.env`

### Data and Persistence Issues

#### Problem: "Lost n8n workflows"
**Symptoms**: Workflows disappear after restart
**Solution**:
1. Ensure volume is mounted: Check docker-compose.yml
2. Export workflows regularly from n8n UI
3. Backup volume: See migration commands in local_run.md
4. Check volume exists: `docker volume ls`
5. Verify permissions: `docker exec pi-n8n ls -la /home/node/.n8n`

#### Problem: "Model files missing"
**Symptoms**: TTS/STT fail with model not found
**Solution**:
1. Check if models downloaded: `docker exec pi-tts ls /app/models`
2. Manually download: Run download_model.sh in container
3. Check internet connectivity from container
4. Verify volume mounts in docker-compose.yml
5. Rebuild service: `docker compose build --no-cache tts`

### Browser Compatibility

#### Problem: "Feature not supported"
**Symptoms**: JavaScript errors, UI not working
**Solution**:
1. Use modern browser (Chrome 90+, Edge 90+, Firefox 88+)
2. Enable JavaScript
3. Check browser console for specific errors
4. Try incognito/private mode
5. Update browser to latest version

### Debug Commands

#### View all container logs
docker compose logs

#### Follow specific service logs
docker compose logs -f [service-name]

#### Check container health
docker inspect pi-n8n | grep -A 10 Health

#### Test network connectivity
docker exec pi-n8n ping -c 3 pi-stt

#### Check file permissions
docker exec pi-n8n ls -la /home/node/.n8n

#### View environment variables
docker exec pi-n8n env

#### Check disk usage
docker system df

#### List all volumes
docker volume ls

#### Inspect volume
docker volume inspect pi_n8n_data

### Getting Help

If problems persist:
1. Check project documentation in MAIN_PLAN.md
2. Review CLAUDE.md for development guidelines
3. Search error messages in Docker/service documentation
4. Check service GitHub issues pages
5. Ensure you're using compatible versions

### Emergency Recovery

#### Full Reset (CAUTION - Deletes all data)
```bash
docker compose down -v
docker system prune -a
rm -rf services/*/data
# Then restart from setup instructions
```

#### Backup Before Reset
```bash
# Backup all volumes
for vol in $(docker volume ls -q | grep ^pi_); do
  docker run --rm -v $vol:/data -v $(pwd):/backup alpine \
    tar czf /backup/${vol}_backup.tar.gz -C /data .
done
```

Remember: Most issues can be resolved by:
1. Checking logs
2. Restarting services
3. Verifying configuration
4. Ensuring adequate resources