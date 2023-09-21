import { useEffect, useMemo, useState } from "react";
import { PrescriptionActions } from "../../Redux/actions";
import PrescriptionDetailCard from "./PrescriptionDetailCard";
import { MedicineAdministrationRecord, Prescription } from "./models";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
import CheckBoxFormField from "../Form/FormFields/CheckBoxFormField";
import ButtonV2 from "../Common/components/ButtonV2";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { useDispatch } from "react-redux";
import { Error, Success } from "../../Utils/Notifications";
import { formatDateTime } from "../../Utils/utils";
import { useTranslation } from "react-i18next";
import dayjs from "../../Utils/dayjs";
import TextFormField from "../Form/FormFields/TextFormField";

interface Props {
  prescriptions: Prescription[];
  action: ReturnType<typeof PrescriptionActions>["prescription"];
  onDone: () => void;
}

export default function MedicineAdministration(props: Props) {
  const { t } = useTranslation();
  const dispatch = useDispatch<any>();
  const [shouldAdminister, setShouldAdminister] = useState<boolean[]>([]);
  const [notes, setNotes] = useState<MedicineAdministrationRecord["notes"][]>(
    []
  );
  const [isCustomTime, setIsCustomTime] = useState<boolean[]>([]);
  const [customTime, setCustomTime] = useState<string[]>([]);

  const prescriptions = useMemo(
    () =>
      props.prescriptions.filter(
        (obj) => !obj.discontinued && obj.prescription_type !== "DISCHARGE"
      ),
    [props.prescriptions]
  );

  useEffect(() => {
    setShouldAdminister(Array(prescriptions.length).fill(false));
    setNotes(Array(prescriptions.length).fill(""));
    setIsCustomTime(Array(prescriptions.length).fill(false));
    setCustomTime(
      Array(prescriptions.length).fill(dayjs().format("YYYY-MM-DDTHH:mm"))
    );
  }, [props.prescriptions]);

  const handleSubmit = () => {
    const records: MedicineAdministrationRecord[] = [];
    prescriptions.forEach((prescription, i) => {
      if (shouldAdminister[i]) {
        records.push({
          prescription,
          notes: notes[i],
          administered_date: isCustomTime[i] ? customTime[i] : undefined,
        });
      }
    });

    Promise.all(
      records.map(async ({ prescription, ...record }) => {
        const res = await dispatch(
          props.action(prescription?.id ?? "").administer(record)
        );
        if (res.status !== 201) {
          Error({ msg: t("medicines_administered_error") });
        }
      })
    ).then(() => {
      Success({ msg: t("medicines_administered") });
      props.onDone();
    });
  };

  const selectedCount = shouldAdminister.filter(Boolean).length;

  return (
    <div className="flex flex-col gap-3">
      {prescriptions.map((obj, index) => (
        <PrescriptionDetailCard
          key={obj.id}
          prescription={obj}
          readonly
          actions={props.action(obj?.id ?? "")}
          selected={shouldAdminister[index]}
        >
          <div className="mt-4 flex w-full max-w-[600px] flex-col gap-2 border-t-2 border-dashed border-gray-500 py-2 pt-4 md:ml-4 md:mt-0 md:border-l-2 md:border-t-0 md:pl-4 md:pt-0">
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
            <div className="text-sm font-semibold leading-relaxed text-gray-600">
              <CareIcon className="care-l-history-alt pr-1" />{" "}
              {t("last_administered")}
              <span className="pl-1">
                {obj.last_administered_on
                  ? formatDateTime(obj.last_administered_on)
                  : t("never")}
              </span>
            </div>
            <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
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
              <div className="flex flex-col gap-2 lg:max-w-min">
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
                <TextFormField
                  name="administered_date"
                  type="datetime-local"
                  value={customTime[index]}
                  onChange={({ value }) => {
                    setCustomTime((arr) => {
                      const newArr = [...arr];
                      newArr[index] = value;
                      return newArr;
                    });
                  }}
                  disabled={!shouldAdminister[index] || !isCustomTime[index]}
                  min={dayjs(obj.created_date).format("YYYY-MM-DDTHH:mm")}
                  max={dayjs().format("YYYY-MM-DDTHH:mm")}
                />
              </div>
            </div>
          </div>
        </PrescriptionDetailCard>
      ))}
      <div className="flex justify-end">
        <ButtonV2 onClick={handleSubmit} disabled={!selectedCount}>
          <CareIcon className="care-l-syringe text-lg" />
          {t("administer_selected_medicines")}{" "}
          {selectedCount > 0 && `(${selectedCount})`}
        </ButtonV2>
      </div>
    </div>
  );
}
