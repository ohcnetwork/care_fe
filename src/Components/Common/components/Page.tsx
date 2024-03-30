import { RefObject, useContext, useEffect } from "react";
import PageTitle, { PageTitleProps } from "../PageTitle";
import { classNames } from "../../../Utils/utils";
import { SidebarShrinkContext } from "../Sidebar/Sidebar";

interface PageProps extends PageTitleProps {
  children: React.ReactNode | React.ReactNode[];
  options?: React.ReactNode | React.ReactNode[];
  changePageMetadata?: boolean;
  className?: string;
  noImplicitPadding?: boolean;
  ref?: RefObject<HTMLDivElement>;
  /**
   * If true, the sidebar will be collapsed when mounted, and restored to original state when unmounted.
   * @default false
   **/
  collapseSidebar?: boolean;
}

export default function Page(props: PageProps) {
  const sidebar = useContext(SidebarShrinkContext);

  useEffect(() => {
    if (!props.collapseSidebar) return;

    sidebar.setShrinked(true);
    return () => {
      sidebar.setShrinked(sidebar.shrinked);
    };
  }, [props.collapseSidebar]);

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
          changePageMetadata={props.changePageMetadata}
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
