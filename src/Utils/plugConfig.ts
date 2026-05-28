import { PlugConfig } from "@/types/plugConfig";
import careConfig from "@careConfig";
import { localDevPluginConfigs } from "virtual:care-local-plugins";

export type PlugConfigSource = "api" | "build";

export interface ResolvedPlugConfig extends PlugConfig {
  source: PlugConfigSource;
  isReadOnly: boolean;
}

export const getBuildTimePlugConfigs = (): ResolvedPlugConfig[] => {
  const configs = new Map<string, ResolvedPlugConfig>();

  for (const plugin of careConfig.careApps) {
    configs.set(plugin.name, {
      slug: plugin.name,
      meta: { ...plugin },
      source: "build",
      isReadOnly: true,
    });
  }

  for (const plugin of localDevPluginConfigs) {
    configs.set(plugin.slug, {
      slug: plugin.slug,
      meta: { ...plugin.meta },
      source: "build",
      isReadOnly: true,
    });
  }

  return Array.from(configs.values()).sort((left, right) =>
    left.slug.localeCompare(right.slug),
  );
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
