import { RefObject } from "react";
import PageTitle, { PageTitleProps } from "../PageTitle";

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
    if (!props.hideBack || props.componentRight) padding = "px-6 py-3.5";
    else padding = "px-6 py-5";
  }

  return (
    <div className={`${padding} ${props.className}`} ref={props.ref}>
      <div className="flex flex-col md:flex-row justify-between md:items-center md:gap-6 gap-2">
        <PageTitle
          title={props.title}
          breadcrumbs={props.breadcrumbs}
          backUrl={props.backUrl}
          hideBack={props.hideBack}
          justifyContents={props.justifyContents}
          componentRight={props.componentRight}
          crumbsReplacements={props.crumbsReplacements}
          focusOnLoad={props.focusOnLoad}
          backButtonCB={props.backButtonCB}
        />
        {props.options}
      </div>
      {props.children}
    </div>
  );
}
