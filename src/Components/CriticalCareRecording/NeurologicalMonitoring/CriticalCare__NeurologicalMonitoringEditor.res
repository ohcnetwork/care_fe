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
    title: limps[0],
    title_value: limps_title_val[0],
    options: [
      {
        name: limps_title_val[0],
        value: "S",
        label: "Strong",
      },
      {
        name: limps_title_val[0],
        value: "M",
        label: "Moderate",
      },
      {
        name: limps_title_val[0],
        value: "W",
        label: "Weak",
      },
      {
        name: limps_title_val[0],
        value: "F",
        label: "Flexion",
      },
      {
        name: limps_title_val[0],
        value: "E",
        label: "Extension",
      },
      {
        name: limps_title_val[0],
        value: "0",
        label: "None",
      },
    ],
  },
  {
    title: limps[1],
    title_value: limps_title_val[1],
    options: [
      {
        name: limps_title_val[1],
        value: "S",
        label: "Strong",
      },
      {
        name: limps_title_val[1],
        value: "M",
        label: "Moderate",
      },
      {
        name: limps_title_val[1],
        value: "W",
        label: "Weak",
      },
      {
        name: limps_title_val[1],
        value: "F",
        label: "Flexion",
      },
      {
        name: limps_title_val[1],
        value: "E",
        label: "Extension",
      },
      {
        name: limps_title_val[1],
        value: "0",
        label: "None",
      },
    ],
  },
  {
    title: limps[2],
    title_value: limps_title_val[2],
    options: [
      {
        name: limps_title_val[2],
        value: "S",
        label: "Strong",
      },
      {
        name: limps_title_val[2],
        value: "M",
        label: "Moderate",
      },
      {
        name: limps_title_val[2],
        value: "W",
        label: "Weak",
      },
      {
        name: limps_title_val[2],
        value: "F",
        label: "Flexion",
      },
      {
        name: limps_title_val[2],
        value: "E",
        label: "Extension",
      },
      {
        name: limps_title_val[2],
        value: "0",
        label: "None",
      },
    ],
  },
  {
    title: limps[3],
    title_value: limps_title_val[3],
    options: [
      {
        name: limps_title_val[3],
        value: "S",
        label: "Strong",
      },
      {
        name: limps_title_val[3],
        value: "M",
        label: "Moderate",
      },
      {
        name: limps_title_val[3],
        value: "W",
        label: "Weak",
      },
      {
        name: limps_title_val[3],
        value: "F",
        label: "Flexion",
      },
      {
        name: limps_title_val[3],
        value: "E",
        label: "Extension",
      },
      {
        name: limps_title_val[3],
        value: "0",
        label: "None",
      },
    ],
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
  let status = NeurologicalMonitoring.showStatus(state)
  let _ = Js.log2(status, state)
  handleDone(state, status)
}

