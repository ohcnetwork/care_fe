import React, { ComponentType } from "react";

import { useView } from "@/Utils/useView";

export default function View({
  name,
  board,
  list,
}: {
  name: string;
  board: ComponentType<{ setView: (view: string) => void }>;
  list: ComponentType<{ setView: (view: string) => void }>;
}) {
  const [view, setView] = useView(`${name}DefaultView`);

  const views: Record<
    "board" | "list",
    ComponentType<{ setView: (view: string) => void }>
  > = {
    board,
    list,
  };

  const SelectedView = views[view as keyof typeof views] || board;

  return <SelectedView setView={setView} />;
}
