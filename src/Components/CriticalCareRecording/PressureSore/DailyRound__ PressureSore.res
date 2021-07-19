let str = React.string

@react.component
let make = (~bloodSugar) => {
  <div
    className="border rounded-lg bg-white shadow h-full hover:border-primary-500 text-black mt-4 p-4">
    <h2> {str("Blood Sugar")} </h2>
    <div>
      <span className="font-semibold leading-relaxed"> {str("Blood Sugar Level: ")} </span>
      {switch CriticalCare_BloodSugar.bloodsugar_level(bloodSugar) {
      | Some(data) => React.int(data)
      | None => React.null
      }}
    </div>
  </div>
}
