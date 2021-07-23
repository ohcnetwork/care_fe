let str = React.string

@react.component
export make = (~others, ~renderOptionalIntWithIndicators) => {
  <div>
    {renderOptionalIntWithIndicators(
      "EtCO2",
      CriticalCare__Others.etco2(others),
      35,
      45,
      "Low",
      "High",
    )}
  </div>
}
