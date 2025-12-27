#!/bin/bash

# Database Migration Rollback Script
# Usage: ./scripts/rollback-migration.sh <migration_number>

set -e

# Check if migration number is provided
if [ -z "$1" ]; then
    echo "Error: Migration number not specified"
    echo "Usage: ./scripts/rollback-migration.sh <migration_number>"
    echo "Example: ./scripts/rollback-migration.sh 003"
    exit 1
fi

MIGRATION_NUM="$1"

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

echo "WARNING: This will rollback migration ${MIGRATION_NUM}"
echo "Database: ${DB_NAME}"
echo "Host: ${DB_HOST}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Rollback cancelled."
    exit 0
fi

# Create backup before rollback
echo "Creating backup before rollback..."
BACKUP_FILE="./backups/pre_rollback_${MIGRATION_NUM}_$(date +%Y%m%d_%H%M%S).sql.gz"
./scripts/backup-database.sh "pre_rollback_${MIGRATION_NUM}_$(date +%Y%m%d_%H%M%S)"

# Check if rollback file exists
ROLLBACK_FILE="./src/database/migrations/rollback_${MIGRATION_NUM}.sql"

if [ ! -f "$ROLLBACK_FILE" ]; then
    echo "Error: Rollback file not found: $ROLLBACK_FILE"
    echo "Please create a rollback SQL file for this migration."
    exit 1
fi

echo "Executing rollback..."
PGPASSWORD="${DB_PASSWORD}" psql \
    -h "${DB_HOST}" \
    -p "${DB_PORT:-5432}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    -f "$ROLLBACK_FILE" \
    --single-transaction \
    --set ON_ERROR_STOP=on

echo "Rollback completed successfully!"
echo ""
echo "IMPORTANT: Verify the database state before proceeding."
echo "Backup saved at: ${BACKUP_FILE}"
