let str = React.string
open CriticalCare__Types

@module("../CriticalCare__API")
external updateDailyRound: (string, string, Js.Json.t, _ => unit, _ => unit) => unit =
  "updateDailyRound"

let handleSubmit = (handleDone, state: VentilatorParameters.t) => {
  let status = VentilatorParameters.showStatus(state)
  handleDone(state, status)
}

let reducer = (state: VentilatorParameters.t, action: VentilatorParameters.action) => {
  switch action {
  | SetVentilatorInterface(ventilator_interface) => {
      ...state,
      ventilator_interface: ventilator_interface,
    }
  | SetVentilatorMode(ventilator_mode) => {
      ...state,
      ventilator_mode: ventilator_mode,
    }

  | SetOxygenModality(oxygen_modality) => {
      ...state,
      ventilator_oxygen_modality: oxygen_modality,
    }
  | SetPeep(peep) => {
      ...state,
      ventilator_peep: peep,
    }
  | SetPIP(pip) => {
      ...state,
      ventilator_pip: pip,
    }
  | SetMeanAirwayPressure(mean_airway_pressure) => {
      ...state,
      ventilator_mean_airway_pressure: mean_airway_pressure,
    }
  | SetRespiratoryRate(respiratory_rate) => {
      ...state,
      ventilator_resp_rate: respiratory_rate,
    }
  | SetPressureSupport(pressure_support) => {
      ...state,
      ventilator_pressure_support: pressure_support,
    }
  | SetTidalVolume(tidal_volume) => {
      ...state,
      ventilator_tidal_volume: tidal_volume,
    }
  | SetOxygenModalityOxygenRate(ventilator_oxygen_modality_oxygen_rate) => {
      ...state,
      ventilator_oxygen_modality_oxygen_rate: ventilator_oxygen_modality_oxygen_rate,
    }
  | SetOxygenModalityFlowRate(oxygen_modality_flow_rate) => {
      ...state,
      ventilator_oxygen_modality_flow_rate: oxygen_modality_flow_rate,
    }
  | SetFIO2(fio2) => {
      ...state,
      ventilator_fi02: fio2,
    }
  | SetSPO2(spo2) => {
      ...state,
      ventilator_spo2: spo2,
    }
  | _ => state
  }
}

let ventilatorInterfaceOptions: array<Options.t> = [
  {
    label: "Invasive (IV)",
    value: "INVASIVE",
    name: "ventilator_interface",
  },
  {
    label: "Non-Invasive (NIV)",
    value: "NON_INVASIVE",
    name: "ventilator_interface",
  },
  {
    label: "None",
    value: "UNKNOWN",
    name: "ventilator_interface",
  },
]

let initialState: VentilatorParameters.t = {
  ventilator_interface: INVASIVE,
  ventilator_mode: UNKNOWN,
  ventilator_oxygen_modality: UNKNOWN,
  ventilator_peep: None,
  ventilator_pip: None,
  ventilator_mean_airway_pressure: None,
  ventilator_resp_rate: None,
  ventilator_pressure_support: None,
  ventilator_tidal_volume: None,
  ventilator_oxygen_modality_oxygen_rate: None,
  ventilator_oxygen_modality_flow_rate: None,
  ventilator_fi02: None,
  ventilator_spo2: None,
}

@react.component
let make = (~handleDone) => {
  let (state, send) = React.useReducer(reducer, (initialState: VentilatorParameters.t))

  let editor = switch state.ventilator_interface {
  | INVASIVE => <CriticalCare__VentilatorParametersEditor__Invasive state send />
  | NON_INVASIVE => <CriticalCare__VentilatorParametersEditor__NonInvasive state send />
  | UNKNOWN => <CriticalCare__VentilatorParametersEditor__None state send />
  | _ => <CriticalCare__VentilatorParametersEditor__Invasive state send />
  }
  // Js.log({state})
  <div>
    <CriticalCare__PageTitle title="Ventilator Parameters" />
    <div className="py-6">
      <div className="mb-6">
        <h4> {str("Ventilation Interface")} </h4>
        <div>
          <div className="flex items-center py-4 mb-4">
            <CriticalCare__RadioButton
              defaultChecked={VentilatorParameters.encodeVentilatorInterfaceType(
                state.ventilator_interface,
              )}
              onChange={e =>
                send(
                  SetVentilatorInterface(
                    VentilatorParameters.decodeVentilatorInterfaceType(
                      ReactEvent.Form.target(e)["id"],
                    ),
                  ),
                )}
              options={ventilatorInterfaceOptions}
              ishorizontal={true}
            />
            //   {ventilationInterfaceOptions
            //   |> Array.map(option => {
            //     <div key={option["value"]} className="mr-4">
            //       <label onClick={_ => send(SetVentilationInterface(option["value"]))}>
            //         <input
            //           className="mr-2"
            //           type_="radio"
            //           name="ventilationInterface"
            //           value={option["value"]}
            //           id={option["value"]}
            //           checked={option["value"] === state.VentilatorParameters.ventilationInterface}
            //         />
            //         {str({option["name"]})}
            //       </label>
            //     </div>
            //   })
            //   |> React.array}
          </div>
          {editor}
        </div>
      </div>
      <button
        onClick={_ => handleSubmit(handleDone, state)} className="btn btn-primary btn-large w-full">
        {str("Update Details")}
      </button>
    </div>
  </div>
}
