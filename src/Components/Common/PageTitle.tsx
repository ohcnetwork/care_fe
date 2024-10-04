import { ReactNode, useEffect, useRef } from "react";
import Breadcrumbs from "./Breadcrumbs";
import PageHeadTitle from "./PageHeadTitle";
import { classNames } from "../../Utils/utils";
import useAppHistory from "../../Common/hooks/useAppHistory";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { Button } from "@/Components/ui/button";

export interface PageTitleProps {
  title: string;
  hideBack?: boolean;
  backUrl?: string;
  className?: string;
  componentRight?: ReactNode;
  /**
   * If `false` is returned, prevents from going back.
   */
  onBackClick?: () => boolean | void;
  justifyContents?:
    | "justify-center"
    | "justify-start"
    | "justify-end"
    | "justify-between";
  breadcrumbs?: boolean;
  crumbsReplacements?: {
    [key: string]: { name?: string; uri?: string; style?: string };
  };
  focusOnLoad?: boolean;
  isInsidePage?: boolean;
  changePageMetadata?: boolean;
}

export default function PageTitle({
  title,
  hideBack = false,
  backUrl,
  className = "",
  onBackClick,
  componentRight = <></>,
  breadcrumbs = true,
  crumbsReplacements = {},
  justifyContents = "justify-start",
  focusOnLoad = false,
  isInsidePage = false,
  changePageMetadata = true,
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
      className={isInsidePage ? "" : `mb-2 md:mb-4 ${className}`}
    >
      <div className="flex flex-col items-start md:flex-row md:items-center">
        {!hideBack && (
          <>
            <Button
              variant="link"
              className="px-1 text-sm font-light text-gray-500 underline underline-offset-2"
              size="xs"
              onClick={() => {
                if (onBackClick && onBackClick() === false) return;
                goBack(backUrl);
              }}
            >
              <CareIcon
                icon="l-angle-left"
                className="-ml-2 h-4 text-gray-400"
              />
              <span className="pr-1">Back</span>
            </Button>
            <span className="hidden pr-1 text-xs font-light text-gray-400 no-underline md:block">
              |
            </span>
          </>
        )}
        {breadcrumbs && (
          <Breadcrumbs
            replacements={crumbsReplacements}
            className="flex-grow"
          />
        )}
      </div>
      {changePageMetadata && <PageHeadTitle title={title} />}

      <div className={classNames("mt-2 flex items-center", justifyContents)}>
        <div className="flex items-center">
          <h2 className="ml-0 text-2xl leading-tight">{title}</h2>
        </div>
        {componentRight}
      </div>
    </div>
  );
}
