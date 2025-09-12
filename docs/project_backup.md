Project Overview: Voice Assistant & Vision Hub with Raspberry Pi 5
Goal: Build an always-listening voice assistant (wake word: e.g. “Hey Pi”) that can understand voice commands (STT) and respond with speech (TTS), trigger automation workflows in n8n, display info on a small screen, and use a camera for vision (object detection, scene recognition). All core tasks should run on a Raspberry Pi (offline where possible), with optional cloud services for heavy tasks (e.g. document OCR). The device will sit on a desk, with the option to run on a power bank when needed (primarily it will use mains power).
Recommended Hardware (Raspberry Pi 5 Build – 2025)
Why Raspberry Pi 5 (8 GB)? The Pi 5 offers a significant performance boost (2–3× faster CPU) over the Pi 4 and adds new features like a PCIe interface for NVMe SSD storage and faster camera/display pipelines
pishop.ca
pishop.ca
. This ensures you have enough headroom to run Docker containers (for n8n, STT/TTS services) and real-time vision processing. The 8 GB RAM model provides ample memory for running Whisper (speech-to-text) and other AI models locally. Pi 5’s RP1 southbridge doubles USB throughput and triples camera/display bandwidth, which is ideal for high-resolution camera input and driving a touchscreen
pishop.ca
pishop.ca
. Below is a list of core components with approximate prices from Canadian retailers (as of 2025):
Component	Recommendation	Price (CAD)	Vendor (Canada)	Notes
SBC (Main Board)	Raspberry Pi 5 Model B – 8 GB RAM
pishop.ca
pishop.ca
$113.95	PiShop.ca (authorized)	~3× CPU speed of Pi 4; PCIe for NVMe, dual 4K display support
pishop.ca
. 8GB for Docker + AI tasks.
Power Supply	Official Raspberry Pi 5 USB-C Power Supply (27 W, 5V 5A)
pishop.ca
$16.95	PiShop.ca	Ensures the Pi 5 can draw up to 5A. Needed for NVMe and USB peripherals (the Pi 5 can turbo-demand >3A)
jeffgeerling.com
.
Cooling	Official Pi 5 Case with integrated Fan
pishop.ca
$14.45	PiShop.ca	Keeps the Pi cool quietly. (Includes a small fan and vents.)
Cooling (Alt.)	Raspberry Pi 5 Active Cooler (clip-on heatsink/fan)	~$7.00	PiShop.ca	Optional high-performance cooler (mounts directly on the CPU). Use either this or the case’s fan, not both.
Primary Storage	Raspberry Pi M.2 HAT+ (PCIe to M.2 M-key adapter)
pishop.ca
$16.95	PiShop.ca	Allows attaching an NVMe SSD to Pi 5’s PCIe x1 slot. (Fits in case, but you may need to remove/modify the lid)
pishop.ca
.
NVMe SSD	1 TB M.2 NVMe SSD (2280 size, e.g. Kioxia/WD)	~$114.95	PiShop.ca (example)	Fast boot and plenty of storage for Docker, audio, etc. Pi 5 supports booting from NVMe out of the box
jeffgeerling.com
.
Display	Official 5″ Touch Display 2 (720×1280, DSI interface)	~$55.95	(PiShop.ca or RobotShop)	New 5-inch portrait touchscreen from Raspberry Pi
news.itsfoss.com
news.itsfoss.com
. Perfect for status UI – not too big. Connects via Pi 5’s DSI (needs 22-pin cable).
Camera	Raspberry Pi Camera Module 3 – Wide Angle
pishop.ca
pishop.ca
$49.00	PiShop.ca	12MP Sony IMX708 sensor with auto-focus and HDR
pishop.ca
. Wide FoV (120°) variant for better scene coverage. Enables local vision (object recognition, etc.).
DSI/CSI Cables	22-pin Camera Cable and Display Cable for Pi 5	~$1.45 each	PiShop.ca	Required because Pi 5 uses 22-pin connectors (older 15-pin camera cables won’t fit)
pishop.ca
. Get appropriate lengths (e.g. 200 mm).
Microphone Array	ReSpeaker USB Mic Array v2.0 (Seeed Studio)
robotshop.com
~$90.00	RobotShop.ca	Far-field 4-mic array with beamforming & AEC. Detects wake-word across a room (5 m range) and cancels echo for clear recognition
robotshop.com
. Plugs in via USB.
Speakers	Creative Pebble 2.0 USB-Powered Desktop Speakers
canadacomputers.com
~$40–50	Canada Computers, etc.	Compact stereo speakers powered via USB (or USB-C). Ideal for TTS voice output. Any small USB or 3.5mm speakers can work; Pebble is a popular choice for desktops.
Optional AI Accelerator	Raspberry Pi AI Hat+ (Hailo-8L) – 13 TOPS NPU
pishop.us
pishop.us
$97.95	PiShop.ca	Neural accelerator offloads vision AI tasks from the CPU. Fully integrates with Pi’s camera stack for running object detection, image segmentation, etc., in real-time
pishop.us
. (26 TOPS version available ~$153.95 if you need more performance.)
Estimated Total (CAD): Approximately $520 for the core build (no NPU), or about $620 with the 13-TOPS AI Hat. (This excludes shipping and tax, but all items are available from Canadian suppliers.) The build fits well under the ~$1000 budget, leaving room for accessories or future add-ons.
How the Hardware Meets Your Goals
Processing Power & Storage: The Raspberry Pi 5 (8GB) can comfortably run n8n and associated services. It’s an ARMv8 64-bit system, which is fully compatible with the latest n8n Docker images
community.n8n.io
. The Pi 5’s PCIe-based M.2 NVMe SSD provides high-speed storage and quick boot times, ensuring snappy performance for database operations and fast reads/writes (useful for caching AI models, etc.). Booting directly from NVMe is officially supported – just update the EEPROM boot order to prioritize NVMe (the Pi 5 can boot from NVMe with no USB or SD involved after a one-time config)
jeffgeerling.com
. This gives you the reliability of an SSD and plenty of space for your automation workflows, logs, and even camera footage if needed.
Always-Listening Audio: The ReSpeaker USB Mic Array v2.0 is specifically designed for voice interfaces. It has an onboard XMOS DSP that performs Acoustic Echo Cancellation (AEC) and noise reduction, and can pinpoint the direction of a speaker’s voice (DOA)
robotshop.com
. This means your device can hear you say the wake word (“Hey Pi”) from across the room, even while it’s speaking or playing music. The mic array’s far-field pickup (up to ~5 m)
robotshop.com
 covers typical room scenarios. For output, the Creative Pebble speakers provide clear sound for the assistant’s voice. They are USB-powered (simple single-cable hookup) and compact. The Pi 5 has a 3.5mm jack, but using a USB audio output (or the HDMI audio to the display) can yield less noise. The Pebble speakers are a proven affordable choice (widely available for ~$40–50)
