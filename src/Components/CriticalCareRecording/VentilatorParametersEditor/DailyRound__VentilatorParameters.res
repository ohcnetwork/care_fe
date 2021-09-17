let str = React.string
open CriticalCare__Types

@react.component
let make = (
  ~ventilatorParameters,
  ~renderOptionalIntWithIndicators,
  ~renderOptionalFloatWithIndicators,
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
    {renderOptionalFloatWithIndicators(
      "PEEP",
      VentilatorParameters.peep(ventilatorParameters),
      5.0,
      10.0,
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
    {switch VentilatorParameters.oxygenModality(ventilatorParameters) {
    | NASAL_PRONGS =>
      renderOptionalIntWithIndicators(
        "Oxygen Flow Rate",
        VentilatorParameters.oxygenModalityOxygenRate(ventilatorParameters),
        1,
        4,
        "Low",
        "High",
      )
    | SIMPLE_FACE_MASK =>
      renderOptionalIntWithIndicators(
        "Oxygen Flow Rate",
        VentilatorParameters.oxygenModalityOxygenRate(ventilatorParameters),
        5,
        10,
        "Low",
        "High",
      )
    | NON_REBREATHING_MASK =>
      renderOptionalIntWithIndicators(
        "Oxygen Flow Rate",
        VentilatorParameters.oxygenModalityOxygenRate(ventilatorParameters),
        11,
        15,
        "Low",
        "High",
      )
    | HIGH_FLOW_NASAL_CANNULA =>
      renderOptionalIntWithIndicators(
        "Flow Rate",
        VentilatorParameters.oxygenModalityFlowRate(ventilatorParameters),
        35,
        60,
        "Low",
        "High",
      )
    | _ => <div />
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
