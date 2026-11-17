import { useMatches, useRouter } from "@tanstack/react-router";

import { Button, ButtonSize, ButtonVariant } from "@/components/ui/button";

type BackButtonProps = {
  children: React.ReactNode;
  variant?: ButtonVariant;
  className?: string;
  size?: ButtonSize;
  disabled?: boolean;
  /**
   * Where to go when there is no in-app history entry to return to (the page
   * was opened directly or reloaded). Defaults to the nearest parent route.
   */
  fallback?: string;
} & Omit<React.ComponentProps<"button">, "onClick">;

/**
 * Goes back in the browser history when the previous entry belongs to this
 * app. Otherwise it replaces the current entry with `fallback` or the
 * nearest parent route, so the user never leaves the app.
 */
export default function BackButton({
  children,
  variant = "outline",
  className,
  size = "default",
  disabled = false,
  fallback,
  ...props
}: BackButtonProps) {
  const router = useRouter();
  const matches = useMatches();

  const handleClick = () => {
    if (router.history.canGoBack()) {
      router.history.back();
      return;
    }
    const current = matches.at(-1)?.pathname;
    const parent = matches
      .slice()
      .reverse()
      .find((match) => match.pathname !== current)?.pathname;
    void router.navigate({ to: fallback ?? parent ?? "/", replace: true });
  };

  return (
    <Button
      {...props}
      type="button"
      variant={variant}
      onClick={handleClick}
      className={className}
      size={size}
      disabled={disabled}
    >
      {children}
    </Button>
  );
}
