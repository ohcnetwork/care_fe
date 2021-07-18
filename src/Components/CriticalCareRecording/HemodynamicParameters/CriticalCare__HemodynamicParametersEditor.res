open CriticalCare__Types
let str = React.string

@module("../CriticalCare__API")
external updateDailyRound: (string, string, Js.Json.t, _ => unit, _ => unit) => unit =
  "updateDailyRound"

type state = {
  systolic: option<int>,
  diastolic: option<int>,
  pulse: option<int>,
  temperature: option<float>,
  resp: option<int>,
  rhythm: HemodynamicParameters.rhythm,
  rhythmDetails: string,
  dirty: bool,
  saving: bool,
}

type action =
  | SetSystolic(int)
  | SetDiastolic(int)
  | SetPulse(int)
  | SetTemperature(float)
  | SetResp(int)
  | SetRhythm(HemodynamicParameters.rhythm)
  | SetRhythmDetails(string)
  | SetSaving
  | ClearSaving

let reducer = (state, action) => {
  switch action {
  | SetSystolic(systolic) => {
      ...state,
      systolic: Some(systolic),
      dirty: true,
    }
  | SetDiastolic(diastolic) => {
      ...state,
      diastolic: Some(diastolic),
      dirty: true,
    }
  | SetPulse(pulse) => {...state, pulse: Some(pulse), dirty: true}
  | SetTemperature(temperature) => {
      ...state,
      temperature: Some(temperature),
      dirty: true,
    }
  | SetResp(resp) => {
      ...state,
      resp: Some(resp),
      dirty: true,
    }
  | SetRhythm(rhythm) => {...state, rhythm: rhythm, dirty: true}
  | SetRhythmDetails(rhythmDetails) => {
      ...state,
      rhythmDetails: rhythmDetails,
      dirty: true,
    }
  | SetSaving => {...state, saving: true}
  | ClearSaving => {...state, saving: false}
  }
}

let initialState = hdp => {
  let bp = HemodynamicParameters.bp(hdp)

  {
    systolic: Belt.Option.map(bp, HemodynamicParameters.systolic),
    diastolic: Belt.Option.map(bp, HemodynamicParameters.diastolic),
    pulse: HemodynamicParameters.pulse(hdp),
    temperature: HemodynamicParameters.temperature(hdp),
    resp: HemodynamicParameters.resp(hdp),
    rhythm: HemodynamicParameters.rhythm(hdp),
    rhythmDetails: Belt.Option.getWithDefault(HemodynamicParameters.rhythmDetails(hdp), ""),
    saving: false,
    dirty: false,
  }
}

let computeMeanArterialPressure = (systolic, diastolic) => {
  float_of_int(systolic + 2 * diastolic) /. 3.0
}

let makeBpPayload = (systolic, diastolic) => {
  let payload = Js.Dict.empty()
  Js.Dict.set(payload, "systolic", Js.Json.number(float_of_int(systolic)))
  Js.Dict.set(payload, "diastolic", Js.Json.number(float_of_int(diastolic)))
  Js.Dict.set(payload, "mean", Js.Json.number(computeMeanArterialPressure(systolic, diastolic)))
  payload
}

