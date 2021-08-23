let str = React.string

@react.component
export make = (~others, ~renderOptionalIntWithIndicators, ~renderOptionalBool) => {
  <div>
    {renderOptionalBool(
      "Bilateral Air Entry",
      CriticalCare__Others.bilateral_air_entry(others)
    )}
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
