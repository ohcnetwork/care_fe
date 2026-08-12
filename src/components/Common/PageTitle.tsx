import { ReactNode } from "react";

import { cn } from "@/lib/utils";

import PageHeadTitle from "@/components/Common/PageHeadTitle";

export interface PageTitleProps {
  title: string;
  className?: string;
  componentRight?: ReactNode;
  isInsidePage?: boolean;
  changePageMetadata?: boolean;
  hideTitleOnPage?: boolean;
}

export default function PageTitle({
  title,
  className = "",
  componentRight = <></>,
  isInsidePage = false,
  changePageMetadata = true,
  hideTitleOnPage,
}: PageTitleProps) {
  return (
    <div className={cn(!isInsidePage && "mb-2 md:mb-4", className)}>
      {changePageMetadata && <PageHeadTitle title={title} />}

      <div
        className={cn(
          "mt-1 flex",
          !!componentRight &&
            "flex-col justify-start space-y-2 md:flex-row md:justify-between md:space-y-0",
        )}
      >
        <div className="flex items-center">
          {!hideTitleOnPage && (
            <h2 className="ml-0 text-2xl leading-tight">{title}</h2>
          )}
        </div>
        {componentRight}
      </div>
    </div>
  );
}
