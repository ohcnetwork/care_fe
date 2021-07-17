let str = React.string
open CriticalCare__Types

@module("../CriticalCare__API")
external updateDailyRound: (string, string, Js.Json.t, _ => unit, _ => unit) => unit =
  "updateDailyRound"

type state = {
  dialysis_fluid_balance: option<int>,
  dialysis_net_balance: option<int>,
  dirty: bool,
  saving: bool,
}

type action =
  | SetFluidBalance(int)
  | SetNetBalance(int)
  | SetSaving
  | ClearSaving

let reducer = (state, action) => {
  switch action {
  | SetFluidBalance(fluid_balance) => {
      ...state,
      dialysis_fluid_balance: Some(fluid_balance),
      dirty: true,
    }
  | SetNetBalance(net_balance) => {
      ...state,
      dialysis_net_balance: Some(net_balance),
      dirty: true,
    }
  | SetSaving => {...state, saving: true}
  | ClearSaving => {...state, saving: false}
  }
}

let initialState = dialysis_parameters => {
  {
    dialysis_fluid_balance: Dialysis.fluid_balance(dialysis_parameters),
    dialysis_net_balance: Dialysis.net_balance(dialysis_parameters),
    saving: false,
    dirty: false,
  }
}

let makePayload = state => {
  let payload = Js.Dict.empty()

  DictUtils.setOptionalNumber("dialysis_fluid_balance", state.dialysis_fluid_balance, payload)
  DictUtils.setOptionalNumber("dialysis_net_balance", state.dialysis_net_balance, payload)

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
let make = (~dialysisParameters, ~updateCB, ~id, ~consultationId) => {
  let (state, send) = React.useReducer(reducer, initialState(dialysisParameters))

  <div>
    <h2> {str("Dialysis")} </h2>
    <div className="flex items-center flex-col">
      <div className="w-full">
        <Slider
          title={"Dialysis Fluid Balance (ml/h)"}
          start={"0"}
          end={"700"}
          interval={"100"}
          step={1.0}
          value={Belt.Option.mapWithDefault(state.dialysis_fluid_balance, "", string_of_int)}
          setValue={s => send(SetFluidBalance(int_of_string(s)))}
          getLabel={_ => ("", "#ff0000")}
        />
        <Slider
          title={"Dialysis Net Balance (ml/h)"}
          start={"0"}
          end={"700"}
          interval={"100"}
          step={1.0}
          value={Belt.Option.mapWithDefault(state.dialysis_net_balance, "", string_of_int)}
          setValue={s => send(SetNetBalance(int_of_string(s)))}
          getLabel={_ => ("", "#ff0000")}
        />
      </div>
      <button
        disabled={state.saving || !state.dirty}
        className="btn btn-primary btn-large w-full"
        onClick={_ => saveData(id, consultationId, state, send, updateCB)}>
        {str("Update Details")}
      </button>
    </div>
  </div>
}
