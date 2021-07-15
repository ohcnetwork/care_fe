open CriticalCare__Types
let str = React.string

@module("../CriticalCare__API")
external updateDailyRound: (string, string, Js.Json.t, _ => unit, _ => unit) => unit =
  "updateDailyRound"

type unit_type = IOBalance__UnitSection.unit_type
type unit_section_type = IOBalance__UnitSection.unit_section_type

type intake_type = {
    infusions: unit_section_type,
    iv_fluid: unit_section_type,
    feed: unit_section_type
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

type state_type = {
    intake: intake_type,
    outturn: unit_section_type,
    summary: summary_type,
    saving: bool
}

let toFloat = (svalue) => {
    switch Belt.Float.fromString(svalue) {
        | Some(x) => x
        | None => 0.0
    }
}
let toString = Belt.Float.toString

type action = 
    | SetInfusions(unit_section_type)
    | SetIVFluid(unit_section_type)
    | SetFeed(unit_section_type)
    | SetOutturn(unit_section_type)
    | SetIntakeSummary(string, string)
    | SetOutturnSummary(string, string)
    | SetOverallSummary
    | SetSaving(bool)

let reducer = (state, action) => {
    switch action {
        | SetInfusions(infusions) => {...state, intake: {...state.intake, infusions: infusions}}
        | SetIVFluid(iv_fluid) => {...state, intake: {...state.intake, iv_fluid: iv_fluid}}
        | SetFeed(feed) => {...state, intake: {...state.intake, feed: feed}}
        | SetOutturn(outturn) => {...state, outturn: outturn}
        | SetIntakeSummary(values, total) => 
            {...state, summary: { ...state.summary, intake: { values: values, total: total}}}
        | SetOutturnSummary(values, total) => 
            {...state, summary: { ...state.summary, outturn: { values: values, total: total}}}
        | SetOverallSummary => {
            let values = [state.summary.intake.total, state.summary.outturn.total]->Js.Array2.joinWith("-")
            let total = (state.summary.intake.total->toFloat -. state.summary.outturn.total->toFloat)->toString
            {...state, summary: { ...state.summary, overall: { values: values, total: total}}}
        }
        | SetSaving(saving) => {...state, saving: saving}
    }
}


let initialState = (iob) => {
    {
        intake: {
            infusions: {
                units: iob->IOBalance.infusions,
                params: ["Infusion1", "Infusion2", "Infusion3"]
            },
            iv_fluid: {
                units: iob->IOBalance.iv_fluid,
                params: ["iv_fluid1", "iv_fluid2", "iv_fluid3"]
            },
            feed: {
                units: iob->IOBalance.feed,
                params: ["feed1", "feed2", "feed3"]
            },
        },
        outturn: {
            units: iob->IOBalance.output,
            params: ["outturn1", "outturn2", "outturn3"]
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
        },
        saving: true
    }
}

let makeUnitsPayload = (array: array<unit_type>) => {
    
    array->Belt.Array.map((unit) => {
        let unit_payload = Js.Dict.empty()
        Js.Dict.set(unit_payload, unit.field, Js.Json.number(unit.value))
        unit_payload
    })
}

let makePayload = state => {
    let payload = Js.Dict.empty()
    Js.Dict.set(payload, "infusions", Js.Json.objectArray(state.intake.infusions.units->makeUnitsPayload))
    Js.Dict.set(payload, "iv_fluid", Js.Json.objectArray(state.intake.iv_fluid.units->makeUnitsPayload))
    Js.Dict.set(payload, "feed", Js.Json.objectArray(state.intake.feed.units->makeUnitsPayload))
    Js.Dict.set(payload, "output", Js.Json.objectArray(state.outturn.units->makeUnitsPayload))
    DictUtils.setOptionalString("total_intake_calculated", state.summary.intake.total, payload)
    DictUtils.setOptionalString("total_output_calculated", state.summary.outturn.total, payload)

    Js.log(payload)
    payload
}
let successCB = (send, updateCB, data) => {
    updateCB(CriticalCare__DailyRound.makeFromJs(data))
    SetSaving(false)->send
}

let errorCB = (send, _error) => {
    Js.log(_error)
    SetSaving(false)->send
}

let saveData = (id, consultationId, state, send, updateCB) => {
    SetSaving(true)->send
    updateDailyRound(
        consultationId,
        id,
        Js.Json.object_(makePayload(state)),
        successCB(send, updateCB),
        errorCB(send),
    )
}

@react.component
let make = (~ioBalance, ~updateCB, ~id, ~consultationId) => {
    let (state, send) = React.useReducer(reducer, initialState(ioBalance))

    React.useEffect1(() => {
        let infusions_total = state.intake.infusions.units->Belt.Array.reduce(0.0, (acc, unit) => acc +. unit.value)
        let iv_fluid_total = state.intake.iv_fluid.units->Belt.Array.reduce(0.0, (acc, unit) => acc +. unit.value)
        let feed_total = state.intake.feed.units->Belt.Array.reduce(0.0, (acc, unit) => acc +. unit.value)
        
        let values = [infusions_total, iv_fluid_total, feed_total]->Js.Array2.joinWith("+")
        let total = (infusions_total +. iv_fluid_total +. feed_total)->toString
        SetIntakeSummary(values, total)->send
        SetOverallSummary->send
        None
    }, [state.intake])

    React.useEffect1(() => {
        let outturn_summary_values = state.outturn.units->Belt.Array.map(unit => unit.value)
        let outturn_summary_total = outturn_summary_values->Belt.Array.reduce(0.0, (acc, value) => acc +. value)

        let values = outturn_summary_values->Js.Array2.joinWith("+")
        let total = outturn_summary_total->toString
        SetOutturnSummary(values, total)->send
        SetOverallSummary->send
        None
    }, [state.outturn])

    <div>
        <CriticalCare__PageTitle title="I/O Balance Editor" />

        <div id="intake" className="pb-3">
            <h3>{str("Intake")}</h3>
            
            <IOBalance__UnitSection
                name="Infusions"
                units={state.intake.infusions.units}
                params={state.intake.infusions.params}
                selectCB={(infusions) => SetInfusions(infusions)->send}
            />
            <IOBalance__UnitSection
                name="IV Fluid"
                units={state.intake.iv_fluid.units}
                params={state.intake.iv_fluid.params}
                selectCB={(iv_fluid) => SetIVFluid(iv_fluid)->send}
            />
            <IOBalance__UnitSection
                name="Feed"
                units={state.intake.feed.units}
                params={state.intake.feed.params}
                selectCB={(feed) => SetFeed(feed)->send}
            />

            <IOBalance__Summary
                leftMain="Total"
                rightSub={state.summary.intake.values}
                rightMain={state.summary.intake.total}
            />
        </div>

        <div id="outturn" className="pt-3">
            <h3>{str("Outturn")}</h3>
            <IOBalance__UnitSection
                name=""
                units={state.outturn.units}
                params={state.outturn.params}
                selectCB={(outturn) => SetOutturn(outturn)->send}
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

        <button
            className="flex w-full bg-primary-600 text-white p-2 text-lg hover:bg-primary-800 justify-center items-center rounded-md"
            onClick={_ => saveData(id, consultationId, state, send, updateCB)}>
            {str("Update Details")}
        </button>
    </div>
}
