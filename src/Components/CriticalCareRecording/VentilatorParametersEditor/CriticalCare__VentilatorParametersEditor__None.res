let str = React.string
open CriticalCare__Types

let checkBoxSliderConfig = [
  {
    "checkboxTitle": "Nasal Prongs",
    "title": "Oxygen Level (l/m)",
    "start": "0",
    "end": "50",
    "interval": "5",
    "step": 1.0,
    "id": "nasalProngs",
    "min": 1.0,
    "max": 4.0,
  },
  {
    "checkboxTitle": "Simple Face Mask",
    "title": "Oxygen Level (l/m)",
    "start": "0",
    "end": "50",
    "interval": "5",
    "step": 1.0,
    "id": "simpleFaceMask",
    "min": 5.0,
    "max": 10.0,
  },
]

let sliderConfig = [
  {
    "title": "FiO2 (%)",
    "start": "21",
    "end": "100",
    "interval": "10",
    "step": 1.0,
    "id": "fio2",
    "min": 21.0,
    "max": 60.0,
  },
  {
    "title": "SPO2 (%)",
    "start": "0",
    "end": "100",
    "interval": "10",
    "step": 1.0,
    "id": "spo2",
    "min": 90.0,
    "max": 100.0,
  },
]

let getStatus = (min, max, val) => {
  if val > min && val < max {
    ("Normal", "#059669")
  } else if val < min {
    ("Low", "#DC2626")
  } else {
    ("High", "#DC2626")
  }
}

@react.component
let make = (~state: VentilatorParameters.t, ~send: VentilatorParameters.action => unit) => {
  <div />
}
