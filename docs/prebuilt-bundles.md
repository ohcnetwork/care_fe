# Prebuilt bundles

To deploy CARE on a static host (S3 + CloudFront, Cloudflare Pages, Netlify, any web server) without building it, download the `build/` folder that CI publishes as `care_fe-build.tar.gz`. The [Publish build bundle](../.github/workflows/publish-build.yml) workflow publishes it:

| Build of                                 | Published as                                                                                             |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Each push to `develop` or a `3.*` branch | `ghcr.io/ohcnetwork/care_fe-build:sha-<short sha>`, and the branch name (`:develop`, `:3.0`) moves to it |
| Each release tag (`v*`)                  | `:sha-<short sha>` and `:<tag>` (for example `:v3.0.33`), and an asset of the [GitHub release][releases] |

## Download a bundle

From GHCR, with [ORAS](https://oras.land/docs/installation):

```sh
oras pull ghcr.io/ohcnetwork/care_fe-build:develop # or :3.0, :sha-<short sha>, :<tag>
mkdir build && tar -xzf care_fe-build.tar.gz -C build
```

If `oras pull` fails with `unauthorized`, the package isn't public yet: sign in first with `oras login ghcr.io` and a GitHub token that has the `read:packages` scope.

The branch tags (`:develop`, `:3.0`) move to each new build, and a rebuild of a commit replaces its `sha-` tag. To deploy the exact same bundle again later, pull it by the digest that `oras pull` prints (`ghcr.io/ohcnetwork/care_fe-build@sha256:<digest>`).

From a GitHub release, with any HTTP client:

```sh
curl -fLO https://github.com/ohcnetwork/care_fe/releases/latest/download/care_fe-build.tar.gz
# or a given release:
curl -fLO https://github.com/ohcnetwork/care_fe/releases/download/<tag>/care_fe-build.tar.gz
```

## Verify a bundle

Each bundle has a signed build provenance attestation. To check that a bundle was built by this repository's CI:

```sh
gh attestation verify care_fe-build.tar.gz --repo ohcnetwork/care_fe
```

The bundle's `build-meta.json` has the commit, the Git ref and the build time (`commit`, `ref`, `built_at`). A deployment serves it at `/build-meta.json`.

## Configure the bundle

The bundle has the values of [`.env`](../.env), so it connects to `https://careapi.ohc.network` until you configure it. Before you serve it, replace its `runtime-env.js` with your deployment's settings, at least `REACT_CARE_API_URL`. See [Runtime configuration](runtime-configuration.md).

These settings are read only at build time, so the bundle always has the values CI built it with (those of `.env`, the rest unset): the page title and meta tags (`REACT_APP_TITLE`, `REACT_APP_META_DESCRIPTION`, `REACT_APP_COVER_IMAGE`, `REACT_PUBLIC_URL`), `REACT_INJECTED_HEAD`, `REACT_INJECTED_HTML`, `REACT_CUSTOM_DESCRIPTION` and `REACT_MFE_REGISTERED_COMPONENTS`. To change them, build the app yourself (`npm run build`).

The bundle also has a `_headers` file with ohc.network's response headers (`HEADERS` in `.env`), which Cloudflare Pages and Netlify apply. It includes `Strict-Transport-Security` with `includeSubDomains` for a year, so edit or delete the file before you deploy if that doesn't suit your domain.

[releases]: https://github.com/ohcnetwork/care_fe/releases
