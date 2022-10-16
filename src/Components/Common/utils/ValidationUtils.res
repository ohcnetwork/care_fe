let isInputInRangeFloat = (minString, maxString, val) => {
  let min = Js.Float.fromString(minString)
  let max = Js.Float.fromString(maxString)
  let value = Js.Option.getWithDefault(min, val)
  if value < min || value > max {
    Some("Input outside range")
  } else {
    None
  }
}

let isInputInRangeInt = (min, max, val) => {
  switch val {
  | Some(value) =>
    switch (value < min, value > max) {
    | (true, _) => Some("Input less than " ++ string_of_int(min))
    | (_, true) => Some("Input greater than maximum")
    | _ => None
    }
  | None => None
  }
}