canadacomputers.com
.
Voice Recognition (STT) & Wake Word: This build favors offline voice processing for privacy and speed. For the wake-word engine, you have two excellent options:
Picovoice Porcupine – a lightweight, high-accuracy wake word engine that runs efficiently on the Pi (even the Pi Zero). It’s designed for IoT devices and can detect custom keywords with minimal CPU usage
github.com
. Porcupine officially supports Raspberry Pi 5 and even provides easy-to-use SDKs in Python, Node.js, etc.
picovoice.ai
github.com
. You can use Picovoice’s pre-built wake word (“Hey Pico” / “Porcupine”) or train a custom phrase (they have an online console for this). It’s free for personal use and has a commercial-friendly license.
openWakeWord – an open-source wake word detector by David Scripka. It’s a newer project focused on simplicity and performance. Impressively, on a single core of a Pi 3 it can run 15–20 wake word models simultaneously in real-time
github.com
. It comes with some pre-trained models (e.g. “hey computer”, “okay lumen”, etc.) and you can train your own. If you prefer fully open source, this is a great choice. On Pi 5, openWakeWord will easily handle a single wake word model with negligible load. The downside is it’s less plug-and-play than Porcupine – you’d write a small Python script to continuously listen and trigger an action when the wake word is detected. (Either way, both engines can run continuously on the Pi 5 without issue. Porcupine might be simpler to start with, whereas openWakeWord offers more customization.)
Speech-to-Text (STT): For converting your voice commands into text, Whisper by OpenAI is a top-notch choice for accuracy. Running Whisper fully on the Pi is heavy but feasible by using optimized versions. The recommended approach is to use Faster-Whisper (an optimized Whisper implementation using CTranslate2) via a Docker container. The Rhasspy project provides a pre-built Docker image rhasspy/wyoming-faster-whisper for ARM64
blog.matterxiaomi.com
blog.matterxiaomi.com
. This exposes a gRPC (Wyoming) or HTTP interface that your Pi can send audio to and get text back. You can run this container alongside n8n. On the Pi 5, you’ll want to use a smaller Whisper model for real-time processing (e.g. base or small model). The Faster-Whisper container on a Pi 5 can handle real-time transcription for short commands, especially if using the AI accelerator for offloading other tasks. Alternatively, you could use open-source Kaldi/Rhasspy speech recognition or cloud STT (Google, Azure, etc.) via n8n nodes, but Whisper will give you much better accuracy for natural language. In testing, Whisper’s tiny model is very fast on Pi 5, and the base model is slower but may be acceptable for short phrases. Using the Docker approach keeps things modular. (If needed, you can always point n8n to an external STT service for very large dictations, but for typical assistant commands, local Whisper is fine.)
Text-to-Speech (TTS): For the voice replies, Piper is a fantastic choice. Piper is an offline neural TTS system that is optimized for Raspberry Pi hardware
medium.com
. It’s part of the Rhasspy ecosystem as well (Docker image rhasspy/wyoming-piper for ARM64). Piper can generate natural-sounding speech quickly – it’s faster than real-time on a Pi 4 for many voices, and on the Pi 5 it’s even better. You can choose from dozens of voices (multiple languages are available via free voice models on HuggingFace). Piper runs entirely on-device using efficient DL inference, so the assistant can speak without any cloud services
medium.com
. In practice, Piper on Pi 5 can synthesize a sentence of audio in well under a second (depending on voice model size). Like STT, you could alternatively use n8n to call an external API (Google Cloud TTS, Amazon Polly, etc.), but Piper gives you privacy and speed after the initial setup.
Camera & Vision AI: The Camera Module 3 (Wide) gives your device vision. This camera supports up to 12MP stills and 1080p50 video, with auto-focus for clear images
pishop.ca
. For basic tasks (like detecting if a person is in front of it, or recognizing a hand wave), the Pi 5’s CPU alone can handle light models (e.g. using OpenCV or TensorFlow Lite). However, for more advanced real-time vision (object detection, scene recognition), the Hailo-8L AI Hat is recommended. The Hailo-8L is a dedicated Neural Processing Unit that delivers 13 TOPS of inference performance at low power. Raspberry Pi’s official AI Hat+ integrates this NPU and ties into the Pi’s camera stack
pishop.us
pishop.us
. This means you can use Raspberry Pi’s libraries or GStreamer pipelines to capture images and pass them to the NPU for processing. In practice, you can run models like YOLO (for object detection), semantic segmentation, pose estimation, etc. without bogging down the CPU
pishop.us
. For example, you could run a COCO-pretrained object detection model to identify people, pets, or objects in view, and then use n8n to take actions (e.g. “if person detected, speak ‘Hello!’”). The NPU can also accelerate things like face recognition or even basic gesture recognition (with the right model). It essentially turns the Pi into an AI-capable camera system. If your use-cases are lighter (like just capturing images and sending to an API), you could skip the NPU, but it’s a nice add-on under $100.
Document Processing: For scanning invoices or documents, the Pi camera can capture high-res images (use the autofocus to get sharp text). You’ll likely want to leverage an OCR tool. On-device, Tesseract OCR can run on Pi for simple cases, but accuracy will be limited. A better approach is to either call an OCR API via n8n (e.g. Google Vision or AWS Textract for robust document analysis) or run a more advanced model on a more powerful machine. You could also stream the image to your server and run something like OCRmyPDF or Donut (Vision Transformer) if you have those set up. In summary, the Pi can capture the document (and perhaps do a basic local OCR), but for high accuracy invoice parsing, a cloud or server function (triggered by n8n) might be used. This hybrid approach – local vision for quick tasks and cloud for heavy tasks – fits within n8n workflows nicely. The n8n instance on Pi can orchestrate this: e.g., Pi camera takes photo -> n8n sends it to an OCR module or cloud -> gets text or data back -> Pi speaks the result or stores it.
Display & Feedback: The official 5″ Touch Display 2 is a new (2025) accessory that gives you a GUI on the Pi without hogging much space
news.itsfoss.com
. It has a sharp 720×1280 resolution at 5 inches, so text and icons will look crisp. By default it’s a vertical (portrait) screen – ideal for showing status, a waveform for listening, or weather/calendar info, etc. (You can rotate it in software for landscape if needed.) It connects via the Pi’s DSI ribbon and is powered from the Pi’s GPIO, making wiring simple
news.itsfoss.com
news.itsfoss.com
. Because it’s an official product, it’s fully supported in Raspberry Pi OS (drivers are built-in) and works out-of-the-box – the same code that runs on the 7″ display works on the 5″
news.itsfoss.com
. This screen is large enough to show useful info (like transcribed text or images the camera took) but small enough to keep the overall device compact. If 5″ is still too large for your liking, there are third-party 4.3″ DSI screens (e.g. Waveshare 4.3″ 800×480) around $60
pishop.ca
, but the official 5″ has much higher resolution and is a better match for the Pi 5’s connectors. The touch capability means you can even add manual controls (buttons on screen to start/stop listening, or to run certain n8n workflows). It’s like a mini smart display.
Enclosure & Portability: The build will be stationary on a desk most of the time. The official Pi 5 case will nicely house the board, fan, and camera module (you might drill a hole or use a camera mount on the case for the camera, or get a case that supports a camera). For portable or backup power, you can use any high-quality USB-C PD power bank that supports 5V output at 3A or above. Since the Pi 5 can draw up to ~25 W with accessories
jeffgeerling.com
, look for a power bank that advertises 5V/5A output (or 9V PD mode, which the Pi will negotiate down to 5V 5A). In practice, a common laptop power bank (with 20,000+ mAh capacity) can run this setup for a couple of hours. However, when using the camera and NPU heavily, the power draw will be non-trivial, so battery is only for short-term use or UPS backup – the official 27W supply is recommended for full-time use.
Assembly and Setup Guide
1. Assemble the Hardware: Start by attaching the M.2 HAT to the Pi 5 (if using NVMe). Insert the NVMe SSD into the M.2 slot on the HAT at a 30° angle and screw it down. Mount the Pi 5 in the case (the official case has standoffs for the board). If using the official case, the fan will clip onto the lid – ensure its cable is plugged into the Pi’s fan header (set to 5V or software PWM as per instructions). Install the Camera Module 3: use the 22-pin ribbon cable to connect the camera to the CAM0/1 connector on Pi 5 (push the cable in, shiny contacts facing the correct way, and latch the connector). Do the same for the 5″ display, connecting its ribbon to the Pi’s DSI connector (if the display kit came with a cable, use that). Attach the display to its adapter board and stand as per its instructions (the official 5″ comes with a controller board). Plug the ReSpeaker Mic via USB, and the speakers via the Pi’s 3.5mm jack or USB (depending on model). Finally, plug in the power supply and any network cable (though Wi-Fi will also work out of the box). 2. Install OS (64-bit): Use the latest Raspberry Pi OS (64-bit) – Bookworm-based – or Ubuntu 22.04 Server 64-bit for Pi. Raspberry Pi OS is recommended for best hardware support. Flash the OS to the NVMe SSD for best performance. Since the Pi 5’s firmware now supports direct NVMe boot, you can do this in one of two ways: (a) Flash an OS image directly to the NVMe (using Raspberry Pi Imager with “USB device” mode – you may need a USB-to-M.2 enclosure to flash it from another machine), then boot the Pi 5 and it should start from NVMe (ensure no microSD is inserted if the EEPROM boot order is still default). (b) Alternatively, flash OS to a microSD first, boot the Pi, update the bootloader to set NVMe first (raspi-config > Boot Order, or using the rpiboot utility), then clone the OS to the NVMe. In any case, update your EEPROM to the latest version and set BOOT_ORDER so that NVMe (PCIe) is tried before SD
jeffgeerling.com
. This will allow truly headless operation from NVMe. Once the system is up, run sudo apt update && sudo apt full-upgrade to get the latest kernel (which will have Pi 5 specific improvements). 3. Configure Camera and GPU: Enable the camera interfaces using raspi-config (there might be an option for Camera under Interfaces – ensure it’s on). The Camera Module 3 uses the libcamera stack. Test the camera with libcamera-still -o test.jpg or libcamera-hello preview. If you’re using the AI Hat (Hailo), install its udev rules or SDK as per Raspberry Pi documentation (the AI Hat might be plug-and-play with Pi OS since it’s official – check the product brief). You might need to run a script or install Hailo’s software package to get started. It likely comes with some demo programs (like a detection demo). Verify that the system recognizes the Hailo (e.g., a /dev device or via dmesg). For the display, if using the 5″, you may need to add display_auto_detect=1 in /boot/config.txt (though newer OS versions should detect it automatically). The official 5″ is portrait by default; you can rotate the framebuffer in software if needed (e.g., in /boot/config.txt add display_lcd_rotate=1 for 90° rotation). Calibrate touch if necessary (usually it’s pre-calibrated). 4. Install Docker and n8n: Set up Docker on the Pi (the Medium article in references gives a full guide
medium.com
, but briefly: install Docker via the convenience script or apt repository, then add your user to the docker group). Pull the n8n image: docker pull n8nio/n8n:latest. Launch n8n with a volume for data and proper ports, e.g.:
docker run -d --name n8n -p 5678:5678 -v ~/n8n/.n8n:/home/node/.n8n -e N8N_BASIC_AUTH_USER=... -e N8N_BASIC_AUTH_PASSWORD=... n8nio/n8n:latest
(You may set up authentication and environment as needed. The key point: the official n8n image supports arm64/v8, and users have reported it runs fine on Pi 5
community.n8n.io
.) n8n’s memory usage is modest, and 8 GB RAM is plenty. You can also use Docker Compose if orchestrating multiple containers (which we will for STT/TTS). Ensure n8n is accessible (open <pi-ip>:5678 in a browser, login if using basic auth). At this stage, you have the automation brain running. 5. Deploy Voice Service Containers: Now set up the always-listening services: wake word, STT, and TTS. You can use Docker Compose to manage them. For example, create a docker-compose.yml with services for:
porcupine (if Picovoice provided a server or use a small Python service), or openwakeword (could be run as a simple Python script on host rather than a container).
whisper using Rhasspy’s Wyoming Whisper:
  whisper:
    image: rhasspy/wyoming-whisper:latest   # this might use the default (base) model
    container_name: whisper_stt
    restart: unless-stopped
    ports:
      - "10300:10300"   # default port for STT service
    environment:
      - TZ=America/Toronto
    # (No special config needed; it will serve a gRPC/HTTP API on 10300)
