import { useState } from "react";

import Switch from "@/CAREUI/interactive/Switch";

import { Autocomplete } from "@/components/Form/FormFields/Autocomplete";
import FormField from "@/components/Form/FormFields/FormField";
import {
  FormFieldBaseProps,
  useFormFieldPropsResolver,
} from "@/components/Form/FormFields/Utils";
import { MedibaseMedicine } from "@/components/Medicine/models";

import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";
import { mergeQueryOptions } from "@/Utils/utils";

export default function MedibaseAutocompleteFormField(
  props: FormFieldBaseProps<MedibaseMedicine>,
) {
  const field = useFormFieldPropsResolver(props);

  const [query, setQuery] = useState("");
  const [type, setType] = useState<MedibaseMedicine["type"]>();

  const { data, loading } = useQuery(routes.listMedibaseMedicines, {
    query: { query, type },
  });

  return (
    <FormField
      field={{
        ...field,
        labelSuffix: (
          <Switch
            tabs={{
              all: "All",
              brand: "Brand",
              generic: "Generic",
            }}
            selected={type ?? "all"}
            onChange={(type) => {
              setType(type === "all" ? undefined : type);
            }}
          />
        ),
      }}
    >
      <Autocomplete
        id={field.id}
        disabled={field.disabled}
        value={field.value}
        required
        onChange={field.handleChange}
        options={mergeQueryOptions(
          field.value && !query ? [field.value] : [],
          data ?? [],
          (obj) => obj.id,
        )}
        optionLabel={(option) => option.name.toUpperCase()}
        optionDescription={(option) => <OptionDescription medicine={option} />}
        optionValue={(option) => option}
        optionIcon={(option) =>
          option.type === "brand" ? (
            <OptionChip name="Brand" value={option.company || ""} />
          ) : (
            <OptionChip value={option.type} />
          )
        }
        onQuery={setQuery}
        isLoading={loading}
      />
    </FormField>
  );
}

const OptionDescription = ({ medicine }: { medicine: MedibaseMedicine }) => {
  return (
    <div className="p-1">
      {medicine.atc_classification && (
        <span className="text-xs">
          ATC Class: {medicine.atc_classification}
        </span>
      )}
      <div className="mt-2 flex w-full flex-wrap gap-2">
        <OptionChip name="CIMS Class" value={medicine.cims_class} />
        {medicine.generic && (
          <OptionChip name="Generic" value={medicine.generic} />
        )}
      </div>
    </div>
  );
};

const OptionChip = (props: { name?: string; value: string }) => {
  return (
    <div className="mt-1 flex h-fit max-w-fit gap-1 whitespace-nowrap rounded-full border border-secondary-400 bg-secondary-100 px-2 text-center text-xs uppercase sm:mt-0">
      <span className="font-normal text-secondary-800">
        {props.name && props.name + ":"}
      </span>
      <span className="font-medium text-secondary-900">{props.value}</span>
    </div>
  );
};
