let str = React.string
open CriticalCare__Types

type slider_type = IOBalance.slider_type
type state_type = IOBalance.t


@react.component
let make = (~initialState, ~handleDone) => {
    let (state, dispatch) = React.useReducer(IOBalance.reducer, initialState: state_type)
    
    React.useEffect1(() => {
        Js.log("intake useeffect")
        IOBalance.EvaluateSummary("intake")->dispatch
        None
    }, [state.intake])

    React.useEffect1(() => {
        IOBalance.EvaluateSummary("outturn")->dispatch
        None
    }, [state.outturn])


    <div>
        <CriticalCare__PageTitle title="I/O Balance Editor" />

        <div id="intake" className="">
            <h3>{str("Intake")}</h3>
            <IOBalance__SliderGroup
                key="intake-infusions" 
                changeFieldValue={(field, value) => IOBalance.SetFieldValue("intake", "infusions", field, value)->dispatch}
                changeVisibility={(field, value) => IOBalance.SetSliderVisibility("intake", "infusions", field, value)->dispatch}
                addSlider={field => IOBalance.AddSlider("intake", "infusions", field)->dispatch}
                title="Infusions" 
                sliders={state.intake.infusions.sliders}
                moreSliders={state.intake.infusions.more_sliders} 
            />
            <IOBalance__SliderGroup
                key="intake-iv_fluid"
                changeFieldValue={(field, value) => IOBalance.SetFieldValue("intake", "iv fluid", field, value)->dispatch}
                changeVisibility={(field, value) => IOBalance.SetSliderVisibility("intake", "iv fluid", field, value)->dispatch}
                addSlider={field => IOBalance.AddSlider("intake", "iv_fluid", field)->dispatch}
                title="IV Fluid" 
                sliders={state.intake.iv_fluid.sliders}
                moreSliders={state.intake.iv_fluid.more_sliders}
            />
            <IOBalance__SliderGroup
                key="intake-feed"
                changeFieldValue={(field, value) => IOBalance.SetFieldValue("intake", "feed", field, value)->dispatch}
                changeVisibility={(field, value) => IOBalance.SetSliderVisibility("intake", "feed", field, value)->dispatch}
                addSlider={field => IOBalance.AddSlider("intake", "feed", field)->dispatch}
                title="Feed" 
                sliders={state.intake.feed.sliders}
                moreSliders={state.intake.feed.more_sliders}
            />

            <IOBalance__Summary
                leftMain="Total"
                rightSub={state.summary.intake.values}
                rightMain={state.summary.intake.total}
            />
        </div>

        <div id="outturn" className="">
            <h3>{str("Outturn")}</h3>
            <IOBalance__SliderGroup
                key="outturn"
                changeFieldValue={(field, value) => IOBalance.SetFieldValue("outturn", "", field, value)->dispatch}
                changeVisibility={(field, value) => IOBalance.SetSliderVisibility("outturn", "", field, value)->dispatch}
                addSlider={field => IOBalance.AddSlider("outturn", "", field)->dispatch}
                title="" 
                sliders={state.outturn.sliders}
                moreSliders={state.outturn.more_sliders}
            />

            <IOBalance__Summary
                leftMain="Total"
                rightSub={state.summary.outturn.values}
                rightMain={state.summary.outturn.total}
            />
        </div>

        <IOBalance__Summary
            leftMain="I/O Balance"
            rightSub={state.summary.overall.values}
            rightMain={state.summary.overall.total}
            noBorder={true}
        />
    </div>
}
