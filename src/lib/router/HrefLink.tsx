import { type ComponentPropsWithoutRef, forwardRef } from "react";

import { navigate } from "@/lib/router/navigate";

export interface HrefLinkProps extends ComponentPropsWithoutRef<"a"> {
  /** An app path, a relative URL or a URL on another origin. */
  href: string;
  /** Replace the current history entry, not push a new one. */
  replace?: boolean;
}

function isPlainLeftClick(
  event: React.MouseEvent<HTMLAnchorElement>,
  target?: string,
) {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !(target && target !== "_self") &&
    !(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
  );
}

/**
 * A link to a URL that is built at runtime, such as a URL from the API. Use
 * `Link` from `@tanstack/react-router` with `to` and `params` when the target
 * route is known.
 *
 * It renders a plain anchor. A left click goes through the router
 * (`navigate`); a relative `href` resolves against the current URL, and a URL
 * on another origin loads that page. Unlike `Link`, it does not preload the
 * route and does not set `aria-current` or `data-status`: the caller owns the
 * active state.
 */
export const HrefLink = forwardRef<HTMLAnchorElement, HrefLinkProps>(
  function HrefLink({ href, replace, onClick, ...props }, ref) {
    return (
      <a
        {...props}
        href={href}
        ref={ref}
        onClick={(event) => {
          try {
            onClick?.(event);
          } catch (error) {
            event.preventDefault();
            throw error;
          }
          if (isPlainLeftClick(event, props.target)) {
            event.preventDefault();
            navigate({ href: event.currentTarget.href, replace });
          }
        }}
      />
    );
  },
);
