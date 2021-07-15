open CriticalCare__Types
let str = React.string

@module("../CriticalCare__API")
external updateDailyRound: (string, string, Js.Json.t, _ => unit, _ => unit) => unit =
  "updateDailyRound"

let getValueAsString = data => Belt.Option.mapWithDefault(data, "", Js.Float.toString)

type state = {
  fields: CriticalCare__ABGAnalysis.t,
  dirty: bool,
  saving: bool,
}

type action =
  | SetPO2(float)
  | SetPCO2(float)
  | SetpH(float)
  | SetHCO3(float)
  | SetBaseExcess(float)
  | SetLactate(float)
  | SetSodium(float)
  | SetPotassium(float)
  | SetSaving
  | ClearSaving

let reducer = (state, action) => {
  switch action {
  | SetPO2(po2) => {...state, fields: {...state.fields, po2: Some(po2)}, dirty: true}
  | SetPCO2(pco2) => {...state, fields: {...state.fields, pco2: Some(pco2)}, dirty: true}
  | SetpH(pH) => {...state, fields: {...state.fields, pH: Some(pH)}, dirty: true}
  | SetHCO3(hco3) => {...state, fields: {...state.fields, hco3: Some(hco3)}, dirty: true}
  | SetBaseExcess(baseExcess) => {
      ...state,
      fields: {...state.fields, baseExcess: Some(baseExcess)},
      dirty: true,
    }
  | SetLactate(lactate) => {
      ...state,
      fields: {...state.fields, lactate: Some(lactate)},
      dirty: true,
    }
  | SetSodium(sodium) => {...state, fields: {...state.fields, sodium: Some(sodium)}, dirty: true}
  | SetPotassium(potassium) => {
      ...state,
      fields: {...state.fields, potassium: Some(potassium)},
      dirty: true,
    }
  | SetSaving => {...state, saving: true}
  | ClearSaving => {...state, saving: false}
  }
}

let initialState = abg => {
  {
    fields: {
      po2: ABGAnalysis.po2(abg),
      pco2: ABGAnalysis.pco2(abg),
      pH: ABGAnalysis.pH(abg),
      hco3: ABGAnalysis.hco3(abg),
      baseExcess: ABGAnalysis.baseExcess(abg),
      lactate: ABGAnalysis.lactate(abg),
      sodium: ABGAnalysis.sodium(abg),
      potassium: ABGAnalysis.potassium(abg),
    },
    saving: false,
    dirty: false,
  }
}

let makePayload = state => {
  let payload = Js.Dict.empty()
  DictUtils.setOptionalFloat("po2", state.fields.po2, payload)
  DictUtils.setOptionalFloat("pco2", state.fields.pco2, payload)
  DictUtils.setOptionalFloat("hco3", state.fields.hco3, payload)
  DictUtils.setOptionalFloat("base_excess", state.fields.baseExcess, payload)
  DictUtils.setOptionalFloat("lactate", state.fields.lactate, payload)
  DictUtils.setOptionalFloat("sodium", state.fields.sodium, payload)
  DictUtils.setOptionalFloat("potassium", state.fields.potassium, payload)
  payload
}

let successCB = (send, updateCB, data) => {
  send(ClearSaving)
  updateCB(CriticalCare__DailyRound.makeFromJs(data))
}

let errorCB = (send, _error) => {
  send(ClearSaving)
}

let showStatus = data => {
  let total = Js.Array.length(CriticalCare__ABGAnalysis.getParams)
  let fieldsData = data.fields
  let count = Js.Array.reduce((acc, getParam) => {
    if getValueAsString(fieldsData->getParam) !== "" {
      acc +. 1.0
    } else {
      acc
    }
  }, 0.0, CriticalCare__ABGAnalysis.getParams)
  Js.Float.toFixed(count /. float_of_int(total) *. 100.0)
}