let makePayload = state => {
  let payload = Js.Dict.empty()

  switch (state.systolic, state.diastolic) {
  | (Some(systolic), Some(diastolic)) =>
    Js.Dict.set(payload, "bp", Js.Json.object_(makeBpPayload(systolic, diastolic)))
  | (_, _) => ()
  }
  DictUtils.setOptionalNumber("pulse", state.pulse, payload)
  DictUtils.setOptionalFloat("temperature", state.temperature, payload)
  DictUtils.setOptionalNumber("resp", state.resp, payload)
  Js.Dict.set(payload, "rhythm", Js.Json.string(HemodynamicParameters.encodeRhythm(state.rhythm)))
  DictUtils.setOptionalString("rhythm_detail", state.rhythmDetails, payload)
  payload
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

let getStatus = (min, minText, max, maxText, val) => {
  if val >= min && val <= max {
    ("Normal", "#059669")
  } else if val < min {
    (minText, "#DC2626")
  } else {
    (maxText, "#DC2626")
  }
}

let meanArterialPressure = state => {
  switch (state.systolic, state.diastolic) {
  | (Some(systolic), Some(diastolic)) => computeMeanArterialPressure(systolic, diastolic)
  | (_, _) => 0.0
  }
}
@react.component
let make = (~hemodynamicParameter, ~updateCB, ~id, ~consultationId) => {
  let (state, send) = React.useReducer(reducer, initialState(hemodynamicParameter))

  <div>
    <h2> {str("Hemodynamic Parameters")} </h2>
    <div className="flex items-center flex-col">
      <div className="w-full">
        <div className="mx-2 mt-5 md:flex justify-between">
          <h4 className=""> {str("BP (mm hg)")} </h4>
          <p>
            {str(
              `Mean Arterial Pressure: ${Js.Float.toFixedWithPrecision(
                  meanArterialPressure(state),
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
          step={1.0}
          value={Belt.Option.mapWithDefault(state.systolic, "", string_of_int)}
          setValue={s => send(SetSystolic(int_of_string(s)))}
          getLabel={getStatus(100.0, "Low", 140.0, "High")}
        />
        <Slider
          title={"Diastolic"}
          start={"30"}
          end={"180"}
          interval={"10"}
          step={1.0}
          value={Belt.Option.mapWithDefault(state.diastolic, "", string_of_int)}
          setValue={s => send(SetDiastolic(int_of_string(s)))}
          getLabel={getStatus(50.0, "Low", 90.0, "High")}
        />
      </div>
      <Slider
        title={"Pulse (bpm)"}
        start={"0"}
        end={"200"}
        interval={"10"}
        step={1.0}
        value={Belt.Option.mapWithDefault(state.pulse, "", string_of_int)}
        setValue={s => send(SetPulse(int_of_string(s)))}
        getLabel={getStatus(40.0, "Bradycardia", 100.0, "Tachycardia")}
      />
      <Slider
        title={"Temperature (F)"}
        start={"95"}
        end={"106"}
        interval={"10"}
        step={0.1}
        value={Belt.Option.mapWithDefault(state.temperature, "", Js.Float.toString)}
        setValue={s => send(SetTemperature(float_of_string(s)))}
        getLabel={getStatus(97.6, "Low", 99.6, "High")}
      />
      <Slider
        title={"Respiratory Rate (bpm)"}
        start={"10"}
        end={"50"}
        interval={"5"}
        step={1.0}
        value={Belt.Option.mapWithDefault(state.resp, "", string_of_int)}
        setValue={s => send(SetResp(int_of_string(s)))}
        getLabel={getStatus(12.0, "Low", 16.0, "High")}
      />
      <div className="w-full mb-10 px-3">
        <label className="block mb-2 font-bold"> {str("Rhythm")} </label>
        <div className="flex md:flex-row flex-col md:space-y-0 space-y-2 space-x-0 md:space-x-4">
          {Js.Array.map(
            r =>
              <Radio
                key={"Rhythm" ++ HemodynamicParameters.rhythmToString(r)}
                id={"Rhythm" ++ HemodynamicParameters.rhythmToString(r)}
                label={HemodynamicParameters.rhythmToString(r)}
                checked={r === state.rhythm}
                onChange={_ => send(SetRhythm(r))}
              />,
            [Regular, IrRegular, UNKNOWN],
          )->React.array}
        </div>
      </div>
      <div className="w-full mb-10 px-3 font-bold">
        <label htmlFor="description" className="block mb-2"> {str("Description")} </label>
        <textarea
          id="description"
          className="block w-full border-gray-500 border-2 rounded px-2 py-1"
          rows=3
          value={state.rhythmDetails}
          onChange={e => send(SetRhythmDetails(ReactEvent.Form.target(e)["value"]))}
        />
      </div>
    </div>
    <button
      disabled={state.saving || !state.dirty}
      className="btn btn-primary btn-large w-full"
      onClick={_ => saveData(id, consultationId, state, send, updateCB)}>
      {str("Update Details")}
    </button>
  </div>
}
