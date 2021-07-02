type ventilatorModeSubOption = {
  cmv:string,
  simv:string,
  psv:string
}
type ventilatorMode = {
  ventilatorMode: string,
  ventilatorModeSubOption: ventilatorModeSubOption,
  peep:string,
  peakInspiratoryPressure:string,
  meanAirwayPressure:string,
  respiratoryRateVentilator:string,
  tidalVolume:string,
  fio2:string,
  spo2:string
}
type oxygenModality = {
  nasalProngs: option<string>,
  simpleFaceMask: option<string>,
  nonRebreathingMask: bool,
  highFlowNasalCannula: bool,
  fio2:string,
  spo2:string,
}
  

type t = {
  ventilationInterface: string,
  iv : ventilatorMode,
  niv: ventilatorMode,
  none: oxygenModality
}

type iv = ventilatorMode
type niv = ventilatorMode
type none = oxygenModality

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