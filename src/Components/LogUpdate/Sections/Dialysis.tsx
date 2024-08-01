import RangeFormField from "../../Form/FormFields/RangeFormField";
import { LogUpdateSectionProps } from "../utils";

const Dialysis = ({ log, onChange }: LogUpdateSectionProps) => {
  return (
    <>
      <RangeFormField
        label="Dialysis Fluid Balance"
        unit="ml/h"
        name="dialysis_fluid_balance"
        onChange={(c) => onChange({ dialysis_fluid_balance: c.value })}
        value={log.dialysis_fluid_balance}
        min={0}
        max={5000}
      />
      <br />
      <RangeFormField
        label="Dialysis Net Balance"
        unit="ml/h"
        name="dialysis_net_balance"
        onChange={(c) => onChange({ dialysis_net_balance: c.value })}
        value={log.dialysis_net_balance}
        min={0}
        max={5000}
      />
    </>
  );
};

Dialysis.meta = {
  title: "Dialysis",
  icon: "l-jackhammer",
} as const;

export default Dialysis;
