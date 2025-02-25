import { useQueries, useQuery } from "@tanstack/react-query";
// import { Building } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

// import CareIcon from "@/CAREUI/icons/CareIcon";

import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import {
  FacilityOrganization,
  FacilityOrganizationResponse,
} from "@/types/facilityOrganization/facilityOrganization";

interface FacilityOrganizationSelectorProps {
  value?: string[];
  onChange: (value: string[]) => void;
  required?: boolean;
  facilityId: string;
}

export default function FacilityOrganizationSelector(
  props: FacilityOrganizationSelectorProps,
) {
  const { t } = useTranslation();
  const { onChange, required, facilityId } = props;
  const [selectedLevels, setSelectedLevels] = useState<FacilityOrganization[]>(
    [],
  );

  const { data: rootOrganizations } = useQuery<FacilityOrganizationResponse>({
    queryKey: ["organizations-root"],
    queryFn: query(routes.facilityOrganization.list, {
      pathParams: { facilityId },
      queryParams: { parent: "" },
    }),
  });

  const organizationQueries = useQueries({
    queries: selectedLevels.map((level) => ({
      queryKey: ["organizations", level.id],
      queryFn: query(routes.facilityOrganization.list, {
        pathParams: { facilityId },
        queryParams: { parent: level.id },
      }),
      enabled: !!level.id,
    })),
  });

  const handleLevelChange = (values: string[], level: number) => {
    let orgList: FacilityOrganization[] | undefined;

    if (level === 0) {
      orgList = rootOrganizations?.results;
    } else if (level - 1 < organizationQueries.length) {
      orgList = organizationQueries[level - 1].data?.results;
    }

    const selectedOrgs =
      orgList?.filter((org) => values.includes(org.id)) || [];
    if (!selectedOrgs.length) return;

    const newLevels = selectedLevels.slice(0, level);
    newLevels.push(...selectedOrgs);
    setSelectedLevels(newLevels);
    onChange(newLevels.map((org) => org.id));
  };

  const getOrganizationOptions = (orgs?: FacilityOrganization[]) => {
    if (!orgs) return [];
    return orgs.map((org) => ({
      label: org.name + (org.has_children ? " →" : ""),
      value: org.id,
    }));
  };
  console.log(selectedLevels);
  return (
    <>
      <Label className="mb-2 block">
        {t("select_department")}
        {required && <span className="text-red-500">*</span>}
      </Label>
      <MultiSelect
        data-cy="facility-organization"
        value={selectedLevels.map((o) => o.id)}
        options={getOrganizationOptions(rootOrganizations?.results)}
        onValueChange={(values) => handleLevelChange(values, 0)}
        placeholder={t("select_department")}
      />
      {selectedLevels.map((org, index) =>
        org.has_children ? (
          <MultiSelect
            key={org.id}
            data-cy={`facility-organization-${org.id}`}
            value={selectedLevels.slice(index + 1).map((o) => o.id)}
            options={getOrganizationOptions(
              organizationQueries[index]?.data?.results,
            )}
            onValueChange={(values) => handleLevelChange(values, index + 1)}
            placeholder={t("select_sub_department")}
          />
        ) : null,
      )}
    </>
  );
}
