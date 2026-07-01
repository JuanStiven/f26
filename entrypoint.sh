#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

# Run migrations if DATABASE_URL is provided
if [ -n "$DATABASE_URL" ]; then
  echo "DATABASE_URL detected. Running Prisma migrations..."
  npx prisma migrate deploy || echo "Prisma migration deploy failed, attempting db push..." && npx prisma db push --accept-data-loss || echo "Prisma sync failed, proceeding..."
fi

# Start backend node process in the background
echo "Starting Express backend..."
node dist/index.js &

# Start Nginx in the foreground
echo "Starting Nginx reverse proxy..."
nginx -g "daemon off;"
