# Smart Agro (স্মার্ট এগ্রো) - MobileNetV2 AI Inference Microservice
# Containerized for Hugging Face Spaces (2 vCPU, 16GB RAM) and Docker environments

FROM python:3.11-slim

# Prevent Python from writing .pyc files and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=7860

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY ai_service/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Pre-cache ImageNet MobileNetV2 weights to eliminate runtime network download failures
RUN python -c "import tensorflow as tf; tf.keras.applications.MobileNetV2(weights='imagenet')"

# Copy model, dataset mapping, and microservice application code
COPY model/ /app/model/
COPY data/ /app/data/
COPY ai_service/ /app/ai_service/

# Expose Hugging Face Spaces standard port (7860) and local/Docker port (5000)
EXPOSE 7860
EXPOSE 5000

# Health check to ensure microservice readiness
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

WORKDIR /app/ai_service

CMD ["python", "app.py"]