type action =
  | SetPronePosition(bool)
  | SetLevelOfConciousness(string)
  | SetLocDescription(string)
  | SetLeftPupilSize(string)
  | SetLeftSizeDescription(string)
  | SetLeftPupilReaction(string)
  | SetLeftReactionDescription(string)
  | SetRightPupilSize(string)
  | SetRightSizeDescription(string)
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
  open NeurologicalMonitoring
  switch action {
  | SetPronePosition(pronePosition) => {
      ...state,
      pronePosition: pronePosition,
    }
  | SetLevelOfConciousness(levelOfConciousness) => {
      ...state,
      levelOfConciousness: levelOfConciousness,
      locDescription: levelOfConciousness === "cannot_be_assessed" ? locDescription(state) : "",
    }
  | SetLocDescription(locDescription) => {
      ...state,
      locDescription: locDescription,
    }
  | SetLeftPupilSize(leftPupilSize) => {
      ...state,
      leftPupilSize: leftPupilSize,
      leftSizeDescription: leftPupilSize === "cannot_be_assessed" ? leftSizeDescription(state) : "",
    }
  | SetLeftSizeDescription(leftSizeDescription) => {
      ...state,
      leftSizeDescription: leftSizeDescription,
    }
  | SetLeftPupilReaction(leftPupilReaction) => {
      ...state,
      leftPupilReaction: leftPupilReaction,
      leftReactionDescription: leftPupilReaction === "cannot_be_assessed"
        ? leftReactionDescription(state)
        : "",
    }
  | SetLeftReactionDescription(leftReactionDescription) => {
      ...state,
      leftReactionDescription: leftReactionDescription,
    }
  | SetRightPupilSize(rightPupilSize) => {
      ...state,
      rightPupilSize: rightPupilSize,
      rightSizeDescription: rightPupilSize === "cannot_be_assessed"
        ? rightSizeDescription(state)
        : "",
    }
  | SetRightSizeDescription(rightSizeDescription) => {
      ...state,
      rightSizeDescription: rightSizeDescription,
    }
  | SetRightPupilReaction(rightPupilReaction) => {
      ...state,
      rightPupilReaction: rightPupilReaction,
      rightReactionDescription: rightPupilReaction === "cannot_be_assessed"
        ? rightReactionDescription(state)
        : "",
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

let getlimpState = (limp, state) => {
  switch limp {
  | "upper_extremity_right" => NeurologicalMonitoring.upperExtremityR(state)
  | "upper_extremity_left" => NeurologicalMonitoring.upperExtremityL(state)
  | "lower_extremity_right" => NeurologicalMonitoring.lowerExtremityR(state)
  | "lower_extremity_left" => NeurologicalMonitoring.lowerExtremityL(state)
  | _ => ""
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

let getToggleState = event => {
  ReactEvent.Form.target(event)["checked"]
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
      <div className="my-10">
        <CriticalCare__Switch
          checked={NeurologicalMonitoring.pronePosition(state)}
          onChange={event => send(SetPronePosition(getToggleState(event)))}
        />
      </div>
      <div className="my-10">
        <div className=" text-2xl font-bold my-2"> {str("Level Of Consciousness")} </div>
        <CriticalCare__RadioButton
          options={loc_options}
          horizontal=true
          defaultChecked={NeurologicalMonitoring.levelOfConciousness(state)}
          onChange={event => send(SetLevelOfConciousness(getFieldValue(event)))}
        />
        {if NeurologicalMonitoring.levelOfConciousness(state) === "cannot_be_assessed" {
          <CriticalCare__Description
            name="loc_description"
            text={NeurologicalMonitoring.locDescription(state)}
            onChange={event => send(SetLocDescription(getFieldValue(event)))}
          />
        } else {
          <> </>
        }}
      </div>
      <div className="my-10">
        <div className="text-2xl font-bold my-2 mb-4"> {str("Pupil")} </div>
        <div className="mb-2">
          <div className="text-lg font-bold my-3"> {str("Left Pupil")} </div>
          <CriticalCare__PupilRangeSlider
            name={"left_pupil_slider"}
            val={NeurologicalMonitoring.leftPupilSize(state)}
            setValue={value => send(SetLeftPupilSize(value))}
          />
          {if NeurologicalMonitoring.leftPupilSize(state) === "cannot_be_assessed" {
            <CriticalCare__Description
              name="left_size_description"
              text={NeurologicalMonitoring.leftSizeDescription(state)}
              onChange={event => send(SetLeftSizeDescription(getFieldValue(event)))}
            />
          } else {
            <> </>
          }}
          <div className="my-5 mb-8">
            <div className="font-bold my-4"> {str("Reaction")} </div>
            <CriticalCare__RadioButton
              options={right_reaction_options}
              horizontal=true
              defaultChecked={NeurologicalMonitoring.leftPupilReaction(state)}
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
        </div>
        <div>
          <div className="text-lg font-bold my-5"> {str("Right Pupil")} </div>
          <CriticalCare__PupilRangeSlider
            name={"right_pupil_slider"}
            val={NeurologicalMonitoring.rightPupilSize(state)}
            setValue={value => send(SetRightPupilSize(value))}
          />
          {if NeurologicalMonitoring.rightPupilSize(state) === "cannot_be_assessed" {
            <CriticalCare__Description
              name="right_size_description"
              text={NeurologicalMonitoring.rightSizeDescription(state)}
              onChange={event => send(SetRightSizeDescription(getFieldValue(event)))}
            />
          } else {
            <> </>
          }}
          <div className="my-5 mb-8">
            <div className="font-bold my-4"> {str("Reaction")} </div>
            <CriticalCare__RadioButton
              options={reaction_options}
              horizontal=true
              defaultChecked={NeurologicalMonitoring.rightPupilReaction(state)}
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
      </div>
      <div className="my-15 w-full h-1 bg-gray-300" />
      <div className="my-10">
        <div className="text-3xl font-bold"> {str("Glasgow Coma Scale")} </div>
        <div>
          {glassgowComaScale
          |> Array.mapi((i, x) => {
            <div key={`${Options.title_value(x)}_${i->Belt.Int.toString}`}>
              <div className="flex justify-between">
                <div className="font-bold mt-8"> {str(Options.title(x))} </div>
                <div className="text-lg font-bold text-blue-500 mt-8">
                  {str(getGlascowState(Options.title_value(x), state))}
                </div>
              </div>
              <CriticalCare__RadioButton
                options={Options.options(x)}
                horizontal=false
                defaultChecked={getGlascowState(Options.title_value(x), state)}
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
          |> Array.mapi((i, x) => {
            <div key={`${Options.title_value(x)}_${i->Belt.Int.toString}`}>
              <div className="font-bold mt-8 mb-1"> {str(Options.title(x))} </div>
              <CriticalCare__RadioButton
                options={Options.options(x)}
                horizontal=true
                defaultChecked={getlimpState(Options.title_value(x), state)}
                onChange={event => send(limpAction(Options.title_value(x), getFieldValue(event)))}
              />
            </div>
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
