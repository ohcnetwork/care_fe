#!/bin/sh
# Writes the REACT_* environment variables to runtime-env.js, which overrides
# the values baked into the build (see docs/runtime-configuration.md). The
# Docker image runs it on container start. Elsewhere, set
# CARE_RUNTIME_ENV_FILE to the output path, for example in a deploy pipeline.
set -eu

out="${CARE_RUNTIME_ENV_FILE:-/usr/share/nginx/html/runtime-env.js}"

# Without REACT_* variables, keep the file as it is: the build's empty one, or
# one mounted in its place. Containers with a read-only root filesystem then
# still start.
if ! env | grep -q '^REACT_[A-Z0-9_][A-Z0-9_]*='; then
  echo "$0: no REACT_* environment variables, so $out is left as it is"
  exit 0
fi

# Escapes one character at a time: gsub() replacements that contain
# backslashes behave differently in BusyBox awk and mawk.
awk '
function esc(s,    r, i, c) {
  r = ""
  for (i = 1; i <= length(s); i++) {
    c = substr(s, i, 1)
    if (c == "\\") r = r "\\\\"
    else if (c == "\"") r = r "\\\""
    else if (c == "\n") r = r "\\n"
    else if (c == "\r") r = r "\\r"
    else if (c == "\t") r = r "\\t"
    else if (c == "<") r = r "\\u003c"
    else r = r c
  }
  return r
}
BEGIN {
  printf "window.__CARE_RUNTIME_ENV__={"
  sep = ""
  for (k in ENVIRON) {
    if (k !~ /^REACT_[A-Z0-9_]+$/) continue
    printf "%s\"%s\":\"%s\"", sep, k, esc(ENVIRON[k])
    sep = ","
  }
  print "};"
}' > "$out"

echo "$0: wrote REACT_* environment variables to $out"
