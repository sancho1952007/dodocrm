#!/bin/sh
set -e

MARKER_FILE="/app/data/.setup_complete"

# Always push schema changes (safe & idempotent)
echo "Running Prisma db push..."
npx prisma db push --accept-data-loss --skip-generate

# Only seed on first deploy (when marker doesn't exist)
if [ ! -f "$MARKER_FILE" ]; then
  echo "First deploy detected — running seed..."
  npx prisma generate
  npx tsx prisma/seed.ts
  touch "$MARKER_FILE"
  echo "Setup complete. Marker written to $MARKER_FILE"
else
  echo "Setup already complete, skipping seed."
fi

# Start the Node.js application
echo "Starting Next.js..."
exec "$@"
