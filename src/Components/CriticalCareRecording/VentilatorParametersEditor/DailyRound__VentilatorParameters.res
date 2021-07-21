let str = React.string
open CriticalCare__Types

@react.component
let make = (
  ~ventilatorParameters,
  ~renderOptionalIntWithIndicators,
  ~renderOptionalInt,
  ~renderLine,
) => {
  <div>
    {renderLine(
      "Interface",
      VentilatorParameters.ventilatorInterfaceTypeToString(
        VentilatorParameters.ventilatorInterface(ventilatorParameters),
      ),
    )}
    {renderLine(
      "Mode",
      VentilatorParameters.ventilatorModeTypeToString(
        VentilatorParameters.ventilatorMode(ventilatorParameters),
      ),
    )}
    {renderLine(
      "Oxygen Modality",
      VentilatorParameters.ventilatorOxygenModalityTypeToString(
        VentilatorParameters.oxygenModality(ventilatorParameters),
      ),
    )}
    {renderOptionalIntWithIndicators(
      "PEEP",
      VentilatorParameters.peep(ventilatorParameters),
      5,
      10,
      "Low",
      "High",
    )}
    {renderOptionalIntWithIndicators(
      "Peak Inspiratory Pressure (PIP)",
      VentilatorParameters.pip(ventilatorParameters),
      12,
      30,
      "Low",
      "High",
    )}
    {renderOptionalIntWithIndicators(
      "Mean Airway Pressure",
      VentilatorParameters.meanAirwayPressure(ventilatorParameters),
      12,
      25,
      "Low",
      "High",
    )}
    {renderOptionalIntWithIndicators(
      "Respiratory Rate",
      VentilatorParameters.respiratoryRate(ventilatorParameters),
      12,
      20,
      "Low",
      "High",
    )}
    {renderOptionalIntWithIndicators(
      "Pressure Support",
      VentilatorParameters.pressureSupport(ventilatorParameters),
      5,
      15,
      "Low",
      "High",
    )}
    {renderOptionalInt("Tidal Volume", VentilatorParameters.tidalVolume(ventilatorParameters))}
    {renderOptionalIntWithIndicators(
      "Oxygen Modality Oxygen Rate",
      VentilatorParameters.oxygenModalityOxygenRate(ventilatorParameters),
      35,
      60,
      "Low",
      "High",
    )}
    {switch VentilatorParameters.oxygenModality(ventilatorParameters) {
    | NASAL_PRONGS =>
      renderOptionalIntWithIndicators(
        "Oxygen Modality Flow Rate",
        VentilatorParameters.oxygenModalityFlowRate(ventilatorParameters),
        1,
        4,
        "Low",
        "High",
      )
    | SIMPLE_FACE_MASK =>
      renderOptionalIntWithIndicators(
        "Oxygen Modality Flow Rate",
        VentilatorParameters.oxygenModalityFlowRate(ventilatorParameters),
        5,
        10,
        "Low",
        "High",
      )
    | NON_REBREATHING_MASK =>
      renderOptionalIntWithIndicators(
        "Oxygen Modality Flow Rate",
        VentilatorParameters.oxygenModalityFlowRate(ventilatorParameters),
        11,
        15,
        "Low",
        "High",
      )
    | _ =>
      renderOptionalInt(
        "Oxygen Modality Flow Rate",
        VentilatorParameters.oxygenModalityFlowRate(ventilatorParameters),
      )
    }}
    {renderOptionalIntWithIndicators(
      "FIO2",
      VentilatorParameters.fio2(ventilatorParameters),
      21,
      60,
      "Low",
      "High",
    )}
    {renderOptionalIntWithIndicators(
      "SPO2",
      VentilatorParameters.spo2(ventilatorParameters),
      90,
      100,
      "Low",
      "High",
    )}
  </div>
}
