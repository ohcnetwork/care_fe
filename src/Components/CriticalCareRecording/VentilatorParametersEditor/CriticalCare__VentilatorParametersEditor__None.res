let str = React.string
open CriticalCare__Types

let ventilatorOxygenModality: array<Options.t> = [
  {label: "Nasal Prongs", value: "NASAL_PRONGS", name: "oxygenModality"},
  {label: "Simple Face Mask", value: "SIMPLE_FACE_MASK", name: "oxygenModality"},
  {label: "Non Rebreathing Mask", value: "NON_REBREATHING_MASK", name: "oxygenModality"},
  {label: "High Flow Nasal Cannula", value: "HIGH_FLOW_NASAL_CANNULA", name: "oxygenModality"},
]

let silderOptionArray = [
  {
    "title": "Flow Rate",
    "start": "0",
    "end": "70",
    "interval": "5",
    "step": 1.0,
    "id": "ventilator_oxygen_modality_flow_rate",
    "min": 35.0,
    "max": 60.0,
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

let getStatus = (min, max, val) => {
  if val > min && val < max {
    ("Normal", "#059669")
  } else if val < min {
    ("Low", "#DC2626")
  } else {
    ("High", "#DC2626")
  }
}

@react.component
let make = (~state: VentilatorParameters.state, ~send: VentilatorParameters.action => unit) => {
  let getOxygenFlowRateLabel = switch state.ventilator_oxygen_modality {
  | NASAL_PRONGS => VentilatorParameters.getStatus(1.0, 4.0)
  | SIMPLE_FACE_MASK => VentilatorParameters.getStatus(5.0, 10.0)
  | NON_REBREATHING_MASK => VentilatorParameters.getStatus(11.0, 15.0)
  | _ => VentilatorParameters.getStatus(0.0, 50.0)
  }
  <div>
    <h4 className="mb-4"> {str("Oxygen Modality")} </h4>
    <CriticalCare__RadioButton
      defaultChecked={VentilatorParameters.encodeVentilatorOxygenModalityType(
        state.ventilator_oxygen_modality,
      )}
      onChange={e => {
        send(
          SetOxygenModality(
            VentilatorParameters.decodeVetilatorOxygenModalityType(ReactEvent.Form.target(e)["id"]),
          ),
        )
      }}
      options={ventilatorOxygenModality}
      ishorizontal={false}
    />
    <Slider
      title={"Oxygen Flow Rate"}
      start={"0"}
      end={"50"}
      interval={"5"}
      step={1.0}
      value={Belt.Int.toString(
        switch state.ventilator_oxygen_modality_oxygen_rate {
        | Some(value) => value
        | _ => 0
        },
      )}
      setValue={s => send(SetOxygenModalityOxygenRate(Belt.Int.fromString(s)))}
      getLabel={getOxygenFlowRateLabel}
    />
    {silderOptionArray
    |> Array.map(option => {
      let value: option<int> = switch option["id"] {
      | "ventilator_oxygen_modality_flow_rate" => state.ventilator_oxygen_modality_flow_rate
      | "ventilator_fi02" => state.ventilator_fi02
      | "ventilator_spo2" => state.ventilator_spo2
      | _ => None
      }
      let handleChange: option<int> => VentilatorParameters.action = s =>
        switch option["id"] {
        | "ventilator_oxygen_modality_flow_rate" => SetOxygenModalityFlowRate(s)
        | "ventilator_fi02" => SetFIO2(s)
        | "ventilator_spo2" => SetSPO2(s)
        }
      <Slider
        key={`none-${option["id"]}`}
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
        getLabel={VentilatorParameters.getStatus(option["min"], option["max"])}
      />
    })
    |> React.array}
  </div>
}
