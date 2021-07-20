let str = React.string

@react.component
export make = (
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
      <Checkbox id={id} label={title} checked={checked} onChange={handleChange} />
    </label>
    {checked ? children : React.null}
  </>
}
