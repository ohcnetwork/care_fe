let setOptionalString = (key, value, payload) => {
  if String.trim(value) !== "" {
    Js.Dict.set(payload, key, Js.Json.string(value))
  }
}

let setOptionalNumber = (key, value, payload) => {
  switch value {
  | Some(v) => Js.Dict.set(payload, key, Js.Json.number(float_of_int(v)))
  | None => ()
  }
}

let setOptionalFloat = (key, value, payload) => {
  switch value {
  | Some(v) => Js.Dict.set(payload, key, Js.Json.number(v))
  | None => ()
  }
}

let setOptionalBool = (key, value, payload) => {
  switch value {
  | Some(v) => Js.Dict.set(payload, key, Js.Json.boolean(v))
  | None => ()
  }
}
