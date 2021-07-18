let str = React.string
open CriticalCare__Types

@module("../CriticalCare__API")
external updateDailyRound: (string, string, Js.Json.t, _ => unit, _ => unit) => unit =
  "updateDailyRound"

type state = {
  parts: array<PressureSore.part>,
  saving: bool,
  dirty: bool,
}

type action =
  | UpdatePart(PressureSore.part)
  | AutoManageScale(PressureSore.part)
  | AddPressureSore(PressureSore.region)
  | SetSaving
  | ClearSaving

let reducer = (state, action) => {
  switch action {
  | UpdatePart(part) => {
      ...state,
      parts: Js.Array.map(
        p => PressureSore.region(p) === PressureSore.region(part) ? part : p,
        state.parts,
      ),
      dirty: true,
    }
  | AutoManageScale(part) => {
      ...state,
      parts: Js.Array.map(
        p =>
          PressureSore.region(p) === PressureSore.region(part) ? PressureSore.autoScale(part) : p,
        state.parts,
      ),
      dirty: true,
    }
  | AddPressureSore(region) => {
      ...state,
      parts: Js.Array.concat(state.parts, [PressureSore.makeDefault(region)]),
      dirty: true,
    }
  | SetSaving => {...state, saving: true}
  | ClearSaving => {...state, saving: false}
  }
}

let makeField = p => {
  let payload = Js.Dict.empty()
  Js.Dict.set(payload, "region", Js.Json.string(PressureSore.endcodeRegion(p)))
  Js.Dict.set(payload, "scale", Js.Json.number(float_of_int(PressureSore.scale(p))))
  payload
}

let makePayload = state => {
  Js.Dict.fromArray([("pressure_sore", Js.Json.objectArray(Js.Array.map(makeField, state.parts)))])
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

let initialSelected = endValue => {
  let initialPartsSelected = ref([])
  let i = ref(0)
  while i.contents <= endValue {
    initialPartsSelected.contents = Js.Array.concat([false], initialPartsSelected.contents)
    i := i.contents + 1
  }
  initialPartsSelected.contents
}

let initialState = psp => {
  {
    parts: psp,
    saving: false,
    dirty: false,
  }
}

let selectedClass = part => {
  switch part {
  | Some(p) =>
    switch PressureSore.scale(p) {
    | 1 => "text-red-200 tooltip"
    | 2 => "text-red-400 tooltip"
    | 3 => "text-red-500 tooltip"
    | 4 => "text-red-600 tooltip"
    | 5 => "text-red-700 tooltip"
    | _ => "text-gray-400 tooltip"
    }
  | None => "text-gray-400 hover:text-red-100 tooltip"
  }
}

let renderBody = (state, send, title, partPaths) => {
  <div className="w-full text-center">
    <div className="text-2xl font-bold mt-10"> {str(title)} </div>
    <div className="flex justify-center max-w-lg mx-auto">
      <svg className="h-screen py-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 344.7 932.661">
        {Js.Array.mapi((part, renderIndex) => {
          let selectedPart = Js.Array.find(
            p => PressureSore.region(p) === PressureSore.regionForPath(part),
            state.parts,
          )
          <path
            key={"part1" ++ Belt.Int.toString(renderIndex)}
            d={PressureSore.d(part)}
            transform={PressureSore.transform(part)}
            className={selectedClass(selectedPart)}
            fill="currentColor"
            onClick={_ => {
              switch selectedPart {
              | Some(p) => send(AutoManageScale(p))
              | None => send(AddPressureSore(PressureSore.regionForPath(part)))
              }
            }}>
            <title className="">
              {str(PressureSore.regionToString(PressureSore.regionForPath(part)))}
            </title>
          </path>
        }, partPaths)->React.array}
      </svg>
    </div>
  </div>
}

@react.component
let make = (~pressureSoreParameter, ~updateCB, ~id, ~consultationId) => {
  let (state, send) = React.useReducer(reducer, initialState(pressureSoreParameter))

  <div className="my-5">
    <h2> {str("Pressure Sore")} </h2>
    <div className="flex md:flex-row flex-col justify-between">
      {renderBody(state, send, "Front", PressureSore.anteriorParts)}
      {renderBody(state, send, "Back", PressureSore.posteriorParts)}
    </div>
    <div className="space-y-2">
      <div className="text-xl font-bold "> {str("Braden Scale (Risk Severity)")} </div>
      {Js.Array.map(p => {
        <div className="flex" key={PressureSore.regionToString(PressureSore.region(p))}>
          <div className="font-semibold text-gray-800">
            {str(PressureSore.regionToString(PressureSore.region(p)) ++ ": ")}
          </div>
          <div className="pl-2 text-gray-800"> {str(string_of_int(PressureSore.scale(p)))} </div>
        </div>
      }, state.parts)->React.array}
    </div>
    <button
      disabled={state.saving || !state.dirty}
      className="mt-4 btn btn-primary btn-large w-full"
      onClick={_ => saveData(id, consultationId, state, send, updateCB)}>
      {str("Done")}
    </button>
  </div>
}
