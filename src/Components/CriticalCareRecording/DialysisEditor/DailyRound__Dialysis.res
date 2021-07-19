let str = React.string

@react.component
let make = (~dialysis) => {
  <div
    className="border rounded-lg bg-white shadow h-full hover:border-primary-500 text-black mt-4 p-4">
    <h3> {str("Dialysis")} </h3>
    <div>
      <span className="font-semibold leading-relaxed"> {str("Fluid Balance: ")} </span>
      {switch CriticalCare_Dialysis.fluid_balance(dialysis) {
      | Some(data) => React.int(data)
      | None => React.null
      }}
    </div>
    <div>
      <span className="font-semibold leading-relaxed"> {str("Net Balance: ")} </span>
      {switch CriticalCare_Dialysis.net_balance(dialysis) {
      | Some(data) => React.int(data)
      | None => React.null
      }}
    </div>
  </div>
}
