import { Button, ButtonSize, ButtonVariant } from "@/components/ui/button";

type BackButtonProps = {
  children: React.ReactNode;
  variant?: ButtonVariant;
  className?: string;
  size?: ButtonSize;
  disabled?: boolean;
};
export default function BackButton({
  children,
  variant = "outline",
  className,
  size = "default",
  disabled = false,
}: BackButtonProps) {
  return (
    <Button
      type="button"
      variant={variant}
      onClick={() => history.back()}
      className={className}
      size={size}
      disabled={disabled}
    >
      {children}
    </Button>
  );
}
