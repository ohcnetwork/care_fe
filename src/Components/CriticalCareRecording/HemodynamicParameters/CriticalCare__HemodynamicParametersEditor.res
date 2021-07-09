open CriticalCare__Types
let str = React.string

let handleSubmit = (handleDone, state) => {
  let status = HemodynamicParameters.showStatus(state)
  handleDone(state, status)
}

let getStatus = (min, minText, max, maxText, val) => {
  if val >= min && val <= max {
    ("Normal", "#059669")
  } else if val < min {
    (minText, "#DC2626")
  } else {
    (maxText, "#DC2626")
  }
}

type action =
  | SetBp_systolic(string)
  | SetBp_diastolic(string)
  | SetPulse(string)
  | SetTemperature(string)
  | SetRespiratory_rate(string)
  | SetRhythm(HemoDynamicParametersRhythm.rhythmVar)
  | SetDescription(string)

let reducer = (state, action) => {
  switch action {
  | SetBp_systolic(bp_systolic) => {
      ...state,
      HemodynamicParameters.bp_systolic: bp_systolic,
    }
  | SetBp_diastolic(bp_diastolic) => {
      ...state,
      HemodynamicParameters.bp_diastolic: bp_diastolic,
    }
  | SetPulse(pulse) => {...state, HemodynamicParameters.pulse: pulse}
  | SetTemperature(temperature) => {
      ...state,
      HemodynamicParameters.temperature: temperature,
    }
  | SetRespiratory_rate(respiratory_rate) => {
      ...state,
      HemodynamicParameters.respiratory_rate: respiratory_rate,
    }
  | SetRhythm(rhythm) => {...state, HemodynamicParameters.rhythm: rhythm}
  | SetDescription(description) => {
      ...state,
      HemodynamicParameters.description: description,
    }
  }
}

let convertToFloat = value => {
  switch Belt.Float.fromString(value) {
  | Some(value) => value
  | None => 0.0
  }
}

@react.component
let make = (~handleDone, ~initialState) => {
  let (state, send) = React.useReducer(reducer, initialState)
  let (meanArterialPressure, setMeanArterialPressure) = React.useState(() => 0.0)

  React.useEffect2(() => {
    let systolic = convertToFloat(HemodynamicParameters.bp_systolic(state))
    let diastolic = convertToFloat(HemodynamicParameters.bp_diastolic(state))
    let map = (systolic +. 2.0 *. diastolic) /. 3.0
    setMeanArterialPressure(_ => map)
    None
  }, (HemodynamicParameters.bp_systolic(state), HemodynamicParameters.bp_diastolic(state)))

  <div>
    <h2> {str("Hemodynamic Parameters")} </h2>
    <div className="flex items-center flex-col">
      <div className="w-full">
        <div className="mx-2 mt-5 md:flex justify-between">
          <h4 className=""> {str("BP (mm hg)")} </h4>
          <p>
            {str(
              `Mean Arterial Pressure: ${Js.Float.toFixedWithPrecision(
                  meanArterialPressure,
                  ~digits=2,
                )}`,
            )}
          </p>
        </div>
        <Slider
          title={"Systolic"}
          start={"50"}
          end={"250"}
          interval={"10"}
          step={0.1}
          value={HemodynamicParameters.bp_systolic(state)}
          setValue={s => send(SetBp_systolic(s))}
          getLabel={getStatus(100.0, "Low", 140.0, "High")}
        />
        <Slider
          title={"Diastolic"}
          start={"30"}
          end={"180"}
          interval={"10"}
          step={0.1}
          value={HemodynamicParameters.bp_diastolic(state)}
          setValue={s => send(SetBp_diastolic(s))}
          getLabel={getStatus(50.0, "Low", 90.0, "High")}
        />
      </div>
      <Slider
        title={"Pulse (bpm)"}
        start={"0"}
        end={"200"}
        interval={"10"}
        step={1.0}
        value={HemodynamicParameters.pulse(state)}
        setValue={s => send(SetPulse(s))}
        getLabel={getStatus(40.0, "Bradycardia", 100.0, "Tachycardia")}
      />
      <Slider
        title={"Temperature (F)"}
        start={"95"}
        end={"106"}
        interval={"10"}
        step={0.1}
        value={HemodynamicParameters.temperature(state)}
        setValue={s => send(SetTemperature(s))}
        getLabel={getStatus(97.6, "Low", 99.6, "High")}
      />
      <Slider
        title={"Respiratory Rate (bpm)"}
        start={"10"}
        end={"50"}
        interval={"5"}
        step={1.0}
        value={HemodynamicParameters.respiratory_rate(state)}
        setValue={s => send(SetRespiratory_rate(s))}
        getLabel={getStatus(12.0, "Low", 16.0, "High")}
      />
      <div className="w-full mb-10 px-3">
        <label className="block mb-2 font-bold"> {str("Rhythm")} </label>
        <input
          id="regular"
          type_="radio"
          name="rhythm"
          className="px-2 inline-block"
          value={HemodynamicParameters.description(state)}
          onClick={_ => send(SetRhythm(Regular))}
        />
        <label htmlFor="regular" className="pl-2 pr-32"> {str("Regular")} </label>
        <input
          id="irregular"
          type_="radio"
          name="rhythm"
          className="inline-block"
          value={HemodynamicParameters.description(state)}
          onClick={_ => send(SetRhythm(IrRegular))}
        />
        <label htmlFor="irregular" className="px-2"> {str("Irregular")} </label>
      </div>
      <div className="w-full mb-10 px-3 font-bold">
        <label htmlFor="description" className="block mb-2"> {str("Description")} </label>
        <input
          id="description"
          className="block w-full border-gray-500 border-2 rounded px-2 py-1"
          value={HemodynamicParameters.description(state)}
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