let saveData = (id, consultationId, state, send, updateCB, percentCompleteCB) => {
  send(SetSaving)
  updateDailyRound(
    consultationId,
    id,
    Js.Json.object_(makePayload(state)),
    successCB(send, updateCB),
    errorCB(send),
  )
  percentCompleteCB(showStatus(state))
}

let getStatus = (min, minText, max, maxText, val) => {
  if val >= min && val <= max {
    ("Normal", "#059669")
  } else if val < min {
    (minText, "#DC2626")
  } else {
    (maxText, "#DC2626")
  }
}

@react.component
let make = (~arterialBloodGasAnalysis, ~updateCB, ~percentCompleteCB, ~id, ~consultationId) => {
  let (state, send) = React.useReducer(reducer, initialState(arterialBloodGasAnalysis))

  <div>
    <CriticalCare__PageTitle title="Arterial Blood Gas Analysis" />
    <div className="my-4">
      <Slider
        title={"PO2 (mm Hg)"}
        start={"10"}
        end={"400"}
        interval={"50"}
        step={0.1}
        value={getValueAsString(state.fields.po2)}
        setValue={s => send(SetPO2(float_of_string(s)))}
        getLabel={getStatus(50.0, "Low", 200.0, "High")}
      />
      <Slider
        title={"PCO2 (mm Hg)"}
        start={"10"}
        end={"200"}
        interval={"20"}
        step={0.1}
        value={getValueAsString(state.fields.pco2)}
        setValue={s => send(SetPCO2(float_of_string(s)))}
        getLabel={getStatus(35.0, "Low", 45.0, "High")}
      />
      <Slider
        title={"pH"}
        start={"0.00"}
        end={"10.00"}
        interval={"1.00"}
        step={0.1}
        value={getValueAsString(state.fields.pH)}
        setValue={s => send(SetpH(float_of_string(s)))}
        getLabel={getStatus(7.35, "Low", 7.45, "High")}
      />
      <Slider
        title={"HCO3 (mmol/L)"}
        start={"5"}
        end={"80"}
        interval={"5"}
        step={0.1}
        value={getValueAsString(state.fields.hco3)}
        setValue={s => send(SetHCO3(float_of_string(s)))}
        getLabel={getStatus(22.0, "Low", 26.0, "High")}
      />
      <Slider
        title={"Base Excess (mmol/L)"}
        start={"-20"}
        end={"20"}
        interval={"5"}
        step={0.1}
        value={getValueAsString(state.fields.baseExcess)}
        setValue={s => send(SetBaseExcess(float_of_string(s)))}
        getLabel={getStatus(-2.0, "Low", 2.0, "High")}
      />
      <Slider
        title={"Lactate (mmol/L)"}
        start={"0"}
        end={"20"}
        interval={"2"}
        step={0.1}
        value={getValueAsString(state.fields.lactate)}
        setValue={s => send(SetLactate(float_of_string(s)))}
        getLabel={getStatus(0.0, "Low", 2.0, "High")}
      />
      <Slider
        title={"Sodium (mmol/L)"}
        start={"100"}
        end={"170"}
        interval={"10"}
        step={0.1}
        value={getValueAsString(state.fields.sodium)}
        setValue={s => send(SetSodium(float_of_string(s)))}
        getLabel={getStatus(135.0, "Low", 145.0, "High")}
      />
      <Slider
        title={"Potassium (mmol/L)"}
        start={"1"}
        end={"10"}
        interval={"1"}
        step={0.1}
        value={getValueAsString(state.fields.potassium)}
        setValue={s => send(SetPotassium(float_of_string(s)))}
        getLabel={getStatus(3.5, "Low", 5.5, "High")}
      />
    </div>
    <button
      disabled={state.saving || !state.dirty}
      className="flex w-full bg-primary-600 text-white p-2 text-lg hover:bg-primary-800 justify-center items-center rounded-md"
      onClick={_ => saveData(id, consultationId, state, send, updateCB, percentCompleteCB)}>
      {str("Update Details")}
    </button>
  </div>
}
