let str = React.string
open CriticalCare__Types

let handleSubmit = (handleDone, state: VentilatorParameters.t) => {
  let status = VentilatorParameters.showStatus(state)
  handleDone(state, status)
}

let reducer = (state, action) => {
  switch action {
  | VentilatorParameters.SetVentilationInterface(ventilationInterface) => {
      ...state,
      VentilatorParameters.ventilationInterface: ventilationInterface,
    }

  | SetIv(iv) => {
      ...state,
      VentilatorParameters.iv: iv,
    }
  | SetNiv(niv) => {
      ...state,
      VentilatorParameters.niv: niv,
    }
  | SetNone(none) => {
      ...state,
      VentilatorParameters.none: none,
    }

  | SetIvSubOptions(iv) => {
      ...state,
      iv: iv,
    }

  | SetNivSubOptions(niv) => {
      ...state,
      niv: niv,
    }
  | _ => state
  }
}

let ventilationInterfaceOptions = [
  {
    "name": "Invasive (IV)",
    "value": "iv",
  },
  {
    "name": "Non-Invasive (NIV)",
    "value": "niv",
  },
  {
    "name": "None",
    "value": "none",
  },
]

@react.component
let make = (~initialState, ~handleDone) => {
  let (state, send) = React.useReducer(
    reducer,
    (initialState: CriticalCare__VentilatorParameters.t),
  )

  let editor = switch state.VentilatorParameters.ventilationInterface {
  | "iv" => <CriticalCare__VentilatorParametersEditor__Invasive state={state.iv} send />
  | "niv" => <CriticalCare__VentilatorParametersEditor__NonInvasive state={state.niv} send />
  | "none" => <CriticalCare__VentilatorParametersEditor__None state={state.none} send />
  | _ => <CriticalCare__VentilatorParametersEditor__Invasive state={state.iv} send />
  }
  // Js.log({state})
  <div>
    <CriticalCare__PageTitle title="Ventilator Parameters" />
    <div className="py-6">
      <div className="mb-6">
        <h4> {str("Ventilation Interface")} </h4>
        <div>
          <div className="flex items-center py-4 mb-4">
            {ventilationInterfaceOptions
            |> Array.map(option => {
              <div key={option["value"]} className="mr-4">
                <label onClick={_ => send(SetVentilationInterface(option["value"]))}>
                  <input
                    className="mr-2"
                    type_="radio"
                    name="ventilationInterface"
                    value={option["value"]}
                    id={option["value"]}
                    checked={option["value"] === state.VentilatorParameters.ventilationInterface}
                  />
                  {str({option["name"]})}
                </label>
              </div>
            })
            |> React.array}
          </div>
          {editor}
        </div>
      </div>
      <button
        onClick={_ => handleSubmit(handleDone, state)}
        className="text-white py-3 text-xl w-full bg-blue-500 hover:bg-blue-600 cursor-pointer my-10 rounded">
        {str("Submit")}
      </button>
    </div>
  </div>
}
