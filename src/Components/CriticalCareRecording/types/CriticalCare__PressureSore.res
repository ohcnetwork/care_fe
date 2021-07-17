type type_for_path = {d: string, transform: string, label: string}
let d = type_for_path => type_for_path.d
let transform = type_for_path => type_for_path.transform
let label = type_for_path => type_for_path.label

export type t = {
  braden_scale_front: option<int>,
  braden_scale_back: option<int>,
  front_parts_selected: array<bool>,
  back_parts_selected: array<bool>,
}
let braden_scale_front = t => t.braden_scale_front
let braden_scale_back = t => t.braden_scale_back
let front_parts_selected = t => t.front_parts_selected
let back_parts_selected = t => t.back_parts_selected

let make = (
  ~braden_scale_front,
  ~braden_scale_back,
  ~front_parts_selected,
  ~back_parts_selected,
) => {
  braden_scale_front: braden_scale_front,
  braden_scale_back: braden_scale_back,
  front_parts_selected: front_parts_selected,
  back_parts_selected: back_parts_selected,
}

let makeFromJs = dailyRound => {
  Js.log(dailyRound)

  Js.Array.map(
    d => make(~braden_scale_front=d["braden_sclae_front"], ~description=d["description"]),
    dailyRound["pressure_sore"],
  )
}
