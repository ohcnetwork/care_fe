type t = {
    lossOfConciousness: string,
    leftPupilSize: string,
    leftPupilResponse: string,
    rightPuilSize: string,
    rightPupilResponse: string,
    eyeOpen: string,
    verbalResponse: string,
    motorResponse: string,
    totalGlascowScale: string,
    upperExtremityR: string,
    upperExtremityL: string,
    lowerExtremityR: string,
    lowerExtremityL: string,
}

let lossOfConciousness = t => t.lossOfConciousness
let leftPupilSize = t => t.leftPupilResponse
let leftPupilResponse = t => t.leftPupilResponse
let rightPuilSize = t=> t.rightPuilSize
let rightPupilResponse = t => t.rightPupilResponse
let eyeOpen = t => t.eyeOpen
let verbalResponse = t => t.verbalResponse
let motorResponse = t => t.motorResponse
let totalGlascowScale = t => t.totalGlascowScale
let upperExtremityR = t => t.upperExtremityR
let upperExtremityL = t => t.upperExtremityL
let lowerExtremityR = t => t.lowerExtremityR
let lowerExtremityL = t => t.lowerExtremityL

let init = {
    lossOfConciousness: "",
    leftPupilSize: "",
    leftPupilResponse: "",
    rightPuilSize: "",
    rightPupilResponse: "",
    eyeOpen: "",
    verbalResponse: "",
    motorResponse: "",
    totalGlascowScale: "",
    upperExtremityR: "",
    upperExtremityL: "",
    lowerExtremityR: "",
    lowerExtremityL: "",
}