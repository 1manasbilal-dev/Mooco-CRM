#!/bin/bash
# DairyFlow Dev Server Starter
# Runs in background persistently

LOG="/home/z/my-project/dev.log"
PIDFILE="/home/z/my-project/.dev-server.pid"

# Kill any existing server
if [ -f "$PIDFILE" ]; then
    OLD_PID=$(cat "$PIDFILE")
    kill -9 "$OLD_PID" 2>/dev/null
    rm -f "$PIDFILE"
fi

# Start the server
exec npx next dev -p 4000 > "$LOG" 2>&1 &
SERVER_PID=$!
echo "$SERVER_PID" > "$PIDFILE"

# Keep the script running to prevent the server from being killed
wait $SERVER_PID
