#!/bin/bash
# Script to stop the application running on port 8080
# Usage: ./scripts/dev/stop-app.sh

echo "🛑 Stopping application on port 8080..."
echo ""

# Find process on port 8080
PID=$(lsof -ti:8080 2>/dev/null)

if [ -z "$PID" ]; then
    echo "✅ No process found on port 8080"
    exit 0
fi

echo "Found process: $PID"
echo "Killing process..."

# Kill the process
kill -9 $PID 2>/dev/null

# Wait a moment
sleep 2

# Verify it's stopped
if lsof -ti:8080 > /dev/null 2>&1; then
    echo "❌ Failed to stop process"
    exit 1
else
    echo "✅ Application stopped successfully"
    echo "Port 8080 is now free"
fi