piper using Rhasspy’s Wyoming Piper:
  tts:
    image: rhasspy/wyoming-piper:latest
    container_name: piper_tts
    restart: unless-stopped
    ports:
      - "10200:10200"   # default port for TTS service
    environment:
      - TZ=America/Toronto
Launch these containers (docker-compose up -d). The STT and TTS services will run in the background waiting for input. You can test them individually: for Whisper, send an audio file via its HTTP endpoint or use a Rhasspy client. For Piper, you can POST text and get a WAV. For the wake word, Porcupine doesn’t have an official server container (it’s meant to be embedded). The easiest way: use Python. Picovoice provides a Python SDK – you can install pip install pvporcupine and use one of their example scripts. You’ll need Porcupine’s keyword file for your wake word (they have free ones like “porcupine” or “picovoice” in various languages, or you can use their console to generate a custom keyword file). The wake word script will continuously read from the ReSpeaker mic (it appears as a sound card device). Ensure your mic is set as default ALSA input or specify it in the script. When the wake word is detected, you can have the script trigger an action – for instance, it could make an HTTP request to n8n or simply play a beep and start recording audio for STT. 6. Integrate Voice Workflow in n8n: Now the fun part – connecting it all in n8n. One approach: use MQTT or HTTP between services. For example, you could run a lightweight MQTT broker (the Rhasspy services can use “Wyoming” protocol which also has MQTT bridging). But to keep it simple, let’s use n8n to coordinate via HTTP:
Wake Word to n8n: Modify your wake-word Python script so that when it hears “Hey Pi”, it sends an HTTP webhook to n8n (you’ll create a Webhook node in n8n for “wake_word” event). This could include a JSON payload like {"event": "wake_word", "hotword": "hey_pi"}. n8n can catch this and, for example, activate a flow that maybe prepares the STT service.
Capture Speech & Transcribe: After wake word, you’ll capture the user’s voice query. You can do this by recording from the mic for a few seconds (or until silence). You could automate this with a tool like arecord (for, say, 5 seconds of audio), or better, use a VAD (voice activity detection) to record dynamically until the user stops. The ReSpeaker’s DSP might help here, or you can use Picovoice’s Cobra VAD or even the built-in VAD of openWakeWord. Once you have an audio clip (PCM/WAV), send it to the Whisper STT service. This could be done via n8n’s HTTP Request node: POST the file to http://localhost:10300/asr?lang=en (for example) – the Rhasspy whisper server will return JSON with the transcribed text. Parse that in n8n.
Process Command in n8n: Now you have the user’s command as text in n8n. Here you can do anything: use n8n’s nodes to search the web, call OpenAI’s API (if the user asked a question), control smart home devices, etc. This is where your automation logic goes. For instance, if the user said “What’s the weather tomorrow?”, n8n could call a Weather API, then use the result to formulate a response.
Text-to-Speech Response: To speak back, take the response text (whether generated by OpenAI or a predefined answer) and send it to the Piper TTS service. Again, n8n can do an HTTP request: POST {"text": "Tomorrow will be sunny, 25 degrees."} to http://localhost:10200/synthesize (or whatever the Piper API expects – some use gRPC, but a simple REST bridge might be available). Piper will return either a WAV file or a URL to a WAV. Have n8n capture that, then use an Execute Command node or a small custom script to play the WAV on the Pi’s speakers (e.g. save to /tmp/response.wav and call aplay or use an npm package to play sound). The Creative Pebble will speak the answer.
Loop back to Idle: After responding, your flow can signal the wake-word listener to resume (though if your script was always running, it can just continue after a brief pause). You might have a visual indicator on the display – for example, change a status icon or LED when the assistant is active vs idle.
7. Smart Camera Workflows: In parallel, you can utilize the camera. For example, you could run a Python script (or even Node-RED, which some use for vision) that uses the Hailo-8 to continuously watch for certain objects. When, say, a person is detected in front of the camera, you could trigger an n8n webhook “person_detected” and have n8n greet the person via TTS. Or if a hand wave gesture is recognized (this might require a specific model or a heuristic of motion), trigger n8n to start listening (as an alternative to the wake word!). For plant recognition, you could take a snapshot of a plant when the user asks “What plant is this?” and send it to a cloud API (or a locally stored ML model) via n8n, then speak the result. The possibilities are endless and n8n can glue these together since it can perform HTTP requests, run Python code, schedule tasks, and interface with dozens of APIs easily. 8. Final Touches: Set your system to launch all needed services on boot. This means if you used Docker Compose, enable it on boot (e.g. a systemd service for docker-compose up). Also, start your custom Python scripts on boot (for wake word and any vision monitoring). You can use pm2 or systemd for these. Ensure the microphone is set as default input (check with arecord -l that the ReSpeaker is card 0 or adjust .asoundrc accordingly). You can also tune the wake word sensitivity in code (Porcupine has a sensitivity parameter; openWakeWord uses a threshold). If using Porcupine, test different keyword files or even multiple wake words simultaneously (Porcupine can handle multiple, e.g. “Hey Pi” and “Hello Pi”). The ReSpeaker has LEDs – you might program them (via its USB HID interface) to visualize the direction of sound or to glow when the wake word is detected, which gives the device a nice interactive touch. Finally, on the display, you might run a lightweight dashboard or GUI. You can simply have Raspberry Pi OS boot to desktop and perhaps show a fullscreen Node-RED dashboard or a custom web app that shows status (like “Listening…” when wake word triggers, or transcribed text, etc.). Since n8n has an API, you could even have the screen controlled by n8n (or use a small Electron app for the UI). This isn’t strictly necessary, but a screen is very handy for debugging and for displaying info like camera feed or the result of web searches, etc.
Where to Buy (Canada) and Further Resources
All the hardware listed can be purchased from authorized Canadian Raspberry Pi resellers. PiShop.ca (based in Ottawa) has the Raspberry Pi 5 and official accessories in stock
pishop.ca
pishop.ca
, as does RobotShop (Montreal) and CanaKit (Vancouver). For example, PiShop.ca lists the Pi 5 8GB at $113.95
pishop.ca
, the official PSU for $16.95
pishop.ca
, Camera Module 3 for $49
pishop.ca
, and so on. The new 5″ touch display was around $55–60 at PiShop and RobotShop at launch (MSRP $40 USD)
news.itsfoss.com
. The Seeed ReSpeaker mic array is available via RobotShop (~$90) or Amazon.ca (sometimes via Seeed’s distributor). Creative Pebble speakers can be found at Canada Computers, BestBuy, or Amazon (~$45, often cheaper on sale)
canadacomputers.com
. The Hailo AI Hat was carried by PiShop.ca at ~$98 for the 13-TOPS version and ~$154 for the 26-TOPS
pishop.us
. It’s an official product, so other resellers (like BuyaPi or The Pi Hut internationally) have it too. Before purchasing, ensure you’re buying from official resellers to get genuine products and warranty. (Raspberry Pi’s site has a list of approved resellers
news.itsfoss.com
.) Further Reading & References:
Raspberry Pi 5 Announcement and Specs – Raspberry Pi official (explains performance gains and new features)
pishop.ca
pishop.ca
.
n8n Documentation – Guide for Docker on ARM (community confirms n8n runs on Pi 5 64-bit)
community.n8n.io
community.n8n.io
.
Picovoice Porcupine on GitHub – (examples and custom wake-word training)
github.com
.
openWakeWord GitHub – project details and performance notes (Raspberry Pi usage)
github.com
.
Rhasspy Wyoming Services – Docker images for Whisper STT and Piper TTS (see Rhasspy forum and Home Assistant voice assistant discussions)
blog.matterxiaomi.com
blog.matterxiaomi.com
.
Piper TTS GitHub and Medium guide – optimize TTS on Pi 4/5
medium.com
.
Raspberry Pi Camera + Hailo AI Hat – official product brief (neural inference examples with Pi)
pishop.us
pishop.us
.
Jeff Geerling’s blog – NVMe boot on Pi 5 and testing PCIe devices
jeffgeerling.com
.
With the above hardware and setup, you will have a DIY voice assistant that rivals a Google Home in capability – but fully under your control, with the power of n8n to automate web searches, smart home control, or API calls. Plus, the addition of a camera and edge AI means it can perceive the environment (something like Amazon Echo Show, but more flexible). This platform is powerful: the Pi 5’s speed and the optional NPU allow for experimentation with advanced AI workflows (you could even run small GPT models or Edge Impulse ML models on it). And since everything is modular, you can update parts independently (for instance, swap to a new wake-word model or use a different TTS voice) without changing the hardware. Next steps: If you haven’t already, order the parts 🛒. While waiting for delivery, you can start designing your n8n flows (think about intents or commands you want to support). Once the hardware is in hand, follow the setup steps above, and you’ll incrementally build out the system – first getting the Pi running, then voice in/out, then vision. Take it one step at a time, verifying each piece (e.g., use arecord/aplay to test audio, use libcamera to test video, use curl to test STT/TTS HTTP endpoints). There will likely be tweaks needed (audio tuning, slight delays in n8n flows to avoid overlapping speech, etc.), but that’s the fun of building it yourself. In the end, you’ll have a Pi-Powered voice assistant that listens, talks, sees, and automates – all within your local network and fully customizable to your needs. Good luck with the build! 

