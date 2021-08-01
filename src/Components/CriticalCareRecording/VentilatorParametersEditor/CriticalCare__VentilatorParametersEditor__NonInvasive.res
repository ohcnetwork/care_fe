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

let silderOptionArray = [
  {
    "title": "Peak Inspiratory Pressure (PIP) (cm H2O)",
    "start": "0",
    "end": "100",
    "interval": "10",
    "step": 1.0,
    "id": "ventilator_pip",
    "min": 12.0,
    "max": 30.0,
  },
  {
    "title": "Mean Airway Pressure (MAP) (cm H2O)",
    "start": "0",
    "end": "40",
    "interval": "5",
    "step": 1.0,
    "id": "ventilator_mean_airway_pressure",
    "min": 12.0,
    "max": 25.0,
  },
  {
    "title": "Respiratory Rate Ventilator (bpm)",
    "start": "0",
    "end": "100",
    "interval": "10",
    "step": 1.0,
    "id": "ventilator_resp_rate",
    "min": 40.0,
    "max": 60.0,
  },
  {
    "title": "Pressure Support",
    "start": "0",
    "end": "40",
    "interval": "5",
    "step": 1.0,
    "id": "ventilator_pressure_support",
    "min": 5.0,
    "max": 15.0,
  },
  {
    "title": "Tidal Volume (ml)",
    "start": "0",
    "end": "1000",
    "interval": "100",
    "step": 1.0,
    "id": "ventilator_tidal_volume",
    "min": 0.0,
    "max": 1000.0,
  },
  {
    "title": "FiO2 (%)",
    "start": "21",
    "end": "100",
    "interval": "10",
    "step": 1.0,
    "id": "ventilator_fi02",
    "min": 21.0,
    "max": 60.0,
  },
  {
    "title": "SPO2 (%)",
    "start": "0",
    "end": "100",
    "interval": "10",
    "step": 1.0,
    "id": "ventilator_spo2",
    "min": 90.0,
    "max": 100.0,
  },
]

@react.component
let make = (~state: VentilatorParameters.state, ~send: VentilatorParameters.action => unit) => {
  let defaultChecked = VentilatorParameters.getParentVentilatorMode(state.ventilator_mode)
  let (parentVentilatorMode, setParentVentilatorMode) = React.useState(() => defaultChecked)

  <div>
    <h4 className="mb-4"> {str("Ventilator Mode")} </h4>
    <div className="mb-4">
      <Radio
        id={"cmv"}
        label={"Control Mechanical Ventilation (CMV)"}
        checked={parentVentilatorMode == CMV}
        onChange={_ => setParentVentilatorMode(_ => CMV)}
      />
      <div className={`ml-6 ${parentVentilatorMode !== CMV ? "hidden" : ""} `}>
        <CriticalCare__RadioButton
          defaultChecked={VentilatorParameters.encodeVentilatorModeType(state.ventilator_mode)}
          onChange={e =>
            send(
              SetVentilatorMode(
                VentilatorParameters.decodeVentilatorModeType(ReactEvent.Form.target(e)["id"]),
              ),
            )}
          options={cmvOptionsArray}
          ishorizontal={false}
        />
      </div>
    </div>
    <div className="mb-4">
      <Radio
        id={"simv"}
        label={"Synchronised Intermittent Mandatory Ventilation (SIMV)"}
        checked={parentVentilatorMode == SIMV}
        onChange={_ => setParentVentilatorMode(_ => SIMV)}
      />
      <div className={`ml-6 ${parentVentilatorMode !== SIMV ? "hidden" : ""} `}>
        <CriticalCare__RadioButton
          defaultChecked={VentilatorParameters.encodeVentilatorModeType(state.ventilator_mode)}
          onChange={e =>
            send(
              SetVentilatorMode(
                VentilatorParameters.decodeVentilatorModeType(ReactEvent.Form.target(e)["id"]),
              ),
            )}
          options={simvOptionArray}
          ishorizontal={false}
        />
      </div>
    </div>
    <div className="mb-4">
      <Radio
        id={"psv"}
        label={"C-PAP/ Pressure Support Ventilation (PSV)"}
        checked={state.ventilator_mode == PSV}
        onChange={_ => {
          setParentVentilatorMode(_ => UNKNOWN)
          send(SetVentilatorMode(PSV))
        }}
      />
      <div className={`ml-6`}>
        <Slider
          key={"non-invasive-ventilator_peep"}
          title={"PEEP (cm/H2O)"}
          start={"0"}
          end={"30"}
          interval={"5"}
          step={0.1}
          value={Belt.Float.toString(
            switch state.ventilator_peep {
            | Some(value) => value
            | _ => 0.0
            },
          )}
          setValue={s => send(SetPeep(Belt.Float.fromString(s)))}
          getLabel={VentilatorParameters.getStatus(10.0, "Low", 30.0, "High")}
        />

        {silderOptionArray
        |> Array.map(option => {
          let value: option<int> = switch option["id"] {
          | "ventilator_pip" => state.ventilator_pip
          | "ventilator_mean_airway_pressure" => state.ventilator_mean_airway_pressure
          | "ventilator_resp_rate" => state.ventilator_resp_rate
          | "ventilator_pressure_support" => state.ventilator_pressure_support
          | "ventilator_tidal_volume" => state.ventilator_tidal_volume
          | "ventilator_fi02" => state.ventilator_fi02
          | "ventilator_spo2" => state.ventilator_spo2
          | _ => None
          }

          // SUPRESSED WARNING ADDED AT TOP OF THE FILE
          // Partial match: missing cases in pattern-matching.

          @warning("-8")
          let handleChange: option<int> => VentilatorParameters.action = s => {
            switch option["id"] {
            | "ventilator_pip" => SetPIP(s)
            | "ventilator_mean_airway_pressure" => SetMeanAirwayPressure(s)
            | "ventilator_resp_rate" => SetRespiratoryRate(s)
            | "ventilator_pressure_support" => SetPressureSupport(s)
            | "ventilator_tidal_volume" => SetTidalVolume(s)
            | "ventilator_fi02" => SetFIO2(s)
            | "ventilator_spo2" => SetSPO2(s)
            }
          }
          <Slider
            key={`non-invasive-${option["id"]}`}
            title={option["title"]}
            start={option["start"]}
            end={option["end"]}
            interval={option["interval"]}
            step={option["step"]}
            value={Belt.Int.toString(
              switch value {
              | Some(value) => value
              | _ => 0
              },
            )}
            setValue={s => send(handleChange(Belt.Int.fromString(s)))}
            getLabel={VentilatorParameters.getStatus(option["min"], "Low", option["max"], "High")}
          />
        })
        |> React.array}
      </div>
    </div>
  </div>
}
