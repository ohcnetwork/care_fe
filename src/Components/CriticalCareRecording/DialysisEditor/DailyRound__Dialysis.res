let str = React.string
open CriticalCare__Types

@react.component
let make = (~dialysis, ~renderOptionalInt) => {
  <div>
    {renderOptionalInt("Fluid Balance", Dialysis.fluid_balance(dialysis))}
    {renderOptionalInt("Net Balance", Dialysis.net_balance(dialysis))}
  </div>
}
