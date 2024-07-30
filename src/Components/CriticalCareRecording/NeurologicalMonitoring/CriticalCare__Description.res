let str = React.string

let handleOnChange = (onChange, event) => {
  let value = ReactEvent.Form.target(event)["value"]
  onChange(value)
}

@react.component
let make = (~name, ~text, ~onChange, ~label=name) => {
  <div className="mt-4">
    <label htmlFor={name} className="block mt-2"> {str(label)} </label>
    <textarea
      id={name}
      className="block w-full border-secondary-500 border-2 rounded px-2 py-1 mt-2"
      rows=3
      value={text}
      onChange={handleOnChange(onChange)}
    />
  </div>
}
