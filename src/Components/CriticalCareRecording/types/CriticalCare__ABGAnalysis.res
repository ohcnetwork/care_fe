export type t = {
  po2: option<float>,
  pco2: option<float>,
  pH: option<float>,
  hco3: option<float>,
  baseExcess: option<float>,
  lactate: option<float>,
  sodium: option<float>,
  potassium: option<float>,
}

let make = (~po2, ~pco2, ~pH, ~hco3, ~baseExcess, ~lactate, ~sodium, ~potassium) => {
  po2: po2,
  pco2: pco2,
  pH: pH,
  hco3: hco3,
  baseExcess: baseExcess,
  lactate: lactate,
  sodium: sodium,
  potassium: potassium,
}

let makeFromJs = dailyRound => {
  make(
    ~po2=dailyRound["po2"]->Js.Nullable.toOption,
    ~pco2=dailyRound["pco2"]->Js.Nullable.toOption,
    ~pH=dailyRound["ph"]->Js.Nullable.toOption,
    ~hco3=dailyRound["hco3"]->Js.Nullable.toOption,
    ~baseExcess=dailyRound["base_excess"]->Js.Nullable.toOption,
    ~lactate=dailyRound["lactate"]->Js.Nullable.toOption,
    ~sodium=dailyRound["sodium"]->Js.Nullable.toOption,
    ~potassium=dailyRound["potassium"]->Js.Nullable.toOption,
  )
}

let po2 = t => t.po2
let pco2 = t => t.pco2
let pH = t => t.pH
let hco3 = t => t.hco3
let baseExcess = t => t.baseExcess
let lactate = t => t.lactate
let sodium = t => t.sodium
let potassium = t => t.potassium

let getParams = [po2, pco2, pH, hco3, baseExcess, lactate, sodium, potassium]
