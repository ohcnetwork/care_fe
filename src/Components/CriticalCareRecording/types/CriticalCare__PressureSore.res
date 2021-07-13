type typ = {d: string, transform: string}
let d = typ => typ.d
let transform = typ => typ.transform

type t = {
  braden_scale_front: string,
  braden_scale_back: string,
  front_parts_selected: array<int>,
  back_parts_selected: array<int>,
}
let braden_scale_front = t => t.braden_scale_front
let braden_scale_back = t => t.braden_scale_back
let front_parts_selected = t => t.front_parts_selected
let back_parts_selected = t => t.back_parts_selected
