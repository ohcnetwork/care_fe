let str = React.string
open CriticalCare__Types

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

let getFieldValue = event => {
  ReactEvent.Form.target(event)["value"]
}

@react.component
let make = (~state, ~send) => {
  open NeurologicalMonitoring
  <div className="my-10">
    <div className="text-2xl font-bold my-2 mb-4"> {str("Pupil")} </div>
    <div className="mb-2">
      <div className="text-lg font-bold my-3"> {str("Left Pupil")} </div>
      <CriticalCare__PupilRangeSlider
        name={"left_pupil_slider"}
        val={Belt.Option.getWithDefault(leftPupilSize(state), "")}
        setValue={value => send(SetLeftPupilSize(Some(value)))}
      />
      {if leftPupilSize(state) === Some("cannot_be_assessed") {
        <CriticalCare__Description
          name="left_size_description"
          text={Belt.Option.getWithDefault(leftSizeDescription(state), "")}
          onChange={event => send(SetLeftSizeDescription(getFieldValue(event)))}
        />
      } else {
        <> </>
      }}
      <div className="my-5 mb-8">
        <div className="font-bold my-4"> {str("Reaction")} </div>
        <CriticalCare__RadioButton
          options={left_reaction_options}
          horizontal=true
          defaultChecked={Belt.Option.getWithDefault(leftPupilReaction(state), "")}
          onChange={event => send(SetLeftPupilReaction(getFieldValue(event)))}
        />
        {if leftPupilReaction(state) === Some("cannot_be_assessed") {
          <CriticalCare__Description
            name="left_reaction_description"
            text={Belt.Option.getWithDefault(leftReactionDescription(state), "")}
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
        val={Belt.Option.getWithDefault(rightPupilSize(state), "")}
        setValue={value => send(SetRightPupilSize(Some(value)))}
      />
      {if rightPupilSize(state) === Some("cannot_be_assessed") {
        <CriticalCare__Description
          name="right_size_description"
          text={Belt.Option.getWithDefault(rightSizeDescription(state), "")}
          onChange={event => send(SetRightSizeDescription(getFieldValue(event)))}
        />
      } else {
        <> </>
      }}
      <div className="my-5 mb-8">
        <div className="font-bold my-4"> {str("Reaction")} </div>
        <CriticalCare__RadioButton
          options={right_reaction_options}
          horizontal=true
          defaultChecked={Belt.Option.getWithDefault(rightPupilReaction(state), "")}
          onChange={event => send(SetRightPupilReaction(getFieldValue(event)))}
        />
        {if rightPupilReaction(state) === Some("cannot_be_assessed") {
          <CriticalCare__Description
            name="right_reaction_description"
            text={Belt.Option.getWithDefault(rightReactionDescription(state), "")}
            onChange={event => send(SetRightReactionDescription(getFieldValue(event)))}
          />
        } else {
          <> </>
        }}
      </div>
    </div>
  </div>
}
