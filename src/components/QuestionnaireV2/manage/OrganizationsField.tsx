import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";

import { OrgSelector } from "@/components/Questionnaire/OrgSelector";
import { questionnaireKeys } from "@/components/QuestionnaireV2/queryKeys";

import FacilityOrganizationSelector from "@/pages/Facility/settings/organizations/components/FacilityOrganizationSelector";

import { FacilityOrganizationRead } from "@/types/facilityOrganization/facilityOrganization";
import { Organization } from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";
import { QuestionnaireScope } from "@/types/questionnaire/questionnaire";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";
import query from "@/Utils/request/query";

export interface OrganizationSelection {
  ids: string[];
  /** Labels survive a closed picker or a changed search term. */
  organizations: Organization[];
  facilityOrganizations?: FacilityOrganizationRead[];
}

interface OrganizationsFieldProps {
  scope: QuestionnaireScope;
  questionnaireId: string;
  /** When false, the organization list renders read-only (no toggles). */
  canWrite: boolean;
  draft: OrganizationSelection | null;
  onChange: (selection: OrganizationSelection | null) => void;
}

/**
 * Plain labeled field (not a separate card) — Organizations renders as the
 * access control within the questionnaire properties. Edits remain local
 * until the page saves the questionnaire.
 */
function OrganizationsFieldShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-800">{t("organizations")}</p>
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
    <OrganizationsFieldShell>
      <p className="text-sm text-gray-500">{t("organizations_unavailable")}</p>
    </OrganizationsFieldShell>
  );
}

export function OrganizationsField({
  scope,
  questionnaireId,
  canWrite,
  draft,
  onChange,
}: OrganizationsFieldProps) {
  if (scope.authContext === "instance") {
    return (
      <InstanceOrganizationsField
        questionnaireId={questionnaireId}
        canWrite={canWrite}
        draft={draft}
        onChange={onChange}
      />
    );
  }
  if (scope.authContext === "facility" && scope.facilityId) {
    return (
      <FacilityOrganizationsField
        facilityId={scope.facilityId}
        questionnaireId={questionnaireId}
        canWrite={canWrite}
        draft={draft}
        onChange={onChange}
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
  draft,
  onChange,
}: Omit<OrganizationsFieldProps, "scope">) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: current,
    isLoading,
    isError,
  } = useQuery({
    queryKey: questionnaireKeys.organizations(questionnaireId, "instance"),
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

  const selected = draft?.organizations ?? current?.results ?? [];

  if (isError) {
    return <OrganizationsUnavailableCard />;
  }

  const handleToggle = (orgId: string) => {
    const isSelected = selected.some((org) => org.id === orgId);
    let next: OrganizationSelection["organizations"];
    if (isSelected) {
      next = selected.filter((org) => org.id !== orgId);
    } else {
      const orgToAdd = [
        ...(current?.results ?? []),
        ...(available?.results ?? []),
      ].find((org) => org.id === orgId);
      next = orgToAdd ? [...selected, orgToAdd] : selected;
    }
    const ids = next.map((org) => org.id);
    const savedIds = new Set(current?.results.map((org) => org.id));
    onChange(
      ids.length === savedIds.size && ids.every((id) => savedIds.has(id))
        ? null
        : { ids, organizations: next },
    );
  };

  return (
    <OrganizationsFieldShell>
      {/* One control: the selected chips render inline inside the same
          bordered box as the search trigger, not in a separate dashed box. */}
      <div className="flex flex-wrap items-center gap-2 rounded-md border border-gray-200 p-1.5">
        {!isLoading && !canWrite && selected.length === 0 && (
          <p className="px-1.5 py-1 text-sm text-gray-500">
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
        {canWrite && !isLoading && (
          <OrgSelector
            selected={selected.map((org) => org.id)}
            onToggle={handleToggle}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            isLoading={isSearching}
            organizations={available}
            triggerClassName="h-8 w-auto min-w-40 flex-1 border-0 px-1.5 font-normal text-gray-500 shadow-none"
          />
        )}
      </div>
    </OrganizationsFieldShell>
  );
}

function FacilityOrganizationsField({
  facilityId,
  questionnaireId,
  canWrite,
  draft,
  onChange,
}: Omit<OrganizationsFieldProps, "scope"> & { facilityId: string }) {
  const { t } = useTranslation();

  const {
    data: current,
    isError,
    isLoading,
  } = useQuery({
    queryKey: questionnaireKeys.organizations(questionnaireId, "facility"),
    // silent for the same cross-scope reason as the instance variant.
    queryFn: query(questionnaireApi.getFacilityOrganizations, {
      pathParams: { id: questionnaireId },
      silent: true,
    }),
  });

  if (isError) {
    return <OrganizationsUnavailableCard />;
  }

  const currentIds = draft?.ids ?? current?.results.map((org) => org.id) ?? [];

  if (!canWrite) {
    return (
      <OrganizationsFieldShell>
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-gray-200 p-1.5">
          {currentIds.length === 0 && (
            <p className="px-1.5 py-1 text-sm text-gray-500">
              {t("no_organizations_selected")}
            </p>
          )}
          {current?.results.map((org) => (
            <Badge key={org.id} variant="secondary">
              {org.name}
            </Badge>
          ))}
        </div>
      </OrganizationsFieldShell>
    );
  }

  return (
    <OrganizationsFieldShell>
      {!isLoading && (
        <FacilityOrganizationSelector
          facilityId={facilityId}
          value={currentIds}
          currentOrganizations={
            draft?.facilityOrganizations ?? current?.results
          }
          optional
          onChange={(value, facilityOrganizations) => {
            const ids = value ?? [];
            const savedIds = new Set(current?.results.map((org) => org.id));
            onChange(
              ids.length === savedIds.size &&
                ids.every((id) => savedIds.has(id))
                ? null
                : { ids, organizations: [], facilityOrganizations },
            );
          }}
        />
      )}
    </OrganizationsFieldShell>
  );
}