--------------

This is the project I want to do.
But before buying everything I'm looking to do a POC on my main computer.

Is it possible to do this with my windows PC using docker to simulate the raspbery pi and everything?
ChatGPT said:
Thought for 2m 13s

Short answer: yes—POCing the whole stack on your Windows PC is very doable, and you don’t need to “simulate a Pi.” Run the services in normal x86-64 Docker containers (n8n, STT, TTS), keep audio I/O (mic + speakers) on the host via a tiny Python script (wake-word + recording + playback), and use your USB webcam for vision. When you’re happy, move the exact same services to the Pi (swap to ARM images if you want). The only things you can’t really mimic on a PC are Pi-specific buses (CSI/DSI) and the Hailo AI Hat; everything else maps 1:1.

What to emulate on Windows (and what not)

Run your services natively (x86-64) in Docker: n8n has official Docker images for both linux/amd64 and linux/arm64, so you can spin it up on Windows right away. 
n8n Docs
+2
Docker Hub
+2

STT & TTS as containers: The Rhasspy “Wyoming” servers for Whisper (STT) and Piper (TTS) have amd64 tags—perfect for your PC POC. If you prefer an HTTP/OpenAI-compatible STT instead of Wyoming, there are faster-whisper servers with simple REST APIs you can run in Docker. 
GitHub
+1

