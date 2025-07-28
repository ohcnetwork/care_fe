import { DotFilledIcon } from "@radix-ui/react-icons";
import { UseQueryResult, useQueries, useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Building,
  ChevronDown,
  ChevronRight,
  Loader2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
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
import { FacilityOrganization } from "@/types/facilityOrganization/facilityOrganization";
import facilityOrganizationApi from "@/types/facilityOrganization/facilityOrganizationApi";

interface FacilityOrganizationSelectorProps {
  value?: string[] | null;
  onChange: (value: string[] | null) => void;
  facilityId: string;
  currentOrganizations?: FacilityOrganization[];
  singleSelection?: boolean;
}

const getCurrentSelectionPathLabel = (
  navigationLevels: FacilityOrganization[],
  currentSelection: FacilityOrganization | null,
  t: (key: string) => string,
) => {
  const path = [...navigationLevels];

  if (
    currentSelection &&
    (!path.length || path[path.length - 1].id !== currentSelection.id)
  ) {
    path.push(currentSelection);
  }

  if (path.length === 0) return t("select_department");

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {path.map((org, index) => (
        <div key={org.id} className="flex items-center">
          <span className="truncate">{org.name}</span>
          {index !== path.length - 1 && (
            <ArrowRight className="mx-1 h-4 w-4 text-gray-400" />
          )}
        </div>
      ))}
    </div>
  );
};

