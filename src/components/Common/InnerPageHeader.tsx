import { Link } from "raviger";
import { Fragment } from "react";

import { cn } from "@/lib/utils";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { AppSidebarToggle } from "@/components/ui/sidebar/sidebar-toggle";

interface InnerPageBreadcrumb {
  label: string;
  href?: string;
  hideOnMobile?: boolean;
}

interface InnerPageHeaderProps {
  breadcrumbs: InnerPageBreadcrumb[];
  dataCy: string;
}

export function InnerPageHeader({ breadcrumbs, dataCy }: InnerPageHeaderProps) {
  return (
    <header
      data-cy={dataCy}
      className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-3 border-b border-neutral-200 bg-white px-4 text-neutral-950"
    >
      <AppSidebarToggle />
      <span aria-hidden="true" className="h-5 w-px bg-neutral-200" />
      <Breadcrumb className="min-w-0">
        <BreadcrumbList className="flex-nowrap text-neutral-600">
          {breadcrumbs.map((item, index) => (
            <Fragment key={item.href ?? item.label}>
              <BreadcrumbItem
                className={cn("min-w-0", item.hideOnMobile && "hidden sm:flex")}
              >
                {item.href ? (
                  <BreadcrumbLink asChild>
                    <Link
                      basePath="/"
                      href={item.href}
                      className="truncate rounded-sm underline underline-offset-4 hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                    >
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="truncate text-neutral-950">
                    {item.label}
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {index < breadcrumbs.length - 1 && (
                <BreadcrumbSeparator
                  className={cn(item.hideOnMobile && "hidden sm:block")}
                />
              )}
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}
