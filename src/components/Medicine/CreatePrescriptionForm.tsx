import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

import { RequiredFieldValidator } from "@/components/Form/FieldValidators";
import Form from "@/components/Form/Form";
import CheckBoxFormField from "@/components/Form/FormFields/CheckBoxFormField";
import DosageFormField from "@/components/Form/FormFields/DosageFormField";
import { SelectFormField } from "@/components/Form/FormFields/SelectFormField";
import TextAreaFormField from "@/components/Form/FormFields/TextAreaFormField";
import TextFormField from "@/components/Form/FormFields/TextFormField";
import MedibaseAutocompleteFormField from "@/components/Medicine/MedibaseAutocompleteFormField";
import {
  MedicineAdministrationRecord,
  Prescription,
} from "@/components/Medicine/models";
import MedicineRoutes from "@/components/Medicine/routes";
import { PrescriptionFormValidator } from "@/components/Medicine/validators";

import useSlug from "@/hooks/useSlug";

import { Success } from "@/Utils/Notifications";
import useMutation from "@/Utils/request/useMutation";

export default function CreatePrescriptionForm(props: {
  prescription: Prescription;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const consultation = useSlug("consultation");
  const mutation = useMutation(MedicineRoutes.createPrescription, {
    pathParams: { consultation },
  });

  return (
    <Form<Prescription>
      disabled={mutation.isProcessing}
      defaults={props.prescription}
      onCancel={props.onDone}
      onSubmit={async (body) => {
        body["medicine"] = body.medicine_object?.id;
        delete body.medicine_object;

        const { res, error } = await mutation.mutate({ body });
        if (!res?.ok) {
          return error;
        }

        Success({ msg: t("Medicine prescribed") });
        props.onDone();
      }}
      noPadding
      validate={PrescriptionFormValidator()}
      className="max-w-3xl"
    >
      {(field) => (
        <>
          <MedibaseAutocompleteFormField
            label={t("medicine")}
            {...field("medicine_object", RequiredFieldValidator())}
            required
          />
          {props.prescription.dosage_type !== "PRN" &&
            props.prescription.prescription_type !== "DISCHARGE" && (
              <CheckBoxFormField
                id="titrated-dosage"
                label={t("titrate_dosage")}
                name="Titrate Dosage"
                value={field("dosage_type").value === "TITRATED"}
                onChange={(e) => {
                  if (e.value) {
                    field("dosage_type").onChange({
                      name: "dosage_type",
                      value: "TITRATED",
                    });
                  } else {
                    field("dosage_type").onChange({
                      name: "dosage_type",
                      value: "REGULAR",
                    });
                  }
                }}
              />
            )}
          <div className="flex flex-wrap items-center gap-x-4">
            <SelectFormField
              className="flex-1"
              label={t("route")}
              {...field("route")}
              options={PRESCRIPTION_ROUTES}
              optionLabel={(key) => t("PRESCRIPTION_ROUTE_" + key)}
              optionValue={(key) => key}
            />
            {field("dosage_type").value === "TITRATED" ? (
              <div className="flex w-full flex-[2] gap-4">
                <DosageFormField
                  className="flex-1"
                  label={t("start_dosage")}
                  {...field("base_dosage", RequiredFieldValidator())}
                  required
                  min={0}
                />
                <DosageFormField
                  className="flex-1"
                  label={t("target_dosage")}
                  {...field("target_dosage", RequiredFieldValidator())}
                  required
                  min={0}
                />
              </div>
            ) : (
              <DosageFormField
                className="flex-1"
                label={t("dosage")}
                {...field("base_dosage", RequiredFieldValidator())}
                required={field("dosage_type").value !== "TITRATED"}
                min={0}
              />
            )}
          </div>

          {props.prescription.dosage_type === "PRN" ? (
            <>
              <TextFormField
                label={t("indicator")}
                {...field("indicator", RequiredFieldValidator())}
                required
              />
              <DosageFormField
                className="flex-1"
                label={t("max_dosage_24_hrs")}
                min={0}
                {...field("max_dosage")}
              />
              <SelectFormField
                label={t("min_time_bw_doses")}
                {...field("min_hours_between_doses")}
                options={[1, 2, 3, 6, 12, 24]}
                optionLabel={(hours) => `${hours} hrs.`}
                optionValue={(hours) => hours}
                position="above"
              />
            </>
          ) : (
            <div className="flex items-center gap-4">
              <SelectFormField
                position="above"
                className="flex-1"
                label={t("frequency")}
                {...field("frequency", RequiredFieldValidator())}
                required
                options={Object.entries(PRESCRIPTION_FREQUENCIES)}
                optionLabel={([key]) =>
                  t("PRESCRIPTION_FREQUENCY_" + key.toUpperCase())
                }
                optionValue={([key]) => key}
              />
              <TextFormField
                className="flex-1"
                label={t("days")}
                type="number"
                min={0}
                {...field("days")}
              />
            </div>
          )}

          {field("dosage_type").value === "TITRATED" && (
            <TextAreaFormField
              label={t("instruction_on_titration")}
              {...field("instruction_on_titration")}
            />
          )}

          <TextAreaFormField label={t("notes")} {...field("notes")} />
        </>
      )}
    </Form>
  );
}

export const PRESCRIPTION_ROUTES = [
  "ORAL",
  "IV",
  "IM",
  "SC",
  "INHALATION",
  "NASOGASTRIC",
  "INTRATHECAL",
  "TRANSDERMAL",
  "RECTAL",
  "SUBLINGUAL",
] as const;

export const PRESCRIPTION_FREQUENCIES = {
  STAT: {
    slots: 1,
    completed: (administrations: MedicineAdministrationRecord[]) =>
      administrations.filter((administration) => administration),
  },
  OD: {
    slots: 1,
    completed: (administrations: MedicineAdministrationRecord[]) =>
      administrations.filter((administration) =>
        dayjs(administration.administered_date).isSame(dayjs(), "day"),
      ),
  },
  HS: {
    slots: 1,
    completed: (administrations: MedicineAdministrationRecord[]) =>
      administrations.filter((administration) =>
        dayjs(administration.administered_date).isSame(dayjs(), "day"),
      ),
  },
  BD: {
    slots: 2,
    completed: (administrations: MedicineAdministrationRecord[]) =>
      administrations.filter((administration) =>
        dayjs(administration.administered_date).isSame(dayjs(), "day"),
      ),
  },
  TID: {
    slots: 3,
    completed: (administrations: MedicineAdministrationRecord[]) =>
      administrations.filter((administration) =>
        dayjs(administration.administered_date).isSame(dayjs(), "day"),
      ),
  },
  QID: {
    slots: 4,
    completed: (administrations: MedicineAdministrationRecord[]) =>
      administrations.filter((administration) =>
        dayjs(administration.administered_date).isSame(dayjs(), "day"),
      ),
  },
  Q4H: {
    slots: 6,
    completed: (administrations: MedicineAdministrationRecord[]) =>
      administrations.filter((administration) =>
        dayjs(administration.administered_date).isSame(dayjs(), "day"),
      ),
  },
  QOD: {
    slots: 1,
    completed: (administrations: MedicineAdministrationRecord[]) => {
      const lastAdministration = administrations[0];
      if (!lastAdministration) {
        return [];
      }
      if (
        dayjs(lastAdministration.administered_date).isSame(dayjs(), "day") ||
        dayjs(lastAdministration.administered_date).isSame(
          dayjs().subtract(1, "day"),
          "day",
        )
      ) {
        return [lastAdministration];
      } else {
        return [] as MedicineAdministrationRecord[];
      }
    },
  },
  QWK: {
    slots: 1,
    completed: (administrations: MedicineAdministrationRecord[]) =>
      administrations.filter((administration) =>
        dayjs(administration.administered_date).isSame(dayjs(), "week"),
      ),
  },
};
