type ventilatorModeSubOption = {
  cmv: string,
  simv: string,
  psv: string,
}
type ventilatorMode = {
  ventilatorMode: string,
  ventilatorModeSubOption: ventilatorModeSubOption,
  peep: string,
  peakInspiratoryPressure: string,
  meanAirwayPressure: string,
  respiratoryRateVentilator: string,
  tidalVolume: string,
  fio2: string,
  spo2: string,
}
type oxygenModality = {
  nasalProngs: option<string>,
  simpleFaceMask: option<string>,
  nonRebreathingMask: bool,
  highFlowNasalCannula: bool,
  fio2: string,
  spo2: string,
}

type t = {
  ventilationInterface: string,
  iv: ventilatorMode,
  niv: ventilatorMode,
  none: oxygenModality,
}

type iv = ventilatorMode
type niv = ventilatorMode
type none = oxygenModality
type ventilationInterface = string

let ventilationInterface = t => t.ventilationInterface
let iv = t => t.iv
let niv = t => t.niv
let none = t => t.none

type action =
  | SetVentilationInterface(string)
  | SetIv(ventilatorMode)
  | SetIvSubOptions(ventilatorMode)
  | SetNiv(ventilatorMode)
  | SetNivSubOptions(ventilatorMode)
  | SetNone(oxygenModality)

let ventilatorModeStatus = (count, totalCount, data) => {
  switch data.ventilatorMode {
  | "cmv" =>
    totalCount := 1.0
    if data.ventilatorModeSubOption.cmv !== "" {
      count := count.contents +. 1.0
    }
  | "simv" =>
    totalCount := 1.0
    if data.ventilatorModeSubOption.simv !== "" {
      count := count.contents +. 1.0
    }
  | "psv" => {
      totalCount := 7.0
      if data.peep !== "" {
        count := count.contents +. 1.0
      }
      if data.peakInspiratoryPressure !== "" {
        count := count.contents +. 1.0
      }
      if data.meanAirwayPressure !== "" {
        count := count.contents +. 1.0
      }
      if data.respiratoryRateVentilator !== "" {
        count := count.contents +. 1.0
      }
      if data.tidalVolume !== "" {
        count := count.contents +. 1.0
      }
      if data.fio2 !== "" {
        count := count.contents +. 1.0
      }
      if data.spo2 !== "" {
        count := count.contents +. 1.0
      }
    }
  | _ => ()
  }
  ()
}

let showStatus = data => {
  let count = ref(0.0)
  let totalCount = ref(1.0)
  switch data.ventilationInterface {
  | "iv" => ventilatorModeStatus(count, totalCount, data.iv)
  | "niv" => ventilatorModeStatus(count, totalCount, data.niv)
  | "none" => {
      totalCount := 2.0
      if data.none.fio2 !== "" {
        count := count.contents +. 1.0
      }
      if data.none.spo2 !== "" {
        count := count.contents +. 1.0
      }
    }
  | _ => ()
  }
  Js.Float.toFixed(count.contents /. totalCount.contents *. 100.0)
}

let getStatus = (min, max, val) => {
  if val > min && val < max {
    ("Normal", "#059669")
  } else if val < min {
    ("Low", "#DC2626")
  } else {
    ("High", "#DC2626")
  }
}
