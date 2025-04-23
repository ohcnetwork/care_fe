import { useQueries, useQuery } from "@tanstack/react-query";
import { Building, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import Autocomplete from "@/components/ui/autocomplete";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import query from "@/Utils/request/query";
import {
  FacilityOrganization,
  FacilityOrganizationResponse,
} from "@/types/facilityOrganization/facilityOrganization";
import facilityOrganizationApi from "@/types/facilityOrganization/facilityOrganizationApi";

interface FacilityOrganizationSelectorProps {
  selectedOrganizations: FacilityOrganization[];
  onSelect: (organization: FacilityOrganization) => void;
  onRemove: (organizationId: string) => void;
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
  const { onSelect, onRemove, facilityId, selectedOrganizations } = props;
  const [selectedLevels, setSelectedLevels] = useState<FacilityOrganization[]>(
    [],
  );
  const [currentOrganization, setCurrentOrganization] =
    useState<FacilityOrganization | null>(null);
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
    queries: selectedLevels.map((level, _index) => ({
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
    setCurrentOrganization(selectedOrg);
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
      setCurrentOrganization(lastOrg);
    } else {
      setCurrentOrganization(null);
    }
  };

  const handleOrganizationSelect = (organization: FacilityOrganization) => {
    onSelect(organization);
  };

  const handleOrganizationRemove = (organizationId: string) => {
    onRemove(organizationId);
  };

  const handleOrganizationViewChange = (value: string) => {
    setShowAllOrgs(value === "all");
    setSelectedLevels([]);
    setCurrentOrganization(null);
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
            className="h-3.5 w-3.5 text-gray-400 shrink-0"
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
              <CareIcon icon="l-pen" className="size-4 text-gray-500" />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <Label>
            {t("select_department")}
            <span className="text-red-500 ml-0.5">*</span>
          </Label>
        </div>
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
        {selectedOrganizations.length > 0 && (
          <div className="space-y-2">
            {selectedOrganizations.map((org) => (
              <div
                key={org.id}
                className="flex items-center gap-3 rounded-md border border-sky-100 bg-sky-50/50 p-2.5"
              >
                <Building className="size-4 text-sky-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-sky-900 truncate">
                    {org.name}
                  </p>
                  {org.has_children && (
                    <p className="text-xs text-sky-600">
                      {t("has_sub_departments")}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="size-8 p-0 text-gray-500 hover:text-gray-900"
                  onClick={() => handleOrganizationRemove(org.id)}
                >
                  <X className="size-4" />
                  <span className="sr-only">{t("remove_organization")}</span>
                </Button>
              </div>
            ))}
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
        {currentOrganization && (
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2 border-dashed border-2 border-sky-500 text-sky-700 hover:bg-sky-50"
            onClick={() => {
              handleOrganizationSelect(currentOrganization);
              setCurrentOrganization(null);
              setSelectedLevels([]);
            }}
          >
            <CareIcon icon="l-plus" className="size-4" />
            {t("Add_Selected_Organization")}
          </Button>
        )}
      </div>
    </div>
  );
}
