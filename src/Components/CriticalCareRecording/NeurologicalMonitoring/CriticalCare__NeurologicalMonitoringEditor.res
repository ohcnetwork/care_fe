let str = React.string
open CriticalCare__Types

@module("../CriticalCare__API")
external updateDailyRound: (string, string, Js.Json.t, _ => unit, _ => unit) => unit =
  "updateDailyRound"

type state = {
  inPronePosition: bool,
  consciousnessLevel: NeurologicalMonitoring.consciousnessLevel,
  consciousnessLevelDetails: string,
  leftPupilSize: option<int>,
  leftPupilSizeDetails: string,
  leftPupilLightReaction: NeurologicalMonitoring.lightReaction,
  leftPupilLightReactionDetails: string,
  rightPupilSize: option<int>,
  rightPupilSizeDetails: string,
  rightPupilLightReaction: NeurologicalMonitoring.lightReaction,
  rightPupilLightReactionDetails: string,
  glasgowEyeOpen: option<int>,
  glasgowVerbalResponse: option<int>,
  glasgowMotorResponse: option<int>,
  limbResponseUpperExtremityRight: NeurologicalMonitoring.limpResponse,
  limbResponseUpperExtremityLeft: NeurologicalMonitoring.limpResponse,
  limbResponseLowerExtremityRight: NeurologicalMonitoring.limpResponse,
  limbResponseLowerExtremityLeft: NeurologicalMonitoring.limpResponse,
  saving: bool,
  dirty: bool,
}

type action =
  | SetInPronePosition
  | SetNotInPronePosition
  | SetConsciousnessLevel(NeurologicalMonitoring.consciousnessLevel)
  | SetConsciousnessLevelDetails(string)
  | SetLeftPupilSize(int)
  | SetLeftPupilSizeDetails(string)
  | SetLeftPupilLightReaction(NeurologicalMonitoring.lightReaction)
  | SetLeftPupilLightReactionDetails(string)
  | SetRightPupilSize(int)
  | SetRightPupilSizeDetails(string)
  | SetRightPupilLightReactionDetails(string)
  | SetRightPupilLightReaction(NeurologicalMonitoring.lightReaction)
  | SetGlasgowEyeOpen(int)
  | SetGlasgowVerbalResponse(int)
  | SetGlasgowMotorResponse(int)
  | SetLimbResponseUpperExtremityRight(NeurologicalMonitoring.limpResponse)
  | SetLimbResponseUpperExtremityLeft(NeurologicalMonitoring.limpResponse)
  | SetLimbResponseLowerExtremityRight(NeurologicalMonitoring.limpResponse)
  | SetLimbResponseLowerExtremityLeft(NeurologicalMonitoring.limpResponse)
  | SetSaving
  | ClearSaving

let reducer = (state, action) => {
  switch action {
  | SetInPronePosition => {
      ...state,
      dirty: true,
      inPronePosition: true,
    }

  | SetNotInPronePosition => {
      ...state,
      dirty: true,
      inPronePosition: false,
    }

  | SetConsciousnessLevel(consciousnessLevel) => {
      ...state,
      dirty: true,
      consciousnessLevel: consciousnessLevel,
    }
  | SetConsciousnessLevelDetails(consciousnessLevelDetails) => {
      ...state,
      dirty: true,
      consciousnessLevelDetails: consciousnessLevelDetails,
    }
  | SetLeftPupilSize(leftPupilSize) => {
      ...state,
      dirty: true,
      leftPupilSize: Some(leftPupilSize),
    }
  | SetLeftPupilSizeDetails(leftPupilSizeDetails) => {
      ...state,
      dirty: true,
      leftPupilSizeDetails: leftPupilSizeDetails,
    }
  | SetLeftPupilLightReaction(leftPupilLightReaction) => {
      ...state,
      dirty: true,
      leftPupilLightReaction: leftPupilLightReaction,
    }
  | SetLeftPupilLightReactionDetails(leftPupilLightReactionDetails) => {
      ...state,
      dirty: true,
      leftPupilLightReactionDetails: leftPupilLightReactionDetails,
    }
  | SetRightPupilSize(rightPupilSize) => {
      ...state,
      dirty: true,
      rightPupilSize: Some(rightPupilSize),
    }
  | SetRightPupilSizeDetails(rightPupilSizeDetails) => {
      ...state,
      dirty: true,
      rightPupilSizeDetails: rightPupilSizeDetails,
    }
  | SetRightPupilLightReaction(rightPupilLightReaction) => {
      ...state,
      dirty: true,
      rightPupilLightReaction: rightPupilLightReaction,
    }
  | SetRightPupilLightReactionDetails(rightPupilLightReactionDetails) => {
      ...state,
      dirty: true,
      rightPupilLightReactionDetails: rightPupilLightReactionDetails,
    }
  | SetGlasgowEyeOpen(glasgowEyeOpen) => {...state, glasgowEyeOpen: Some(glasgowEyeOpen)}
  | SetGlasgowVerbalResponse(glasgowVerbalResponse) => {
      ...state,
      dirty: true,
      glasgowVerbalResponse: Some(glasgowVerbalResponse),
    }
  | SetGlasgowMotorResponse(glasgowMotorResponse) => {
      ...state,
      dirty: true,
      glasgowMotorResponse: Some(glasgowMotorResponse),
    }
  | SetLimbResponseUpperExtremityRight(limbResponseUpperExtremityRight) => {
      ...state,
      dirty: true,
      limbResponseUpperExtremityRight: limbResponseUpperExtremityRight,
    }
  | SetLimbResponseUpperExtremityLeft(limbResponseUpperExtremityLeft) => {
      ...state,
      dirty: true,
      limbResponseUpperExtremityLeft: limbResponseUpperExtremityLeft,
    }
  | SetLimbResponseLowerExtremityRight(limbResponseLowerExtremityRight) => {
      ...state,
      dirty: true,
      limbResponseLowerExtremityRight: limbResponseLowerExtremityRight,
    }
  | SetLimbResponseLowerExtremityLeft(limbResponseLowerExtremityLeft) => {
      ...state,
      dirty: true,
      limbResponseLowerExtremityLeft: limbResponseLowerExtremityLeft,
    }

  | SetSaving => {...state, saving: true}
  | ClearSaving => {...state, saving: false}
  }
}

