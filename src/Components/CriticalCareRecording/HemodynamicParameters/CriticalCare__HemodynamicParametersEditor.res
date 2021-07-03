let str = React.string

let handleSubmit = (handleDone, state) => {
  let status = CriticalCare__HemodynamicParameters.showStatus(state)
  handleDone(state, status)
}

type action =
  | SetBp_systolic(string)
  | SetBp_diastolic(string)
  | SetPulse(string)
  | SetTemperature(string)
  | SetRespiratory_rate(string)
  | SetRhythm(CriticalCare__HemodynamicParametersRhythm.rhythmVar)
  | SetDescription(string)

let reducer = (state, action) => {
  switch action {
  | SetBp_systolic(bp_systolic) => {
      ...state,
      CriticalCare__HemodynamicParameters.bp_systolic: bp_systolic,
    }
  | SetBp_diastolic(bp_diastolic) => {
      ...state,
      CriticalCare__HemodynamicParameters.bp_diastolic: bp_diastolic,
    }
  | SetPulse(pulse) => {...state, CriticalCare__HemodynamicParameters.pulse: pulse}
  | SetTemperature(temperature) => {
      ...state,
      CriticalCare__HemodynamicParameters.temperature: temperature,
    }
  | SetRespiratory_rate(respiratory_rate) => {
      ...state,
      CriticalCare__HemodynamicParameters.respiratory_rate: respiratory_rate,
    }
  | SetRhythm(rhythm) => {...state, CriticalCare__HemodynamicParameters.rhythm: rhythm}
  | SetDescription(description) => {
      ...state,
      CriticalCare__HemodynamicParameters.description: description,
    }
  }
}

@react.component
let make = (~handleDone, ~initialState) => {
  let (state, send) = React.useReducer(reducer, initialState)

  <div>
    <h2> {str("Hemodynamic Parameters")} </h2>
    <div className="flex items-center flex-col">
      <Slider
        title={"Systolic"}
        start={"50"}
        end={"250"}
        interval={"10"}
        step={0.1}
        value={CriticalCare__HemodynamicParameters.bp_systolic(state)}
        setValue={s => send(SetBp_systolic(s))}
        getLabel={_ => ("Normal", "#ff0000")}
      />
      <Slider
        title={"Diastolic"}
        start={"30"}
        end={"180"}
        interval={"10"}
        step={0.1}
        value={CriticalCare__HemodynamicParameters.bp_diastolic(state)}
        setValue={s => send(SetBp_diastolic(s))}
        getLabel={_ => ("Normal", "#ff0000")}
      />
      <Slider
        title={"Pulse (bpm)"}
        start={"0"}
        end={"200"}
        interval={"10"}
        step={0.1}
        value={CriticalCare__HemodynamicParameters.pulse(state)}
        setValue={s => send(SetPulse(s))}
        getLabel={_ => ("Normal", "#ff0000")}
      />
      <Slider
        title={"Temperature (F)"}
        start={"95"}
        end={"106"}
        interval={"1"}
        step={0.1}
        value={CriticalCare__HemodynamicParameters.temperature(state)}
        setValue={s => send(SetTemperature(s))}
        getLabel={_ => ("Normal", "#ff0000")}
      />
      <Slider
        title={"Respiratory Rate (bpm)"}
        start={"10"}
        end={"50"}
        interval={"5"}
        step={0.1}
        value={CriticalCare__HemodynamicParameters.respiratory_rate(state)}
        setValue={s => send(SetRespiratory_rate(s))}
        getLabel={_ => ("Normal", "#ff0000")}
      />
      <div className="w-full mb-10 px-3">
        <label className="block mb-2 font-bold"> {str("Rhythm")} </label>
        <input
          id="regular"
          type_="radio"
          name="rhythm"
          className="px-2 inline-block"
          value={CriticalCare__HemodynamicParameters.description(state)}
          onClick={_ => send(SetRhythm(Regular))}
        />
        <label htmlFor="regular" className="pl-2 pr-32"> {str("Regular")} </label>
        <input
          id="irregular"
          type_="radio"
          name="rhythm"
          className="inline-block"
          value={CriticalCare__HemodynamicParameters.description(state)}
          onClick={_ => send(SetRhythm(IrRegular))}
        />
        <label htmlFor="irregular" className="px-2"> {str("Irregular")} </label>
      </div>
      <div className="w-full mb-10 px-3 font-bold">
        <label htmlFor="description" className="block mb-2"> {str("Description")} </label>
        <input
          id="description"
          className="block w-full border-gray-500 border-2 rounded px-2 py-1"
          value={CriticalCare__HemodynamicParameters.description(state)}
          onChange={e => send(SetDescription(ReactEvent.Form.target(e)["value"]))}
        />
      </div>
    </div>
    <button
      className="flex w-full bg-blue-600 text-white p-2 text-lg hover:bg-blue-800 justify-center items-center rounded-md"
      onClick={_ => handleSubmit(handleDone, state)}>
      {str("Done")}
    </button>
  </div>
}
