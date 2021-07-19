let str = React.string
open CriticalCare__Types

@react.component
let make = (~others, ~renderOptionalInt) => {
  <div> {renderOptionalInt("EtCO2", Others.etco2(others))} </div>
}
