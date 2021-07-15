type unit = IOBalance__UnitSection.unit_type

export type t = {
    infusions: option<array<unit>>,
    iv_fluid: option<array<unit>>,
    feed: option<array<unit>>,
    output: option<array<unit>>,
    total_intake_calculated: option<string>,
    total_output_calculated: option<string>,
}


let make = (~infusions, ~iv_fluid, ~feed, ~output, ~total_intake_calculated, ~total_output_calculated) => {
  infusions: infusions,
  iv_fluid: iv_fluid,
  feed: feed,
  output: output,
  total_intake_calculated: total_intake_calculated,
  total_output_calculated: total_output_calculated
}

let makeFromJs = dailyRound => {
    make(
        ~infusions=dailyRound["infusions"]->Js.Nullable.toOption,
        ~iv_fluid=dailyRound["iv_fluid"]->Js.Nullable.toOption,
        ~feed=dailyRound["feed"]->Js.Nullable.toOption,
        ~output=dailyRound["output"]->Js.Nullable.toOption,
        ~total_intake_calculated=dailyRound["total_intake_calculated"]->Js.Nullable.toOption,
        ~total_output_calculated=dailyRound["total_output_calculated"]->Js.Nullable.toOption,
    )
}

let parse = (value) => {
    switch value {
        | Some(x) => x
        | None => []
    }
}


let infusions = t => t.infusions->parse
let iv_fluid = t => t.iv_fluid->parse
let feed = t => t.feed->parse
let total_intake_calculated = t => t.total_intake_calculated
let output = t => t.output->parse
let total_output_calculated = t => t.total_output_calculated
