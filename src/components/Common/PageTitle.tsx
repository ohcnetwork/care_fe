import { ReactNode, useEffect, useRef } from "react";

import Breadcrumbs from "@/components/Common/Breadcrumbs";
import PageHeadTitle from "@/components/Common/PageHeadTitle";

import { classNames } from "@/Utils/utils";

export interface PageTitleProps {
  title: string;
  className?: string;
  componentRight?: ReactNode;
  breadcrumbs?: boolean;
  crumbsReplacements?: {
    [key: string]: { name?: string; uri?: string; style?: string };
  };
  focusOnLoad?: boolean;
  isInsidePage?: boolean;
  changePageMetadata?: boolean;
  // New props for Breadcrumbs
  hideBack?: boolean;
  backUrl?: string;
  onBackClick?: () => boolean | void;
}

export default function PageTitle({
  title,
  className = "",
  componentRight = <></>,
  breadcrumbs = true,
  crumbsReplacements = {},
  focusOnLoad = false,
  isInsidePage = false,
  changePageMetadata = true,
  // New props passed to Breadcrumbs
  hideBack = false,
  backUrl,
  onBackClick,
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
      className={classNames(!isInsidePage && "mb-2 md:mb-4", className)}
    >
      <div className="flex flex-col items-start md:flex-row md:items-center">
        {breadcrumbs && (
          <Breadcrumbs
            replacements={crumbsReplacements}
            className="flex-grow"
            hideBack={hideBack}
            backUrl={backUrl}
            onBackClick={onBackClick}
          />
        )}
      </div>
      {changePageMetadata && <PageHeadTitle title={title} />}

      <div
        className={classNames(
          "mt-2 flex items-center",
          !!componentRight &&
            "flex-col justify-start space-y-2 md:flex-row md:justify-between md:space-y-0",
        )}
      >
        <div className="flex items-center">
          <h2 className="ml-0 text-2xl leading-tight">{title}</h2>
        </div>
        {componentRight}
      </div>
    </div>
  );
}
