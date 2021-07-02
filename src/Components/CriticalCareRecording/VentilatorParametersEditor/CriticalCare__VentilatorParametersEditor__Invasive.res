let str = React.string
open CriticalCare__Types

let cmvOptionsArray: array<Options.t> = [
  {label: "Volume Control Ventilation (VCV)", value: "VCV", name: "cmv"},
  {label: "Pressure Control Ventilation (PCV)", value: "PCV", name: "cmv"},
  {
    label: "Pressure Regulated Volume Controlled Ventilation (PRVC)",
    value: "PRVC",
    name: "cmv",
  },
  {label: "Airway Pressure Release Ventilation (APRV)", value: "APRV", name: "cmv"},
]

let simvOptionArray: array<Options.t> = [
  {label: "Volume Controlled SIMV (VC-SIMV)", value: "VC_SIMV", name: "simv"},
  {label: "Pressure Controlled SIMV (PC-SIMV)", value: "PC_SIMV", name: "simv"},
  {
    label: "Pressure Regulated Volume Controlled SIMV (PRVC-SIMV)",
    value: "PRVC_SIMV",
    name: "simv",
  },
  {label: "Adapative Support Ventilation (ASV)", value: "ASV", name: "simv"},
]

let rhythmOptionArray: array<Options.t> = [
  {label: "Regular", value: "regular", name: "rhythm"},
  {label: "Irregular", value: "irregular", name: "rhythm"},
]

let handleSubmit = (handleDone, state) => {
  handleDone(state)
}

let psvOptionsArray = [
  {
    "title": "PEEP (cm/H2O)",
    "start": "0",
    "end": "30",
    "interval": "5",
    "step": 1.0,
    "id": "peep",
  },
  {
    "title": "Peak Inspiratory Pressure (PIP) (cm H2O)",
    "start": "0",
    "end": "100",
    "interval": "10",
    "step": 1.0,
    "id": "peakInspiratoryPressure",
  },
  {
    "title": "Mean Airway Pressure (cm H2O",
    "start": "0",
    "end": "40",
    "interval": "5",
    "step": 1.0,
    "id": "meanAirwayPressure",
  },
  {
    "title": "Respiratory Rate Ventilator (bpm)",
    "start": "0",
    "end": "100",
    "interval": "10",
    "step": 1.0,
    "id": "respiratoryRateVentilator",
  },
  {
    "title": "Tidal Volume (ml)",
    "start": "0",
    "end": "1000",
    "interval": "100",
    "step": 1.0,
    "id": "tidalVolume",
  },
  {
    "title": "FiO2 (%)",
    "start": "20",
    "end": "100",
    "interval": "10",
    "step": 1.0,
    "id": "fio2",
  },
  {
    "title": "SPO2 (%)",
    "start": "0",
    "end": "100",
    "interval": "10",
    "step": 1.0,
    "id": "spo2",
  },
]

@react.component
let make = (~state: VentilatorParameters.iv, ~send: VentilatorParameters.action => unit) => {
  <div>
    <h4 className="mb-4"> {str("Ventilator Mode")} </h4>
    <div className="mb-4">
      <label onClick={_ => send(SetIv({...state, ventilatorMode: "cmv"}))}>
        <input className="mr-2" type_="radio" name="ventilatorMode" value={"cmv"} id={"cmv"} />
        {str({"Control Mechanical Ventilation (CMV)"})}
      </label>
      <div
        className={`ml-6 ${state.ventilatorMode !== "cmv"
            ? "pointer-events-none opacity-50"
            : ""} `}>
        <CriticalCare__RadioButton options={cmvOptionsArray} horizontal={false} />
      </div>
    </div>
    <div className="mb-4">
      <label onClick={_ => send(SetIv({...state, ventilatorMode: "simv"}))}>
        <input className="mr-2" type_="radio" name="ventilatorMode" value={"simv"} id={"simv"} />
        {str({"Synchronised Intermittent Mandatory Ventilation (SIMV)"})}
      </label>
      <div
        className={`ml-6 ${state.ventilatorMode !== "simv"
            ? "pointer-events-none opacity-50"
            : ""} `}>
        <CriticalCare__RadioButton options={simvOptionArray} horizontal={false} />
      </div>
    </div>
    <div className="mb-4">
      <label onClick={_ => send(SetIv({...state, ventilatorMode: "psv"}))}>
        <input className="mr-2" type_="radio" name="ventilatorMode" value={"psv"} id={"psv"} />
        {str({"C-PAP/ Pressure Support Ventilation (PSV)"})}
      </label>
      <div
        className={`ml-6 ${state.ventilatorMode !== "psv"
            ? "pointer-events-none opacity-50"
            : ""} `}>
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
            key={`invasive-${option["id"]}`}
            title={option["title"]}
            start={option["start"]}
            end={option["end"]}
            interval={option["interval"]}
            step={option["step"]}
            value={value}
            setValue={s => send(SetIvSubOptions(newState(s)))}
            getLabel={_ => ("Normal", "#ff0000")}
          />
        })
        |> React.array}
      </div>
    </div>
  </div>
}
