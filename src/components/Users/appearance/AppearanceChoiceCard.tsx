import { ReactNode } from "react";

import { Label } from "@/components/ui/label";
import { RadioGroupItem } from "@/components/ui/radio-group";

import { cn } from "@/lib/utils";

interface AppearanceChoiceCardProps {
  id: string;
  value: string;
  selected: boolean;
  children: ReactNode;
  className?: string;
}

/** CareUI settings preview card with the shared radio group's keyboard behavior. */
export function AppearanceChoiceCard({
  id,
  value,
  selected,
  children,
  className,
}: AppearanceChoiceCardProps) {
  return (
    <Label
      htmlFor={id}
      className={cn(
        "relative flex min-w-0 cursor-pointer flex-col items-stretch gap-2 rounded-lg border p-3 text-left font-normal leading-normal transition-all duration-150 active:scale-[0.98] has-focus-visible:ring-2 has-focus-visible:ring-ring has-focus-visible:ring-offset-2 has-focus-visible:ring-offset-background",
        selected
          ? "border-primary bg-primary/5 ring-2 ring-primary/30"
          : "border-border hover:border-strong-border hover:bg-muted/50",
        className,
      )}
    >
      <RadioGroupItem id={id} value={value} className="sr-only absolute" />
      {children}
    </Label>
  );
}
