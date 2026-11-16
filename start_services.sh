#!/usr/bin/env bash
# ==============================================================================
# Smart Agro (স্মার্ট এগ্রো) - Dual Service Runner
# Starts Python AI Microservice (Port 5000) & Node.js Express Backend (Port 3000)
# ==============================================================================

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

PYTHON_BIN="/home/saiful_islam_bk/crop_disease_api/venv/bin/python"
if [ ! -f "$PYTHON_BIN" ]; then
  PYTHON_BIN="python3"
fi

# 1. Check & start Python AI Microservice on Port 5000
if curl -s http://localhost:5000/health | grep -q "healthy"; then
  echo "✅ [AI Microservice] Already running on http://127.0.0.1:5000"
else
  echo "🚀 [AI Microservice] Starting Python Flask on http://127.0.0.1:5000..."
  $PYTHON_BIN ai_service/app.py &
  AI_PID=$!
  sleep 3
fi

# 2. Start Node.js Main Web Server on Port 3000
echo "🚀 [Node.js Backend] Starting Express Web Server on http://localhost:3000..."
node server.js

