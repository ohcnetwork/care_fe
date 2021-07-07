let str = React.string

@react.component
let make = (~name, ~text, ~onChange) => {
  open MaterialUi
  <div className="my-4">
    <InputLabel htmlFor={name}> {str("")} </InputLabel>
    <TextField
      name={name}
      multiline=true
      rows={TextField.Rows.string("4")}
      label={str("Description")}
      variant=#Outlined
      margin=#Dense
      _type="text"
      value={TextField.Value.string(text)}
      onChange={onChange}
      className="w-full"
      color=#Primary
    />
  </div>
}
