import { useState } from "react";
import { Writable } from "../../Utils/types";
import {
  ConsultationSymptom,
  OTHER_SYMPTOM_CHOICE,
  SYMPTOM_CHOICES,
} from "./types";
import AutocompleteMultiSelectFormField from "../Form/FormFields/AutocompleteMultiselect";
import DateFormField from "../Form/FormFields/DateFormField";
import ButtonV2 from "../Common/components/ButtonV2";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
import { classNames, dateQueryString } from "../../Utils/utils";
import { FieldChangeEvent } from "../Form/FormFields/Utils";
import CareIcon from "../../CAREUI/icons/CareIcon";
import useSlug from "../../Common/hooks/useSlug";
import useQuery from "../../Utils/request/useQuery";
import SymptomsApi from "./api";
import request from "../../Utils/request/request";

export const CreateSymptomsBuilder = (props: {
  value: Writable<ConsultationSymptom>[];
  onChange: (value: Writable<ConsultationSymptom>[]) => void;
}) => {
  return (
    <div className="flex w-full flex-col items-start rounded-lg border border-gray-400">
      <ul className="flex w-full flex-col gap-2 p-4">
        {props.value.map((obj, index, arr) => {
          const handleUpdate = (event: FieldChangeEvent<unknown>) => {
            const updated = { ...obj, [event.name]: event.value };
            props.onChange(arr.map((old, i) => (i === index ? updated : old)));
          };

          const handleRemove = () => {
            props.onChange(arr.filter((_, i) => i !== index));
          };

          return (
            <li key={index} id={`symptom-${index}`}>
              <SymptomEntry
                value={obj}
                onChange={handleUpdate}
                onRemove={handleRemove}
              />
            </li>
          );
        })}
      </ul>

      {props.value.length === 0 && <NoSymptomsAdded />}

      <div className="w-full rounded-b-lg border-t-2 border-dashed border-gray-400 bg-gray-100 p-4">
        <AddSymptom
          existing={props.value}
          onAdd={(objects) => props.onChange([...props.value, ...objects])}
        />
      </div>
    </div>
  );
};

export const ConsultationSymptomsBuilder = () => {
  const consultationId = useSlug("consultation");

  const [isProcessing, setIsProcessing] = useState(false);
  const { data, loading, refetch } = useQuery(SymptomsApi.list, {
    pathParams: { consultationId },
    query: { limit: 100 },
  });

  if (!data) {
    return <span>TODO: add a nice loader here...</span>;
  }

  return (
    <div className="flex w-full flex-col items-start rounded-lg border border-gray-400">
      <ul
        className={classNames(
          "flex w-full flex-col gap-2 p-4",
          (loading || isProcessing) && "pointer-events-none animate-pulse",
        )}
      >
        {data.results.map((symptom) => {
          const handleUpdate = async (event: FieldChangeEvent<unknown>) => {
            setIsProcessing(true);
            await request(SymptomsApi.partialUpdate, {
              pathParams: { consultationId, external_id: symptom.id },
              body: { [event.name]: event.value },
            });
            await refetch();
            setIsProcessing(false);
          };

          const handleMarkAsEnteredInError = async () => {
            setIsProcessing(true);
            await request(SymptomsApi.markAsEnteredInError, {
              pathParams: { consultationId, external_id: symptom.id },
            });
            await refetch();
            setIsProcessing(false);
          };

          return (
            <li key={symptom.id}>
              <SymptomEntry
                value={symptom}
                disabled={isProcessing}
                onChange={handleUpdate}
                onRemove={handleMarkAsEnteredInError}
              />
            </li>
          );
        })}
      </ul>

      {data.results.length === 0 && <NoSymptomsAdded />}

      <div className="w-full rounded-b-lg border-t-2 border-dashed border-gray-400 bg-gray-100 p-4">
        <AddSymptom
          existing={data.results}
          consultationId={consultationId}
          onAdd={() => refetch()}
        />
      </div>
    </div>
  );
};

const SymptomEntry = (props: {
  disabled?: boolean;
  value: Writable<ConsultationSymptom> | ConsultationSymptom;
  onChange: (event: FieldChangeEvent<unknown>) => void;
  onRemove: () => void;
}) => {
  const symptom = props.value;
  const disabled =
    props.disabled || symptom.clinical_impression_status === "entered-in-error";
  return (
    <div className="flex items-center gap-2">
      <DateFormField
        className="w-36"
        name="onset_date"
        value={new Date(symptom.onset_date)}
        disableFuture
        disabled={disabled}
        onChange={props.onChange}
        errorClassName="hidden"
      />
      <div className="w-full">
        <SymptomText value={symptom} />
      </div>
      <DateFormField
        className="w-36"
        name="cure_date"
        value={symptom.cure_date ? new Date(symptom.cure_date) : undefined}
        disableFuture
        position="CENTER"
        placeholder="Date of cure"
        disabled={disabled}
        onChange={props.onChange}
        errorClassName="hidden"
      />
      <ButtonV2
        type="button"
        variant="danger"
        className="p-3"
        ghost
        border
        onClick={props.onRemove}
        disabled={disabled}
        tooltip="Mark as entered in error"
        tooltipClassName="tooltip-bottom -translate-x-2/3 translate-y-1 text-xs"
      >
        <CareIcon icon="l-trash" className="text-lg" />
      </ButtonV2>
    </div>
  );
};