Wake word & mic on the host (not in a container): Docker Desktop doesn’t pass microphones/USB audio straight into Linux containers. It’s doable with USB-over-IP, but it’s extra friction. Easiest path: a tiny Python script on Windows that does wake-word + recording and then calls your containerized services. 
Docker Documentation

Camera: Easiest is to read your webcam from a host script and POST frames to n8n or a vision container. If you really want device passthrough, you can attach USB into WSL2 with usbipd and then --device into a container—but it’s optional for a POC. 
Docker Documentation

Pi-only bits you won’t emulate: CSI camera ribbon, the 5″ DSI panel, Hailo AI Hat. Those are specific to Pi hardware; on Windows just use a normal monitor and your USB webcam.

Minimal POC architecture on Windows
[Windows host]
  ├─ Python "ears & mouth" script
  │   • Wake word (Porcupine or openWakeWord)
  │   • Record audio after wake word (VAD/silence timeout)
  │   • Send WAV → STT container (HTTP or Wyoming client)
  │   • Receive reply text → TTS container → play WAV
  │   • POST commands to n8n Webhook
  └─ (Optional) small vision script using your webcam → n8n webhook

[Docker Desktop]
  ├─ n8n (workflow brain; HTTP Webhooks)
  ├─ STT service (wyoming-whisper or an HTTP faster-whisper server)
  └─ TTS service (wyoming-piper)