const renderOrganizationPopover = (
  className: string | undefined,
  t: (key: string) => string,
  facilityOrgSearch: string,
  setFacilityOrgSearch: (value: string) => void,
  isLoadingRoot: boolean,
  organizationQueries: UseQueryResult<any, Error>[],
  navigationLevels: FacilityOrganization[],
  getCurrentLevelOrganizations: () => FacilityOrganization[],
  currentSelection: FacilityOrganization | null,
  handleSelect: (org: FacilityOrganization) => void,
  alreadySelected: boolean,
  pendingSelection: FacilityOrganization | null,
  handleCancelSelection: () => void,
  handleConfirmSelection: () => void,
  isDisabled: boolean,
) => {
  return (
    <Command className={className}>
      <div className="flex items-center border-b px-3 bg-white z-10">
        <CommandInput
          placeholder={t("search_organizations")}
          onValueChange={setFacilityOrgSearch}
          value={facilityOrgSearch}
          className="border-none focus:ring-0"
        />
      </div>
      <CommandList
        className="max-h-48 mb-4 overflow-y-auto"
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
                  {org.has_children ? (
                    <ChevronRight className="h-4 w-4 font-bold" />
                  ) : (
                    <DotFilledIcon className="h-4 w-4 font-bold" />
                  )}
                </CommandItem>
              );
            })}
        </CommandGroup>
      </CommandList>
      {currentSelection && (
        <div className="md:m-0 m-2 flex flex-wrap sm:justify-between justify-center px-2 py-2  bg-blue-100 border-sky-200 rounded-md ">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 mb-0.5">
              {t("selected")}
            </span>
            <span className="font-medium text-sm text-sky-900">
              {getCurrentSelectionPathLabel(
                navigationLevels,
                currentSelection,
                t,
              )}
            </span>
          </div>
          {pendingSelection && (
            <div className="flex items-center justify-between px-3 py-2 border-sky-200 rounded-md">
              <div className="flex items-center gap-2">
                <Button
                  variant="link"
                  className="h-8 underline font-semibold"
                  onClick={handleCancelSelection}
                >
                  {t("cancel")}
                </Button>
                <Button
                  variant="white"
                  className="h-8 w-auto font-semibold text-center border border-green-600 text-green-800"
                  onClick={handleConfirmSelection}
                  disabled={isDisabled}
                >
                  {isDisabled ? (
                    <>
                      <span>{t("already_selected")}</span>
                      <CareIcon icon="l-multiply" className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      <CareIcon icon="l-check" className="h-4 w-4" />
                      <span>{t("confirm")}</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Command>
  );
};

export default function FacilityOrganizationSelector(
  props: FacilityOrganizationSelectorProps,
) {
  const { t } = useTranslation();
  const {
    onChange,
    facilityId,
    currentOrganizations,
    singleSelection = false,
  } = props;

  const [selectedOrganizations, setSelectedOrganizations] = useState<
    FacilityOrganization[][]
  >([]);

  const [currentSelection, setCurrentSelection] =
    useState<FacilityOrganization | null>(null);
  const [navigationLevels, setNavigationLevels] = useState<
    FacilityOrganization[]
  >([]);
  const [facilityOrgSearch, setFacilityOrgSearch] = useState("");
  const [showAllOrgs, setShowAllOrgs] = useState(false);
  const [open, setOpen] = useState(false);
  const [alreadySelected, setAlreadySelected] = useState(false);
  const isMobile = useBreakpoints({ default: true, sm: false });
  const [pendingSelection, setPendingSelection] =
    useState<FacilityOrganization | null>(null);

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

  const handleSelect = (org: FacilityOrganization) => {
    const isAlreadySelected = !!currentOrganizations?.find(
      (o) => o.id === org.id,
    );

    setAlreadySelected(isAlreadySelected);
    setCurrentSelection(org);
    setPendingSelection(org);

    if (org.has_children) {
      setNavigationLevels([...navigationLevels, org]);
    }

    setFacilityOrgSearch("");
  };

  const handleConfirmSelection = () => {
    if (!pendingSelection) return;

    const path = [...navigationLevels];
    if (!path.find((org) => org.id === pendingSelection.id)) {
      path.push(pendingSelection);
    }

    if (
      !selectedOrganizations.some(
        (selPath) => selPath[selPath.length - 1].id === pendingSelection.id,
      )
    ) {
      const newSelection = [...selectedOrganizations, path];
      setSelectedOrganizations(newSelection);
      onChange(newSelection.map((sel) => sel[sel.length - 1].id));
    }

    setCurrentSelection(null);
    setPendingSelection(null);
    setNavigationLevels([]);
    setOpen(false);
  };

  const handleCancelSelection = () => {
    setCurrentSelection(null);
    setPendingSelection(null);
    setNavigationLevels([]);
  };

  const handleRemoveOrganization = (index: number) => {
    const newSelection = selectedOrganizations.filter((_, i) => i !== index);
    setSelectedOrganizations(newSelection);
    onChange(
      newSelection.length > 0
        ? newSelection.map((sel) => sel[sel.length - 1].id)
        : null,
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

  const getCurrentLevelOrganizations = () => {
    if (navigationLevels.length === 0) {
      return rootOrganizations?.results || [];
    }
    const lastQuery = organizationQueries[navigationLevels.length - 1];
    return lastQuery?.data?.results || [];
  };

  const isDisabled = useMemo(() => {
    const selectedIds = selectedOrganizations.map(
      (path) => path[path.length - 1].id,
    );
    return (
      selectedIds.includes(pendingSelection?.id || "") ||
      (!!currentOrganizations &&
        currentOrganizations.some((org) => org.id === pendingSelection?.id))
    );
  }, [pendingSelection, currentOrganizations, selectedOrganizations]);

  return (
    <div className="space-y-2">
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
      <div className="mt-6">
        <Label className="font-medium mb-2">{t("select_department")}</Label>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
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
                        type="button"
                      >
                        <span className="truncate text-gray-500">
                          {getCurrentSelectionPathLabel(
                            navigationLevels,
                            currentSelection,
                            t,
                          )}
                        </span>
                        <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
                      </Button>
                    </SheetTrigger>

                    <SheetContent
                      className="p-0 h-auto overflow-auto min-h-48"
                      side="bottom"
                    >
                      {renderOrganizationPopover(
                        "mb-4",
                        t,
                        facilityOrgSearch,
                        setFacilityOrgSearch,
                        isLoadingRoot,
                        organizationQueries,
                        navigationLevels,
                        getCurrentLevelOrganizations,
                        currentSelection,
                        handleSelect,
                        alreadySelected,
                        pendingSelection,
                        handleCancelSelection,
                        handleConfirmSelection,
                        isDisabled,
                      )}
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
                        {getCurrentSelectionPathLabel(
                          navigationLevels,
                          currentSelection,
                          t,
                        )}
                      </span>
                      <ChevronRight className="ml-2 size-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    sideOffset={4}
                    className="p-0 w-[var(--radix-popover-trigger-width)] max-h-[80vh]"
                  >
                    {renderOrganizationPopover(
                      undefined,
                      t,
                      facilityOrgSearch,
                      setFacilityOrgSearch,
                      isLoadingRoot,
                      organizationQueries,
                      navigationLevels,
                      getCurrentLevelOrganizations,
                      currentSelection,
                      handleSelect,
                      alreadySelected,
                      pendingSelection,
                      handleCancelSelection,
                      handleConfirmSelection,
                      isDisabled,
                    )}
                  </PopoverContent>
                </Popover>
              ))}
            {selectedOrganizations.length > 0 && (
              <div className="mt-6">
                <span className="font-semibold">
                  {t("new_added_organization")}
                </span>
                {selectedOrganizations.map((path, index) => {
                  return (
                    <div
                      key={index}
                      className="flex-1 flex items-center gap-3 rounded-md border border-sky-100 bg-blue-100 p-2.5 my-2"
                    >
                      <Building className="size-4 text-sky-600 shrink-0" />
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="font-medium text-sm text-sky-900 flex items-center flex-wrap gap-1">
                          {path.map((org, idx) => (
                            <div key={org.id} className="flex items-center">
                              <span className="truncate font-medium">
                                {org.name}
                              </span>
                              {idx !== path.length - 1 && (
                                <ArrowRight className="mx-1 size-4 font-bold shrink-0" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-8 p-0 text-gray-500 hover:text-gray-900"
                        onClick={() => handleRemoveOrganization(index)}
                      >
                        <X className="size-4" />
                        <span className="sr-only">
                          {t("remove_organization")}
                        </span>
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
