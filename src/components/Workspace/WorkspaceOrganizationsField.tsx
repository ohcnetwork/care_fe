import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import useAuthUser from "@/hooks/useAuthUser";

import FacilityOrganizationSelector from "@/pages/Facility/settings/organizations/components/FacilityOrganizationSelector";
import { FacilityOrganizationRead } from "@/types/facilityOrganization/facilityOrganization";
import {
  WorkspaceFacilityOrganizationsUpdate,
  WorkspaceScope,
} from "@/types/workspace/workspace";
import workspaceApi from "@/types/workspace/workspaceApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { HTTPError } from "@/Utils/request/types";

interface AccessState {
  dirty: boolean;
  pending: boolean;
}

interface WorkspaceOrganizationsFieldProps {
  scope: Extract<WorkspaceScope, { authContext: "facility" }>;
  workspaceId: string;
  disabled: boolean;
  onStateChange: (state: AccessState) => void;
}

export function WorkspaceOrganizationsField(
  props: WorkspaceOrganizationsFieldProps,
) {
  const { t } = useTranslation();
  const user = useAuthUser();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      "workspace-organizations",
      user.id,
      props.scope.facilityId,
      props.workspaceId,
    ],
    queryFn: query(workspaceApi.getFacilityOrganizations, {
      pathParams: { id: props.workspaceId },
      silent: (response) => response.status === 403,
    }),
    retry: false,
  });

  if (error instanceof HTTPError && error.status === 403) return null;

  return (
    <section
      className="space-y-4 rounded-lg border bg-white p-4 sm:p-5"
      aria-labelledby="workspace-access-heading"
    >
      <div>
        <h2 id="workspace-access-heading" className="text-base font-semibold">
          {t("departments_with_access")}
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          {t("workspace_departments_hint")}
        </p>
      </div>
      {isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : (
        <>
          {(error || !data) && (
            <Alert variant="destructive">
              <AlertDescription className="space-y-3">
                <p>{t("workspace_access_load_error")}</p>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => refetch()}
                >
                  {t("try_again")}
                </Button>
              </AlertDescription>
            </Alert>
          )}
          {data && (
            <WorkspaceOrganizationsForm
              {...props}
              initialOrganizations={data.results}
            />
          )}
        </>
      )}
    </section>
  );
}

function WorkspaceOrganizationsForm({
  scope,
  workspaceId,
  disabled,
  onStateChange,
  initialOrganizations,
}: WorkspaceOrganizationsFieldProps & {
  initialOrganizations: FacilityOrganizationRead[];
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const user = useAuthUser();
  const [selection, setSelection] = useState<{
    ids: string[];
    organizations: FacilityOrganizationRead[];
  } | null>(null);
  const savedIds = initialOrganizations.map((org) => org.id);
  const ids = selection?.ids ?? savedIds;
  const organizations = selection?.organizations ?? initialOrganizations;
  const dirty = selection !== null;
  const save = useMutation({
    mutationFn: mutate(workspaceApi.setFacilityOrganizations, {
      pathParams: { id: workspaceId },
    }),
    onSuccess: async (_, variables: WorkspaceFacilityOrganizationsUpdate) => {
      const queryKey = [
        "workspace-organizations",
        user.id,
        scope.facilityId,
        workspaceId,
      ];
      await queryClient.cancelQueries({ queryKey });
      queryClient.setQueryData(queryKey, {
        count: variables.facility_organizations.length,
        results: organizations.filter((org) =>
          variables.facility_organizations.includes(org.id),
        ),
      });
      setSelection(null);
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      toast.success(t("workspace_access_saved"));
    },
  });

  useEffect(() => {
    onStateChange({ dirty, pending: save.isPending });
  }, [dirty, save.isPending, onStateChange]);

  useEffect(
    () => () => onStateChange({ dirty: false, pending: false }),
    [onStateChange],
  );

  return (
    <div className="space-y-4">
      <fieldset
        disabled={disabled || save.isPending}
        aria-busy={save.isPending}
      >
        <FacilityOrganizationSelector
          facilityId={scope.facilityId}
          value={ids}
          currentOrganizations={organizations}
          optional
          onChange={(nextIds, nextOrganizations) => {
            // Picker content may be portaled outside the disabled fieldset.
            if (disabled || save.isPending) return;
            const ids = nextIds ?? [];
            setSelection(
              ids.length === savedIds.length &&
                ids.every((id) => savedIds.includes(id))
                ? null
                : { ids, organizations: nextOrganizations ?? organizations },
            );
          }}
        />
      </fieldset>
      {!ids.length && (
        <p className="text-sm text-gray-500">{t("workspace_no_departments")}</p>
      )}
      {save.isError && (
        <Alert variant="destructive">
          <AlertDescription>
            {t("workspace_access_save_error")}
          </AlertDescription>
        </Alert>
      )}
      <div className="flex flex-wrap items-center justify-end gap-3">
        <p className="mr-auto text-sm text-gray-500">
          {t("workspace_access_saved_separately")}
        </p>
        <Button
          type="button"
          variant="outline"
          disabled={disabled || save.isPending || !dirty}
          onClick={() => save.mutate({ facility_organizations: ids })}
        >
          {save.isPending && <Loader2 className="size-4 animate-spin" />}
          {t("workspace_save_access")}
        </Button>
      </div>
    </div>
  );
}
