import { ReactNode, useEffect, useRef } from "react";
import Breadcrumbs from "./Breadcrumbs";
import PageHeadTitle from "./PageHeadTitle";
import { classNames } from "../../Utils/utils";
import useAppHistory from "../../Common/hooks/useAppHistory";
import CareIcon from "../../CAREUI/icons/CareIcon";

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

  useEffect(() => {
    if (divRef.current && focusOnLoad) {
      divRef.current.scrollIntoView();
    }
  }, [divRef, focusOnLoad]);

  const { goBack } = useAppHistory();

  return (
    <div
      ref={divRef}
      className={isInsidePage ? "" : `mb-2 pt-4 md:mb-4 ${className}`}
    >
      {changePageMetadata && <PageHeadTitle title={title} />}
      <div className={classNames("flex items-center", justifyContents)}>
        <div className="flex items-center">
          {!hideBack && (
            <button
              onClick={() => {
                if (onBackClick && onBackClick() === false) return;
                goBack(backUrl);
              }}
            >
              <CareIcon
                icon="l-angle-left"
                className="border-box mr-1 rounded-md text-5xl hover:bg-gray-200"
              />{" "}
            </button>
          )}
          <h2 className="ml-0 text-2xl font-semibold leading-tight">{title}</h2>
        </div>
        {componentRight}
      </div>
      <div className={hideBack ? "my-2" : "my-2 ml-8"}>
        {breadcrumbs && <Breadcrumbs replacements={crumbsReplacements} />}
      </div>
    </div>
  );
}
