import { SyntheticEvent, useState } from "react";
import { useTranslation } from "react-i18next";

import Card from "@/CAREUI/display/Card";

import { Cancel, Submit } from "@/components/Common/ButtonV2";
import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import CheckBoxFormField from "@/components/Form/FormFields/CheckBoxFormField";
import { SelectFormField } from "@/components/Form/FormFields/SelectFormField";
import TextAreaFormField from "@/components/Form/FormFields/TextAreaFormField";
import TextFormField from "@/components/Form/FormFields/TextFormField";

import useAppHistory from "@/hooks/useAppHistory";

import { LOCATION_BED_TYPES } from "@/common/constants";

import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import useQuery from "@/Utils/request/useQuery";

interface Props {
  facilityId: string;
  locationId: string;
  bedId?: string;
}

export const AddBedForm = ({ facilityId, locationId, bedId }: Props) => {
  const { t } = useTranslation();
  const { goBack } = useAppHistory();
  const [state, setState] = useState({
    name: "",
    description: "",
    bed_type: "",
    facility: facilityId,
    location: locationId,
  });

  const [multipleBeds, setMultipleBeds] = useState(false);
  const [numberOfBeds, setNumberOfBeds] = useState(1);
  const [errors, setErrors] = useState({
    name: "",
    description: "",
    bedType: "",
    numberOfBeds: "",
  });

  const { data: location } = useQuery(routes.getFacilityAssetLocation, {
    pathParams: {
      facility_external_id: facilityId,
      external_id: locationId,
    },
  });

  const { data, loading } = useQuery(routes.getFacilityBed, {
    pathParams: { external_id: bedId ?? "" },
    prefetch: !!bedId,
    onResponse: ({ data }) => {
      setState({
        name: data?.name ?? "",
        description: data?.description ?? "",
        bed_type: data?.bed_type ?? "",
        facility: facilityId,
        location: locationId,
      });
    },
  });

  const validateInputs = (data: {
    name: string;
    description: string;
    bed_type: string;
    number_of_beds?: number;
  }) => {
    let isValid = true;
    if (!data.name) {
      isValid = false;
      setErrors((prev) => ({ ...prev, name: "Please enter a name" }));
    }
    if (!data.bed_type) {
      isValid = false;
      setErrors((prev) => ({ ...prev, bedType: "Please select a bed type" }));
    }
    if (multipleBeds === false) {
      setNumberOfBeds(1);
    }
    if (data.number_of_beds !== undefined && data.number_of_beds < 1) {
      isValid = false;
      setErrors((prev) => ({
        ...prev,
        numberOfBeds: "Please enter a number larger than 0.",
      }));

      if (data.number_of_beds > 100) {
        isValid = false;
        setErrors((prev) => ({
          ...prev,
          numberOfBeds: "Please enter a number smaller than or equal to 100.",
        }));
      }
    }

    return isValid;
  };

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();

    const data = bedId
      ? { ...state }
      : { ...state, number_of_beds: numberOfBeds };

    if (!validateInputs(data)) return;

    const onSuccess = (msg: string) => {
      Notification.Success({ msg });
      goBack();
    };

    if (bedId) {
      // Update
      const { res } = await request(routes.updateFacilityBed, {
        pathParams: { external_id: bedId },
        body: { ...data, facility: facilityId, location: locationId },
      });
      res?.ok && onSuccess("Bed updated successfully");
    } else {
      // Create
      const { res } = await request(routes.createFacilityBed, {
        body: { ...data, facility: facilityId, location: locationId },
      });
      res?.ok &&
        onSuccess(t("bed_created_notification", { count: numberOfBeds }));
    }
  };

  if (loading) {
    return <Loading />;
  }

  const action = t(!bedId ? "add_beds" : "update_bed");

  return (
    <div className="mx-auto max-w-3xl px-2 pb-2">
      <Page
        title={action}
        backUrl={`/facility/${facilityId}/location/${locationId}/beds`}
        crumbsReplacements={{
          [facilityId]: { name: location?.facility?.name },
          [locationId]: {
            name: location?.name,
            uri: `/facility/${facilityId}/location`,
          },
          ...(bedId && {
            [bedId]: {
              name: data?.name,
              uri: `/facility/${facilityId}/location/${locationId}/beds`,
            },
          }),
        }}
      >
        <Card className="mt-10 lg:p-6">
          <form onSubmit={(e) => handleSubmit(e)}>
            <TextFormField
              name="name"
              type="text"
              label={t("name")}
              id="bed-name"
              required
              value={state.name}
              onChange={(e) => setState((p) => ({ ...p, [e.name]: e.value }))}
              error={errors.name}
            />
            <TextAreaFormField
              id="bed-description"
              rows={5}
              label={t("description")}
              name="description"
              value={state.description}
              onChange={(e) => setState((p) => ({ ...p, [e.name]: e.value }))}
              error={errors.description}
            />

            <SelectFormField
              id="bed-type"
              className="w-full"
              name="bed_type"
              label={t("bed_type")}
              required
              options={LOCATION_BED_TYPES}
              optionLabel={(option) => option.name}
              optionValue={(option) => option.id}
              value={state.bed_type}
              onChange={(e) => setState((p) => ({ ...p, [e.name]: e.value }))}
              error={errors.bedType}
            />

            {!bedId && (
              <>
                <CheckBoxFormField
                  id="multiplebed-checkbox"
                  label={t("make_multiple_beds_label")}
                  onChange={({ value }) => {
                    setMultipleBeds(value);
                    if (value) {
                      setNumberOfBeds(1);
                    }
                  }}
                  name={"multipleBeds"}
                />
                <TextFormField
                  id="numberofbed"
                  name="number_of_beds"
                  disabled={!multipleBeds}
                  label={t("number_of_beds")}
                  type="number"
                  value={numberOfBeds.toString()}
                  min={1}
                  max={100}
                  onChange={(e) => setNumberOfBeds(Number(e.value))}
                  error={
                    numberOfBeds > 100
                      ? t("number_of_beds_out_of_range_error")
                      : undefined
                  }
                />
              </>
            )}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Cancel onClick={() => goBack()} />
              <Submit
                onClick={handleSubmit}
                label={action}
                disabled={numberOfBeds > 100}
              />
            </div>
          </form>
        </Card>
      </Page>
    </div>
  );
};
