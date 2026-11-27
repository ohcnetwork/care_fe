import { Fragment, type ReactNode } from "react";
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

import { HrefLink } from "@/lib/router/HrefLink";
import { LocationRead } from "@/types/location/location";

interface LocationPathBreadcrumbProps {
  /** From the top down. */
  ancestors: LocationRead[];
  /** Leave out while it loads. */
  current?: LocationRead;
  onOpen: (location: LocationRead) => void;
  /** Without it, every parent is a link. */
  canOpen?: (ancestor: LocationRead, ancestors: LocationRead[]) => boolean;
  root?: ReactNode;
  /** Renders each parent as a link to this URL, not a button that calls `onOpen`. */
  getHref?: (ancestor: LocationRead) => string;
}

/**
 * Folds the parents between the top one and the direct parent into a "…" menu.
 * With a `root`, it is the top one.
 */
export function LocationPathBreadcrumb({
  ancestors,
  current,
  onOpen,
  canOpen,
  root,
  getHref,
}: LocationPathBreadcrumbProps) {
  const { t } = useTranslation();
  const isLink = (ancestor: LocationRead) =>
    !canOpen || canOpen(ancestor, ancestors);
  const folded = root
    ? ancestors.length > 1
      ? ancestors.slice(0, -1)
      : []
    : ancestors.length > 2
      ? ancestors.slice(1, -1)
      : [];
  const shown = ancestors.filter((ancestor) => !folded.includes(ancestor));
  const foldedMenu = folded.length > 0 && (
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
  );

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        {root && (
          <>
            <BreadcrumbItem className="shrink-0">{root}</BreadcrumbItem>
            {current && (
              <>
                <BreadcrumbSeparator />
                {foldedMenu}
              </>
            )}
          </>
        )}
        {shown.map((ancestor, index) => (
          <Fragment key={ancestor.id}>
            <BreadcrumbItem className="min-w-0">
              {isLink(ancestor) ? (
                <BreadcrumbLink asChild>
                  {getHref ? (
                    <HrefLink
                      href={getHref(ancestor)}
                      className="max-w-40 truncate"
                    >
                      {ancestor.name}
                    </HrefLink>
                  ) : (
                    <button
                      type="button"
                      className="max-w-40 cursor-pointer truncate"
                      onClick={() => onOpen(ancestor)}
                    >
                      {ancestor.name}
                    </button>
                  )}
                </BreadcrumbLink>
              ) : (
                <span className="max-w-40 truncate">{ancestor.name}</span>
              )}
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            {!root && index === 0 && foldedMenu}
          </Fragment>
        ))}
        {current && (
          <BreadcrumbItem className="min-w-0">
            <BreadcrumbPage className="max-w-56 truncate font-semibold text-foreground">
              {current.name}
            </BreadcrumbPage>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
