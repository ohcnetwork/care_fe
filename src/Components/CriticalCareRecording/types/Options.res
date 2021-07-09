type t = {name: string, value: string, label: string}

let name = t => t.name
let value = t => t.value
let label = t => t.label

type params = {title: string, title_value: string, options: array<t>}
type glassgow_coma_scale = array<params>
type limp_options = array<params>

let title = params => params.title
let title_value = params => params.title_value
let options = params => params.options

type typ = {d: string, transform: string}
let d = typ => typ.d
let transform = typ => typ.transform
