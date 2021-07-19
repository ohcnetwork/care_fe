let str = React.string
open CriticalCare__Types

@react.component
let make = (~bloodSugar, ~renderLine, ~renderOptionalInt, ~renderOptionalFloat) => {
  <div>
    {renderOptionalInt("Blood Sugar Level", BloodSugar.bloodsugar_level(bloodSugar))}
    {renderOptionalFloat("Dosage", BloodSugar.dosage(bloodSugar))}
    {renderLine("Frequency", BloodSugar.frequencyToString(BloodSugar.frequency(bloodSugar)))}
  </div>
}
