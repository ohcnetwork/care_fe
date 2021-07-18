%%raw("import './styles.css'")

let str = React.string

let handleOnChange = (setValueCB, event) => {
  setValueCB(ReactEvent.Form.target(event)["value"])
}

let circleClasses = bool => {
  "m-1 p-2 h-20 w-20 flex flex-col justify-end items-center border rounded-lg" ++ (
    bool ? " border-green-500 text-green-600 bg-green-100 font-semibold" : ""
  )
}

@react.component
let make = (~name, ~value, ~setValueCB) => {
  let pupilSizes = [1, 2, 3, 4, 5, 6, 7, 8]
  <div className="flex flex-col">
    <div className="font-bold my-2"> {str("Size")} </div>
    <div className="">
      <div className="flex flex-row flex-wrap items-center">
        {Js.Array.map(
          x =>
            <div
              key={`pupil_circle${string_of_int(x)}`}
              className={circleClasses(x === value)}
              onClick={e => setValueCB(x)}>
              <div className={`pupil${string_of_int(x)}`} /> <div> {str(string_of_int(x))} </div>
            </div>,
          pupilSizes,
        )->React.array}
      </div>
    </div>
    <div className="float-left my-2">
      <label>
        <Checkbox
          label="Cannot Be Assessed"
          id={`${name}_radio`}
          onChange={_ => setValueCB(0)}
          checked={value === 0}
        />
      </label>
    </div>
  </div>
}
