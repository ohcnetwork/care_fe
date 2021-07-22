type frequency =
  | UNKNOWN
  | OD
  | BD
  | TD

export type t = {
  bloodsugar_level: option<int>,
  dosage: option<float>,
  frequency: frequency,
}

let makeFrequency = frequency => {
  switch frequency {
  | "OD" => OD
  | "BD" => BD
  | "TD" => TD
  | _ => UNKNOWN
  }
}

let encodeFrequency = frequency => {
  switch frequency {
  | OD => "OD"
  | BD => "BD"
  | TD => "TD"
  | UNKNOWN => "UNKNOWN"
  }
}

let frequencyToString = frequency => {
  switch frequency {
  | OD => "Once a Day(OD)"
  | BD => "Twice a day(BD)"
  | TD => "Thrice in a day(TD)"
  | UNKNOWN => "Unknown"
  }
}

let bloodsugar_level = t => t.bloodsugar_level
let dosage = t => t.dosage
let frequency = t => t.frequency

let make = (~bloodsugar_level, ~dosage, ~frequency) => {
  bloodsugar_level: bloodsugar_level,
  dosage: dosage,
  frequency: frequency,
}

let makeFromJs = dailyRound => {
  make(
    ~bloodsugar_level=dailyRound["blood_sugar_level"]->Js.Nullable.toOption,
    ~dosage=dailyRound["insulin_intake_dose"]->Js.Nullable.toOption,
    ~frequency=makeFrequency(dailyRound["insulin_intake_frequency"]),
  )
}