let handleProneSelect = (send, event) => {
  ReactEvent.Form.target(event)["checked"] ? send(SetInPronePosition) : send(SetNotInPronePosition)
}

let initialState = neurologicalMonitoring => {
  inPronePosition: Belt.Option.getWithDefault(
    NeurologicalMonitoring.inPronePosition(neurologicalMonitoring),
    false,
  ),
  consciousnessLevel: NeurologicalMonitoring.consciousnessLevel(neurologicalMonitoring),
  consciousnessLevelDetails: Belt.Option.getWithDefault(
    NeurologicalMonitoring.consciousnessLevelDetails(neurologicalMonitoring),
    "",
  ),
  leftPupilSize: NeurologicalMonitoring.leftPupilSize(neurologicalMonitoring),
  leftPupilSizeDetails: Belt.Option.getWithDefault(
    NeurologicalMonitoring.leftPupilSizeDetails(neurologicalMonitoring),
    "",
  ),
  leftPupilLightReaction: NeurologicalMonitoring.leftPupilLightReaction(neurologicalMonitoring),
  leftPupilLightReactionDetails: Belt.Option.getWithDefault(
    NeurologicalMonitoring.leftPupilLightReactionDetails(neurologicalMonitoring),
    "",
  ),
  rightPupilSize: NeurologicalMonitoring.rightPupilSize(neurologicalMonitoring),
  rightPupilSizeDetails: Belt.Option.getWithDefault(
    NeurologicalMonitoring.rightPupilSizeDetails(neurologicalMonitoring),
    "",
  ),
  rightPupilLightReaction: NeurologicalMonitoring.rightPupilLightReaction(neurologicalMonitoring),
  rightPupilLightReactionDetails: Belt.Option.getWithDefault(
    NeurologicalMonitoring.rightPupilLightReactionDetails(neurologicalMonitoring),
    "",
  ),
  glasgowEyeOpen: NeurologicalMonitoring.glasgowEyeOpen(neurologicalMonitoring),
  glasgowVerbalResponse: NeurologicalMonitoring.glasgowVerbalResponse(neurologicalMonitoring),
  glasgowMotorResponse: NeurologicalMonitoring.glasgowMotorResponse(neurologicalMonitoring),
  limbResponseUpperExtremityRight: NeurologicalMonitoring.limbResponseUpperExtremityRight(
    neurologicalMonitoring,
  ),
  limbResponseUpperExtremityLeft: NeurologicalMonitoring.limbResponseUpperExtremityLeft(
    neurologicalMonitoring,
  ),
  limbResponseLowerExtremityRight: NeurologicalMonitoring.limbResponseLowerExtremityRight(
    neurologicalMonitoring,
  ),
  limbResponseLowerExtremityLeft: NeurologicalMonitoring.limbResponseLowerExtremityLeft(
    neurologicalMonitoring,
  ),
  saving: false,
  dirty: false,
}

