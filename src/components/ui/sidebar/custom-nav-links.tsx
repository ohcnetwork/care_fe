import { Separator } from "@/components/ui/separator";
import { NavMain } from "@/components/ui/sidebar/nav-main";

import { useCustomNavLinks } from "@/hooks/useCustomNavLinks";

import type { NavScope } from "@/types/nav/customNavLink";

/**
 * Supplementary links above the user block in `SidebarFooter`.
 * Env: `REACT_CUSTOM_NAV_LINKS`; plugins: `customNavItems`.
 *
 * Uses `SidebarFooter`'s `p-2` for outer padding; `NavMain` gets `p-0` so
 * icon/text spacing matches main nav (`SidebarGroup` + `p-2` elsewhere).
 */
export function CustomNavLinks({ scope }: { scope: NavScope }) {
  const links = useCustomNavLinks(scope);

  if (links.length === 0) {
    return null;
  }

  return (
    <>
      <Separator className="mb-1 h-0 w-full bg-transparent border-t border-dotted border-sidebar-border" />
      <NavMain links={links} groupClassName="p-0" />
    </>
  );
}
