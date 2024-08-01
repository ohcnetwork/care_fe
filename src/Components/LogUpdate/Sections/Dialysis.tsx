import RangeFormField from "../../Form/FormFields/RangeFormField";
import { LogUpdateSectionProps } from "../utils";

const Dialysis = ({ log, onChange }: LogUpdateSectionProps) => {
  return (
    <div>
      <RangeFormField
        label={<h4>Dialysis Fluid Balance (ml/h)</h4>}
        name="blood_sugar"
        onChange={(c) => onChange({ dialysis_fluid_balance: c.value })}
        value={log.dialysis_fluid_balance}
        start={0}
        end={5000}
      />
      <br />
      <br />
      <RangeFormField
        label={<h4>Dialysis Net Balance (ml/h)</h4>}
        name="blood_sugar"
        onChange={(c) => onChange({ dialysis_net_balance: c.value })}
        value={log.dialysis_net_balance}
        start={0}
        end={5000}
      />
    </div>
  );
};

Dialysis.meta = {
  title: "Dialysis",
  icon: "l-jackhammer",
} as const;

export default Dialysis;
