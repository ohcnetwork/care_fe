let str = React.string
open CriticalCare__Types

let cmvOptionsArray: array<Options.t> = [
  {label: "Volume Control Ventilation (VCV)", value: "VCV", name: "cmv"},
  {label: "Pressure Control Ventilation (PCV)", value: "PCV", name: "cmv"},
]

let simvOptionArray: array<Options.t> = [
  {label: "Volume Controlled SIMV (VC-SIMV)", value: "VC_SIMV", name: "simv"},
  {label: "Pressure Controlled SIMV (PC-SIMV)", value: "PC_SIMV", name: "simv"},
]

let rhythmOptionArray: array<Options.t> = [
  {label: "Regular", value: "regular", name: "rhythm"},
  {label: "Irregular", value: "irregular", name: "rhythm"},
]

let psvOptionsArray = [
  {
    "title": "PEEP (cm/H2O)",
    "start": "0",
    "end": "30",
    "interval": "5",
    "step": 1.0,
    "id": "peep",
    "min": 10.0,
    "max": 30.0,
  },
  {
    "title": "Peak Inspiratory Pressure (PIP) (cm H2O)",
    "start": "0",
    "end": "100",
    "interval": "10",
    "step": 1.0,
    "id": "peakInspiratoryPressure",
    "min": 12.0,
    "max": 30.0,
  },
  {
    "title": "Mean Airway Pressure (cm H2O",
    "start": "0",
    "end": "40",
    "interval": "5",
    "step": 1.0,
    "id": "meanAirwayPressure",
    "min": 12.0,
    "max": 25.0,
  },
  {
    "title": "Respiratory Rate Ventilator (bpm)",
    "start": "0",
    "end": "100",
    "interval": "10",
    "step": 1.0,
    "id": "respiratoryRateVentilator",
    "min": 40.0,
    "max": 60.0,
  },
  {
    "title": "Tidal Volume (ml)",
    "start": "0",
    "end": "1000",
    "interval": "100",
    "step": 1.0,
    "id": "tidalVolume",
    "min": 0.0,
    "max": 1000.0,
  },
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

@react.component
let make = (~state: VentilatorParameters.niv, ~send: VentilatorParameters.action => unit) => {
  let defaultChecked = switch state.ventilatorMode {
  | "cmv" => state.ventilatorModeSubOption.cmv
  | "simv" => state.ventilatorModeSubOption.simv
  | "psv" => state.ventilatorModeSubOption.psv
  | _ => ""
  }
  <div>
    <h4 className="mb-4"> {str("Ventilator Mode")} </h4>
    <div className="mb-4">
      // <label>
      //   <input
      //     className="mr-2"
      //     type_="radio"
      //     name="ventilatorMode"
      //     value={"cmv"}
      //     id={"cmv"}
      //     checked={state.ventilatorMode === "cmv"}
      //     onClick={_ => send(SetNiv({...state, ventilatorMode: "cmv"}))}
      //   />
      //   {str({"Control Mechanical Ventilation (CMV)"})}
      // </label>
      <Radio
        id={"cmv"}
        label={"Control Mechanical Ventilation (CMV)"}
        checked={state.ventilatorMode === "cmv"}
        onChange={_ => send(SetNiv({...state, ventilatorMode: "cmv"}))}
      />
      <div className={`ml-6 ${state.ventilatorMode !== "cmv" ? "hidden" : ""} `}>
        <CriticalCare__RadioButton
          defaultChecked
          onChange={e =>
            send(
              SetNivSubOptions({
                ...state,
                ventilatorModeSubOption: {
                  cmv: ReactEvent.Form.target(e)["id"],
                  psv: "",
                  simv: "",
                },
              }),
            )}
          options={cmvOptionsArray}
          ishorizontal={false}
        />
      </div>
    </div>
    <div className="mb-4">
      // <label>
      //   <input
      //     className="mr-2"
      //     type_="radio"
      //     name="ventilatorMode"
      //     value={"simv"}
      //     id={"simv"}
      //     checked={state.ventilatorMode === "simv"}
      //     onClick={_ => send(SetNiv({...state, ventilatorMode: "simv"}))}
      //   />
      //   {str({"Synchronised Intermittent Mandatory Ventilation (SIMV)"})}
      // </label>
      <Radio
        id={"simv"}
        label={"Synchronised Intermittent Mandatory Ventilation (SIMV)"}
        checked={state.ventilatorMode === "simv"}
        onChange={_ => send(SetNiv({...state, ventilatorMode: "simv"}))}
      />
      <div className={`ml-6 ${state.ventilatorMode !== "simv" ? "hidden" : ""} `}>
        <CriticalCare__RadioButton
          defaultChecked
          onChange={e =>
            send(
              SetNivSubOptions({
                ...state,
                ventilatorModeSubOption: {
                  cmv: "",
                  psv: "",
                  simv: ReactEvent.Form.target(e)["id"],
                },
              }),
            )}
          options={simvOptionArray}
          ishorizontal={false}
        />
      </div>
    </div>
    <div className="mb-4">
      // <label>
      //   <input
      //     className="mr-2"
      //     type_="radio"
      //     name="ventilatorMode"
      //     value={"psv"}
      //     id={"psv"}
      //     checked={state.ventilatorMode === "psv"}
      //     onClick={_ => send(SetNiv({...state, ventilatorMode: "psv"}))}
      //   />
      //   {str({"C-PAP/ Pressure Support Ventilation (PSV)"})}
      // </label>
      <Radio
        id={"psv"}
        label={"C-PAP/ Pressure Support Ventilation (PSV)"}
        checked={state.ventilatorMode === "psv"}
        onChange={_ => send(SetNiv({...state, ventilatorMode: "psv"}))}
      />
      <div className={`ml-6 ${state.ventilatorMode !== "psv" ? "hidden" : ""} `}>
        {psvOptionsArray
        |> Array.map(option => {
          let value = switch option["id"] {
          | "peep" => state.peep
          | "peakInspiratoryPressure" => state.peakInspiratoryPressure
          | "meanAirwayPressure" => state.meanAirwayPressure
          | "respiratoryRateVentilator" => state.respiratoryRateVentilator
          | "tidalVolume" => state.tidalVolume
          | "fio2" => state.fio2
          | "spo2" => state.spo2
          | _ => ""
          }
          let newState = s =>
            switch option["id"] {
            | "peep" => {...state, peep: s}
            | "peakInspiratoryPressure" => {...state, peakInspiratoryPressure: s}
            | "meanAirwayPressure" => {...state, meanAirwayPressure: s}
            | "respiratoryRateVentilator" => {...state, respiratoryRateVentilator: s}
            | "tidalVolume" => {...state, tidalVolume: s}
            | "fio2" => {...state, fio2: s}
            | "spo2" => {...state, spo2: s}
            | _ => state
            }
          <Slider
            key={`non-invasive-${option["id"]}`}
            title={option["title"]}
            start={option["start"]}
            end={option["end"]}
            interval={option["interval"]}
            step={option["step"]}
            value={value}
            setValue={s => send(SetNivSubOptions(newState(s)))}
            getLabel={VentilatorParameters.getStatus(option["min"], option["max"])}
          />
        })
        |> React.array}
      </div>
    </div>
  </div>
}
