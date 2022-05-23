let str = React.string
open CriticalCare__Types

@module("../CriticalCare__API")
external updateDailyRound: (string, string, Js.Json.t, _ => unit, _ => unit) => unit =
  "updateDailyRound"

open VentilatorParameters

let reducer = (state: VentilatorParameters.state, action: VentilatorParameters.action) => {
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
  | SetSaving => {...state, saving: true}
  | ClearSaving => {...state, saving: false}
  | _ => state
  }
}

let makePayload = (state: VentilatorParameters.state) => {
  let payload = Js.Dict.empty()
  DictUtils.setOptionalString(
    "ventilator_interface",
    VentilatorParameters.encodeVentilatorInterfaceType(state.ventilator_interface),
    payload,
  )
  DictUtils.setOptionalString(
    "ventilator_mode",
    VentilatorParameters.encodeVentilatorModeType(state.ventilator_mode),
    payload,
  )
  DictUtils.setOptionalString(
    "ventilator_oxygen_modality",
    VentilatorParameters.encodeVentilatorOxygenModalityType(state.ventilator_oxygen_modality),
    payload,
  )
  DictUtils.setOptionalFloat("ventilator_peep", state.ventilator_peep, payload)
  DictUtils.setOptionalNumber("ventilator_pip", state.ventilator_pip, payload)
  DictUtils.setOptionalNumber(
    "ventilator_mean_airway_pressure",
    state.ventilator_mean_airway_pressure,
    payload,
  )
  DictUtils.setOptionalNumber("ventilator_resp_rate", state.ventilator_resp_rate, payload)
  DictUtils.setOptionalNumber(
    "ventilator_pressure_support",
    state.ventilator_pressure_support,
    payload,
  )
  DictUtils.setOptionalNumber("ventilator_tidal_volume", state.ventilator_tidal_volume, payload)
  DictUtils.setOptionalNumber(
    "ventilator_oxygen_modality_oxygen_rate",
    state.ventilator_interface === UNKNOWN &&
      state.ventilator_oxygen_modality !== HIGH_FLOW_NASAL_CANNULA
      ? state.ventilator_oxygen_modality_oxygen_rate
      : None,
    payload,
  )
  DictUtils.setOptionalNumber(
    "ventilator_oxygen_modality_flow_rate",
    state.ventilator_oxygen_modality === HIGH_FLOW_NASAL_CANNULA
      ? state.ventilator_oxygen_modality_flow_rate
      : None,
    payload,
  )
  DictUtils.setOptionalNumber(
    "ventilator_fi02",
    state.ventilator_oxygen_modality === HIGH_FLOW_NASAL_CANNULA ||
    state.ventilator_interface === INVASIVE ||
    state.ventilator_interface === NON_INVASIVE
      ? state.ventilator_fi02
      : None,
    payload,
  )
  DictUtils.setOptionalNumber("ventilator_spo2", state.ventilator_spo2, payload)

  payload
}

let successCB = (_send, updateCB, data) => {
  updateCB(CriticalCare__DailyRound.makeFromJs(data))
}

let errorCB = (send, _error) => {
  send(ClearSaving)
}

let saveData = (id, consultationId, state, send, updateCB) => {
  send(SetSaving)
  updateDailyRound(
    consultationId,
    id,
    Js.Json.object_(makePayload(state)),
    successCB(send, updateCB),
    errorCB(send),
  )
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

let initialState: VentilatorParameters.t => VentilatorParameters.state = ventilatorParameters => {
  {
    ventilator_interface: ventilatorParameters.ventilator_interface,
    ventilator_mode: ventilatorParameters.ventilator_mode,
    ventilator_oxygen_modality: ventilatorParameters.ventilator_oxygen_modality,
    ventilator_peep: ventilatorParameters.ventilator_peep,
    ventilator_pip: ventilatorParameters.ventilator_pip,
    ventilator_mean_airway_pressure: ventilatorParameters.ventilator_mean_airway_pressure,
    ventilator_resp_rate: ventilatorParameters.ventilator_resp_rate,
    ventilator_pressure_support: ventilatorParameters.ventilator_pressure_support,
    ventilator_tidal_volume: ventilatorParameters.ventilator_tidal_volume,
    ventilator_oxygen_modality_oxygen_rate: ventilatorParameters.ventilator_oxygen_modality_oxygen_rate,
    ventilator_oxygen_modality_flow_rate: ventilatorParameters.ventilator_oxygen_modality_flow_rate,
    ventilator_fi02: ventilatorParameters.ventilator_fi02,
    ventilator_spo2: ventilatorParameters.ventilator_spo2,
    saving: false,
  }
}

@react.component
let make = (~ventilatorParameters: VentilatorParameters.t, ~id, ~consultationId, ~updateCB) => {
  let (state, send) = React.useReducer(reducer, initialState(ventilatorParameters))

  let editor = switch state.ventilator_interface {
  | INVASIVE => <CriticalCare__VentilatorParametersEditor__Invasive state send />
  | NON_INVASIVE => <CriticalCare__VentilatorParametersEditor__NonInvasive state send />
  | UNKNOWN => <CriticalCare__VentilatorParametersEditor__None state send />
  }

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
          </div>
          {editor}
        </div>
      </div>
      <button
        disabled={state.saving}
        onClick={_ => saveData(id, consultationId, state, send, updateCB)}
        className="btn btn-primary btn-large w-full">
        {str("Update Details")}
      </button>
    </div>
  </div>
}
