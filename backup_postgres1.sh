#!/bin/bash
# Database connection details
export PGPASSWORD='2N00py123-'
DB_HOST="database-1.c9omwig88ois.eu-west-1.rds.amazonaws.com"
DB_USER="postgres"
DB_NAME="<your_database_name>" # The user needs to fill this in
BACKUP_DIR="./backups"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Backup filename with timestamp
BACKUP_FILE="$BACKUP_DIR/$(date +%Y-%m-%d_%H-%M-%S).sql.gz"

# Run pg_dump
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME | gzip > $BACKUP_FILE

# Optional: Remove backups older than 7 days
find $BACKUP_DIR -type f -mtime +7 -name '*.sql.gz' -delete
