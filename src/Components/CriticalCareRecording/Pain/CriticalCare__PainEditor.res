@val external setTimeout: (unit => unit, int) => float = "setTimeout"
@val external clearTimeout: float => unit = "clearTimeout"

@val external innerWidth: int = "window.innerWidth"
@val external innerHeight: int = "window.innerHeight"

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
  modalPosition: CriticalCare__PainInputModal.position,
  selectedRegion: Pain.region,
  parts: array<Pain.part>,
  saving: bool,
  dirty: bool,
  previewMode: bool,
}

type action =
  | AutoManageScale(Pain.part)
  | AddPain(Pain.region)
  | AddSelectedPart(Pain.region)
  | UpdateSelectedPart(Pain.part)
  | RemoveFromSelectedParts(Pain.part)
  | Update(array<Pain.part>)
  | SetSelectedRegion(Pain.region)
  | SetModalPosition(CriticalCare__PainInputModal.position)
  | ShowInputModal(Pain.region, CriticalCare__PainInputModal.position)
  | SetPreviewMode
  | ClearPreviewMode
  | SetSaving
  | ClearSaving

let reducer = (state, action) => {
  switch action {
  | AutoManageScale(part) => {
      let newParts = Js.Array.map(
        p => Pain.region(p) === Pain.region(part) ? Pain.autoScale(part) : p,
        state.parts,
      )
      {
        ...state,
        parts: Js.Array.filter(f => Pain.scale(f) !== 0, newParts),
        dirty: true,
      }
    }
  | RemoveFromSelectedParts(part) => {
      ...state,
      parts: Js.Array.filter(p => Pain.region(p) !== Pain.region(part), state.parts),
      dirty: true,
    }
  | AddPain(region) => {
      ...state,
      parts: Js.Array.concat(state.parts, [Pain.makeDefault(region)]),
      dirty: true,
    }
  | AddSelectedPart(region) => {
      ...state,
      parts: Js.Array.concat(
        Js.Array.filter(p => Pain.region(p) !== region, state.parts),
        [
          Belt.Option.getWithDefault(
            Js.Array.find(p => Pain.region(p) === region, state.parts),
            Pain.makeDefault(region),
          ),
        ],
      ),
      dirty: true,
    }
  | UpdateSelectedPart(part) => {
      ...state,
      parts: Js.Array.concat(
        Js.Array.filter((item: Pain.part) => item.region != part.region, state.parts),
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
  Js.Dict.set(payload, "region", Js.Json.string(Pain.endcodeRegion(p)))
  Js.Dict.set(payload, "scale", Js.Json.number(float_of_int(Pain.scale(p))))
  Js.Dict.set(payload, "description", Js.Json.string(p.description))
  payload
}

let makePayload = state => {
  Js.Dict.fromArray([("pain", Js.Json.objectArray(Js.Array.map(makeField, state.parts)))])
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
    selectedRegion: Pain.Other,
    saving: false,
    dirty: false,
    previewMode: previewMode,
  }
}

let selectedClass = (part: option<Pain.part>) => {
  switch part {
  | Some(p) =>
    let score = p.scale
    if score <= 0 {
      "text-gray-400 hover:bg-red-400 tooltip"
    } else if score <= 3 {
      "text-red-200 hover:bg-red-400 tooltip"
    } else if score <= 6 {
      "text-red-400 hover:bg-red-500 tooltip"
    } else if score <= 10 {
      "text-red-500 hover:bg-red-600 tooltip"
    } else if score <= 15 {
      "text-red-600 hover:bg-red-700 tooltip"
    } else {
      "text-red-700 hover:bg-red-800 tooltip"
    }
  | None => "text-gray-400 hover:text-red-200 tooltip"
  }
}
// UI for each Label
let selectedLabelClass = (part: option<Pain.part>) => {
  switch part {
  | Some(p) =>
    let score = p.scale
    if score <= 0 {
      "bg-gray-300 text-black hover:bg-gray-400"
    } else if score <= 3 {
      "bg-red-200 text-red-700 hover:bg-red-400"
    } else if score <= 6 {
      "bg-red-400 text-white hover:bg-red-500"
    } else if score <= 10 {
      "bg-red-500 text-white hover:bg-red-600"
    } else if score <= 15 {
      "bg-red-600 text-white hover:bg-red-700"
    } else {
      "bg-red-700 text-white hover:bg-red-200"
    }
  | None => "bg-gray-300 text-black hover:bg-red-200"
  }
}

let painScoreValue = (selectedPart: option<Pain.part>) => {
  switch selectedPart {
  | Some(p) => Belt.Int.toFloat(p.scale)
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
  let show =
    state.selectedRegion !== Pain.Other &&
      partPaths->Belt.Array.some(p => Pain.regionForPath(p) === state.selectedRegion)

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

  <div className="md:w-full text-center mx-2">
    <div className="text-2xl font-bold mt-8"> {str(title)} </div>
    // Badges
    <div className="mx-auto overflow-x-scroll my-3 border-2">
      <div className="grid grid-rows-3 md:grid-flow-col md:auto-cols-max md:flex md:flex-wrap">
        {Js.Array.mapi((part, index) => {
          let regionType = Pain.regionForPath(part)
          let selectedPart = Js.Array.find(p => Pain.region(p) === regionType, state.parts)

          <div
            key={string_of_int(index)}
            className={"p-1 col-auto text-sm rounded m-1 cursor-pointer " ++
            selectedLabelClass(selectedPart)}
            id={Pain.regionToString(regionType)}
            onClick={_ => getIntoView(Pain.regionToString(regionType), false)}>
            <div className="flex justify-between">
              <div className="border-white px-1">
                {str(
                  Js.String.sliceToEnd(
                    ~from=substr,
                    Pain.regionToString(regionType) ++ (
                      painScoreValue(selectedPart) === "0"
                        ? ""
                        : " : " ++ painScoreValue(selectedPart)
                    ),
                  ),
                )}
              </div>
              {switch selectedPart {
              | Some(p) =>
                <CareIcon
                  icon="l-times"
                  className="border-l-2 p-1"
                  onClick={state.previewMode
                    ? _ => getIntoView(Pain.regionToString(regionType), false)
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
        <CriticalCare__PainInputModal
          show={show}
          modalRef={ReactDOM.Ref.domRef(inputModal)}
          hideModal={_ => send(SetSelectedRegion(Pain.Other))}
          position={state.modalPosition}
          part={Belt.Option.getWithDefault(
            Js.Array.find(p => Pain.region(p) === state.selectedRegion, state.parts),
            Pain.makeDefault(state.selectedRegion),
          )}
          updatePart={part => send(UpdateSelectedPart(part))}
          previewMode={state.previewMode}
        />
      </div>
      <svg
        className="h-screen py-4 cursor-pointer"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 344.7 932.661">
        {Js.Array.mapi((part, renderIndex) => {
          let regionType = Pain.regionForPath(part)
          let selectedPart = Js.Array.find(p => Pain.region(p) === regionType, state.parts)
          <path
            key={"part1" ++ Belt.Int.toString(renderIndex)}
            d={Pain.d(part)}
            transform={Pain.transform(part)}
            className={selectedClass(selectedPart)}
            fill="currentColor"
            id={"part" ++ Pain.regionToString(regionType)}
            onClick={e => {
              send(
                ShowInputModal(
                  part.region,
                  {"x": e->ReactEvent.Mouse.clientX, "y": e->ReactEvent.Mouse.clientY},
                ),
              )
            }}>
            <title className=""> {str(Pain.regionToString(regionType))} </title>
          </path>
        }, partPaths)->React.array}
      </svg>
    </div>
  </div>
}

@react.component
let make = (~painParameter, ~updateCB, ~id, ~consultationId, ~previewMode) => {
  let (state, send) = React.useReducer(reducer, initialState(painParameter, previewMode))
  Js.log("Input")
  Js.log(painParameter)
  Js.log(state)

  React.useEffect1(() => {
    send(Update(painParameter))
    None
  }, [painParameter])

  React.useEffect1(() => {
    updateCB(state.parts)
    None
  }, [state.parts])

  <div className="my-5">
    <div className="flex flex-col sm:flex-row justify-between">
      {!previewMode
        ? <>
            <h2 />
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
    <div className="flex lg:flex-row flex-col justify-between">
      {renderBody(state, send, "Front", Pain.anteriorParts, 8)}
      {renderBody(state, send, "Back", Pain.posteriorParts, 9)}
    </div>
  </div>
}
