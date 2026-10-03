import { useCareApps } from "@/hooks/useCareApps";

import type { PluginEncounterWidgetComponent } from "@/pluginTypes";
import { PLUGIN_ENCOUNTER_WIDGET_TYPE_PATTERN } from "@/types/workspace/encounterWorkspace";

export interface CareAppEncounterWidget {
  component: PluginEncounterWidgetComponent;
  pluginSlug: string;
}

/** Derive widgets from loaded manifests so app removal needs no registry cleanup. */
export function useCareAppEncounterWidgets() {
  const careApps = useCareApps();
  const widgets = new Map<string, CareAppEncounterWidget>();
  const loadingPlugins = new Set<string>();

  for (const app of careApps) {
    if (app.isLoading) {
      loadingPlugins.add(app.slug);
      continue;
    }

    for (const [localName, component] of Object.entries(
      app.encounterWidgets ?? {},
    )) {
      // The loader's slug owns the namespace; a manifest supplies only local names.
      const type = `${app.slug}.${localName}`;
      if (!PLUGIN_ENCOUNTER_WIDGET_TYPE_PATTERN.test(type)) continue;
      widgets.set(type, { component, pluginSlug: app.slug });
    }
  }

  return { widgets, loadingPlugins };
}
