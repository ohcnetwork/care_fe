import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";

import FacilityOrganizationSelector from "@/pages/Facility/settings/organizations/components/FacilityOrganizationSelector";

import valueSetApi from "@/types/valueSet/valueSetApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";

interface ValueSetOrganizationsFieldProps {
  facilityId: string;
  valuesetId: string;
  canWrite: boolean;
}

const valueSetOrganizationsKey = (valuesetId: string) =>
  ["valueset", valuesetId, "facility-organizations"] as const;

/**
 * Departments that can see and use a facility value set. A facility set
 * with no departments is visible to superusers only (the backend gates
 * reads on organization membership), so this is the first thing to fill in
 * after creating one.
 *
 * The organizations endpoints 403 for anything but a facility-context set;
 * a user's own set listed under the same facility therefore renders
 * nothing here rather than an error.
 */
export function ValueSetOrganizationsField({
  facilityId,
  valuesetId,
  canWrite,
}: ValueSetOrganizationsFieldProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: current, isError } = useQuery({
    queryKey: valueSetOrganizationsKey(valuesetId),
    queryFn: query(valueSetApi.getFacilityOrganizations, {
      pathParams: { id: valuesetId },
      silent: true,
    }),
  });

  const { mutate: setFacilityOrganizations } = useMutation({
    mutationFn: mutate(valueSetApi.setFacilityOrganizations, {
      pathParams: { id: valuesetId },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: valueSetOrganizationsKey(valuesetId),
      });
      toast.success(t("organizations_updated"));
    },
  });

  if (isError) {
    return null;
  }

  const currentIds = current?.results.map((org) => org.id) ?? [];

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-800">
        {t("departments_with_access")}
      </p>
      <p className="text-sm text-gray-500">
        {t("departments_with_access_hint")}
      </p>
      {canWrite ? (
        <FacilityOrganizationSelector
          facilityId={facilityId}
          value={currentIds}
          currentOrganizations={current?.results}
          optional
          onChange={(ids) =>
            setFacilityOrganizations({ facility_organizations: ids ?? [] })
          }
        />
      ) : (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-gray-200 p-1.5">
          {currentIds.length === 0 && (
            <p className="px-1.5 py-1 text-sm text-gray-500">
              {t("no_departments_assigned")}
            </p>
          )}
          {current?.results.map((org) => (
            <Badge key={org.id} variant="secondary">
              {org.name}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
