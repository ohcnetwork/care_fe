type typ = {d: string, transform: string, label: string}
let d = typ => typ.d
let transform = typ => typ.transform
let label = typ => typ.label

type ty = {
  braden_scale_front: string,
  braden_scale_back: string,
  front_parts_selected: Js.Dict.t<string>,
  back_parts_selected: Js.Dict.t<string>,
}
let braden_scale_front = ty => ty.braden_scale_front
let braden_scale_back = ty => ty.braden_scale_back
let front_parts_selected = ty => ty.front_parts_selected
let back_parts_selected = ty => ty.back_parts_selected
