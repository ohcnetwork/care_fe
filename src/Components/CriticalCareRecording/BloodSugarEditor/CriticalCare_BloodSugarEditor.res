let str = React.string
open CriticalCare__Types
let handleSubmit = (handleDone, state) => {
  handleDone(state)
}

type action =
  | SetBloodSugarLevel(string)
  | SetDosage(string)
  | SetFrequency(string)

let reducer = (state, action) => {
  switch action {
  | SetBloodSugarLevel(blood_sugar_level) => {
      ...state,
      BloodSugar.blood_sugar_level: blood_sugar_level,
    }
  | SetDosage(dosage) => {...state, dosage: dosage}
  | SetFrequency(frequency) => {...state, frequency: frequency}
  }
}

@react.component
let make = (~handleDone, ~initialState) => {
  let (state, send) = React.useReducer(reducer, initialState)

  <div className="my-5">
    <h2> {str("Blood Sugar")} </h2>
    <div className="flex flex-col">
      <Slider
        title={"Blood Sugar Level(mg/dL)"}
        start={"0"}
        end={"700"}
        interval={"100"}
        step={0.1}
        value={BloodSugar.blood_sugar_level(state)}
        setValue={s => send(SetBloodSugarLevel(s))}
        getLabel={_ => ("Normal", "#ff0000")}
      />
      <h3> {str("Insuline Intake")} </h3>
      <Slider
        title={"Dosage(units)"}
        start={"0"}
        end={"100"}
        interval={"10"}
        step={0.1}
        value={BloodSugar.dosage(state)}
        setValue={s => send(SetDosage(s))}
        getLabel={_ => ("", "#ff0000")}
      />
      <h3> {str("Frequency")} </h3>
      <div className="flex  py-4 mb-4">
        {BloodSugar.frequencyOptions
        |> Array.map(option => {
          <div key={option["value"]} className="mr-4">
            <label onClick={_ => send(SetFrequency(option["value"]))}>
              <input
                className="mr-2"
                type_="radio"
                name="frequency"
                value={option["value"]}
                id={option["value"]}
                checked={option["value"] === state.frequency}
              />
              {str({option["name"]})}
            </label>
          </div>
        })
        |> React.array}
      </div>
    </div>
    <button
      className="flex w-full bg-blue-600 text-white p-2 text-lg hover:bg-blue-800 justify-center items-center rounded-md"
      onClick={_ => handleSubmit(handleDone, state)}>
      {str("Done")}
    </button>
  </div>
}
