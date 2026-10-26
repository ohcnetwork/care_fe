import { Input } from "@/components/ui/input";
import { useState } from "react";

/** Keep in-progress numeric text local so a partial decimal is not rewritten
 * from the last committed number before the user finishes typing. */
export function NumericConditionInput({
  value,
  onChange,
  "aria-label": ariaLabel,
}: {
  value: string | number | boolean;
  onChange: (next: number) => void;
  "aria-label"?: string;
}) {
  const [buffer, setBuffer] = useState<string | null>(null);
  return (
    <Input
      type="number"
      aria-label={ariaLabel}
      value={buffer ?? String(value ?? "")}
      onChange={(e) => {
        setBuffer(e.target.value);
        if (e.target.value !== "" && !Number.isNaN(e.target.valueAsNumber)) {
          onChange(e.target.valueAsNumber);
        }
      }}
      onBlur={() => setBuffer(null)}
    />
  );
}
