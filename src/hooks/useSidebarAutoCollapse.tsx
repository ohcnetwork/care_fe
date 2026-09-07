import React from "react";

import { useAppSidebar } from "@/components/ui/sidebar/app-sidebar-provider";

interface Options {
  restore?: boolean;
}

export const useSidebarAutoCollapse = ({ restore = true }: Options = {}) => {
  const sidebar = useAppSidebar();

  React.useEffect(() => {
    const initialState = sidebar.pinned;

    // Collapse the sidebar on mount if it is open
    if (sidebar.pinned) {
      sidebar.setPinned(false);
    }

    return () => {
      // Restore to the initial state when the component unmounts if necessary
      if (restore) {
        sidebar.setPinned(initialState);
      }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
