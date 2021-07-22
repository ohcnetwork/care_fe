type consciousnessLevel = Alert | Drowsy | Stuporous | Comatose | CannotBeAssessed | Unknown
type lightReaction = Brisk | Sluggish | Fixed | CannotBeAssessed | Unknown
type limpResponse = Strong | Moderate | Weak | Flexion | Extension | NONE_ | Unknown

export type t = {
  inPronePosition: option<bool>,
  consciousnessLevel: consciousnessLevel,
  consciousnessLevelDetails: option<string>,
  leftPupilSize: option<int>,
  leftPupilSizeDetails: option<string>,
  leftPupilLightReaction: lightReaction,
  leftPupilLightReactionDetails: option<string>,
  rightPupilSize: option<int>,
  rightPupilSizeDetails: option<string>,
  rightPupilLightReaction: lightReaction,
  rightPupilLightReactionDetails: option<string>,
  glasgowEyeOpen: option<int>,
  glasgowVerbalResponse: option<int>,
  glasgowMotorResponse: option<int>,
  glasgowTotalCalculated: option<int>,
  limbResponseUpperExtremityRight: limpResponse,
  limbResponseUpperExtremityLeft: limpResponse,
  limbResponseLowerExtremityRight: limpResponse,
  limbResponseLowerExtremityLeft: limpResponse,
}

let make = (
  ~inPronePosition,
  ~consciousnessLevel,
  ~consciousnessLevelDetails,
  ~leftPupilSize,
  ~leftPupilSizeDetails,
  ~leftPupilLightReaction,
  ~leftPupilLightReactionDetails,
  ~rightPupilSize,
  ~rightPupilSizeDetails,
  ~rightPupilLightReaction,
  ~rightPupilLightReactionDetails,
  ~glasgowEyeOpen,
  ~glasgowVerbalResponse,
  ~glasgowMotorResponse,
  ~glasgowTotalCalculated,
  ~limbResponseUpperExtremityRight,
  ~limbResponseUpperExtremityLeft,
  ~limbResponseLowerExtremityRight,
  ~limbResponseLowerExtremityLeft,
) => {
  inPronePosition: inPronePosition,
  consciousnessLevel: consciousnessLevel,
  consciousnessLevelDetails: consciousnessLevelDetails,
  leftPupilSize: leftPupilSize,
  leftPupilSizeDetails: leftPupilSizeDetails,
  leftPupilLightReaction: leftPupilLightReaction,
  leftPupilLightReactionDetails: leftPupilLightReactionDetails,
  rightPupilSize: rightPupilSize,
  rightPupilSizeDetails: rightPupilSizeDetails,
  rightPupilLightReaction: rightPupilLightReaction,
  rightPupilLightReactionDetails: rightPupilLightReactionDetails,
  glasgowEyeOpen: glasgowEyeOpen,
  glasgowVerbalResponse: glasgowVerbalResponse,
  glasgowMotorResponse: glasgowMotorResponse,
  glasgowTotalCalculated: glasgowTotalCalculated,
  limbResponseUpperExtremityRight: limbResponseUpperExtremityRight,
  limbResponseUpperExtremityLeft: limbResponseUpperExtremityLeft,
  limbResponseLowerExtremityRight: limbResponseLowerExtremityRight,
  limbResponseLowerExtremityLeft: limbResponseLowerExtremityLeft,
}

let makeConsciousnessLevel = consciousnessLevel => {
  switch consciousnessLevel {
  | "ALERT" => Alert
  | "DROWSY" => Drowsy
  | "STUPOROUS" => Stuporous
  | "COMATOSE" => Comatose
  | "CANNOT_BE_ASSESSED" => CannotBeAssessed
  | "UNKNOWN"
  | _ =>
    Unknown
  }
}

let encodeConConsciousnessLevel = consciousnessLevel => {
  switch consciousnessLevel {
  | Alert => "ALERT"
  | Drowsy => "DROWSY"
  | Stuporous => "STUPOROUS"
  | Comatose => "COMATOSE"
  | CannotBeAssessed => "CANNOT_BE_ASSESSED"
  | Unknown => "UNKNOWN"
  }
}

let makeLightReaction = lightReaction => {
  switch lightReaction {
  | "BRISK" => Brisk
  | "SLUGGISH" => Sluggish
  | "FIXED" => Fixed
  | "CANNOT_BE_ASSESSED" => CannotBeAssessed
  | "UNKNOWN"
  | _ =>
    Unknown
  }
}

