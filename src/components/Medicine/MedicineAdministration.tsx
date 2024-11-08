import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import ButtonV2 from "@/components/Common/ButtonV2";
import CheckBoxFormField from "@/components/Form/FormFields/CheckBoxFormField";
import DateFormField from "@/components/Form/FormFields/DateFormField";
import DosageFormField from "@/components/Form/FormFields/DosageFormField";
import TextAreaFormField from "@/components/Form/FormFields/TextAreaFormField";
import PrescriptionDetailCard from "@/components/Medicine/PrescriptionDetailCard";
import {
  MedicineAdministrationRecord,
  Prescription,
} from "@/components/Medicine/models";
import MedicineRoutes from "@/components/Medicine/routes";
import { AdministrationDosageValidator } from "@/components/Medicine/validators";

import useSlug from "@/hooks/useSlug";

import { Error, Success } from "@/Utils/Notifications";
import dayjs from "@/Utils/dayjs";
import request from "@/Utils/request/request";
import { formatDateTime } from "@/Utils/utils";

interface Props {
  prescriptions: Prescription[];
  onDone: () => void;
}

type DosageField = {
  dosage: MedicineAdministrationRecord["dosage"];
  error?: string;
};

export default function MedicineAdministration(props: Props) {
  const { t } = useTranslation();
  const consultation = useSlug("consultation");
  const [shouldAdminister, setShouldAdminister] = useState<boolean[]>([]);
  const [dosages, setDosages] = useState<DosageField[]>([]);
  const [notes, setNotes] = useState<MedicineAdministrationRecord["notes"][]>(
    [],
  );
  const [isCustomTime, setIsCustomTime] = useState<boolean[]>([]);
  const [customTime, setCustomTime] = useState<string[]>([]);

  const prescriptions = useMemo(
    () =>
      props.prescriptions.filter(
        (obj) => !obj.discontinued && obj.prescription_type !== "DISCHARGE",
      ),
    [props.prescriptions],
  );

  useEffect(() => {
    setShouldAdminister(Array(prescriptions.length).fill(false));
    setDosages(Array(prescriptions.length).fill({ dosage: undefined }));
    setNotes(Array(prescriptions.length).fill(""));
    setIsCustomTime(Array(prescriptions.length).fill(false));
    setCustomTime(
      Array(prescriptions.length).fill(dayjs().format("YYYY-MM-DDTHH:mm")),
    );
  }, [props.prescriptions]);

  const handleSubmit = async () => {
    const administrations = [];

    for (let i = 0; i < prescriptions.length; i++) {
      if (shouldAdminister[i]) {
        if (prescriptions[i].dosage_type === "TITRATED") {
          const error = AdministrationDosageValidator(
            prescriptions[i].base_dosage,
            prescriptions[i].target_dosage,
          )(dosages[i].dosage);
          setDosages((dosages) => {
            const newDosages = [...dosages];
            newDosages[i].error = error;
            return newDosages;
          });
          if (error) return;
        }
        const administration = {
          prescription: prescriptions[i],
          notes: notes[i],
          dosage: dosages[i].dosage,
          administered_date: isCustomTime[i] ? customTime[i] : undefined,
        };
        administrations.push(administration);
      }
    }

    const ok = await Promise.all(
      administrations.map(({ prescription, ...body }) =>
        request(MedicineRoutes.administerPrescription, {
          pathParams: { consultation, external_id: prescription.id },
          body,
        }).then(({ res }) => !!res?.ok),
      ),
    );

    if (!ok) {
      Error({ msg: t("medicines_administered_error") });
      return;
    }

    Success({ msg: t("medicines_administered") });
    props.onDone();
  };

  const selectedCount = shouldAdminister.filter(Boolean).length;

  return (
    <div className="flex flex-col gap-3">
      {prescriptions.map((obj, index) => (
        <PrescriptionDetailCard
          key={obj.id}
          prescription={obj}
          readonly
          selected={shouldAdminister[index]}
        >
          <div className="mt-4 flex w-full max-w-sm flex-col gap-2 border-t-2 border-dashed border-secondary-500 py-2 pt-4 md:ml-4 md:mt-0 md:border-l-2 md:border-t-0 md:pl-4 md:pt-0">
            <CheckBoxFormField
              name="should_administer"
              label={t("select_for_administration")}
              value={shouldAdminister[index]}
              onChange={(event) =>
                setShouldAdminister((shouldAdminister) => {
                  const newShouldAdminister = [...shouldAdminister];
                  newShouldAdminister[index] = event.value;
                  return newShouldAdminister;
                })
              }
              errorClassName="hidden"
            />
            <div className="text-sm font-semibold leading-relaxed text-secondary-600">
              <CareIcon icon="l-history-alt" className="pr-1" />{" "}
              {t("last_administered")}
              <span className="pl-1">
                {obj.last_administration?.administered_date
                  ? formatDateTime(obj.last_administration?.administered_date)
                  : t("never")}
              </span>
              {obj.dosage_type === "TITRATED" && (
                <span className="whitespace-nowrap">
                  <CareIcon icon="l-syringe" /> {t("dosage")}
                  {":"} {obj.last_administration?.dosage ?? "NA"}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-4">
              {obj.dosage_type === "TITRATED" && (
                <DosageFormField
                  name="dosage"
                  label={
                    t("dosage") + ` (${obj.base_dosage} - ${obj.target_dosage})`
                  }
                  value={dosages[index]?.dosage}
                  onChange={({ value }) =>
                    setDosages((dosages) => {
                      const newDosages = [...dosages];
                      newDosages[index].dosage = value;
                      return newDosages;
                    })
                  }
                  required
                  min={obj.base_dosage}
                  max={obj.target_dosage}
                  disabled={!shouldAdminister[index]}
                  error={dosages[index]?.error}
                  errorClassName={dosages[index]?.error ? "block" : "hidden"}
                />
              )}
              <TextAreaFormField
                label={t("administration_notes")}
                className="w-full"
                disabled={!shouldAdminister[index]}
                name="administration_notes"
                placeholder={t("add_notes")}
                value={notes[index]}
                onChange={(event) =>
                  setNotes((notes) => {
                    const newNotes = [...notes];
                    newNotes[index] = event.value;
                    return newNotes;
                  })
                }
                errorClassName="hidden"
              />
              <div className="flex w-full flex-col gap-2 lg:max-w-min">
                <CheckBoxFormField
                  label="Administer for a time in the past"
                  labelClassName="whitespace-nowrap"
                  disabled={!shouldAdminister[index]}
                  name="is_custom_time"
                  value={isCustomTime[index]}
                  onChange={({ value }) => {
                    setIsCustomTime((arr) => {
                      const newArr = [...arr];
                      newArr[index] = value;
                      return newArr;
                    });
                    if (!value) {
                      setCustomTime((arr) => {
                        const newArr = [...arr];
                        newArr[index] = dayjs().format("YYYY-MM-DDTHH:mm");
                        return newArr;
                      });
                    }
                  }}
                  errorClassName="hidden"
                />
                <DateFormField
                  name="administered_date"
                  value={
                    customTime[index] ? new Date(customTime[index]) : new Date()
                  }
                  onChange={({ value }) => {
                    setCustomTime((arr) => {
                      const newArr = [...arr];
                      newArr[index] = dayjs(value).format("YYYY-MM-DDTHH:mm");
                      return newArr;
                    });
                  }}
                  disabled={!shouldAdminister[index] || !isCustomTime[index]}
                  min={new Date(obj.created_date)}
                  max={new Date()}
                  className="w-full"
                  errorClassName="hidden"
                  allowTime
                />
              </div>
            </div>
          </div>
        </PrescriptionDetailCard>
      ))}
      <div className="flex justify-end">
        <ButtonV2
          id="administer-selected-medicine"
          onClick={handleSubmit}
          disabled={!selectedCount}
        >
          <CareIcon icon="l-syringe" className="text-lg" />
          {t("administer_selected_medicines")}{" "}
          {selectedCount > 0 && `(${selectedCount})`}
        </ButtonV2>
      </div>
    </div>
  );
}
