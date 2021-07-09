type t = {
  personalHygiene: option<string>,
  positioning: option<string>,
  suctioning: option<string>,
  rylesTubeCare: option<string>,
  iVSitecare: option<string>,
  nubulisation: option<string>,
  dressing: option<string>,
  dVTPumpStocking: option<string>,
  restrain: option<string>,
  chestTubeCare: option<string>,
  tracheostomyCare: option<string>,
  stomaCare: option<string>,
}

let personalHygiene = t => t.personalHygiene
let positioning = t => t.positioning
let suctioning = t => t.suctioning
let rylesTubeCare = t => t.rylesTubeCare
let iVSitecare = t => t.iVSitecare
let nubulisation = t => t.nubulisation
let dressing = t => t.dressing
let dVTPumpStocking = t => t.dVTPumpStocking
let restrain = t => t.restrain
let chestTubeCare = t => t.chestTubeCare
let tracheostomyCare = t => t.tracheostomyCare
let stomaCare = t => t.stomaCare

let showStatus = data => {
  let total = 12.0
  let count = ref(0.0)
  if personalHygiene(data) !== None {
    count := count.contents +. 1.0
  }
  if positioning(data) !== None {
    count := count.contents +. 1.0
  }
  if suctioning(data) !== None {
    count := count.contents +. 1.0
  }
  if rylesTubeCare(data) !== None {
    count := count.contents +. 1.0
  }
  if iVSitecare(data) !== None {
    count := count.contents +. 1.0
  }
  if dressing(data) !== None {
    count := count.contents +. 1.0
  }
  if nubulisation(data) !== None {
    count := count.contents +. 1.0
  }
  if dVTPumpStocking(data) !== None {
    count := count.contents +. 1.0
  }
  if restrain(data) !== None {
    count := count.contents +. 1.0
  }
  if chestTubeCare(data) !== None {
    count := count.contents +. 1.0
  }
  if tracheostomyCare(data) !== None {
    count := count.contents +. 1.0
  }
  if stomaCare(data) !== None {
    count := count.contents +. 1.0
  }

  Js.Float.toFixed(count.contents /. total *. 100.0)
}

let create = (
  personalHygiene,
  positioning,
  suctioning,
  rylesTubeCare,
  iVSitecare,
  nubulisation,
  dressing,
  dVTPumpStocking,
  restrain,
  chestTubeCare,
  tracheostomyCare,
  stomaCare,
) => {
  personalHygiene: personalHygiene,
  positioning: positioning,
  suctioning: suctioning,
  rylesTubeCare: rylesTubeCare,
  iVSitecare: iVSitecare,
  nubulisation: nubulisation,
  dressing: dressing,
  dVTPumpStocking: dVTPumpStocking,
  restrain: restrain,
  chestTubeCare: chestTubeCare,
  tracheostomyCare: tracheostomyCare,
  stomaCare: stomaCare,
}
