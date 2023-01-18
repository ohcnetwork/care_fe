interface Props {
  id?: string;
  className?: string;
  name?: string;
  onCheck: (value: boolean) => void;
  checked?: boolean;
  error?: string;
  required?: boolean;
  label?: string;
}

export default function Checkbox(props: Props) {
  return (
    <div className={props.className} id={props.id}>
      <div className="flex gap-4 py-2">
        <input
          className="focus:outline-none focus:ring-0 focus:ring-offset-0 rounded-none"
          type="checkbox"
          name={props.name}
          checked={props.checked}
          required={props.required}
          onChange={(event) => props.onCheck(event.target.checked)}
        />
        <label htmlFor={props.name}>{props.label}</label>
      </div>
    </div>
  );
}
