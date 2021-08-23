let str = React.string
open CriticalCare__Types

let renderLine = (title, value) => {
  <div>
    <span className="font-semibold"> {str(`${title}:`)} </span>
    <span className="pl-2"> {str(value)} </span>
  </div>
}

let renderIndicators = (title, value, isMin, isMax, minText, maxText) => {
  let indicator = if isMax {
    <span className="inline-block bg-red-200 rounded-full px-2 mx-3 my-1 text-xs py-1 text-red-800">
      <i className="fas fa-exclamation-triangle mr-2" /> {str(maxText)}
    </span>
  } else if isMin {
    <span
      className="inline-block bg-yellow-200 rounded-full px-2 mx-3 my-1 text-xs py-1 text-yellow-800">
      <i className="fas fa-exclamation-triangle mr-2" /> {str(minText)}
    </span>
  } else {
    <span
      className="inline-block bg-green-200 rounded-full px-2 mx-3 my-1 text-xs py-1 text-green-800">
      <i className="far fa-check-circle mr-2" /> {str("Normal")}
    </span>
  }

  <div className="flex items-center">
    <span className="font-semibold"> {str(`${title}:`)} </span>
    <span className="pl-2"> {str(value)} </span>
    {indicator}
  </div>
}

let renderOptionalIntWithIndicators = (title, value, min, max, minText, maxText) => {
  Belt.Option.mapWithDefault(value, React.null, v => {
    renderIndicators(title, string_of_int(v), v < min, v > max, minText, maxText)
  })
}

let renderOptionalFloatWithIndicators = (title, value, min, max, minText, maxText) => {
  Belt.Option.mapWithDefault(value, React.null, v =>
    renderIndicators(title, Js.Float.toString(v), v < min, v > max, minText, maxText)
  )
}

let renderIntWithIndicators = (title, value, min, max, minText, maxText) => {
  renderIndicators(title, string_of_int(value), value < min, value > max, minText, maxText)
}

let renderFloatWithIndicators = (title, value, min, max, minText, maxText) => {
  renderIndicators(title, Js.Float.toString(value), value < min, value > max, minText, maxText)
}

let renderOptionalInt = (title, value) => {
  Belt.Option.mapWithDefault(value, React.null, v => renderLine(title, string_of_int(v)))
}

let renderOptionalFloat = (title, value) => {
  Belt.Option.mapWithDefault(value, React.null, v => renderLine(title, Js.Float.toString(v)))
}

let renderOptionalBool = (title, value) => {
  Belt.Option.mapWithDefault(value, React.null, v => renderLine(title, v ? "Yes" : "No"))
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
export make = (
  ~id,
  ~facilityId,
  ~patientId,
  ~consultationId,
  ~dailyRound: CriticalCare__DailyRound.t,
) => {
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
  let others = DailyRound.others(dailyRound)

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
          <CriticalCare__PageTitle title="General" />
          <DailyRound__General others title renderOptionalDescription />
        </div>
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
          <DailyRound__ABG
            arterialBloodGasAnalysis
            renderOptionalIntWithIndicators
            renderOptionalFloatWithIndicators
          />
        </div>
        <div>
          <CriticalCare__PageTitle title="Blood Sugar" />
          <DailyRound__BloodSugar
            bloodSugar renderOptionalIntWithIndicators renderOptionalFloat renderLine
          />
        </div>
        <div>
          <CriticalCare__PageTitle title="Dialysis" />
          <DailyRound__Dialysis dialysis renderOptionalInt />
        </div>
        <div>
          <CriticalCare__PageTitle title="Hemodynamic Parameters" />
          <DailyRound__HemodynamicParameters
            hemodynamicParameter
            renderOptionalIntWithIndicators
            renderIntWithIndicators
            renderOptionalFloatWithIndicators
            renderFloatWithIndicators
            renderLine
            renderOptionalDescription
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
        <div>
          <CriticalCare__PageTitle title="Pressure Sore" />
          <DailyRound__PressureSore pressureSoreParameter />
        </div>
        <div>
          <CriticalCare__PageTitle title="Ventilator Parameters" />
          <DailyRound__VentilatorParameters
            ventilatorParameters renderOptionalInt renderOptionalIntWithIndicators renderOptionalFloatWithIndicators renderLine
          />
        </div>
        <div>
          <CriticalCare__PageTitle title="Others" />
          <DailyRound__Others others renderOptionalIntWithIndicators renderOptionalBool />
        </div>
      </div>
    </div>
  </div>
}
