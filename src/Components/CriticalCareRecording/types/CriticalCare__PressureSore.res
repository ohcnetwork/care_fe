type part = FrontHead(int) | BackHead(int) | Other

type type_for_path = {d: string, transform: string, label: string}
let d = type_for_path => type_for_path.d
let transform = type_for_path => type_for_path.transform
let label = type_for_path => type_for_path.label

export type t = array<part>

// let braden_scale_front = t => t.braden_scale_front
// let braden_scale_back = t => t.braden_scale_back
// let front_parts_selected = t => t.front_parts_selected
// let back_parts_selected = t => t.back_parts_selected

// let make = (
//   ~braden_scale_front,
//   ~braden_scale_back,
//   ~front_parts_selected,
//   ~back_parts_selected,
// ) => {
//   braden_scale_front: braden_scale_front,
//   braden_scale_back: braden_scale_back,
//   front_parts_selected: front_parts_selected,
//   back_parts_selected: back_parts_selected,
// }

// let makeFromJs = dailyRound => {
//   Js.Array.length(dailyRound["pressure_sore"]) > 0
//     ? make(
//         ~braden_scale_front=dailyRound["pressure_sore"][0]["braden_scale_front"]->Js.Nullable.toOption,
//         ~braden_scale_back=dailyRound["pressure_sore"][0]["braden_scale_back"]->Js.Nullable.toOption,
//         ~front_parts_selected=dailyRound["pressure_sore"][0]["front_parts_selected"],
//         ~back_parts_selected=dailyRound["pressure_sore"][0]["back_parts_selected"],
//       )
//     : make(
//         ~braden_scale_front=None,
//         ~braden_scale_back=None,
//         ~front_parts_selected=[],
//         ~back_parts_selected=[],
//       )
// }
