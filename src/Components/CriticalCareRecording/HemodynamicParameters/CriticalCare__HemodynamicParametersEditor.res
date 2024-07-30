open CriticalCare__Types
let str = React.string

@module("../CriticalCare__API")
external updateDailyRound: (string, string, Js.Json.t, _ => unit, _ => unit) => unit =
  "updateDailyRound"

let fahrenheitToCelcius = (temp: option<float>) => {
  switch temp {
  | Some(x) =>
    Js.Float.toFixedWithPrecision((x -. 32.0) *. (5.0 /. 9.0), ~digits=2)->Belt.Float.fromString
  | None => None
  }
}
let celciusToFahrenheit = (temp: option<float>) => {
  switch temp {
  | Some(x) =>
    Js.Float.toFixedWithPrecision(x *. 9.0 /. 5.0 +. 32.0, ~digits=2)->Belt.Float.fromString
  | None => None
  }
}

type state = {
  pain: array<CriticalCare__Pain.part>,
  systolic: option<int>,
  diastolic: option<int>,
  pulse: option<int>,
  spo2: option<int>,
  temperature: option<float>,
  resp: option<int>,
  rhythm: HemodynamicParameters.rhythm,
  rhythmDetails: string,
  tempInCelcius: bool,
  dirty: bool,
  saving: bool,
}

type action =
  | SetPain(array<CriticalCare__Pain.part>)
  | SetSystolic(int)
  | SetDiastolic(int)
  | SetPulse(int)
  | SetSPO2(int)
  | SetTemperature(float)
  | ToggleTemperatureUnit
  | SetResp(int)
  | SetRhythm(HemodynamicParameters.rhythm)
  | SetRhythmDetails(string)
  | SetSaving
  | ClearSaving

let reducer = (state, action) => {
  switch action {
  | SetPain(pain) => {
      ...state,
      pain,
      dirty: true,
    }
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
  | SetSPO2(spo2) => {...state, spo2: Some(spo2), dirty: true}
  | SetTemperature(temperature) => {
      ...state,
      temperature: Some(temperature),
      dirty: true,
    }
  | ToggleTemperatureUnit => {
      ...state,
      temperature: state.tempInCelcius
        ? state.temperature->celciusToFahrenheit
        : state.temperature->fahrenheitToCelcius,
      tempInCelcius: !state.tempInCelcius,
    }
  | SetResp(resp) => {
      ...state,
      resp: Some(resp),
      dirty: true,
    }
  | SetRhythm(rhythm) => {...state, rhythm, dirty: true}
  | SetRhythmDetails(rhythmDetails) => {
      ...state,
      rhythmDetails,
      dirty: true,
    }
  | SetSaving => {...state, saving: true}
  | ClearSaving => {...state, saving: false}
  }
}

let initialState = hdp => {
  let bp = HemodynamicParameters.bp(hdp)

  {
    pain: HemodynamicParameters.pain(hdp),
    systolic: Belt.Option.map(bp, HemodynamicParameters.systolic),
    diastolic: Belt.Option.map(bp, HemodynamicParameters.diastolic),
    pulse: HemodynamicParameters.pulse(hdp),
    spo2: HemodynamicParameters.spo2(hdp),
    temperature: HemodynamicParameters.temperature(hdp),
    resp: HemodynamicParameters.resp(hdp),
    rhythm: HemodynamicParameters.rhythm(hdp),
    rhythmDetails: Belt.Option.getWithDefault(HemodynamicParameters.rhythmDetails(hdp), ""),
    tempInCelcius: false,
    saving: false,
    dirty: false,
  }
}

let computeMeanArterialPressure = (systolic, diastolic) => {
  float_of_int(systolic + 2 * diastolic) /. 3.0
}

let makePainField = p => {
  let payload = Js.Dict.empty()
  Js.Dict.set(payload, "region", Js.Json.string(Pain.endcodeRegion(p)))
  Js.Dict.set(payload, "scale", Js.Json.number(float_of_int(Pain.scale(p))))
  Js.Dict.set(payload, "description", Js.Json.string(p.description))
  payload
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
  Js.Dict.set(
    payload,
    "pain_scale_enhanced",
    Js.Json.objectArray(Js.Array.map(makePainField, state.pain)),
  )
  DictUtils.setOptionalNumber("pulse", state.pulse, payload)
  DictUtils.setOptionalNumber("ventilator_spo2", state.spo2, payload)
  DictUtils.setOptionalFloat(
    "temperature",
    state.tempInCelcius ? state.temperature->celciusToFahrenheit : state.temperature,
    payload,
  )
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
  switch (val >= min, val <= max) {
  | (true, true) => ("Normal", "#059669")
  | (true, false) => (maxText, "#DC2626")
  | _ => (minText, "#DC2626")
  }
}

