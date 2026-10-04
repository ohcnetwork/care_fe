import {
  Activity,
  ClipboardList,
  HeartPulse,
  LayoutDashboard,
  PanelsTopLeft,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import { navigate } from "raviger";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import ErrorBoundary from "@/components/Common/ErrorBoundary";

import EncounterNavigation, {
  EncounterTab,
} from "@/pages/Encounters/EncounterNavigation";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";

import { EncounterWorkspacePage } from "./EncounterWorkspacePage";
import { parseEncounterWorkspace } from "./parseEncounterWorkspace";
import { useEncounterWorkspaces } from "./useEncounterWorkspaces";

const customPageIcons: Record<string, LucideIcon> = {
  stethoscope: Stethoscope,
  "clipboard-list": ClipboardList,
  "layout-dashboard": LayoutDashboard,
  "panels-top-left": PanelsTopLeft,
  activity: Activity,
  "heart-pulse": HeartPulse,
};

interface EncounterWorkspaceContentProps {
  systemTabs: Record<string, EncounterTab>;
  currentTab: string;
}

export function EncounterWorkspaceContent({
  systemTabs,
  currentTab,
}: EncounterWorkspaceContentProps) {
  const { t } = useTranslation();
  const initializedEncounter = useRef<string | undefined>(undefined);
  const { selectedEncounter, isSelectedEncounterLoading } = useEncounter();
  const { defaults, list, workspace } = useEncounterWorkspaces(
    selectedEncounter?.encounter_class,
  );
  const parsed = workspace
    ? parseEncounterWorkspace(workspace.template, Object.keys(systemTabs))
    : undefined;
  const tabs: Record<string, EncounterTab> = {};

  if (parsed) {
    for (const page of parsed.pages) {
      if (page.kind === "system") {
        const systemTab = systemTabs[page.key];
        if (systemTab)
          tabs[page.key] = {
            ...systemTab,
            visible: !page.hidden && systemTab.visible !== false,
          };
      } else if (page.kind === "custom") {
        tabs[page.key] = {
          label: page.title,
          visible: !page.hidden,
          icon:
            page.icon && Object.hasOwn(customPageIcons, page.icon)
              ? customPageIcons[page.icon]
              : LayoutDashboard,
          component: <EncounterWorkspacePage page={page} />,
        };
      } else {
        tabs[page.key] = {
          label: page.title,
          icon: LayoutDashboard,
          visible: !page.hidden,
          component: (
            <Alert>
              <AlertDescription>
                {t("encounter_workspace_page_unavailable")}
              </AlertDescription>
            </Alert>
          ),
        };
      }
    }
  } else {
    Object.assign(tabs, systemTabs);
  }

  if (workspace) {
    const resetKey = `${workspace.id}:${selectedEncounter?.id}:${JSON.stringify(workspace.template)}`;
    for (const [key, tab] of Object.entries(tabs)) {
      tab.component = (
        <ErrorBoundary
          key={`${key}:${resetKey}`}
          fallback={
            <Alert variant="destructive">
              <AlertDescription>
                {t("encounter_workspace_page_error")}
              </AlertDescription>
            </Alert>
          }
        >
          {tab.component}
        </ErrorBoundary>
      );
    }
  }

  const firstVisibleTab = Object.keys(tabs).find(
    (key) => tabs[key].visible !== false,
  );
  const activeTab =
    tabs[currentTab]?.visible !== false && Object.hasOwn(tabs, currentTab)
      ? currentTab
      : (firstVisibleTab ?? "updates");
  const isLoadingSelection =
    defaults.isLoading || list.isLoading || isSelectedEncounterLoading;

  const navigateToTab = (tab: string, replace = false) => {
    const target = new URL(tab, window.location.href);
    if (tab === currentTab) {
      target.search = window.location.search;
    } else {
      const selectedEncounterParam = new URLSearchParams(
        window.location.search,
      ).get("selectedEncounter");
      target.search = selectedEncounterParam
        ? new URLSearchParams({
            selectedEncounter: selectedEncounterParam,
          }).toString()
        : "";
    }
    target.searchParams.delete("workspace");
    if (target.href !== window.location.href)
      navigate(`${target.pathname}${target.search}`, { replace });
  };

  useEffect(() => {
    if (isLoadingSelection) return;
    if (!defaults.isError && !list.isError) {
      const firstVisit = initializedEncounter.current !== selectedEncounter?.id;
      if (firstVisit && (defaults.isFetching || list.isFetching)) return;
      initializedEncounter.current = selectedEncounter?.id;
      // Encounter entry links use /updates. Apply the saved layout on entry,
      // while allowing an explicit Overview tab selection during the visit.
      if (firstVisit && currentTab === "updates" && parsed && firstVisibleTab) {
        navigateToTab(firstVisibleTab, true);
        return;
      }
      if (firstVisibleTab && activeTab !== currentTab) {
        navigateToTab(activeTab, true);
        return;
      }
    }
    if (new URLSearchParams(window.location.search).has("workspace"))
      navigateToTab(currentTab, true);
  });

  return (
    <div className="space-y-3">
      {(defaults.isError || list.isError) && (
        <Alert>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
            <span>{t("encounter_workspace_load_error")}</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                defaults.refetch();
                list.refetch();
              }}
            >
              {t("try_again")}
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {parsed && (parsed.invalid || parsed.unsupportedVersion) && (
        <Alert>
          <AlertDescription>
            {t(
              parsed.unsupportedVersion
                ? "encounter_workspace_schema_unsupported"
                : "encounter_workspace_invalid",
            )}
          </AlertDescription>
        </Alert>
      )}
      {isLoadingSelection ? (
        <Skeleton className="h-64 w-full" />
      ) : firstVisibleTab ? (
        <EncounterNavigation
          tabs={tabs}
          currentTab={activeTab}
          onTabChange={(tab) => navigateToTab(tab)}
        />
      ) : (
        <Alert>
          <AlertDescription>
            {t("encounter_workspace_no_pages")}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
