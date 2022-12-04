import React, { useEffect, useRef } from "react";
import Breadcrumbs from "./Breadcrumbs";
import PageHeadTitle from "./PageHeadTitle";
import { classNames, goBack } from "../../Utils/utils";

interface PageTitleProps {
  title: string;
  hideBack?: boolean;
  backUrl?: string;
  backButtonCB?: () => number | void;
  className?: string;
  componentRight?: React.ReactNode;
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
}

export default function PageTitle({
  title,
  hideBack = false,
  backUrl,
  backButtonCB,
  className = "",
  componentRight = <></>,
  breadcrumbs = true,
  crumbsReplacements = {},
  justifyContents = "justify-start",
  focusOnLoad = false,
}: PageTitleProps) {
  const divRef = useRef<any>();

  useEffect(() => {
    if (divRef.current && focusOnLoad) {
      divRef.current.scrollIntoView();
    }
  }, [divRef, focusOnLoad]);

  const onBackButtonClick = () =>
    backButtonCB ? goBack(backButtonCB()) : goBack(backUrl);

  return (
    <div ref={divRef} className={`pt-4 mb-4 ${className}`}>
      <PageHeadTitle title={title} />
      <div className={classNames("flex items-center", justifyContents)}>
        <div className="flex items-center">
          {!hideBack && (
            <button onClick={onBackButtonClick}>
              <i className="fas fa-chevron-left text-2xl rounded-md p-2 hover:bg-gray-200 mr-1">
                {" "}
              </i>
            </button>
          )}
          <h2 className="font-semibold text-2xl leading-tight ml-0">{title}</h2>
        </div>
        {componentRight}
      </div>
      <div className={hideBack ? "my-2" : "ml-8 my-2"}>
        {breadcrumbs && <Breadcrumbs replacements={crumbsReplacements} />}
      </div>
    </div>
  );
}
