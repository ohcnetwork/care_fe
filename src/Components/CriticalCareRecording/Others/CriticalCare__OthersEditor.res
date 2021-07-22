let str = React.string
open CriticalCare__Types

@module("../CriticalCare__API")
external updateDailyRound: (string, string, Js.Json.t, _ => unit, _ => unit) => unit =
  "updateDailyRound"

let string_of_float = data => Belt.Option.mapWithDefault(data, "", Js.Float.toString)
let string_of_int = data => Belt.Option.mapWithDefault(data, "", Js.Int.toString)
let int_of_string = data => data->Belt.Int.fromString
let float_of_string = data => data->Belt.Float.fromString

type state = {
  etco2: option<int>,
  saving: bool,
  dirty: bool,
}

type action =
  | SetETCO2(option<int>)
  | SetSaving
  | ClearSaving

let reducer = (state, action) => {
  switch action {
  | SetETCO2(etco2) => {
      ...state,
      etco2: etco2,
      dirty: true,
    }
  | SetSaving => {...state, saving: true}
  | ClearSaving => {...state, saving: false}
  }
}

let initialState = others => {
  {
    etco2: Others.etco2(others),
    saving: false,
    dirty: false,
  }
}

let makePayload = state => {
  let payload = Js.Dict.empty()
  DictUtils.setOptionalNumber("etco2", state.etco2, payload)
  payload
}
let successCB = (send, updateCB, data) => {
  send(ClearSaving)
  updateCB(DailyRound.makeFromJs(data))
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

let isInvalidInputInt = (min, max, val) => {
  let value = Js.Option.getWithDefault(min, val)
  if value < min || value > max {
    Some("Input outside range")
  } else {
    None
  }
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
let make = (~others, ~updateCB, ~id, ~consultationId) => {
  let (state, send) = React.useReducer(reducer, initialState(others))
  <div>
    <CriticalCare__PageTitle title="Others" />
    <div>
      <Slider
        title={"EtCO2 (mm Hg)"}
        start={"0"}
        end={"200"}
        interval={"20"}
        step={1.0}
        value={string_of_int(state.etco2)}
        setValue={s => send(SetETCO2(int_of_string(s)))}
        getLabel={getStatus(35.0, "Low", 45.0, "High")}
        hasError={isInvalidInputInt(0, 200, state.etco2)}
      />
    </div>
    <button
      disabled={state.saving || !state.dirty}
      className="btn btn-primary btn-large w-full"
      onClick={_ => saveData(id, consultationId, state, send, updateCB)}>
      {str("Update Details")}
    </button>
  </div>
}
