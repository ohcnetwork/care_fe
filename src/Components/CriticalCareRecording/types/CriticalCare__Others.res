export type t = {
  etco2: option<int>,
  physical_examination_info: option<string>,
  additional_symptoms: array<int>,
  other_details: option<string>,
  other_symptoms: option<string>,
}
let etco2 = t => t.etco2
let physical_examination_info = t => t.physical_examination_info
let other_details = t => t.other_details
let other_symptoms = t => t.other_symptoms
let additional_symptoms = t => t.additional_symptoms

let make = (
  ~etco2,
  ~physical_examination_info,
  ~additional_symptoms,
  ~other_symptoms,
  ~other_details,
) => {
  etco2: etco2,
  physical_examination_info: physical_examination_info,
  other_details: other_details,
  additional_symptoms: additional_symptoms,
  other_symptoms: other_symptoms,
}

let makeFromJs = dailyRound => {
  make(
    ~etco2=dailyRound["etco2"],
    ~physical_examination_info=dailyRound["physical_examination_info"],
    ~other_details=dailyRound["other_details"],
    ~additional_symptoms=dailyRound["additional_symptoms"],
    ~other_symptoms=dailyRound["other_symptoms"],
  )
}
