import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import { locationChildrenQuery } from "@/pages/Facility/locations/bed-board/locationQueries";
import { LocationRead, LocationTypeIcons } from "@/types/location/location";

interface LocationTreeNodeProps {
  location: LocationRead;
  selectedLocationId?: string;
  onSelect: (location: LocationRead) => void;
  expandedLocations: ReadonlySet<string>;
  onToggleExpand: (locationId: string) => void;
  level?: number;
  facilityId: string;
}

export function LocationTreeNode({
  location,
  selectedLocationId,
  onSelect,
  expandedLocations,
  onToggleExpand,
  level = 0,
  facilityId,
}: LocationTreeNodeProps) {
  const { t } = useTranslation();
  const Icon = LocationTypeIcons[location.form];
  const isSelected = location.id === selectedLocationId;
  // The flag says whether there is anything to expand, so a leaf has no arrow.
  const hasChildren = location.has_sub_locations;
  const isExpanded = hasChildren && expandedLocations.has(location.id);

  const { data: children, isLoading } = useQuery({
    ...locationChildrenQuery(facilityId, location.id, "kind"),
    enabled: isExpanded,
  });

  return (
    <li>
      <div
        className={cn(
          "flex items-center rounded-md",
          isSelected ? "bg-muted-background font-medium" : "hover:bg-muted",
        )}
        style={{ paddingLeft: `${level * 1.25}rem` }}
      >
        {isLoading ? (
          <span className="flex size-7 shrink-0 items-center justify-center">
            <Spinner className="size-4" />
          </span>
        ) : hasChildren ? (
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            aria-expanded={isExpanded}
            aria-label={`${t(isExpanded ? "collapse" : "expand")} ${location.name}`}
            onClick={() => onToggleExpand(location.id)}
          >
            {isExpanded ? (
              <ChevronDown aria-hidden="true" />
            ) : (
              <ChevronRight aria-hidden="true" />
            )}
          </Button>
        ) : (
          <span className="size-7 shrink-0" />
        )}
        <button
          type="button"
          aria-current={isSelected ? "true" : undefined}
          className="flex min-h-9 min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md py-1.5 pr-2 text-left text-sm outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          onClick={() => {
            onSelect(location);
            // Opening a location shows what is inside it; only the arrow collapses.
            if (hasChildren && !isExpanded) onToggleExpand(location.id);
          }}
        >
          <Icon
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <span className="truncate">{location.name}</span>
        </button>
      </div>
      {isExpanded && !!children?.results.length && (
        <ul>
          {children.results.map((child) => (
            <LocationTreeNode
              key={child.id}
              location={child}
              selectedLocationId={selectedLocationId}
              onSelect={onSelect}
              expandedLocations={expandedLocations}
              onToggleExpand={onToggleExpand}
              level={level + 1}
              facilityId={facilityId}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