let meanArterialPressure = state => {
  switch (state.systolic, state.diastolic) {
  | (Some(systolic), Some(diastolic)) => computeMeanArterialPressure(systolic, diastolic)
  | (_, _) => 0.0
  }
}

let getPainStatus = val => {
  if val == 0.0 {
    ("No Pain", "#059669")
  } else if val < 4.0 {
    ("Minute", "#ff3f00")
  } else if val < 8.0 {
    ("Moderate", "#ff002c")
  } else {
    ("Severe", "#de000c")
  }
}

@react.component
let make = (~hemodynamicParameter, ~updateCB, ~id, ~consultationId) => {
  let (state, send) = React.useReducer(reducer, initialState(hemodynamicParameter))

  <div>
    <h2> {str("Vitals")} </h2>
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
          start={"0"}
          end={"250"}
          interval={"10"}
          step={1.0}
          value={Belt.Option.mapWithDefault(state.systolic, "", string_of_int)}
          setValue={s => send(SetSystolic(int_of_string(s)))}
          getLabel={getStatus(100.0, "Low", 140.0, "High")}
          hasError={ValidationUtils.isInputInRangeInt(0, 250, state.systolic)}
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
          hasError={ValidationUtils.isInputInRangeInt(30, 180, state.diastolic)}
        />
        <Slider
          title={"Spo2"}
          start={"0"}
          end={"100"}
          interval={"1"}
          step={1.0}
          value={Belt.Option.mapWithDefault(state.spo2, "", string_of_int)}
          setValue={s => send(SetSPO2(int_of_string(s)))}
          getLabel={getStatus(90.0, "Low", 100.0, "High")}
          hasError={ValidationUtils.isInputInRangeInt(0, 100, state.spo2)}
        />
      </div>
      <div className="border-b border-b-secondary-500 w-full my-10" />
      <Slider
        title={"Temperature"}
        titleNeighbour={<div
          className="flex items-center ml-1 border border-secondary-400 rounded px-4 h-10 cursor-pointer hover:bg-secondary-200"
          onClick={_ => ToggleTemperatureUnit->send}>
          <span className="text-blue-700"> {state.tempInCelcius ? "C"->str : "F"->str} </span>
        </div>}
        start={state.tempInCelcius ? "35" : "95"}
        end={state.tempInCelcius ? "41" : "106"}
        interval={"10"}
        step={0.1}
        value={Belt.Option.mapWithDefault(state.temperature, "", Js.Float.toString)}
        setValue={s => send(SetTemperature(float_of_string(s)))}
        getLabel={state.tempInCelcius
          ? getStatus(36.4, "Low", 37.5, "High")
          : getStatus(97.6, "Low", 99.6, "High")}
        hasError={state.tempInCelcius
          ? ValidationUtils.isInputInRangeFloat("35", "41", state.temperature)
          : ValidationUtils.isInputInRangeFloat("95", "106", state.temperature)}
      />
      <Slider
        title={"Respiratory Rate (bpm)"}
        start={"0"}
        end={"150"}
        interval={"5"}
        step={1.0}
        value={Belt.Option.mapWithDefault(state.resp, "", string_of_int)}
        setValue={s => send(SetResp(int_of_string(s)))}
        getLabel={getStatus(12.0, "Low", 16.0, "High")}
        hasError={ValidationUtils.isInputInRangeInt(0, 150, state.resp)}
      />
      <div className="w-full">
        <div className="mx-2">
          <h4> {str("Pain")} </h4>
          <p> {str("Mark region and intensity of pain")} </p>
        </div>
      </div>
      <CriticalCare__PainEditor
        previewMode={false}
        painParameter={state.pain}
        updateCB={data => {
          send(SetPain(data))
        }}
        id={id}
        consultationId={consultationId}
      />
      <div className="border-b border-b-secondary-500 w-full mt-10" />
      <Slider
        title={"Pulse (bpm)"}
        start={"0"}
        end={"200"}
        interval={"10"}
        step={1.0}
        value={Belt.Option.mapWithDefault(state.pulse, "", string_of_int)}
        setValue={s => send(SetPulse(int_of_string(s)))}
        getLabel={getStatus(40.0, "Bradycardia", 100.0, "Tachycardia")}
        hasError={ValidationUtils.isInputInRangeInt(0, 200, state.pulse)}
      />
      <div className="w-full mb-10 px-3">
        <label className="block mb-2 font-bold"> {str("Heartbeat Rhythm")} </label>
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
      <div className="w-full mb-10 px-3">
        <label htmlFor="description" className="block mb-2 font-bold">
          {str("Heartbeat Description")}
        </label>
        <textarea
          id="description"
          className="block w-full border-secondary-500 border-2 rounded px-2 py-1 focus:outline-green-500 focus:outline-offset-0 focus:outline-1 focus:border-green-500"
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
