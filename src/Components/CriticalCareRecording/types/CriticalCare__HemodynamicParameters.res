type t = {
  bp_systolic: string,
  bp_diastolic: string,
  pulse: string,
  temperature: string,
  respiratory_rate: string,
  rhythm: CriticalCare__HemodynamicParametersRhythm.rhythmVar,
  description: string,
}

let bp_systolic = t => t.bp_systolic
let bp_diastolic = t => t.bp_diastolic
let pulse = t => t.pulse
let temperature = t => t.temperature
let respiratory_rate = t => t.respiratory_rate
let rhythm = t => t.rhythm
let description = t => t.description

let showStatus = data => {
  let total = 7.0
  let count = ref(0.0)

  if bp_systolic(data) !== "" {
    count := count.contents +. 1.0
  }
  if bp_diastolic(data) !== "" {
    count := count.contents +. 1.0
  }
  if pulse(data) !== "" {
    count := count.contents +. 1.0
  }
  if temperature(data) !== "" {
    count := count.contents +. 1.0
  }
  if respiratory_rate(data) !== "" {
    count := count.contents +. 1.0
  }
  if rhythm(data) !== None {
    count := count.contents +. 1.0
  }
  if description(data) !== "" {
    count := count.contents +. 1.0
  }

  Js.Float.toFixed(count.contents /. total *. 100.0)
}
