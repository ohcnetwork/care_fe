type unit_type = IOBalance__UnitSection.unit_type
type unit_section_type = IOBalance__UnitSection.unit_section_type

type intake_type = {
    infusions: unit_section_type,
    iv_fluid: unit_section_type,
    feed: unit_section_type
}

type t = {
    intake: intake_type,
    outturn: unit_section_type
}

let initialState = {
    intake: {
        infusions: {
            units: [],
            params: ["Infusion1", "Infusion2", "Infusion3"]
        },
        iv_fluid: {
            units: [],
            params: ["iv_fluid1", "iv_fluid2", "iv_fluid3"]
        },
        feed: {
            units: [],
            params: ["feed1", "feed2", "feed3"]
        },
    },
    outturn: {
        units: [],
        params: ["outturn1", "outturn2", "outturn3"]
    },
}


// let toFloat = (svalue) => {
//     switch Belt.Float.fromString(svalue) {
//         | Some(x) => x
//         | None => 0.0
//     }
// }

// let toString = Belt.Float.toString

// type action =
//     | SetFieldValue(string, string, string, string)
//     | SetSliderVisibility(string, string, string, bool)
//     | AddSlider(string, string, slider_type)
//     | EvaluateSummary(string)

// let reducer = (state, action) => {
//     switch action {
//         | SetFieldValue(section, subsection, name, value) => {
//             let getChangedState = (sliders: array<slider_type>) => {
//                 sliders->Belt.Array.map(slider => {
//                     if(slider.name === name) {
//                         slider.value = value
//                     }
//                     slider
//                 })
//             }
//             switch section {
//                 | "intake" => switch subsection {
//                         | "infusions" => {
//                             let new_sliders = state.intake.infusions.sliders->getChangedState
//                             {...state, intake: {...state.intake, infusions: {...state.intake.infusions, sliders: new_sliders}}}
//                         }
//                         | "iv fluid" => {
//                             let new_sliders = state.intake.iv_fluid.sliders->getChangedState
//                             {...state, intake: {...state.intake, iv_fluid: {...state.intake.iv_fluid, sliders: new_sliders}}}
//                         }
//                         | "feed" => {
//                             let new_sliders = state.intake.feed.sliders->getChangedState
//                             {...state, intake: {...state.intake, feed: {...state.intake.feed, sliders: new_sliders}}}
//                         }
//                         | _ => state
//                     }
//                 | "outturn" => {
//                     let new_sliders = state.outturn.sliders->getChangedState
//                     {...state, outturn: {...state.outturn, sliders: new_sliders}}
//                 }
//                 | _ => state
//             }
//         }
//         | SetSliderVisibility(section, subsection, name, value) => {
//             let getChangedState = (sliders: array<slider_type>) => {
//                 sliders->Belt.Array.map(slider => {
//                     if(slider.name === name) {
//                         slider.checked = value
//                     }
//                     slider
//                 })
//             }
//             switch section {
//                 | "intake" => switch subsection {
//                         | "infusions" => {
//                             let new_sliders = state.intake.infusions.sliders->getChangedState
//                             {...state, intake: {...state.intake, infusions: {...state.intake.infusions, sliders: new_sliders}}}
//                         }
//                         | "iv fluid" => {
//                             let new_sliders = state.intake.iv_fluid.sliders->getChangedState
//                             {...state, intake: {...state.intake, iv_fluid: {...state.intake.iv_fluid, sliders: new_sliders}}}
//                         }
//                         | "feed" => {
//                             let new_sliders = state.intake.feed.sliders->getChangedState
//                             {...state, intake: {...state.intake, feed: {...state.intake.feed, sliders: new_sliders}}}
//                         }
//                         | _ => state
//                     }
//                 | "outturn" => {
//                     let new_sliders = state.outturn.sliders->getChangedState
//                     {...state, outturn: {...state.outturn, sliders: new_sliders}}
//                 }
//                 | _ => state
//             }
//         }
//         | AddSlider(section, subsection, field) => {
//             let getChangedState = ({sliders, more_sliders}) => {
//                 let new_more_sliders = more_sliders->Js.Array2.filter(slider => slider.name !== field.name)
//                 let new_sliders = sliders->Belt.Array.concat([field])

//                 (new_sliders, new_more_sliders)
//             }
//             switch section {
//                 | "intake" => switch subsection {
//                         | "infusions" => {
//                             let (new_sliders, new_more_sliders) = state.intake.infusions->getChangedState
//                             {...state, intake: {...state.intake, infusions: {sliders: new_sliders, more_sliders: new_more_sliders}}}
//                         }
//                         | "iv fluid" => {
//                             let (new_sliders, new_more_sliders) = state.intake.iv_fluid->getChangedState
//                             {...state, intake: {...state.intake, iv_fluid: {sliders: new_sliders, more_sliders: new_more_sliders}}}
//                         }
//                         | "feed" => {
//                             let (new_sliders, new_more_sliders) = state.intake.feed->getChangedState
//                             {...state, intake: {...state.intake, feed: {sliders: new_sliders, more_sliders: new_more_sliders}}}
//                         }
//                         | _ => state
//                     }
//                 | "outturn" => {
//                     let (new_sliders, new_more_sliders) = state.outturn->getChangedState
//                     {...state, outturn: {sliders: new_sliders, more_sliders: new_more_sliders}}
//                 }
//                 | _ => state
//             }
//         }
//         | EvaluateSummary(section) => {
//             switch section {
//                 | "intake" => {
//                     let infusions_total = state.intake.infusions.sliders->Belt.Array.reduce(0.0, (acc, slider) => acc +. slider.value->toFloat)
//                     let iv_fluid_total = state.intake.iv_fluid.sliders->Belt.Array.reduce(0.0, (acc, slider) => acc +. slider.value->toFloat)
//                     let feed_total = state.intake.feed.sliders->Belt.Array.reduce(0.0, (acc, slider) => acc +. slider.value->toFloat)
                    
//                     let values = [infusions_total, iv_fluid_total, feed_total]->Js.Array2.joinWith("+")
//                     let total =  (infusions_total +. iv_fluid_total +. feed_total)->toString
//                     {
//                         ...state, 
//                         summary: {
//                             ...state.summary, 
//                             intake:{
//                                 values: values, 
//                                 total: total
//                             },
//                             overall: {
//                                 values: [total, state.summary.outturn.total]->Js.Array2.joinWith("-"), 
//                                 total: (total->toFloat -. state.summary.outturn.total->toFloat)->toString
//                             }
//                         }
//                     }
//                 }
//                 | "outturn" => {
//                     let outturn_summary_values = state.outturn.sliders->Belt.Array.map(slider =>slider.value->toFloat)
//                     let outturn_summary_total = outturn_summary_values->Belt.Array.reduce(0.0, (acc, value) => acc +. value)
                    
//                     let values = outturn_summary_values->Js.Array2.joinWith("+")
//                     let total = outturn_summary_total->toString
//                     {
//                         ...state, 
//                         summary: {
//                             ...state.summary, 
//                             outturn:{
//                                 values: values, 
//                                 total: total
//                             },
//                             overall: {
//                                 values: [state.summary.intake.total, total]->Js.Array2.joinWith("-"), 
//                                 total: (state.summary.intake.total->toFloat -. total->toFloat)->toString
//                             }
//                         }
//                     }
//                 }
//             }
//         }
//     }
// }