Why host-side wake word?

Porcupine has a simple Windows Python SDK (pip install pvporcupine) and is rock-solid for always-listening; openWakeWord is cross-platform too. Keeping audio on the host sidesteps Docker’s device limitations. 
PyPI
+2
Picovoice
+2

Docker Desktop explicitly says USB passthrough isn’t supported (you can route via USB/IP, but it’s more setup than you need for a POC). 
Docker Documentation

Drop-in docker-compose (Windows)

Create docker-compose.yml in a new folder and run docker compose up -d in that folder.

services:
  n8n:
    image: docker.n8n.io/n8nio/n8n:latest
    ports: ["5678:5678"]
    environment:
      - TZ=America/Toronto
      - GENERIC_TIMEZONE=America/Toronto
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=change-me
    volumes:
      - n8n_data:/home/node/.n8n

  # OPTION A: Wyoming protocol (pairs nicely with Rhasspy/Home Assistant)
  wyoming-whisper:
    image: rhasspy/wyoming-whisper:latest
    ports: ["10300:10300"]
    environment: [ "TZ=America/Toronto" ]
    command: >
      --model small
      --language en
      --device cpu
      --port 10300

  wyoming-piper:
    image: rhasspy/wyoming-piper:latest
    ports: ["10200:10200"]
    environment: [ "TZ=America/Toronto" ]
    command: >
      --voice en_US-lessac-medium
      --port 10200

  # OPTION B: HTTP/OpenAI-compatible STT instead of Wyoming (pick ONE STT stack)
  # faster-whisper-http:
  #   image: etalab/faster-whisper-server:latest
  #   ports: ["9000:9000"]
  #   environment:
  #     - TZ=America/Toronto
  #     - DEFAULT_MODEL=base
  #   # then POST to http://localhost:9000/v1/audio/transcriptions

volumes:
  n8n_data:


n8n’s official Docker instructions (ports/volumes) are here if you want to tune further. 
n8n Docs

Rhasspy’s wyoming-whisper / wyoming-piper images include linux/amd64 tags, so they run fine on your PC. If you prefer a simple REST API, use one of the OpenAI-compatible faster-whisper servers (example above). 
GitHub
+1

Tiny “ears & mouth” script (host, Windows)

This shows the flow. It uses Porcupine for wake word, records WAV until silence, sends to STT, then plays TTS.

# pip install pvporcupine sounddevice webrtcvad requests numpy
import io, wave, time, requests, numpy as np
import sounddevice as sd
import webrtcvad
import pvporcupine

ACCESS_KEY = "YOUR_PICOVOICE_ACCESS_KEY"
WAKE_WORDS = ["porcupine"]  # swap for your custom keyword later
SAMPLE_RATE = 16000
CHANNELS = 1

# ---- Wake word
porc = pvporcupine.create(access_key=ACCESS_KEY, keywords=WAKE_WORDS)
vad = webrtcvad.Vad(2)

def record_until_silence(max_seconds=6, silence_ms=700):
    buf = []
    frame_ms = 30
    frame_len = int(SAMPLE_RATE * frame_ms / 1000)
    silent_for = 0
    start = time.time()
    with sd.InputStream(samplerate=SAMPLE_RATE, channels=CHANNELS, dtype="int16") as stream:
        while True:
            audio, _ = stream.read(frame_len)
            buf.append(audio.copy())
            is_speech = vad.is_speech(audio.tobytes(), SAMPLE_RATE)
            silent_for = 0 if is_speech else (silent_for + frame_ms)
            if silent_for >= silence_ms or (time.time() - start) > max_seconds:
                break
    data = np.concatenate(buf, axis=0)
    # to WAV bytes
    b = io.BytesIO()
    with wave.open(b, "wb") as wf:
        wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(SAMPLE_RATE)
        wf.writeframes(data.tobytes())
    return b.getvalue()

def play_wav_bytes(wav_bytes):
    with wave.open(io.BytesIO(wav_bytes)) as wf:
        sr = wf.getframerate()
        data = wf.readframes(wf.getnframes())
        audio = np.frombuffer(data, dtype=np.int16)
    sd.play(audio, sr); sd.wait()

def stt(wav_bytes):
    # OPTION A: HTTP server (OpenAI-compatible faster-whisper)
    # r = requests.post("http://localhost:9000/v1/audio/transcriptions",
    #                   files={"file": ("speech.wav", wav_bytes, "audio/wav")},
    #                   data={"model": "base"})
    # return r.json()["text"]

    # OPTION B: If using Wyoming servers, call an n8n webhook that relays to Wyoming,
    # or use a small python wyoming client. For POC simplicity, stick to OPTION A above.
    raise NotImplementedError("Use HTTP STT or add a Wyoming client here")

