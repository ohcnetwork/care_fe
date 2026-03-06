import { useQuery } from "@tanstack/react-query";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Home,
  MapPin,
  Search,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
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
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import query from "@/Utils/request/query";
import { LocationRead, LocationTypeIcons } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

interface LocationBreadcrumb {
  id: string;
  name: string;
}

interface LocationPickerProps {
  facilityId: string;
  value?: LocationRead | null;
  onValueChange: (location: LocationRead | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function LocationPicker({
  facilityId,
  value,
  onValueChange,
  placeholder,
  disabled = false,
  className,
}: LocationPickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState<LocationBreadcrumb[]>([]);
  const [currentParent, setCurrentParent] = useState<string | undefined>(
    undefined,
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch locations for current level
  const {
    data: locationsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["locations", facilityId, currentParent, "kind", searchQuery],
    queryFn: query(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        parent: currentParent ? currentParent : undefined,
        mode: "kind",
        ordering: "sort_index",
        name: searchQuery || undefined,
        status: "active",
        mine: currentParent ? undefined : true,
      },
    }),
  });

  const locations = useMemo(
    () => locationsResponse?.results || [],
    [locationsResponse?.results],
  );

  // Filter locations based on search query
  const filteredLocations = useMemo(() => {
    if (!searchQuery.trim()) return locations;

    return locations.filter((location) =>
      location.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [locations, searchQuery]);

  const resetSearch = () => setSearchQuery("");

  useEffect(() => {
    if (open && value?.parent) {
      const breadcrumbChain: LocationBreadcrumb[] = [];
      let current: LocationRead | null = value.parent;

      while (current?.id) {
        breadcrumbChain.unshift({ id: current.id, name: current.name });
        current = current.parent as LocationRead | null;
      }

      setBreadcrumbs(breadcrumbChain);
      setCurrentParent(value.parent?.id || undefined);
    } else {
      setBreadcrumbs([]);
      setCurrentParent(undefined);
    }
  }, [open]);

  const handleLocationSelect = (location: LocationRead) => {
    if (location.has_children) {
      // Navigate to sublocation
      setBreadcrumbs((prev) => [
        ...prev,
        { id: location.id, name: location.name },
      ]);
      setCurrentParent(location.id);
      onValueChange(location);
      resetSearch();
    } else {
      // Select leaf location
      onValueChange(location);
      setOpen(false);
      resetSearch();
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(newBreadcrumbs);
    setCurrentParent(newBreadcrumbs[index].id);
    resetSearch();
  };

  const handleBackToRoot = () => {
    setBreadcrumbs([]);
    setCurrentParent(undefined);
    resetSearch();
  };

  const handleClearSelection = () => {
    onValueChange(null);
    setBreadcrumbs([]);
    setCurrentParent(undefined);
    resetSearch();
  };

  const getDisplayValue = () => {
    if (!value) {
      return (
        <span className="text-gray-500">
          {placeholder || t("select_location")}
        </span>
      );
    }

    const Icon =
      LocationTypeIcons[value.form as keyof typeof LocationTypeIcons];

    return (
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-gray-500 flex-shrink-0" />
        <span className="truncate">{value.name}</span>
      </div>
    );
  };

  const getCurrentLevelTitle = () => {
    if (breadcrumbs.length === 0) return t("root");
    return breadcrumbs[breadcrumbs.length - 1]?.name || t("root");
  };

  return (
    <Popover
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (!newOpen) {
          resetSearch();
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "justify-between h-10 min-h-10 px-3 py-2",
            "hover:bg-gray-50 hover:text-gray-900",
            "focus:ring-2 focus:ring-gray-300 focus:ring-offset-2",
            "transition-all duration-200",
            disabled && "opacity-50 cursor-not-allowed",
            className,
          )}
          disabled={disabled}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {getDisplayValue()}
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 opacity-50 transition-transform duration-200",
              open && "rotate-180",
            )}
          />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-[300px] max-w-[420px] p-0 shadow-lg border-0"
        align="start"
        sideOffset={4}
        onWheel={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col">
          {/* Header with current location */}
          <div className="px-4 py-3 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-600">
                  {getCurrentLevelTitle()}
                </span>
                {breadcrumbs.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {t("level")} {breadcrumbs.length + 1}
                  </Badge>
                )}
              </div>
              {value && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSelection}
                  className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
                >
                  <X className="h-3 w-3 mr-1" />
                  {t("clear")}
                </Button>
              )}
            </div>
          </div>

          {/* Breadcrumb Navigation */}
          {breadcrumbs.length > 0 && (
            <div className="px-4 py-2 border-b bg-gray-100">
              <div className="flex items-center gap-1 text-xs">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToRoot}
                  className="h-6 px-2 text-xs hover:bg-white"
                >
                  <Home className="h-3 w-3 mr-1" />
                  {t("root")}
                </Button>
                {breadcrumbs.map((breadcrumb, index) => (
                  <div key={breadcrumb.id} className="flex items-center">
                    <ChevronRight className="h-3 w-3 mx-1 text-gray-500" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleBreadcrumbClick(index)}
                      className="h-6 px-2 text-xs hover:bg-white"
                    >
                      {breadcrumb.name}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Command className="border-0">
            <div className="px-3 py-2 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <CommandInput
                  placeholder={t("search_locations")}
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  className="pl-9 h-9 border-0 focus:ring-0"
                />
              </div>
            </div>

            <CommandList className="max-h-[300px]">
              <CommandEmpty>
                {isLoading ? (
                  <div className="p-6 space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-4 w-4 rounded" />
                        <div className="space-y-1 flex-1">
                          <Skeleton className="h-4 w-3/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="p-6 text-center">
                    <div className="text-gray-500 text-sm">
                      {t("failed_to_load_locations")}
                    </div>
                  </div>
                ) : searchQuery ? (
                  <div className="p-6 text-center text-gray-500">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <div className="text-sm">{t("no_location_found")}</div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <div className="text-sm">{t("no_locations_found")}</div>
                  </div>
                )}
              </CommandEmpty>

              <CommandGroup>
                {filteredLocations.map((location) => {
                  const Icon =
                    LocationTypeIcons[
                      location.form as keyof typeof LocationTypeIcons
                    ];

                  return (
                    <CommandItem
                      key={location.id}
                      value={location.name}
                      onSelect={() => handleLocationSelect(location)}
                      className="flex items-center justify-between px-3 py-3 cursor-pointer hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150 border-b border-gray-200 last:border-b-0"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex-shrink-0">
                          <Icon className="h-5 w-5 text-gray-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm truncate">
                            {location.name}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {value?.id === location.id && (
                          <Check className="h-4 w-4 text-gray-700" />
                        )}
                        {location.has_children && (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      </PopoverContent>
    </Popover>
  );
}
