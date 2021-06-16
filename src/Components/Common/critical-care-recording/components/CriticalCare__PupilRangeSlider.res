let str = React.string
%%raw("import './styles.css'")

@react.component
let make = () => {
    <div>
        <div className="upper-label">
            <ul className="range-labels">
                <li className="align-circles"><div className="pupil1"></div></li>
                <li className="align-circles"><div className="pupil2"></div></li>
                <li className="align-circles"><div className="pupil3"></div></li>
                <li className="align-circles"><div className="pupil4"></div></li>
                <li className="align-circles"><div className="pupil5"></div></li>
                <li className="align-circles"><div className="pupil6"></div></li>
                <li className="align-circles"><div className="pupil7"></div></li>
                <li className="align-circles"><div className="pupil8"></div></li>
            </ul>
        </div>
        <br />
        <br />

        <div className="range">
            <input type_="range" min="1" max="8" step=1.0 value="1" />
        </div>

        <div>
            <ul className="range-labels">
                <li className="label">{str("1")}</li>
                <li className="label">{str("2")}</li>
                <li className="label">{str("3")}</li>
                <li className="label">{str("4")}</li>
                <li className="label">{str("5")}</li>
                <li className="label">{str("6")}</li>
                <li className="label">{str("7")}</li>
                <li className="label">{str("8")}</li>
            </ul>
        </div>
    </div>
}
