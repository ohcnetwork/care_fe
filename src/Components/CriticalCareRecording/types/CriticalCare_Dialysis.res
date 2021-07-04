type t = {
  fluid_balance: string,
  net_balance: string,
}

let fluid_balance = t => t.fluid_balance
let net_balance = t => t.net_balance

// let init = {
//   fluid_balance: "",
//   net_balance: "",
// }

let showStatus = data => {
  let total = 2.0
  let count = ref(0.0)
  if fluid_balance(data) !== "" {
    count := count.contents +. 1.0
  }
  if net_balance(data) !== "" {
    count := count.contents +. 1.0
  }
  Js.Float.toFixed(count.contents /. total *. 100.0)
}
