import { ErrorHelperText } from "../HelperInputFields";

type RadioValue = string | ReadonlyArray<string> | number | undefined;

interface Props<T extends RadioValue> {
  className?: string;
  label?: string;
  name?: string;
  options: {
    label: React.ReactNode;
    value: T;
  }[];
  onSelect: (value: T) => void;
  selected?: T;
  error?: string;
  required?: boolean;
}

export default function RadioInputs<T extends RadioValue>(props: Props<T>) {
  return (
    <div className={props.className}>
      {props.label && (
        <label htmlFor="is_working">
          {props.label}
          {props.required && " *"}
        </label>
      )}
      <div className="flex gap-4 p-4">
        {props.options.map((option, idx) => {
          return (
            <div className="flex gap-2 items-center">
              <input
                className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500 rounded-full focus:ring-2"
                type="radio"
                id={`${props.name}-${idx}`}
                name={props.name}
                value={option.value}
                checked={option.value === props.selected}
                onChange={() => props.onSelect(option.value)}
              />
              <label htmlFor={`${props.name}-${idx}`}>{option.label}</label>
            </div>
          );
        })}
      </div>
      <ErrorHelperText error={props.error} />
    </div>
  );
}
