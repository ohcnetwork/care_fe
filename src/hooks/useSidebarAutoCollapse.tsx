import React from "react";

import { useSidebar } from "@/components/ui/sidebar";

interface Options {
  restore?: boolean;
}

export const useSidebarAutoCollapse = ({ restore = true }: Options = {}) => {
  const sidebar = useSidebar();

  React.useEffect(() => {
    const initialState = sidebar.open;

    // Collapse the sidebar on mount if it is open
    if (sidebar.open) {
      sidebar.setOpen(false);
    }

    return () => {
      // Restore to the initial state when the component unmounts if necessary
      if (restore) {
        sidebar.setOpen(initialState);
      }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
