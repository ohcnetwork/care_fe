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
  potassium: string,
}

let po2 = t => t.po2
let pco2 = t => t.pco2
let pH = t => t.pH
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
  potassium: "",
}

let showStatus = data => {
  let total = 8.0
  let count = ref(0.0)

  if po2(data) !== "" {
    count := count.contents +. 1.0
  }
  if pco2(data) !== "" {
    count := count.contents +. 1.0
  }
  if pH(data) !== "" {
    count := count.contents +. 1.0
  }
  if hco3(data) !== "" {
    count := count.contents +. 1.0
  }
  if baseExcess(data) !== "" {
    count := count.contents +. 1.0
  }
  if lactate(data) !== "" {
    count := count.contents +. 1.0
  }
  if sodium(data) !== "" {
    count := count.contents +. 1.0
  }
  if potassium(data) !== "" {
    count := count.contents +. 1.0
  }

  Js.Float.toFixed(count.contents /. total *. 100.0)
}
