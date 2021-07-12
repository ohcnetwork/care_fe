export type t = {
  createdAt: Js.Date.t,
  admittedTo: string,
  createdByTelemedicine: bool,
  neurologicalMonitoring: CriticalCare__NeurologicalMonitoring.t,
  hemodynamicParameter: CriticalCare__HemodynamicParameters.t,
}

let make = (
  ~createdAt,
  ~admittedTo,
  ~createdByTelemedicine,
  ~neurologicalMonitoring,
  ~hemodynamicParameter,
) => {
  createdAt: createdAt,
  admittedTo: admittedTo,
  createdByTelemedicine: createdByTelemedicine,
  neurologicalMonitoring: neurologicalMonitoring,
  hemodynamicParameter: hemodynamicParameter,
}

let neurologicalMonitoring = t => t.neurologicalMonitoring
let hemodynamicParameters = t => t.hemodynamicParameter

let makeFromJs = dailyRound => {
  make(
    ~createdAt=DateFns.decodeISO(dailyRound["created_date"]),
    ~admittedTo=dailyRound["admitted_to"],
    ~createdByTelemedicine=dailyRound["created_by_telemedicine"],
    ~neurologicalMonitoring=CriticalCare__NeurologicalMonitoring.makeFromJs(dailyRound),
    ~hemodynamicParameter=CriticalCare__HemodynamicParameters.makeFromJs(dailyRound),
  )
}
