@genType
type t = {
  medicine: string,
  route: string,
  dosage: string,
  days: int,
  notes: string,
}

let medicine = t => t.medicine
let route = t => t.route
let dosage = t => t.dosage
let days = t => t.days
let notes = t => t.notes

let make = (medicine, route, dosage, days, notes) => {
  medicine,
  route,
  dosage,
  days,
  notes,
}

let empty = () => {medicine: "", route: "", dosage: "", days: 0, notes: ""}

let updateMedicine = (medicine, t) => {...t, medicine}
let updateRoute = (route, t) => {...t, route}
let updateDosage = (dosage, t) => {...t, dosage}
let updateDays = (days, t) => {...t, days}
let updateNotes = (notes, t) => {...t, notes}

let decode = json => {
  open Json.Decode
  {
    medicine: json |> field("medicine", string),
    route: json |> field("route", string),
    dosage: json |> field("dosage", string),
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
    ? Js.Array.map(p => make(p["medicine"], p["route"], p["dosage"], p["days"], p["notes"]), json)
    : []
}
