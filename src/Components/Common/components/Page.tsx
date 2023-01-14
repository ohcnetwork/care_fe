import PageTitle, { PageTitleProps } from "../PageTitle";

interface PageProps extends PageTitleProps {
  children: any;
  options?: any;
  className?: string;
}

export default function Page(props: PageProps) {
  return (
    <div
      className={`px-6 ${
        !props.hideBack || props.componentRight ? "py-3.5" : "py-5"
      } ${props.className}`}
    >
      <div className="flex justify-between items-center gap-10">
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
