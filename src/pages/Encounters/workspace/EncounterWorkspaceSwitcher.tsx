import { appendReferralNativeContext } from "@/components/Referral/referralNativeNavigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useLayoutEffect, useRef } from "react";

import useAuthUser from "@/hooks/useAuthUser";

import { EncounterTab } from "@/pages/Encounters/EncounterNavigation";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { EncounterClass } from "@/types/emr/encounter/encounter";
import { WorkspaceRead } from "@/types/workspace/workspace";
import workspaceApi from "@/types/workspace/workspaceApi";
import { callApi } from "@/Utils/request/query";

import { EncounterWorkspacePicker } from "./EncounterWorkspacePicker";
import { parseEncounterWorkspace } from "./parseEncounterWorkspace";
import { useEncounterWorkspaces } from "./useEncounterWorkspaces";
import {
  LEGACY_ENCOUNTER_CLASS_ATTRIBUTE,
  WORKSPACE_SCOPE_ALL,
  WORKSPACE_SCOPE_ATTRIBUTE,
} from "./workspacePreferences";

export function EncounterWorkspaceSwitcher({
  systemTabs,
}: {
  systemTabs: Record<string, EncounterTab>;
}) {
  const user = useAuthUser();
  const queryClient = useQueryClient();
  const { selectedEncounter, isSelectedEncounterLoading } = useEncounter();
  const selectionKey = selectedEncounter
    ? `${selectedEncounter.id}:${selectedEncounter.encounter_class}`
    : undefined;
  const currentEncounter = useRef(selectionKey);
  useLayoutEffect(() => {
    currentEncounter.current = selectionKey;
    return () => {
      currentEncounter.current = undefined;
    };
  }, [selectionKey]);
  const { defaults, list, workspace } = useEncounterWorkspaces(
    selectedEncounter?.encounter_class,
  );
  const save = useMutation({
    mutationFn: async ({
      choice,
    }: {
      // null clears the saved choice so the standard screens apply.
      choice: WorkspaceRead | null;
      encounterClass: EncounterClass;
      encounterId: string;
    }) => {
      const savedDefaults = await callApi(
        workspaceApi.getUserDefaultAttributes,
        { silent: true },
      );
      const accessibleIds = new Set((list.data ?? []).map(({ id }) => id));
      // The API cannot delete a preference; an empty value makes a rule
      // inactive. Legacy per-class rules are retired so they cannot resurface.
      const cleared = new Map<string, string>();
      for (const { attribute, value, workspace } of savedDefaults.results) {
        if (!value || !accessibleIds.has(workspace.id)) continue;
        if (
          attribute === LEGACY_ENCOUNTER_CLASS_ATTRIBUTE ||
          (attribute === WORKSPACE_SCOPE_ATTRIBUTE &&
            workspace.id !== choice?.id)
        )
          cleared.set(`${workspace.id}:${attribute}`, workspace.id);
      }
      for (const [key, id] of cleared) {
        await callApi(workspaceApi.setDefaultAttributes, {
          pathParams: { id },
          body: { attribute: key.slice(id.length + 1), value: "" },
          silent: true,
        });
      }
      if (choice) {
        await callApi(workspaceApi.setDefaultAttributes, {
          pathParams: { id: choice.id },
          body: {
            attribute: WORKSPACE_SCOPE_ATTRIBUTE,
            value: WORKSPACE_SCOPE_ALL,
          },
          silent: true,
        });
      }
    },
    onSettled: async (_, error, { choice, encounterId, encounterClass }) => {
      await queryClient.invalidateQueries({
        queryKey: ["workspace-user-defaults", user.id],
      });
      if (
        error ||
        currentEncounter.current !== `${encounterId}:${encounterClass}`
      )
        return;
      const firstPage = (
        choice
          ? parseEncounterWorkspace(choice.template, Object.keys(systemTabs))
              .pages
          : []
      ).find(
        (page) =>
          !page.hidden &&
          (page.kind !== "system" || systemTabs[page.key]?.visible !== false),
      );
      const target = new URL(
        firstPage ? firstPage.key : "updates",
        window.location.href,
      );
      const selectedEncounterParam = new URLSearchParams(
        window.location.search,
      ).get("selectedEncounter");
      target.search = selectedEncounterParam
        ? new URLSearchParams({
            selectedEncounter: selectedEncounterParam,
          }).toString()
        : "";
      navigate(
        appendReferralNativeContext(
          `${target.pathname}${target.search}`,
          window.location.search,
        ),
      );
    },
  });

  const select = (choice: WorkspaceRead | null) => {
    if (!selectedEncounter || isSelectedEncounterLoading || save.isPending)
      return;
    save.mutate({
      choice,
      encounterClass: selectedEncounter.encounter_class,
      encounterId: selectedEncounter.id,
    });
  };

  return (
    <EncounterWorkspacePicker
      key={selectedEncounter?.id}
      workspaces={list.data ?? []}
      workspaceId={workspace?.id}
      isLoading={
        defaults.isLoading || list.isLoading || isSelectedEncounterLoading
      }
      isError={defaults.isError || list.isError}
      onRetry={() => {
        defaults.refetch();
        list.refetch();
      }}
      onSelect={select}
      onUseStandard={() => select(null)}
      isSaving={save.isPending}
      saveError={
        save.isError &&
        save.variables?.encounterId === selectedEncounter?.id &&
        save.variables?.encounterClass === selectedEncounter?.encounter_class
      }
    />
  );
}
