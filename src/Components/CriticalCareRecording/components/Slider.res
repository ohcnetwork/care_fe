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

@genType @react.component
let make = (
  ~title: string,
  ~titleNeighbour: React.element=<div className="hidden" />,
  ~start: string,
  ~end: string,
  ~step: float,
  ~value: string,
  ~setValue: string => unit,
  ~getLabel: float => (string, string),
  ~interval: string,
  ~disabled: bool=false,
  ~hasError=None,
  ~className="",
) => {
  let (textColor, setColor) = React.useState(() => "#2856ff")
  let (text, setText) = React.useState(() => "Normal")
  let (precision, setPrecision) = React.useState(() => 1)
  let (displayValue, setDisplayValue) = React.useState(() => value)
  let justifyContentClassName = title != "" ? "justify-between" : "justify-center"
  let alignItemClassName = title != "" ? "items-end" : "items-center"
  let boxWidthClassName = title != "" ? "" : "w-16"

  React.useEffect1(() => {
    let (text, color) = getLabel(value->Belt.Float.fromString->Belt.Option.getWithDefault(0.0))
    setColor(_ => color)
    setText(_ => text)

    None
  }, [value])

  React.useEffect2(() => {
    let digits = (value->Js.String2.split("."))[0]->Js.String.length
    setDisplayValue(_ => value->Js.String2.slice(~from=0, ~to_=digits + 1 + precision))

    None
  }, (value, precision))

  React.useEffect0(() => {
    open Belt
    let decimals = (step->Js.Float.toString->Js.String2.split("."))[1]
    switch decimals {
    | Some(x) => setPrecision(_ => Belt.Option.mapWithDefault(x->Belt.Int.fromString, 0, i => i))
    | None => setPrecision(_ => 0)
    }

    None
  })

  <>
    <section className={"slider-box " ++ className}>
      <div className={"slider-head flex flex-col sm:flex-row sm:items-center " ++ justifyContentClassName}>
        <div className="flex items-center">
          <h1 className="m-2"> {title->str} </h1> titleNeighbour
        </div>
        <div className={"flex flex-col mt-2 sm:mt-0 " ++ alignItemClassName}>
          <label htmlFor="measure" style={ReactDOM.Style.make(~color=textColor, ())}>
            {switch value->Belt.Float.fromString {
            | Some(_) => text->str
            | None => React.null
            }}
            <input
              disabled={disabled}
              name="measure"
              type_="number"
              step={step}
              max={end}
              min={start}
              className={"focus:outline-none focus:bg-white focus:ring-primary-500 " ++ boxWidthClassName}
              value={displayValue}
              onChange={event =>
                setValue(
                  ReactEvent.Form.target(event)["value"]
                  ->Js.Float.fromString
                  ->Js.Float.toFixedWithPrecision(~digits=precision),
                )}
            />
          </label>
          <CriticalCare__InputGroupError
            message={Belt.Option.getWithDefault(hasError, "")} active={Belt.Option.isSome(hasError)}
          />
        </div>
      </div>
      <div
        className={`range-slider min-w-full ${disabled ? "cursor-not-allowed" : ""}`}
        style={ReactDOM.Style.unsafeAddStyle(
          ReactDOM.Style.make(),
          {
            "--min": {value !== "" ? start : "0"},
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
          disabled={disabled}
          className={disabled ? "cursor-not-allowed" : ""}
          step={step}
          max={end}
          min={start}
          value={value}
          onInput={event => setValue(ReactEvent.Form.target(event)["value"])}
          onChange={event => {
            setValue(ReactEvent.Form.target(event)["value"])
          }}
        />
        <output> {str(displayValue)} </output>
        <div className="range-slider__progress" />
      </div>
    </section>
  </>
}
