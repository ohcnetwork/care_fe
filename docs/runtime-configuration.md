# Runtime configuration

`REACT_*` settings are read at build time, but a deployment can override them without a rebuild by serving its own `/runtime-env.js` next to `index.html`. `index.html` loads it before the app, and `care.config.ts` lets its values override the build's. The build ships an empty one, so the build's values apply until you replace it.

## Enable it in a deployment

1. Write a `runtime-env.js` with the settings to override. Names and formats are the same as in `.env`, and every value is a string. Settings you leave out keep the build's values.

   ```js
   window.__CARE_RUNTIME_ENV__ = {
     REACT_CARE_API_URL: "https://careapi.example.org",
     REACT_DISABLE_PATIENT_LOGIN: "true",
   };
   ```

   Or generate it from environment variables (needs only `sh` and `awk`):

   ```sh
   REACT_CARE_API_URL=https://careapi.example.org \
   CARE_RUNTIME_ENV_FILE=runtime-env.js sh nginx/runtime-env.sh
   ```

2. Serve it at `/runtime-env.js` in place of the build's empty file, with `Content-Type: text/javascript` and `Cache-Control: no-cache`. The service worker never caches it, so returning visitors get new values too.
3. To change settings later, replace that file.

## Examples

### S3 + CloudFront

```sh
aws s3 sync build/ s3://<bucket>/ --delete --exclude runtime-env.js
aws s3 cp runtime-env.js s3://<bucket>/runtime-env.js \
  --cache-control no-cache --content-type text/javascript
```

A plain sync of a new build replaces your file with the empty one, so exclude it or upload it again after every deploy. Invalidate `/runtime-env.js` if the CDN has already cached it.

### Cloudflare Pages or Netlify

Write the file into `build/` before uploading:

```sh
CARE_RUNTIME_ENV_FILE=build/runtime-env.js sh nginx/runtime-env.sh
```

Both serve files with `max-age=0, must-revalidate` by default, so no header change is needed.

### Docker

```sh
docker run -p 8080:80 -e REACT_CARE_API_URL=https://careapi.example.org <image>
```

The container writes its `REACT_*` variables to `runtime-env.js` on every start. To apply new values, recreate the container with them, for example with `docker compose up -d`. A restart keeps the values the container was created with.

The container writes the file into `/usr/share/nginx/html`, so with `REACT_*` variables set, it doesn't start with a read-only root filesystem or as a user that can't write there. In that case, mount your own `runtime-env.js` at `/usr/share/nginx/html/runtime-env.js` instead, for example from a Kubernetes ConfigMap, and set no `REACT_*` variables. Without them, the container leaves the file as it is.

### Any other web server

Replace `runtime-env.js` in the served `build/` folder and turn off caching for it. With nginx:

```nginx
location = /runtime-env.js {
  expires -1;
}
```

## Check a deployment

In the browser console, `window.__CARE_RUNTIME_ENV__` shows the overrides and `window.__CORE_ENV__` shows the resulting config.

## Limitations

- The values are visible to anyone who loads the app, as build-time values already are, so never put secrets in them.
- Control who can write `runtime-env.js` as you would for `index.html`. It sets the API URL and `REACT_ENABLED_APPS`, which loads plugin code into the app, so write access to it is write access to the app.
- Before the app starts, it checks them with the same rules as build-time values (`scripts/validate-env.ts`), merged with the build's values. If one is invalid, for example a malformed JSON value in `REACT_CUSTOM_SHORTCUTS`, the app doesn't start: it shows which settings are invalid, and the browser console has the details. Try changes on a staging site first.
- If `runtime-env.js` doesn't load (a network or server error, or the server returns `index.html` in its place), the app doesn't start. It shows an error with a **Try again** button rather than run with the build's values, which may point at another deployment's backend. This also happens on a device that is offline, because the service worker doesn't cache the file.
- These settings are still applied only at build time: `REACT_APP_TITLE`, `REACT_APP_META_DESCRIPTION`, `REACT_APP_COVER_IMAGE`, `REACT_PUBLIC_URL`, `REACT_INJECTED_HEAD` and `REACT_INJECTED_HTML` (written into `index.html`), `REACT_CUSTOM_DESCRIPTION` and `REACT_MFE_REGISTERED_COMPONENTS`.