let encodeLightReaction = lightReaction => {
  switch lightReaction {
  | Brisk => "BRISK"
  | Sluggish => "SLUGGISH"
  | Fixed => "FIXED"
  | CannotBeAssessed => "CANNOT_BE_ASSESSED"
  | Unknown => "UNKNOWN"
  }
}

let makeLimpResponse = limpResponse => {
  switch limpResponse {
  | "STRONG" => Strong
  | "MODERATE" => Moderate
  | "WEAK" => Weak
  | "FLEXION" => Flexion
  | "EXTENSION" => Extension
  | "NONE" => NONE_
  | "UNKNOWN"
  | _ =>
    Unknown
  }
}

let encodeLimpResponse = limbResponse => {
  switch limbResponse {
  | Strong => "STRONG"
  | Moderate => "MODERATE"
  | Weak => "WEAK"
  | Flexion => "FLEXION"
  | Extension => "EXTENSION"
  | NONE_ => "NONE"
  | Unknown => "UNKNOWN"
  }
}

let lightReactionToString = lightReaction => {
  switch lightReaction {
  | Brisk => "Brisk"
  | Sluggish => "Sluggish"
  | Fixed => "Fixed"
  | CannotBeAssessed => "Cannot be assessed"
  | Unknown => "Unknown"
  }
}

let consciousnessLevelToString = consciousnessLevel => {
  switch consciousnessLevel {
  | Alert => "Alert"
  | Drowsy => "Drowsy"
  | Stuporous => "Stuporous"
  | Comatose => "Comatose"
  | CannotBeAssessed => "Cannot be assessed"
  | Unknown => "Unknown"
  }
}

let limpResponseToString = limpResponse => {
  switch limpResponse {
  | Strong => "Strong"
  | Moderate => "Moderate"
  | Weak => "Weak"
  | Flexion => "Flexion"
  | Extension => "Extension"
  | NONE_ => "None"
  | Unknown => "Unknown"
  }
}

let eyeOpenToString = eyeOpen => {
  switch eyeOpen {
  | 1 => "1 - None"
  | 2 => "2 - Pain"
  | 3 => "3 - To Speech"
  | 4 => "4 - Spontaneous"
  | _ => "Unknown"
  }
}

let motorResposneToString = eyeOpen => {
  switch eyeOpen {
  | 1 => "1 - None"
  | 2 => "2 - Incomprehensible words/Moans to pain"
  | 3 => "3 - Abnormal Flexion"
  | 4 => "4 - Withdrawing"
  | 5 => "5 - Localizing/Withdrawl to touch"
  | 6 => "6 - Obeying/Normal Activity"
  | _ => "Unknown"
  }
}

let verbalResposneToString = eyeOpen => {
  switch eyeOpen {
  | 1 => "1 - None"
  | 2 => "2 - Incomprehensible words/Moans to pain"
  | 3 => "3 - Inappropriate words/Cry to pain"
  | 4 => "4 - Confused/Irritable"
  | 5 => "5 - Oriented/Coos/Babbies"
  | _ => "Unknown"
  }
}

