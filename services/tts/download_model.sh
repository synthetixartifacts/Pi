#!/bin/bash
set -e  # Exit on any error
mkdir -p /app/models
cd /app/models

# Download model files with retries
echo "Downloading Piper TTS model files..."
wget --timeout=30 --tries=3 -O en_US-amy-medium.onnx https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/amy/medium/en_US-amy-medium.onnx
wget --timeout=30 --tries=3 -O en_US-amy-medium.onnx.json https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/amy/medium/en_US-amy-medium.onnx.json

echo "Model files downloaded successfully"
ls -la /app/models/
