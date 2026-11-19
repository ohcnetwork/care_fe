import { Button, ButtonSize, ButtonVariant } from "@/components/ui/button";

import { goBack } from "@/Utils/utils";

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

/** A button that runs `goBack()`: it never leaves the app. */
export default function BackButton({
  children,
  variant = "outline",
  className,
  size = "default",
  disabled = false,
  fallback,
  ...props
}: BackButtonProps) {
  return (
    <Button
      {...props}
      type="button"
      variant={variant}
      onClick={() => goBack(fallback)}
      className={className}
      size={size}
      disabled={disabled}
    >
      {children}
    </Button>
  );
}
