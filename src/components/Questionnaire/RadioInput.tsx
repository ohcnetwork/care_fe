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
      className={cn("flex flex-wrap gap-4", props.className)}
    >
      {options.map((option) => (
        <div
          className={cn(
            "border rounded-md p-2 w-full cursor-pointer sm:w-auto hover:border-primary-500 group text-left",
            props.value === option.value
              ? "bg-primary-100 border-primary-500"
              : "bg-white border-gray-300",
          )}
          key={`${option.value}-${props.value}`} // to prevent race condition
          onClick={() => {
            if (!props.disabled) {
              props.onValueChange?.(option.value.toString());
            }
          }}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value={option.value.toString()}
              id={option.value}
              className="h-4 w-4 border-2 border-gray-300 text-primary focus:ring-primary group-hover:border-primary-500"
            />
            <Label
              htmlFor={option.value}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed cursor-pointer peer-disabled:opacity-70"
            >
              {option.label}
            </Label>
          </div>
        </div>
      ))}
    </RadioGroup>
  );
}
