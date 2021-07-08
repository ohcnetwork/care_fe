type t = {
  pronePosition: bool,
  levelOfConciousness: string,
  locDescription: string,
  leftPupilSize: string,
  leftSizeDescription: string,
  leftPupilReaction: string,
  leftReactionDescription: string,
  rightPupilSize: string,
  rightSizeDescription: string,
  rightPupilReaction: string,
  rightReactionDescription: string,
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

let showStatus = data => {
  let total = 13.0
  let count = ref(0.0)

  if levelOfConciousness(data) !== "" {
    count := count.contents +. 1.0
  }
  if leftPupilSize(data) !== "" {
    count := count.contents +. 1.0
  }
  if leftPupilReaction(data) !== "" {
    count := count.contents +. 1.0
  }
  if rightPupilSize(data) !== "" {
    count := count.contents +. 1.0
  }
  if rightPupilReaction(data) !== "" {
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

  Js.Float.toFixed(count.contents /. total *. 100.0)
}
