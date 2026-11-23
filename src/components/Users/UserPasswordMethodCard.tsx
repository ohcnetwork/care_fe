import { cn } from "@/lib/utils";

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroupItem } from "@/components/ui/radio-group";

interface UserPasswordMethodCardProps {
  value: string;
  selected: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  /** Rendered below the option text, aligned with it. Only for the selected option. */
  children?: React.ReactNode;
}

/** A bordered radio card of the "Password Setup Method" group. */
export function UserPasswordMethodCard({
  value,
  selected,
  icon,
  title,
  description,
  children,
}: UserPasswordMethodCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-md border",
        // Same checked colours as a CareUI FieldLabel radio card.
        selected
          ? "border-primary-600 bg-primary-50 dark:border-primary-500/50 dark:bg-primary-950/70"
          : "border-border",
      )}
    >
      <FieldLabel
        htmlFor={value}
        className="cursor-pointer has-data-checked:bg-transparent has-[>[data-slot=field]]:border-0"
      >
        <Field orientation="horizontal">
          <RadioGroupItem value={value} id={value} />
          <FieldContent>
            <FieldTitle>
              {icon}
              {title}
            </FieldTitle>
            <FieldDescription>{description}</FieldDescription>
          </FieldContent>
        </Field>
      </FieldLabel>
      {children && (
        // The inputs sit inside the radio group, which moves between options
        // with the arrow keys. Keep arrows for caret movement.
        <div
          className="pr-3 pb-3 pl-9"
          onKeyDown={(event) => {
            if (event.key.startsWith("Arrow")) event.stopPropagation();
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
