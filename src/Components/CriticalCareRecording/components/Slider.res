// USAGE:

// let (slide, setSlider) = React.useState(() => "0")

// <Slider
// title="Diastolic"
// start="0"
// end="100"
// interval="10"
// step={0.1}
// value={slide}
// setValue={(s) => setSlider(_ => s)}
// getLabel={getLabel}
// />
//
//
// And getLabel can be something like:
//
// let getLabel = (value) => {
//         if (value > 50.0) {
//             ("Disease", "#ff0000")
//         } else {
//             ("Normal", "#2856ff")
//         }
//     }

let str = React.string
// %%raw(`import ("./styles.css")`)
%%raw(`import ('@yaireo/ui-range')`)

@react.component
let make = (
  ~title: string,
  ~titleNeighbour: React.element = <div className="hidden"></div>,
  ~start: string,
  ~end: string,
  ~step: float,
  ~value: string,
  ~setValue: string => unit,
  ~getLabel: float => (string, string),
  ~interval: string,
  ~hasError=None,
) => {
  let (textColor, setColor) = React.useState(() => "#2856ff")
  let (text, setText) = React.useState(() => "Normal")

  let e = end->Belt.Int.fromString->Belt.Option.getWithDefault(0)
  let i = interval->Belt.Int.fromString->Belt.Option.getWithDefault(0)

  let iterations = Belt.Int.toFloat(i) /. Belt.Int.toFloat(e) *. 100.0

  React.useEffect1(() => {
    let (text, color) = getLabel(value->Belt.Float.fromString->Belt.Option.getWithDefault(0.0))
    setColor(_ => color)
    setText(_ => text)

    None
  }, [value])

  <>
    <section className="slider-box">
      <div className="slider-head">
        <div className="flex items-center">
          <h1 className="m-2"> {title->str} </h1>
          titleNeighbour
        </div>
        <div className="flex flex-col">
          <label htmlFor="measure" style={ReactDOM.Style.make(~color=textColor, ())}>
            {switch value->Belt.Float.fromString {
            | Some(_) => text->str
            | None => React.null
            }}
            <input
              name="measure"
              type_="number"
              step={step}
              max={end}
              min={start}
              value={value}
              onChange={event => setValue(ReactEvent.Form.target(event)["value"])}
            />
          </label>
          <CriticalCare__InputGroupError
            message={Belt.Option.getWithDefault(hasError, "")} active={Belt.Option.isSome(hasError)}
          />
        </div>
      </div>
      <div
        className="range-slider min-w-full"
        style={ReactDOM.Style.unsafeAddStyle(
          ReactDOM.Style.make(),
          {
            "--min": start,
            "--max": end,
            "--fill-color": "#0e9f6e",
            "--primary-color": "#0e9f6e",
            "--value-background-hover": "#0e9f6e",
            "--value": value,
            "--text-value": value,
            "--step": interval,
          },
        )}>
        <input
          type_="range"
          step={step}
          max={end}
          min={start}
          value={value}
          onInput={event => setValue(ReactEvent.Form.target(event)["value"])}
          onChange={event => {
            setValue(ReactEvent.Form.target(event)["value"])
          }}
        />
        <output> {str(value)} </output>
        <div className="range-slider__progress" />
      </div>
    </section>
  </>
}
