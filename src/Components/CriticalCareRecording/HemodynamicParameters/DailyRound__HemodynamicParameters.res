let str = React.string
open CriticalCare__Types

@react.component
let make = (
  ~hemodynamicParameter,
  ~title,
  ~renderOptionalDescription,
  ~renderLine,
  ~renderOptionalFloat,
  ~renderOptionalInt,
) => {
  <div>
    <div>
      {switch HemodynamicParameters.bp(hemodynamicParameter) {
      | Some(data) =>
        <div className="px-4 py-2 border bg-gray-100 m-1 rounded-lg shadow md:w-1/2 w-full">
          {title("Blood Pressure: ")}
          <div>
            <span className="font-semibold leading-relaxed"> {str("Systolic: ")} </span>
            {React.int(data.systolic)}
          </div>
          <div>
            <span className="font-semibold leading-relaxed"> {str("Diastolic: ")} </span>
            {React.int(data.diastolic)}
          </div>
          <div>
            <span className="font-semibold leading-relaxed"> {str("Mean: ")} </span>
            {str(Js.Float.toFixedWithPrecision(data.mean, ~digits=2))}
          </div>
        </div>

      | None => React.null
      }}
    </div>
    {renderOptionalInt("Pulse", HemodynamicParameters.pulse(hemodynamicParameter))}
    {renderOptionalFloat("Temperature", HemodynamicParameters.temperature(hemodynamicParameter))}
    {renderOptionalInt("Respiratory Rate", HemodynamicParameters.resp(hemodynamicParameter))}
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