let renderLightReaction = (
  ~input,
  ~name,
  ~label=name,
  ~onInputChange,
  ~inputDetails,
  ~onInputDetailsChange,
) => {
  <div className="my-5 mb-8">
    <div className="font-bold mt-4"> {str("Reaction")} </div>
    <div className="flex md:flex-row flex-col md:space-y-0 space-y-2 space-x-0 md:space-x-4">
      {Js.Array.map(lightReaction => {
        <Radio
          key={label ++ NeurologicalMonitoring.lightReactionToString(lightReaction)}
          id={label ++ NeurologicalMonitoring.lightReactionToString(lightReaction)}
          label={NeurologicalMonitoring.lightReactionToString(lightReaction)}
          checked={lightReaction === input}
          onChange={_ => onInputChange(lightReaction)}
        />
      }, [Brisk, Sluggish, Fixed, CannotBeAssessed])->React.array}
    </div>
    {ReactUtils.nullUnless(
      <CriticalCare__Description
        name={`${name}_reaction_description`}
        label={`${label} Light Reaction Description`}
        text={inputDetails}
        onChange={value => onInputDetailsChange(value)}
      />,
      input === NeurologicalMonitoring.CannotBeAssessed,
    )}
  </div>
}

let renderLimpResponse = (~input, ~onInputChange, ~label) => {
  <div className="mt-4">
    <div className="font-bold mt-2"> {str(label)} </div>
    <div className="mt-2 flex md:flex-row flex-col md:space-y-0 space-y-2 space-x-0 md:space-x-4">
      {Js.Array.map(limpResponse => {
        <Radio
          key={label ++ NeurologicalMonitoring.limpResponseToString(limpResponse)}
          id={label ++ NeurologicalMonitoring.limpResponseToString(limpResponse)}
          label={NeurologicalMonitoring.limpResponseToString(limpResponse)}
          checked={limpResponse === input}
          onChange={_ => onInputChange(limpResponse)}
        />
      }, [Strong, Moderate, Weak, Flexion, Extension, NONE_])->React.array}
    </div>
  </div>
}

let renderConsciousnessLevel = (
  ~input,
  ~name,
  ~label=name,
  ~onInputChange,
  ~inputDetails,
  ~onInputDetailsChange,
) => {
  <div className="my-10">
    <div className=" text-2xl font-bold my-2"> {str("Level Of Consciousness")} </div>
    <div className="flex md:flex-row flex-col md:space-y-0 space-y-2 space-x-0 md:space-x-4">
      {Js.Array.map(consciousnessLevel => {
        <Radio
          key={label ++ NeurologicalMonitoring.consciousnessLevelToString(consciousnessLevel)}
          id={label ++ NeurologicalMonitoring.consciousnessLevelToString(consciousnessLevel)}
          label={NeurologicalMonitoring.consciousnessLevelToString(consciousnessLevel)}
          checked={consciousnessLevel === input}
          onChange={_ => onInputChange(consciousnessLevel)}
        />
      }, [Alert, Drowsy, Stuporous, Comatose, CannotBeAssessed])->React.array}
    </div>
    {ReactUtils.nullUnless(
      <CriticalCare__Description
        name={`${name}_reaction_description`}
        label={`${label} Reaction Description`}
        text={inputDetails}
        onChange={event => onInputDetailsChange(event)}
      />,
      input === NeurologicalMonitoring.CannotBeAssessed,
    )}
  </div>
}

let renderPupil = (state, send) => {
  <div className="mt-10">
    <div className="text-2xl font-bold my-2 mb-4"> {str("Pupil")} </div>
    <div className="mb-2">
      <div className="text-lg font-bold my-3"> {str("Left Pupil")} </div>
      <CriticalCare__PupilRangeSlider
        name={"left_pupil_slider"}
        value={state.leftPupilSize}
        setValueCB={value => send(SetLeftPupilSize(value))}
      />
      {ReactUtils.nullUnless(
        <CriticalCare__Description
          name="left_size_description"
          label="Left Pupil Size Description"
          text={state.leftPupilSizeDetails}
          onChange={event => send(SetLeftPupilSizeDetails(event))}
        />,
        state.leftPupilSize === Some(0),
      )}
      {renderLightReaction(
        ~input=state.leftPupilLightReaction,
        ~onInputChange={value => send(SetLeftPupilLightReaction(value))},
        ~inputDetails={state.leftPupilLightReactionDetails},
        ~onInputDetailsChange={
          value => {
            send(SetLeftPupilLightReactionDetails(value))
          }
        },
        ~label="Left",
        ~name="left",
      )}
    </div>
    <div>
      <div className="text-lg font-bold my-5"> {str("Right Pupil")} </div>
      <CriticalCare__PupilRangeSlider
        name={"right_pupil_slider"}
        value={state.rightPupilSize}
        setValueCB={value => send(SetRightPupilSize(value))}
      />
      {ReactUtils.nullUnless(
        <CriticalCare__Description
          name="right_size_description"
          label="Right Pupil Size Description"
          text={state.rightPupilSizeDetails}
          onChange={event => send(SetRightPupilSizeDetails(event))}
        />,
        state.rightPupilSize === Some(0),
      )}
      {renderLightReaction(
        ~input=state.rightPupilLightReaction,
        ~onInputChange={value => send(SetRightPupilLightReaction(value))},
        ~inputDetails={state.rightPupilLightReactionDetails},
        ~onInputDetailsChange={value => send(SetRightPupilLightReactionDetails(value))},
        ~label="Right",
        ~name="right",
      )}
    </div>
  </div>
}

