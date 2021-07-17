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

// let back_parts: array<PressureSore.type_for_path> = [
//   {
//     d: "M 506.9838 158.0121 C 509.6029 173.1336 512.1258 187.9477 521.5039 184.4407 C 517.7283 191.6346 525.6919 202.9266 528.0919 210.8841 C 544.9623 208.3461 562.3174 208.3461 579.1878 210.8841 C 581.5893 202.9236 589.5363 191.6662 585.7863 184.4511 C 595.6744 187.4586 596.8188 174.3021 600.3813 158.5926 C 600.1173 156.4611 595.9999 158.5806 594.7788 159.0816 C 597.7384 128.3122 591.2088 97.1811 553.7104 97.22 C 516.1444 97.1497 509.5249 128.2116 512.5008 159.0891 C 511.0564 158.4651 508.4914 157.0971 506.9838 158.0121 Z",
//     transform: "translate(-390.349 -94.472)",
//     label: "Head",
//   },
//   {
//     d: "M 503.129 213.97 s 30.871 -1.97 46.871 0.03 v 12.456 s -26 -2.456 -47.574 0 Z",
//     transform: "translate(-362.967 -95.599)",
//     label: "Neck",
//   },
//   {
//     d: "M532.993,209.3",
//     transform: "translate(-390.349 -94.472)",
//     label: "",
//   },
//   {
//     d: "M545.584,228.037V361.6s-13.6,10.828-25.282,13.145c-10.077,2-36.162,3.374-36.766-.857S478.9,239.117,545.584,228.037Z",
//     transform: "translate(-390.349 -94.472)",
//     label: "Left Chest",
//   },
//   {
//     d: "M563.865,228.037V361.6s13.6,10.828,25.282,13.145c10.076,2,36.161,3.374,36.766-.857S630.546,239.117,563.865,228.037Z",
//     transform: "translate(-390.349 -94.472)",
//     label: "Right Chest",
//   },
//   {
//     d: "M550.973,228.188h8.914l.151,136.435s20.7,17.828,59.681,16.317c0,0-4.684,38.528-1.057,56.508s9.216,41.248,9.216,41.248-77.812,30.218-145.954-.151c0,0,9.67-35.96,9.972-58.321a167.6,167.6,0,0,0-4.23-39.888s37.924,5.439,62.1-15.713C549.764,364.623,550.52,228.188,550.973,228.188Z",
//     transform: "translate(-390.349 -94.472)",
//     label: "Abdomen",
//   },
//   {
//     d: "M523.223,230.857s-40.694,20.548-50.968,25.182-11.08,5.439-11.08,5.439,15.512,18.735,18.533,70.509C479.708,331.987,489.58,244.354,523.223,230.857Z",
//     transform: "translate(-390.349 -94.472)",
//     label: "Left Shoulder",
//   },
//   {
//     d: "M587.084,230.857s40.693,20.548,50.968,25.182,11.08,5.439,11.08,5.439S633.62,280.213,630.6,331.987C630.6,331.987,620.726,244.354,587.084,230.857Z",
//     transform: "translate(-390.349 -94.472)",
//     label: "Right Shoulder",
//   },
//   {
//     d: "M457.951,265.306s-12.49,14.706-13.5,29.613,1.813,82.194.6,95.691c0,0,15.512-1.209,22.16,3.022s9.872,4.23,9.872,4.23,3.223-32.232,1.41-53.385S467.823,277.393,457.951,265.306Z",
//     transform: "translate(-390.349 -94.472)",
//     label: "Left Arm",
//   },
//   {
//     d: "M444.655,394.639s3.627-1.209,8.864,1.612,21.153,4.835,21.153,4.835a241.987,241.987,0,0,1-6.245,50.968c-6.446,27.8-23.167,79.977-22.966,81.992,0,0-17.325-4.03-20.951-3.828,0,0,1.209-21.354,1.612-31.427s.2-42.91,6.648-63.659S444.454,396.049,444.655,394.639Z",
//     transform: "translate(-390.349 -94.472)",
//     label: "Left Forearm",
//   },
//   {
//     d: "M423.5,533.844s-4.029,2.82-7.454,5.036-12.49,13.1-15.311,18.131-11.482,15.915-10.274,16.923,5.44.2,7.454-2.216,7.051-8.663,10.476-7.253c0,0,1.007,12.087-3.224,22.966s-4.633,13.7-4.633,13.7,2.591,2.22,7.063.809q.291-.091.592-.2s1.612,4.835.806,8.864,3.022,3.425,7.655,1.007,21.959-22.562,24.175-35.053,1.611-40.895,1.611-40.895S427.33,534.65,423.5,533.844Z",
//     transform: "translate(-390.349 -94.472)",
//     label: "Left Hand",
//   },
//   {
//     d: "M650.678,265.306s12.49,14.706,13.5,29.613-1.813,82.194-.6,95.691c0,0-15.512-1.209-22.16,3.022s-9.871,4.23-9.871,4.23-3.224-32.232-1.41-53.385S640.807,277.393,650.678,265.306Z",
//     transform: "translate(-390.349 -94.472)",
//     label: "Right Arm",
//   },
//   {
//     d: "M663.974,394.639s-3.626-1.209-8.864,1.612-21.153,4.835-21.153,4.835a242.066,242.066,0,0,0,6.245,50.968c6.447,27.8,23.168,79.977,22.966,81.992,0,0,17.325-4.03,20.951-3.828,0,0-1.208-21.354-1.611-31.427s-.2-42.91-6.648-63.659S664.175,396.049,663.974,394.639Z",
//     transform: "translate(-390.349 -94.472)",
//     label: "Right Forearm",
//   },
//   {
//     d: "M685.127,533.844s4.029,2.82,7.453,5.036,12.491,13.1,15.311,18.131,11.483,15.915,10.274,16.923-5.439.2-7.454-2.216-7.051-8.663-10.475-7.253c0,0-1.008,12.087,3.223,22.966s4.633,13.7,4.633,13.7-2.59,2.22-7.062.809q-.291-.091-.593-.2s-1.612,4.835-.806,8.864-3.022,3.425-7.655,1.007-21.958-22.562-24.174-35.053-1.612-40.895-1.612-40.895S681.3,534.65,685.127,533.844Z",
//     transform: "translate(-390.349 -94.472)",
//     label: "Right Hand",
//   },
//   {
//     d: "M552.635,495.366s0,66.279-.6,69.9c-.051.277-.126.982-.2,2.065-5.691,6.673-27.473,28.254-58.673,9.04a10.164,10.164,0,0,1-1.738-1.309c-23.066-21.783-7.076-50.968-6.371-52.2l-2.216-1.234c-.176.327-17.652,32.107,6.849,55.249a14.16,14.16,0,0,0,2.166,1.662c9.519,5.842,18.232,8.033,25.988,8.033,16.116,0,27.977-9.519,33.642-15.235-1.661,20.07-6.144,82.369-6.5,86-.4,4.231-7.605,77.51-7.605,80.935,0,0-36.111-4.785-45.579-2.972,0,0,.2-37.672-2.821-59.63s-14.5-65.473-15.914-101.936-1.411-65.473,7.453-91.46C480.514,482.272,499.048,497.582,552.635,495.366Z",
//     transform: "translate(-390.349 -94.472)",
//     label: "Left Thigh and Buttock",
//   },
//   {
//     d: "M555.471,495.366s0,66.279.6,69.9c.051.277.126.982.2,2.065,5.691,6.673,27.473,28.254,58.673,9.04a10.164,10.164,0,0,0,1.738-1.309c23.066-21.783,7.076-50.968,6.371-52.2l2.216-1.234c.176.327,17.652,32.107-6.85,55.249a14.151,14.151,0,0,1-2.165,1.662c-9.519,5.842-18.232,8.033-25.988,8.033-16.116,0-27.977-9.519-33.643-15.235,1.662,20.07,6.145,82.369,6.5,86,.4,4.231,7.605,77.51,7.605,80.935,0,0,36.111-4.785,45.579-2.972,0,0-.2-37.672,2.82-59.63s14.5-65.473,15.915-101.936,1.41-65.473-7.453-91.46C627.592,482.272,609.058,497.582,555.471,495.366Z",
//     transform: "translate(-390.349 -94.472)",
//     label: "Right Thigh and Buttock",
//   },
//   {
//     d: "M492.2,739.529s21.354-2.418,42.909,3.425c0,0,3.627,43.312,1.612,61.846s-7.655,75.445-6.849,80.078c0,0-19.944.907-25.988,2.518,0,0-2.619-29.009-9.267-49.154S486.961,754.839,492.2,739.529Z",
//     transform: "translate(-390.349 -94.472)",
//     label: "Left Leg",
//   },
//   {
//     d: "M617.088,739.529s-21.354-2.418-42.909,3.425c0,0-3.626,43.312-1.612,61.846s7.655,75.445,6.85,80.078c0,0,19.944.907,25.987,2.518,0,0,2.619-29.009,9.267-49.154S622.326,754.839,617.088,739.529Z",
//     transform: "translate(-390.349 -94.472)",
//     label: "Right Leg",
//   },
//   {
//     d: "M504.387,891.023s17.728-.806,24.879-2.619c0,0,2.015,6.245,1.209,18.131s-1.007,21.555-.6,23.771,1.813,9.67-1.209,15.512S520,967.172,516.978,972.007s-10.275,5.439-11.886-1.611c0,0-1.813,3.424-7.857,1.41s-9.67-1.209-11.483-5.44-4.835-11.684-1.41-16.922,18.937-18.534,20.145-25.182S505.6,895.455,504.387,891.023Z",
//     transform: "translate(-390.349 -94.472)",
//     label: "Left Foot",
//   },
//   {
//     d: "M604.752,891.023s-17.728-.806-24.88-2.619c0,0-2.014,6.245-1.209,18.131s1.008,21.555.605,23.771-1.813,9.67,1.209,15.512,8.662,21.354,11.684,26.189,10.274,5.439,11.886-1.611c0,0,1.813,3.424,7.856,1.41s9.67-1.209,11.483-5.44,4.835-11.684,1.41-16.922-18.936-18.534-20.145-25.182S603.543,895.455,604.752,891.023Z",
//     transform: "translate(-390.349 -94.472)",
//     label: "Right Foot",
//   },
// ]

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
    }
  | AutoManageScale(part) => {
      ...state,
      parts: Js.Array.map(
        p =>
          PressureSore.region(p) === PressureSore.region(part) ? PressureSore.autoScale(part) : p,
        state.parts,
      ),
    }
  | AddPressureSore(region) => {
      ...state,
      parts: Js.Array.concat(state.parts, [PressureSore.makeDefault(region)]),
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

@react.component
let make = (~pressureSoreParameter, ~updateCB, ~id, ~consultationId) => {
  let (state, send) = React.useReducer(reducer, initialState(pressureSoreParameter))

  <div className="my-5">
    <h2> {str("Pressure Sore")} </h2>
    <div className="text-2xl font-bold mt-10"> {str("Front")} </div>
    <div className="flex justify-center max-w-2xl mx-auto">
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
            <title className=""> {str(PressureSore.label(part))} </title>
          </path>
        }, PressureSore.frontParts)->React.array}
      </svg>
    </div>
    // <div className="flex flex-col">
    //   <Slider
    //     title={"Braden Scale (Risk Severity)"}
    //     start={"1"}
    //     end={"5"}
    //     interval={"1"}
    //     value={Belt.Option.mapWithDefault(state.braden_scale_front, "", string_of_int)}
    //     step={1.0}
    //     setValue={s => send(SetFrontViewBradenScale(int_of_string(s)))}
    //     getLabel={_ => ("", "#ff0000")}
    //   />
    // </div>
    <div className="space-y-2">
      <div className="text-xl font-bold "> {str("Braden Scale (Risk Severity)")} </div>
      {Js.Array.map(p => {
        <div className="flex">
          <div className="font-semibold text-gray-800">
            {str(PressureSore.regionToString(PressureSore.region(p)) ++ ": ")}
          </div>
          <div className="pl-2 text-gray-800"> {str(string_of_int(PressureSore.scale(p)))} </div>
        </div>
      }, state.parts)->React.array}
    </div>
    <div className="text-2xl font-bold mt-10"> {str("Back")} </div>
    // <div className="flex justify-center max-w-2xl mx-auto">
    //   <svg
    //     className="h-screen py-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 327.931 881.194">
    //     {back_parts
    //     |> Array.mapi((renderIndex, part) => {
    //       <path
    //         key={"part2" ++ Belt.Int.toString(renderIndex)}
    //         d={PressureSore.d(part)}
    //         transform={PressureSore.transform(part)}
    //         className={state.back_parts_selected[renderIndex]
    //           ? "text-blue-500 tooltip"
    //           : "text-gray-400  hover:text-blue-400 tooltip"}
    //         fill="currentColor"
    //         onClick={_ => {
    //           send(AddIndexToSelectedBackParts(renderIndex))
    //         }}>
    //         <title className=""> {str(PressureSore.label(back_parts[renderIndex]))} </title>
    //       </path>
    //     })
    //     |> React.array}
    //   </svg>
    // </div>
    // <div className="flex flex-col">
    //   <Slider
    //     title={"Braden Scale (Risk Severity)"}
    //     start={"1"}
    //     end={"5"}
    //     interval={"1"}
    //     value={Belt.Option.mapWithDefault(state.braden_scale_back, "", string_of_int)}
    //     step={1.0}
    //     setValue={s => send(SetBackViewBradenScale(int_of_string(s)))}
    //     getLabel={_ => ("", "#ff0000")}
    //   />
    // </div>
    <button
      className="flex w-full bg-blue-600 text-white p-2 text-lg hover:bg-blue-800 justify-center items-center rounded-md"
      onClick={_ => saveData(id, consultationId, state, send, updateCB)}>
      {str("Done")}
    </button>
  </div>
}
