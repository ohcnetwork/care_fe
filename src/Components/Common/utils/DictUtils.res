let setOptionalString = (key, value, payload) => {
  if String.trim(value) !== "" {
    Js.Dict.set(payload, key, Js.Json.string(value))
  }
}

let setOptionalNumber = (key, value, payload) => {
  switch value {
  | Some(v) => Js.Dict.set(payload, key, Js.Json.number(float_of_int(v)))
  | None => Js.Dict.set(payload, key, Js.Json.null)
  }
}

let setOptionalFloat = (key, value, payload) => {
  switch value {
  | Some(v) => Js.Dict.set(payload, key, Js.Json.number(v))
  | None => Js.Dict.set(payload, key, Js.Json.null)
  }
}

let setOptionalBool = (key, value, payload) => {
  switch value {
  | Some(v) => Js.Dict.set(payload, key, Js.Json.boolean(v))
  | None => Js.Dict.set(payload, key, Js.Json.null)
  }
}
