let frequencyOptions = [
  {
    "name": "Once a Day(OD)",
    "value": "OD",
  },
  {
    "name": "Twice a day(BD)",
    "value": "BD",
  },
  {
    "name": "Thrice in a day(TD)",
    "value": "TD",
  },
]

type t = {
  blood_sugar_level: string,
  dosage: string,
  frequency: string,
}

let blood_sugar_level = t => t.blood_sugar_level
let dosage = t => t.dosage
let frequency = t => t.frequency

let init = {
  blood_sugar_level: "",
  dosage: "",
  frequency: "OD",
}

let showStatus = data => {
  let total = 3.0
  let count = ref(0.0)
  if blood_sugar_level(data) !== "" {
    count := count.contents +. 1.0
  }
  if dosage(data) !== "" {
    count := count.contents +. 1.0
  }
  if frequency(data) !== "" {
    count := count.contents +. 1.0
  }
  Js.Float.toFixed(count.contents /. total *. 100.0)
}
