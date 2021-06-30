
let str = React.string

let loc_options :array<Options.t> = [
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
    }

]


let reaction_options :array<Options.t> = [
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
    }

]
let title_val = [
    "eye_open",
    "verbal_response",
    "motor_response"
]
let glassgowComaScale :Options.glassgow_coma_scale = [
    {
        title: "Eye Open",
        title_value: title_val[0],
        options: [
            {
                name: title_val[0],
                value: "4",
                label: "4 - Spontaneous",
            },
            {
                name: title_val[0],
                value: "3",
                label: "3 - To Speech",
            },
            {
                name: title_val[0],
                value: "2",
                label: "2 - To Pain",
            },
            {
                name: title_val[0],
                value: "1",
                label: "1 - None",
            }
        ]
    },
    {
        title: "Verbal Response",
        title_value: title_val[1],
        options: [
            {
                name: title_val[1],
                value: "5",
                label: "5 - Oriented/Coos/Babbies",
            },
            {
                name: title_val[1],
                value: "4",
                label: "4 - Confused/Irritable",
            },
            {
                name: title_val[1],
                value: "3",
                label: "3 - Inappropriate words/Cry to pain",
            },
            {
                name: title_val[1],
                value: "2",
                label: "2 - Incomprehensible words/Moans to pain",
            },
            {
                name: title_val[1],
                value: "1",
                label: "1 - None",
            }
        ]
    },
    {
        title: "Motor Response",
        title_value: "motor_response",
        options: [
            {
                name: title_val[2],
                value: "6",
                label: "6 - Obeying/Normal Activity",
            },
            {
                name: title_val[2],
                value: "5",
                label: "5 - Localizing/Withdrawl to touch",
            },
            {
                name: title_val[2],
                value: "4",
                label: "4 - Withdrawing",
            },
            {
                name: title_val[2],
                value: "3",
                label: "3 - Abnormal Flexion",
            },
            {
                name: title_val[2],
                value: "2",
                label: "2 - Incomprehensible words/Moans to pain",
            },
            {
                name: title_val[2],
                value: "1",
                label: "1 - None",
            }
        ]
    }
]

let limps = ["Upper Extremity-Right", "Upper Extremity-Left", "Lower Extremity-Right", "Lower Extremity-Left"]

let limp_options :array<Options.t> = [
    {
        name: "limp",
        value: "strong",
        label: "Strong",
    },
    {
        name: "limp",
        value: "moderate",
        label: "Moderate",
    },
    {
        name: "limp",
        value: "weak",
        label: "Weak",
    },
    {
        name: "limp",
        value: "flexion",
        label: "Flexion",
    },
    {
        name: "limp",
        value: "extension",
        label: "Extension",
    },
    {
        name: "limp",
        value: "none",
        label: "None",
    }

]

let cannot_be_assessed: array<Options.t> = [
    {
        name: "",
        value: "cannot_be_assessed",
        label: "Cannot be assessed",
    },
    ]

let handleSubmit = (handleDone, state) => {
	handleDone(state)
}

type action =
| SetLevelOfConciousness(string)
| SetLeftPupilSize(string)
| SetLeftPupilReaction(string)
| SetRightPuilSize(string)
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
        | SetLevelOfConciousness(levelOfConciousness) => {...state, NeurologicalMonitoringTypes.levelOfConciousness: levelOfConciousness}
        | SetLeftPupilSize(leftPupilSize) => {...state, NeurologicalMonitoringTypes.leftPupilSize: leftPupilSize}
        | SetLeftPupilReaction(leftPupilReaction) => {...state, NeurologicalMonitoringTypes.leftPupilReaction: leftPupilReaction}
        | SetRightPupilSize(rightPupilSize) => {...state, NeurologicalMonitoringTypes.rightPupilSize: rightPupilSize}
        | SetRightPupilReaction(rightPupilReaction) => {...state, NeurologicalMonitoringTypes.rightPupilReaction: rightPupilReaction}
        | SetEyeOpen(eyeOpen) => {...state, NeurologicalMonitoringTypes.eyeOpen: eyeOpen}
        | SetVerbalResponse(verbalResponse) => {...state, NeurologicalMonitoringTypes.verbalResponse: verbalResponse}
        | SetMotorResponse(motorResponse) => {...state, NeurologicalMonitoringTypes.motorResponse: motorResponse}
        | SetTotalGlascowScale(totalGlascowScale) => {...state, NeurologicalMonitoringTypes.totalGlascowScale: totalGlascowScale}
        | SetUpperExtremityR(upperExtremityR) => {...state, NeurologicalMonitoringTypes.upperExtremityR: upperExtremityR}
        | SetUpperExtremityL(upperExtremityL) => {...state, NeurologicalMonitoringTypes.upperExtremityL: upperExtremityL}
        | SetLowerExtremityR(lowerExtremityR) => {...state, NeurologicalMonitoringTypes.lowerExtremityR: lowerExtremityR}
        | SetLowerExtremityL(lowerExtremityL) => {...state, NeurologicalMonitoringTypes.lowerExtremityL: lowerExtremityL}
    }
}

