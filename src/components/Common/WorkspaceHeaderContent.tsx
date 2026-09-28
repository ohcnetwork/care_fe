import { ReactNode, useId, useLayoutEffect } from "react";
import { createPortal } from "react-dom";

import { useWorkspaceHeader } from "@/context/WorkspaceHeaderContext";

/** Renders page-owned controls in the app header, preserving their page context. */
export function WorkspaceHeaderContent({ children }: { children: ReactNode }) {
  const { target, register } = useWorkspaceHeader();
  const id = useId();

  useLayoutEffect(() => register(id), [id, register]);

  return target
    ? createPortal(
        <div
          className="flex min-w-0 flex-1 items-center"
          onKeyDown={(event) => {
            // Native control activation takes precedence over page shortcuts.
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.ctrlKey &&
              !event.metaKey &&
              !event.altKey
            ) {
              event.stopPropagation();
            }
          }}
        >
          {children}
        </div>,
        target,
      )
    : null;
}
