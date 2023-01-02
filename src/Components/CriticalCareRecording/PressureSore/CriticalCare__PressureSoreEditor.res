@val external setTimeout: (unit => unit, int) => float = "setTimeout"
@val external clearTimeout: float => unit = "clearTimeout"

@val external innerWidth: int = "window.innerWidth"
@val external innerHeight: int = "window.innerHeight"

@val external document: 'a = "document"
%%raw("import './styles.css'")

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
  modalPosition: CriticalCare__PressureSoreInputModal.position,
  selectedRegion: PressureSore.region,
  parts: array<PressureSore.part>,
  saving: bool,
  dirty: bool,
  previewMode: bool,
}

type action =
  | AutoManageScale(PressureSore.part)
  | AddPressureSore(PressureSore.region)
  | AddSelectedPart(PressureSore.region)
  | UpdateSelectedPart(PressureSore.part)
  | RemoveFromSelectedParts(PressureSore.part)
  | Update(array<PressureSore.part>)
  | SetSelectedRegion(PressureSore.region)
  | SetModalPosition(CriticalCare__PressureSoreInputModal.position)
  | ShowInputModal(PressureSore.region, CriticalCare__PressureSoreInputModal.position)
  | SetPreviewMode
  | ClearPreviewMode
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
  | AddSelectedPart(region) => {
      ...state,
      parts: Js.Array.concat(
        Js.Array.filter(p => PressureSore.region(p) !== region, state.parts), 
        [
          Belt.Option.getWithDefault(
            Js.Array.find(p => PressureSore.region(p) === region, state.parts), 
            PressureSore.makeDefault(region)
          )
        ]
      ),
      dirty: true,
    }
  | UpdateSelectedPart(part) => {
      ...state,
      parts: Js.Array.concat(
        Js.Array.filter((item: PressureSore.part) => item.region != part.region, state.parts), 
        [part],
      ),
      dirty: true,
    }
  | SetSelectedRegion(region) => {
      ...state,
      selectedRegion: region,
    }
  | SetModalPosition(position) => {
      ...state,
      modalPosition: position,
    }
  | ShowInputModal(region, position) => {
      ...state,
      selectedRegion: region,
      modalPosition: position,
    }
  | SetSaving => {...state, saving: true}
  | ClearSaving => {...state, saving: false}
  | Update(parts) => {
      ...state,
      parts: parts,
    }
  | SetPreviewMode => {...state, previewMode: true}
  | ClearPreviewMode => {...state, previewMode: false}
  }
}

