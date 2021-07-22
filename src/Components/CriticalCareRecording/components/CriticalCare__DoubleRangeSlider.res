@val external document: {..} = "document"

%%raw("import './styles.css'")

let str = React.string

let handleClick = val => {
  let range = document["getElementById"]("pupil_slider1")
  let active_val = document["getElementsByClassName"]("active")
  let class_val = "pupil_label" ++ active_val[0]["innerText"]
  active_val[0]["className"] = class_val ++ " label"
  range["value"] = val
  let set_active_class = "pupil_label" ++ Belt.Int.toString(val)
  let set_active = document["getElementsByClassName"](set_active_class)
  set_active[0]["className"] = set_active[0]["className"] ++ " active selected"
}

@react.component
let make = () => {
  <div>
    <div className="thumb">
      <input type_="range" min="10" max="200" step=10.0 className="thumb--left" />
      <input type_="range" min="10" max="200" step=10.0 className="thumb--right" />
    </div>
    <div className="slider">
      <div className="slider__track" />
      <div className="slider__range" />
      <div className="slider__left-value"> {str("10")} </div>
      <div className="slider__right-value"> {str("20")} </div>
    </div>
  </div>
}
