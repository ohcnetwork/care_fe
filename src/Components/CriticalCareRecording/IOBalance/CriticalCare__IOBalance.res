let str = React.string
open CriticalCare__Types


type slider_type = IOBalance__SliderGroup.slider_type

type intake_type = {
    infusions: array<slider_type>,
    iv_fluid: array<slider_type>,
    feed: array<slider_type>
}

type state_type = {
    intake: intake_type,
    outturn: array<slider_type>
}

let initialState = {
    intake: {
        infusions: [
            {
                name: "Adrenalin",
                checked: true,
                start: "0",
                end: "100",
                interval: "10",
                step: 1.0,
                value: "50"
            },
            {
                name: "Nor-Adrenalin",
                checked: false,
                start: "0",
                end: "100",
                interval: "10",
                step: 1.0,
                value: "50"
            },
            {
                name: "Vasopressin",
                checked: false,
                start: "0",
                end: "100",
                interval: "10",
                step: 1.0,
                value: "50"
            },
            {
                name: "Dopamine",
                checked: false,
                start: "0",
                end: "100",
                interval: "10",
                step: 1.0,
                value: "50"
            },
            {
                name: "Dobutamine",
                checked: false,
                start: "0",
                end: "100",
                interval: "10",
                step: 1.0,
                value: "50"
            }
        ],
        iv_fluid: [
            {
                name: "RL",
                checked: false,
                start: "0",
                end: "100",
                interval: "10",
                step: 1.0,
                value: "50"
            },
            {
                name: "NL",
                checked: false,
                start: "0",
                end: "100",
                interval: "10",
                step: 1.0,
                value: "50"
            },
            {
                name: "DNS",
                checked: false,
                start: "0",
                end: "100",
                interval: "10",
                step: 1.0,
                value: "50"
            }
        ],
        feed: [
            {
                name: "Ryles Tube",
                checked: false,
                start: "0",
                end: "100",
                interval: "10",
                step: 1.0,
                value: "50"
            },
            {
                name: "Normal Feed",
                checked: false,
                start: "0",
                end: "100",
                interval: "10",
                step: 1.0,
                value: "50"
            }
        ]
    },
    outturn: [
        {
            name: "Urine",
            checked: true,
            start: "0",
            end: "100",
            interval: "10",
            step: 1.0,
            value: "50"
        },
        {
            name: "Rules Tube Aspiration",
            checked: true,
            start: "0",
            end: "100",
            interval: "10",
            step: 1.0,
            value: "50"
        },
        {
            name: "ICD",
            checked: true,
            start: "0",
            end: "100",
            interval: "10",
            step: 1.0,
            value: "50"
        },
    ]
}


type action =
    | SetFieldValue(string, string, string, string)


let reducer = (state, action) => {
    switch action {
        | SetFieldValue(section, subsection, name, value) => {
            let sliders = switch section {
                | "intake" => switch subsection {
                        | "infusions" => state.intake.infusions
                        | "iv fluid" => state.intake.iv_fluid
                        | "feed" => state.intake.feed
                    }
                | "outturn" => state.outturn
            }

            let s = sliders->Belt.Array.map(slider => {
                if(slider.name === name) {
                    slider.value = value
                }
                slider
            })

            {...state, intake: { ...state.intake, infusions: s} }
        }
    }
}

@react.component
let make = () => {
    let (state, dispatch) = React.useReducer(reducer, initialState)
    <div>
        <CriticalCare__PageTitle title="I/O Balance Editor" />

        <div id="intake" className="">
            <h3>{str("Intake")}</h3>
            <IOBalance__SliderGroup 
                changeFieldValue={(field, value) => SetFieldValue("intake", "infusions", field, value)->dispatch}
                title="Infusions" 
                sliders={initialState.intake.infusions} 
            />
            <IOBalance__SliderGroup
                changeFieldValue={(field, value) => SetFieldValue("intake", "iv fluid", field, value)->dispatch}
                title="IV Fluid" 
                sliders={initialState.intake.iv_fluid} 
            />
            <IOBalance__SliderGroup
                changeFieldValue={(field, value) => SetFieldValue("intake", "feed", field, value)->dispatch}
                title="Feed" 
                sliders={initialState.intake.feed} 
            />
        </div>

        <div id="outturn" className="">
            <h3>{str("Outturn")}</h3>
            <IOBalance__SliderGroup
                changeFieldValue={(field, value) => SetFieldValue("outturn", "", field, value)->dispatch}
                title="" 
                sliders={initialState.outturn} 
            />
        </div>
    </div>
}
