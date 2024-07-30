interface Props {
  id?: string;
  className?: string;
  name?: string;
  onCheck: (value: boolean) => void;
  checked?: boolean;
  error?: string;
  required?: boolean;
  label?: React.ReactNode;
}

export default function Checkbox(props: Props) {
  const id = props.id || props.name;
  return (
    <div className={props.className}>
      <input
        className="checkbox__input hidden"
        type="checkbox"
        name={props.name}
        checked={props.checked}
        required={props.required}
        onChange={(event) => props.onCheck(event.target.checked)}
        id={id}
      />
      <label className="checkbox__label flex items-center" htmlFor={id}>
        <span>
          <svg width="11px" height="11px" viewBox="0 0 13 13">
            <polyline points="1.5 6 4.5 9 10.5 1" />
          </svg>
        </span>
        <span className="flex-1 text-sm font-semibold leading-loose">
          {" "}
          {props.label}{" "}
        </span>
      </label>
    </div>
  );
}
