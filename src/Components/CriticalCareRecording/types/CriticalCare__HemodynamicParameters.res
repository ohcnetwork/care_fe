type bp = {
  systolic: int,
  diastolic: int,
  mean: int,
}

type rhythm =
  | UNKNOWN
  | Regular
  | IrRegular

export type t = {
  bp: option<bp>,
  pulse: option<int>,
  temperature: option<float>,
  resp: option<int>,
  rhythm: rhythm,
  rhythmDetails: option<string>,
}

let makeBP = (~systolic, ~diastolic, ~mean) => {
  systolic: systolic,
  diastolic: diastolic,
  mean: mean,
}

let makeRhythm = rhythm => {
  switch rhythm {
  | "REGULAR" => Regular
  | "IRREGULAR" => IrRegular
  | _ => UNKNOWN
  }
}

let encodeRhythm = rhythm => {
  switch rhythm {
  | Regular => "REGULAR"
  | IrRegular => "IRREGULAR"
  | UNKNOWN => "UNKNOWN"
  }
}

let rhythmToString = rhythm => {
  switch rhythm {
  | Regular => "Regular"
  | IrRegular => "Irregular"
  | UNKNOWN => "Unknown"
  }
}

let make = (~bp, ~pulse, ~temperature, ~resp, ~rhythm, ~rhythmDetails) => {
  bp: bp,
  pulse: pulse,
  temperature: temperature,
  resp: resp,
  rhythm: rhythm,
  rhythmDetails: rhythmDetails,
}

let makeFromJs = dailyRound => {
  make(
    ~bp=dailyRound["bp"],
    ~pulse=dailyRound["pulse"],
    ~temperature=dailyRound["temperature"],
    ~resp=dailyRound["resp"],
    ~rhythm=makeRhythm(dailyRound["rhythm"]),
    ~rhythmDetails=dailyRound["rhythm_detail"],
  )
}

let bp = t => t.bp
let systolic = bp => bp.systolic
let diastolic = bp => bp.diastolic
let pulse = t => t.pulse
let temperature = t => t.temperature
let resp = t => t.resp
let rhythm = t => t.rhythm
let rhythmDetails = t => t.rhythmDetails

let showStatus = data => {
  let total = 7.0
  let count = ref(0.0)

  // if bp_systolic(data) !== "" {
  //   count := count.contents +. 1.0
  // }
  // if bp_diastolic(data) !== "" {
  //   count := count.contents +. 1.0
  // }
  // if pulse(data) !== "" {
  //   count := count.contents +. 1.0
  // }
  // if temperature(data) !== "" {
  //   count := count.contents +. 1.0
  // }
  // if respiratory_rate(data) !== "" {
  //   count := count.contents +. 1.0
  // }
  // if rhythm(data) !== None {
  //   count := count.contents +. 1.0
  // }
  // if description(data) !== "" {
  //   count := count.contents +. 1.0
  // }

  Js.Float.toFixed(count.contents /. total *. 100.0)
}