let makeField = p => {
  let payload = Js.Dict.empty()
  Js.Dict.set(payload, "region", Js.Json.string(PressureSore.endcodeRegion(p)))
  Js.Dict.set(payload, "scale", Js.Json.number(float_of_int(PressureSore.scale(p))))
  Js.Dict.set(payload, "width", Js.Json.number(p.width))
  Js.Dict.set(payload, "length", Js.Json.number(p.length))
  Js.Dict.set(payload, "tissue_type", Js.Json.string(PressureSore.tissueTypeToString(p.tissue_type)))
  Js.Dict.set(payload, "exudate_amount", Js.Json.string(PressureSore.extrudateAmountToString(p.exudate_amount)))
  Js.Dict.set(payload, "description", Js.Json.string(p.description))
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

let initialState = (psp, previewMode) => {
  {
    parts: psp,
    modalPosition: {"x": 0, "y": 0},
    selectedRegion: PressureSore.Other,
    saving: false,
    dirty: false,
    previewMode: previewMode,
  }
}

let selectedClass = (part: option<PressureSore.part>) => {
  switch part {
  | Some(p) =>
    let score =  PressureSore.calculatePushScore(p.length, p.width, p.exudate_amount, p.tissue_type) 
    if score <= 0.0 { "text-gray-400 hover:bg-red-400 tooltip" } 
    else if score <= 3.0 { "text-red-200 hover:bg-red-400 tooltip" }
    else if score <= 6.0 { "text-red-400 hover:bg-red-500 tooltip" }
    else if score <= 10.0 { "text-red-500 hover:bg-red-600 tooltip" }
    else if score <= 15.0 { "text-red-600 hover:bg-red-700 tooltip" }
    else { "text-red-700 hover:bg-red-800 tooltip" }
  | None => "text-gray-400 hover:text-red-200 tooltip"
  }
}
// UI for each Label
let selectedLabelClass = (part: option<PressureSore.part>) => {
  switch part {
  | Some(p) =>
    let score =  PressureSore.calculatePushScore(p.length, p.width, p.exudate_amount, p.tissue_type) 
    if score <= 0.0 { "bg-gray-300 text-black hover:bg-gray-400" }
    else if score <= 3.0 { "bg-red-200 text-red-700 hover:bg-red-400" }
    else if score <= 6.0 { "bg-red-400 text-white hover:bg-red-500" }
    else if score <= 10.0 { "bg-red-500 text-white hover:bg-red-600" }
    else if score <= 15.0 { "bg-red-600 text-white hover:bg-red-700" }
    else { "bg-red-700 text-white hover:bg-red-200" }
  | None => "bg-gray-300 text-black hover:bg-red-200"
  }
}

let pushScoreValue = (selectedPart: option<PressureSore.part>) => {
  switch selectedPart {
  | Some(p) => PressureSore.calculatePushScore(p.length, p.width, p.exudate_amount, p.tissue_type)
  | None => 0.0
  }->Js.Float.toString
}

let getIntoView = (region: string, isPart: bool) => {
  let scrollValues: scrollIntoView = {
    behavior: "smooth",
    block: "nearest",
    inline: "center",
  }

  // Label
  let ele = document["getElementById"](region)
  if isPart {
    ele["scrollIntoView"](~scrollIntoViewOptions=scrollValues)
  }
  ele["classList"]["add"]("border-2")
  ele["classList"]["add"]("border-red-700")

  //Part
  let part = document["getElementById"](`part${region}`)
  if !isPart {
    part["scrollIntoView"](~scrollIntoViewOptions=scrollValues)
  }
  part["classList"]["add"]("text-red-900")

  let _id = setTimeout(() => {
    ele["classList"]["remove"]("border-2")
    ele["classList"]["remove"]("border-red-700")

    part["classList"]["remove"]("text-red-900")
  }, 900)
}

let renderBody = (state, send, title, partPaths, substr) => {
  
  let show = state.selectedRegion !== PressureSore.Other && partPaths->Belt.Array.some(p => PressureSore.regionForPath(p) === state.selectedRegion)

  let inputModal = React.useRef(Js.Nullable.null)
  let isMouseOverInputModal = %raw(`
    function (event, ref) {
      if (ref.current) {
        let rect = ref.current.getBoundingClientRect()
        return event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
      }
      return false;
    }
  `)

  <div className=" w-full text-center mx-2">
    <div className="text-2xl font-bold mt-8"> {str(title)} </div>
    <div className="text-left font-bold mx-auto mt-5">
      {str("Braden Scale (Risk Severity) (" ++ title ++ ")")}
    </div>
    // Badges
    <div className="mx-auto overflow-x-scroll my-3 border-2">
      <div className="grid grid-rows-3 grid-flow-col auto-cols-max md:flex md:flex-wrap">
        {Js.Array.mapi((part, index) => {
          let regionType = PressureSore.regionForPath(part)
          let selectedPart = Js.Array.find(p => PressureSore.region(p) === regionType, state.parts)

          <div
            key={string_of_int(index)}
            className={"p-1 col-auto text-sm rounded m-1 cursor-pointer " ++
            selectedLabelClass(selectedPart)}
            id={PressureSore.regionToString(regionType)}
            onClick={_ => getIntoView(PressureSore.regionToString(regionType), false)}
          >
            <div className="flex justify-between">
              <div className="border-white px-1">
                {str(
                  Js.String.sliceToEnd(
                    ~from=substr,
                    PressureSore.regionToString(regionType) ++ (pushScoreValue(selectedPart) === "0" ? "" : " : " ++ pushScoreValue(selectedPart)),
                  ),
                )}
              </div>
              {switch selectedPart {
              | Some(p) =>
                <i
                  className="border-l-2 fas fa-times p-1"
                  onClick={state.previewMode
                    ? _ => getIntoView(PressureSore.regionToString(regionType), false)
                    : _ => send(RemoveFromSelectedParts(p))}
                />
              | None => React.null
              }}
            </div>
          </div>
        }, partPaths)->React.array}
      </div>
    </div>
    // Diagram
    <div className="flex justify-center mx-auto border-2">
      <div>
        <CriticalCare__PressureSoreInputModal
          show={show}
          modalRef={ReactDOM.Ref.domRef(inputModal)}
          hideModal={_ => send(SetSelectedRegion(PressureSore.Other))}
          position={state.modalPosition}
          part={
            Belt.Option.getWithDefault(
              Js.Array.find(p => PressureSore.region(p) === state.selectedRegion, state.parts), 
              PressureSore.makeDefault(state.selectedRegion)
            )
          }
          updatePart={part => send(UpdateSelectedPart(part))}
          previewMode={state.previewMode}
        />
      </div>
      <svg className="h-screen py-4 cursor-pointer" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 344.7 932.661">
        {Js.Array.mapi((part, renderIndex) => {
          let regionType = PressureSore.regionForPath(part)
          let selectedPart = Js.Array.find(p => PressureSore.region(p) === regionType, state.parts)
          <path
            key={"part1" ++ Belt.Int.toString(renderIndex)}
            d={PressureSore.d(part)}
            transform={PressureSore.transform(part)}
            className={selectedClass(selectedPart)}
            fill="currentColor"
            id={"part" ++ PressureSore.regionToString(regionType)}
            onClick={e => {
              send(ShowInputModal(part.region, {"x": e->ReactEvent.Mouse.clientX, "y": e->ReactEvent.Mouse.clientY}))
            }}
          >
            <title className=""> {str(PressureSore.regionToString(regionType))} </title>
          </path>
        }, partPaths)->React.array}
      </svg>
    </div>
  </div>
}

@react.component
let make = (~pressureSoreParameter, ~updateCB, ~id, ~consultationId, ~previewMode) => {
  let (state, send) = React.useReducer(reducer, initialState(pressureSoreParameter, previewMode))

  React.useEffect1(() => {
    send(Update(pressureSoreParameter))
    None
  }, [pressureSoreParameter])

  <div className="my-5">
    <div className="flex flex-col sm:flex-row justify-between">
      {!previewMode
        ? <>
            <h2> {str("Pressure Sore")} </h2>
            <label className="flex items-center cursor-pointer  sm:mt-0 mt-4">
              // Toggle

              //Toggle Button
              <div className="transition duration-150 ease-in-out mr-3 text-gray-700 font-medium">
                {str(state.previewMode ? "Preview Mode" : "Edit Mode")}
              </div>
              <div className="relative">
                <input
                  type_="checkbox"
                  id="toggleB"
                  className="sr-only"
                  onClick={_ => send(state.previewMode ? ClearPreviewMode : SetPreviewMode)}
                />
                <div
                  className={"block w-14 h-8 rounded-full " ++ (
                    state.previewMode ? "bg-green-300" : "bg-gray-400"
                  )}
                />
                <div
                  className="transition duration-150 ease-in-out dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full checked:bg-green-300"
                />
              </div>
            </label>
          </>
        : React.null}
    </div>
    <div className="flex md:flex-row flex-col justify-between">
      {renderBody(state, send, "Front", PressureSore.anteriorParts, 8)}
      {renderBody(state, send, "Back", PressureSore.posteriorParts, 9)}
    </div>
    {!previewMode
      ? <button
          disabled={state.saving || !state.dirty}
          className="mt-4 btn btn-primary btn-large w-full"
          onClick={_ => saveData(id, consultationId, state, send, updateCB)}>
          {str("Done")}
        </button>
      : React.null}
  </div>
}
