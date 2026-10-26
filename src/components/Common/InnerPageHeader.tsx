import { Link } from "raviger";
import { Fragment } from "react";

import { cn } from "@/lib/utils";

import { WorkspaceHeaderSlot } from "@/components/Common/WorkspaceHeaderSlot";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
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
      data-cui-app-header
      className="sticky top-0 z-10 flex min-h-12 shrink-0 items-center gap-3 border-b border-border bg-background px-4 py-1.5 text-foreground"
    >
      <AppSidebarToggle />
      <WorkspaceHeaderSlot>
        <Separator orientation="vertical" />
        <Breadcrumb className="min-w-0">
          <BreadcrumbList className="flex-nowrap">
            {breadcrumbs.map((item, index) => (
              <Fragment key={item.href ?? item.label}>
                <BreadcrumbItem
                  className={cn(
                    "min-w-0",
                    item.hideOnMobile && "hidden sm:flex",
                  )}
                >
                  {item.href ? (
                    <BreadcrumbLink asChild>
                      <Link
                        basePath="/"
                        href={item.href}
                        className="truncate rounded-sm underline underline-offset-4 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                      >
                        {item.label}
                      </Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage className="truncate text-foreground">
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
      </WorkspaceHeaderSlot>
    </header>
  );
}
