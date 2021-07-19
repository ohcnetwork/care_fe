type t = {etco2: option<int>}
let etco2 = t => t.etco2

let make = (~etco2) => {
  etco2: etco2,
}

let makeFromJs = dailyRound => {
  make(~etco2=dailyRound["etco2"])
}
