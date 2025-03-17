import { useQueries, useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import MultiAutocomplete from "@/components/ui/multi-autocomplete";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import query from "@/Utils/request/query";
import {
  FacilityOrganization,
  FacilityOrganizationResponse,
} from "@/types/facilityOrganization/facilityOrganization";
import facilityOrganizationApi from "@/types/facilityOrganization/facilityOrganizationApi";

interface FacilityOrganizationSelectorProps {
  value?: string[];
  onChange: (value: string[]) => void;
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
  const { onChange, facilityId } = props;
  const [selectedLevels, setSelectedLevels] = useState<FacilityOrganization[]>(
    [],
  );
  const [facilityOrgSearch, setFacilityOrgSearch] = useState("");
  const [showAllOrgs, setShowAllOrgs] = useState(false);

  const { data: rootOrganizations } = useQuery<FacilityOrganizationResponse>({
    queryKey: ["organizations-root", facilityOrgSearch, showAllOrgs],
    queryFn: query.debounced(
      showAllOrgs
        ? facilityOrganizationApi.list
        : facilityOrganizationApi.listMine,
      {
        pathParams: { facilityId },
        queryParams: {
          parent: "",
          name: facilityOrgSearch,
        },
      },
    ),
  });

  const organizationQueries = useQueries({
    queries: selectedLevels.map((level) => ({
      queryKey: ["organizations", level.id, facilityOrgSearch],
      queryFn: query.debounced(facilityOrganizationApi.list, {
        pathParams: { facilityId },
        queryParams: {
          parent: level.id,
          name: facilityOrgSearch,
        },
      }),
      enabled: !!level.id,
    })),
  });

  const handleLevelChange = (values: string[], level: number) => {
    let orgList: FacilityOrganization[] | undefined =
      level === 0
        ? rootOrganizations?.results
        : organizationQueries[level - 1]?.data?.results;

    if (!orgList) return;
    const selectedOrgs = orgList.filter((org) => values.includes(org.id));
    const newLevels = [...selectedLevels.slice(0, level), ...selectedOrgs];

    setSelectedLevels(newLevels);
    onChange(newLevels.map((org) => org.id));
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

  const handleRemoveOrganizationAtLevel = (level: number) => {
    // Keep only organizations before the removed level
    const newLevels = selectedLevels.slice(0, level);

    setSelectedLevels(newLevels);
    onChange(newLevels.map((org) => org.id));
  };

  const handleOrganizationViewChange = (value: string) => {
    setShowAllOrgs(value === "all");
    setSelectedLevels([]);
    onChange([]);
  };

  const renderOrganizationLevel = (level: number) => {
    let orgList: FacilityOrganization[] | undefined =
      level === 0
        ? rootOrganizations?.results
        : organizationQueries[level - 1]?.data?.results;

    if (!orgList) return null;
    const lastSelected = selectedLevels[level - 1];
    if (level > 0 && lastSelected && !lastSelected.has_children) {
      return null;
    }
    return (
      <div className="group flex items-center gap-1.5">
        {level > 0 && (
          <CareIcon
            icon="l-arrow-right"
            className="h-3.5 w-3.5 text-gray-400 flex-shrink-0"
          />
        )}
        <div className="flex-1">
          <MultiAutocomplete
            data-cy="facility-organization"
            values={selectedLevels.map((org) => org.id)}
            options={getOrganizationOptions(orgList)}
            onChange={(values) => handleLevelChange(values, level)}
            placeholder={
              level === 0 ? t("select_department") : t("select_sub_department")
            }
            onSearch={(value) => setFacilityOrgSearch(value)}
          />
        </div>
        {level < selectedLevels.length && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900"
            onClick={() => handleRemoveOrganizationAtLevel(level)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Label>
          {t("select_department")}{" "}
          <span className="text-red-500 ml-0.5">*</span>
        </Label>
      </div>

      <Tabs
        value={showAllOrgs ? "all" : "mine"}
        onValueChange={handleOrganizationViewChange}
        className="w-full sm:w-auto"
      >
        <TabsList className="grid w-full grid-cols-2 sm:w-[300px]">
          <TabsTrigger value="mine">{t("my_organizations")}</TabsTrigger>
          <TabsTrigger value="all">{t("all_organizations")}</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-3">
        <div className="space-y-1.5">
          {[...Array(selectedLevels.length + 1)].map((_, index) => (
            <div key={index}>{renderOrganizationLevel(index)}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
