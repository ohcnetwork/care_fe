@genType
type t = {
  medicine: string,
  dosage: string,
  days: int,
  dosage_new : string,
  route : string,
  notes : string
}

let medicine = t => t.medicine
let dosage = t => t.dosage
let days = t => t.days
let dosage_new = t => t.dosage_new
let route = t => t.route
let notes = t => t.notes

let make = (medicine, dosage, days, dosage_new, route, notes) => {
  medicine: medicine,
  dosage: dosage,
  days: days,
  route : route,
  notes : notes,
  dosage_new : dosage_new
}

let empty = () => { 
  medicine: "",
  route: "",
  dosage: "",
  dosage_new: "0 mg",
  days: 0,
  notes: ""
}

let updateMedicine = (medicine, t) => {...t, medicine: medicine}
let updateDosage = (dosage, t) => {...t, dosage: dosage}
let updateDays = (days, t) => {...t, days: days}
let updateDosageNew = (dosage, t) => {...t, dosage_new: dosage}
let updateRoute = (route, t) => {...t, route: route}
let updateNotes = (notes, t) => {...t, notes: notes}

let decode = json => {
  open Json.Decode
  {
    medicine: json |> field("medicine", string),
    dosage: json |> field("dosage", string),
    days: json |> field("days", int),
    route: json |> field("route", string),
    dosage_new: json |> field("dosage_new", string),
    notes: json |> field("notes", string),
  }
}

let encode = t => {
  open Json.Encode
  object_(list{
    ("medicine", t.medicine |> string),
    ("dosage", t.dosage |> string),
    ("dosage_new", t.dosage_new |> string),
    ("route", t.route |> string),
    ("notes", t.notes |> string),
    ("days", t.days |> int),
  })
}

let encodeArray = prescriptions =>
  prescriptions |> {
    open Json.Encode
    array(encode)
  }

let makeFromJs = json => {
  Js.Array.isArray(json) ? Js.Array.map(p => make(p["medicine"], p["dosage"], p["days"], p["dosage_new"], p["route"], p["notes"]), json) : []
}
