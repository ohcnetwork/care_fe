export type t = {
  fluid_balance: option<int>,
  net_balance: option<int>,
}

let fluid_balance = t => t.fluid_balance
let net_balance = t => t.net_balance

let make = (~fluid_balance, ~net_balance) => {
  fluid_balance: fluid_balance,
  net_balance: net_balance,
}

let makeFromJs = dailyRound => {
  make(
    ~fluid_balance=dailyRound["dialysis_fluid_balance"]->Js.Nullable.toOption,
    ~net_balance=dailyRound["dialysis_net_balance"]->Js.Nullable.toOption,
  )
}

