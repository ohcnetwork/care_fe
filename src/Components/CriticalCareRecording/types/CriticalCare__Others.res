type t = {
  bilateral_air_entry: option<bool>,
  etco2: option<int>,
  physical_examination_info: option<string>,
  additional_symptoms: option<array<int>>,
  other_details: option<string>,
  other_symptoms: option<string>,
}
let bilateral_air_entry = t => t.bilateral_air_entry
let etco2 = t => t.etco2
let physical_examination_info = t => t.physical_examination_info
let other_details = t => t.other_details
let other_symptoms = t => t.other_symptoms
let additional_symptoms = t => t.additional_symptoms

let make = (
  ~bilateral_air_entry,
  ~etco2,
  ~physical_examination_info,
  ~additional_symptoms,
  ~other_symptoms,
  ~other_details,
) => {
  bilateral_air_entry,
  etco2,
  physical_examination_info,
  other_details,
  additional_symptoms,
  other_symptoms,
}

let makeFromJs = dailyRound => {
  make(
    ~bilateral_air_entry=dailyRound["bilateral_air_entry"]->Js.Nullable.toOption,
    ~etco2=dailyRound["etco2"]->Js.Nullable.toOption,
    ~physical_examination_info=dailyRound["physical_examination_info"]->Js.Nullable.toOption,
    ~other_details=dailyRound["other_details"]->Js.Nullable.toOption,
    ~additional_symptoms=dailyRound["additional_symptoms"],
    ~other_symptoms=dailyRound["other_symptoms"]->Js.Nullable.toOption,
  )
}
