import { useCareApps } from "@/hooks/useCareApps";

import type { JSONSchema2020 } from "@/Utils/schema/types";
import type {
  PluginEncounterWidgetComponent,
  PluginEncounterWidgetDefinition,
  PluginPatientWidgetComponent,
} from "@/pluginTypes";
import { PLUGIN_ENCOUNTER_WIDGET_TYPE_PATTERN } from "@/types/workspace/encounterWorkspace";

export type CareAppEncounterWidget = {
  pluginSlug: string;
  configSchema?: JSONSchema2020;
} & (
  | {
      component: PluginEncounterWidgetComponent;
      supportsPatientHistory?: false;
      requiresActiveEncounter?: boolean;
    }
  | {
      component: PluginPatientWidgetComponent;
      supportsPatientHistory: true;
      requiresActiveEncounter?: undefined;
    }
);

function toWidget(
  pluginSlug: string,
  definition: PluginEncounterWidgetDefinition | PluginEncounterWidgetComponent,
): CareAppEncounterWidget {
  if (!isWidgetDefinition(definition)) {
    return { pluginSlug, component: definition };
  }
  // Manifests are untyped at runtime; only an explicit `true` opts in.
  if (definition.supportsPatientHistory === true) {
    return {
      pluginSlug,
      component: definition.component,
      configSchema: definition.configSchema,
      supportsPatientHistory: true,
    };
  }
  return {
    pluginSlug,
    component: definition.component,
    configSchema: definition.configSchema,
    requiresActiveEncounter: definition.requiresActiveEncounter,
  };
}

function isWidgetDefinition(
  widget: PluginEncounterWidgetDefinition | PluginEncounterWidgetComponent,
): widget is PluginEncounterWidgetDefinition {
  return (
    typeof widget === "object" &&
    widget !== null &&
    Object.hasOwn(widget, "component")
  );
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

    for (const [localName, definition] of Object.entries(
      app.encounterWidgets ?? {},
    )) {
      // The loader's slug owns the namespace; a manifest supplies only local names.
      const type = `${app.slug}.${localName}`;
      if (!PLUGIN_ENCOUNTER_WIDGET_TYPE_PATTERN.test(type)) continue;
      widgets.set(type, toWidget(app.slug, definition));
    }
  }

  return { widgets, loadingPlugins };
}
