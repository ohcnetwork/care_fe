import { ReactNode, useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { BreadcrumbItem } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";

import PageHeadTitle from "@/components/Common/PageHeadTitle";

import useAppHistory from "@/hooks/useAppHistory";

export interface PageTitleProps {
  title: string;
  className?: string;
  componentRight?: ReactNode;
  focusOnLoad?: boolean;
  isInsidePage?: boolean;
  changePageMetadata?: boolean;
  hideBack?: boolean;
  backUrl?: string;
  hideTitleOnPage?: boolean;
  onBackClick?: () => boolean | void;
}

export default function PageTitle({
  title,
  className = "",
  componentRight = <></>,
  focusOnLoad = false,
  isInsidePage = false,
  changePageMetadata = true,
  hideBack = false,
  backUrl,
  onBackClick,
  hideTitleOnPage,
}: PageTitleProps) {
  const divRef = useRef<any>();
  const { goBack } = useAppHistory();

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
      <div className="flex flex-col items-start md:flex-row md:items-center">
        {!hideBack && (
          <BreadcrumbItem>
            <Button
              variant="link"
              type="button"
              className="rounded bg-gray-200/50 px-1 text-sm font-normal text-gray-800 transition hover:bg-gray-200/75 hover:no-underline"
              size="xs"
              onClick={() => {
                if (onBackClick && onBackClick() === false) return;
                // console.log(backUrl);
                goBack(backUrl);
              }}
            >
              <CareIcon icon="l-arrow-left" className="h-5 text-gray-700" />
              <span className="pr-2">Back</span>
            </Button>
          </BreadcrumbItem>
        )}
      </div>
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
