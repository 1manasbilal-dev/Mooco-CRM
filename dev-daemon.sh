#!/bin/bash
# Dev server daemon - keeps server running
while true; do
    echo "[$(date)] Starting dev server..." >> /home/z/my-project/daemon.log
    npx next dev -p 4000 >> /home/z/my-project/dev.log 2>&1
    EXIT_CODE=$?
    echo "[$(date)] Server exited with code $EXIT_CODE" >> /home/z/my-project/daemon.log
    sleep 3
done
