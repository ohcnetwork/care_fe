import dayjs from "dayjs";
import { debounce } from "lodash-es";
import { useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import ButtonV2 from "@/components/Common/ButtonV2";
import AutocompleteMultiSelectFormField from "@/components/Form/FormFields/AutocompleteMultiselect";
import DateFormField from "@/components/Form/FormFields/DateFormField";
import TextAreaFormField from "@/components/Form/FormFields/TextAreaFormField";
import { FieldChangeEvent } from "@/components/Form/FormFields/Utils";
import SymptomsApi from "@/components/Symptoms/api";
import {
  EncounterSymptom,
  EncounterSymptomRequest,
  OTHER_SYMPTOM_CHOICE,
  SYMPTOM_CHOICES,
} from "@/components/Symptoms/types";
import { sortByOnsetDate } from "@/components/Symptoms/utils";

import useSlug from "@/hooks/useSlug";

import { Success } from "@/Utils/Notifications";
import request from "@/Utils/request/request";
import useQuery from "@/Utils/request/useQuery";
import { Writable } from "@/Utils/types";
import { classNames, dateQueryString } from "@/Utils/utils";

import { SelectFormField } from "../Form/FormFields/SelectFormField";
import ModelCrudEditor from "../Form/ModelCrudEditor";

export const CreateSymptomsBuilder = (props: {
  value: Writable<EncounterSymptom>[];
  onChange: (value: Writable<EncounterSymptom>[]) => void;
}) => {
  return (
    <div className="flex w-full flex-col items-start rounded-lg border border-secondary-400">
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
            <li
              key={index}
              id={`symptom-${index}`}
              className="border-b-2 border-dashed border-secondary-400 py-4 last:border-b-0 last:pb-0 md:border-b-0 md:py-2"
            >
              <SymptomEntry
                value={obj}
                onChange={handleUpdate}
                onRemove={handleRemove}
              />
            </li>
          );
        })}
      </ul>

      {props.value.length === 0 && (
        <div className="flex w-full justify-center gap-2 pb-8 text-center font-medium text-secondary-700">
          No symptoms added
        </div>
      )}

      <div className="w-full rounded-b-lg border-t-2 border-dashed border-secondary-400 bg-secondary-100 p-4">
        <AddSymptom
          existing={props.value}
          onAdd={(objects) => props.onChange([...props.value, ...objects])}
        />
      </div>
    </div>
  );
};

