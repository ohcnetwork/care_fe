import { cn } from "@/lib/utils";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface RadioInputProps extends React.ComponentProps<typeof RadioGroup> {
  options: {
    label: string;
    value: string;
  }[];
}

export default function RadioInput({ options, ...props }: RadioInputProps) {
  return (
    <RadioGroup
      {...props}
      className={cn(
        "flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 items-stretch",
        props.className,
      )}
    >
      {options.map((option) => (
        <div
          className={cn(
            "border rounded-md p-2 sm:p-3 basis-full sm:basis-auto cursor-pointer hover:border-primary-500 group",
            props.value === option.value
              ? "bg-primary-100 border-primary-500"
              : "bg-white border-gray-300",
          )}
          key={`${option.value}-${props.value}`} // to prevent race condition
          onClick={() => {
            if (!props.disabled) {
              if (props.value === option.value && !props.required) {
                props.onValueChange?.("");
              } else {
                props.onValueChange?.(option.value.toString());
              }
            }
          }}
        >
          <div className="flex items-center justify-start gap-1.5 sm:gap-2">
            <RadioGroupItem
              value={option.value.toString()}
              id={option.value}
              className="h-4 w-4 border-2 border-gray-300 text-primary focus:ring-primary group-hover:border-primary-500 flex-shrink-0"
            />
            <Label
              htmlFor={option.value}
              className="text-[10px] sm:text-xs font-medium leading-tight peer-disabled:cursor-not-allowed cursor-pointer peer-disabled:opacity-70 break-words min-w-0"
            >
              {option.label}
            </Label>
          </div>
        </div>
      ))}
    </RadioGroup>
  );
}
