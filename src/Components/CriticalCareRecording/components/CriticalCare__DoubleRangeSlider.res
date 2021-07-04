@val external document: {..} = "document"

%%raw("import './styles.css'")

let str = React.string

let handleClick = (val) => {
    let range = document["getElementById"]("pupil_slider1")
    let active_val = document["getElementsByClassName"]("active");
    let class_val = "pupil_label" ++ active_val[0]["innerText"];
    active_val[0]["className"] = class_val ++ " label";
    range["value"] = val
    let set_active_class = "pupil_label" ++ Belt.Int.toString(val)
    let set_active = document["getElementsByClassName"](set_active_class)
    set_active[0]["className"] = set_active[0]["className"] ++ " active selected"
    Js.log(set_active[0]["className"])
}

@react.component
let make = () => {
    <div>
    <div className="thumb">
        <input
            type_="range"
            min="10"
            max="200"
            step=10.0
            className="thumb--left"
        />
        <input
            type_="range"
            min="10"
            max="200"
            step=10.0
            className="thumb--right"
        />
    </div>

      <div className="slider">
        <div className="slider__track" />
        <div className="slider__range" />
         <div className="slider__left-value">{str("10")}</div>
        <div className="slider__right-value">{str("20")}</div>
      </div>

        // <div className="relative w-full">
        //     <ul className="double-range-labels z-20">
        //         <li onClick={(_mouseEvt) => handleClick(1)} className="pupil_label1 label">{str("10")}</li>
        //         <li onClick={(_mouseEvt) => handleClick(2)} className="pupil_label2 label">{str("20")}</li>
        //         <li onClick={(_mouseEvt) => handleClick(3)} className="pupil_label3 label">{str("30")}</li>
        //         <li onClick={(_mouseEvt) => handleClick(4)} className="pupil_label4 label">{str("40")}</li>
        //         <li onClick={(_mouseEvt) => handleClick(5)} className="pupil_label5 label active">{str("50")}</li>
        //         <li onClick={(_mouseEvt) => handleClick(6)} className="pupil_label6 label">{str("60")}</li>
        //         <li onClick={(_mouseEvt) => handleClick(7)} className="pupil_label7 label">{str("70")}</li>
        //         <li onClick={(_mouseEvt) => handleClick(8)} className="pupil_label8 label">{str("80")}</li>
        //         <li onClick={(_mouseEvt) => handleClick(8)} className="pupil_label8 label">{str("90")}</li>
        //         <li onClick={(_mouseEvt) => handleClick(8)} className="pupil_label8 label">{str("100")}</li>
        //         <li onClick={(_mouseEvt) => handleClick(1)} className="pupil_label1 label">{str("110")}</li>
        //         <li onClick={(_mouseEvt) => handleClick(2)} className="pupil_label2 label">{str("120")}</li>
        //         <li onClick={(_mouseEvt) => handleClick(3)} className="pupil_label3 label">{str("130")}</li>
        //         <li onClick={(_mouseEvt) => handleClick(4)} className="pupil_label4 label">{str("140")}</li>
        //         <li onClick={(_mouseEvt) => handleClick(5)} className="pupil_label5 label active">{str("150")}</li>
        //         <li onClick={(_mouseEvt) => handleClick(6)} className="pupil_label6 label">{str("160")}</li>
        //         <li onClick={(_mouseEvt) => handleClick(7)} className="pupil_label7 label">{str("170")}</li>
        //         <li onClick={(_mouseEvt) => handleClick(8)} className="pupil_label8 label">{str("180")}</li>
        //         <li onClick={(_mouseEvt) => handleClick(8)} className="pupil_label8 label">{str("190")}</li>
        //         <li onClick={(_mouseEvt) => handleClick(8)} className="pupil_label8 label">{str("200")}</li>
        //     </ul>
        // </div>
    </div>
}
