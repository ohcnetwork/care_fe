let str = React.string
open CriticalCare__Types

@react.component
let make = (~arterialBloodGasAnalysis, ~renderOptionalInt, ~renderOptionalFloat) => {
  <div>
    {renderOptionalInt("PO2", ABGAnalysis.po2(arterialBloodGasAnalysis))}
    {renderOptionalFloat("pH", ABGAnalysis.pH(arterialBloodGasAnalysis))}
    {renderOptionalFloat("HCO3", ABGAnalysis.hco3(arterialBloodGasAnalysis))}
    {renderOptionalInt("Base Excess", ABGAnalysis.baseExcess(arterialBloodGasAnalysis))}
    {renderOptionalFloat("Lactate", ABGAnalysis.lactate(arterialBloodGasAnalysis))}
    {renderOptionalFloat("Sodium", ABGAnalysis.sodium(arterialBloodGasAnalysis))}
    {renderOptionalFloat("Potassium", ABGAnalysis.potassium(arterialBloodGasAnalysis))}
  </div>
}
