#!/bin/zsh
cd "$(dirname "$0")" || exit 1

PORT=4173
URL="http://127.0.0.1:${PORT}/index.html"

echo "Starting UK Theory Test Trainer..."
echo "Website: ${URL}"
echo ""

open "${URL}" >/dev/null 2>&1

if command -v python3 >/dev/null 2>&1; then
  python3 -m http.server "${PORT}" --bind 127.0.0.1
elif command -v ruby >/dev/null 2>&1; then
  ruby -run -e httpd . -p "${PORT}" -b 127.0.0.1
else
  echo "Please install Python 3 or Ruby to run a local website server."
  read -r "REPLY?Press Enter to close..."
fi
