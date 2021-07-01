let str = React.string
open CriticalCare__Types

let loc_options: array<Options.t> = [
  {
    name: "loc",
    value: "alert",
    label: "Alert",
  },
  {
    name: "loc",
    value: "drowsy",
    label: "Drowsy",
  },
  {
    name: "loc",
    value: "stuporous",
    label: "Stuporous",
  },
  {
    name: "loc",
    value: "comatose",
    label: "Comatose",
  },
  {
    name: "loc",
    value: "cannot_be_assessed",
    label: "Cannot be assessed",
  },
]

let reaction_options: array<Options.t> = [
  {
    name: "reaction",
    value: "brisk",
    label: "Brisk",
  },
  {
    name: "reaction",
    value: "sluggish",
    label: "Sluggish",
  },
  {
    name: "reaction",
    value: "fixed",
    label: "Fixed",
  },
  {
    name: "reaction",
    value: "cannot_be_assessed",
    label: "Cannot be assessed",
  },
]
let glascow_title_val = ["eye_open", "verbal_response", "motor_response"]

let glassgowComaScale: Options.glassgow_coma_scale = [
  {
    title: "Eye Open",
    title_value: glascow_title_val[0],
    options: [
      {
        name: glascow_title_val[0],
        value: "4",
        label: "4 - Spontaneous",
      },
      {
        name: glascow_title_val[0],
        value: "3",
        label: "3 - To Speech",
      },
      {
        name: glascow_title_val[0],
        value: "2",
        label: "2 - To Pain",
      },
      {
        name: glascow_title_val[0],
        value: "1",
        label: "1 - None",
      },
    ],
  },
  {
    title: "Verbal Response",
    title_value: glascow_title_val[1],
    options: [
      {
        name: glascow_title_val[1],
        value: "5",
        label: "5 - Oriented/Coos/Babbies",
      },
      {
        name: glascow_title_val[1],
        value: "4",
        label: "4 - Confused/Irritable",
      },
      {
        name: glascow_title_val[1],
        value: "3",
        label: "3 - Inappropriate words/Cry to pain",
      },
      {
        name: glascow_title_val[1],
        value: "2",
        label: "2 - Incomprehensible words/Moans to pain",
      },
      {
        name: glascow_title_val[1],
        value: "1",
        label: "1 - None",
      },
    ],
  },
  {
    title: "Motor Response",
    title_value: glascow_title_val[2],
    options: [
      {
        name: glascow_title_val[2],
        value: "6",
        label: "6 - Obeying/Normal Activity",
      },
      {
        name: glascow_title_val[2],
        value: "5",
        label: "5 - Localizing/Withdrawl to touch",
      },
      {
        name: glascow_title_val[2],
        value: "4",
        label: "4 - Withdrawing",
      },
      {
        name: glascow_title_val[2],
        value: "3",
        label: "3 - Abnormal Flexion",
      },
      {
        name: glascow_title_val[2],
        value: "2",
        label: "2 - Incomprehensible words/Moans to pain",
      },
      {
        name: glascow_title_val[2],
        value: "1",
        label: "1 - None",
      },
    ],
  },
]

let limps = [
  "Upper Extremity-Right",
  "Upper Extremity-Left",
  "Lower Extremity-Right",
  "Lower Extremity-Left",
]
let limps_title_val = [
  "upper_extremity_right",
  "upper_extremity_left",
  "lower_extremity_right",
  "lower_extremity_left",
]

