let str = React.string

@react.component
let make = (
  ~title,
  ~id=title,
  ~name=title,
  ~value=title,
  ~children,
  ~onChange,
  ~defaultChecked=false,
) => {
  let (checked, setChecked) = React.useState(_ => defaultChecked)
  let handleChange = _ => {
    onChange(!checked)
    setChecked(prev => !prev)
  }

  <>
    <label htmlFor={title} className="mb-6 block">
      <input
        type_="checkbox"
        className="custom-checkbox mr-6 inline-block"
        id={id}
        name={name}
        value={value}
        checked
        onChange={handleChange}
      />
      {str(title)}
    </label>
    {checked ? children : React.null}
  </>
}
