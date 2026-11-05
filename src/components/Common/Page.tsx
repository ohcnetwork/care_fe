import { cn } from "@/lib/utils";

import PageTitle, { PageTitleProps } from "@/components/Common/PageTitle";
import { useShortcutSubContext } from "@/context/ShortcutContext";

interface PageProps extends PageTitleProps {
  children: React.ReactNode | React.ReactNode[];
  options?: React.ReactNode | React.ReactNode[];
  changePageMetadata?: boolean;
  className?: string;
  hideTitleOnPage?: boolean;
  shortCutContext?: string;
  style?: React.CSSProperties;
}

export default function Page(props: PageProps) {
  useShortcutSubContext(props.shortCutContext);

  return (
    <div className={cn("py-4", props.className)} style={props.style}>
      <div>
        <PageTitle
          changePageMetadata={props.changePageMetadata}
          title={props.title}
          componentRight={props.componentRight}
          actions={props.options}
          isInsidePage={true}
          hideTitleOnPage={props.hideTitleOnPage}
        />
      </div>
      {props.children}
    </div>
  );
}
