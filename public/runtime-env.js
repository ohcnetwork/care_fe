// Runtime overrides for REACT_* environment variables, read by care.config.ts.
// The Docker image rewrites this file on container start (see
// nginx/runtime-env.sh). Elsewhere it stays empty and the build's values apply.
window.__CARE_RUNTIME_ENV__ = {};
