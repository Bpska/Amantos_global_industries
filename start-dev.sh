#!/usr/bin/env bash
# Amanta Global Industries - Linux / macOS One-Click Dev Runner
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

echo "==================================================="
echo "  Amanta Global Industries - Starting Dev Stack"
echo "==================================================="

# Trap Ctrl+C to cleanly stop both
trap 'kill 0' EXIT

echo "Starting Backend API on port 5000..."
(cd backend && npm run dev) &

echo "Starting Frontend Web on port 5173..."
(cd web && npm run dev) &

wait
