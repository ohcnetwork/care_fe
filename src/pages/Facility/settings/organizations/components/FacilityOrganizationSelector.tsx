import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Building,
  ChevronDown,
  ChevronRight,
  Loader2,
  Star,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useInView } from "react-intersection-observer";
import { toast } from "sonner";

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
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import useBreakpoints from "@/hooks/useBreakpoints";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { FacilityOrganizationRead } from "@/types/facilityOrganization/facilityOrganization";
import facilityOrganizationApi from "@/types/facilityOrganization/facilityOrganizationApi";

import { useOrganizationSelection } from "./useOrganizationSelection";

interface FacilityOrganizationSelectorProps {
  value?: string[] | null;
  onChange: (
    value: string[] | null,
    organizations?: FacilityOrganizationRead[],
  ) => void;
  facilityId: string;
  currentOrganizations?: FacilityOrganizationRead[];
  singleSelection?: boolean;
  optional?: boolean;
  favoriteList?: string;
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
    favoriteList,
  } = props;

  const queryClient = useQueryClient();

  const {
    selectedIds,
    selectedOrganizations,
    selectOrganization,
    replaceSelection,
    removeOrganization,
  } = useOrganizationSelection({
    value,
    currentOrganizations,
    singleSelection,
    onChange,
  });
  const [currentSelection, setCurrentSelection] =
    useState<FacilityOrganizationRead | null>(null);
  const [navigationLevels, setNavigationLevels] = useState<
    FacilityOrganizationRead[]
  >([]);
  const [facilityOrgSearch, setFacilityOrgSearch] = useState("");
  const [showAllOrgs, setShowAllOrgs] = useState(false);
  const [open, setOpen] = useState(false);
  const preferredSelectionApplied = useRef(false);
  const isMobile = useBreakpoints({ default: true, sm: false });
  const { ref: inViewRef, inView } = useInView();

  // Fetch preferred organizations
  const { data: preferredOrganizations, isLoading: isLoadingPreferred } =
    useQuery({
      queryKey: ["facilityOrganization-favorites", facilityId, favoriteList],
      queryFn: query(facilityOrganizationApi.list, {
        pathParams: { facilityId },
        queryParams: {
          favorite_list: favoriteList,
        },
      }),
      enabled: !!favoriteList,
    });

  const preferredOrgIds = useMemo(() => {
    return preferredOrganizations?.results?.map((org) => org.id) || [];
  }, [preferredOrganizations]);

  const PAGE_LIMIT = 20;

  const {
    data: rootOrganizationsData,
    isLoading: isLoadingRoot,
    fetchNextPage: fetchNextPageRoot,
    hasNextPage: hasNextPageRoot,
    isFetchingNextPage: isFetchingNextPageRoot,
  } = useInfiniteQuery({
    queryKey: [
      "facilityOrganization",
      facilityId,
      facilityOrgSearch,
      showAllOrgs,
    ],
    queryFn: async ({ pageParam = 0, signal }) => {
      const response = await query.debounced(
        showAllOrgs
          ? facilityOrganizationApi.list
          : facilityOrganizationApi.listMine,
        {
          pathParams: { facilityId },
          queryParams: {
            parent: "",
            name: facilityOrgSearch,
            limit: String(PAGE_LIMIT),
            offset: String(pageParam),
          },
        },
      )({ signal });
      return response;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const currentOffset = allPages.length * PAGE_LIMIT;
      return currentOffset < lastPage.count ? currentOffset : null;
    },
    select: (data) => ({
      results: data?.pages.flatMap((p) => p.results) || [],
      count: data?.pages[0]?.count || 0,
    }),
  });

  const {
    data: childOrganizationsData,
    isLoading: isLoadingChild,
    fetchNextPage: fetchNextPageChild,
    hasNextPage: hasNextPageChild,
    isFetchingNextPage: isFetchingNextPageChild,
  } = useInfiniteQuery({
    queryKey: [
      "organizations",
      facilityId,
      navigationLevels[navigationLevels.length - 1]?.id,
      facilityOrgSearch,
    ],
    queryFn: async ({ pageParam = 0, signal }) => {
      const response = await query.debounced(facilityOrganizationApi.list, {
        pathParams: { facilityId },
        queryParams: {
          parent: navigationLevels[navigationLevels.length - 1]?.id,
          name: facilityOrgSearch,
          limit: String(PAGE_LIMIT),
          offset: String(pageParam),
        },
      })({ signal });
      return response;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const currentOffset = allPages.length * PAGE_LIMIT;
      return currentOffset < lastPage.count ? currentOffset : null;
    },
    select: (data) => ({
      results: data?.pages.flatMap((p) => p.results) || [],
      count: data?.pages[0]?.count || 0,
    }),
    enabled: navigationLevels.length > 0,
  });

  const handleConfirmSelection = useCallback(
    (org: FacilityOrganizationRead) => {
      selectOrganization(org);
      setCurrentSelection(null);
      setNavigationLevels([]);
      setOpen(false);
    },
    [selectOrganization],
  );

  const getCurrentLevelOrganizations = useCallback(() => {
    if (navigationLevels.length === 0) {
      return rootOrganizationsData?.results || [];
    }
    return childOrganizationsData?.results || [];
  }, [navigationLevels, rootOrganizationsData, childOrganizationsData]);

  const getCurrentLevelLoading = useCallback(() => {
    if (navigationLevels.length === 0) {
      return isLoadingRoot;
    }
    return isLoadingChild;
  }, [navigationLevels.length, isLoadingRoot, isLoadingChild]);

  const getCurrentLevelFetchingNextPage = useCallback(() => {
    if (navigationLevels.length === 0) {
      return isFetchingNextPageRoot;
    }
    return isFetchingNextPageChild;
  }, [
    navigationLevels.length,
    isFetchingNextPageRoot,
    isFetchingNextPageChild,
  ]);

  useEffect(() => {
    if (inView) {
      if (navigationLevels.length === 0 && hasNextPageRoot) {
        fetchNextPageRoot();
      } else if (navigationLevels.length > 0 && hasNextPageChild) {
        fetchNextPageChild();
      }
    }
  }, [
    inView,
    navigationLevels.length,
    hasNextPageRoot,
    hasNextPageChild,
    fetchNextPageRoot,
    fetchNextPageChild,
  ]);

  // Query results can supply the form's initial department. The parent owns
  // the selected IDs; notify it once when this external default becomes ready,
  // without copying value props into local selection or chaining two effects.
  const soleOrganization =
    rootOrganizationsData?.results.length === 1
      ? rootOrganizationsData.results[0]
      : undefined;
  const defaultOrganization =
    navigationLevels.length === 0 &&
    !facilityOrgSearch &&
    selectedIds.length === 0 &&
    !isLoadingRoot &&
    !isLoadingPreferred &&
    preferredOrgIds.length === 0 &&
    !props.optional &&
    !currentOrganizations?.some((org) => org.id === soleOrganization?.id)
      ? soleOrganization
      : undefined;
  const selectDefaultOrganization = useEffectEvent(
    (org: FacilityOrganizationRead) => {
      handleConfirmSelection(org);
    },
  );
  useEffect(() => {
    if (defaultOrganization) selectDefaultOrganization(defaultOrganization);
  }, [defaultOrganization]);

  const selectPreferredOrganizations = useEffectEvent(
    (organizations: FacilityOrganizationRead[]) => {
      // A ref also guards StrictMode's repeated setup before a state update
      // would commit; clearing a selection must not reapply its old preference.
      if (preferredSelectionApplied.current) return;
      preferredSelectionApplied.current = true;
      replaceSelection(singleSelection ? [organizations[0]] : organizations);
    },
  );
  useEffect(() => {
    if (
      favoriteList &&
      preferredOrganizations?.results.length &&
      selectedIds.length === 0
    ) {
      selectPreferredOrganizations(preferredOrganizations.results);
    }
  }, [
    favoriteList,
    preferredOrganizations,
    selectedIds.length,
    singleSelection,
  ]);

  // Add favorite mutation
  const addFavoriteMutation = useMutation({
    mutationFn: (organizationId: string) =>
      mutate(facilityOrganizationApi.addFavorite, {
        pathParams: { facilityId, organizationId },
      })({ favorite_list: favoriteList }),
    onSuccess: () => {
      toast.success(t("marked_as_preferred"));
      queryClient.invalidateQueries({
        queryKey: ["facilityOrganization-favorites", facilityId, favoriteList],
      });
    },
  });

  // Remove favorite mutation
  const removeFavoriteMutation = useMutation({
    mutationFn: (organizationId: string) =>
      mutate(facilityOrganizationApi.removeFavorite, {
        pathParams: { facilityId, organizationId },
      })({ favorite_list: favoriteList }),
    onSuccess: () => {
      toast.success(t("removed_from_preferred"));
      queryClient.invalidateQueries({
        queryKey: ["facilityOrganization-favorites", facilityId, favoriteList],
      });
    },
  });

  const handleTogglePreferred = (
    e: React.MouseEvent,
    org: FacilityOrganizationRead,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const isPreferred = preferredOrgIds.includes(org.id);
    if (isPreferred) {
      removeFavoriteMutation.mutate(org.id);
    } else {
      addFavoriteMutation.mutate(org.id);
    }
  };

  const handleSelect = (org: FacilityOrganizationRead) => {
    if (org.has_children) {
      setNavigationLevels([...navigationLevels, org]);
    } else {
      handleConfirmSelection(org);
    }
    setCurrentSelection(org);
    setFacilityOrgSearch("");
  };

  const handleOrganizationViewChange = (value: string) => {
    setShowAllOrgs(value === "all");
    setNavigationLevels([]);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setNavigationLevels([]);
      setFacilityOrgSearch("");
    }
  };

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

  const renderOrganizationCommand = (className?: string) => {
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
            className="border-none focus:ring-0 text-base sm:text-sm"
          />
        </div>
        <CommandList onWheel={(e) => e.stopPropagation()}>
          <CommandEmpty>
            {getCurrentLevelLoading() ? (
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
            {!getCurrentLevelLoading() &&
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
            {getCurrentLevelOrganizations().length > 0 && (
              <div ref={inViewRef} className="h-1" />
            )}
            {getCurrentLevelFetchingNextPage() && (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="size-4 animate-spin text-gray-500" />
                <span className="ml-2 text-sm text-gray-500">
                  {t("loading")}
                </span>
              </div>
            )}
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
            {isDisabled && !currentSelection.has_children && (
              <Button
                type="button" // Prevents unintended form submission
                variant="ghost"
                size="sm"
                className="h-8 gap-2"
                disabled={isDisabled}
              >
                <span>{t("already_selected")}</span>
                <CareIcon icon="l-multiply" className="h-4 w-4" />
              </Button>
            )}
            {currentSelection.has_children && (
              <Button
                type="button" // Prevents unintended form submission
                variant="ghost"
                size="sm"
                className="h-8 gap-2"
                onClick={() => handleConfirmSelection(currentSelection)}
                disabled={isDisabled}
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

  const isDisabled =
    selectedIds.includes(currentSelection?.id ?? "") ||
    !!currentOrganizations?.some((org) => org.id === currentSelection?.id);

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
          <TabsTrigger value="mine">{t("my_organizations")}</TabsTrigger>
          <TabsTrigger value="all">{t("all_organizations")}</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-3">
        <div className="space-y-3">
          <div className="flex flex-col gap-2">
            {isMobile ? (
              <>
                <Drawer open={open} onOpenChange={setOpen}>
                  <DrawerTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between border-dashed"
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
                  </DrawerTrigger>
                  <DrawerContent className="min-h-[50vh] max-h-[85vh]">
                    {renderOrganizationCommand()}
                  </DrawerContent>
                </Drawer>
              </>
            ) : (
              <Popover open={open} onOpenChange={handleOpenChange}>
                <PopoverTrigger asChild>
                  <Button
                    type="button" // Prevents unintended form submission
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between border-dashed"
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
                  {renderOrganizationCommand()}
                </PopoverContent>
              </Popover>
            )}
            {selectedOrganizations.map((org) => {
              const isPreferred = preferredOrgIds.includes(org.id);
              return (
                <div
                  key={org.id}
                  className="flex-1 flex items-center gap-3 rounded-md border border-sky-100 bg-sky-50/50 p-2.5"
                >
                  <Building className="size-4 text-sky-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-sky-900 truncate">
                      {org.name}
                    </p>
                  </div>
                  {favoriteList && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "size-8 p-0",
                        isPreferred
                          ? "text-yellow-500 hover:text-yellow-600"
                          : "text-gray-400 hover:text-yellow-500",
                      )}
                      type="button"
                      onClick={(e) => handleTogglePreferred(e, org)}
                      disabled={
                        addFavoriteMutation.isPending ||
                        removeFavoriteMutation.isPending
                      }
                    >
                      <Star
                        className={cn("size-4", isPreferred && "fill-current")}
                      />
                      <span className="sr-only">
                        {isPreferred
                          ? t("remove_from_preferred")
                          : t("mark_as_preferred")}
                      </span>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-8 p-0 text-gray-500 hover:text-gray-900"
                    type="button"
                    onClick={() => removeOrganization(org.id)}
                  >
                    <X className="size-4" />
                    <span className="sr-only">{t("remove_organization")}</span>
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
