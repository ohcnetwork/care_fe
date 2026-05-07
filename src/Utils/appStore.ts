import {
  AppStoreAppDefinition,
  AppStoreEnvironmentGroups,
  AppStoreSetupOption,
  AppStoreSummary,
} from "@/types/appStore/appStore";
import { PlugConfig } from "@/types/plugConfig";
import careConfig from "@careConfig";

export async function fetchAppStoreJson<T>(
  url: string,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`Failed to fetch App Store data from ${url}`);
  }

  return (await response.json()) as T;
}

export async function fetchAppStoreText(
  url: string,
  signal?: AbortSignal,
): Promise<string> {
  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`Failed to fetch App Store text from ${url}`);
  }

  return response.text();
}

export function resolveAppStoreUrl(url: string, baseUrl: string): string {
  return new URL(url, baseUrl).toString();
}

/**
 * Resolves relative URLs within an app summary (such as `iconUrl` and
 * `appUrl`) against the URL the summary was fetched from. Developer indexes
 * are published in subdirectories (e.g. `/developers/ohcnetwork.json`) and
 * reference apps using paths like `../apps/foo.json`. Pre-resolving those
 * references to absolute URLs at fetch time cancels out the `../` relative
 * to the subdirectory and prevents the base URL from escaping the registry
 * root when the summary is later rendered against a different base URL
 * (for example the root index URL).
 */
export function resolveAppSummaryUrls(
  app: AppStoreSummary,
  sourceUrl: string,
): AppStoreSummary {
  return {
    ...app,
    iconUrl: app.iconUrl
      ? resolveAppStoreUrl(app.iconUrl, sourceUrl)
      : app.iconUrl,
    appUrl: resolveAppStoreUrl(app.appUrl, sourceUrl),
  };
}

export function resolveRepositoryReadmeUrl(repositoryUrl?: string) {
  if (!repositoryUrl) {
    return null;
  }

  try {
    const url = new URL(repositoryUrl);
    if (url.hostname !== "github.com") {
      return null;
    }

    const segments = url.pathname.split("/").filter(Boolean);
    const [owner, repo, mode, branch, ...rest] = segments;

    if (!owner || !repo) {
      return null;
    }

    const buildRawGithubUrl = (ref: string, path = "README.md") => {
      return `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${path}`;
    };

    if (!mode) {
      return buildRawGithubUrl("HEAD");
    }

    if (mode === "tree" || mode === "blob") {
      const readmePath = [...rest, "README.md"].join("/");
      return buildRawGithubUrl(branch, readmePath);
    }

    return buildRawGithubUrl("HEAD");
  } catch {
    return null;
  }
}

export function getCatalogSetupOptions(
  appDefinition: AppStoreAppDefinition,
): AppStoreSetupOption[] {
  const standardConfigurations = appDefinition.standardConfigurations.map(
    (configuration) => ({
      id: configuration.id,
      title: configuration.title,
      description: configuration.description,
      default: configuration.default,
      config: configuration.config,
      appBaseUrl: configuration.appBaseUrl,
      environments: configuration.environments ?? {},
    }),
  );

  return [
    ...standardConfigurations,
    {
      id: "raw-setup",
      title: "Raw setup",
      description:
        "Start from the app's raw plug_config template and fine-tune it manually.",
      config: appDefinition.rawSetup.config,
      appBaseUrl: appDefinition.rawSetup.appBaseUrl,
      environments: appDefinition.rawSetup.environments ?? {},
    },
  ];
}

