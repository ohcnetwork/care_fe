import React, { ComponentType } from "react";

import { useView } from "@/Utils/useView";

export default function View({
  name,
  board,
  list,
}: {
  name: "resource";
  board: ComponentType;
  list: ComponentType;
}) {
  const [view] = useView(name, "board");

  const views: Record<"board" | "list", ComponentType> = {
    board,
    list,
  };

  const SelectedView = views[view as keyof typeof views] || board;

  return <SelectedView />;
}
