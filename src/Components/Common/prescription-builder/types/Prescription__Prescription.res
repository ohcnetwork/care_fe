@genType
type t = {
  medicine: string,
  amount: int,
  unit: string,
  dosage: string,
  days: int,
  notes: string,
}

let medicine = t => t.medicine
let amount = t => t.amount
let unit = t => t.unit
let dosage = t => t.dosage
let days = t => t.days
let notes = t => t.notes

let make = (medicine, amount, unit, dosage, days, notes) => {
  medicine,
  amount,
  unit,
  dosage,
  days,
  notes,
}

let empty = () => {medicine: "", amount: 0, unit: "", dosage: "", days: 0, notes: ""}

let updateMedicine = (medicine, t) => {...t, medicine}
let updateUnitDosage = (amount, t) => {...t, amount}
let updateUnit = (unit, t) => {...t, unit}
let updateDosage = (dosage, t) => {...t, dosage}
let updateDays = (days, t) => {...t, days}
let updateNotes = (notes, t) => {...t, notes}

let decode = json => {
  open Json.Decode
  {
    medicine: json |> field("medicine", string),
    amount: json |> field("amount", int),
    unit: json |> field("unit", string),
    dosage: json |> field("dosage", string),
    days: json |> field("days", int),
    notes: json |> field("notes", string),
  }
}

let encode = t => {
  open Json.Encode
  object_(list{
    ("medicine", t.medicine |> string),
    ("amount", t.amount |> int),
    ("unit", t.medicine |> string),
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
    ? Js.Array.map(
        p => make(p["medicine"], p["amount"], p["unit"], p["dosage"], p["days"], p["notes"]),
        json,
      )
    : []
}
