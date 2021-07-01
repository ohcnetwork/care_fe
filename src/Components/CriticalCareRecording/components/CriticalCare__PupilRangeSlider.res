@val external document: {..} = "document"

%%raw("import './styles.css'")

let str = React.string

let handleClick = val => {
  let range = document["getElementById"]("pupil_slider")
  let active_val = document["getElementsByClassName"]("active")
  let class_val = "pupil_label" ++ active_val[0]["innerText"]
  active_val[0]["className"] = class_val ++ " label"
  range["value"] = val
  let set_active_class = "pupil_label" ++ Belt.Int.toString(val)
  let set_active = document["getElementsByClassName"](set_active_class)
  set_active[0]["className"] = set_active[0]["className"] ++ " active selected"
  Js.log(set_active[0]["className"])
}

@react.component
let make = (~name, ~val, ~onChange) => {
  <div className="flex flex-col">
    <div className="font-bold my-2"> {str("Size")} </div>
    <div className="upper-label">
      <ul className="range-labels">
        <li className="align-circles"> <div className="pupil1" /> </li>
        <li className="align-circles"> <div className="pupil2" /> </li>
        <li className="align-circles"> <div className="pupil3" /> </li>
        <li className="align-circles"> <div className="pupil4" /> </li>
        <li className="align-circles"> <div className="pupil5" /> </li>
        <li className="align-circles"> <div className="pupil6" /> </li>
        <li className="align-circles"> <div className="pupil7" /> </li>
        <li className="align-circles"> <div className="pupil8" /> </li>
      </ul>
    </div>
    <br />
    <br />
    <div className="range">
      <input name={name} id={name} type_="range" min="1" max="8" step=1.0 onChange value={val} />
    </div>
    <div>
      <ul className="range-labels">
        <li onClick={_mouseEvt => handleClick(1)} className="pupil_label1 label"> {str("1")} </li>
        <li onClick={_mouseEvt => handleClick(2)} className="pupil_label2 label"> {str("2")} </li>
        <li onClick={_mouseEvt => handleClick(3)} className="pupil_label3 label"> {str("3")} </li>
        <li onClick={_mouseEvt => handleClick(4)} className="pupil_label4 label"> {str("4")} </li>
        <li onClick={_mouseEvt => handleClick(5)} className="pupil_label5 label active">
          {str("5")}
        </li>
        <li onClick={_mouseEvt => handleClick(6)} className="pupil_label6 label"> {str("6")} </li>
        <li onClick={_mouseEvt => handleClick(7)} className="pupil_label7 label"> {str("7")} </li>
        <li onClick={_mouseEvt => handleClick(8)} className="pupil_label8 label"> {str("8")} </li>
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
