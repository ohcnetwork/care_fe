%%raw("import './styles.css'")

let str = React.string

let handleOnChange = (setValueCB, event) => {
  setValueCB(ReactEvent.Form.target(event)["value"])
}

@react.component
let make = (~name, ~value, ~setValueCB) => {
  let pupilSizes = [1, 2, 3, 4, 5, 6, 7, 8]
  <div className="flex flex-col">
    <div className="font-bold my-2"> {str("Size")} </div>
    <div className="upper-label">
      <ul className="range-labels grid-cols-8">
        {Js.Array.map(
          x =>
            <li
              key={`pupil_circle${string_of_int(x)}`}
              className="align-circles"
              onClick={e => setValueCB(x)}>
              <div className={`pupil${string_of_int(x)}`} />
            </li>,
          pupilSizes,
        )->React.array}
      </ul>
    </div>
    <br />
    <br />
    <div className="range">
      <input
        name={name}
        id={name}
        type_="range"
        min="1"
        max="8"
        step=1.0
        onChange={handleOnChange(setValueCB)}
        value={string_of_int(value)}
      />
    </div>
    <div> <ul className="range-labels grid-cols-8"> {Js.Array.map(x => {
          <li
            key={`pupil_value${string_of_int(x)}`}
            className={x === value ? "active" : ""}
            onClick={_ => setValueCB(x)}>
            {str(string_of_int(x))}
          </li>
        }, pupilSizes)->React.array} </ul> </div>
    <div className="float-left my-2">
      <label>
        <input
          className="mr-2"
          type_="radio"
          name={name}
          value={"0"}
          id={`${name}_radio`}
          onChange={_ => setValueCB(0)}
          checked={value === 0}
        />
        {str("Cannot Be Assessed")}
      </label>
    </div>
  </div>
}
