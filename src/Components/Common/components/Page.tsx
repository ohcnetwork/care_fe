import { RefObject } from "react";
import PageTitle, { PageTitleProps } from "../PageTitle";
import { classNames } from "../../../Utils/utils";

interface PageProps extends PageTitleProps {
  children: any;
  options?: any;
  className?: string;
  noImplicitPadding?: boolean;
  ref?: RefObject<HTMLDivElement>;
}

export default function Page(props: PageProps) {
  let padding = "";
  if (!props.noImplicitPadding) {
    if (!props.hideBack || props.componentRight)
      padding = "md:px-6 px-3 py-3.5";
    else padding = "px-6 py-5";
  }

  return (
    <div className={classNames(padding, props.className)} ref={props.ref}>
      <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center md:gap-6">
        <PageTitle
          title={props.title}
          breadcrumbs={props.breadcrumbs}
          backUrl={props.backUrl}
          hideBack={props.hideBack}
          justifyContents={props.justifyContents}
          componentRight={props.componentRight}
          crumbsReplacements={props.crumbsReplacements}
          focusOnLoad={props.focusOnLoad}
          onBackClick={props.onBackClick}
          isInsidePage={true}
        />
        {props.options}
      </div>
      {props.children}
    </div>
  );
}
