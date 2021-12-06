open CriticalCare__Types
let str = React.string

@module("../CriticalCare__API")
external updateDailyRound: (string, string, Js.Json.t, _ => unit, _ => unit) => unit =
  "updateDailyRound"

type state = {
  infusions: array<IOBalance.item>,
  ivfluids: array<IOBalance.item>,
  feeds: array<IOBalance.item>,
  outputs: array<IOBalance.item>,
  dirty: bool,
  saving: bool,
}

let infusionCollection = ["Adrenalin", "Nor-adrenalin", "Vasopressin", "Dopamine", "Dobutamine"]
let ivfluidsCollection = ["RL", "NS", "DNS"]
let feedsCollection = ["Ryles Tube", "Normal Feed", "Calories"]
let outputsCollection = ["Urine", "Rules Tube Aspiration", "ICD"]

type action =
  | SetInfusions(array<IOBalance.item>)
  | SetIVFluid(array<IOBalance.item>)
  | SetFeed(array<IOBalance.item>)
  | SetOutput(array<IOBalance.item>)
  | SetSaving
  | ClearSaving

let reducer = (state, action) => {
  switch action {
  | SetInfusions(infusions) => {...state, infusions: infusions}
  | SetIVFluid(ivfluids) => {...state, ivfluids: ivfluids}
  | SetFeed(feeds) => {...state, feeds: feeds}
  | SetOutput(outputs) => {...state, outputs: outputs}
  | SetSaving => {...state, saving: true}
  | ClearSaving => {...state, saving: false}
  }
}

let initialState = iob => {
  {
    infusions: IOBalance.infusions(iob),
    ivfluids: IOBalance.ivFluid(iob),
    feeds: IOBalance.feed(iob),
    outputs: IOBalance.output(iob),
    dirty: false,
    saving: false,
  }
}

let makeUnitsPayload = items => {
  Js.Array.map(item => {
    let p = Js.Dict.empty()
    Js.Dict.set(p, "name", Js.Json.string(IOBalance.name(item)))
    Js.Dict.set(p, "quantity", Js.Json.number(IOBalance.quantity(item)))
    p
  }, items)
}

let makePayload = state => {
  let payload = Js.Dict.empty()
  Js.Dict.set(payload, "infusions", Js.Json.objectArray(makeUnitsPayload(state.infusions)))
  Js.Dict.set(payload, "iv_fluids", Js.Json.objectArray(makeUnitsPayload(state.ivfluids)))
  Js.Dict.set(payload, "feeds", Js.Json.objectArray(makeUnitsPayload(state.feeds)))
  Js.Dict.set(payload, "output", Js.Json.objectArray(makeUnitsPayload(state.outputs)))

  payload
}

let successCB = (send, updateCB, data) => {
  updateCB(CriticalCare__DailyRound.makeFromJs(data))
  send(ClearSaving)
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

let sumOfArray = items => {
  Js.Array.reduce(\"+.", 0.0, Js.Array.map(IOBalance.quantity, items))
}

@react.component
let make = (~ioBalance, ~updateCB, ~id, ~consultationId) => {
  let (state, send) = React.useReducer(reducer, initialState(ioBalance))

  let outputsTotal = sumOfArray(state.outputs)
  let totalInput = sumOfArray(ArrayUtils.flatten([state.infusions, state.ivfluids, state.feeds]))

  <div>
    <CriticalCare__PageTitle title="I/O Balance Editor" />
    <div id="intake" className="pb-3">
      <h3> {str("Intake")} </h3>
      <IOBalance__UnitSection
        name="Infusions"
        items={state.infusions}
        collection={infusionCollection}
        updateCB={infusions => send(SetInfusions(infusions))}
      />
      <IOBalance__UnitSection
        name="IV Fluid"
        items={state.ivfluids}
        collection={ivfluidsCollection}
        updateCB={ivfluid => send(SetIVFluid(ivfluid))}
      />
      <IOBalance__UnitSection
        name="Feed"
        items={state.feeds}
        collection={feedsCollection}
        updateCB={feed => send(SetFeed(feed))}
      />
      <IOBalance__Summary
        leftMain="Total"
        rightSub={Js.Array.map(
          IOBalance.quantity,
          ArrayUtils.flatten([state.infusions, state.ivfluids, state.feeds]),
        )->Js.Array2.joinWith("+")}
        rightMain={Js.Float.toString(totalInput)}
      />
    </div>
    <div id="outturn" className="pt-3">
      <h3> {str("Outturn")} </h3>
      <IOBalance__UnitSection
        name="Output"
        items={state.outputs}
        collection={outputsCollection}
        updateCB={output => send(SetOutput(output))}
      />
      <IOBalance__Summary
        leftMain="Total"
        rightSub={Js.Array.map(IOBalance.quantity, state.outputs)->Js.Array2.joinWith("+")}
        rightMain={Js.Float.toString(outputsTotal)}
      />
    </div>
    <IOBalance__Summary
      leftMain="I/O Balance"
      rightSub={Js.Float.toString(totalInput) ++ "-" ++ Js.Float.toString(outputsTotal)}
      rightMain={Js.Float.toString(totalInput -. outputsTotal)}
      noBorder={true}
    />
    <button
      className="btn btn-primary btn-large w-full"
      onClick={_ => saveData(id, consultationId, state, send, updateCB)}>
      {str("Update Details")}
    </button>
  </div>
}
