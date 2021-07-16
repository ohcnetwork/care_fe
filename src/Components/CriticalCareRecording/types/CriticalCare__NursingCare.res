type procedure =
  | PersonalHygiene
  | Positioning
  | Suctioning
  | RylesTubeCare
  | IVSitecare
  | Nubulisation
  | Dressing
  | DVTPumpStocking
  | Restrain
  | ChestTubeCare
  | TracheostomyCare
  | StomaCare
  | Other(string)

type item = {
  procedure: procedure,
  description: string,
}

export type t = array<item>

let decodeProcedure = procedure => {
  switch procedure {
  | "personal_hygiene" => PersonalHygiene
  | "positioning" => Positioning
  | "suctioning" => Suctioning
  | "ryles_tube_care" => RylesTubeCare
  | "iv_sitecare" => IVSitecare
  | "nubulisation" => Nubulisation
  | "dressing" => Dressing
  | "dvt_pump_stocking" => DVTPumpStocking
  | "restrain" => Restrain
  | "chest_tube_care" => ChestTubeCare
  | "tracheostomy_care" => TracheostomyCare
  | "stoma_care" => StomaCare
  | p => Other(p)
  }
}

let encodeProcedure = item => {
  switch item.procedure {
  | PersonalHygiene => "personal_hygiene"
  | Positioning => "positioning"
  | Suctioning => "suctioning"
  | RylesTubeCare => "ryles_tube_care"
  | IVSitecare => "iv_sitecare"
  | Nubulisation => "nubulisation"
  | Dressing => "dressing"
  | DVTPumpStocking => "dvt_pump_stocking"
  | Restrain => "restrain"
  | ChestTubeCare => "chest_tube_care"
  | TracheostomyCare => "tracheostomy_care"
  | StomaCare => "stoma_care"
  | Other(p) => p
  }
}

let procedureString = procedure => {
  switch procedure {
  | PersonalHygiene => "Personal Hygiene"
  | Positioning => "Positioning"
  | Suctioning => "Suctioning"
  | RylesTubeCare => "Ryles Tube Care"
  | IVSitecare => "IV Sitecare"
  | Nubulisation => "Nubulisation"
  | Dressing => "Dressing"
  | DVTPumpStocking => "DVT Pump Stocking"
  | Restrain => "Restrain"
  | ChestTubeCare => "Chest Tube Care"
  | TracheostomyCare => "Tracheostomy Care"
  | StomaCare => "Stoma Care"
  | Other(p) => p
  }
}

let procedure = t => t.procedure
let description = t => t.description
let updateDescription = (description, t) => {...t, description: description}
let makeDefaultItem = procedure => {procedure: procedure, description: ""}

let showStatus = data => {
  let total = 12.0
  let count = ref(0.0)
  // if personalHygiene(data) !== None {
  //   count := count.contents +. 1.0
  // }
  // if positioning(data) !== None {
  //   count := count.contents +. 1.0
  // }
  // if suctioning(data) !== None {
  //   count := count.contents +. 1.0
  // }
  // if rylesTubeCare(data) !== None {
  //   count := count.contents +. 1.0
  // }
  // if iVSitecare(data) !== None {
  //   count := count.contents +. 1.0
  // }
  // if dressing(data) !== None {
  //   count := count.contents +. 1.0
  // }
  // if nubulisation(data) !== None {
  //   count := count.contents +. 1.0
  // }
  // if dVTPumpStocking(data) !== None {
  //   count := count.contents +. 1.0
  // }
  // if restrain(data) !== None {
  //   count := count.contents +. 1.0
  // }
  // if chestTubeCare(data) !== None {
  //   count := count.contents +. 1.0
  // }
  // if tracheostomyCare(data) !== None {
  //   count := count.contents +. 1.0
  // }
  // if stomaCare(data) !== None {
  //   count := count.contents +. 1.0
  // }

  Js.Float.toFixed(count.contents /. total *. 100.0)
}

let make = (~procedure, ~description) => {
  procedure: procedure,
  description: description,
}

let makeFromJs = dailyRound => {
  Js.Array.map(
    d => make(~procedure=decodeProcedure(d["procedure"]), ~description=d["description"]),
    dailyRound["nursing"],
  )
}
