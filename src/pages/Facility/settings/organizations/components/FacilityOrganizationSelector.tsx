import { useQueries, useQuery } from "@tanstack/react-query";
import { Building, ChevronDown, ChevronRight, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import useBreakpoints from "@/hooks/useBreakpoints";

import query from "@/Utils/request/query";
import { FacilityOrganizationRead } from "@/types/facilityOrganization/facilityOrganization";
import facilityOrganizationApi from "@/types/facilityOrganization/facilityOrganizationApi";

interface FacilityOrganizationSelectorProps {
  value?: string[] | null;
  onChange: (value: string[] | null) => void;
  facilityId: string;
  currentOrganizations?: FacilityOrganizationRead[];
  singleSelection?: boolean;
  optional?: boolean;
}

export default function FacilityOrganizationSelector(
  props: FacilityOrganizationSelectorProps,
) {
  const { t } = useTranslation();
  const {
    value,
    onChange,
    facilityId,
    currentOrganizations,
    singleSelection = false,
  } = props;

  const [selectedOrganizations, setSelectedOrganizations] = useState<
    FacilityOrganizationRead[]
  >([]);
  const [currentSelection, setCurrentSelection] =
    useState<FacilityOrganizationRead | null>(null);
  const [navigationLevels, setNavigationLevels] = useState<
    FacilityOrganizationRead[]
  >([]);
  const [facilityOrgSearch, setFacilityOrgSearch] = useState("");
  const [showAllOrgs, setShowAllOrgs] = useState(false);
  const [open, setOpen] = useState(false);
  const [alreadySelected, setAlreadySelected] = useState(false);
  const isMobile = useBreakpoints({ default: true, sm: false });
  const { data: rootOrganizations, isLoading: isLoadingRoot } = useQuery({
    queryKey: ["facilityOrganization", facilityOrgSearch, showAllOrgs],
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
    queries: navigationLevels.map((level) => ({
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

  // Sync selectedOrganizations with value prop
  useEffect(() => {
    if (value?.length && currentOrganizations?.length) {
      const matchingOrganizations = currentOrganizations.filter((org) =>
        value.includes(org.id),
      );

      if (matchingOrganizations.length === value.length) {
        setSelectedOrganizations(matchingOrganizations);
      }
    } else {
      setSelectedOrganizations([]);
    }
  }, [value, currentOrganizations]);

  const handleSelect = (org: FacilityOrganizationRead) => {
    const isAlreadySelected = !!currentOrganizations?.find(
      (o) => o.id === org.id,
    );
    if (isAlreadySelected) {
      setAlreadySelected(true);
      setCurrentSelection(org);
      setFacilityOrgSearch("");
      return;
    }
    if (org.has_children) {
      setNavigationLevels([...navigationLevels, org]);
    } else {
      handleConfirmSelection(org);
    }
    setCurrentSelection(org);
    setFacilityOrgSearch("");
  };

  const handleConfirmSelection = useCallback(
    (org: FacilityOrganizationRead) => {
      if (!selectedOrganizations.includes(org)) {
        const newSelection = [...selectedOrganizations, org];
        setSelectedOrganizations(newSelection);
        onChange(newSelection.map((org) => org.id));
        setAlreadySelected(true);
      }
      setCurrentSelection(null);
      setNavigationLevels([]);
      setOpen(false);
    },
    [selectedOrganizations, onChange],
  );

  const handleRemoveOrganization = (index: number) => {
    const newSelection = selectedOrganizations.filter((_, i) => i !== index);
    setSelectedOrganizations(newSelection);
    onChange(
      newSelection.length > 0 ? newSelection.map((org) => org.id) : null,
    );
  };

  const handleOrganizationViewChange = (value: string) => {
    setShowAllOrgs(value === "all");
    setSelectedOrganizations([]);
    setCurrentSelection(null);
    setNavigationLevels([]);
    onChange(null);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setNavigationLevels([]);
      setFacilityOrgSearch("");
    }
  };

  const getCurrentLevelOrganizations = useCallback(() => {
    if (navigationLevels.length === 0) {
      return rootOrganizations?.results || [];
    }
    const lastQuery = organizationQueries[navigationLevels.length - 1];
    return lastQuery?.data?.results || [];
  }, [navigationLevels, rootOrganizations, organizationQueries]);

  // Auto-select when there's only one organization available
  useEffect(() => {
    const availableOrganizations = getCurrentLevelOrganizations();

    // Only auto-select if:
    // 1. We're at the root level (no navigation levels)
    // 2. There's exactly one organization
    // 3. No search is active
    // 4. No organizations are currently selected
    // 5. Not loading
    if (
      navigationLevels.length === 0 &&
      availableOrganizations.length === 1 &&
      !facilityOrgSearch &&
      selectedOrganizations.length === 0 &&
      !isLoadingRoot
    ) {
      const singleOrg = availableOrganizations[0];

      // Check if this organization is already selected in currentOrganizations prop
      const isAlreadyInCurrent = currentOrganizations?.find(
        (org) => org.id === singleOrg.id,
      );

      if (!isAlreadyInCurrent && !props.optional) {
        handleConfirmSelection(singleOrg);
      }
    }
  }, [
    getCurrentLevelOrganizations,
    handleConfirmSelection,
    navigationLevels,
    facilityOrgSearch,
    selectedOrganizations,
    isLoadingRoot,
    currentOrganizations,
    props.optional,
  ]);

  const renderNavigationPath = () => {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {/* Clear button */}
        <button
          type="button"
          onClick={() => setNavigationLevels([])}
          className="text-sm font-medium text-gray-700 hover:text-primary-600 cursor-pointer"
        >
          <X className="h-4 w-4 text-gray-400 flex-shrink-0" />
        </button>
        {navigationLevels.map((org, index) => (
          <div key={org.id} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setNavigationLevels(navigationLevels.slice(0, index + 1));
                setFacilityOrgSearch("");
              }}
              className="text-sm font-medium text-gray-700 hover:text-primary-600 cursor-pointer"
            >
              {org.name}
            </button>
            <ChevronRight className="h-3 w-3 text-gray-400 flex-shrink-0" />
          </div>
        ))}
      </div>
    );
  };

  const renderOrganizationPopover = (className?: string) => {
    return (
      <Command className={className}>
        <div className="flex flex-col px-3 py-2 border-b sticky top-0 bg-white z-10">
          <span className="font-semibold text-base text-gray-900">
            {t("select_department")}
          </span>
          <span className="text-sm text-gray-500 mt-0.5">
            {t("select_department_description")}
          </span>
        </div>
        <div className="flex items-center px-3 py-2 border-b sticky top-[48px] bg-white z-10">
          {navigationLevels.length > 0 ? (
            renderNavigationPath()
          ) : (
            <span className="text-sm text-gray-500">
              {t("select_from_list")}
            </span>
          )}
        </div>
        <div className="flex items-center border-b px-3 sticky top-[96px] bg-white z-10">
          <CommandInput
            placeholder={t("search_organizations")}
            onValueChange={setFacilityOrgSearch}
            value={facilityOrgSearch}
            className="border-none focus:ring-0"
          />
        </div>
        <CommandList
          className="max-h-[calc(100vh-30rem)]"
          onWheel={(e) => e.stopPropagation()}
        >
          <CommandEmpty>
            {isLoadingRoot ||
            organizationQueries[navigationLevels.length - 1]?.isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                <span className="ml-2 text-sm text-gray-500">
                  {t("loading_organizations")}
                </span>
              </div>
            ) : (
              t("no_organizations_found")
            )}
          </CommandEmpty>
          <CommandGroup>
            {!(
              isLoadingRoot ||
              organizationQueries[navigationLevels.length - 1]?.isLoading
            ) &&
              getCurrentLevelOrganizations().map((org) => {
                const isSelected = currentSelection?.id === org.id;
                return (
                  <CommandItem
                    key={org.id}
                    value={org.name}
                    onSelect={() => handleSelect(org)}
                    className={cn(
                      "flex items-center justify-between",
                      isSelected && "bg-sky-50/50",
                    )}
                  >
                    <div className="flex items-center">
                      <span>{org.name}</span>
                      {isSelected && (
                        <CareIcon
                          icon="l-check"
                          className="ml-2 h-4 w-4 text-sky-600"
                        />
                      )}
                    </div>
                    {org.has_children && (
                      <ChevronRight className="h-4 w-4 opacity-50" />
                    )}
                  </CommandItem>
                );
              })}
          </CommandGroup>
        </CommandList>
        {currentSelection && (
          <div className="md:m-0 m-2 flex items-center justify-between px-3 py-2  bg-sky-50/50 border-sky-200 rounded-md ">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 mb-0.5">
                {t("selected")}
              </span>
              <span className="font-medium text-sm text-sky-900">
                {currentSelection.name}
              </span>
            </div>
            {alreadySelected && !currentSelection.has_children && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-2"
                disabled={alreadySelected}
                data-cy="confirm-organization"
              >
                <span>{t("already_selected")}</span>
                <CareIcon icon="l-multiply" className="h-4 w-4" />
              </Button>
            )}
            {currentSelection.has_children && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-2"
                onClick={() => handleConfirmSelection(currentSelection)}
                disabled={isDisabled}
                data-cy="confirm-organization"
              >
                {isDisabled ? (
                  <>
                    <span>{t("already_selected")}</span>
                    <CareIcon icon="l-multiply" className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    <span>{t("confirm")}</span>
                    <CareIcon icon="l-check" className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </Command>
    );
  };

  const isDisabled = useMemo(() => {
    return (
      selectedOrganizations.some((org) => org.id === currentSelection?.id) ||
      (!!currentOrganizations &&
        currentOrganizations.some((org) => org.id === currentSelection?.id))
    );
  }, [currentSelection, currentOrganizations, selectedOrganizations]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <Label>
            {t("select_department")}
            {!props.optional && <span className="text-red-500 ml-0.5">*</span>}
          </Label>
        </div>
      </div>

      <Tabs
        value={showAllOrgs ? "all" : "mine"}
        onValueChange={handleOrganizationViewChange}
        className="w-full sm:w-auto"
      >
        <TabsList className="grid w-full grid-cols-2 sm:w-[300px]">
          <TabsTrigger value="mine" data-cy="my-organizations-tab">
            {t("my_organizations")}
          </TabsTrigger>
          <TabsTrigger value="all" data-cy="all-organizations-tab">
            {t("all_organizations")}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-3">
        <div className="space-y-3">
          <div className="flex flex-col gap-2">
            {selectedOrganizations.map((org, index) => (
              <div
                key={index}
                className="flex-1 flex items-center gap-3 rounded-md border border-sky-100 bg-sky-50/50 p-2.5"
              >
                <Building className="size-4 text-sky-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-sky-900 truncate">
                    {org.name}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="size-8 p-0 text-gray-500 hover:text-gray-900"
                  onClick={() => handleRemoveOrganization(index)}
                >
                  <X className="size-4" />
                  <span className="sr-only">{t("remove_organization")}</span>
                </Button>
              </div>
            ))}
            {(!singleSelection ||
              (singleSelection && selectedOrganizations.length < 1)) &&
              (isMobile ? (
                <>
                  <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between border-dashed"
                        data-cy="facility-organization"
                        onClick={() => setOpen(true)}
                        type="button" // Prevents unintended form submission
                      >
                        <span className="truncate text-gray-500">
                          {currentSelection
                            ? currentSelection.name
                            : t("select_department")}
                        </span>
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="p-0" side="bottom">
                      {renderOrganizationPopover("mb-12")}
                    </SheetContent>
                  </Sheet>
                </>
              ) : (
                <Popover open={open} onOpenChange={handleOpenChange}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between border-dashed"
                      data-cy="facility-organization"
                    >
                      <span className="truncate text-gray-500">
                        {currentSelection
                          ? currentSelection.name
                          : t("select_department")}
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    sideOffset={4}
                    className="p-0 w-[var(--radix-popover-trigger-width)] max-h-[80vh] overflow-auto"
                  >
                    {renderOrganizationPopover()}
                  </PopoverContent>
                </Popover>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
