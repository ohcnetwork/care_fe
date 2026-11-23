import { useMatches } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import {
  InnerPageBreadcrumb,
  InnerPageHeader,
} from "@/components/Common/InnerPageHeader";

import type { Crumb } from "@/lib/router/staticData";

interface BreadcrumbsProps {
  dataCy: string;
  /** Crumbs shown before the route crumbs (for example, the facility). */
  leading?: InnerPageBreadcrumb[];
}

interface CrumbSource {
  id: string;
  pathname: string;
  params: Record<string, string>;
  loaderData: unknown;
  staticData: { crumb?: Crumb };
}

/**
 * Breadcrumbs derived from the matched routes. Each route that sets
 * `staticData.crumb` adds one crumb; the last crumb is the current page.
 * On small screens only the last 2 crumbs stay visible.
 */
export function Breadcrumbs({ dataCy, leading = [] }: BreadcrumbsProps) {
  const { t } = useTranslation();
  const matches = useMatches() as unknown as CrumbSource[];

  const routeCrumbs: InnerPageBreadcrumb[] = matches
    .filter((match) => match.staticData.crumb !== undefined)
    .map((match) => {
      const crumb = match.staticData.crumb as Crumb;
      return {
        label:
          typeof crumb === "string"
            ? t(crumb)
            : crumb({
                params: match.params,
                loaderData: match.loaderData,
                pathname: match.pathname,
              }),
        href: match.pathname,
      };
    });

  const items = [...leading, ...routeCrumbs];
  const breadcrumbs = items.map((item, index) => ({
    ...item,
    href: index === items.length - 1 ? undefined : item.href,
    hideOnMobile: index < items.length - 2,
  }));

  return <InnerPageHeader dataCy={dataCy} breadcrumbs={breadcrumbs} />;
}

/** True when at least one matched route defines a crumb. */
export function useHasRouteCrumbs() {
  const matches = useMatches() as unknown as CrumbSource[];
  return matches.some((match) => match.staticData.crumb !== undefined);
}
