export type t = {
  createdAt: Js.Date.t,
  admittedTo: string,
  createdByTelemedicine: bool,
  neurologicalMonitoring: CriticalCare__NeurologicalMonitoring.t,
  hemodynamicParameter: CriticalCare__HemodynamicParameters.t,
  nursingCare: CriticalCare__NursingCare.t,
  arterialBloodGasAnalysis: CriticalCare__ABGAnalysis.t,
  ioBalance: CriticalCare__IOBalance.t,
}

let make = (
  ~createdAt,
  ~admittedTo,
  ~createdByTelemedicine,
  ~neurologicalMonitoring,
  ~hemodynamicParameter,
  ~nursingCare,
  ~arterialBloodGasAnalysis,
  ~ioBalance,
) => {
  createdAt: createdAt,
  admittedTo: admittedTo,
  createdByTelemedicine: createdByTelemedicine,
  neurologicalMonitoring: neurologicalMonitoring,
  hemodynamicParameter: hemodynamicParameter,
  nursingCare: nursingCare,
  arterialBloodGasAnalysis: arterialBloodGasAnalysis,
  ioBalance: ioBalance
}

let neurologicalMonitoring = t => t.neurologicalMonitoring
let hemodynamicParameters = t => t.hemodynamicParameter
let nursingCare = t => t.nursingCare
let arterialBloodGasAnalysis = t => t.arterialBloodGasAnalysis
let ioBalance = t => t.ioBalance

let makeFromJs = dailyRound => {
  make(
    ~createdAt=DateFns.decodeISO(dailyRound["created_date"]),
    ~admittedTo=dailyRound["admitted_to"],
    ~createdByTelemedicine=dailyRound["created_by_telemedicine"],
    ~neurologicalMonitoring=CriticalCare__NeurologicalMonitoring.makeFromJs(dailyRound),
    ~hemodynamicParameter=CriticalCare__HemodynamicParameters.makeFromJs(dailyRound),
    ~nursingCare=CriticalCare__NursingCare.makeFromJs(dailyRound),
    ~arterialBloodGasAnalysis=CriticalCare__ABGAnalysis.makeFromJs(dailyRound),
    ~ioBalance=CriticalCare__IOBalance.makeFromJs(dailyRound),
  )
}