let makeFromJs = dailyRound => {
  make(
    ~inPronePosition=dailyRound["in_prone_position"]->Js.Nullable.toOption,
    ~consciousnessLevel=makeConsciousnessLevel(dailyRound["consciousness_level"]),
    ~consciousnessLevelDetails=dailyRound["consciousness_level_detail"]->Js.Nullable.toOption,
    ~leftPupilSize=dailyRound["left_pupil_size"]->Js.Nullable.toOption,
    ~leftPupilSizeDetails=dailyRound["left_pupil_size_detail"]->Js.Nullable.toOption,
    ~leftPupilLightReaction=makeLightReaction(dailyRound["left_pupil_light_reaction"]),
    ~leftPupilLightReactionDetails=dailyRound["left_pupil_light_reaction_detail"]->Js.Nullable.toOption,
    ~rightPupilSize=dailyRound["right_pupil_size"]->Js.Nullable.toOption,
    ~rightPupilSizeDetails=dailyRound["right_pupil_size_detail"]->Js.Nullable.toOption,
    ~rightPupilLightReaction=makeLightReaction(dailyRound["right_pupil_light_reaction"]),
    ~rightPupilLightReactionDetails=dailyRound["right_pupil_light_reaction_detail"]->Js.Nullable.toOption,
    ~glasgowEyeOpen=dailyRound["glasgow_eye_open"]->Js.Nullable.toOption,
    ~glasgowVerbalResponse=dailyRound["glasgow_verbal_response"]->Js.Nullable.toOption,
    ~glasgowMotorResponse=dailyRound["glasgow_motor_response"]->Js.Nullable.toOption,
    ~glasgowTotalCalculated=dailyRound["glasgow_total_calculated"]->Js.Nullable.toOption,
    ~limbResponseUpperExtremityRight=makeLimpResponse(
      dailyRound["limb_response_upper_extremity_right"],
    ),
    ~limbResponseUpperExtremityLeft=makeLimpResponse(
      dailyRound["limb_response_upper_extremity_left"],
    ),
    ~limbResponseLowerExtremityRight=makeLimpResponse(
      dailyRound["limb_response_lower_extremity_right"],
    ),
    ~limbResponseLowerExtremityLeft=makeLimpResponse(
      dailyRound["limb_response_lower_extremity_left"],
    ),
  )
}

let inPronePosition = t => t.inPronePosition
let consciousnessLevel = t => t.consciousnessLevel
let consciousnessLevelDetails = t => t.consciousnessLevelDetails
let leftPupilSize = t => t.leftPupilSize
let leftPupilSizeDetails = t => t.leftPupilSizeDetails
let leftPupilLightReaction = t => t.leftPupilLightReaction
let leftPupilLightReactionDetails = t => t.leftPupilLightReactionDetails
let rightPupilSize = t => t.rightPupilSize
let rightPupilSizeDetails = t => t.rightPupilSizeDetails
let rightPupilLightReaction = t => t.rightPupilLightReaction
let rightPupilLightReactionDetails = t => t.rightPupilLightReactionDetails
let glasgowEyeOpen = t => t.glasgowEyeOpen
let glasgowVerbalResponse = t => t.glasgowVerbalResponse
let glasgowMotorResponse = t => t.glasgowMotorResponse
let glasgowTotalCalculated = t => t.glasgowTotalCalculated
let limbResponseUpperExtremityRight = t => t.limbResponseUpperExtremityRight
let limbResponseUpperExtremityLeft = t => t.limbResponseUpperExtremityLeft
let limbResponseLowerExtremityRight = t => t.limbResponseLowerExtremityRight
let limbResponseLowerExtremityLeft = t => t.limbResponseLowerExtremityLeft

let showStatus = data => {
  let total = ref(0.0)
  let count = ref(0.0)

  // if inPronePosition(data) === true {
  //   total := 9.0
  // } else {
  //   total := 13.0
  //   if leftPupilSize(data) !== Some("") {
  //     count := count.contents +. 1.0
  //   }
  //   if leftPupilLightReaction(data) !== Some("") {
  //     count := count.contents +. 1.0
  //   }
  //   if rightPupilSize(data) !== Some("") {
  //     count := count.contents +. 1.0
  //   }
  //   if rightPupilLightReaction(data) !== Some("") {
  //     count := count.contents +. 1.0
  //   }
  // }

  // if consciousnessLevel(data) !== "" {
  //   count := count.contents +. 1.0
  // }

  // if glasgowEyeOpen(data) !== "" {
  //   count := count.contents +. 1.0
  // }
  // if glasgowVerbalResponse(data) !== "" {
  //   count := count.contents +. 1.0
  // }
  // if glasgowMotorResponse(data) !== "" {
  //   count := count.contents +. 1.0
  // }
  // if glasgowTotalCalculated(data) !== "" {
  //   count := count.contents +. 1.0
  // }
  // if limbResponseUpperExtremityRight(data) !== "" {
  //   count := count.contents +. 1.0
  // }
  // if limbResponseUpperExtremityLeft(data) !== "" {
  //   count := count.contents +. 1.0
  // }
  // if limbResponseLowerExtremityRight(data) !== "" {
  //   count := count.contents +. 1.0
  // }
  // if limbResponseLowerExtremityLeft(data) !== "" {
  //   count := count.contents +. 1.0
  // }

  Js.Float.toFixed(count.contents /. total.contents *. 100.0)
}
