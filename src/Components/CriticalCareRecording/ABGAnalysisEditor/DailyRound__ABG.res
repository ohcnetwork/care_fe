let str = React.string

@react.component
let make = (~arterialBloodGasAnalysis) => {
  <div
    className="border rounded-lg bg-white shadow h-full hover:border-primary-500 text-black mt-4 p-4">
    <h3> {str("Arterial Blood Gas Analysis")} </h3>
    <div>
      <span className="font-semibold leading-relaxed"> {str("PO2: ")} </span>
      {switch CriticalCare__ABGAnalysis.po2(arterialBloodGasAnalysis) {
      | Some(data) => React.int(data)
      | None => React.null
      }}
    </div>
    <div>
      <span className="font-semibold leading-relaxed"> {str("PCO2: ")} </span>
      {switch CriticalCare__ABGAnalysis.pco2(arterialBloodGasAnalysis) {
      | Some(data) => React.int(data)
      | None => React.null
      }}
    </div>
    <div>
      <span className="font-semibold leading-relaxed"> {str("pH: ")} </span>
      {switch CriticalCare__ABGAnalysis.pH(arterialBloodGasAnalysis) {
      | Some(data) => React.float(data)
      | None => React.null
      }}
    </div>
    <div>
      <span className="font-semibold leading-relaxed"> {str("HCO3: ")} </span>
      {switch CriticalCare__ABGAnalysis.hco3(arterialBloodGasAnalysis) {
      | Some(data) => React.float(data)
      | None => React.null
      }}
    </div>
    <div>
      <span className="font-semibold leading-relaxed"> {str("Base Excess: ")} </span>
      {switch CriticalCare__ABGAnalysis.baseExcess(arterialBloodGasAnalysis) {
      | Some(data) => React.int(data)
      | None => React.null
      }}
    </div>
    <div>
      <span className="font-semibold leading-relaxed"> {str("Lactate: ")} </span>
      {switch CriticalCare__ABGAnalysis.lactate(arterialBloodGasAnalysis) {
      | Some(data) => React.float(data)
      | None => React.null
      }}
    </div>
    <div>
      <span className="font-semibold leading-relaxed"> {str("Sodium: ")} </span>
      {switch CriticalCare__ABGAnalysis.sodium(arterialBloodGasAnalysis) {
      | Some(data) => React.float(data)
      | None => React.null
      }}
    </div>
    <div>
      <span className="font-semibold leading-relaxed"> {str("Potassium: ")} </span>
      {switch CriticalCare__ABGAnalysis.potassium(arterialBloodGasAnalysis) {
      | Some(data) => React.float(data)
      | None => React.null
      }}
    </div>
  </div>
}
