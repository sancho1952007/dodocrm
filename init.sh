#!/bin/sh
set -e

# Run Prisma migrations/push to ensure the DB structure is initialized
echo "Running Prisma db push..."
npx prisma db push --accept-data-loss


# Start the Node.js application
echo "Starting Next.js..."
exec "$@"
