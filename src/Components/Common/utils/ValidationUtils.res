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
  let value = Js.Option.getWithDefault(min, val)
  if value < min || value > max {
    Some("Input outside range")
  } else {
    None
  }
}