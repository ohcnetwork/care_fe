/**
 * Parses one REACT_ENABLED_APPS entry, "org/repo" or "org/repo@url", and
 * throws if it's invalid. care.config.ts uses it to load plugins, and
 * scripts/validate-env.ts to check the setting, so keep it free of imports.
 */
export function parseCareApp(app: string) {
  const [module, cdn] = app.split("@");
  const [org, repo] = module.split("/");

  if (!org || !repo) {
    throw new Error(
      `Invalid plug configuration: ${module}. Expected 'org/repo@url'.`,
    );
  }

  // Relative URLs are resolved against the page origin at load time.
  if (cdn?.startsWith("/")) {
    return { url: cdn, name: repo, package: module };
  }

  let url = "";
  if (!cdn) {
    url = `https://${org}.github.io/${repo}`;
  }

  if (!url.startsWith("http")) {
    url = `${cdn.includes("localhost") ? "http" : "https"}://${cdn}`;
  }

  return {
    url: new URL(url).toString(),
    name: repo,
    package: module,
  };
}
