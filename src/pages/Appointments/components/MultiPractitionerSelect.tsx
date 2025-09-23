import { CheckIcon } from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  Loader2,
  Search,
  X,
  XIcon,
} from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Avatar } from "@/components/Common/Avatar";

import { COLOR_PALETTE } from "@/components/ui/multi-filter/utils/Utils";
import { cn } from "@/lib/utils";
import { FacilityOrganizationRead } from "@/types/facilityOrganization/facilityOrganization";
import facilityOrganizationApi from "@/types/facilityOrganization/facilityOrganizationApi";
import scheduleApi from "@/types/scheduling/scheduleApi";
import { UserReadMinimal } from "@/types/user/user";
import query from "@/Utils/request/query";
import { NonEmptyArray } from "@/Utils/types";
import { formatName } from "@/Utils/utils";

const getColorForTag = (uuid: string) => {
  let hash = 0;
  for (let i = 0; i < uuid.length; i++) {
    hash = (hash * 31 + uuid.charCodeAt(i)) >>> 0;
  }
  return COLOR_PALETTE[hash % COLOR_PALETTE.length];
};

interface MultiPractitionerSelectorProps {
  selected: UserReadMinimal[];
  onSelect: (users: UserReadMinimal[]) => void;
  facilityId: string;
}

const MULTI_SELECT_SHOW_LIMIT = 5;

