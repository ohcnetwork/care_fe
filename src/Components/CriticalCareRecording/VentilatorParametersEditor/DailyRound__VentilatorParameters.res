let str = React.string
open CriticalCare__Types

@react.component
let make = (~ventilatorParameters: VentilatorParameters.t, ~renderOptionalInt, ~renderLine) => {
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
    {renderOptionalInt("PEEP", VentilatorParameters.peep(ventilatorParameters))}
    {renderOptionalInt("PIP", VentilatorParameters.pip(ventilatorParameters))}
    {renderOptionalInt(
      "Mean Airway Pressure",
      VentilatorParameters.meanAirwayPressure(ventilatorParameters),
    )}
    {renderOptionalInt(
      "Respiratory Rate",
      VentilatorParameters.respiratoryRate(ventilatorParameters),
    )}
    {renderOptionalInt(
      "Pressure Support",
      VentilatorParameters.pressureSupport(ventilatorParameters),
    )}
    {renderOptionalInt("Tidal Volume", VentilatorParameters.tidalVolume(ventilatorParameters))}
    {renderOptionalInt(
      "Oxygen Modality Oxygen Rate",
      VentilatorParameters.oxygenModalityOxygenRate(ventilatorParameters),
    )}
    {renderOptionalInt(
      "Oxygen Modality Flow Rate",
      VentilatorParameters.oxygenModalityFlowRate(ventilatorParameters),
    )}
    {renderOptionalInt("FIO2", VentilatorParameters.fio2(ventilatorParameters))}
    {renderOptionalInt("SPO2", VentilatorParameters.spo2(ventilatorParameters))}
  </div>
}