export const EncounterSymptomsBuilder = (props: {
  showAll?: boolean;
  onChange?: () => void;
}) => {
  const consultationId = useSlug("consultation");

  const { data, loading, refetch } = useQuery(SymptomsApi.list, {
    pathParams: { consultationId },
    query: { limit: 100 },
  });

  const symptoms = sortByOnsetDate(data?.results || []).filter(
    (item) =>
      props.showAll || item.clinical_impression_status !== "entered-in-error",
  );

  const activeSymptomIds = symptoms
    .filter((o) => o.symptom !== OTHER_SYMPTOM_CHOICE.id && !o.cure_date)
    .map((o) => o.symptom);

  const createSymptom = async (body: EncounterSymptomRequest) => {
    if (Array.isArray(body.symptom)) {
      const { symptom, onset_date, other_symptom } = body;
      const objects = symptom.map((symptom: EncounterSymptom["symptom"]) => {
        return {
          symptom,
          onset_date: dateQueryString(onset_date),
          other_symptom:
            symptom === OTHER_SYMPTOM_CHOICE.id ? other_symptom : undefined,
        };
      });

      if (consultationId) {
        const responses = await Promise.all(
          objects.map((body) =>
            request(SymptomsApi.add, {
              body,
              pathParams: { consultationId: consultationId! },
            }),
          ),
        );

        if (responses.every(({ res }) => !!res?.ok)) {
          Success({ msg: "Symptoms records updated successfully" });
        }
      }
    } else {
      const { res } = await request(SymptomsApi.add, {
        pathParams: { consultationId },
        body,
      });

      if (res?.ok) {
        Success({ msg: "Symptom added successfully" });
      }
    }
    refetch();
  };

  const updateSymptom = async (
    symptomId: string,
    body: EncounterSymptomRequest,
  ) => {
    const { res } = await request(SymptomsApi.partialUpdate, {
      pathParams: { consultationId, external_id: symptomId },
      body,
    });
    if (res?.ok) {
      props.onChange?.();
      refetch();
    }
  };

  const deleteSymptom = async (symptomId: string) => {
    const { res } = await request(SymptomsApi.markAsEnteredInError, {
      pathParams: { consultationId, external_id: symptomId },
    });
    if (res?.ok) {
      props.onChange?.();
      refetch();
    }
  };

  const FormRender = (
    item: EncounterSymptom | EncounterSymptomRequest,
    setItem: (item: EncounterSymptom | EncounterSymptomRequest) => void,
    processing: boolean,
  ) => {
    const [selected, setSelected] = useState<
      EncounterSymptom["symptom"] | EncounterSymptom["symptom"][]
    >(item.symptom || []);

    const [otherSymptom, setOtherSymptom] = useState<string>(
      item.other_symptom || "",
    );
    const [onsetDate, setOnsetDate] = useState<Date | undefined>(
      item.onset_date ? new Date(item.onset_date) : undefined,
    );
    const [onCureDate, setOnCureDate] = useState<Date | undefined>(
      item.cure_date ? new Date(item.cure_date) : undefined,
    );

    const debouncedSetItem = debounce((value: string) => {
      setItem({ other_symptom: value, symptom: item.symptom });
    }, 3500);

    return (
      <div
        className="flex w-full flex-wrap items-start gap-4 md:flex-nowrap"
        data-scribe-subform-creator
      >
        <DateFormField
          name="onset_date"
          id="symptoms_onset_date"
          placeholder="Date of onset"
          disableFuture
          value={onsetDate}
          onChange={({ value }) => {
            if (!dayjs(onsetDate).isSame(dayjs(value), "second")) {
              setOnsetDate(value);
              {
                "id" in item
                  ? setItem({
                      onset_date: dateQueryString(value),
                      id: item.id,
                    })
                  : setItem({ ...item, onset_date: dateQueryString(value) });
              }
            }
          }}
          errorClassName="hidden"
        />
        {"id" in item ? (
          <DateFormField
            className="col-span-3 lg:col-span-2 xl:col-span-1"
            name="cure_date"
            value={onCureDate}
            disableFuture
            placeholder="Date of cure"
            min={new Date(item.onset_date)}
            disabled={processing}
            onChange={({ value }) => {
              if (!dayjs(onCureDate).isSame(dayjs(value), "second")) {
                setOnCureDate(value);
                {
                  "id" in item
                    ? setItem({
                        cure_date: dateQueryString(value),
                        id: item.id,
                      })
                    : setItem({
                        ...(item as EncounterSymptom),
                        cure_date: dateQueryString(value),
                      });
                }
              }
            }}
            errorClassName="hidden"
          />
        ) : (
          <></>
        )}
        <div className="flex w-full flex-col gap-2">
          {"id" in item ? (
            <>
              <SelectFormField
                id="additional_symptoms"
                name="symptom"
                className="w-full"
                disabled={processing}
                placeholder="Search for symptoms"
                value={selected as EncounterSymptom["symptom"][]}
                onChange={(e) => {
                  setSelected(e.value[0]);
                  setItem({
                    symptom: e.value[0],
                    id: item.id,
                  });
                }}
                options={SYMPTOM_CHOICES}
                optionLabel={(option) => option.text}
                optionValue={(option) => [option.id]}
                errorClassName="hidden"
              />
              {selected === OTHER_SYMPTOM_CHOICE.id && (
                <TextAreaFormField
                  id="other_symptoms"
                  label="Other symptom details"
                  labelClassName="text-sm"
                  name="other_symptom"
                  placeholder="Describe the other symptom"
                  value={otherSymptom}
                  onChange={({ value }) => {
                    setOtherSymptom(value);
                    debouncedSetItem(value);
                  }}
                  errorClassName="hidden"
                />
              )}
            </>
          ) : item && "onset_date" in item ? (
            <>
              <AutocompleteMultiSelectFormField
                id="additional_symptoms"
                name="symptom"
                className="w-full"
                disabled={processing}
                placeholder="Search for symptoms"
                value={selected as EncounterSymptom["symptom"][]}
                onChange={(e) => {
                  setSelected(e.value);
                  setItem({
                    ...item,
                    symptom:
                      e.value as (typeof SYMPTOM_CHOICES)[number]["id"][],
                  });
                }}
                options={SYMPTOM_CHOICES.filter(
                  ({ id }) => !activeSymptomIds.includes(id),
                )}
                optionLabel={(option) => option.text}
                optionValue={(option) => option.id}
                errorClassName="hidden"
              />
              {Array.isArray(selected) &&
                (selected as EncounterSymptom["symptom"][]).includes(
                  OTHER_SYMPTOM_CHOICE.id,
                ) && (
                  <TextAreaFormField
                    id="other_symptoms"
                    label="Other symptom details"
                    labelClassName="text-sm"
                    name="other_symptom"
                    placeholder="Describe the other symptom"
                    value={otherSymptom}
                    onChange={({ value }) => {
                      setOtherSymptom(value);
                      setItem({
                        ...(item as EncounterSymptom),
                        other_symptom: value,
                      });
                    }}
                    errorClassName="hidden"
                  />
                )}
            </>
          ) : (
            <></>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <ModelCrudEditor<
        EncounterSymptom,
        EncounterSymptomRequest,
        Record<string, never>
      >
        items={symptoms}
        onCreate={createSymptom}
        onUpdate={updateSymptom}
        onDelete={deleteSymptom}
        loading={loading}
        errors={{}}
        emptyText="Patient is Asymptomatic"
        empty={{
          symptom: [],
          onset_date: undefined,
        }}
        createText="Add Symptom(s)"
        allowCreate={(item) =>
          !item.onset_date && Array.isArray(item.symptom)
            ? !item.symptom.length
            : !item.symptom
        }
      >
        {FormRender}
      </ModelCrudEditor>
    </>
  );
};

const SymptomEntry = (props: {
  disabled?: boolean;
  value: Writable<EncounterSymptom> | EncounterSymptom;
  onChange: (event: FieldChangeEvent<unknown>) => void;
  onRemove: () => void;
}) => {
  const symptom = props.value;
  const disabled =
    props.disabled || symptom.clinical_impression_status === "entered-in-error";
  return (
    <div className="grid grid-cols-6 items-center gap-2 lg:grid-cols-8 xl:grid-cols-5">
      <DateFormField
        className="col-span-3 w-full lg:col-span-2 xl:col-span-1"
        name="onset_date"
        value={new Date(symptom.onset_date)}
        disableFuture
        disabled={disabled}
        onChange={props.onChange}
        errorClassName="hidden"
      />
      <DateFormField
        className="col-span-3 w-full lg:col-span-2 xl:col-span-1"
        name="cure_date"
        value={symptom.cure_date ? new Date(symptom.cure_date) : undefined}
        disableFuture
        placeholder="Date of cure"
        min={new Date(symptom.onset_date)}
        disabled={disabled}
        onChange={props.onChange}
        errorClassName="hidden"
      />
      <div className="col-span-6 flex items-center gap-2 lg:col-span-4 xl:col-span-3">
        <div
          className={classNames(
            "cui-input-base w-full font-medium",
            disabled && "bg-secondary-200",
          )}
        >
          <span
            className={classNames(
              "whitespace-pre-wrap",
              symptom.clinical_impression_status === "entered-in-error" &&
                "line-through decoration-red-500 decoration-2",
            )}
          >
            <SymptomText value={symptom} />
          </span>
          {symptom.clinical_impression_status === "entered-in-error" && (
            <span className="pl-2 text-red-500 no-underline">
              Entered in Error
            </span>
          )}
        </div>
        <ButtonV2
          type="button"
          variant="danger"
          className="p-1"
          size="small"
          circle
          ghost
          border
          onClick={props.onRemove}
          disabled={disabled}
          tooltip="Mark as entered in error"
          tooltipClassName="tooltip-bottom -translate-x-2/3 md:-translate-x-1/2 translate-y-1 text-xs"
        >
          <CareIcon icon="l-times" className="text-base md:text-lg" />
        </ButtonV2>
      </div>
    </div>
  );
};

const AddSymptom = (props: {
  disabled?: boolean;
  existing: (Writable<EncounterSymptom> | EncounterSymptom)[];
  onAdd?: (value: Writable<EncounterSymptom>[]) => void;
  consultationId?: string;
}) => {
  const [processing, setProcessing] = useState(false);
  const [selected, setSelected] = useState<EncounterSymptom["symptom"][]>([]);
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
      const responses = await Promise.all(
        objects.map((body) =>
          request(SymptomsApi.add, {
            body,
            pathParams: { consultationId: props.consultationId! },
          }),
        ),
      );

      if (responses.every(({ res }) => !!res?.ok)) {
        Success({ msg: "Symptoms records updated successfully" });
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
    <div
      className="flex w-full flex-wrap items-start gap-4 md:flex-nowrap"
      data-scribe-subform-creator
    >
      <DateFormField
        name="onset_date"
        id="symptoms_onset_date"
        placeholder="Date of onset"
        disableFuture
        value={onsetDate}
        onChange={({ value }) => setOnsetDate(value)}
        errorClassName="hidden"
      />
      <div className="flex w-full flex-col gap-2">
        <AutocompleteMultiSelectFormField
          id="additional_symptoms"
          name="symptom"
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
        id="add-symptom"
        type="button"
        className="w-full py-3 md:w-auto"
        disabled={
          processing || !hasSymptoms || !otherSymptomValid || !onsetDate
        }
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
        {processing ? (
          <>
            <CareIcon icon="l-spinner-alt" className="animate-spin text-lg" />
            <span>Adding...</span>
          </>
        ) : (
          <span>Add Symptom(s)</span>
        )}
      </ButtonV2>
    </div>
  );
};

export const SymptomText = (props: {
  value: Writable<EncounterSymptom> | EncounterSymptom;
}) => {
  const symptom =
    SYMPTOM_CHOICES.find(({ id }) => props.value.symptom === id) ||
    OTHER_SYMPTOM_CHOICE;

  const isOtherSymptom = symptom.id === OTHER_SYMPTOM_CHOICE.id;

  return (
    <>
      {isOtherSymptom ? (
        <>
          <span className="font-normal">Other: </span>
          <span
            className={classNames(
              !props.value.other_symptom?.trim() && "italic text-secondary-700",
            )}
          >
            {props.value.other_symptom || "Not specified"}
          </span>
        </>
      ) : (
        symptom.text
      )}
      <input
        type="hidden"
        name="symptom"
        value={`${isOtherSymptom ? "Other: " + props.value.other_symptom : symptom.text}`}
        readOnly
      />
    </>
  );
};