export function buildCatalogPlugConfig(
  appDefinition: AppStoreAppDefinition,
  setupId: string,
  appBaseUrl: string | undefined,
  environmentValues: Record<string, string>,
  customEnvironmentValues: Record<string, string>,
): PlugConfig {
  const selectedConfiguration = appDefinition.standardConfigurations.find(
    (configuration) => configuration.id === setupId,
  );
  const selectedSetup = selectedConfiguration ?? appDefinition.rawSetup;
  const nextPlugConfig: PlugConfig = {
    slug: appDefinition.baseConfig.plug,
    meta: {
      url: appDefinition.baseConfig.url,
      name: appDefinition.baseConfig.name,
      plug: appDefinition.baseConfig.plug,
      config: deepClone(selectedSetup.config ?? {}),
    },
  };

  applyEnvironmentGroupValues(
    nextPlugConfig as unknown as Record<string, unknown>,
    selectedSetup.environments ?? {},
    environmentValues,
    customEnvironmentValues,
  );

  if (appBaseUrl) {
    nextPlugConfig.meta.url = buildRemoteEntryUrl(appBaseUrl);
  }

  return nextPlugConfig;
}

export function buildHealthCheckRequest(
  appDefinition: AppStoreAppDefinition,
  appBaseUrl: string | undefined,
  environmentValues: Record<string, string>,
  customEnvironmentValues: Record<string, string>,
) {
  if (!appDefinition.healthCheck?.url) {
    return null;
  }

  const setupContext = {
    ...environmentValues,
    ...prefixCustomEnvironmentValues(customEnvironmentValues),
    apiUrl: careConfig.apiUrl,
    appBaseUrl: appBaseUrl ?? "",
    remoteEntryUrl: appBaseUrl
      ? buildRemoteEntryUrl(appBaseUrl)
      : appDefinition.baseConfig.url,
    "baseConfig.url": appDefinition.baseConfig.url,
    "baseConfig.name": appDefinition.baseConfig.name,
    "baseConfig.plug": appDefinition.baseConfig.plug,
  };

  return {
    url: interpolateTemplate(appDefinition.healthCheck.url, setupContext),
    method: appDefinition.healthCheck.method ?? "GET",
    successStatus: appDefinition.healthCheck.successStatus ?? 200,
  };
}

export function getGroupedEnvironmentFields(
  environments: AppStoreEnvironmentGroups,
) {
  return {
    mandatory: environments.mandatory ?? [],
    defaults: environments.defaults ?? [],
    optional: environments.optional ?? [],
    custom: environments.custom,
  };
}

function applyEnvironmentGroupValues(
  target: Record<string, unknown>,
  environments: AppStoreEnvironmentGroups,
  environmentValues: Record<string, string>,
  customEnvironmentValues: Record<string, string>,
) {
  const environmentFields = [
    ...(environments.mandatory ?? []),
    ...(environments.defaults ?? []),
    ...(environments.optional ?? []),
  ];

  for (const field of environmentFields) {
    const value = environmentValues[field.key] ?? field.defaultValue;

    if (value === undefined || value === "") {
      continue;
    }

    setDeepValue(target, field.path ?? `meta.config.${field.key}`, value);
  }

  if (!environments.custom?.enabled) {
    return;
  }

  const customPath = environments.custom.path ?? "meta.config";
  for (const [key, value] of Object.entries(customEnvironmentValues)) {
    if (!key || value === "") {
      continue;
    }

    setDeepValue(target, `${customPath}.${key}`, value);
  }
}

function setDeepValue(
  target: Record<string, unknown>,
  pathExpression: string,
  value: string,
) {
  const path = pathExpression.split(".").filter(Boolean);
  if (path.length === 0) {
    return;
  }

  let current: Record<string, unknown> = target;

  for (const segment of path.slice(0, -1)) {
    const next = current[segment];

    if (typeof next !== "object" || next === null || Array.isArray(next)) {
      current[segment] = {};
    }

    current = current[segment] as Record<string, unknown>;
  }

  current[path[path.length - 1]] = value;
}

function interpolateTemplate(template: string, values: Record<string, string>) {
  return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, key: string) => {
    return values[key] ?? "";
  });
}

function prefixCustomEnvironmentValues(values: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [`custom.${key}`, value]),
  );
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function buildRemoteEntryUrl(appBaseUrl: string) {
  return `${appBaseUrl}/assets/remoteEntry.js`;
}