let glasgowScore = state => {
  Belt.Option.getWithDefault(state.glasgowEyeOpen, 0) +
  Belt.Option.getWithDefault(state.glasgowVerbalResponse, 0) +
  Belt.Option.getWithDefault(state.glasgowMotorResponse, 0)
}

let setOptionalString = (key, value, payload) => {
  if String.trim(value) !== "" {
    Js.Dict.set(payload, key, Js.Json.string(value))
  }
}

let setOptionalNumber = (key, value, payload) => {
  switch value {
  | Some(v) => Js.Dict.set(payload, key, Js.Json.number(float_of_int(v)))
  | None => ()
  }
}

let makePayload = state => {
  let payload = Js.Dict.empty()
  Js.Dict.set(payload, "in_prone_position", Js.Json.boolean(state.inPronePosition))

  Js.Dict.set(
    payload,
    "consciousness_level",
    Js.Json.string(NeurologicalMonitoring.encodeConConsciousnessLevel(state.consciousnessLevel)),
  )

  DictUtils.setOptionalString(
    "consciousness_level_detail",
    state.consciousnessLevelDetails,
    payload,
  )

  if !state.inPronePosition {
    DictUtils.setOptionalNumber("left_pupil_size", state.leftPupilSize, payload)
    DictUtils.setOptionalString("left_pupil_size_detail", state.leftPupilSizeDetails, payload)
    DictUtils.setOptionalString(
      "left_pupil_light_reaction_detail",
      state.leftPupilLightReactionDetails,
      payload,
    )
    Js.Dict.set(
      payload,
      "left_pupil_light_reaction",
      Js.Json.string(NeurologicalMonitoring.encodeLightReaction(state.leftPupilLightReaction)),
    )

    DictUtils.setOptionalNumber("right_pupil_size", state.rightPupilSize, payload)
    DictUtils.setOptionalString("right_pupil_size_detail", state.rightPupilSizeDetails, payload)
    DictUtils.setOptionalString(
      "right_pupil_light_reaction_detail",
      state.rightPupilLightReactionDetails,
      payload,
    )
    Js.Dict.set(
      payload,
      "right_pupil_light_reaction",
      Js.Json.string(NeurologicalMonitoring.encodeLightReaction(state.rightPupilLightReaction)),
    )
  }
  DictUtils.setOptionalNumber("glasgow_eye_open", state.glasgowEyeOpen, payload)
  DictUtils.setOptionalNumber("glasgow_verbal_response", state.glasgowVerbalResponse, payload)
  DictUtils.setOptionalNumber("glasgow_motor_response", state.glasgowMotorResponse, payload)

  Js.Dict.set(
    payload,
    "limb_response_upper_extremity_right",
    Js.Json.string(
      NeurologicalMonitoring.encodeLimpResponse(state.limbResponseUpperExtremityRight),
    ),
  )

  Js.Dict.set(
    payload,
    "limb_response_upper_extremity_left",
    Js.Json.string(NeurologicalMonitoring.encodeLimpResponse(state.limbResponseUpperExtremityLeft)),
  )
  Js.Dict.set(
    payload,
    "limb_response_lower_extremity_right",
    Js.Json.string(
      NeurologicalMonitoring.encodeLimpResponse(state.limbResponseLowerExtremityRight),
    ),
  )
  Js.Dict.set(
    payload,
    "limb_response_lower_extremity_left",
    Js.Json.string(NeurologicalMonitoring.encodeLimpResponse(state.limbResponseLowerExtremityLeft)),
  )

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

@react.component
let make = (~updateCB, ~neurologicalMonitoring, ~id, ~consultationId) => {
  let (state, send) = React.useReducer(reducer, initialState(neurologicalMonitoring))
  <div>
    <CriticalCare__PageTitle title="Neurological Monitoring" />
    {<div className="my-4">
      <div className="my-10">
        <CriticalCare__Switch checked={state.inPronePosition} onChange={handleProneSelect(send)} />
      </div>
      {renderConsciousnessLevel(
        ~input=state.consciousnessLevel,
        ~onInputChange={value => send(SetConsciousnessLevel(value))},
        ~inputDetails={state.consciousnessLevelDetails},
        ~onInputDetailsChange={value => send(SetConsciousnessLevelDetails(value))},
        ~label="Consciousness Level",
        ~name="consciousness_level",
      )}
      {ReactUtils.nullIf(renderPupil(state, send), state.inPronePosition)}
      <div className="my-15 w-full h-1 bg-gray-300" />
      <div className="my-10">
        <div className="text-3xl font-bold"> {str("Glasgow Coma Scale")} </div>
        <div className="mt-4">
          <div className="font-bold mt-4"> {str("Eye Open")} </div>
          <div>
            {Js.Array.mapi(
              (x, i) =>
                <Radio
                  key={string_of_int(i)}
                  id={"eyeOpen" ++ NeurologicalMonitoring.eyeOpenToString(x)}
                  label={NeurologicalMonitoring.eyeOpenToString(x)}
                  checked={Belt.Option.mapWithDefault(state.glasgowEyeOpen, false, o => x === o)}
                  onChange={_ => send(SetGlasgowEyeOpen(x))}
                />,
              [1, 2, 3, 4],
            )->React.array}
          </div>
        </div>
        <div className="mt-4">
          <div className="font-bold mt-4"> {str("Verbal Response")} </div>
          <div>
            {Js.Array.mapi(
              (x, i) =>
                <Radio
                  key={string_of_int(i)}
                  id={"VerbalResponse" ++ NeurologicalMonitoring.verbalResposneToString(x)}
                  label={NeurologicalMonitoring.verbalResposneToString(x)}
                  checked={Belt.Option.mapWithDefault(state.glasgowVerbalResponse, false, o =>
                    x === o
                  )}
                  onChange={_ => send(SetGlasgowVerbalResponse(x))}
                />,
              [1, 2, 3, 4, 5],
            )->React.array}
          </div>
        </div>
        <div className="mt-4">
          <div className="font-bold mt-4"> {str("Motor Response")} </div>
          <div>
            {Js.Array.mapi(
              (x, i) =>
                <Radio
                  key={string_of_int(i)}
                  id={"MotorResponse" ++ NeurologicalMonitoring.motorResposneToString(x)}
                  label={NeurologicalMonitoring.motorResposneToString(x)}
                  checked={Belt.Option.mapWithDefault(state.glasgowMotorResponse, false, o =>
                    x === o
                  )}
                  onChange={_ => send(SetGlasgowMotorResponse(x))}
                />,
              [1, 2, 3, 4, 5, 6],
            )->React.array}
          </div>
        </div>
        <div className="flex justify-between mt-4">
          <div className="font-bold text-xl"> {str("Total")} </div>
          <div className="text-3xl text-blue-500 font-bold">
            {str(string_of_int(glasgowScore(state)))}
          </div>
        </div>
      </div>
      <div className="my-15 w-full h-1 bg-gray-300" />
      <div className="my-10">
        <div className="text-3xl font-bold"> {str("Limp Response")} </div>
        <div>
          {renderLimpResponse(
            ~input=state.limbResponseUpperExtremityRight,
            ~onInputChange=value => send(SetLimbResponseUpperExtremityRight(value)),
            ~label="Upper Extremity Right
            ",
          )}
          {renderLimpResponse(
            ~input=state.limbResponseUpperExtremityLeft,
            ~onInputChange=value => send(SetLimbResponseUpperExtremityLeft(value)),
            ~label="Upper Extremity Left",
          )}
          {renderLimpResponse(
            ~input=state.limbResponseLowerExtremityRight,
            ~onInputChange=value => send(SetLimbResponseLowerExtremityRight(value)),
            ~label="Lower Extremity Right",
          )}
          {renderLimpResponse(
            ~input=state.limbResponseLowerExtremityLeft,
            ~onInputChange=value => send(SetLimbResponseLowerExtremityLeft(value)),
            ~label="Lower Extremity Left",
          )}
        </div>
      </div>
      <div className="my-15 w-full h-1 bg-gray-300" />
      <button
        disabled={state.saving || !state.dirty}
        className="btn btn-primary btn-large w-full"
        onClick={_ => saveData(id, consultationId, state, send, updateCB)}>
        {str("Update Details")}
      </button>
    </div>}
  </div>
}
