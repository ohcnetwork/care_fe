@genType
type t = {
  medicine: string,
  dosage: string,
  days: int,
  notes: string,
}

let medicine = t => t.medicine
let dosage = t => t.dosage
let days = t => t.days
let notes = t => t.notes

let make = (medicine, dosage, days, notes) => {
  medicine: medicine,
  dosage: dosage,
  days: days,
  notes: notes,
}

let empty = () => {medicine: "", dosage: "", days: 0, notes: ""}

let updateMedicine = (medicine, t) => {...t, medicine: medicine}
let updateDosage = (dosage, t) => {...t, dosage: dosage}
let updateDays = (days, t) => {...t, days: days}
let updateNotes = (notes, t) => {...t, notes: notes}

let decode = json => {
  open Json.Decode
  {
    medicine: json |> field("medicine", string),
    dosage: json |> field("dosage", string),
    days: json |> field("days", int),
    notes: json |> field("notes", string),
  }
}

let encode = t => {
  open Json.Encode
  object_(list{
    ("medicine", t.medicine |> string),
    ("dosage", t.dosage |> string),
    ("days", t.days |> int),
    ("notes", t.notes |> string),
  })
}

let encodeArray = prescriptions =>
  prescriptions |> {
    open Json.Encode
    array(encode)
  }

let makeFromJs = json => {
  Js.Array.isArray(json)
    ? Js.Array.map(p => make(p["medicine"], p["dosage"], p["days"], p["notes"]), json)
    : []
}
