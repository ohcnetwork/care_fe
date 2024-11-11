import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { FacilitySelect } from "@/components/Common/FacilitySelect";
import FacilityBlock from "@/components/Facility/FacilityBlock";
import {
  FacilityModel,
  FacilitySpokeErrors,
  FacilitySpokeModel,
  FacilitySpokeRequest,
  SpokeRelationship,
} from "@/components/Facility/models";
import { SelectFormField } from "@/components/Form/FormFields/SelectFormField";
import ModelCrudEditor from "@/components/Form/ModelCrudEditor";

import { SPOKE_RELATION_TYPES } from "@/common/constants";

import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import useQuery from "@/Utils/request/useQuery";

export interface SpokeFacilityEditorProps {
  facility: Omit<FacilityModel, "id"> & { id: string };
}

export default function SpokeFacilityEditor(props: SpokeFacilityEditorProps) {
  const { facility } = props;

  const { t } = useTranslation();

  const spokesQuery = useQuery(routes.getFacilitySpokes, {
    pathParams: {
      id: facility.id,
    },
  });

  const spokes = spokesQuery.data?.results;

  const createSpoke = (body: FacilitySpokeRequest) =>
    request(routes.createFacilitySpoke, {
      body,
      pathParams: {
        id: facility.id,
      },
      onResponse: ({ res }) => {
        if (res?.ok) {
          spokesQuery.refetch();
        }
      },
    });

  const deleteSpoke = (spokeFacilityId: string) =>
    request(routes.deleteFacilitySpoke, {
      pathParams: {
        id: facility.id,
        spoke_id: spokeFacilityId,
      },
      onResponse: ({ res }) => {
        if (res?.ok) {
          spokesQuery.refetch();
        }
      },
    });

  const updateSpoke = (spokeFacilityId: string, body: FacilitySpokeRequest) =>
    request(routes.updateFacilitySpokes, {
      pathParams: {
        id: facility.id,
        spoke_id: spokeFacilityId,
      },
      body,
      onResponse: ({ res }) => {
        if (res?.ok) {
          spokesQuery.refetch();
        }
      },
    });

  const FormRender = (
    item: FacilitySpokeModel | FacilitySpokeRequest,
    setItem: (item: FacilitySpokeModel | FacilitySpokeRequest) => void,
    processing: boolean,
  ) => {
    const [selectedFacility, setSelectedFacility] =
      useState<FacilityModel | null>(null);

    useEffect(() => {
      setItem({ ...item, spoke: selectedFacility?.id });
    }, [selectedFacility]);

    return (
      <div className="flex w-full flex-col items-center gap-4 md:flex-row">
        {"id" in item ? (
          <div className="w-full">
            <FacilityBlock facility={item.spoke_object} />
          </div>
        ) : (
          <FacilitySelect
            multiple={false}
            name="facility"
            placeholder={t("add_spoke")}
            showAll={false}
            showNOptions={8}
            selected={selectedFacility}
            setSelected={(v) =>
              (v === null || !Array.isArray(v)) && setSelectedFacility(v)
            }
            errors=""
            className="w-full"
            disabled={processing}
            filter={(f) =>
              !!f.id &&
              facility.id !== f.id &&
              !spokes?.flatMap((s) => s.spoke_object.id).includes(f.id)
            }
          />
        )}
        <SelectFormField
          name="relationship_type"
          options={SPOKE_RELATION_TYPES}
          optionLabel={(v) => v.text}
          optionValue={(v) => v.value}
          value={item.relationship}
          onChange={(v) => setItem({ ...item, relationship: v.value })}
          errorClassName="hidden"
          className="w-full shrink-0 md:w-auto"
          disabled={processing}
        />
      </div>
    );
  };

  return (
    <>
      <ModelCrudEditor<
        FacilitySpokeModel,
        FacilitySpokeRequest,
        FacilitySpokeErrors
      >
        items={spokes}
        onCreate={createSpoke}
        onUpdate={updateSpoke}
        onDelete={deleteSpoke}
        loading={spokesQuery.loading}
        errors={{}}
        emptyText={"No Spokes"}
        empty={{
          spoke: "",
          relationship: SpokeRelationship.REGULAR,
        }}
        createText="Add Spoke"
        allowCreate={(item) => !item.relationship || !item.spoke}
      >
        {FormRender}
      </ModelCrudEditor>
    </>
  );
}
