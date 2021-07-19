let str = React.string

@react.component
let make = (~hemodynamicParameter) => {
  <div
    className="border rounded-lg bg-white shadow h-full hover:border-primary-500 text-black mt-4 p-4">
    <h3> {str("Hemodynamic Parameters")} </h3>
    <div>
      <span className="font-semibold leading-relaxed"> {str("Blood Pressure: ")} </span>
      {switch CriticalCare__HemodynamicParameters.bp(hemodynamicParameter) {
      | Some(data) =>
        <div>
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
    <div>
      <span className="font-semibold leading-relaxed"> {str("Pulse: ")} </span>
      {switch CriticalCare__HemodynamicParameters.pulse(hemodynamicParameter) {
      | Some(data) => React.int(data)
      | None => React.null
      }}
    </div>
    <div>
      <span className="font-semibold leading-relaxed"> {str("Temperature: ")} </span>
      {switch CriticalCare__HemodynamicParameters.temperature(hemodynamicParameter) {
      | Some(data) => React.float(data)
      | None => React.null
      }}
    </div>
    <div>
      <span className="font-semibold leading-relaxed"> {str("Respiratory Rate: ")} </span>
      {switch CriticalCare__HemodynamicParameters.resp(hemodynamicParameter) {
      | Some(data) => React.int(data)
      | None => React.null
      }}
    </div>
    <div>
      <span className="font-semibold leading-relaxed"> {str("Rhythm: ")} </span>
      {str(
        CriticalCare__HemodynamicParameters.rhythmToString(
          CriticalCare__HemodynamicParameters.rhythm(hemodynamicParameter),
        ),
      )}
    </div>
    <div>
      <span className="font-semibold leading-relaxed"> {str("Rhythm Description: ")} </span>
      {switch CriticalCare__HemodynamicParameters.rhythmDetails(hemodynamicParameter) {
      | Some(data) => str(data)
      | None => React.null
      }}
    </div>
  </div>
}
