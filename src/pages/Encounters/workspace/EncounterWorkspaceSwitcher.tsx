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
import { parseEncounterClasses } from "./workspacePreferences";

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
      encounterClass,
    }: {
      choice: WorkspaceRead;
      encounterClass: EncounterClass;
      encounterId: string;
    }) => {
      const savedDefaults = await callApi(
        workspaceApi.getUserDefaultAttributes,
        {
          silent: true,
        },
      );
      const classesByWorkspace = new Map<string, Set<string>>();
      for (const rule of savedDefaults.results) {
        if (rule.attribute !== "encounter_class") continue;
        const classes =
          classesByWorkspace.get(rule.workspace.id) ?? new Set<string>();
        for (const value of parseEncounterClasses(rule.value))
          classes.add(value);
        classesByWorkspace.set(rule.workspace.id, classes);
      }

      const accessibleIds = new Set((list.data ?? []).map(({ id }) => id));
      const updates: { id: string; value: string }[] = [];
      // The original API cannot delete a preference. Remove only this class;
      // an empty string makes the old rule inactive without changing the backend.
      for (const [id, classes] of classesByWorkspace) {
        if (
          id === choice.id ||
          !accessibleIds.has(id) ||
          !classes.has(encounterClass)
        )
          continue;
        classes.delete(encounterClass);
        updates.push({ id, value: [...classes].join(",") });
      }
      const selectedClasses =
        classesByWorkspace.get(choice.id) ?? new Set<string>();
      selectedClasses.add(encounterClass);
      updates.push({ id: choice.id, value: [...selectedClasses].join(",") });
      // Validate every value before making any changes to existing defaults.
      if (updates.some(({ value }) => value.length > 255))
        throw new Error(
          "Workspace encounter class preferences exceed 255 characters",
        );
      for (const { id, value } of updates) {
        await callApi(workspaceApi.setDefaultAttributes, {
          pathParams: { id },
          body: { attribute: "encounter_class", value },
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
      const parsed = parseEncounterWorkspace(
        choice.template,
        Object.keys(systemTabs),
      );
      const firstPage = parsed.pages.find(
        (page) =>
          page.kind === "custom" ||
          (!page.hidden &&
            (page.kind === "invalid" ||
              systemTabs[page.key]?.visible !== false)),
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
      navigate(`${target.pathname}${target.search}`);
    },
  });

  return (
    <EncounterWorkspacePicker
      key={selectedEncounter?.id}
      workspaces={list.data ?? []}
      workspaceId={workspace?.id}
      encounterClass={selectedEncounter?.encounter_class}
      isLoading={
        defaults.isLoading || list.isLoading || isSelectedEncounterLoading
      }
      isError={defaults.isError || list.isError}
      onRetry={() => {
        defaults.refetch();
        list.refetch();
      }}
      onSelect={(choice) => {
        if (!selectedEncounter || isSelectedEncounterLoading || save.isPending)
          return;
        save.mutate({
          choice,
          encounterClass: selectedEncounter.encounter_class,
          encounterId: selectedEncounter.id,
        });
      }}
      isSaving={save.isPending}
      saveError={
        save.isError &&
        save.variables?.encounterId === selectedEncounter?.id &&
        save.variables?.encounterClass === selectedEncounter?.encounter_class
      }
    />
  );
}
