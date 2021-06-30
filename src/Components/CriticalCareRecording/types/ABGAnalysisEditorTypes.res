// PO2(mmHg)
// PCO2(mmHg)
// pH
// HCO3(mmol/L)
// Base Excess(mmol/L)
// Lactate(mmol/L)
// Sodium(mmol/L)
// Potassium(mmol/L)

type t = {
  po2: string,
  pco2: string,
  pH: string,
  hco3: string,
  baseExcess: string,
  lactate: string,
  sodium: string,
  potassium: string
}

let po2 = t => t.po2
let pco2 = t => t.pco2
let ph = t => t.pH
let hco3 = t => t.hco3
let baseExcess = t => t.baseExcess
let lactate = t => t.lactate
let sodium = t => t.sodium
let potassium = t => t.potassium

let init = {
  po2: "",
  pco2: "",
  pH: "",
  hco3: "",
  baseExcess: "",
  lactate: "",
  sodium: "",
  potassium: ""
}
