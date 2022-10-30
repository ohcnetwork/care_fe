import clsx from "clsx";

type _button = {
  label: string;
  value: string;
  disabled?: boolean;
};

interface Props {
  name?: string;
  label?: string;
  buttons: string[] | _button[];
  selected: string;
  onChange: (value: string) => void;
}

const ToggleButtons = ({ name, label, buttons, onChange, selected }: Props) => {
  if (!buttons.length) return null;

  const _buttons = buttons.map((button) => {
    if (typeof button === "string") {
      return { label: button, value: button, disabled: false };
    }
    return button;
  });

  return (
    <div id={name}>
      {label && <label className="text-sm font-normal mb-1">{label}</label>}
      <span className="flex items-center justify-center">
        {_buttons.map((_button, i) => (
          <button
            type="button"
            key={_button.value}
            className={clsx(
              "relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:z-10 focus:outline-none",
              selected === _button.value
                ? "bg-primary-500 text-white"
                : "hover:bg-gray-200",
              i === 0 ? "rounded-l-md" : "-ml-px",
              i === buttons.length - 1 && "rounded-r-md"
            )}
            onClick={() => onChange(_button.value)}
            disabled={_button.disabled}
          >
            <span>{_button.label}</span>
          </button>
        ))}
      </span>
    </div>
  );
};

export default ToggleButtons;
