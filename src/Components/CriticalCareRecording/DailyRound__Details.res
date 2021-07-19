@module("./CriticalCare__API")
external loadDailyRound: (string, string, _ => unit, _ => unit) => unit = "loadDailyRound"

open CriticalCare__Types
let str = React.string

type state = {
  loading: bool,
  dailyRound: option<DailyRound.t>,
}

let successCB = (setState, dailyRound) => {
  setState(_state => {loading: false, dailyRound: Some(DailyRound.makeFromJs(dailyRound))})
}

let errorCB = (setState, _error) => {
  setState(_state => {dailyRound: None, loading: false})
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

  <div>
    {state.loading
      ? <CriticalCare__Loader />
      : switch state.dailyRound {
        | Some(dailyRound) => <DailyRound__Root dailyRound facilityId patientId consultationId />
        | None => {
            Notifications.error({msg: "Unable to load data"})
            <> </>
          }
        }}
  </div>
}
