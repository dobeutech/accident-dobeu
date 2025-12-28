#!/bin/bash

# Database Backup Script
# Usage: ./scripts/backup-database.sh [backup_name]

set -e

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="${1:-backup_${TIMESTAMP}}"
BACKUP_FILE="${BACKUP_DIR}/${BACKUP_NAME}.sql"
COMPRESSED_FILE="${BACKUP_FILE}.gz"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "Starting database backup..."
echo "Database: ${DB_NAME}"
echo "Host: ${DB_HOST}"
echo "Backup file: ${COMPRESSED_FILE}"

# Perform backup
PGPASSWORD="${DB_PASSWORD}" pg_dump \
    -h "${DB_HOST}" \
    -p "${DB_PORT:-5432}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    --format=plain \
    --no-owner \
    --no-acl \
    --verbose \
    > "${BACKUP_FILE}" 2>&1

# Compress backup
echo "Compressing backup..."
gzip -f "${BACKUP_FILE}"

# Calculate size
BACKUP_SIZE=$(du -h "${COMPRESSED_FILE}" | cut -f1)
echo "Backup completed successfully!"
echo "File: ${COMPRESSED_FILE}"
echo "Size: ${BACKUP_SIZE}"

# Clean up old backups (keep last 30 days)
echo "Cleaning up old backups..."
find "${BACKUP_DIR}" -name "backup_*.sql.gz" -type f -mtime +30 -delete
echo "Old backups cleaned up (kept last 30 days)"

# Optional: Upload to S3
if [ ! -z "${AWS_S3_BACKUP_BUCKET}" ]; then
    echo "Uploading to S3..."
    aws s3 cp "${COMPRESSED_FILE}" "s3://${AWS_S3_BACKUP_BUCKET}/database-backups/" \
        --storage-class STANDARD_IA
    echo "Uploaded to S3: s3://${AWS_S3_BACKUP_BUCKET}/database-backups/$(basename ${COMPRESSED_FILE})"
fi

echo "Backup process completed!"
