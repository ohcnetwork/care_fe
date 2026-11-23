import { ReactNode } from "react";

import PageHeadTitle from "@/components/Common/PageHeadTitle";
import { useShortcutSubContext } from "@/context/ShortcutContext";

interface LocationPageProps {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}

export default function LocationPage({
  title,
  actions,
  children,
}: LocationPageProps) {
  useShortcutSubContext(undefined);

  return (
    <div className="space-y-6 p-4 text-neutral-950">
      <PageHeadTitle title={title} />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl leading-9 font-bold tracking-tight">{title}</h1>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
