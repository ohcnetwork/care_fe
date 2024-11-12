import RangeFormField from "@/components/Form/FormFields/RangeFormField";
import {
  LogUpdateSectionMeta,
  LogUpdateSectionProps,
} from "@/components/LogUpdate/utils";

const Dialysis = ({ log, onChange }: LogUpdateSectionProps) => {
  return (
    <>
      <RangeFormField
        label="Fluid Balance"
        unit="ml/h"
        name="dialysis_fluid_balance"
        onChange={(c) => onChange({ dialysis_fluid_balance: c.value })}
        value={log.dialysis_fluid_balance}
        min={0}
        max={5000}
      />
      <br />
      <RangeFormField
        label="Net Balance"
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
} as const satisfies LogUpdateSectionMeta;

export default Dialysis;
