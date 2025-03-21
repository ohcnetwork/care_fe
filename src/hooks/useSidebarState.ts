import { useMemo } from "react";

export default function useSidebarState() {
  return useMemo(() => {
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("sidebar:state"));

    if (cookie) {
      const value = cookie.split("=")[1];
      return value === "true";
    }

    return false;
  }, []);
}
