type t = {
  personalHygiene: string,
  positioning: string,
  suctioning: string,
  rylesTubeCare: string,
  iVSitecare: string,
  nubulisation: string,
  dressing: string,
  dVTPumpStocking: string,
  restrain: string,
  chestTubeCare: string,
  tracheostomyCare: string,
  stomaCare: string,
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
  if personalHygiene(data) !== "" {
    count := count.contents +. 1.0
  }
  if positioning(data) !== "" {
    count := count.contents +. 1.0
  }
  if suctioning(data) !== "" {
    count := count.contents +. 1.0
  }
  if rylesTubeCare(data) !== "" {
    count := count.contents +. 1.0
  }
  if iVSitecare(data) !== "" {
    count := count.contents +. 1.0
  }
  if dressing(data) !== "" {
    count := count.contents +. 1.0
  }
  if nubulisation(data) !== "" {
    count := count.contents +. 1.0
  }
  if dVTPumpStocking(data) !== "" {
    count := count.contents +. 1.0
  }
  if restrain(data) !== "" {
    count := count.contents +. 1.0
  }
  if chestTubeCare(data) !== "" {
    count := count.contents +. 1.0
  }
  if tracheostomyCare(data) !== "" {
    count := count.contents +. 1.0
  }
  if stomaCare(data) !== "" {
    count := count.contents +. 1.0
  }

  Js.Float.toFixed(count.contents /. total *. 100.0)
}
