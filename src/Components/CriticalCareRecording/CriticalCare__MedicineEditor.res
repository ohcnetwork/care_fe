let str = React.string

@module("./CriticalCare__API")
external updateDailyRound: (string, string, Js.Json.t, _ => unit, _ => unit) => unit =
  "updateDailyRound"

type state = {
  medicines: array<Prescription__Prescription.t>,
  saving: bool,
  dirty: bool,
}

type action =
  | SetMedicines(array<Prescription__Prescription.t>)
  | SetSaving
  | ClearSaving

let reducer = (state, action) => {
  switch action {
  | SetMedicines(medicines) => {
      ...state,
      medicines: medicines,
      dirty: true,
    }
  | SetSaving => {
      ...state,
      saving: true,
    }
  | ClearSaving => {
      ...state,
      saving: false,
    }
  }
}

let makeField = p => {
  let payload = Js.Dict.empty()
  Js.Dict.set(payload, "medicine", Js.Json.string(Prescription__Prescription.medicine(p)))
  Js.Dict.set(payload, "dosage", Js.Json.string(Prescription__Prescription.dosage(p)))
  Js.Dict.set(payload, "days", Js.Json.number(float_of_int(Prescription__Prescription.days(p))))
  payload
}

let makePayload = state => {
  Js.Dict.fromArray([
    ("medication_given", Js.Json.objectArray(Js.Array.map(makeField, state.medicines))),
  ])
}

let successCB = (send, updateCB, data) => {
  send(ClearSaving)
  updateCB(CriticalCare__DailyRound.makeFromJs(data))
}

let errorCB = (send, _error) => {
  send(ClearSaving)
}

let saveData = (id, consultationId, state, send, updateCB) => {
  send(SetSaving)
  updateDailyRound(
    consultationId,
    id,
    Js.Json.object_(makePayload(state)),
    successCB(send, updateCB),
    errorCB(send),
  )
}

let initialState = medicines => {
  {
    medicines: medicines,
    saving: false,
    dirty: false,
  }
}

let getFieldValue = event => {
  ReactEvent.Form.target(event)["value"]
}

@react.component
let make = (~medicines, ~updateCB, ~id, ~consultationId) => {
  let (state, send) = React.useReducer(reducer, initialState(medicines))

  <div>
    <CriticalCare__PageTitle title="Medicines" />
    <div className="w-full">
      <Prescription__Builder
        prescriptions={state.medicines} selectCB={medicines => send(SetMedicines(medicines))}
      />
    </div>
    <button
      disabled={state.saving || !state.dirty}
      className="btn btn-primary btn-large w-full"
      onClick={_ => saveData(id, consultationId, state, send, updateCB)}>
      {str("Done")}
    </button>
  </div>
}
