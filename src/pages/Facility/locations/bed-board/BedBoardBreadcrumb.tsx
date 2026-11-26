import { Fragment } from "react";
import { useTranslation } from "react-i18next";

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { LocationRead } from "@/types/location/location";

interface BedBoardBreadcrumbProps {
  /** The parents of the location, from the top down. */
  ancestors: LocationRead[];
  current: LocationRead;
  onOpen: (location: LocationRead) => void;
  /** Tells if a parent is a link. Without it, all of them are. */
  canOpen?: (ancestor: LocationRead, ancestors: LocationRead[]) => boolean;
}

/**
 * The top parent and the direct parent stay in view. The parents between
 * them fold into a "…" menu, so a deep location does not fill the bar.
 */
export function BedBoardBreadcrumb({
  ancestors,
  current,
  onOpen,
  canOpen,
}: BedBoardBreadcrumbProps) {
  const { t } = useTranslation();
  const isLink = (ancestor: LocationRead) =>
    !canOpen || canOpen(ancestor, ancestors);
  const folded = ancestors.length > 2 ? ancestors.slice(1, -1) : [];
  const shown = ancestors.filter((ancestor) => !folded.includes(ancestor));

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        {shown.map((ancestor, index) => (
          <Fragment key={ancestor.id}>
            <BreadcrumbItem className="min-w-0">
              {isLink(ancestor) ? (
                <BreadcrumbLink asChild>
                  <button
                    type="button"
                    className="max-w-40 cursor-pointer truncate"
                    onClick={() => onOpen(ancestor)}
                  >
                    {ancestor.name}
                  </button>
                </BreadcrumbLink>
              ) : (
                <span className="max-w-40 truncate">{ancestor.name}</span>
              )}
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            {index === 0 && folded.length > 0 && (
              <>
                <BreadcrumbItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="flex size-6 cursor-pointer items-center justify-center rounded-sm hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                      aria-label={t("more")}
                    >
                      <BreadcrumbEllipsis />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {folded.map((ancestor) => (
                        <DropdownMenuItem
                          key={ancestor.id}
                          disabled={!isLink(ancestor)}
                          onClick={() => onOpen(ancestor)}
                        >
                          {ancestor.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </>
            )}
          </Fragment>
        ))}
        <BreadcrumbItem className="min-w-0">
          <BreadcrumbPage className="max-w-56 truncate font-semibold text-foreground">
            {current.name}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
