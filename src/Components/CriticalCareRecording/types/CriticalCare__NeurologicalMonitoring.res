type t = {
    levelOfConciousness: string,
    leftPupilSize: string,
    leftPupilReaction: string,
    rightPupilSize: string,
    rightPupilReaction: string,
    eyeOpen: string,
    verbalResponse: string,
    motorResponse: string,
    totalGlascowScale: string,
    upperExtremityR: string,
    upperExtremityL: string,
    lowerExtremityR: string,
    lowerExtremityL: string,
}

let levelOfConciousness = t => t.levelOfConciousness
let leftPupilSize = t => t.leftPupilSize
let leftPupilReaction = t => t.leftPupilReaction
let rightPupilSize = t=> t.rightPupilSize
let rightPupilReaction = t => t.rightPupilReaction
let eyeOpen = t => t.eyeOpen
let verbalResponse = t => t.verbalResponse
let motorResponse = t => t.motorResponse
let totalGlascowScale = t => t.totalGlascowScale
let upperExtremityR = t => t.upperExtremityR
let upperExtremityL = t => t.upperExtremityL
let lowerExtremityR = t => t.lowerExtremityR
let lowerExtremityL = t => t.lowerExtremityL

let init = {
    levelOfConciousness: "",
    leftPupilSize: "",
    leftPupilReaction: "",
    rightPupilSize: "",
    rightPupilReaction: "",
    eyeOpen: "",
    verbalResponse: "",
    motorResponse: "",
    totalGlascowScale: "",
    upperExtremityR: "",
    upperExtremityL: "",
    lowerExtremityR: "",
    lowerExtremityL: "",
}