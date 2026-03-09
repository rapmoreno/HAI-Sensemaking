#!/bin/bash
echo "Killing port 8731..."
lsof -ti:8731 | xargs kill -9 2>/dev/null || true

if [ -d "venv" ]; then
  source venv/bin/activate
fi

export $(cat .env | grep -v '^#' | xargs)

# WeasyPrint needs pango/glib from Homebrew; when Homebrew is at a non-standard
# path (e.g. IT-managed), dyld won't find them. Add that path for this process only.
if [ -n "${WEASYPRINT_LIB_PATH:-}" ] && [ -d "$WEASYPRINT_LIB_PATH" ]; then
  export DYLD_FALLBACK_LIBRARY_PATH="${DYLD_FALLBACK_LIBRARY_PATH:+$DYLD_FALLBACK_LIBRARY_PATH:}$WEASYPRINT_LIB_PATH"
elif [ -d "/Users/raphael.moreno/homebrew/lib" ]; then
  export DYLD_FALLBACK_LIBRARY_PATH="${DYLD_FALLBACK_LIBRARY_PATH:+$DYLD_FALLBACK_LIBRARY_PATH:}/Users/raphael.moreno/homebrew/lib"
fi

echo "Starting HAI Canvas on port 8731..."
uvicorn backend.main:app --host 0.0.0.0 --port 8731 --reload
