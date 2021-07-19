let str = React.string

@react.component
let make = (~bloodSugar) => {
  <div
    className="border rounded-lg bg-white shadow h-full hover:border-primary-500 text-black mt-4 p-4">
    <h3> {str("Blood Sugar")} </h3>
    <div>
      <span className="font-semibold leading-relaxed"> {str("Blood Sugar Level: ")} </span>
      {switch CriticalCare_BloodSugar.bloodsugar_level(bloodSugar) {
      | Some(data) => React.int(data)
      | None => React.null
      }}
    </div>
    <div>
      <span className="font-semibold leading-relaxed"> {str("Dosage: ")} </span>
      {switch CriticalCare_BloodSugar.dosage(bloodSugar) {
      | Some(data) => React.float(data)
      | None => React.null
      }}
    </div>
    <div>
      <span className="font-semibold leading-relaxed"> {str("Frequency: ")} </span>
      {str(
        CriticalCare_BloodSugar.frequencyToString(CriticalCare_BloodSugar.frequency(bloodSugar)),
      )}
    </div>
  </div>
}
