import { ReactNode } from "react";

import { cn } from "@/lib/utils";

import PageHeadTitle from "@/components/Common/PageHeadTitle";

export interface PageTitleProps {
  title: string;
  className?: string;
  componentRight?: ReactNode;
  actions?: ReactNode;
  isInsidePage?: boolean;
  changePageMetadata?: boolean;
  hideTitleOnPage?: boolean;
}

export default function PageTitle({
  title,
  className = "",
  componentRight,
  actions,
  isInsidePage = false,
  changePageMetadata = true,
  hideTitleOnPage,
}: PageTitleProps) {
  return (
    <div className={cn(!isInsidePage && "mb-2 md:mb-4", className)}>
      {changePageMetadata && <PageHeadTitle title={title} />}

      <div className="mt-1 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2 *:min-w-0">
          {!hideTitleOnPage && (
            <h2 className="text-2xl leading-tight">{title}</h2>
          )}
          {componentRight}
        </div>
        {/* Block on mobile so full-width option wrappers can shrink to fit */}
        <div className="empty:hidden md:flex md:flex-wrap md:items-center md:justify-end md:gap-2">
          {actions}
        </div>
      </div>
    </div>
  );
}
