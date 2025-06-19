import { cn } from "@/lib/utils";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { properCase } from "@/Utils/utils";
import { AnswerOption, Question } from "@/types/questionnaire/question";

interface RadioInputProps {
  options: AnswerOption[];
  selectedValue: string;
  handleValueChange: (value: string) => void;
  disabled?: boolean;
  question: Question;
}

export default function RadioInput({
  options,
  selectedValue,
  handleValueChange,
  disabled,
  question,
}: RadioInputProps) {
  return (
    <RadioGroup
      onValueChange={handleValueChange}
      disabled={disabled}
      className="flex flex-wrap gap-4 ml-2"
      value={selectedValue}
    >
      {options.map((option) => (
        <button
          type="button"
          className={cn(
            "border rounded-md p-2 w-full cursor-pointer sm:w-auto hover:border-primary-500 group text-left",
            selectedValue === option.value
              ? "bg-primary-100 border-primary-500"
              : "bg-white border-gray-300",
          )}
          key={`${question.id}-${option.value.toString()}`}
          onClick={() => handleValueChange(option.value.toString())}
          disabled={disabled}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value={option.value.toString()}
              id={`${question.id}-${option.value.toString()}`}
              className="h-4 w-4 border-2 border-gray-300 text-primary focus:ring-primary group-hover:border-primary-500"
            />
            <Label
              htmlFor={`${question.id}-${option.value.toString()}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed cursor-pointer peer-disabled:opacity-70"
            >
              {properCase(option.display || option.value)}
            </Label>
          </div>
        </button>
      ))}
    </RadioGroup>
  );
}
