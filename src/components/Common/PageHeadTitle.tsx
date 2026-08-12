import { ReactNode, useEffect } from "react";

export interface IPageTitleProps {
  title: ReactNode;
}

export default function PageHeadTitle({ title }: IPageTitleProps) {
  useEffect(() => {
    const prevTitle = document.title;
    if (title) {
      document.title = title + " | Care";
    } else {
      document.title = "Care";
    }
    return () => {
      document.title = prevTitle;
    };
  }, [title]);

  return <></>;
}
