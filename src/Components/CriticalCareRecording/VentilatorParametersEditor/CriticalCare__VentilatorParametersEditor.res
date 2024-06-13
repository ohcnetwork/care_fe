let str = React.string
open CriticalCare__Types

@module("../CriticalCare__API")
external updateDailyRound: (string, string, Js.Json.t, _ => unit, _ => unit) => unit =
  "updateDailyRound"

@module("../CriticalCare__API")
external getAsset: (string, (int => int) => unit) => option<unit => unit> = "getAsset"

open VentilatorParameters

let string_of_int = data => Belt.Option.mapWithDefault(data, "", Js.Int.toString)
let int_of_string = data => data->Belt.Int.fromString

let reducer = (state: VentilatorParameters.state, action: VentilatorParameters.action) => {
  switch action {
  | SetBilateralAirEntry(bilateral_air_entry) => {
      ...state,
      bilateral_air_entry,
    }
  | SetETCO2(etco2) => {
      ...state,
      etco2,
    }
  | SetVentilatorInterface(ventilator_interface) => {
      ...state,
      ventilator_interface,
    }
  | SetVentilatorMode(ventilator_mode) => {
      ...state,
      ventilator_mode,
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
      ventilator_oxygen_modality_oxygen_rate,
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
  DictUtils.setOptionalBool("bilateral_air_entry", state.bilateral_air_entry, payload)
  DictUtils.setOptionalNumber("etco2", state.etco2, payload)
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
    label: "None",
    value: "UNKNOWN",
    name: "ventilator_interface",
  },
  {
    label: "Invasive ventilator (IV)",
    value: "INVASIVE",
    name: "ventilator_interface",
  },
  {
    label: "Non-Invasive ventilator (NIV)",
    value: "NON_INVASIVE",
    name: "ventilator_interface",
  },
  {
    label: "Oxygen Support",
    value: "OXYGEN_SUPPORT",
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
    etco2: ventilatorParameters.etco2,
    bilateral_air_entry: ventilatorParameters.bilateral_air_entry,
    saving: false,
  }
}

@react.component
let make = (
  ~ventilatorParameters: VentilatorParameters.t,
  ~id,
  ~consultationId,
  ~updateCB,
  ~facilityId,
  ~patientId,
) => {
  let (state, send) = React.useReducer(reducer, initialState(ventilatorParameters))
  let (isOpen, setIsOpen) = React.useState(() => false)
  let toggleOpen = () => setIsOpen(prevState => !prevState)
  let (asset, setAsset) = React.useState(() => 0)

  React.useEffect1(() => {
    getAsset(consultationId, setAsset)
  }, [isOpen])

  let editor = switch state.ventilator_interface {
  | INVASIVE => <CriticalCare__VentilatorParametersEditor__Invasive state send />
  | NON_INVASIVE => <CriticalCare__VentilatorParametersEditor__NonInvasive state send />
  | UNKNOWN => <CriticalCare__VentilatorParametersEditor__None />
  | OXYGEN_SUPPORT => <CriticalCare__VentilatorParametersEditor__OxygenSupport state send />
  }

  <div>
    <CriticalCare__PageTitle title="Respiratory Support" />
    <div>
      <div className="px-5 my-10">
        <div className=" text-xl font-bold my-2"> {str("Bilateral Air Entry")} </div>
        <div className="flex md:flex-row flex-col md:space-y-0 space-y-2 space-x-0 md:space-x-4">
          <Radio
            key="bilateral-air-entry-yes"
            id="bilateral-air-entry-yes"
            label="Yes"
            checked={switch state.bilateral_air_entry {
            | Some(bae) => bae
            | None => false
            }}
            onChange={_ => send(SetBilateralAirEntry(Some(true)))}
          />
          <Radio
            key="bilateral-air-entry-no"
            id="bilateral-air-entry-no"
            label="No"
            checked={switch state.bilateral_air_entry {
            | Some(bae) => !bae
            | None => false
            }}
            onChange={_ => send(SetBilateralAirEntry(Some(false)))}
          />
        </div>
      </div>
      <Slider
        title={"EtCO2 (mm Hg)"}
        start={"0"}
        end={"200"}
        interval={"20"}
        step={1.0}
        value={string_of_int(state.etco2)}
        setValue={s => send(SetETCO2(int_of_string(s)))}
        getLabel={getStatus(35.0, "Low", 45.0, "High")}
        hasError={ValidationUtils.isInputInRangeInt(0, 200, state.etco2)}
      />
    </div>
    <div className="py-6">
      <div className="mb-6">
        <h4> {str("Respiratory Support")} </h4>
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
        onClick={_ => {
          // here checking if any asset linked or not before proceeding
          if (
            asset == 0 &&
              (state.ventilator_interface !=
                CriticalCare__VentilatorParameters.decodeVentilatorInterfaceType(
                  ventilatorInterfaceOptions[0].value,
                ) &&
              state.ventilator_interface !=
                CriticalCare__VentilatorParameters.decodeVentilatorInterfaceType(
                  ventilatorInterfaceOptions[3].value,
                ))
          ) {
            toggleOpen()
          } else {
            saveData(id, consultationId, state, send, updateCB)
          }
        }}
        className="btn btn-primary btn-large w-full">
        {str("Update Details")}
      </button>
      <DialogModal
        title={str("Link an asset to proceed")}
        show={isOpen}
        onClose={_ => toggleOpen()}
        className="md:max-w-3xl">
        <Beds
          facilityId={facilityId}
          patientId={patientId}
          consultationId={consultationId}
          setState={_ => toggleOpen()}
        />
      </DialogModal>
    </div>
  </div>
}
