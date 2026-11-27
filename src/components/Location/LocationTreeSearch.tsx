import { Search } from "lucide-react";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

import { LocationTreeSkeleton } from "@/components/Location/LocationTreeSkeleton";

import query from "@/Utils/request/query";
import { useInfiniteList } from "@/hooks/useInfiniteList";
import { LocationRead, LocationTypeIcons } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";
import { buildLocationPath } from "@/types/location/utils";

interface LocationTreeSearchProps {
  facilityId: string;
  onSelect: (location: LocationRead) => void;
  queryParams?: Record<string, string | boolean>;
  /** For what the request cannot filter. */
  filter?: (location: LocationRead) => boolean;
  /** The tree, shown while the search box is empty. */
  children: ReactNode;
  searchable?: boolean;
}

/**
 * A search box above a location tree. While it has text, matching locations
 * replace the tree, each with the places it sits in.
 */
export function LocationTreeSearch({
  facilityId,
  onSelect,
  queryParams,
  filter,
  children,
  searchable = true,
}: LocationTreeSearchProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const term = searchable ? search.trim() : "";

  const { data, isLoading, isFetching, isFetchingNextPage, hasNextPage, ref } =
    useInfiniteList({
      queryKey: ["locations", facilityId, "tree-search", term, queryParams],
      ...query.infinite(locationApi.list, {
        pathParams: { facility_id: facilityId },
        queryParams: { name: term, ...queryParams },
        pageSize: 30,
        debounceInterval: 300,
      }),
      enabled: !!term,
    });
  const results = (data?.results ?? []).filter(
    (location) => !filter || filter(location),
  );
  // The filter can empty a page: wait for the rest before saying there is no match.
  const hasNoMatch = results.length === 0 && !hasNextPage && !isFetching;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {searchable && (
        <div className="relative shrink-0 border-b border-border p-2">
          <Search
            className="pointer-events-none absolute top-1/2 left-5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            className="pl-9 text-base sm:text-sm"
            aria-label={t("search_locations")}
            placeholder={t("search_locations")}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      )}
      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto p-2",
          "[scrollbar-color:var(--color-border)_transparent] scrollbar-thin",
        )}
      >
        {!term ? (
          children
        ) : isLoading ? (
          <LocationTreeSkeleton />
        ) : hasNoMatch ? (
          <p className="p-2 text-sm text-muted-foreground">
            {t("no_locations_found")}
          </p>
        ) : (
          <>
            <ul aria-label={t("search_locations")}>
              {results.map((location) => {
                const Icon = LocationTypeIcons[location.form];
                const places = buildLocationPath(location)
                  .slice(0, -1)
                  .map((step) => step.name)
                  .join(" / ");
                return (
                  <li key={location.id}>
                    <button
                      type="button"
                      className="flex min-h-11 w-full min-w-0 cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-left text-sm outline-none hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                      onClick={() => {
                        onSelect(location);
                        setSearch("");
                      }}
                    >
                      <Icon
                        className="size-4 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <span className="min-w-0">
                        <span className="block leading-tight wrap-anywhere">
                          {location.name}
                        </span>
                        {places && (
                          <span className="block text-xs leading-tight wrap-anywhere text-muted-foreground">
                            {places}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <div ref={ref} className="flex h-8 items-center justify-center">
              {isFetchingNextPage && <Spinner />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
