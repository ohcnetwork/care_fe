type rhythmVar =
  | None
  | Regular
  | IrRegular

type t = {
  bp_systolic: string,
  bp_diastolic: string,
  pulse: string,
  temperature: string,
  respiratory_rate: string,
  rhythm: rhythmVar,
  description: string,
}

let bp_systolic = t => t.bp_systolic
let bp_diastolic = t => t.bp_diastolic
let pulse = t => t.pulse
let temperature = t => t.temperature
let respiratory_rate = t => t.respiratory_rate
let rhythm = t => t.rhythm
let description = t => t.description

let init = {
  bp_systolic: "",
  bp_diastolic: "",
  pulse: "",
  temperature: "",
  respiratory_rate: "",
  rhythm: None,
  description: "",
}