const AddSymptom = (props: {
  disabled?: boolean;
  existing: (Writable<ConsultationSymptom> | ConsultationSymptom)[];
  onAdd?: (value: Writable<ConsultationSymptom>[]) => void;
  consultationId?: string;
}) => {
  const [processing, setProcessing] = useState(false);
  const [selected, setSelected] = useState<ConsultationSymptom["symptom"][]>(
    [],
  );
  const [otherSymptom, setOtherSymptom] = useState("");
  const [onsetDate, setOnsetDate] = useState<Date>();

  const activeSymptomIds = props.existing
    .filter((o) => o.symptom !== OTHER_SYMPTOM_CHOICE.id && !o.cure_date)
    .map((o) => o.symptom);

  const handleAdd = async () => {
    const objects = selected.map((symptom) => {
      return {
        symptom,
        onset_date: dateQueryString(onsetDate),
        other_symptom:
          symptom === OTHER_SYMPTOM_CHOICE.id ? otherSymptom : undefined,
      };
    });

    if (props.consultationId) {
      for (const object of objects) {
        await request(SymptomsApi.add, {
          body: object,
          pathParams: { consultationId: props.consultationId },
        });
      }
    }
    props.onAdd?.(objects);

    setSelected([]);
    setOtherSymptom("");
  };

  const hasSymptoms = !!selected.length;
  const otherSymptomValid = selected.includes(OTHER_SYMPTOM_CHOICE.id)
    ? !!otherSymptom.trim()
    : true;

  return (
    <div className="flex w-full items-start gap-4">
      <DateFormField
        className="w-36"
        name="onset_date"
        // label="Date of onset"
        // labelClassName="text-sm"
        placeholder="Date of onset"
        value={onsetDate}
        onChange={({ value }) => setOnsetDate(value)}
      />
      <div className="flex w-full flex-col gap-2">
        <AutocompleteMultiSelectFormField
          id="additional_symptoms"
          name="symptom"
          // label="Symptoms"
          // labelClassName="text-sm"
          className="w-full"
          disabled={props.disabled || processing}
          placeholder="Search for symptoms"
          value={selected}
          onChange={(e) => setSelected(e.value)}
          options={SYMPTOM_CHOICES.filter(
            ({ id }) => !activeSymptomIds.includes(id),
          )}
          optionLabel={(option) => option.text}
          optionValue={(option) => option.id}
          errorClassName="hidden"
        />
        {selected.includes(OTHER_SYMPTOM_CHOICE.id) && (
          <TextAreaFormField
            id="other_symptoms"
            label="Other symptom details"
            labelClassName="text-sm"
            name="other_symptom"
            placeholder="Describe the other symptom"
            value={otherSymptom}
            onChange={({ value }) => setOtherSymptom(value)}
            errorClassName="hidden"
          />
        )}
      </div>
      <ButtonV2
        type="button"
        className="py-3"
        disabled={!hasSymptoms || !otherSymptomValid || !onsetDate}
        tooltip={
          !hasSymptoms
            ? "No symptoms selected to be added"
            : !otherSymptomValid
              ? "Other symptom details not specified"
              : !onsetDate
                ? "No date of onset specified"
                : undefined
        }
        tooltipClassName="tooltip-bottom -translate-x-1/2 text-xs translate-y-1 w-full max-w-96 whitespace-pre-wrap"
        onClick={async () => {
          setProcessing(true);
          await handleAdd();
          setProcessing(false);
        }}
      >
        Add Symptom(s)
      </ButtonV2>
    </div>
  );
};

const NoSymptomsAdded = () => {
  return (
    <div className="flex w-full justify-center gap-2 pb-8 text-center font-medium text-gray-700">
      Patient is Asymptomatic
    </div>
  );
};

const SymptomText = (props: {
  value: Writable<ConsultationSymptom> | ConsultationSymptom;
}) => {
  const symptom =
    SYMPTOM_CHOICES.find(({ id }) => props.value.symptom === id) ||
    OTHER_SYMPTOM_CHOICE;

  const isOtherSymptom = symptom.id === OTHER_SYMPTOM_CHOICE.id;

  return (
    <span className="cui-input-base font-medium">
      {isOtherSymptom ? (
        <>
          <span className="font-normal">Other: </span>
          <span>{props.value.other_symptom}</span>
        </>
      ) : (
        symptom.text
      )}
    </span>
  );
};
