#!/usr/bin/env bash
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check Python (need 3.9+ for PEP 585 type syntax used in server.py)
PYTHON=""
for py in python3.13 python3.12 python3.11 python3.10 python3.9; do
  if command -v "$py" &>/dev/null; then
    PYTHON="$py"
    break
  fi
done
if [ -z "$PYTHON" ]; then
  if command -v python3 &>/dev/null; then
    PY_VER=$(python3 -c 'import sys; print(sys.version_info[:2] >= (3,9))')
    if [ "$PY_VER" = "True" ]; then
      PYTHON="python3"
    else
      echo "❌ python3 is $(python3 --version) but 3.9+ is required. Please install Python 3.11+"
      exit 1
    fi
  else
    echo "❌ python3 not found. Please install Python 3.11+"
    exit 1
  fi
fi
echo "🐍 Using $($PYTHON --version)"

# Check Node
if ! command -v node &>/dev/null; then
  echo "❌ node not found. Please install Node.js 18+"
  exit 1
fi

# Check pnpm
if ! command -v pnpm &>/dev/null; then
  echo "📦 Installing pnpm..."
  npm install -g pnpm
fi

# Install Python deps
echo "📦 Installing Python dependencies..."
cd server
if [ ! -d ".venv" ]; then
  $PYTHON -m venv .venv
fi
source .venv/bin/activate
pip install -q -r requirements.txt
cd ..

# Install Node deps
if [ ! -d "node_modules" ]; then
  echo "📦 Installing Node dependencies..."
  pnpm install
fi

# Start Python server in background
echo "🐍 Starting Python runner on http://localhost:8000..."
source server/.venv/bin/activate
python3 server/server.py &
PYTHON_PID=$!

# Give it a moment to start
sleep 1

# Start Vite dev server
echo "⚡ Starting React app on http://localhost:5173..."
echo ""
echo "  Open: http://localhost:5173"
echo "  Press Ctrl+C to stop both servers."
echo ""

trap "kill $PYTHON_PID 2>/dev/null; exit" INT TERM

pnpm dev

kill $PYTHON_PID 2>/dev/null
