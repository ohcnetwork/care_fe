@val external document: 'a = "document"

let str = React.string
open CriticalCare__Types

@module("../CriticalCare__API")
external updateDailyRound: (string, string, Js.Json.t, _ => unit, _ => unit) => unit =
  "updateDailyRound"

// type for scrollIntoView function options
type scrollIntoView = {
  behavior: string,
  block: string,
  inline: string,
}

type state = {
  parts: array<PressureSore.part>,
  saving: bool,
  dirty: bool,
}

type action =
  | AutoManageScale(PressureSore.part)
  | AddPressureSore(PressureSore.region)
  | RemoveFromSelectedParts(PressureSore.part)
  | SetSaving
  | ClearSaving

let reducer = (state, action) => {
  switch action {
  | AutoManageScale(part) => {
      let newParts = Js.Array.map(
        p =>
          PressureSore.region(p) === PressureSore.region(part) ? PressureSore.autoScale(part) : p,
        state.parts,
      )
      {
        ...state,
        parts: Js.Array.filter(f => PressureSore.scale(f) !== 0, newParts),
        dirty: true,
      }
    }
  | RemoveFromSelectedParts(part) => {
      ...state,
      parts: Js.Array.filter(
        p => PressureSore.region(p) !== PressureSore.region(part),
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
    | 1 => "text-red-200 hover:bg-red-400 tooltip"
    | 2 => "text-red-400 hover:bg-red-500 tooltip"
    | 3 => "text-red-500 hover:bg-red-600 tooltip"
    | 4 => "text-red-600 hover:bg-red-700 tooltip"
    | 5 => "text-red-700 hover:bg-gray-400 tooltip"
    | _ => "text-gray-400 hover:bg-red-400 tooltip"
    }
  | None => "text-gray-400 hover:text-red-200 tooltip"
  }
}
// UI for each Label
let selectedLabelClass = part => {
  switch part {
  | Some(p) =>
    switch PressureSore.scale(p) {
    | 1 => "bg-red-200 text-red-700 hover:bg-red-400"
    | 2 => "bg-red-400 text-white hover:bg-red-500"
    | 3 => "bg-red-500 text-white hover:bg-red-600"
    | 4 => "bg-red-600 text-white hover:bg-red-700"
    | 5 => "bg-red-700 text-white hover:bg-red-200"
    | _ => "bg-gray-300 text-black hover:bg-gray-400"
    }
  | None => "bg-gray-300 text-black hover:bg-red-200"
  }
}

// String for Braden Scale Value
let bradenScaleValue = selectedPart => {
  switch selectedPart {
  | Some(p) =>
    switch PressureSore.scale(p) {
    | 1 => ": 1"
    | 2 => ": 2"
    | 3 => ": 3"
    | 4 => ": 4"
    | 5 => ": 5"
    | _ => ""
    }
  | None => ""
  }
}

let renderBody = (state, send, title, partPaths, substr) => {
  <div className=" w-full text-center mx-2">
    <div className="text-2xl font-bold mt-10"> {str(title)} </div>
    <div className="text-left font-bold mx-auto mt-5">
      {str("Braden Scale (Risk Severity) (" ++ title ++ ")")}
    </div>
    // Braden Scale Divs
    <div className="mx-auto overflow-x-scroll max-w-md my-3 border-2">
      <div
        className="grid grid-rows-3 md:grid-rows-6 grid-flow-col gap-2 auto-cols-max justify-items-center p-2">
        {Js.Array.mapi((part, index) => {
          let regionType = PressureSore.regionForPath(part)
          let selectedPart = Js.Array.find(p => PressureSore.region(p) === regionType, state.parts)

          <div
            key={string_of_int(index)}
            className={"p-1 col-auto text-sm rounded m-1 cursor-pointer " ++
            selectedLabelClass(selectedPart)}
            id={PressureSore.regionToString(regionType)}
            onClick={_ => {
              switch selectedPart {
              | Some(p) => send(AutoManageScale(p))
              | None => send(AddPressureSore(regionType))
              }
            }}>
            <div className="flex">
              <div className="border-white border-r-2 px-1">
                {str(
                  Js.String.sliceToEnd(
                    ~from=substr,
                    PressureSore.regionToString(regionType) ++ bradenScaleValue(selectedPart),
                  ),
                )}
              </div>
              <i
                className="fas fa-times p-1"
                onClick={_ => {
                  switch selectedPart {
                  | Some(p) => send(RemoveFromSelectedParts(p))
                  | None => ()
                  }
                }}
              />
            </div>
          </div>
        }, partPaths)->React.array}
      </div>
    </div>
    // Diagram
    <div className="flex justify-center max-w-lg mx-auto border-2">
      <svg className="h-screen py-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 344.7 932.661">
        {Js.Array.mapi((part, renderIndex) => {
          let regionType = PressureSore.regionForPath(part)
          let selectedPart = Js.Array.find(p => PressureSore.region(p) === regionType, state.parts)
          <path
            key={"part1" ++ Belt.Int.toString(renderIndex)}
            d={PressureSore.d(part)}
            transform={PressureSore.transform(part)}
            className={selectedClass(selectedPart)}
            fill="currentColor"
            onClick={_ => {
              let values: scrollIntoView = {
                behavior: "smooth",
                block: "nearest",
                inline: "center",
              }

              document["getElementById"](PressureSore.regionToString(regionType))["scrollIntoView"](
                ~scrollIntoViewOptions=values,
              )

              switch selectedPart {
              | Some(p) => send(AutoManageScale(p))
              | None => send(AddPressureSore(regionType))
              }
            }}>
            <title className=""> {str(PressureSore.regionToString(regionType))} </title>
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
      {renderBody(state, send, "Front", PressureSore.anteriorParts, 8)}
      {renderBody(state, send, "Back", PressureSore.posteriorParts, 9)}
    </div>
    <button
      disabled={state.saving || !state.dirty}
      className="mt-4 btn btn-primary btn-large w-full"
      onClick={_ => saveData(id, consultationId, state, send, updateCB)}>
      {str("Done")}
    </button>
  </div>
}
