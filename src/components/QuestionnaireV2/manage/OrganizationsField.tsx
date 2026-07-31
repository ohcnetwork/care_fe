import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";

import { OrgSelector } from "@/components/Questionnaire/ManageQuestionnaireOrganizationsSheet";

import FacilityOrganizationSelector from "@/pages/Facility/settings/organizations/components/FacilityOrganizationSelector";

import { Organization } from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";
import { QuestionnaireScope } from "@/types/questionnaire/questionnaire";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";

interface OrganizationsFieldProps {
  scope: QuestionnaireScope;
  questionnaireId: string;
  /** When false, the organization list renders read-only (no toggles). */
  canWrite: boolean;
}

function OrganizationsCard({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-900">
        {t("organizations")}
      </h3>
      {children}
    </div>
  );
}

/**
 * Muted state for when the org endpoint rejects this questionnaire — e.g. a
 * facility-created questionnaire opened through the admin mount, where the
 * instance-level get_organizations endpoint 403s.
 */
function OrganizationsUnavailableCard() {
  const { t } = useTranslation();
  return (
    <OrganizationsCard>
      <p className="text-sm text-gray-500">{t("organizations_unavailable")}</p>
    </OrganizationsCard>
  );
}

export function OrganizationsField({
  scope,
  questionnaireId,
  canWrite,
}: OrganizationsFieldProps) {
  if (scope.authContext === "instance") {
    return (
      <InstanceOrganizationsField
        questionnaireId={questionnaireId}
        canWrite={canWrite}
      />
    );
  }
  if (scope.authContext === "facility" && scope.facilityId) {
    return (
      <FacilityOrganizationsField
        facilityId={scope.facilityId}
        questionnaireId={questionnaireId}
        canWrite={canWrite}
      />
    );
  }
  // facility_organization / user contexts: no organization-linking UI exists
  // for these scopes yet, and there is no facilityId to drive the facility
  // selector — render nothing rather than issuing queries with undefined ids.
  return null;
}

function InstanceOrganizationsField({
  questionnaireId,
  canWrite,
}: {
  questionnaireId: string;
  canWrite: boolean;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<Organization[]>([]);

  const {
    data: current,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["questionnairesV2", "organizations", questionnaireId],
    // silent: cross-scope questionnaires 403 here on page load (see
    // OrganizationsUnavailableCard) — surfaced inline, not as a toast.
    queryFn: query(questionnaireApi.getOrganizations, {
      pathParams: { id: questionnaireId },
      silent: true,
    }),
  });

  const { data: available, isLoading: isSearching } = useQuery({
    queryKey: ["organizations", "role", searchQuery],
    queryFn: query.debounced(organizationApi.list, {
      queryParams: { org_type: "role", name: searchQuery || undefined },
    }),
    enabled: canWrite && !isError,
  });

  useEffect(() => {
    if (current?.results) {
      setSelected(current.results);
    }
  }, [current?.results]);

  const { mutate: setOrganizations } = useMutation({
    mutationFn: mutate(questionnaireApi.setOrganizations, {
      pathParams: { id: questionnaireId },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["questionnairesV2", "organizations", questionnaireId],
      });
      toast.success(t("organizations_updated"));
    },
    onError: () => {
      // Roll back the optimistic chip update — the global mutation error
      // handler already toasts; without this the UI would keep reporting an
      // access change the backend rejected.
      setSelected(current?.results ?? []);
    },
  });

  if (isError) {
    return <OrganizationsUnavailableCard />;
  }

  const handleToggle = (orgId: string) => {
    const isSelected = selected.some((org) => org.id === orgId);
    let next: Organization[];
    if (isSelected) {
      next = selected.filter((org) => org.id !== orgId);
    } else {
      const orgToAdd = [
        ...(current?.results ?? []),
        ...(available?.results ?? []),
      ].find((org) => org.id === orgId);
      next = orgToAdd ? [...selected, orgToAdd] : selected;
    }
    setSelected(next);
    setOrganizations({ organizations: next.map((org) => org.id) });
  };

  return (
    <OrganizationsCard>
      <div className="flex flex-wrap gap-2 rounded-md border border-dashed border-gray-200 p-3">
        {!isLoading && selected.length === 0 && (
          <p className="text-sm text-gray-500">
            {t("no_organizations_selected")}
          </p>
        )}
        {selected.map((org) => (
          <Badge key={org.id} variant="secondary" className="gap-1">
            {org.name}
            {canWrite && (
              <button
                type="button"
                onClick={() => handleToggle(org.id)}
                aria-label={t("remove_organization")}
              >
                <X className="size-3" />
              </button>
            )}
          </Badge>
        ))}
      </div>

      {canWrite && (
        <OrgSelector
          selected={selected.map((org) => org.id)}
          onToggle={handleToggle}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isLoading={isSearching}
          organizations={available}
        />
      )}
    </OrganizationsCard>
  );
}

function FacilityOrganizationsField({
  facilityId,
  questionnaireId,
  canWrite,
}: {
  facilityId: string;
  questionnaireId: string;
  canWrite: boolean;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: current, isError } = useQuery({
    queryKey: ["questionnairesV2", "organizations", questionnaireId],
    // silent for the same cross-scope reason as the instance variant.
    queryFn: query(questionnaireApi.getFacilityOrganizations, {
      pathParams: { id: questionnaireId },
      silent: true,
    }),
  });

  const { mutate: setFacilityOrganizations } = useMutation({
    mutationFn: mutate(questionnaireApi.setFacilityOrganizations, {
      pathParams: { id: questionnaireId },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["questionnairesV2", "organizations", questionnaireId],
      });
      toast.success(t("organizations_updated"));
    },
  });

  if (isError) {
    return <OrganizationsUnavailableCard />;
  }

  const currentIds = current?.results.map((org) => org.id) ?? [];

  if (!canWrite) {
    return (
      <OrganizationsCard>
        <div className="flex flex-wrap gap-2 rounded-md border border-dashed border-gray-200 p-3">
          {currentIds.length === 0 && (
            <p className="text-sm text-gray-500">
              {t("no_organizations_selected")}
            </p>
          )}
          {current?.results.map((org) => (
            <Badge key={org.id} variant="secondary">
              {org.name}
            </Badge>
          ))}
        </div>
      </OrganizationsCard>
    );
  }

  return (
    <OrganizationsCard>
      <FacilityOrganizationSelector
        facilityId={facilityId}
        value={currentIds}
        currentOrganizations={current?.results}
        optional
        onChange={(ids) =>
          setFacilityOrganizations({ facility_organizations: ids ?? [] })
        }
      />
    </OrganizationsCard>
  );
}
