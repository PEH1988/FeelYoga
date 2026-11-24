#!/bin/bash
# macOS / Linux: doble clic o ./iniciar.command
cd "$(dirname "$0")"
( sleep 1; (open http://localhost:8765 || xdg-open http://localhost:8765) >/dev/null 2>&1 ) &
python3 server.py
