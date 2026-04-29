import { useAtomValue } from "jotai";
import { useMemo } from "react";

import useAuthUser from "@/hooks/useAuthUser";

import { WidgetRunner } from "@/components/AIWidgets/WidgetRunner";
import { widgetsAtomFor } from "@/components/AIWidgets/store";

interface Props {
  encounterId: string;
}

export function WidgetSlot({ encounterId }: Props) {
  const authUser = useAuthUser();
  const widgetsAtom = useMemo(
    () => widgetsAtomFor(authUser.id ?? authUser.username),
    [authUser.id, authUser.username],
  );
  const widgets = useAtomValue(widgetsAtom);
  const enabled = widgets.filter((w) => w.enabled);

  if (enabled.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {enabled.map((w) => (
        <WidgetRunner key={w.id} widget={w} encounterId={encounterId} />
      ))}
    </div>
  );
}
