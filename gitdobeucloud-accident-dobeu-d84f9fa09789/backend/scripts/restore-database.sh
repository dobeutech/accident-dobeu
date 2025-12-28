#!/bin/bash

# Database Restore Script
# Usage: ./scripts/restore-database.sh <backup_file>

set -e

# Check if backup file is provided
if [ -z "$1" ]; then
    echo "Error: Backup file not specified"
    echo "Usage: ./scripts/restore-database.sh <backup_file>"
    echo "Example: ./scripts/restore-database.sh ./backups/backup_20240101_120000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

echo "WARNING: This will restore the database and overwrite existing data!"
echo "Database: ${DB_NAME}"
echo "Host: ${DB_HOST}"
echo "Backup file: ${BACKUP_FILE}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

# Create temporary directory
TEMP_DIR=$(mktemp -d)
TEMP_SQL="${TEMP_DIR}/restore.sql"

# Decompress if needed
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "Decompressing backup..."
    gunzip -c "$BACKUP_FILE" > "$TEMP_SQL"
else
    cp "$BACKUP_FILE" "$TEMP_SQL"
fi

echo "Starting database restore..."

# Drop existing connections
echo "Terminating existing connections..."
PGPASSWORD="${DB_PASSWORD}" psql \
    -h "${DB_HOST}" \
    -p "${DB_PORT:-5432}" \
    -U "${DB_USER}" \
    -d postgres \
    -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();" \
    2>/dev/null || true

# Restore database
echo "Restoring database..."
PGPASSWORD="${DB_PASSWORD}" psql \
    -h "${DB_HOST}" \
    -p "${DB_PORT:-5432}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    -f "$TEMP_SQL" \
    --single-transaction \
    --set ON_ERROR_STOP=on

# Clean up
rm -rf "$TEMP_DIR"

echo "Database restore completed successfully!"
echo ""
echo "IMPORTANT: Please verify the restored data before resuming operations."
