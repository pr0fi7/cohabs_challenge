#!/bin/sh
set -e

# Optionally wait for the database to be accepting connections here if needed.
# e.g., use pg_isready or simple sleep/backoff if Postgres might not be ready.

echo "Ensuring admin user exists..."
# This assumes your create_admin.js reads ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FULL_NAME
npm run db:create-admin

echo "Starting server..."
exec node server.js
# 