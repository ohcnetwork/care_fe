import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { AssetClass } from "@/components/Assets/AssetTypes";
import DialogModal from "@/components/Common/Dialog";
import Beds from "@/components/Facility/Consultations/Beds";
import RadioFormField from "@/components/Form/FormFields/RadioFormField";
import RangeFormField from "@/components/Form/FormFields/RangeFormField";
import OxygenRespiratorySupport from "@/components/LogUpdate/Sections/RespiratorySupport/OxygenSupport";
import VentilatorRespiratorySupport from "@/components/LogUpdate/Sections/RespiratorySupport/Ventilator";
import {
  LogUpdateSectionMeta,
  LogUpdateSectionProps,
} from "@/components/LogUpdate/utils";

import { useSlugs } from "@/hooks/useSlug";

import { RESPIRATORY_SUPPORT } from "@/common/constants";

import { Warn } from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";
import { rangeValueDescription } from "@/Utils/utils";

const RespiratorySupport = ({ log, onChange }: LogUpdateSectionProps) => {
  const { t } = useTranslation();
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

  const handleChange = (c: any) => {
    let resetData = {};
    if (["OXYGEN_SUPPORT", "UNKNOWN"].includes(c.value)) {
      resetData = {
        ...resetData,
        ventilator_spo2: undefined,
        ventilator_fio2: undefined,
        ventilator_peep: undefined,
        ventilator_pip: undefined,
        ventilator_mean_airway_pressure: undefined,
        ventilator_resp_rate: undefined,
        ventilator_pressure_support: undefined,
        ventilator_tidal_volume: undefined,
        ventilator_mode: undefined,
      };
    }
    if (["INVASIVE", "NON_INVASIVE", "UNKNOWN"].includes(c.value)) {
      resetData = {
        ...resetData,
        ventilator_spo2: undefined,
        ventilator_oxygen_modality_flow_rate: undefined,
        ventilator_oxygen_modality_oxygen_rate: undefined,
        ventilator_oxygen_modality: undefined,
      };
    }
    onChange({
      ventilator_interface: (c.value ||
        "UNKNOWN") as typeof log.ventilator_interface,
      ...resetData,
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <RadioFormField
        label="Bilateral Air Entry"
        labelClassName="text-lg sm:font-bold"
        options={[true, false]}
        optionLabel={(c) => (c ? "Yes" : "No")}
        optionValue={(c) => JSON.stringify(c)}
        name="bilateral_air_entry"
        value={
          log.bilateral_air_entry != null
            ? JSON.stringify(log.bilateral_air_entry)
            : undefined
        }
        onChange={(c) =>
          onChange({
            bilateral_air_entry: c.value == null ? null : JSON.parse(c.value),
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
        options={RESPIRATORY_SUPPORT}
        optionLabel={(c) => t(`RESPIRATORY_SUPPORT__${c.value}`)}
        optionValue={(c) => c.value}
        name="respiratory_support"
        value={log.ventilator_interface}
        onChange={handleChange}
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
