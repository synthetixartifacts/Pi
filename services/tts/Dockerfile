FROM python:3.11-slim
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    bash \
    build-essential \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
RUN pip install --upgrade pip setuptools wheel
COPY requirements.txt .
RUN pip install --no-cache-dir --timeout=120 -r requirements.txt || \
    (pip install --no-cache-dir --timeout=120 --no-deps -r requirements.txt && \
     pip install --no-cache-dir --timeout=120 numpy onnxruntime)
COPY app.py .
COPY download_model.sh .
RUN chmod +x download_model.sh && bash ./download_model.sh
EXPOSE 5000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "5000"]
