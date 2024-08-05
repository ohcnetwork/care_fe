import { useEffect } from "react";
import { useSlugs } from "../../../../Common/hooks/useSlug";
import routes from "../../../../Redux/api";
import useQuery from "../../../../Utils/request/useQuery";
import { rangeValueDescription } from "../../../../Utils/utils";
import { AssetClass } from "../../../Assets/AssetTypes";
import DialogModal from "../../../Common/Dialog";
import Beds from "../../../Facility/Consultations/Beds";
import RadioFormField from "../../../Form/FormFields/RadioFormField";
import RangeFormField from "../../../Form/FormFields/RangeFormField";
import {
  LogUpdateSectionMeta,
  LogUpdateSectionProps,
  RESPIRATORY_SUPPORT_OPTIONS,
  YES_NO_OPTIONS,
} from "../../utils";
import OxygenRespiratorySupport from "./OxygenSupport";
import VentilatorRespiratorySupport from "./Ventilator";
import { Warn } from "../../../../Utils/Notifications";

const RespiratorySupport = ({ log, onChange }: LogUpdateSectionProps) => {
  const [facilityId, consultationId] = useSlugs("facility", "consultation");
  const consultationQuery = useQuery(routes.getConsultation, {
    pathParams: { id: consultationId },
  });

  const warnForNoLinkedVentilator = (() => {
    if (consultationQuery.loading) {
      return false;
    }

    if (
      !(
        log.ventilator_interface === "INVASIVE" ||
        log.ventilator_interface === "NON_INVASIVE"
      )
    ) {
      return false;
    }

    const hasLinkedVentilator =
      consultationQuery.data?.current_bed?.assets_objects?.some(
        (a) => a.asset_class === AssetClass.VENTILATOR,
      );
    return hasLinkedVentilator === false;
  })();

  useEffect(() => {
    if (warnForNoLinkedVentilator) {
      Warn({
        msg: "No ventilator assets were found to be linked to the current bed.",
      });
    }
  }, [warnForNoLinkedVentilator]);

  return (
    <div className="flex flex-col gap-8">
      <RadioFormField
        label="Bilateral Air Entry"
        labelClassName="text-lg sm:font-bold"
        options={YES_NO_OPTIONS}
        optionDisplay={(c) => c.text}
        optionValue={(c) => c.text}
        name="bilateral_air_entry"
        value={
          YES_NO_OPTIONS.find((o) => o.value === log.bilateral_air_entry)?.text
        }
        onChange={(c) =>
          onChange({
            bilateral_air_entry: YES_NO_OPTIONS.find((o) => o.text === c.value)
              ?.value,
          })
        }
      />
      <RangeFormField
        label={
          <span>
            EtCO<sub>2</sub>
          </span>
        }
        unit="mmHg"
        name="etco2"
        onChange={(c) => onChange({ etco2: c.value })}
        value={log.etco2}
        min={0}
        max={200}
        step={1}
        valueDescriptions={rangeValueDescription({ low: 34, high: 45 })}
      />
      <hr />
      <RadioFormField
        label={<h4>Respiratory Support</h4>}
        options={RESPIRATORY_SUPPORT_OPTIONS}
        optionDisplay={(c) => c.text}
        optionValue={(c) => c.value}
        name="respiratory_support"
        value={log.ventilator_interface}
        onChange={(c) =>
          onChange({
            ventilator_interface: (c.value ||
              "UNKNOWN") as typeof log.ventilator_interface,
          })
        }
      />

      <DialogModal
        title="Link Ventilator to Bed"
        show={warnForNoLinkedVentilator}
        onClose={() => onChange({ ventilator_interface: "UNKNOWN" })}
        className="md:max-w-3xl"
      >
        <Beds
          facilityId={facilityId}
          consultationId={consultationId}
          fetchPatientData={() => consultationQuery.refetch()}
        />
      </DialogModal>

      {log.ventilator_interface && log.ventilator_interface !== "UNKNOWN" && (
        <div className="ml-2 space-y-4 border-l-4 border-l-secondary-300 pl-6">
          {log.ventilator_interface === "OXYGEN_SUPPORT" && (
            <OxygenRespiratorySupport log={log} onChange={onChange} />
          )}
          {(log.ventilator_interface === "INVASIVE" ||
            log.ventilator_interface === "NON_INVASIVE") && (
            <VentilatorRespiratorySupport log={log} onChange={onChange} />
          )}
        </div>
      )}
    </div>
  );
};

RespiratorySupport.meta = {
  title: "Respiratory Support",
  icon: "l-lungs",
} as const satisfies LogUpdateSectionMeta;

export default RespiratorySupport;