export const MultiPractitionerSelector = ({
  facilityId,
  selected,
  onSelect,
}: MultiPractitionerSelectorProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [navigationStack, setNavigationStack] = useState<
    FacilityOrganizationRead[]
  >([]);
  const [currentOrganizationId, setCurrentOrganizationId] = useState<
    string | null
  >(null);

  // Fetch root organizations
  const { data: organizationsResponse } = useQuery({
    queryKey: ["facilityOrganizations", facilityId],
    queryFn: query(facilityOrganizationApi.list, {
      pathParams: { facilityId },
      queryParams: {
        parent: "",
        ordering: "name",
        active: true,
        limit: 100,
      },
    }),
    enabled: open,
  });

  const organizations = useMemo(
    () => organizationsResponse?.results || [],
    [organizationsResponse?.results],
  );

  // Fetch users for current organization
  const { data: organizationUsers, isLoading: isLoadingOrganizationUsers } =
    useQuery({
      queryKey: ["organizationUsers", facilityId, currentOrganizationId],
      queryFn: async ({ signal }) => {
        // Try availableUsers API with organization filter first
        try {
          const response = await query(
            scheduleApi.appointments.availableUsers,
            {
              pathParams: { facilityId },
              queryParams: { organization_ids: currentOrganizationId! },
            },
          )({ signal });
          return response;
        } catch (_error) {
          // Fallback to facilityOrganizationApi.listUsers if availableUsers doesn't support organization filter
          const response = await query(facilityOrganizationApi.listUsers, {
            pathParams: {
              facilityId,
              organizationId: currentOrganizationId!,
            },
            queryParams: { limit: 1000 },
          })({ signal });
          // Transform the response to match availableUsers format
          return {
            users: response.results.map((userRole) => userRole.user),
          };
        }
      },
      enabled: !!currentOrganizationId,
    });

  // Fetch child organizations for current navigation level
  const { data: childOrganizations } = useQuery({
    queryKey: ["childOrganizations", facilityId, currentOrganizationId],
    queryFn: query(facilityOrganizationApi.list, {
      pathParams: { facilityId },
      queryParams: {
        parent: currentOrganizationId!,
        ordering: "name",
        active: true,
      },
    }),
    enabled: !!currentOrganizationId,
  });

  const getItemValue = (user: UserReadMinimal) => {
    return `${formatName(user)} ${user.username}`;
  };

  const handleOrganizationClick = (organization: FacilityOrganizationRead) => {
    if (organization.has_children) {
      // Navigate to child organizations
      setNavigationStack((prev) => [...prev, organization]);
      setCurrentOrganizationId(organization.id);
    } else {
      // Show users for this organization
      setCurrentOrganizationId(organization.id);
    }
  };

  const handleSelectAll = (users: UserReadMinimal[]) => {
    onSelect([...selected, ...users]);
  };

  const handleUserSelect = (user: UserReadMinimal) => {
    if (selected) {
      onSelect([...selected, user]);
    } else {
      onSelect([user]);
    }
    // Close the sidebar after selection
    setCurrentOrganizationId(null);
    setNavigationStack([]);
  };

  const handleBackNavigation = () => {
    if (navigationStack.length > 0) {
      const newStack = navigationStack.slice(0, -1);
      setNavigationStack(newStack);
      if (newStack.length > 0) {
        setCurrentOrganizationId(newStack[newStack.length - 1].id);
      } else {
        setCurrentOrganizationId(null);
      }
    } else {
      setCurrentOrganizationId(null);
    }
  };

  const handleChildOrganizationClick = (
    organization: FacilityOrganizationRead,
  ) => {
    if (organization.has_children) {
      // Navigate deeper into child organizations
      setNavigationStack((prev) => [...prev, organization]);
      setCurrentOrganizationId(organization.id);
    } else {
      // Show users for this child organization
      setCurrentOrganizationId(organization.id);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="order-last sm:order-first">
        {selected && selected.length > 0 && (
          <div className="flex items-center gap-1">
            {selected.slice(0, MULTI_SELECT_SHOW_LIMIT).map((user) => (
              <Fragment key={user.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Avatar
                      imageUrl={user.profile_picture_url}
                      name={formatName(user, true)}
                      className="size-8 rounded-full cursor-pointer"
                    />
                  </TooltipTrigger>
                  <TooltipContent className="flex flex-col gap-0">
                    <span className="text-sm font-medium">
                      {formatName(user)}
                    </span>
                    <span className="text-xs text-gray-300 truncate">
                      {user.username}
                    </span>
                  </TooltipContent>
                </Tooltip>
              </Fragment>
            ))}
          </div>
        )}
      </div>
      <Popover
        open={open}
        onOpenChange={(newOpen) => {
          setOpen(newOpen);
          if (!newOpen) {
            setSearchQuery("");
          }
        }}
        modal={true}
      >
        <PopoverTrigger asChild>
          <Button
            variant="secondary"
            role="combobox"
            className="size-8! rounded-full"
          >
            {selected && selected.length > MULTI_SELECT_SHOW_LIMIT ? (
              <span className="text-xs text-gray-500">
                +{selected.length - MULTI_SELECT_SHOW_LIMIT}
              </span>
            ) : (
              <CareIcon icon="l-plus" className="size-4" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="p-0">
          <div>
            {/* Main Content */}
            {!currentOrganizationId && (
              <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="px-4 py-3 border-b bg-gray-50 rounded-t-md">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-600">
                      {t("select_practitioners")}
                    </span>
                  </div>
                </div>

                <Command className="border-0">
                  <div className="px-3 py-2 border-b">
                    <div className="relative">
                      <CommandInput
                        placeholder={t("search_organizations")}
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                        className="pl-1 border-0 focus:ring-0"
                      />
                    </div>
                  </div>

                  <CommandList className="max-h-[400px]">
                    <CommandEmpty>
                      {searchQuery ? (
                        <div className="p-6 text-center text-gray-500">
                          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <div className="text-sm">
                            {t("no_results")} "{searchQuery}"
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 text-center text-gray-500">
                          <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <div className="text-sm">
                            {t("no_organizations_found")}
                          </div>
                        </div>
                      )}
                    </CommandEmpty>

                    <CommandGroup>
                      {/* Selected Practitioners - Show at the top */}
                      {selected && selected.length > 0 && (
                        <>
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="px-2 py-1 text-sm font-medium text-gray-500 uppercase tracking-wide">
                              {t("selected")}
                            </h3>
                            <div>
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => onSelect([])}
                              >
                                {t("clear_all")}
                              </Button>
                            </div>
                          </div>
                          {selected.map((user) => (
                            <CommandItem
                              key={user.id}
                              value={getItemValue(user)}
                              onSelect={() => {
                                onSelect(
                                  selected.filter((s) => s.id !== user.id),
                                );
                              }}
                              className="flex items-center gap-2 px-3 py-3 cursor-pointer hover:bg-gray-50"
                            >
                              <Avatar
                                imageUrl={user.profile_picture_url}
                                name={formatName(user, true)}
                                className="size-6 rounded-full"
                              />
                              <div className="flex flex-col min-w-0 flex-1">
                                <span
                                  className="truncate text-sm font-medium"
                                  title={formatName(user)}
                                >
                                  {formatName(user)}
                                </span>
                              </div>
                              <XIcon className="ml-auto" />
                            </CommandItem>
                          ))}
                          <div className="bg-gray-200 -mx-1 my-1 h-px"></div>
                        </>
                      )}

                      {/* Organizations Section */}
                      {organizations.length > 0 && (
                        <>
                          <h3 className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                            {t("departments")}
                          </h3>
                          {organizations
                            .filter((organization) =>
                              searchQuery
                                ? organization.name
                                    .toLowerCase()
                                    .includes(searchQuery.toLowerCase()) ||
                                  organization.description
                                    ?.toLowerCase()
                                    .includes(searchQuery.toLowerCase())
                                : true,
                            )
                            .map((organization) => (
                              <CommandItem
                                key={organization.id}
                                value={organization.name}
                                onSelect={() =>
                                  handleOrganizationClick(organization)
                                }
                                className="flex items-center justify-between px-3 py-3 cursor-pointer hover:bg-gray-50"
                              >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <div className="flex-shrink-0">
                                    <div
                                      className={cn(
                                        "h-3 w-3 rounded-full flex-shrink-0 border",
                                        getColorForTag(organization.id),
                                      )}
                                    />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-medium text-sm truncate">
                                      {organization.name}
                                    </div>
                                    {organization.description && (
                                      <div className="text-xs text-gray-500 truncate mt-0.5">
                                        {organization.description}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {organization.has_children && (
                                    <ChevronRight className="h-4 w-4 text-gray-500" />
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                        </>
                      )}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </div>
            )}

            {/* Sidebar */}
            {currentOrganizationId && (
              <div className="border-l border-gray-200 flex flex-col">
                {/* Sidebar Header */}
                <div className="px-4 py-3 border-b bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBackNavigation}
                        className="h-6 w-6 p-0"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <Building2 className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-600">
                        {navigationStack.length > 0
                          ? navigationStack[navigationStack.length - 1].name
                          : organizations.find(
                              (org) => org.id === currentOrganizationId,
                            )?.name || t("organization")}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCurrentOrganizationId(null);
                        setNavigationStack([]);
                      }}
                      className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Sidebar Content */}
                <div className="flex-1 overflow-y-auto max-h-[400px]">
                  {/* Show child organizations if current org has children */}
                  {childOrganizations?.results?.length ? (
                    <div className="p-2">
                      <h3 className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {t("departments")}
                      </h3>
                      {childOrganizations.results.map((organization) => (
                        <div
                          key={organization.id}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() =>
                            handleChildOrganizationClick(organization)
                          }
                        >
                          <div className="flex-shrink-0">
                            <div
                              className={cn(
                                "h-3 w-3 rounded-full flex-shrink-0 border",
                                getColorForTag(organization.id),
                              )}
                            />
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="font-medium text-sm truncate">
                              {organization.name}
                            </span>
                            {organization.description && (
                              <span className="text-xs text-gray-500 truncate mt-0.5">
                                {organization.description}
                              </span>
                            )}
                          </div>
                          {organization.has_children && (
                            <ChevronRight className="h-4 w-4 text-gray-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Show users if current org has no children or is a leaf organization */
                    <div className="p-2">
                      {isLoadingOrganizationUsers ? (
                        <div className="p-6 space-y-3">
                          <div className="flex items-center gap-3">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <div className="space-y-1 flex-1">
                              <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                              <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse" />
                            </div>
                          </div>
                        </div>
                      ) : organizationUsers?.users?.length ? (
                        <>
                          <div className="flex items-center justify-between">
                            <h3 className="px-2 py-1 text-sm font-medium text-gray-500 uppercase tracking-wide">
                              {t("practitioners")}
                            </h3>
                            <div className="max-h-[400px] overflow-y-auto">
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => {
                                  handleSelectAll(
                                    organizationUsers.users as NonEmptyArray<UserReadMinimal>,
                                  );
                                }}
                              >
                                {t("select_all")}
                              </Button>
                            </div>
                          </div>
                          {organizationUsers.users.map((user) => {
                            const isSelected = selected?.some(
                              (s) => s.id === user.id,
                            );

                            return (
                              <div
                                key={user.id}
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                                onClick={() =>
                                  !isSelected && handleUserSelect(user)
                                }
                              >
                                <Avatar
                                  imageUrl={user.profile_picture_url}
                                  name={formatName(user, true)}
                                  className="size-8 rounded-full"
                                />
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span
                                    className="truncate text-sm font-medium"
                                    title={formatName(user)}
                                  >
                                    {formatName(user)}
                                  </span>
                                </div>
                                {isSelected && (
                                  <CheckIcon className="h-4 w-4 text-gray-700" />
                                )}
                              </div>
                            );
                          })}
                        </>
                      ) : (
                        <div className="p-6 text-center text-gray-500">
                          <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <div className="text-sm">
                            {t("no_users_in_organization")}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
