# Platform-Specific Guide

Detailed instructions for each platform the Pi Voice Assistant supports.

## 🍎 macOS (Intel & Apple Silicon)

### Requirements
- macOS 10.15 or later
- Docker Desktop for Mac
- 8GB RAM minimum
- 10GB free disk space

### Installation

#### Using Homebrew
```bash
# Install Docker Desktop
brew install --cask docker

# Clone project
git clone <repository-url>
cd Pi

# Start
./start/start_mac.sh
```

#### Manual Installation
1. Download Docker Desktop from [docker.com](https://docker.com)
2. Install and start Docker Desktop
3. Clone and run project

### Apple Silicon (M1/M2/M3) Notes

The start script automatically:
- Detects ARM64 architecture
- Sets `DOCKER_DEFAULT_PLATFORM=linux/amd64`
- Uses Rosetta 2 for x86 emulation
- Uses pre-built images to avoid compilation

### Performance Tips
- Allocate at least 4GB RAM to Docker
- Enable "Use Rosetta for x86/amd64 emulation"
- VirtioFS is faster than gRPC FUSE

### Common Issues

#### "Cannot connect to Docker daemon"
```bash
# Start Docker Desktop
open -a Docker
```

#### Build failures on M1/M2
```bash
# Use the Mac-specific compose
docker compose -f docker-compose.mac.yml up -d
```

## 🪟 Windows (WSL2)

### Requirements
- Windows 10 version 2004+ or Windows 11
- WSL2 enabled
- Docker Desktop for Windows
- 8GB RAM minimum

### Setup WSL2

#### Enable WSL2
```powershell
# Run as Administrator
wsl --install
wsl --set-default-version 2
```

#### Install Ubuntu
```powershell
wsl --install -d Ubuntu
```

### Install Docker Desktop

1. Download from [docker.com](https://docker.com)
2. Install with WSL2 backend
3. Enable WSL Integration:
   - Settings → Resources → WSL Integration
   - Enable for your distro

### Running the Project

#### From WSL2 Terminal
```bash
# Navigate to project
cd /mnt/c/Users/YourName/Projects/Pi

# Run start script
./start/start_windows.sh
```

#### From Windows Terminal
```cmd
wsl
cd /mnt/c/Users/YourName/Projects/Pi
./start/start_windows.sh
```

### WSL2 Performance Tips

#### Move project into WSL filesystem
```bash
# Better performance than /mnt/c
cp -r /mnt/c/Users/YourName/Projects/Pi ~/Pi
cd ~/Pi
```

#### Increase WSL2 resources
Create `.wslconfig` in Windows user folder:
```ini
[wsl2]
memory=8GB
processors=4
swap=2GB
```

### Common Issues

#### "Docker daemon not accessible"
1. Check Docker Desktop is running
2. Enable WSL integration in Docker settings
3. Restart WSL: `wsl --shutdown`

#### Audio in WSL2
- Browser audio works from Windows side
- Access Web UI from Windows browser
- WSL2 doesn't have direct audio hardware access

## 🥧 Raspberry Pi 5

### Requirements
- Raspberry Pi 5 (4GB+ RAM recommended)
- Raspberry Pi OS (64-bit)
- 16GB+ SD card
- Active cooling recommended

### Initial Setup

#### Update System
```bash
sudo apt update && sudo apt upgrade -y
```

#### Install Docker (if needed)
```bash
# The start script does this automatically
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
# Log out and back in
```

### Running the Project

```bash
# Clone project
git clone <repository-url>
cd Pi

# Run Pi-specific start script
./start/start_pi.sh
```

### Pi Optimization

The Pi start script automatically:
- Detects available RAM
- Adjusts CPU/memory limits
- Uses `tiny.en` Whisper model
- Configures for ARM64

### Hardware Setup

#### USB Microphone
```bash
# List audio devices
arecord -l

# Test microphone
arecord -d 5 test.wav
aplay test.wav
```

#### GPIO Wake Button (Optional)
```python
# Example GPIO setup
import RPi.GPIO as GPIO

GPIO.setmode(GPIO.BCM)
GPIO.setup(18, GPIO.IN, pull_up_down=GPIO.PUD_UP)
```

### Remote Access

```bash
# Enable SSH
sudo systemctl enable ssh
sudo systemctl start ssh

# Find Pi's IP
hostname -I

# Access from another device
ssh pi@192.168.1.100
```

### Performance Tips

#### Overclock (Optional)
Edit `/boot/config.txt`:
```ini
over_voltage=6
arm_freq=2200
gpu_freq=700
```

#### Use SSD Boot
- Much faster than SD card
- USB 3.0 SSD recommended
- Use Raspberry Pi Imager to setup

### Common Issues

#### Low Memory
```bash
# Check memory
free -h

# Reduce service limits in .env
MEMORY_LIMIT=1g
CPU_LIMIT=1
```

#### Slow Performance
- Use `tiny.en` model
- Enable zswap for compression
- Add active cooling

## 🐧 Generic Linux

### Requirements
- Ubuntu 20.04+ or similar
- Docker and Docker Compose
- 8GB RAM minimum

### Installation

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose

# Clone and run
git clone <repository-url>
cd Pi
docker compose up -d
```

### Using the Scripts

```bash
# Can use Windows WSL script on Linux
./start/start_windows.sh

# Or run directly
docker compose up -d
```

## 🐳 Docker Settings by Platform

### Recommended Docker Resources

| Platform | CPUs | Memory | Swap |
|----------|------|--------|------|
| macOS    | 4    | 6GB    | 2GB  |
| Windows  | 4    | 6GB    | 2GB  |
| Pi 5 8GB | 2    | 3GB    | 2GB  |
| Pi 5 4GB | 2    | 2GB    | 1GB  |

### Platform-Specific Compose Files

| Platform | Compose File | Key Differences |
|----------|-------------|-----------------|
| macOS | docker-compose.mac.yml | Platform specs, pre-built images |
| Windows | docker-compose.yml | Standard setup |
| Pi | docker-compose.pi.yml | Lower limits, tiny model |

## 🔧 Customization by Platform

### Environment Variables

Create platform-specific `.env`:

```bash
# macOS
PLATFORM=mac
MEMORY_LIMIT=6g

# Windows
PLATFORM=windows
MEMORY_LIMIT=4g

# Pi
PLATFORM=pi
MEMORY_LIMIT=2g
WHISPER_MODEL=tiny.en
```

### Model Selection

| Platform | Recommended Model | RAM Usage |
|----------|------------------|-----------|
| macOS M1+ | small.en | ~1GB |
| macOS Intel | small.en | ~1GB |
| Windows | small.en | ~1GB |
| Pi 5 8GB | tiny.en | ~500MB |
| Pi 5 4GB | tiny.en | ~500MB |

## 📊 Performance Comparison

| Operation | macOS | Windows | Pi 5 |
|-----------|-------|---------|------|
| Startup | 30s | 45s | 90s |
| Wake Word | <100ms | <100ms | <200ms |
| STT Response | 1-2s | 1-2s | 2-4s |
| TTS Response | <500ms | <500ms | <1s |

## 🌐 Network Access

### Local Network Access

| Platform | Local URL | Network URL |
|----------|-----------|-------------|
| macOS | localhost:8080 | [IP]:8080 |
| Windows | localhost:8080 | [IP]:8080 |
| Pi | localhost:8080 | [Pi-IP]:8080 |

### Finding IP Address

```bash
# macOS
ifconfig | grep inet

# Windows (in WSL)
ip addr show

# Pi
hostname -I
```

## 🆘 Platform Support Matrix

| Feature | macOS | Windows | Pi 5 |
|---------|-------|---------|------|
| Docker Desktop | ✅ | ✅ | ❌ |
| Docker Engine | ✅ | ✅* | ✅ |
| Audio Input | 🌐 | 🌐 | ✅ |
| GPIO | ❌ | ❌ | ✅ |
| Camera | 🌐 | 🌐 | ✅ |
| Auto-start | ✅ | ✅ | ✅ |

Legend:
- ✅ Full support
- 🌐 Via browser only
- ✅* Via WSL2
- ❌ Not supported

---

For issues, see [Troubleshooting Guide](./TROUBLESHOOTING.md)