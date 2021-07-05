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

let ventilatorModeStatus = (count, data) => {
  switch data.ventilatorMode {
  | _ => ()
  | "cmv" =>
    if data.ventilatorModeSubOption.cmv !== "" {
      count := count.contents +. 1.0
    }
  | "simv" =>
    if data.ventilatorModeSubOption.simv !== "" {
      count := count.contents +. 1.0
    }
  | "psv" => {
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
  }
}

let showStatus = (ventilationInterface, data) => {
  let count = ref(0.0)
  let falsyValues = [Some(""), None]
  let totalCount = switch ventilationInterface {
  | "iv" => 9.0
  | "niv" => 9.0
  | _ => 1.0
  }
  switch ventilationInterface {
  | "iv" => ventilatorModeStatus(count, data.iv)
  | "niv" => ventilatorModeStatus(count, data.niv)
  | _ => ()
  }
  Js.Float.toFixed(count.contents /. totalCount *. 100.0)
}
