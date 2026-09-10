#!/bin/bash

# Kill any existing processes on port 4001
PORT=4001
PIDS=$(lsof -ti:$PORT 2>/dev/null)

if [ ! -z "$PIDS" ]; then
  echo "🧹 Cleaning up existing processes on port $PORT..."
  kill -9 $PIDS 2>/dev/null
  sleep 1
  echo "✅ Port $PORT is now free"
else
  echo "✅ Port $PORT is already free"
fi

# Start the dev server
echo "🚀 Starting backend dev server..."
tsx watch src/index.ts
