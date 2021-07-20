let str = React.string

@react.component
export make = (~others, ~renderOptionalInt) => {
  <div> {renderOptionalInt("EtCO2", CriticalCare__Others.etco2(others))} </div>
}
