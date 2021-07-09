type t = {
  pronePosition: bool,
  levelOfConciousness: string,
  locDescription: string,
  leftPupilSize: option<string>,
  leftSizeDescription: option<string>,
  leftPupilReaction: option<string>,
  leftReactionDescription: option<string>,
  rightPupilSize: option<string>,
  rightSizeDescription: option<string>,
  rightPupilReaction: option<string>,
  rightReactionDescription: option<string>,
  eyeOpen: string,
  verbalResponse: string,
  motorResponse: string,
  totalGlascowScale: string,
  upperExtremityR: string,
  upperExtremityL: string,
  lowerExtremityR: string,
  lowerExtremityL: string,
}

let pronePosition = t => t.pronePosition
let levelOfConciousness = t => t.levelOfConciousness
let locDescription = t => t.locDescription
let leftPupilSize = t => t.leftPupilSize
let leftSizeDescription = t => t.leftSizeDescription
let leftPupilReaction = t => t.leftPupilReaction
let leftReactionDescription = t => t.leftReactionDescription
let rightPupilSize = t => t.rightPupilSize
let rightSizeDescription = t => t.rightSizeDescription
let rightPupilReaction = t => t.rightPupilReaction
let rightReactionDescription = t => t.rightReactionDescription
let eyeOpen = t => t.eyeOpen
let verbalResponse = t => t.verbalResponse
let motorResponse = t => t.motorResponse
let totalGlascowScale = t => t.totalGlascowScale
let upperExtremityR = t => t.upperExtremityR
let upperExtremityL = t => t.upperExtremityL
let lowerExtremityR = t => t.lowerExtremityR
let lowerExtremityL = t => t.lowerExtremityL

type action =
  | SetPronePosition(bool)
  | SetLevelOfConciousness(string)
  | SetLocDescription(string)
  | SetLeftPupilSize(option<string>)
  | SetLeftSizeDescription(option<string>)
  | SetLeftPupilReaction(option<string>)
  | SetLeftReactionDescription(option<string>)
  | SetRightPupilSize(option<string>)
  | SetRightSizeDescription(option<string>)
  | SetRightReactionDescription(option<string>)
  | SetRightPupilReaction(option<string>)
  | SetEyeOpen(string)
  | SetVerbalResponse(string)
  | SetMotorResponse(string)
  | SetTotalGlascowScale(string)
  | SetUpperExtremityR(string)
  | SetUpperExtremityL(string)
  | SetLowerExtremityR(string)
  | SetLowerExtremityL(string)

let showStatus = data => {
  let total = ref(0.0)
  let count = ref(0.0)

  if pronePosition(data) === true {
    total := 9.0
  } else {
    total := 13.0
    if leftPupilSize(data) !== Some("") {
      count := count.contents +. 1.0
    }
    if leftPupilReaction(data) !== Some("") {
      count := count.contents +. 1.0
    }
    if rightPupilSize(data) !== Some("") {
      count := count.contents +. 1.0
    }
    if rightPupilReaction(data) !== Some("") {
      count := count.contents +. 1.0
    }
  }

  if levelOfConciousness(data) !== "" {
    count := count.contents +. 1.0
  }

  if eyeOpen(data) !== "" {
    count := count.contents +. 1.0
  }
  if verbalResponse(data) !== "" {
    count := count.contents +. 1.0
  }
  if motorResponse(data) !== "" {
    count := count.contents +. 1.0
  }
  if totalGlascowScale(data) !== "" {
    count := count.contents +. 1.0
  }
  if upperExtremityR(data) !== "" {
    count := count.contents +. 1.0
  }
  if upperExtremityL(data) !== "" {
    count := count.contents +. 1.0
  }
  if lowerExtremityR(data) !== "" {
    count := count.contents +. 1.0
  }
  if lowerExtremityL(data) !== "" {
    count := count.contents +. 1.0
  }

  Js.Float.toFixed(count.contents /. total.contents *. 100.0)
}
