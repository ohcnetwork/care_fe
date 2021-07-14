open CriticalCare__Types
let str = React.string

@module("../CriticalCare__API")
external updateDailyRound: (string, string, Js.Json.t, _ => unit, _ => unit) => unit =
  "updateDailyRound"

type state = {
  po2: option<float>,
  pco2: option<float>,
  pH: option<float>,
  hco3: option<float>,
  baseExcess: option<float>,
  lactate: option<float>,
  sodium: option<float>,
  potassium: option<float>,
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
  | SetPO2(po2) => {...state, po2: Some(po2), dirty: true}
  | SetPCO2(pco2) => {...state, pco2: Some(pco2), dirty: true}
  | SetpH(pH) => {...state, pH: Some(pH), dirty: true}
  | SetHCO3(hco3) => {...state, hco3: Some(hco3), dirty: true}
  | SetBaseExcess(baseExcess) => {...state, baseExcess: Some(baseExcess), dirty: true}
  | SetLactate(lactate) => {...state, lactate: Some(lactate), dirty: true}
  | SetSodium(sodium) => {...state, sodium: Some(sodium), dirty: true}
  | SetPotassium(potassium) => {...state, potassium: Some(potassium), dirty: true}
  | SetSaving => {...state, saving: true}
  | ClearSaving => {...state, saving: false}
  }
}

let initialState = abg => {
  {
    po2: ABGAnalysis.po2(abg),
    pco2: ABGAnalysis.pco2(abg),
    pH: ABGAnalysis.pH(abg),
    hco3: ABGAnalysis.hco3(abg),
    baseExcess: ABGAnalysis.baseExcess(abg),
    lactate: ABGAnalysis.lactate(abg),
    sodium: ABGAnalysis.sodium(abg),
    potassium: ABGAnalysis.potassium(abg),
    saving: false,
    dirty: false,
  }
}

let makePayload = state => {
  let payload = Js.Dict.empty()
  DictUtils.setOptionalFloat("po2", state.po2, payload)
  DictUtils.setOptionalFloat("pco2", state.pco2, payload)
  DictUtils.setOptionalFloat("hco3", state.hco3, payload)
  DictUtils.setOptionalFloat("base_excess", state.baseExcess, payload)
  DictUtils.setOptionalFloat("lactate", state.lactate, payload)
  DictUtils.setOptionalFloat("sodium", state.sodium, payload)
  DictUtils.setOptionalFloat("potassium", state.potassium, payload)
  payload
}

let successCB = (send, updateCB, data) => {
  send(ClearSaving)
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
let make = (~arterialBloodGasAnalysis, ~updateCB, ~id, ~consultationId) => {
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
        value={Belt.Option.mapWithDefault(state.po2, "", Js.Float.toString)}
        setValue={s => send(SetPO2(float_of_string(s)))}
        getLabel={getStatus(50.0, "Low", 200.0, "High")}
      />
      <Slider
        title={"PCO2 (mm Hg)"}
        start={"10"}
        end={"200"}
        interval={"20"}
        step={0.1}
        value={Belt.Option.mapWithDefault(state.pco2, "", Js.Float.toString)}
        setValue={s => send(SetPCO2(float_of_string(s)))}
        getLabel={getStatus(35.0, "Low", 45.0, "High")}
      />
      <Slider
        title={"pH"}
        start={"0.00"}
        end={"10.00"}
        interval={"1.00"}
        step={0.1}
        value={Belt.Option.mapWithDefault(state.pH, "", Js.Float.toString)}
        setValue={s => send(SetpH(float_of_string(s)))}
        getLabel={getStatus(7.35, "Low", 7.45, "High")}
      />
      <Slider
        title={"HCO3 (mmol/L)"}
        start={"5"}
        end={"80"}
        interval={"5"}
        step={0.1}
        value={Belt.Option.mapWithDefault(state.hco3, "", Js.Float.toString)}
        setValue={s => send(SetHCO3(float_of_string(s)))}
        getLabel={getStatus(22.0, "Low", 26.0, "High")}
      />
      <Slider
        title={"Base Excess (mmol/L)"}
        start={"-20"}
        end={"20"}
        interval={"5"}
        step={0.1}
        value={Belt.Option.mapWithDefault(state.baseExcess, "", Js.Float.toString)}
        setValue={s => send(SetBaseExcess(float_of_string(s)))}
        getLabel={getStatus(-2.0, "Low", 2.0, "High")}
      />
      <Slider
        title={"Lactate (mmol/L)"}
        start={"0"}
        end={"20"}
        interval={"2"}
        step={0.1}
        value={Belt.Option.mapWithDefault(state.lactate, "", Js.Float.toString)}
        setValue={s => send(SetLactate(float_of_string(s)))}
        getLabel={getStatus(0.0, "Low", 2.0, "High")}
      />
      <Slider
        title={"Sodium (mmol/L)"}
        start={"100"}
        end={"170"}
        interval={"10"}
        step={0.1}
        value={Belt.Option.mapWithDefault(state.sodium, "", Js.Float.toString)}
        setValue={s => send(SetSodium(float_of_string(s)))}
        getLabel={getStatus(135.0, "Low", 145.0, "High")}
      />
      <Slider
        title={"Potassium (mmol/L)"}
        start={"1"}
        end={"10"}
        interval={"1"}
        step={0.1}
        value={Belt.Option.mapWithDefault(state.potassium, "", Js.Float.toString)}
        setValue={s => send(SetPotassium(float_of_string(s)))}
        getLabel={getStatus(3.5, "Low", 5.5, "High")}
      />
    </div>
    <button
      disabled={state.saving || !state.dirty}
      className="flex w-full bg-primary-600 text-white p-2 text-lg hover:bg-primary-800 justify-center items-center rounded-md"
      onClick={_ => saveData(id, consultationId, state, send, updateCB)}>
      {str("Update Details")}
    </button>
  </div>
}
