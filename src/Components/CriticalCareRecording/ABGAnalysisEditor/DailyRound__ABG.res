let str = React.string
open CriticalCare__Types

@react.component
let make = (
  ~arterialBloodGasAnalysis,
  ~renderOptionalIntWithIndicators,
  ~renderOptionalFloatWithIndicators,
) => {
  <div>
    {renderOptionalIntWithIndicators(
      "PO2",
      ABGAnalysis.po2(arterialBloodGasAnalysis),
      35,
      45,
      "Low",
      "High",
    )}
    {renderOptionalFloatWithIndicators(
      "pH",
      ABGAnalysis.pH(arterialBloodGasAnalysis),
      7.35,
      7.45,
      "Low",
      "High",
    )}
    {renderOptionalFloatWithIndicators(
      "HCO3",
      ABGAnalysis.hco3(arterialBloodGasAnalysis),
      22.0,
      26.0,
      "Low",
      "High",
    )}
    {renderOptionalIntWithIndicators(
      "Base Excess",
      ABGAnalysis.baseExcess(arterialBloodGasAnalysis),
      -2,
      2,
      "Low",
      "High",
    )}
    {renderOptionalFloatWithIndicators(
      "Lactate",
      ABGAnalysis.lactate(arterialBloodGasAnalysis),
      0.0,
      2.0,
      "Low",
      "High",
    )}
    {renderOptionalFloatWithIndicators(
      "Sodium",
      ABGAnalysis.sodium(arterialBloodGasAnalysis),
      135.0,
      145.0,
      "Low",
      "High",
    )}
    {renderOptionalFloatWithIndicators(
      "Potassium",
      ABGAnalysis.potassium(arterialBloodGasAnalysis),
      3.5,
      5.5,
      "Low",
      "High",
    )}
  </div>
}
