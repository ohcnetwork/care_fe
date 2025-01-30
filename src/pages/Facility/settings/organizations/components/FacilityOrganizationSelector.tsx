import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import Autocomplete from "@/components/ui/autocomplete";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import {
  FacilityOrganization,
  FacilityOrganizationResponse,
} from "@/types/facilityOrganization/facilityOrganization";

interface FacilityOrganizationSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  required?: boolean;
  facilityId: string;
}

interface AutoCompleteOption {
  label: string;
  value: string;
  hasChildren?: boolean;
}

export default function FacilityOrganizationSelector(
  props: FacilityOrganizationSelectorProps,
) {
  const { t } = useTranslation();
  const { onChange, required, facilityId } = props;
  const [selectedLevels, setSelectedLevels] = useState<FacilityOrganization[]>(
    [],
  );
  const [selectedOrganization, setSelectedOrganization] =
    useState<FacilityOrganization | null>(null);

  const { data: getAllOrganizations } = useQuery<FacilityOrganizationResponse>({
    queryKey: ["organizations-root"],
    queryFn: query(routes.facilityOrganization.list, {
      pathParams: { facilityId },
      queryParams: {
        parent: "",
      },
    }),
  });

  const { data: currentLevelOrganizations } = useQuery<{
    results: FacilityOrganization[];
  }>({
    queryKey: [
      "organizations-current",
      selectedLevels[selectedLevels.length - 1]?.id,
    ],
    queryFn: query(routes.facilityOrganization.list, {
      pathParams: { facilityId },
      queryParams: {
        parent: selectedLevels[selectedLevels.length - 1]?.id,
      },
    }),
    enabled: selectedLevels.length > 0,
  });

  const handleLevelChange = (value: string, level: number) => {
    const orgList =
      level === 0
        ? getAllOrganizations?.results
        : currentLevelOrganizations?.results;

    const selectedOrg = orgList?.find((org) => org.id === value);
    if (!selectedOrg) return;

    const newLevels = selectedLevels.slice(0, level);
    newLevels.push(selectedOrg);
    setSelectedLevels(newLevels);
    setSelectedOrganization(selectedOrg);

    // Always update the selected value, regardless of children
    onChange(selectedOrg.id);
  };

  const getOrganizationOptions = (
    orgs?: FacilityOrganization[],
  ): AutoCompleteOption[] => {
    if (!orgs) return [];
    return orgs.map((org) => ({
      label: org.name + (org.has_children ? " →" : ""),
      value: org.id,
      hasChildren: org.has_children,
    }));
  };

  const handleEdit = (level: number) => {
    const newLevels = selectedLevels.slice(0, level);
    setSelectedLevels(newLevels);
    if (newLevels.length > 0) {
      const lastOrg = newLevels[newLevels.length - 1];
      setSelectedOrganization(lastOrg);
      onChange(lastOrg.id);
    } else {
      setSelectedOrganization(null);
    }
  };

  return (
    <>
      <Label className="mb-2">
        {t("select_department")}
        {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="space-y-4">
        {/* Selected Organization Display */}
        {selectedOrganization && (
          <div className="rounded-md border p-3 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{selectedOrganization.name}</p>
                {selectedOrganization.has_children && (
                  <p className="text-sm text-gray-500">
                    You can select a sub-department or keep this selection
                  </p>
                )}
              </div>
              {selectedOrganization.has_children && (
                <Badge variant="outline">Has Sub-departments</Badge>
              )}
            </div>
          </div>
        )}

        {/* Organization Hierarchy */}
        <div className="space-y-2">
          {selectedLevels.map((org, index) => (
            <div key={org.id} className="flex items-center gap-2">
              {index > 0 && (
                <CareIcon
                  icon="l-arrow-right"
                  className="h-4 w-4 text-gray-400"
                />
              )}
              <div className="flex-1">
                <div className="flex gap-2">
                  <div className="flex items-center h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-base shadow-sm">
                    {org.name}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(index)}
                    type="button"
                  >
                    <CareIcon icon="l-pen" className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Next Selection */}
        {(!selectedLevels.length ||
          selectedLevels[selectedLevels.length - 1]?.has_children) && (
          <div className="flex items-center gap-2">
            {selectedLevels.length > 0 && (
              <CareIcon
                icon="l-arrow-right"
                className="h-4 w-4 text-gray-400"
              />
            )}
            <div className="flex-1">
              <Autocomplete
                value=""
                options={getOrganizationOptions(
                  selectedLevels.length === 0
                    ? getAllOrganizations?.results
                    : currentLevelOrganizations?.results,
                )}
                onChange={(value: string) =>
                  handleLevelChange(value, selectedLevels.length)
                }
                placeholder={`Select ${
                  selectedLevels.length ? "sub-department" : "Department"
                }...`}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
