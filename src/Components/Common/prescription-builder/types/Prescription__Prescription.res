@genType
type t = {
  medicine: string,
  route: string,
  dosage: string,
  dosage_new: string,
  days: int,
  notes: string,
}

let medicine = t => t.medicine
let route = t => t.route
let dosage = t => t.dosage
let dosage_new = t => t.dosage_new
let days = t => t.days
let notes = t => t.notes

let make = (medicine, route, dosage, dosage_new, days, notes) => {
  medicine: medicine,
  route: route,
  dosage: dosage,
  dosage_new: dosage_new,
  days: days,
  notes: notes,
}

let empty = () => {medicine: "", route: "", dosage: "", dosage_new: "0 mg", days: 0, notes: ""}

let updateMedicine = (medicine, t) => {...t, medicine: medicine}
let updateRoute = (route, t) => {...t, route: route}
let updateDosage = (dosage, t) => {...t, dosage: dosage}
let updateDosageNew = (dosage, t) => {...t, dosage: dosage}
let updateDays = (days, t) => {...t, days: days}
let updateNotes = (notes, t) => {...t, notes: notes}

let decode = json => {
  open Json.Decode
  {
    medicine: json |> field("medicine", string),
    route: json |> field("route", string),
    dosage: json |> field("dosage", string),
    dosage_new: json |> field("dosage_new", string),
    days: json |> field("days", int),
    notes: json |> field("notes", string),
  }
}

let encode = t => {
  open Json.Encode
  object_(list{
    ("medicine", t.medicine |> string),
    ("route", t.route |> string),
    ("dosage", t.dosage |> string),
    ("dosage_new", t.dosage_new |> string),
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
        p => make(p["medicine"], p["route"], p["dosage"], p["dosage_new"], p["days"], p["notes"]),
        json,
      )
    : []
}