let getFieldValue = (event) => {
	ReactEvent.Form.target(event)["value"]
}

@react.component
let make = (~handleDone, ~initialState) => {
    let (state, send) = React.useReducer(reducer, initialState)
    <div>
        <CriticalCare__PageTitle title="Neurological Monitoring" />
        <div className="my-4">
// <div className="ml-36 w-8/12">
            <div className="my-10">
                <div className=" text-2xl font-bold my-2">{str("Level Of Consciousness")}</div>
                // <CriticalCare__RadioButton options={loc_options} horizontal=true onChange={(event) =>  send(SetLevelOfConciousness(getFieldValue(event)))} />
            </div>
            <div className="my-10">
                <div className="text-2xl font-bold my-2 mb-4">{str("Pupil")}</div>
                <div className="text-lg font-bold my-3">{str("Left Pupil")}</div>
                <CriticalCare__PupilRangeSlider />
                <CriticalCare__RadioButton options ={cannot_be_assessed} horizontal=true />
                <div className="my-15 mb-8">
                    <div className="font-bold my-4">{str("Reaction")}</div>
                    <CriticalCare__RadioButton options={reaction_options} horizontal=true />
                </div>

                <div className="text-lg font-bold my-5">{str("Right Pupil")}</div>
                <CriticalCare__PupilRangeSlider />
                <CriticalCare__RadioButton options ={cannot_be_assessed} horizontal=true />
                <div className="my-15 mb-8">
                    <div className="font-bold my-4">{str("Reaction")}</div>
                    <CriticalCare__RadioButton options={reaction_options} horizontal=true/>
                </div>
            </div>

            <div className="my-15 w-full h-1 bg-gray-300"></div>

            <div className="my-10">
                <div className="text-3xl font-bold">{str("Glasgow Coma Scale")}</div>
                <div>
                    {glassgowComaScale|>Array.map((x) => {
                    <>
                        <div className="flex justify-between">
                            <div className="font-bold mt-8">{str(Options.title(x))}</div>
                            <div className="text-lg font-bold text-blue-500 mt-8">{str("1")}</div>
                        </div>
                            <CriticalCare__RadioButton options={Options.options(x)} horizontal=false />
                    </>
                })
                |> React.array }
                </div>
                <div className="flex justify-between mt-4">
                    <div className="font-bold text-xl">{str("Total")}</div>
                    <div className="text-3xl text-blue-500 font-bold">{str("3")}</div>
                </div>
            </div>

            <div className="my-15 w-full h-1 bg-gray-300"></div>

            <div className="my-10">
                <div className="text-3xl font-bold">{str("Limp Response")}</div>
                <div>
                    {limps|>Array.map((x) => {
                    <>
                        <div className="font-bold mt-8 mb-1">{str(x)}</div>
                        <CriticalCare__RadioButton options={limp_options} horizontal=true />
                    </>
                })
                |> React.array }
                </div>
            </div>

            <div className="my-15 w-full h-1 bg-gray-300"></div>
            <input type_="submit" className="text-white h-10 w-full bg-blue-500 my-10 rounded"/>

        </div>
    </div>
}
