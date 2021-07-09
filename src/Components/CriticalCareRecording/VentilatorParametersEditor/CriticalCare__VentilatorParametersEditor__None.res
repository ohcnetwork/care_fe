let str = React.string
open CriticalCare__Types

let checkBoxSliderConfig = [
  {
    "checkboxTitle": "Nasal Prongs",
    "title": "Oxygen Level (l/m)",
    "start": "0",
    "end": "50",
    "interval": "5",
    "step": 1.0,
    "id": "nasalProngs",
    "min": 1.0,
    "max": 4.0,
  },
  {
    "checkboxTitle": "Simple Face Mask",
    "title": "Oxygen Level (l/m)",
    "start": "0",
    "end": "50",
    "interval": "5",
    "step": 1.0,
    "id": "simpleFaceMask",
    "min": 5.0,
    "max": 10.0,
  },
]

let sliderConfig = [
  {
    "title": "FiO2 (%)",
    "start": "21",
    "end": "100",
    "interval": "10",
    "step": 1.0,
    "id": "fio2",
    "min": 21.0,
    "max": 60.0,
  },
  {
    "title": "SPO2 (%)",
    "start": "0",
    "end": "100",
    "interval": "10",
    "step": 1.0,
    "id": "spo2",
    "min": 90.0,
    "max": 100.0,
  },
]

let getStatus = (min, max, val) => {
  if val > min && val < max {
    ("Normal", "#059669")
  } else if val < min {
    ("Low", "#DC2626")
  } else {
    ("High", "#DC2626")
  }
}

module ShowOnChecked = {
  @react.component
  let make = (~title, ~children, ~onChange, ~defaultChecked=false) => {
    let (checked, setChecked) = React.useState(_ => defaultChecked)
    let handleChange = _ => {
      onChange(!checked)
      setChecked(prev => !prev)
    }

    <>
      <label htmlFor={title} className="mb-6 block">
        <input
          type_="checkbox"
          className="mr-6 inline-block"
          id={title}
          name={title}
          value={title}
          checked
          onChange={handleChange}
        />
        {str(title)}
      </label>
      {checked ? children : React.null}
    </>
  }
}

@react.component
let make = (~state: VentilatorParameters.none, ~send: VentilatorParameters.action => unit) => {
  <div>
    <h4 className="mb-4"> {str("Oxygen Modality")} </h4>
    <div className={`ml-6`}>
      {checkBoxSliderConfig
      |> Array.map(option => {
        let value = switch option["id"] {
        | "nasalProngs" => state.nasalProngs
        | "simpleFaceMask" => state.simpleFaceMask
        | _ => Some("")
        }
        let newState = s =>
          switch option["id"] {
          | "nasalProngs" => {...state, nasalProngs: s}
          | "simpleFaceMask" => {...state, simpleFaceMask: s}
          | _ => state
          }
        <div key={`none-check-${option["id"]}`}>
          <ShowOnChecked
            defaultChecked={value !== Some("")}
            title={option["checkboxTitle"]}
            onChange={prev => send(SetNone(newState(prev ? Some("") : None)))}>
            <Slider
              title={option["title"]}
              start={option["start"]}
              end={option["end"]}
              interval={option["interval"]}
              step={option["step"]}
              value={switch value {
              | Some(value) => value
              | _ => ""
              }}
              setValue={s => send(SetNone(newState(Some(s))))}
              getLabel={VentilatorParameters.getStatus(option["min"], option["max"])}
            />
          </ShowOnChecked>
        </div>
      })
      |> React.array}
    </div>
    <div className={`ml-6`}>
      <label htmlFor={"Non-Rebreathing Mask"} className="mb-6 block">
        <input
          type_="checkbox"
          className="mr-6 inline-block"
          id={"Non-Rebreathing Mask"}
          name={"Non-Rebreathing Mask"}
          checked={state.nonRebreathingMask}
          onChange={e =>
            send(SetNone({...state, nonRebreathingMask: ReactEvent.Form.target(e)["checked"]}))}
        />
        {str("Non-Rebreathing Mask")}
      </label>
      <label htmlFor={"highFlowNasalCannula"} className="mb-6 block">
        <input
          type_="checkbox"
          className="mr-6 inline-block"
          id={"highFlowNasalCannula"}
          name={"highFlowNasalCannula"}
          checked={state.highFlowNasalCannula}
          onChange={e =>
            send(SetNone({...state, highFlowNasalCannula: ReactEvent.Form.target(e)["checked"]}))}
        />
        {str("High Flow Nasal Cannula")}
      </label>
    </div>
    <div className={`ml-6`}>
      {sliderConfig
      |> Array.map(option => {
        let value = switch option["id"] {
        | "fio2" => state.fio2
        | "spo2" => state.spo2
        | _ => ""
        }
        let newState = s =>
          switch option["id"] {
          | "fio2" => {...state, fio2: s}
          | "spo2" => {...state, spo2: s}
          | _ => state
          }
        <Slider
          key={`none-${option["id"]}`}
          title={option["title"]}
          start={option["start"]}
          end={option["end"]}
          interval={option["interval"]}
          step={option["step"]}
          value={value}
          setValue={s => send(SetNone(newState(s)))}
          getLabel={VentilatorParameters.getStatus(option["min"], option["max"])}
        />
      })
      |> React.array}
    </div>
  </div>
}