def tts_to_wav(text):
    # Simple HTTP bridge for Piper varies by image; if using wyoming-piper, add a small bridge
    # or switch to an HTTP TTS container. For POC, you can do:
    r = requests.post("http://localhost:10200/synthesize", json={"text": text})
    return r.content  # assuming it returns WAV; adjust to your API
    # If your image uses a different route, tweak accordingly.

print("Listening for wake word…")
with sd.InputStream(samplerate=SAMPLE_RATE, channels=CHANNELS, dtype="int16") as stream:
    while True:
        frame = stream.read(porc.frame_length)[0]
        keyword_index = porc.process(frame.flatten())
        if keyword_index >= 0:
            ding = b""  # you could play a short WAV here
            print("Wake word!")
            wav = record_until_silence()
            try:
                text = stt(wav)
                # Send text to n8n: route the intent / run workflows
                requests.post("http://localhost:5678/webhook/wake", json={"text": text})
                # Speak result (for quick demo just echo back)
                reply_wav = tts_to_wav(f"You said: {text}")
                play_wav_bytes(reply_wav)
            except Exception as e:
                print("Error:", e)


Porcupine Python SDK is cross-platform and documented (you’ll need a free AccessKey). You can swap Porcupine for openWakeWord if you prefer fully open-source. 
PyPI
+2
Picovoice
+2

If you stick with the Wyoming servers, you can either add a tiny Python “Wyoming client” in this script or have n8n host a webhook that relays to Wyoming. If you want simple HTTP, run one of the OpenAI-compatible faster-whisper HTTP servers instead and POST your WAV to /v1/audio/transcriptions. 
GitHub
+1

Wire up n8n quickly

In n8n, create a Webhook node at POST /webhook/wake.

Add logic (IF/Switch) to route commands (“what’s the weather”, “start camera”, etc.).

To speak back, call your TTS service from n8n (HTTP Request node) and return the WAV to the host script or have n8n save a file and the host polls/plays it.

n8n’s Docker docs & default port mapping are here if needed. 
n8n Docs

To trigger vision, your host webcam script can periodically capture frames and POST images to an n8n webhook (or to a YOLO container you add later).

Nice-to-have toggles for the POC

Emulate “Pi-ish” resources to approximate latency: run containers with --cpus=4 --memory=4g or similar.

Try ARM images under emulation if you really want to: docker run --platform linux/arm64 … (will be slower due to QEMU). For prod, you’ll run the ARM variants on the Pi, not on Windows. 
Docker Documentation
+1

If you insist on device passthrough: USB passthrough isn’t native; Docker suggests USB/IP to forward devices into the VM before exposing them to a container. Most folks avoid this for audio and just keep mic/speakers on the host during dev. 
Docker Documentation

TL;DR setup checklist (Windows)

Install Docker Desktop.

docker compose up -d with the file above (pick Wyoming or HTTP STT).

Create the n8n webhook /webhook/wake.

Run the host Python script (Porcupine + record + POST to STT + call n8n + TTS + play). 
PyPI

(Optional) Add a simple webcam script to send frames to n8n or a YOLO container.

If you want, tell me which route you prefer for STT (Wyoming vs HTTP/OpenAI-compatible) and I’ll tailor the script + n8n workflow to match—down to copy-paste configs.

You said:
is it possible to run this in my computer but fully within docker so that I dont have to install anything in my computer
ChatGPT said:
Thought for 2m 33s

Short answer: yes—with one catch. On Windows, Docker Desktop can’t grab your microphone/camera directly. The clean way to keep everything “installed” only in Docker is to use a tiny web UI (also in a container) as your “I/O dongle.” Your browser provides mic/camera access (no extra installs), and all the brainy bits (n8n, STT, TTS, optional wake word/vision) live in containers.

If you try to do mic/camera inside a Linux container on Windows, you’ll hit a hypervisor limitation (USB/audio passthrough isn’t supported without extra host hacks). 
Docker Community Forums
+1

Below is a drop-in compose that gives you a fully containerized POC + browser UI:

What this stack does

Mic & wake word in your browser (no installs): the UI asks permission via getUserMedia, and you can run the Porcupine Web wake-word engine (WASM) right in the page. 
MDN Web Docs
+2
Picovoice
+2

STT: a containerized faster-whisper server with an OpenAI-compatible HTTP API (so the web UI can POST audio). 
GitHub

TTS: a containerized Piper HTTP server (so the web UI can fetch WAV and play it). 
GitHub

n8n: orchestrates your flows via simple webhooks. (Official Docker image supports amd64.) 
Docker Hub

Vision (optional): the UI can send webcam frames to a vision container or straight to n8n. YOLOv8 images exist if you want local object detection in a container. 
Ultralytics Docs
+1

docker-compose.yml (PC POC)

Save this as docker-compose.yml and run docker compose up -d.

services:
  n8n:
    image: docker.n8n.io/n8nio/n8n:latest
    ports: ["5678:5678"]
    environment:
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=change-me
      - TZ=America/Toronto
    volumes:
      - n8n_data:/home/node/.n8n

  stt:  # OpenAI-compatible HTTP STT
    image: ghcr.io/etalab-ia/faster-whisper-server:latest
    ports: ["9000:9000"]
    environment:
      - DEFAULT_MODEL=small
      - TZ=America/Toronto
    # API: POST /v1/audio/transcriptions

  tts:  # Piper over HTTP (no Wyoming needed for the browser)
    image: artibex/piper-http:latest
    ports: ["5000:5000"]
    environment:
      # Example English voice (change as you like):
      - MODEL_DOWNLOAD_LINK=https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/kusal/medium/en_US-kusal-medium.onnx?download=true
      - TZ=America/Toronto
    # API: POST /api/tts  with JSON: {"text":"hello"} -> WAV bytes

  web:  # static web UI (serves index.html + JS)
    image: nginx:alpine
    ports: ["8080:80"]
    volumes:
      - ./web:/usr/share/nginx/html:ro
    environment:
      - TZ=America/Toronto

  # Optional: a CPU YOLO container to receive frames from the web UI
  # vision:
  #   image: ultralytics/ultralytics:latest
  #   command: sleep infinity
  #   ports: ["8008:8008"]
  #   # you can add a tiny FastAPI to accept JPEG frames and run predictions

