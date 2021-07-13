open CriticalCare__Types
let str = React.string

type unit_type = IOBalance.unit_type
type unit_section_type = IOBalance.unit_section_type
type state_type = IOBalance.t

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
let make = (~initialState: state_type, ~handleDone) => {
    // let (state, send) = React.useReducer(reducer, initialState)
    let (state, setState) = React.useState(_ => initialState)
    let (summary, setSummary) = React.useState(_ => initialSummary)

    React.useEffect1(() => {
        let infusions_total = state.intake.infusions.units->Belt.Array.reduce(0.0, (acc, unit) => acc +. unit.value)
        let iv_fluid_total = state.intake.iv_fluid.units->Belt.Array.reduce(0.0, (acc, unit) => acc +. unit.value)
        let feed_total = state.intake.feed.units->Belt.Array.reduce(0.0, (acc, unit) => acc +. unit.value)
        
        setSummary(prev => {...prev, intake: {
            values: [infusions_total, iv_fluid_total, feed_total]->Js.Array2.joinWith("+"), 
            total: (infusions_total +. iv_fluid_total +. feed_total)->toString
        }})
        None
    }, [state.intake])

    React.useEffect1(() => {
        let outturn_summary_values = state.outturn.units->Belt.Array.map(unit => unit.value)
        let outturn_summary_total = outturn_summary_values->Belt.Array.reduce(0.0, (acc, value) => acc +. value)

        setSummary(prev => {...prev, outturn: {
            values: outturn_summary_values->Js.Array2.joinWith("+"), 
            total: outturn_summary_total->toString
        }})
        None
    }, [state.outturn])

    React.useEffect1(() => {
        Js.log("effect")
        setSummary(prev => {...prev, overall: {
            values: [prev.intake.total, prev.outturn.total]->Js.Array2.joinWith("-"), 
            total: (prev.intake.total->toFloat -. prev.outturn.total->toFloat)->toString
        }})
        None
    }, [state])

    <div>
        <CriticalCare__PageTitle title="I/O Balance Editor" />

        <div id="intake" className="pb-3">
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

            <IOBalance__Summary
                leftMain="Total"
                rightSub={summary.intake.values}
                rightMain={summary.intake.total}
            />
        </div>

        <div id="outturn" className="pt-3">
            <h3>{str("Outturn")}</h3>
            <IOBalance__UnitSection
                name=""
                units={state.outturn.units}
                params={state.outturn.params}
                selectCB={(s) => setState(prev => {...prev, outturn: s})}
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

        <button
            className="flex w-full bg-blue-600 text-white mt-6 p-2 text-lg hover:bg-blue-800 justify-center items-center rounded-md"
            onClick={_ => state->handleDone}>
            {str("Done")}
        </button>
    </div>
}