let limp_options: Options.limp_options = [
  {
    title: "Upper Extremity-Right",
    title_value: limps_title_val[0],
    options: [
      {
        name: limps_title_val[0],
        value: "strong",
        label: "Strong",
      },
      {
        name: limps_title_val[0],
        value: "moderate",
        label: "Moderate",
      },
      {
        name: limps_title_val[0],
        value: "weak",
        label: "Weak",
      },
      {
        name: limps_title_val[0],
        value: "flexion",
        label: "Flexion",
      },
      {
        name: limps_title_val[0],
        value: "extension",
        label: "Extension",
      },
      {
        name: limps_title_val[0],
        value: "none",
        label: "None",
      },
    ],
  },
  {
    title: "Upper Extremity-Left",
    title_value: limps_title_val[1],
    options: [
      {
        name: limps_title_val[1],
        value: "strong",
        label: "Strong",
      },
      {
        name: limps_title_val[1],
        value: "moderate",
        label: "Moderate",
      },
      {
        name: limps_title_val[1],
        value: "weak",
        label: "Weak",
      },
      {
        name: limps_title_val[1],
        value: "flexion",
        label: "Flexion",
      },
      {
        name: limps_title_val[1],
        value: "extension",
        label: "Extension",
      },
      {
        name: limps_title_val[1],
        value: "none",
        label: "None",
      },
    ],
  },
  {
    title: "Lower Extremity-Right",
    title_value: limps_title_val[2],
    options: [
      {
        name: limps_title_val[2],
        value: "strong",
        label: "Strong",
      },
      {
        name: limps_title_val[2],
        value: "moderate",
        label: "Moderate",
      },
      {
        name: limps_title_val[2],
        value: "weak",
        label: "Weak",
      },
      {
        name: limps_title_val[2],
        value: "flexion",
        label: "Flexion",
      },
      {
        name: limps_title_val[2],
        value: "extension",
        label: "Extension",
      },
      {
        name: limps_title_val[2],
        value: "none",
        label: "None",
      },
    ],
  },
  {
    title: "Lower Extremity-Left",
    title_value: limps_title_val[3],
    options: [
      {
        name: limps_title_val[3],
        value: "strong",
        label: "Strong",
      },
      {
        name: limps_title_val[3],
        value: "moderate",
        label: "Moderate",
      },
      {
        name: limps_title_val[3],
        value: "weak",
        label: "Weak",
      },
      {
        name: limps_title_val[3],
        value: "flexion",
        label: "Flexion",
      },
      {
        name: limps_title_val[3],
        value: "extension",
        label: "Extension",
      },
      {
        name: limps_title_val[3],
        value: "none",
        label: "None",
      },
    ],
  },
]

let cannot_be_assessed: array<Options.t> = [
  {
    name: "",
    value: "cannot_be_assessed",
    label: "Cannot be assessed",
  },
]

let right_reaction_options: array<Options.t> = [
  {
    name: "right_light_reaction",
    value: "brisk",
    label: "Brisk",
  },
  {
    name: "right_light_reaction",
    value: "sluggish",
    label: "Sluggish",
  },
  {
    name: "right_light_reaction",
    value: "fixed",
    label: "Fixed",
  },
  {
    name: "right_light_reaction",
    value: "cannot_be_assessed",
    label: "Cannot Be Assessed",
  },
]

let left_reaction_options: array<Options.t> = [
  {
    name: "left_light_reaction",
    value: "brisk",
    label: "Brisk",
  },
  {
    name: "left_light_reaction",
    value: "sluggish",
    label: "Sluggish",
  },
  {
    name: "left_light_reaction",
    value: "fixed",
    label: "Fixed",
  },
  {
    name: "left_light_reaction",
    value: "cannot be Assesed",
    label: "Cannot Be Assessed",
  },
]

let handleSubmit = (handleDone, state) => {
  handleDone(state)
}

type action =
  | SetLevelOfConciousness(string)
  | SetLeftPupilSize(string)
  | SetLeftPupilReaction(string)
  | SetLeftReactionDescription(string)
  | SetRightPupilSize(string)
  | SetRightReactionDescription(string)
  | SetRightPupilReaction(string)
  | SetEyeOpen(string)
  | SetVerbalResponse(string)
  | SetMotorResponse(string)
  | SetTotalGlascowScale(string)
  | SetUpperExtremityR(string)
  | SetUpperExtremityL(string)
  | SetLowerExtremityR(string)
  | SetLowerExtremityL(string)

