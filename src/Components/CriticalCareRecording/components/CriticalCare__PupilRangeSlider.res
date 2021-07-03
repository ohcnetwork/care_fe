@val external document: {..} = "document"

%%raw("import './styles.css'")

let str = React.string

@react.component
let make = (~name, ~val, ~onChange) => {
  let number_array = ["1", "2", "3", "4", "5", "6", "7", "8"]
  <div className="flex flex-col">
    <div className="font-bold my-2"> {str("Size")} </div>
    <div className="upper-label">
      <ul className="range-labels grid-cols-8">
        {number_array
        |> Array.map(x =>
          <li key={`pupil_circle${x}`} className="align-circles">
            <div className={`pupil${x}`} />
          </li>
        )
        |> React.array}
      </ul>
    </div>
    <br />
    <br />
    <div className="range">
      <input name={name} id={name} type_="range" min="1" max="8" step=1.0 onChange value={val} />
    </div>
    <div>
      <ul className="range-labels grid-cols-8">
        {number_array
        |> Array.map(x => {
          <li key={`pupil_value${x}`} className={x === val ? "active" : ""}> {str(x)} </li>
        })
        |> React.array}
      </ul>
    </div>
    <div className="float-left my-2">
      <label>
        <input
          className="mr-2"
          type_="radio"
          name={name}
          value={"cannot_be_assessed"}
          id={`${name}_radio`}
          onChange={onChange}
          checked={val === "cannot_be_assessed"}
        />
        {str("Cannot Be Assessed")}
      </label>
    </div>
  </div>
}
