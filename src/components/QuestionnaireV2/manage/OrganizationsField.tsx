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
}

export function OrganizationsField({
  scope,
  questionnaireId,
}: OrganizationsFieldProps) {
  if (scope.authContext === "instance") {
    return <InstanceOrganizationsField questionnaireId={questionnaireId} />;
  }
  return (
    <FacilityOrganizationsField
      facilityId={scope.facilityId!}
      questionnaireId={questionnaireId}
    />
  );
}

function InstanceOrganizationsField({
  questionnaireId,
}: {
  questionnaireId: string;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<Organization[]>([]);

  const { data: current, isLoading } = useQuery({
    queryKey: ["questionnairesV2", "organizations", questionnaireId],
    queryFn: query(questionnaireApi.getOrganizations, {
      pathParams: { id: questionnaireId },
    }),
  });

  const { data: available, isLoading: isSearching } = useQuery({
    queryKey: ["organizations", "role", searchQuery],
    queryFn: query.debounced(organizationApi.list, {
      queryParams: { org_type: "role", name: searchQuery || undefined },
    }),
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
  });

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
    <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-900">
        {t("organizations")}
      </h3>

      <div className="flex flex-wrap gap-2 rounded-md border border-dashed border-gray-200 p-3">
        {!isLoading && selected.length === 0 && (
          <p className="text-sm text-gray-500">
            {t("no_organizations_selected")}
          </p>
        )}
        {selected.map((org) => (
          <Badge key={org.id} variant="secondary" className="gap-1">
            {org.name}
            <button
              type="button"
              onClick={() => handleToggle(org.id)}
              aria-label={t("remove_organization")}
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
      </div>

      <OrgSelector
        selected={selected.map((org) => org.id)}
        onToggle={handleToggle}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isLoading={isSearching}
        organizations={available}
      />
    </div>
  );
}

function FacilityOrganizationsField({
  facilityId,
  questionnaireId,
}: {
  facilityId: string;
  questionnaireId: string;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: current } = useQuery({
    queryKey: ["questionnairesV2", "organizations", questionnaireId],
    queryFn: query(questionnaireApi.getFacilityOrganizations, {
      pathParams: { id: questionnaireId },
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

  const currentIds = current?.results.map((org) => org.id) ?? [];

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-900">
        {t("organizations")}
      </h3>
      <FacilityOrganizationSelector
        facilityId={facilityId}
        value={currentIds}
        currentOrganizations={current?.results}
        optional
        onChange={(ids) =>
          setFacilityOrganizations({ facility_organizations: ids ?? [] })
        }
      />
    </div>
  );
}
