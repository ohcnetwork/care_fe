#!/usr/bin/env bash
# Runs the CARE backend (ohcnetwork/care, checked out in ./care) for the
# Playwright workflow.
#
#   configure  append the CI settings to care/docker/.local.env
#   build      build the care_local image and save it to $IMAGE_TAR
#   snapshot   start the stack, load fixtures and dump the DB to $DB_DUMP
#   start      start the stack for a test shard. Loads $IMAGE_TAR and restores
#              $DB_DUMP when they exist; otherwise falls back to building the
#              image, running migrations and loading fixtures.
#   start-bg   run `start` in the background (log: $START_LOG)
#   wait       wait for `start-bg` to finish; fail if it failed
#   stop       stop the stack
set -euo pipefail

CARE_DIR="$(realpath -m "${CARE_DIR:-care}")"
IMAGE_TAR="${IMAGE_TAR:-/tmp/care-image/care_local.tar}"
DB_DUMP="${DB_DUMP:-/tmp/care-db/care_db.dump}"
START_LOG="${START_LOG:-/tmp/care-backend-start.log}"
START_STATUS="${START_STATUS:-/tmp/care-backend-start.status}"
SCRIPT="$(realpath "${BASH_SOURCE[0]}")"
RUNNER_FILES="$(dirname "$SCRIPT")"

log() { echo "[$(date -u +%H:%M:%S)] $*"; }

compose() {
  (cd "$CARE_DIR" && docker compose -f docker-compose.yaml -f docker-compose.local.yaml "$@")
}

psql_count() {
  # Prints the number of rows in table $2 of database $1 (0 if it fails).
  local n
  n=$(compose exec -T db psql -U postgres -d "$1" -tAc "SELECT count(*) FROM $2" 2>/dev/null | tr -d '[:space:]') || true
  echo "${n:-0}"
}

dump_logs() {
  compose ps -a || true
  compose logs --tail 150 || true
}

configure() {
  cat >> "$CARE_DIR/docker/.local.env" <<EOF

DISABLE_RATELIMIT=True
JWKS_BASE64="$(cat "$RUNNER_FILES/jwks.b64.txt")"
MAX_QUESTIONNAIRE_TEXT_RESPONSE_SIZE=500
# Shards reuse the setup logins for longer than the default 10-minute
# access token, so keep tokens valid for the whole job.
JWT_ACCESS_TOKEN_LIFETIME=60
JWT_REFRESH_TOKEN_LIFETIME=120
EOF
}

build() {
  log "Building care_local image"
  compose build backend
  mkdir -p "$(dirname "$IMAGE_TAR")"
  docker save -o "$IMAGE_TAR" care_local:latest
  log "Saved image to $IMAGE_TAR ($(du -h "$IMAGE_TAR" | cut -f1))"
}

load_image() {
  if docker image inspect care_local:latest > /dev/null 2>&1; then
    log "care_local image already present"
  elif [ -f "$IMAGE_TAR" ]; then
    log "Loading cached care_local image ($(du -h "$IMAGE_TAR" | cut -f1))"
    docker load -i "$IMAGE_TAR"
    log "Image loaded"
  else
    echo "::warning::No cached care_local image; docker compose will build it (slow path)"
  fi
}

wait_for_db() {
  # Check over TCP: during first-run init Postgres only listens on its socket,
  # then restarts, so a socket check can pass too early.
  for _ in $(seq 1 120); do
    if compose exec -T db pg_isready -q -h 127.0.0.1 -U postgres -d care 2> /dev/null; then
      return 0
    fi
    sleep 1
  done
  echo "::error::Postgres did not become ready"
  dump_logs
  return 1
}

restore_into() {
  # Restores $DB_DUMP into database $1 and checks it has migrations and users.
  local db="$1"
  if ! compose exec -T db pg_restore -U postgres -d "$db" --no-owner < "$DB_DUMP" 2> /tmp/pg_restore.err; then
    echo "pg_restore reported problems (first 30 lines):"
    head -30 /tmp/pg_restore.err
  fi
  local migrations users
  migrations=$(psql_count "$db" django_migrations)
  users=$(psql_count "$db" users_user)
  log "Restored $db: $migrations migrations, $users users"
  [ "$migrations" -gt 0 ] && [ "$users" -gt 0 ]
}

start_services() {
  log "Starting services"
  if ! compose up -d --wait --wait-timeout 900; then
    echo "::error::CARE services did not become healthy"
    dump_logs
    return 1
  fi
  log "Services healthy"
}

snapshot() {
  load_image
  start_services
  log "Loading fixtures"
  compose exec -T backend python manage.py load_fixtures
  mkdir -p "$(dirname "$DB_DUMP")"
  compose exec -T db pg_dump -U postgres -Fc care > "$DB_DUMP"
  log "Saved DB snapshot to $DB_DUMP ($(du -h "$DB_DUMP" | cut -f1))"

  # Prove the snapshot restores into a fresh database (as a shard would do)
  # before it gets cached.
  compose exec -T db createdb -U postgres care_restore_check
  if ! restore_into care_restore_check; then
    rm -f "$DB_DUMP"
    echo "::error::DB snapshot did not restore cleanly; not caching it"
    return 1
  fi
  compose exec -T db dropdb -U postgres care_restore_check
}

start() {
  log "Starting CARE backend"
  load_image

  local restored=false
  if [ -f "$DB_DUMP" ]; then
    log "Restoring DB snapshot ($(du -h "$DB_DUMP" | cut -f1))"
    compose up -d db redis minio
    wait_for_db
    if restore_into care; then
      restored=true
    else
      echo "::warning::DB snapshot restore failed; falling back to migrations + fixtures (slow path)"
      compose exec -T db dropdb -U postgres --if-exists --force care
      compose exec -T db createdb -U postgres care
    fi
  else
    echo "::warning::No DB snapshot; running migrations + fixtures (slow path)"
  fi

  start_services

  if [ "$restored" = false ]; then
    log "Loading fixtures"
    compose exec -T backend python manage.py load_fixtures
  fi
  log "CARE backend ready"
}

start_bg() {
  rm -f "$START_STATUS" "$START_STATUS.tmp"
  # shellcheck disable=SC2016  # expanded by the inner shell
  nohup bash -c 'bash "$0" start > "$1" 2>&1; echo $? > "$2.tmp"; mv "$2.tmp" "$2"' \
    "$SCRIPT" "$START_LOG" "$START_STATUS" > /dev/null 2>&1 &
  log "Backend startup running in the background (pid $!)"
}

wait_started() {
  local waited=0
  while [ ! -f "$START_STATUS" ]; do
    if [ "$waited" -ge 1200 ]; then
      cat "$START_LOG" || true
      echo "::error::Timed out waiting for the CARE backend to start"
      dump_logs
      return 1
    fi
    sleep 2
    waited=$((waited + 2))
  done
  echo "----- backend startup log -----"
  cat "$START_LOG"
  echo "-------------------------------"
  local status
  status=$(cat "$START_STATUS")
  if [ "$status" != "0" ]; then
    echo "::error::CARE backend failed to start (exit $status)"
    dump_logs
    return 1
  fi
  curl -fsS http://localhost:9000/ping/ > /dev/null
  log "Backend is up; waited ${waited}s after the other setup steps finished"
}

case "${1:-}" in
  configure) configure ;;
  build) build ;;
  snapshot) snapshot ;;
  start) start ;;
  start-bg) start_bg ;;
  wait) wait_started ;;
  stop) compose down || true ;;
  *)
    echo "usage: $0 {configure|build|snapshot|start|start-bg|wait|stop}" >&2
    exit 2
    ;;
esac
