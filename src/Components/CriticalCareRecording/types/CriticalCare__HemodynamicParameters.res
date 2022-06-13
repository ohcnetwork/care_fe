type bp = {
  systolic: int,
  diastolic: int,
  mean: float,
}

type rhythm =
  | UNKNOWN
  | Regular
  | IrRegular

export type t = {
  pain: option<int>,
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

let make = (~pain, ~bp, ~pulse, ~temperature, ~resp, ~rhythm, ~rhythmDetails) => {
  pain: pain,
  bp: bp,
  pulse: pulse,
  temperature: temperature,
  resp: resp,
  rhythm: rhythm,
  rhythmDetails: rhythmDetails,
}

let makeBPFromJs = bp => {
  ArrayUtils.isEmpty(Js.Obj.keys(bp))
    ? None
    : Some(makeBP(~diastolic=bp["diastolic"], ~systolic=bp["systolic"], ~mean=bp["mean"]))
}
let makeFromJs = dailyRound => {
  make(
    ~pain=dailyRound["pain"]->Js.Nullable.toOption,
    ~bp=makeBPFromJs(dailyRound["bp"]),
    ~pulse=dailyRound["pulse"]->Js.Nullable.toOption,
    ~temperature=dailyRound["temperature"]->Js.Nullable.toOption,
    ~resp=dailyRound["resp"]->Js.Nullable.toOption,
    ~rhythm=makeRhythm(dailyRound["rhythm"]),
    ~rhythmDetails=dailyRound["rhythm_detail"]->Js.Nullable.toOption,
  )
}

let pain = t => t.pain
let bp = t => t.bp
let systolic = bp => bp.systolic
let diastolic = bp => bp.diastolic
let pulse = t => t.pulse
let temperature = t => t.temperature
let resp = t => t.resp
let rhythm = t => t.rhythm
let rhythmDetails = t => t.rhythmDetails
