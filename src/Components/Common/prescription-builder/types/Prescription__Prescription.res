export type t = {
  medicine: string,
  dosage: string,
  days: int,
}

let medicine = t => t.medicine
let dosage = t => t.dosage
let days = t => t.days

let make = (medicine, dosage, days) => {
  medicine: medicine,
  dosage: dosage,
  days: days,
}

let empty = () => {medicine: "", dosage: "", days: 0}

let updateMedicine = (medicine, t) => {...t, medicine: medicine}
let updateDosage = (dosage, t) => {...t, dosage: dosage}
let updateDays = (days, t) => {...t, days: days}

let decode = json => {
  open Json.Decode
  {
    medicine: json |> field("medicine", string),
    dosage: json |> field("dosage", string),
    days: json |> field("days", int),
  }
}

let encode = t => {
  open Json.Encode
  object_(list{
    ("medicine", t.medicine |> string),
    ("dosage", t.dosage |> string),
    ("days", t.days |> int),
  })
}

let encodeArray = prescriptions =>
  prescriptions |> {
    open Json.Encode
    array(encode)
  }
