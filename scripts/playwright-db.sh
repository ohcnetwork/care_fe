#!/bin/bash
# Playwright database management for local development
# Handles snapshot/restore of the care database for repeatable test runs
#
# Usage:
#   ./scripts/playwright-db.sh snapshot   — Save current DB state as test baseline
#   ./scripts/playwright-db.sh restore    — Restore DB to the saved snapshot
#   ./scripts/playwright-db.sh reset      — Drop, recreate, migrate, and load fixtures
#   ./scripts/playwright-db.sh status     — Show snapshot info

set -e

SNAPSHOT_FILE="${PLAYWRIGHT_DB_SNAPSHOT:-/tmp/care_playwright_snapshot.dump}"
DB_NAME="${POSTGRES_DB:-care}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_HOST="${POSTGRES_HOST:-127.0.0.1}"
DB_PORT="${POSTGRES_PORT:-5432}"

export PGPASSWORD="${POSTGRES_PASSWORD:-postgres}"

pg_cmd() {
  "$@" -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER"
}

case "${1:-}" in
  snapshot)
    echo "Taking DB snapshot → $SNAPSHOT_FILE"
    pg_cmd pg_dump -Fc "$DB_NAME" -f "$SNAPSHOT_FILE"
    echo "Snapshot saved ($(du -h "$SNAPSHOT_FILE" | cut -f1))"
    ;;

  restore)
    if [ ! -f "$SNAPSHOT_FILE" ]; then
      echo "No snapshot found at $SNAPSHOT_FILE"
      echo "Run './scripts/playwright-db.sh snapshot' first, or './scripts/playwright-db.sh reset' to create a fresh one."
      exit 1
    fi
    echo "Restoring DB from snapshot..."
    # Terminate existing connections
    pg_cmd psql -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();" > /dev/null 2>&1 || true
    # pg_restore returns non-zero for harmless warnings (e.g., "role already exists"),
    # so we capture stderr and only fail on actual restore errors
    restore_output=$(pg_cmd pg_restore --clean --if-exists -d "$DB_NAME" "$SNAPSHOT_FILE" 2>&1) || {
      # Filter out expected warnings; fail on real errors
      if echo "$restore_output" | grep -qiE "FATAL|could not connect|no matching tables"; then
        echo "Error: Failed to restore database from snapshot" >&2
        echo "$restore_output" >&2
        exit 1
      fi
    }
    echo "DB restored"
    ;;

  reset)
    echo "Full DB reset: drop → create → migrate → fixtures → snapshot"
    CARE_DIR="${CARE_BACKEND_DIR:-}"
    if [ -z "$CARE_DIR" ]; then
      echo "Error: CARE_BACKEND_DIR environment variable is not set." >&2
      echo "Set it to the path of your care backend checkout, e.g.:" >&2
      echo "  export CARE_BACKEND_DIR=/path/to/care" >&2
      exit 1
    fi
    if [ ! -f "$CARE_DIR/manage.py" ]; then
      echo "Error: manage.py not found in $CARE_DIR — is CARE_BACKEND_DIR correct?" >&2
      exit 1
    fi

    # Terminate connections and recreate
    pg_cmd psql -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();" > /dev/null 2>&1 || true
    pg_cmd dropdb --if-exists "$DB_NAME"
    pg_cmd createdb "$DB_NAME"

    # Run migrations and load fixtures
    cd "$CARE_DIR"
    DJANGO_SETTINGS_MODULE=config.settings.local DJANGO_READ_DOT_ENV_FILE=true .venv/bin/python manage.py migrate --verbosity=0
    DJANGO_SETTINGS_MODULE=config.settings.local DJANGO_READ_DOT_ENV_FILE=true .venv/bin/python manage.py load_fixtures

    # Take snapshot of clean state
    pg_cmd pg_dump -Fc "$DB_NAME" -f "$SNAPSHOT_FILE"
    echo "Fresh snapshot saved ($(du -h "$SNAPSHOT_FILE" | cut -f1))"
    ;;

  status)
    if [ -f "$SNAPSHOT_FILE" ]; then
      echo "Snapshot: $SNAPSHOT_FILE"
      echo "Size: $(du -h "$SNAPSHOT_FILE" | cut -f1)"
      echo "Created: $(stat -c '%y' "$SNAPSHOT_FILE" 2>/dev/null || stat -f '%Sm' "$SNAPSHOT_FILE" 2>/dev/null)"
    else
      echo "No snapshot found. Run './scripts/playwright-db.sh snapshot' or './scripts/playwright-db.sh reset'"
    fi
    ;;

  *)
    echo "Usage: $0 {snapshot|restore|reset|status}"
    echo ""
    echo "  snapshot  — Save current DB as test baseline"
    echo "  restore   — Restore DB to saved snapshot (fast, ~2s)"
    echo "  reset     — Full reset: drop + migrate + fixtures + snapshot (~30s)"
    echo "  status    — Show snapshot info"
    exit 1
    ;;
esac
