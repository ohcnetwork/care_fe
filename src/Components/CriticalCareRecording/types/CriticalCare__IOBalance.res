type item = {
  name: string,
  quantity: float,
}

export type t = {
  infusions: array<item>,
  ivFluid: array<item>,
  feed: array<item>,
  output: array<item>,
  total_intake_calculated: option<float>,
  total_output_calculated: option<float>,
}

let make = (
  ~infusions,
  ~ivFluid,
  ~feed,
  ~output,
  ~total_intake_calculated,
  ~total_output_calculated,
) => {
  infusions: infusions,
  ivFluid: ivFluid,
  feed: feed,
  output: output,
  total_intake_calculated: total_intake_calculated,
  total_output_calculated: total_output_calculated,
}

let makeItem = (~name, ~quantity) => {
  name: name,
  quantity: quantity,
}

let makeItems = items => {
  Js.Array.map(i => makeItem(~name=i["name"], ~quantity=i["quantity"]), items)
}

let makeFromJs = dailyRound => {
  make(
    ~infusions=makeItems(dailyRound["infusions"]),
    ~ivFluid=makeItems(dailyRound["iv_fluids"]),
    ~feed=makeItems(dailyRound["feeds"]),
    ~output=makeItems(dailyRound["output"]),
    ~total_intake_calculated=dailyRound["total_intake_calculated"]->Js.Nullable.toOption,
    ~total_output_calculated=dailyRound["total_output_calculated"]->Js.Nullable.toOption,
  )
}

let name = item => item.name
let quantity = item => item.quantity
let infusions = t => t.infusions
let ivFluid = t => t.ivFluid
let feed = t => t.feed
let output = t => t.output
let total_intake_calculated = t => t.total_intake_calculated
let total_output_calculated = t => t.total_output_calculated

let updateName = (name, item) => {
  ...item,
  name: name,
}

let updateQuantity = (quantity, item) => {
  ...item,
  quantity: quantity,
}

let makeDefaultItem = () => {
  makeItem(~name="", ~quantity=0.0)
}
