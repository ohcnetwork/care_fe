import {
  QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import useAuthUser from "@/hooks/useAuthUser";

import FacilityOrganizationSelector from "@/pages/Facility/settings/organizations/components/FacilityOrganizationSelector";
import { FacilityOrganizationRead } from "@/types/facilityOrganization/facilityOrganization";
import {
  WorkspaceOrganizationRead,
  WorkspaceScope,
} from "@/types/workspace/workspace";
import workspaceApi from "@/types/workspace/workspaceApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { HTTPError, PaginatedResponse } from "@/Utils/request/types";

import { WorkspaceInstanceOrganizationSelector } from "./WorkspaceInstanceOrganizationSelector";

interface AccessState {
  dirty: boolean;
  pending: boolean;
}

interface WorkspaceOrganizationsFieldProps {
  scope: WorkspaceScope;
  workspaceId: string;
  disabled: boolean;
  onStateChange: (state: AccessState) => void;
}

interface OrganizationSelectionProps<TOrganization> {
  ids: string[];
  organizations: TOrganization[];
  disabled: boolean;
  onChange: (ids: string[], organizations: TOrganization[]) => void;
}

interface WorkspaceAccessFieldProps<TOrganization> {
  queryKey: QueryKey;
  loadOrganizations: (context: {
    signal: AbortSignal;
  }) => Promise<PaginatedResponse<TOrganization>>;
  saveOrganizations: (ids: string[]) => Promise<unknown>;
  renderSelector: (
    props: OrganizationSelectionProps<TOrganization>,
  ) => ReactNode;
  title: string;
  hint: string;
  emptyHint: string;
  disabled: boolean;
  onStateChange: (state: AccessState) => void;
}

export function WorkspaceOrganizationsField({
  scope,
  workspaceId,
  disabled,
  onStateChange,
}: WorkspaceOrganizationsFieldProps) {
  const { t } = useTranslation();
  const user = useAuthUser();
  const queryKey = [
    "workspace-organizations",
    user.id,
    scope.authContext === "facility" ? scope.facilityId : "instance",
    workspaceId,
  ];
  const requestOptions = {
    pathParams: { id: workspaceId },
    silent: (response: Response) => response.status === 403,
  };

  if (scope.authContext === "facility") {
    return (
      <WorkspaceAccessField<FacilityOrganizationRead>
        key={workspaceId}
        queryKey={queryKey}
        loadOrganizations={query(
          workspaceApi.getFacilityOrganizations,
          requestOptions,
        )}
        saveOrganizations={(ids) =>
          mutate(workspaceApi.setFacilityOrganizations, {
            pathParams: { id: workspaceId },
          })({ facility_organizations: ids })
        }
        title={t("departments_with_access")}
        hint={t("workspace_departments_hint")}
        emptyHint={t("workspace_no_departments")}
        disabled={disabled}
        onStateChange={onStateChange}
        renderSelector={({ ids, organizations, onChange }) => (
          <FacilityOrganizationSelector
            facilityId={scope.facilityId}
            value={ids}
            currentOrganizations={organizations}
            optional
            onChange={(nextIds, nextOrganizations) =>
              onChange(nextIds ?? [], nextOrganizations ?? organizations)
            }
          />
        )}
      />
    );
  }

  return (
    <WorkspaceAccessField<WorkspaceOrganizationRead>
      key={workspaceId}
      queryKey={queryKey}
      loadOrganizations={query(workspaceApi.getOrganizations, requestOptions)}
      saveOrganizations={(ids) =>
        mutate(workspaceApi.setOrganizations, {
          pathParams: { id: workspaceId },
        })({ organizations: ids })
      }
      title={t("workspace_organizations_with_access")}
      hint={t("workspace_organizations_hint")}
      emptyHint={t("workspace_no_organizations")}
      disabled={disabled}
      onStateChange={onStateChange}
      renderSelector={({ ids, organizations, disabled, onChange }) => (
        <WorkspaceInstanceOrganizationSelector
          value={ids}
          organizations={organizations}
          disabled={disabled}
          onChange={onChange}
        />
      )}
    />
  );
}

function WorkspaceAccessField<TOrganization extends { id: string }>(
  props: WorkspaceAccessFieldProps<TOrganization>,
) {
  const { t } = useTranslation();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: props.queryKey,
    queryFn: props.loadOrganizations,
    retry: false,
  });

  if (error instanceof HTTPError && error.status === 403) return null;

  return (
    <section
      className="space-y-4 border-t border-gray-100 pt-5"
      aria-labelledby="workspace-access-heading"
    >
      <div>
        <h3 id="workspace-access-heading" className="text-sm font-semibold">
          {props.title}
        </h3>
        <p className="mt-1 text-sm text-gray-600">{props.hint}</p>
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

function WorkspaceOrganizationsForm<TOrganization extends { id: string }>({
  queryKey,
  saveOrganizations,
  renderSelector,
  emptyHint,
  disabled,
  onStateChange,
  initialOrganizations,
}: WorkspaceAccessFieldProps<TOrganization> & {
  initialOrganizations: TOrganization[];
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selection, setSelection] = useState<{
    ids: string[];
    organizations: TOrganization[];
  } | null>(null);
  const savedIds = initialOrganizations.map((org) => org.id);
  const ids = selection?.ids ?? savedIds;
  const organizations = selection?.organizations ?? initialOrganizations;
  const dirty = selection !== null;
  const save = useMutation({
    mutationFn: saveOrganizations,
    onSuccess: async (_, ids) => {
      await queryClient.cancelQueries({ queryKey });
      queryClient.setQueryData(queryKey, {
        count: ids.length,
        results: organizations.filter((org) => ids.includes(org.id)),
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
        {renderSelector({
          ids,
          organizations,
          disabled: disabled || save.isPending,
          onChange: (nextIds, nextOrganizations) => {
            // Picker content may be portaled outside the disabled fieldset.
            if (disabled || save.isPending) return;
            setSelection(
              nextIds.length === savedIds.length &&
                nextIds.every((id) => savedIds.includes(id))
                ? null
                : { ids: nextIds, organizations: nextOrganizations },
            );
          },
        })}
      </fieldset>
      {!ids.length && <p className="text-sm text-gray-500">{emptyHint}</p>}
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
          onClick={() => save.mutate(ids)}
        >
          {save.isPending && <Loader2 className="size-4 animate-spin" />}
          {t("workspace_save_access")}
        </Button>
      </div>
    </div>
  );
}
