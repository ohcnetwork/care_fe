type type_for_path = {d: string, transform: string, label: string}
let d = type_for_path => type_for_path.d
let transform = type_for_path => type_for_path.transform
let label = type_for_path => type_for_path.label

type t = {
  braden_scale_front: string,
  braden_scale_back: string,
  front_parts_selected: Js.Dict.t<string>,
  back_parts_selected: Js.Dict.t<string>,
}
let braden_scale_front = t => t.braden_scale_front
let braden_scale_back = t => t.braden_scale_back
let front_parts_selected = t => t.front_parts_selected
let back_parts_selected = t => t.back_parts_selected
