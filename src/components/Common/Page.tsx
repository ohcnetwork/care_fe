import { cn } from "@/lib/utils";

import PageTitle, { PageTitleProps } from "@/components/Common/PageTitle";

interface PageProps extends PageTitleProps {
  children: React.ReactNode | React.ReactNode[];
  options?: React.ReactNode | React.ReactNode[];
  changePageMetadata?: boolean;
  className?: string;
  hideTitleOnPage?: boolean;
}

export default function Page(props: PageProps) {
  return (
    <div className={cn("md:px-6 py-0", props.className)}>
      <div className="flex flex-col justify-between gap-2 px-3 md:flex-row md:items-center md:gap-6 md:px-0">
        <PageTitle
          changePageMetadata={props.changePageMetadata}
          title={props.title}
          componentRight={props.componentRight}
          isInsidePage={true}
          hideTitleOnPage={props.hideTitleOnPage}
        />
        {props.options}
      </div>
      {props.children}
    </div>
  );
}
