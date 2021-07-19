let str = React.string
open CriticalCare__Types

@react.component
let make = (~dailyRound, ~facilityId, ~patientId, ~consultationId) => {
  let neurologicalMonitoring = CriticalCare__DailyRound.neurologicalMonitoring(dailyRound)
  let hemodynamicParameter = CriticalCare__DailyRound.hemodynamicParameters(dailyRound)
  let nursingCare = CriticalCare__DailyRound.nursingCare(dailyRound)
  let arterialBloodGasAnalysis = CriticalCare__DailyRound.arterialBloodGasAnalysis(dailyRound)
  let ioBalance = CriticalCare__DailyRound.ioBalance(dailyRound)
  let dialysis = CriticalCare__DailyRound.dialysis(dailyRound)
  let pressureSoreParameter = CriticalCare__DailyRound.pressureSoreParameter(dailyRound)
  let bloodSugar = CriticalCare__DailyRound.bloodSugar(dailyRound)
  let ventilatorParameters = CriticalCare__DailyRound.ventilatorParameters(dailyRound)
  let medicine = CriticalCare__DailyRound.medicine(dailyRound)

  React.useEffect1(() => {
    Js.log(dailyRound)
    None
  }, [dailyRound])

  <div className="m-4">
    <div className="my-4">
      <Link
        className="btn btn-default bg-white"
        href={`/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/updates`}>
        {str("Go back")}
      </Link>
    </div>
    <DailyRound__ABG arterialBloodGasAnalysis />
    <DailyRound__BloodSugar bloodSugar />
    <DailyRound__Dialysis dialysis />
    <DailyRound__HemodynamicParameters hemodynamicParameter />
  </div>
}
