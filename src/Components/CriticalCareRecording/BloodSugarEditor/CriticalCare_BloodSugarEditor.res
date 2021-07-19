let str = React.string
open CriticalCare__Types

@module("../CriticalCare__API")
external updateDailyRound: (string, string, Js.Json.t, _ => unit, _ => unit) => unit =
  "updateDailyRound"

type state = {
  blood_sugar_level: option<int>,
  insulin_intake_dose: option<float>,
  insulin_intake_frequency: BloodSugar.frequency,
  dirty: bool,
  saving: bool,
}

type action =
  | SetBloodSugarLevel(int)
  | SetDosage(float)
  | SetFrequency(BloodSugar.frequency)
  | SetSaving
  | ClearSaving

let reducer = (state, action) => {
  switch action {
  | SetBloodSugarLevel(blood_sugar_level) => {
      ...state,
      blood_sugar_level: Some(blood_sugar_level),
      dirty: true,
    }
  | SetDosage(dosage) => {...state, insulin_intake_dose: Some(dosage), dirty: true}
  | SetFrequency(frequency) => {...state, insulin_intake_frequency: frequency, dirty: true}
  | SetSaving => {...state, saving: true}
  | ClearSaving => {...state, saving: false}
  }
}

let getStatus = (min, max, val) => {
  if val >= min && val <= max {
    ("Normal", "#059669")
  } else if val < min {
    ("Low", "#DC2626")
  } else {
    ("High", "#DC2626")
  }
}

let initialState = bloodsugarParameters => {
  {
    blood_sugar_level: BloodSugar.bloodsugar_level(bloodsugarParameters),
    insulin_intake_dose: BloodSugar.dosage(bloodsugarParameters),
    insulin_intake_frequency: BloodSugar.frequency(bloodsugarParameters),
    saving: false,
    dirty: false,
  }
}

let makePayload = state => {
  let payload = Js.Dict.empty()

  DictUtils.setOptionalNumber("blood_sugar_level", state.blood_sugar_level, payload)
  DictUtils.setOptionalFloat("insulin_intake_dose", state.insulin_intake_dose, payload)
  Js.Dict.set(
    payload,
    "insulin_intake_frequency",
    Js.Json.string(BloodSugar.encodeFrequency(state.insulin_intake_frequency)),
  )
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

@react.component
let make = (~bloodsugarParameters, ~updateCB, ~id, ~consultationId) => {
  let (state, send) = React.useReducer(reducer, initialState(bloodsugarParameters))

  <div>
    <h2> {str("Blood Sugar")} </h2>
    <div className="flex items-center flex-col">
      <Slider
        title={"Blood Sugar Level(mg/dL)"}
        start={"0"}
        end={"700"}
        interval={"100"}
        step={1.0}
        value={Belt.Option.mapWithDefault(state.blood_sugar_level, "", string_of_int)}
        setValue={s => send(SetBloodSugarLevel(int_of_string(s)))}
        getLabel={getStatus(70.0, 110.0)}
      />
      <h4 className="self-start"> {str("Insulin Intake")} </h4>
      <Slider
        title={"Dosage(units)"}
        start={"0"}
        end={"100"}
        interval={"10"}
        step={0.1}
        value={Belt.Option.mapWithDefault(state.insulin_intake_dose, "", Js.Float.toString)}
        setValue={s => send(SetDosage(float_of_string(s)))}
        getLabel={_ => ("", "#ff0000")}
      />
      <div className="w-full mb-10 px-3">
        <label className="block mb-2 font-bold"> {str("Frequency")} </label>
        <div className="flex md:flex-row flex-col md:space-y-0 space-y-2 space-x-0 md:space-x-4">
          {Js.Array.map(
            f =>
              <Radio
                key={"Frequency" ++ BloodSugar.frequencyToString(f)}
                id={"Frequency" ++ BloodSugar.frequencyToString(f)}
                label={BloodSugar.frequencyToString(f)}
                checked={f === state.insulin_intake_frequency}
                onChange={_ => send(SetFrequency(f))}
              />,
            [OD, BD, TD, UNKNOWN],
          )->React.array}
        </div>
      </div>
    </div>
    <button
      disabled={state.saving || !state.dirty}
      className="btn btn-primary btn-large w-full"
      onClick={_ => saveData(id, consultationId, state, send, updateCB)}>
      {str("Update Details")}
    </button>
  </div>
}
