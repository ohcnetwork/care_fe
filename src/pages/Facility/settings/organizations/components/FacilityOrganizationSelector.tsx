import { useQueries, useQuery } from "@tanstack/react-query";
import { Building } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import Autocomplete from "@/components/ui/autocomplete";
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
  const [facilityOrgSearch, setFacilityOrgSearch] = useState("");

  const { data: rootOrganizations } = useQuery<FacilityOrganizationResponse>({
    queryKey: ["organizations-root", facilityOrgSearch],
    queryFn: query.debounced(routes.facilityOrganization.list, {
      pathParams: { facilityId },
      queryParams: {
        parent: "",
        name: facilityOrgSearch,
      },
    }),
  });

  const organizationQueries = useQueries({
    queries: selectedLevels.map((level, _index) => ({
      queryKey: ["organizations", level.id, facilityOrgSearch],
      queryFn: query.debounced(routes.facilityOrganization.list, {
        pathParams: { facilityId },
        queryParams: {
          parent: level.id,
          name: facilityOrgSearch,
        },
      }),
      enabled: !!level.id,
    })),
  });

  const handleLevelChange = (value: string, level: number) => {
    let orgList: FacilityOrganization[] | undefined;

    if (level === 0) {
      orgList = rootOrganizations?.results;
    } else if (level - 1 < organizationQueries.length) {
      orgList = organizationQueries[level - 1].data?.results;
    }

    const selectedOrg = orgList?.find((org) => org.id === value);
    if (!selectedOrg) return;
    const newLevels = selectedLevels.slice(0, level);
    newLevels.push(selectedOrg);
    setSelectedLevels(newLevels);
    setSelectedOrganization(selectedOrg);
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
      onChange("");
    }
  };

  const renderOrganizationLevel = (level: number) => {
    let orgList: FacilityOrganization[] | undefined;

    if (level === 0) {
      orgList = rootOrganizations?.results;
    } else if (level - 1 < organizationQueries.length) {
      orgList = organizationQueries[level - 1].data?.results;
    }

    const getDropdownLabel = () => {
      if (level < selectedLevels.length) {
        return selectedLevels[level].name;
      }
      return level === 0 ? t("select_department") : t("select_sub_department");
    };

    return (
      <div className="group flex items-center gap-1.5">
        {level > 0 && (
          <CareIcon
            icon="l-arrow-right"
            className="h-3.5 w-3.5 text-gray-400 flex-shrink-0"
          />
        )}
        <div className="flex-1 flex items-center gap-2">
          <div className="flex-1">
            <Autocomplete
              data-cy="facility-organization"
              value={selectedLevels[level]?.id}
              options={getOrganizationOptions(orgList)}
              onChange={(value) => handleLevelChange(value, level)}
              placeholder={getDropdownLabel()}
              onSearch={(value) => setFacilityOrgSearch(value)}
            />
          </div>
          {level > 0 && level < selectedLevels.length && (
            <div
              className="cursor-pointer p-1 hover:bg-gray-100 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => handleEdit(level)}
            >
              <CareIcon icon="l-pen" className="h-4 w-4 text-gray-500" />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <Label className="mb-2 block">
        {t("select_department")}
        {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="space-y-3">
        {selectedOrganization && (
          <div className="flex items-center gap-3 rounded-md border border-sky-100 bg-sky-50/50 p-2.5">
            <Building className="h-4 w-4 text-sky-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-sky-900 truncate">
                {selectedOrganization.name}
              </p>
              {selectedOrganization.has_children && (
                <p className="text-xs text-sky-600">
                  {t("has_sub_departments")}
                </p>
              )}
            </div>
          </div>
        )}
        <div className="space-y-1.5">
          {selectedLevels.map((org, index) => (
            <div key={org.id}>{renderOrganizationLevel(index)}</div>
          ))}
          {(!selectedLevels.length ||
            selectedLevels[selectedLevels.length - 1]?.has_children) &&
            renderOrganizationLevel(selectedLevels.length)}
        </div>
      </div>
    </>
  );
}