let reducer = (state, action) => {
  switch action {
  | SetLevelOfConciousness(levelOfConciousness) => {
      ...state,
      NeurologicalMonitoring.levelOfConciousness: levelOfConciousness,
    }
  | SetLeftPupilSize(leftPupilSize) => {
      ...state,
      leftPupilSize: leftPupilSize,
    }
  | SetLeftPupilReaction(leftPupilReaction) => {
      ...state,
      leftPupilReaction: leftPupilReaction,
    }
  | SetLeftReactionDescription(leftReactionDescription) => {
      ...state,
      leftReactionDescription: leftReactionDescription,
    }
  | SetRightPupilSize(rightPupilSize) => {
      ...state,
      rightPupilSize: rightPupilSize,
    }
  | SetRightPupilReaction(rightPupilReaction) => {
      ...state,
      rightPupilReaction: rightPupilReaction,
    }
  | SetRightReactionDescription(rightReactionDescription) => {
      ...state,
      rightReactionDescription: rightReactionDescription,
    }
  | SetEyeOpen(eyeOpen) => {...state, eyeOpen: eyeOpen}
  | SetVerbalResponse(verbalResponse) => {
      ...state,
      verbalResponse: verbalResponse,
    }
  | SetMotorResponse(motorResponse) => {
      ...state,
      motorResponse: motorResponse,
    }
  | SetTotalGlascowScale(totalGlascowScale) => {
      ...state,
      totalGlascowScale: totalGlascowScale,
    }
  | SetUpperExtremityR(upperExtremityR) => {
      ...state,
      upperExtremityR: upperExtremityR,
    }
  | SetUpperExtremityL(upperExtremityL) => {
      ...state,
      upperExtremityL: upperExtremityL,
    }
  | SetLowerExtremityR(lowerExtremityR) => {
      ...state,
      lowerExtremityR: lowerExtremityR,
    }
  | SetLowerExtremityL(lowerExtremityL) => {
      ...state,
      lowerExtremityL: lowerExtremityL,
    }
  }
}

let glascowAction = (glascow, value) => {
  switch glascow {
  | "eye_open" => SetEyeOpen(value)
  | "verbal_response" => SetVerbalResponse(value)
  | "motor_response" => SetMotorResponse(value)
  | _ => SetMotorResponse(value)
  }
}

let getGlascowState = (glascow, state) => {
  switch glascow {
  | "eye_open" => NeurologicalMonitoring.eyeOpen(state)
  | "verbal_response" => NeurologicalMonitoring.verbalResponse(state)
  | "motor_response" => NeurologicalMonitoring.motorResponse(state)
  | _ => "0"
  }
}

let limpAction = (limp, value) => {
  switch limp {
  | "upper_extremity_right" => SetUpperExtremityR(value)
  | "upper_extremity_left" => SetUpperExtremityL(value)
  | "lower_extremity_right" => SetLowerExtremityR(value)
  | "lower_extremity_left" => SetLowerExtremityL(value)
  | _ => SetLowerExtremityL(value)
  }
}

let totalGlascowScore = state => {
  let count = Js.Array.reduce(
    (acc, x) => acc + Js.Option.getWithDefault(0, Belt.Int.fromString(getGlascowState(x, state))),
    0,
    glascow_title_val,
  )
  Belt.Int.toString(count)
}

let getFieldValue = event => {
  ReactEvent.Form.target(event)["value"]
}

