type SwitchProps<T> = {
  name?: string;
  className?: string;
  label?: string;
  value?: T;
  options: T[];
  optionLabel?: (option: T) => string;
  //   optionIcon?: (option: T) => React.ReactNode;
  required?: boolean;
  onChange: (option: T) => void;
  errors?: string;
};

export default function SwitchV2<T>(props: SwitchProps<T>) {
  return (
    <div className={props.className}>
      {props.label && (
        <label htmlFor="is_working" className="mb-3">
          {props.label}
          {props.required && " *"}
        </label>
      )}
      <ul role="list" className="flex">
        {props.options.map((option, index) => {
          const selected = option === props.value;
          return (
            <li
              tabIndex={0}
              className="active:bg-gray-500 cursor-pointer px-4 p-2 first:rounded-l-lg last:rounded-r-lg shadow-sm bg-gray-50 hover:bg-gray-200 focus:ring-primary-500 border focus:ring-1 ring-gray-400 focus:border-primary-500 border-gray-400 transition-all duration-200 ease-in-out outline-none"
              key={index}
              onClick={() => props.onChange(option)}
            >
              <span
                className={`select-none text-sm ${
                  selected ? "font-semibold" : "font-medium"
                }`}
              >
                {(props.optionLabel && props.optionLabel(option)) ||
                  String(option)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
