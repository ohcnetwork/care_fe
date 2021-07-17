export type t = {
  createdAt: Js.Date.t,
  admittedTo: string,
  createdByTelemedicine: bool,
  neurologicalMonitoring: CriticalCare__NeurologicalMonitoring.t,
  hemodynamicParameter: CriticalCare__HemodynamicParameters.t,
  nursingCare: CriticalCare__NursingCare.t,
  arterialBloodGasAnalysis: CriticalCare__ABGAnalysis.t,
  ioBalance: CriticalCare__IOBalance.t,
  dialysis: CriticalCare_Dialysis.t,
  bloodSugar: CriticalCare_BloodSugar.t,
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
  ~dialysis,
  ~bloodSugar,
) => {
  createdAt: createdAt,
  admittedTo: admittedTo,
  createdByTelemedicine: createdByTelemedicine,
  neurologicalMonitoring: neurologicalMonitoring,
  hemodynamicParameter: hemodynamicParameter,
  nursingCare: nursingCare,
  arterialBloodGasAnalysis: arterialBloodGasAnalysis,
  ioBalance: ioBalance,
  dialysis: dialysis,
  bloodSugar: bloodSugar,
}

let neurologicalMonitoring = t => t.neurologicalMonitoring
let hemodynamicParameters = t => t.hemodynamicParameter
let nursingCare = t => t.nursingCare
let arterialBloodGasAnalysis = t => t.arterialBloodGasAnalysis
let ioBalance = t => t.ioBalance
let dialysis = t => t.dialysis
let bloodSugar = t => t.bloodSugar

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
    ~dialysis=CriticalCare_Dialysis.makeFromJs(dailyRound),
    ~bloodSugar=CriticalCare_BloodSugar.makeFromJs(dailyRound),
  )
}
