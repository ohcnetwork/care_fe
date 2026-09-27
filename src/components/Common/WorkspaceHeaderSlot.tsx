import { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { useWorkspaceHeader } from "@/context/WorkspaceHeaderContext";

/** Keeps a stable portal target while page content replaces the header fallback. */
export function WorkspaceHeaderSlot({ children }: { children: ReactNode }) {
  const { hasContent, setTarget } = useWorkspaceHeader();

  return (
    <>
      <div
        ref={setTarget}
        className={cn(
          "order-last min-w-0 flex-1 basis-full sm:order-none sm:basis-auto",
          !hasContent && "hidden",
        )}
      />
      {!hasContent && children}
    </>
  );
}
