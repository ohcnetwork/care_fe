@module("./CriticalCare__API")
external loadDailyRound: (string, string, _ => unit, _ => unit) => unit = "loadDailyRound"
open CriticalCare__Types
let str = React.string

type state = {
  loading: bool,
  data: option<DailyRound.t>,
}

let successCB = (setState, data) => {
  setState(state => {loading: false, data: Some(DailyRound.makeFromJs(data))})
}

let errorCB = (setState, error) => {
  setState(state => {data: None, loading: false})
}

let loadData = (setState, consultationId, id) => {
  loadDailyRound(consultationId, id, successCB(setState), errorCB(setState))
}

@react.component
export make = (~id, ~facilityId, ~patientId, ~consultationId) => {
  let (state, setState) = React.useState(() => {loading: true, data: None})
  React.useEffect1(() => {
    loadData(setState, consultationId, id)
    None
  }, [id])

  Js.log(state.loading)
  <div>
    {state.loading
      ? <div> {str("Loading...")} </div>
      : switch state.data {
        | Some(data) => {
            Js.log(data)
            <CriticalCare__Recording id facilityId patientId consultationId />
          }

        | None => <div> {str("Unable to laod consultation update")} </div>
        }}
  </div>
}
