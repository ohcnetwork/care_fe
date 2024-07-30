import RangeFormField from "../../Form/FormFields/RangeFormField";
import { logUpdateSection } from "../utils";

export default logUpdateSection({ title: "Dialysis" }, ({ log, onChange }) => {
  return (
    <div>
      <RangeFormField
        label={<h4>Dialysis Fluid Balance (ml/h)</h4>}
        name="blood_sugar"
        onChange={(c) => onChange({ ...log, dialysis_fluid_balance: c.value })}
        value={log.dialysis_fluid_balance}
        start={0}
        end={5000}
      />
      <br />
      <br />
      <RangeFormField
        label={<h4>Dialysis Net Balance (ml/h)</h4>}
        name="blood_sugar"
        onChange={(c) => onChange({ ...log, dialysis_net_balance: c.value })}
        value={log.dialysis_net_balance}
        start={0}
        end={5000}
      />
    </div>
  );
});
