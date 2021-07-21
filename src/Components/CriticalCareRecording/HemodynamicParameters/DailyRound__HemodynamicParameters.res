let str = React.string
open CriticalCare__Types

@react.component
let make = (
  ~hemodynamicParameter,
  ~title,
  ~renderOptionalDescription,
  ~renderLine,
  ~renderIntWithIndicators,
  ~renderOptionalIntWithIndicators,
  ~renderFloatWithIndicators,
  ~renderOptionalFloatWithIndicators,
) => {
  <div>
    <div>
      {switch HemodynamicParameters.bp(hemodynamicParameter) {
      | Some(data) =>
        <div className="px-4 py-2 border bg-gray-100 m-1 rounded-lg shadow md:w-1/2 w-full">
          {title("Blood Pressure: ")}
          {renderIntWithIndicators("Systolic", data.systolic, 100, 140, "Low", "High")}
          {renderIntWithIndicators("Diastolic", data.diastolic, 50, 90, "Low", "High")}
          {renderFloatWithIndicators("Mean", data.mean, 65.0, 75.0, "Low", "High")}
        </div>

      | None => React.null
      }}
    </div>
    {renderOptionalIntWithIndicators(
      "Pulse",
      HemodynamicParameters.pulse(hemodynamicParameter),
      40,
      100,
      "Bradycardia",
      "Tachycardia",
    )}
    {renderOptionalFloatWithIndicators(
      "Temperature",
      HemodynamicParameters.temperature(hemodynamicParameter),
      97.6,
      99.6,
      "Low",
      "High",
    )}
    {renderOptionalIntWithIndicators(
      "Respiratory Rate",
      HemodynamicParameters.resp(hemodynamicParameter),
      12,
      16,
      "Low",
      "High",
    )}
    {renderLine(
      "Rhythm",
      HemodynamicParameters.rhythmToString(HemodynamicParameters.rhythm(hemodynamicParameter)),
    )}
    {renderOptionalDescription(
      "Rhythm Description",
      HemodynamicParameters.rhythmDetails(hemodynamicParameter),
    )}
  </div>
}
