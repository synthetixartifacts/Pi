FROM python:3.11-slim
RUN apt-get update && apt-get install -y curl wget && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .
COPY download_model.sh .
RUN chmod +x download_model.sh && ./download_model.sh
EXPOSE 5000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "5000"]
