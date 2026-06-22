import { NavMain } from "@/components/ui/sidebar/nav-main";

import { useCustomNavLinks } from "@/hooks/useCustomNavLinks";

import { NavScope } from "@/types/nav/customNavLink";

/**
 * Renders configuration- and plugin-provided custom links for the given sidebar
 * scope. Returns nothing when no links apply, so it is safe to mount in every
 * sidebar context.
 */
export function CustomNavLinks({ scope }: { scope: NavScope }) {
  const links = useCustomNavLinks(scope);

  if (links.length === 0) {
    return null;
  }

  return <NavMain links={links} />;
}
