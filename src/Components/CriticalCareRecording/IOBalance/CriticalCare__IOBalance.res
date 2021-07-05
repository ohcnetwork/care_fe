let str = React.string
open CriticalCare__Types


type slider_type = IOBalance__SliderGroup.slider_type

type slider_group_type = {
    sliders: array<slider_type>,
    more_sliders: array<slider_type>
}

type intake_type = {
    infusions: slider_group_type,
    iv_fluid: slider_group_type,
    feed: slider_group_type
}

type state_type = {
    intake: intake_type,
    outturn: slider_group_type
}

let initialState = {
    intake: {
        infusions: {
            sliders: [
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
            more_sliders: [
                {
                    name: "MoreSlider1",
                    checked: true,
                    start: "0",
                    end: "100",
                    interval: "10",
                    step: 1.0,
                    value: "50"
                },
                {
                    name: "MoreSlider2",
                    checked: true,
                    start: "0",
                    end: "100",
                    interval: "10",
                    step: 1.0,
                    value: "50"
                }
            ]
        },
        iv_fluid: {
            sliders: [
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
            more_sliders: []
        },
        feed: {
            sliders: [
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
            ],
            more_sliders: []
        }
    },
    outturn: {
        sliders: [
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
        ],
        more_sliders: []
    }
}


type action =
    | SetFieldValue(string, string, string, string)
    | SetSliderVisibility(string, string, string, bool)
    | AddSlider(string, string, slider_type)


let reducer = (state, action) => {
    switch action {
        | SetFieldValue(section, subsection, name, value) => {
            let getChangedState = (sliders: array<slider_type>) => {
                sliders->Belt.Array.map(slider => {
                    if(slider.name === name) {
                        slider.value = value
                    }
                    slider
                })
            }
            switch section {
                | "intake" => switch subsection {
                        | "infusions" => {
                            let new_sliders = state.intake.infusions.sliders->getChangedState
                            {...state, intake: {...state.intake, infusions: {...state.intake.infusions, sliders: new_sliders}}}
                        }
                        | "iv fluid" => {
                            let new_sliders = state.intake.iv_fluid.sliders->getChangedState
                            {...state, intake: {...state.intake, iv_fluid: {...state.intake.iv_fluid, sliders: new_sliders}}}
                        }
                        | "feed" => {
                            let new_sliders = state.intake.feed.sliders->getChangedState
                            {...state, intake: {...state.intake, feed: {...state.intake.feed, sliders: new_sliders}}}
                        }
                        | _ => state
                    }
                | "outturn" => {
                    let new_sliders = state.outturn.sliders->getChangedState
                    {...state, outturn: {...state.outturn, sliders: new_sliders}}
                }
                | _ => state
            }
        }
        | SetSliderVisibility(section, subsection, name, value) => {
            let getChangedState = (sliders: array<slider_type>) => {
                sliders->Belt.Array.map(slider => {
                    if(slider.name === name) {
                        slider.checked = value
                    }
                    slider
                })
            }
            switch section {
                | "intake" => switch subsection {
                        | "infusions" => {
                            let new_sliders = state.intake.infusions.sliders->getChangedState
                            {...state, intake: {...state.intake, infusions: {...state.intake.infusions, sliders: new_sliders}}}
                        }
                        | "iv fluid" => {
                            let new_sliders = state.intake.iv_fluid.sliders->getChangedState
                            {...state, intake: {...state.intake, iv_fluid: {...state.intake.iv_fluid, sliders: new_sliders}}}
                        }
                        | "feed" => {
                            let new_sliders = state.intake.feed.sliders->getChangedState
                            {...state, intake: {...state.intake, feed: {...state.intake.feed, sliders: new_sliders}}}
                        }
                        | _ => state
                    }
                | "outturn" => {
                    let new_sliders = state.outturn.sliders->getChangedState
                    {...state, outturn: {...state.outturn, sliders: new_sliders}}
                }
                | _ => state
            }
        }
        | AddSlider(section, subsection, field) => {
            let getChangedState = ({sliders, more_sliders}) => {
                let new_more_sliders = more_sliders->Js.Array2.filter(slider => slider.name !== field.name)
                let new_sliders = sliders->Belt.Array.concat([field])

                (new_sliders, new_more_sliders)
            }
            switch section {
                | "intake" => switch subsection {
                        | "infusions" => {
                            let (new_sliders, new_more_sliders) = state.intake.infusions->getChangedState
                            {...state, intake: {...state.intake, infusions: {sliders: new_sliders, more_sliders: new_more_sliders}}}
                        }
                        | "iv fluid" => {
                            let (new_sliders, new_more_sliders) = state.intake.iv_fluid->getChangedState
                            {...state, intake: {...state.intake, iv_fluid: {sliders: new_sliders, more_sliders: new_more_sliders}}}
                        }
                        | "feed" => {
                            let (new_sliders, new_more_sliders) = state.intake.feed->getChangedState
                            {...state, intake: {...state.intake, feed: {sliders: new_sliders, more_sliders: new_more_sliders}}}
                        }
                        | _ => state
                    }
                | "outturn" => {
                    let (new_sliders, new_more_sliders) = state.outturn->getChangedState
                    {...state, outturn: {sliders: new_sliders, more_sliders: new_more_sliders}}
                }
                | _ => state
            }
        }
    }
}

type summary_section_type = {
    values: string,
    total: string
}

type summary_type = {
    intake: summary_section_type,
    outturn: summary_section_type,
    overall: summary_section_type,
}

let initialSummary = {
    intake: {
        values: "",
        total: ""
    },
    outturn: {
        values: "",
        total: ""
    },
    overall: {
        values: "",
        total: ""
    }
}

let toFloat = (svalue) => {
    switch Belt.Float.fromString(svalue) {
        | Some(x) => x
        | None => 0.0
    }
}

let toString = Belt.Float.toString

@react.component
let make = () => {
    let (state, dispatch) = React.useReducer(reducer, initialState)
    let (summary, setSummary) = React.useState(_ => initialSummary)
    
    React.useEffect1(() => {
        let infusions_total = state.intake.infusions.sliders->Belt.Array.reduce(0.0, (acc, slider) => acc +. slider.value->toFloat)
        let iv_fluid_total = state.intake.iv_fluid.sliders->Belt.Array.reduce(0.0, (acc, slider) => acc +. slider.value->toFloat)
        let feed_total = state.intake.feed.sliders->Belt.Array.reduce(0.0, (acc, slider) => acc +. slider.value->toFloat)
        Js.log3(infusions_total, iv_fluid_total, feed_total)

        setSummary(prev => {...prev, intake: {
            values: [infusions_total, iv_fluid_total, feed_total]->Js.Array2.joinWith("+"), 
            total: (infusions_total +. iv_fluid_total +. feed_total)->toString
        }})
        None
    }, [state.intake])

    React.useEffect1(() => {
        let outturn_summary_values = state.outturn.sliders->Belt.Array.map(slider =>slider.value->toFloat)
        let outturn_summary_total = outturn_summary_values->Belt.Array.reduce(0.0, (acc, value) => acc +. value)
        
        setSummary(prev => {...prev, outturn: {
            values: outturn_summary_values->Js.Array2.joinWith("+"), 
            total: outturn_summary_total->toString
        }})
        None
    }, [state.outturn])

    React.useEffect1(() => {
        setSummary(prev => {...prev, overall: {
            values: [prev.intake.total, prev.outturn.total]->Js.Array2.joinWith("-"), 
            total: (prev.intake.total->toFloat -. prev.outturn.total->toFloat)->toString
        }})
        None
    }, [])

    <div>
        <CriticalCare__PageTitle title="I/O Balance Editor" />

        <div id="intake" className="">
            <h3>{str("Intake")}</h3>
            <IOBalance__SliderGroup
                key="intake-infusions" 
                changeFieldValue={(field, value) => SetFieldValue("intake", "infusions", field, value)->dispatch}
                changeVisibility={(field, value) => SetSliderVisibility("intake", "infusions", field, value)->dispatch}
                addSlider={field => AddSlider("intake", "infusions", field)->dispatch}
                title="Infusions" 
                sliders={state.intake.infusions.sliders}
                moreSliders={state.intake.infusions.more_sliders} 
            />
            <IOBalance__SliderGroup
                key="intake-iv_fluid"
                changeFieldValue={(field, value) => SetFieldValue("intake", "iv fluid", field, value)->dispatch}
                changeVisibility={(field, value) => SetSliderVisibility("intake", "iv fluid", field, value)->dispatch}
                addSlider={field => AddSlider("intake", "iv_fluid", field)->dispatch}
                title="IV Fluid" 
                sliders={state.intake.iv_fluid.sliders}
                moreSliders={state.intake.iv_fluid.more_sliders}
            />
            <IOBalance__SliderGroup
                key="intake-feed"
                changeFieldValue={(field, value) => SetFieldValue("intake", "feed", field, value)->dispatch}
                changeVisibility={(field, value) => SetSliderVisibility("intake", "feed", field, value)->dispatch}
                addSlider={field => AddSlider("intake", "feed", field)->dispatch}
                title="Feed" 
                sliders={state.intake.feed.sliders}
                moreSliders={state.intake.feed.more_sliders}
            />

            <IOBalance__Summary
                leftMain="Total"
                rightSub={summary.intake.values}
                rightMain={summary.intake.total}
            />
        </div>

        <div id="outturn" className="">
            <h3>{str("Outturn")}</h3>
            <IOBalance__SliderGroup
                key="outturn"
                changeFieldValue={(field, value) => SetFieldValue("outturn", "", field, value)->dispatch}
                changeVisibility={(field, value) => SetSliderVisibility("outturn", "", field, value)->dispatch}
                addSlider={field => AddSlider("outturn", "", field)->dispatch}
                title="" 
                sliders={state.outturn.sliders}
                moreSliders={state.outturn.more_sliders}
            />

            <IOBalance__Summary
                leftMain="Total"
                rightSub={summary.outturn.values}
                rightMain={summary.outturn.total}
            />
        </div>

        <IOBalance__Summary
            leftMain="I/O Balance"
            rightSub={summary.overall.values}
            rightMain={summary.overall.total}
            noBorder={true}
        />
    </div>
}