volumes:
  n8n_data:


Faster-whisper server (HTTP / OpenAI-compatible) and Piper HTTP images are community-maintained and easy to run in Docker. 
GitHub
+1

If you prefer Wyoming protocol containers instead (Rhasspy’s wyoming-whisper / wyoming-piper), they exist for amd64, but a browser can’t speak Wyoming directly—you’d add a small HTTP bridge container. For most POCs, the HTTP images above are simpler. 
Docker Hub
+1

Minimal web UI (no installs; just files in ./web)

Create ./web/index.html (served by the web container). It:

asks for microphone permission (getUserMedia)

runs Porcupine Web in-page for “Hey Pi” (or any keyword you choose)

after wake word, records a short utterance, sends to STT, posts the text to your n8n webhook, then fetches WAV from TTS and plays it.

<!doctype html>
<html>
  <head><meta charset="utf-8"/><title>Voice POC</title></head>
  <body>
    <h3>Voice POC (everything in Docker; this page is the mic/camera)</h3>
    <button id="start">Start listening</button>
    <pre id="log"></pre>
    <script type="module">
      const log = (...a)=>document.getElementById('log').textContent += a.join(' ')+'\n';

      // 1) Ask for mic (browser only; nothing to install)
      const stream = await navigator.mediaDevices.getUserMedia({audio:true}); // mic
      log('Mic permission granted');
      const ctx = new AudioContext({sampleRate:16000});
      const source = ctx.createMediaStreamSource(stream);

      // 2) Porcupine Web wake word (replace with your AccessKey + keyword)
      // Docs: https://picovoice.ai/docs/quick-start/porcupine-web/
      import { PorcupineWorkerFactory } from "https://cdn.jsdelivr.net/npm/@picovoice/porcupine-web@3/dist/iife/index.js";
      const accessKey = "YOUR_PICOVOICE_ACCESS_KEY";
      const porcupine = await PorcupineWorkerFactory.create(
        accessKey,
        [{ builtin: "porcupine" }],   // use a builtin keyword for demo; later swap to "hey pi"
      );

      // Pipe audio to Porcupine
      const proc = ctx.createScriptProcessor(512, 1, 1);
      source.connect(proc); proc.connect(ctx.destination);
      const reader = new window.AudioWorkletNode?.constructor ? null : null;

      const pcmQueue = [];
      proc.onaudioprocess = (e) => {
        const data = e.inputBuffer.getChannelData(0);
        // convert float32 -> int16 PCM
        const pcm16 = new Int16Array(data.length);
        for (let i=0; i<data.length; i++) pcm16[i] = Math.max(-1, Math.min(1, data[i])) * 0x7fff;
        porcupine.postMessage({command:"process", inputFrame: pcm16});
      };

      porcupine.onmessage = async (msg) => {
        if (msg.data.command === "ppn-keyword") {
          log(`Wake word detected!`);
          const wav = await recordUtterance(stream, 5_000);
          const text = await stt(wav);
          log('STT:', text);
          // Send to your n8n flow:
          await fetch('http://localhost:5678/webhook/wake', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ text })
          });
          // Speak back:
          const wavBytes = await tts(`You said: ${text}`);
          playWav(wavBytes);
        }
      };

      document.getElementById('start').onclick = ()=>{ log('Listening for wake word… keep this tab open'); };

      async function recordUtterance(stream, ms=4000){
        const rec = new MediaRecorder(stream, {mimeType:'audio/webm'});
        const chunks = [];
        rec.ondataavailable = (e)=>{ if (e.data.size) chunks.push(e.data); };
        rec.start();
        await new Promise(r=>setTimeout(r, ms));
        rec.stop();
        await new Promise(r=>rec.onstop = r);
        const webm = new Blob(chunks, {type:'audio/webm'});
        // Let the STT server handle webm/opus; otherwise convert client-side if needed.
        return webm;
      }

      async function stt(blob){
        const form = new FormData();
        form.append("file", blob, "speech.webm");
        form.append("model", "small");
        const r = await fetch("http://localhost:9000/v1/audio/transcriptions", { method:"POST", body: form });
        const j = await r.json();
        return j.text || "";
      }

      async function tts(text){
        const r = await fetch("http://localhost:5000/api/tts", {
          method:"POST", headers: {"Content-Type":"application/json"},
          body: JSON.stringify({ text })
        });
        return new Uint8Array(await r.arrayBuffer());
      }

      function playWav(bytes){
        const blob = new Blob([bytes], {type:'audio/wav'});
        const url = URL.createObjectURL(blob);
        new Audio(url).play();
      }
    </script>
  </body>
</html>


Notes
• Browser mic/cam access is standard (navigator.mediaDevices.getUserMedia). You’ll get a permission prompt the first time. 
MDN Web Docs
+1

• Porcupine Web runs in the page (WASM) and supports custom wake words trained in their console. For a POC, the builtin demo keyword is fine. 
Picovoice

“Truly headless” option?

If you strictly want an always-listening background service with no browser tab involved on Windows, Docker alone can’t access the mic. Advanced workarounds (USB/IP into WSL2, custom kernels, etc.) require extra host setup—i.e., not “nothing installed.” That’s a Windows/Docker Desktop limitation. 
Docker Community Forums
+1

When you move to the Pi

Swap to ARM images (many of these have linux/arm64 tags) or keep your flows but point to the Pi addresses. Rhasspy’s Wyoming images for Whisper/Piper/OpenWakeWord are also available and commonly used on ARM. 
Docker Hub
+2
Docker Hub
+2

TL;DR

Yes, you can keep your Windows PC clean and run the entire stack in Docker.

The only host surface you’ll use is a browser tab that captures mic/cam and plays audio; everything else is containerized (n8n, STT, TTS, vision).

If you demand no browser and no host installs, Windows Docker can’t do always-listening audio due to USB/audio passthrough limits. 
Docker Community Forums

If you want, I can tailor the index.html to your exact wake phrase (“Hey Pi”), wire it to a sample n8n flow, and add a simple vision endpoint so the page can POST frames for object detection—all still containerized.