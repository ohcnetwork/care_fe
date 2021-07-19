let str = React.string
open CriticalCare__Types

let renderLine = (title, value) => {
  <div>
    <span className="font-semibold"> {str(`${title}:`)} </span>
    <span className="pl-2"> {str(value)} </span>
  </div>
}

let renderOptionalInt = (title, value) => {
  Belt.Option.mapWithDefault(value, React.null, v => renderLine(title, string_of_int(v)))
}

let renderOptionalFloat = (title, value) => {
  Belt.Option.mapWithDefault(value, React.null, v => renderLine(title, Js.Float.toString(v)))
}

let renderOptionalDescription = (title, value) => {
  switch value {
  | Some(v) =>
    <div>
      <span className="font-semibold"> {str(`${title}:`)} </span>
      <span className="pl-2"> {str(v)} </span>
    </div>
  | None => React.null
  }
}

let title = text => {
  <div className="text-lg font-bold mt-2"> {str(text)} </div>
}

@react.component
export make = (~id, ~facilityId, ~patientId, ~consultationId, ~dailyRound) => {
  let neurologicalMonitoring = DailyRound.neurologicalMonitoring(dailyRound)
  let hemodynamicParameter = DailyRound.hemodynamicParameters(dailyRound)
  let nursingCare = DailyRound.nursingCare(dailyRound)
  let arterialBloodGasAnalysis = DailyRound.arterialBloodGasAnalysis(dailyRound)
  let ioBalance = DailyRound.ioBalance(dailyRound)
  let dialysis = DailyRound.dialysis(dailyRound)
  let pressureSoreParameter = DailyRound.pressureSoreParameter(dailyRound)
  let bloodSugar = DailyRound.bloodSugar(dailyRound)
  let ventilatorParameters = DailyRound.ventilatorParameters(dailyRound)
  let medicine = DailyRound.medicine(dailyRound)

  <div className=" px-4 py-5sm:px-6 max-w-5xl mx-auto mt-4">
    <div>
      <Link
        className="btn btn-default bg-white"
        href={`/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}`}>
        {str("Go back to Consultation")}
      </Link>
    </div>
    <div>
      <div
        className="bg-white px-2 md:px-6 py-5 border-b border-gray-200 sm:px-6 max-w-5xl mx-auto border mt-4 shadow rounded-lg">
        <div className="text-5xl"> {str("Consultation Update")} </div>
        <div>
          <CriticalCare__PageTitle title="Neurological Monitoring" />
          <DailyRound__NeurologicalMonitoring
            neurologicalMonitoring title renderLine renderOptionalDescription renderOptionalInt
          />
        </div>
        <div>
          <CriticalCare__PageTitle title="Medicines" />
          <DailyRound__Medicines prescriptions={medicine} />
        </div>
        <div>
          <CriticalCare__PageTitle title="Arterial Blood Gas Analysis" />
          <DailyRound__ABG arterialBloodGasAnalysis renderOptionalInt renderOptionalFloat />
        </div>
        <div>
          <CriticalCare__PageTitle title="Blood Sugar" />
          <DailyRound__BloodSugar bloodSugar renderOptionalInt renderOptionalFloat renderLine />
        </div>
        <div>
          <CriticalCare__PageTitle title="Dialysis" />
          <DailyRound__Dialysis dialysis renderOptionalInt />
        </div>
        <div>
          <CriticalCare__PageTitle title="Hemodynamic Parameters" />
          <DailyRound__HemodynamicParameters
            hemodynamicParameter
            renderOptionalInt
            renderLine
            renderOptionalDescription
            renderOptionalFloat
            title
          />
        </div>
        <div>
          <CriticalCare__PageTitle title="I/O Balance" />
          <DailyRound__IOBalance ioBalance title renderOptionalDescription />
        </div>
        <div>
          <CriticalCare__PageTitle title="Nursing Care" />
          <DailyRound__NursingCare nursingCare renderLine />
        </div>
      </div>
    </div>
  </div>
}
