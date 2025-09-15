from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
import subprocess
import tempfile
import os
from typing import Optional

app = FastAPI()

class TTSRequest(BaseModel):
    text: str
    voice: Optional[str] = "en_US-amy-medium"
    speaker: Optional[int] = 0

@app.post("/api/tts")
async def synthesize(request: TTSRequest):
    try:
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_file:
            cmd = [
                "piper",
                "--model", f"/app/models/{request.voice}.onnx",
                "--output_file", tmp_file.name
            ]
            
            process = subprocess.run(
                cmd,
                input=request.text.encode(),
                capture_output=True
            )
            
            if process.returncode != 0:
                raise HTTPException(500, f"TTS failed: {process.stderr.decode()}")
            
            with open(tmp_file.name, "rb") as f:
                audio_data = f.read()
            
            os.unlink(tmp_file.name)
            
            return Response(content=audio_data, media_type="audio/wav")
    
    except Exception as e:
        raise HTTPException(500, str(e))

@app.get("/health")
async def health():
    return {"status": "healthy"}
