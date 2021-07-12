@module("./CriticalCare__API")
external loadDailyRound: (string, string, _ => unit, _ => unit) => unit = "loadDailyRound"
open CriticalCare__Types
let str = React.string

type state = {
  loading: bool,
  dailyRound: option<DailyRound.t>,
}

let successCB = (setState, dailyRound) => {
  setState(state => {loading: false, dailyRound: Some(DailyRound.makeFromJs(dailyRound))})
}

let errorCB = (setState, error) => {
  setState(state => {dailyRound: None, loading: false})
}

let loadData = (setState, consultationId, id) => {
  loadDailyRound(consultationId, id, successCB(setState), errorCB(setState))
}

@react.component
export make = (~id, ~facilityId, ~patientId, ~consultationId) => {
  let (state, setState) = React.useState(() => {loading: true, dailyRound: None})
  React.useEffect1(() => {
    loadData(setState, consultationId, id)
    None
  }, [id])

  Js.log(state.loading)
  <div>
    {state.loading
      ? <div> {str("Loading...")} </div>
      : switch state.dailyRound {
        | Some(dailyRound) => {
            Js.log(dailyRound)
            <CriticalCare__Recording id facilityId patientId consultationId dailyRound />
          }

        | None => <div> {str("Unable to laod consultation update")} </div>
        }}
  </div>
}
