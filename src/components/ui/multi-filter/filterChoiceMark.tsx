import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface FilterChoiceMarkProps {
  multiple: boolean;
  checked: boolean;
  compact?: boolean;
}

/** The enclosing menu item or listbox option owns all input and selection semantics. */
export function FilterChoiceMark({
  multiple,
  checked,
  compact,
}: FilterChoiceMarkProps) {
  return (
    <span inert aria-hidden="true" className="pointer-events-none shrink-0">
      {multiple ? (
        <Checkbox
          checked={checked}
          readOnly
          size={compact ? "md" : "default"}
        />
      ) : (
        <RadioGroup
          render={<span />}
          value={checked ? "selected" : ""}
          readOnly
        >
          <RadioGroupItem value="selected" />
        </RadioGroup>
      )}
    </span>
  );
}
