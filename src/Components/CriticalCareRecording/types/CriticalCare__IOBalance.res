type slider_type = {
    name: string,
    mutable checked: bool,
    start: string,
    end: string,
    interval: string,
    step: float,
    mutable value: string
} 

type slider_group_type = {
    sliders: array<slider_type>,
    more_sliders: array<slider_type>
}

type intake_type = {
    infusions: slider_group_type,
    iv_fluid: slider_group_type,
    feed: slider_group_type
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

type t = {
    intake: intake_type,
    outturn: slider_group_type,
    summary: summary_type
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
    },
    summary: {
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
}

let toFloat = (svalue) => {
    switch Belt.Float.fromString(svalue) {
        | Some(x) => x
        | None => 0.0
    }
}

let toString = Belt.Float.toString

type action =
    | SetFieldValue(string, string, string, string)
    | SetSliderVisibility(string, string, string, bool)
    | AddSlider(string, string, slider_type)
    | EvaluateSummary(string)

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
        | EvaluateSummary(section) => {
            switch section {
                | "intake" => {
                    let infusions_total = state.intake.infusions.sliders->Belt.Array.reduce(0.0, (acc, slider) => acc +. slider.value->toFloat)
                    let iv_fluid_total = state.intake.iv_fluid.sliders->Belt.Array.reduce(0.0, (acc, slider) => acc +. slider.value->toFloat)
                    let feed_total = state.intake.feed.sliders->Belt.Array.reduce(0.0, (acc, slider) => acc +. slider.value->toFloat)
                    
                    let values = [infusions_total, iv_fluid_total, feed_total]->Js.Array2.joinWith("+")
                    let total =  (infusions_total +. iv_fluid_total +. feed_total)->toString
                    {
                        ...state, 
                        summary: {
                            ...state.summary, 
                            intake:{
                                values: values, 
                                total: total
                            },
                            overall: {
                                values: [total, state.summary.outturn.total]->Js.Array2.joinWith("-"), 
                                total: (total->toFloat -. state.summary.outturn.total->toFloat)->toString
                            }
                        }
                    }
                }
                | "outturn" => {
                    let outturn_summary_values = state.outturn.sliders->Belt.Array.map(slider =>slider.value->toFloat)
                    let outturn_summary_total = outturn_summary_values->Belt.Array.reduce(0.0, (acc, value) => acc +. value)
                    
                    let values = outturn_summary_values->Js.Array2.joinWith("+")
                    let total = outturn_summary_total->toString
                    {
                        ...state, 
                        summary: {
                            ...state.summary, 
                            outturn:{
                                values: values, 
                                total: total
                            },
                            overall: {
                                values: [state.summary.intake.total, total]->Js.Array2.joinWith("-"), 
                                total: (state.summary.intake.total->toFloat -. total->toFloat)->toString
                            }
                        }
                    }
                }
            }
        }
    }
}