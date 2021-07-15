export type t = {
  fluid_balance: option<int>,
  net_balance: option<int>,
}

let fluid_balance = t => t.fluid_balance
let net_balance = t => t.net_balance

// let init = {
//   fluid_balance: "",
//   net_balance: "",
// }

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

// let showStatus = data => {
//   let total = 2.0
//   let count = ref(0.0)
//   if Js.Option.isSome(fluid_balance(data)) {
//     count := count.contents +. 1.0
//   }
//   if Js.Option.isSome(Some(net_balance(data)) {
//     count := count.contents +. 1.0
//   }
//   Js.Float.toFixed(count.contents /. total *. 100.0)
// }
