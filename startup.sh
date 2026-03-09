#!/bin/bash
echo "Killing port 8731..."
lsof -ti:8731 | xargs kill -9 2>/dev/null || true

if [ -d "venv" ]; then
  source venv/bin/activate
fi

export $(cat .env | grep -v '^#' | xargs)

echo "Starting HAI Canvas on port 8731..."
uvicorn backend.main:app --host 0.0.0.0 --port 8731 --reload