@react.component
let make = (~handleDone, ~initialState) => {
  let (state, send) = React.useReducer(reducer, initialState)

  React.useEffect3(() => {
    let _ = send(SetTotalGlascowScale(totalGlascowScore(state)))
    None
  }, (
    NeurologicalMonitoring.eyeOpen(state),
    NeurologicalMonitoring.verbalResponse(state),
    NeurologicalMonitoring.motorResponse(state),
  ))
  Js.log(state)
  <div>
    <CriticalCare__PageTitle title="Neurological Monitoring" />
    <div className="my-4">
      // <div className="ml-36 w-8/12">
      <div className="my-10">
        <div className=" text-2xl font-bold my-2"> {str("Level Of Consciousness")} </div>
        <CriticalCare__RadioButton
          options={loc_options}
          horizontal=true
          onChange={event => send(SetLevelOfConciousness(getFieldValue(event)))}
        />
      </div>
      <div className="my-10">
        <div className="text-2xl font-bold my-2 mb-4"> {str("Pupil")} </div>
        <div className="text-lg font-bold my-3"> {str("Left Pupil")} </div>
        <CriticalCare__PupilRangeSlider />
        // <CriticalCare__RadioButton options ={cannot_be_assessed} horizontal=true />
        <div className="my-15 mb-8">
          <div className="font-bold my-4"> {str("Reaction")} </div>
          <CriticalCare__RadioButton
            options={right_reaction_options}
            horizontal=true
            onChange={event => send(SetLeftPupilReaction(getFieldValue(event)))}
          />
          {if NeurologicalMonitoring.leftPupilReaction(state) === "cannot_be_assessed" {
            <CriticalCare__Description
              name="left_reaction_description"
              text={NeurologicalMonitoring.leftReactionDescription(state)}
              onChange={event => send(SetLeftReactionDescription(getFieldValue(event)))}
            />
          } else {
            <> </>
          }}
        </div>
        <div className="text-lg font-bold my-5"> {str("Right Pupil")} </div>
        <CriticalCare__PupilRangeSlider />
        // <CriticalCare__RadioButton options ={cannot_be_assessed} horizontal=true />
        <div className="my-15 mb-8">
          <div className="font-bold my-4"> {str("Reaction")} </div>
          <CriticalCare__RadioButton
            options={reaction_options}
            horizontal=true
            onChange={event => send(SetRightPupilReaction(getFieldValue(event)))}
          />
          {if NeurologicalMonitoring.rightPupilReaction(state) === "cannot_be_assessed" {
            <CriticalCare__Description
              name="right_reaction_description"
              text={NeurologicalMonitoring.rightReactionDescription(state)}
              onChange={event => send(SetRightReactionDescription(getFieldValue(event)))}
            />
          } else {
            <> </>
          }}
        </div>
      </div>
      <div className="my-15 w-full h-1 bg-gray-300" />
      <div className="my-10">
        <div className="text-3xl font-bold"> {str("Glasgow Coma Scale")} </div>
        <div>
          {glassgowComaScale
          |> Array.map(x => {
            <div>
              <div className="flex justify-between">
                <div className="font-bold mt-8"> {str(Options.title(x))} </div>
                <div className="text-lg font-bold text-blue-500 mt-8">
                  {str(getGlascowState(Options.title_value(x), state))}
                </div>
              </div>
              <CriticalCare__RadioButton
                options={Options.options(x)}
                horizontal=false
                onChange={event =>
                  send(glascowAction(Options.title_value(x), getFieldValue(event)))}
              />
            </div>
          })
          |> React.array}
        </div>
        <div className="flex justify-between mt-4">
          <div className="font-bold text-xl"> {str("Total")} </div>
          <div className="text-3xl text-blue-500 font-bold">
            {str(NeurologicalMonitoring.totalGlascowScale(state))}
          </div>
        </div>
      </div>
      <div className="my-15 w-full h-1 bg-gray-300" />
      <div className="my-10">
        <div className="text-3xl font-bold"> {str("Limp Response")} </div>
        <div>
          {limp_options
          |> Array.map(x => {
            <>
              <div className="font-bold mt-8 mb-1"> {str(Options.title(x))} </div>
              <CriticalCare__RadioButton
                options={Options.options(x)}
                horizontal=true
                onChange={event => send(limpAction(Options.title_value(x), getFieldValue(event)))}
              />
            </>
          })
          |> React.array}
        </div>
      </div>
      <div className="my-15 w-full h-1 bg-gray-300" />
      <button
        className="flex w-full bg-blue-600 text-white p-2 text-lg hover:bg-blue-800 justify-center items-center rounded-md"
        onClick={_ => handleSubmit(handleDone, state)}>
        {str("Done")}
      </button>
    </div>
  </div>
}
