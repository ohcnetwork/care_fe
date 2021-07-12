let str = React.string
open CriticalCare__Types

type slider_type = IOBalance.slider_type
// type state_type = IOBalance.t

type unit_type = IOBalance__UnitSection.unit_type
type unit_section_type = IOBalance__UnitSection.unit_section_type

type intake_type = {
    infusions: unit_section_type,
    iv_fluid: unit_section_type,
    feed: unit_section_type
}

type state_type = {
    intake: intake_type,
    outturn: unit_section_type
}

let initialStat = {
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



@react.component
let make = (~initialState, ~handleDone) => {
    // let (state, send) = React.useReducer(reducer, initialState)
    let (state, setState) = React.useState(_ => initialStat)
    Js.log2(state, "hello")
    Js.log("worthy")

    <div>
        <CriticalCare__PageTitle title="I/O Balance Editor" />

        <div id="intake" className="">
            <h3>{str("Intake")}</h3>
            
            <IOBalance__UnitSection
                name="Infusions"
                units={state.intake.infusions.units}
                params={state.intake.infusions.params}
                selectCB={(s) => setState(prev => {...prev, intake: {...prev.intake, infusions: s}})}
            />
            <IOBalance__UnitSection
                name="IV Fluid"
                units={state.intake.iv_fluid.units}
                params={state.intake.iv_fluid.params}
                selectCB={(s) => setState(prev => {...prev, intake: {...prev.intake, iv_fluid: s}})}
            />
            <IOBalance__UnitSection
                name="Feed"
                units={state.intake.feed.units}
                params={state.intake.feed.params}
                selectCB={(s) => setState(prev => {...prev, intake: {...prev.intake, feed: s}})}
            />
        </div>

        <div id="outturn" className="">
            <h3>{str("Outturn")}</h3>
            <IOBalance__UnitSection
                name=""
                units={state.outturn.units}
                params={state.outturn.params}
                selectCB={(s) => setState(prev => {...prev, outturn: s})}
            />
        </div>   
    </div>
}
