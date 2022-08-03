let str = React.string

@module("./CriticalCare__API")
external updateDailyRound: (string, string, Js.Json.t, _ => unit, _ => unit) => unit =
  "updateDailyRound"

type prescriptionType = {
  medicine: string,
  route: string,
  dosage: string, // is now frequency
  dosage_new: string,
  days: int,
  notes: string,
}

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
  Js.Dict.set(payload, "route", Js.Json.string(Prescription__Prescription.route(p)))
  Js.Dict.set(payload, "notes", Js.Json.string(Prescription__Prescription.notes(p)))
  Js.Dict.set(payload, "dosage_new", Js.Json.string(Prescription__Prescription.dosage_new(p)))
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

let validateMedicines = (prescriptions: array<Prescription__Prescription.t>) => {
  let error = prescriptions |> Js.Array.find(prescription => {
    let medicine = prescription |> Prescription__Prescription.medicine
    let dosage = prescription |> Prescription__Prescription.dosage
    let dosage_new = prescription |> Prescription__Prescription.dosage_new |> Js.String.split(" ")
    let dosage_invalid = switch dosage_new |> Js.Array.length == 2 {
    | true => {
        let dosage_value =
          dosage_new->Js.Array.unsafe_get(0) |> Js.String.replaceByRe(%re("/\D/g"), "")
        let dosage_unit = dosage_new->Js.Array.unsafe_get(1)
        dosage_value == "" || dosage_unit == ""
      }
    | false => true
    }
    let invalid =
      medicine == "" || medicine == " " || dosage == "" || dosage == " " || dosage_invalid
    switch invalid {
    | true => {
        Notifications.error({
          msg: "Medicine, Dosage and Frequency are mandatory for Prescriptions.",
        })
        true
      }
    | false => false
    }
  })
  switch error {
  | None => true
  | Some(_) => false
  }
}

let saveData = (id, consultationId, state, send, updateCB) => {
  switch state.medicines |> validateMedicines {
  | true => {
      send(SetSaving)
      updateDailyRound(
        consultationId,
        id,
        Js.Json.object_(makePayload(state)),
        successCB(send, updateCB),
        errorCB(send),
      )
    }
  | false => Js_console.log("Validation failed")
  }
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
    <div className="w-full mb-4">
      <PrescriptionBuilderTS
        prescriptions={state.medicines}
        setPrescriptions={medicines => send(SetMedicines(medicines))}
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
