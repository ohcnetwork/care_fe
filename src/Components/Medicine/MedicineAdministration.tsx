import { useEffect, useMemo, useState } from "react";
import { PrescriptionActions } from "../../Redux/actions";
import PrescriptionDetailCard from "./PrescriptionDetailCard";
import { MedicineAdministrationRecord, Prescription } from "./models";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
import CheckBoxFormField from "../Form/FormFields/CheckBoxFormField";
import ButtonV2 from "../Common/components/ButtonV2";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { useDispatch } from "react-redux";
import { Error } from "../../Utils/Notifications";
import { formatDate } from "../../Utils/utils";

interface Props {
  prescriptions: Prescription[];
  action: ReturnType<typeof PrescriptionActions>["prescription"];
  onDone: () => void;
}

export default function MedicineAdministration(props: Props) {
  const dispatch = useDispatch<any>();
  const [shouldAdminister, setShouldAdminister] = useState<boolean[]>([]);
  const [notes, setNotes] = useState<MedicineAdministrationRecord["notes"][]>(
    []
  );
  const [timestamps, setTimestamps] = useState<
    MedicineAdministrationRecord["administered_date"][]
  >([]);

  const prescriptions = useMemo(
    () => props.prescriptions.filter((obj) => !obj.discontinued),
    [props.prescriptions]
  );

  useEffect(() => {
    setShouldAdminister(Array(prescriptions.length).fill(false));
    setNotes(Array(prescriptions.length).fill(""));
    setTimestamps(
      Array(prescriptions.length).fill(new Date().toISOString().slice(0, 16))
    );
  }, [props.prescriptions]);

  const handleSubmit = () => {
    const records: MedicineAdministrationRecord[] = [];
    prescriptions.forEach((prescription, index) => {
      if (shouldAdminister[index]) {
        records.push({
          prescription: prescriptions[index],
          notes: notes[index],
          administered_date: timestamps[index],
        });
      }
    });

    if (records.length === 0) {
      Error({ msg: "No medicines selected for administration" });
    }

    const submit = async () => {
      await Promise.all(
        records.map(async ({ prescription, ...record }) => {
          const res = await dispatch(
            props.action(prescription!.id!).administer(record)
          );
          if (res.status !== 201) {
            Error({ msg: "Error administering medicine" });
          }
        })
      );
    };

    submit().then(() => props.onDone());
  };

  const selectedCount = shouldAdminister.filter(Boolean).length;

  return (
    <div className="flex flex-col gap-3">
      {prescriptions.map((obj, index) => (
        <PrescriptionDetailCard
          key={index}
          prescription={obj}
          readonly
          actions={props.action(obj.id!)}
        >
          <div className="w-[400px] ml-4 pl-4 py-2 border-l-2 border-dashed border-gray-500 flex flex-col gap-2">
            <CheckBoxFormField
              name="should_administer"
              label="Select for Administration"
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
            <div className="text-gray-600 font-semibold leading-relaxed text-sm">
              <CareIcon className="care-l-history-alt pr-1" /> Last administered
              <span className="pl-1">
                {obj.last_administered_on
                  ? formatDate(obj.last_administered_on)
                  : "never"}
              </span>
            </div>
            <TextAreaFormField
              label="Administration Notes"
              disabled={!shouldAdminister[index]}
              name="administration_notes"
              placeholder="Add notes"
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
          </div>
        </PrescriptionDetailCard>
      ))}
      <div className="flex justify-end">
        <ButtonV2 onClick={handleSubmit} disabled={!selectedCount}>
          <CareIcon className="care-l-syringe text-lg" />
          Administer Selected Medicines{" "}
          {selectedCount > 0 && `(${selectedCount})`}
        </ButtonV2>
      </div>
    </div>
  );
}
