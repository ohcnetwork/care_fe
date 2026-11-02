import { Button, ButtonSize, ButtonVariant } from "@/components/ui/button";
import { navigate } from "raviger";

type BackButtonProps = {
  children: React.ReactNode;
  to?: string;
  replace?: boolean;
  variant?: ButtonVariant;
  className?: string;
  size?: ButtonSize;
  disabled?: boolean;
} & Omit<React.ComponentProps<"button">, "onClick">;
export default function BackButton({
  children,
  to,
  replace = true,
  variant = "outline",
  className,
  size = "default",
  disabled = false,
  ...props
}: BackButtonProps) {
  return (
    <Button
      {...props}
      type="button"
      variant={variant}
      onClick={() => {
        if (to) {
          navigate(to, { replace });
        } else {
          history.back();
        }
      }}
      className={className}
      size={size}
      disabled={disabled}
    >
      {children}
    </Button>
  );
}
