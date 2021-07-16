exception UnsafeFindFailed(string)

let copyAndSort = (f, t) => {
  let cp = Js.Array.copy(t)
  Js.Array.sortInPlaceWith(f, cp)
}

let copyAndPush = (e, t) => {
  let copy = Js.Array.copy(t)
  Js.Array.push(e, copy) |> ignore
  copy
}

let isEmpty = a => Js.Array.length(a) == 0

let isNotEmpty = a => !isEmpty(a)

let replaceWithIndex = (i, t, l) => Js.Array.mapi((a, index) => index == i ? t : a, l)

let flatten = a => a |> Js.Array.reduce((flat, next) => flat |> Js.Array.concat(next), [])

let sort_uniq = (f, t) => t |> Array.to_list |> List.sort_uniq(f) |> Array.of_list

let getOpt = (a, i) =>
  try Some(a |> Array.get(i)) catch {
  | Not_found => None
  }

let swapUp = (i, t) =>
  if i <= 0 || i >= (t |> Array.length) {
    t
  } else {
    let copy = Js.Array.copy(t)

    copy[i] = t[i - 1]
    copy[i - 1] = t[i]
    copy
  }

let swapDown = (i, t) => swapUp(i + 1, t)

let last = t => t->Js.Array.unsafe_get(Js.Array.length(t) - 1)

let findAndReplace = (index, f, array) => array |> Array.mapi((i, p) => i == index ? f(p) : p)
