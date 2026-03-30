import { PlugConfig } from "@/types/plugConfig";
import careConfig from "@careConfig";

export type PlugConfigSource = "api" | "build";

export interface ResolvedPlugConfig extends PlugConfig {
  source: PlugConfigSource;
  isReadOnly: boolean;
}

export const getBuildTimePlugConfigs = (): ResolvedPlugConfig[] => {
  return careConfig.careApps.map((plugin) => ({
    slug: plugin.name,
    meta: { ...plugin },
    source: "build",
    isReadOnly: true,
  }));
};

export const mergePlugConfigs = (
  apiConfigs: PlugConfig[] = [],
): ResolvedPlugConfig[] => {
  const configs = new Map<string, ResolvedPlugConfig>();

  for (const config of apiConfigs) {
    configs.set(config.slug, {
      ...config,
      source: "api",
      isReadOnly: false,
    });
  }

  for (const config of getBuildTimePlugConfigs()) {
    const existing = configs.get(config.slug);

    configs.set(config.slug, {
      slug: config.slug,
      meta: {
        ...(existing?.meta ?? {}),
        ...config.meta,
      },
      source: "build",
      isReadOnly: true,
    });
  }

  return Array.from(configs.values()).sort((left, right) => {
    if (left.source !== right.source) {
      return left.source === "build" ? -1 : 1;
    }

    return left.slug.localeCompare(right.slug);
  });
};
