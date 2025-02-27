import { ReactNode, useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

import PageHeadTitle from "@/components/Common/PageHeadTitle";

export interface PageTitleProps {
  title: string;
  className?: string;
  componentRight?: ReactNode;
  focusOnLoad?: boolean;
  isInsidePage?: boolean;
  changePageMetadata?: boolean;
  hideTitleOnPage?: boolean;
}

export default function PageTitle({
  title,
  className = "",
  componentRight = <></>,
  focusOnLoad = false,
  isInsidePage = false,
  changePageMetadata = true,
  hideTitleOnPage,
}: PageTitleProps) {
  const divRef = useRef<any>();

  useEffect(() => {
    if (divRef.current && focusOnLoad) {
      divRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [divRef, focusOnLoad]);

  return (
    <div
      ref={divRef}
      className={cn(!isInsidePage && "mb-2 md:mb-4", className)}
    >
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
