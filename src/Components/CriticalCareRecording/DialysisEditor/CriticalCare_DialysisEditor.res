let str = React.string
open CriticalCare__Types
let handleSubmit = (handleDone, state) => {
  handleDone(state)
}

type action =
  | SetFluidBalance(string)
  | SetNetBalance(string)

let reducer = (state, action) => {
  switch action {
  | SetFluidBalance(fluid_balance) => {
      ...state,
      Dialysis.fluid_balance: fluid_balance,
    }
  | SetNetBalance(net_balance) => {...state, net_balance: net_balance}
  }
}

@react.component
let make = (~handleDone, ~initialState) => {
  let (state, send) = React.useReducer(reducer, initialState)

  <div className="my-5">
    <h2> {str("Dialysis")} </h2>
    <div className="flex flex-col">
      <Slider
        title={"Dialysis Fluid Balance (ml/h"}
        start={"0"}
        end={"5000"}
        interval={"1000"}
        step={0.1}
        value={Dialysis.fluid_balance(state)}
        setValue={s => send(SetFluidBalance(s))}
        getLabel={_ => ("", "#ff0000")}
      />
      <h3> {str("Dialysis Net Balance (ml/h")} </h3>
      <Slider
        title={"net_balance(units)"}
        start={"0"}
        end={"5000"}
        interval={"1000"}
        step={0.1}
        value={Dialysis.net_balance(state)}
        setValue={s => send(SetNetBalance(s))}
        getLabel={_ => ("", "#ff0000")}
      />
    </div>
    <button
      className="flex w-full bg-blue-600 text-white p-2 text-lg hover:bg-blue-800 justify-center items-center rounded-md"
      onClick={_ => handleSubmit(handleDone, state)}>
      {str("Done")}
    </button>
  </div>
}
