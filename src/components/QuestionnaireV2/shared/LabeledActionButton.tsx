import { Button } from "@/components/ui/button";

interface LabeledActionButtonProps {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode; // icon + text
}

export function LabeledActionButton({
  label,
  onClick,
  disabled,
  children,
}: LabeledActionButtonProps) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-gray-500">{label}</p>
      <Button
        type="button"
        variant="outline"
        onClick={onClick}
        disabled={disabled}
      >
        {children}
      </Button>
    </div>
  );
}
