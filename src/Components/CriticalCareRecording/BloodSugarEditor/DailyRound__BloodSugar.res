let str = React.string
open CriticalCare__Types

@react.component
let make = (~bloodSugar, ~renderLine, ~renderOptionalIntWithIndicators, ~renderOptionalFloat) => {
  <div>
    {renderOptionalIntWithIndicators(
      "Blood Sugar Level",
      BloodSugar.bloodsugar_level(bloodSugar),
      70,
      110,
      "Low",
      "High",
    )}
    {renderOptionalFloat("Dosage", BloodSugar.dosage(bloodSugar))}
    {renderLine("Frequency", BloodSugar.frequencyToString(BloodSugar.frequency(bloodSugar)))}
  </div>
}
