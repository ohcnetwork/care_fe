import { navigate } from "raviger";

import CareIcon from "@/CAREUI/icons/CareIcon";

import ButtonV2 from "@/components/Common/ButtonV2";
import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import CommentSection from "@/components/Resource/ResourceCommentSection";

import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";
import { classNames, formatDateTime, formatName } from "@/Utils/utils";

export default function ResourceDetails(props: { id: string }) {
  const { data, loading } = useQuery(routes.getResourceDetails, {
    pathParams: { id: props.id },
    onResponse: ({ res, data }) => {
      if (!res && !data) {
        navigate("/not-found");
      }
    },
  });
  const showFacilityCard = (facilityData: any) => {
    return (
      <div className="mt-2 h-full rounded-lg border bg-white p-4 text-black shadow">
        <div>
          <span className="mr-1 font-semibold leading-relaxed">Name: </span>
          {facilityData?.name || "--"}
        </div>
        <div>
          <span className="mr-1 font-semibold leading-relaxed">
            Facility type:{" "}
          </span>
          {facilityData?.facility_type?.name || "--"}
        </div>
        <div>
          <span className="mr-1 font-semibold leading-relaxed">District: </span>
          {facilityData?.district_object?.name || "--"}
        </div>
        <div>
          <span className="mr-1 font-semibold leading-relaxed">
            Local body:{" "}
          </span>
          {facilityData?.local_body_object?.name || "--"}
        </div>
        <div>
          <span className="mr-1 font-semibold leading-relaxed">State: </span>
          {facilityData?.state_object?.name || "--"}
        </div>
      </div>
    );
  };

  if (loading || !data) {
    return <Loading />;
  }

  return (
    <Page
      title={"Resource details"}
      crumbsReplacements={{ [props.id]: { name: data.title } }}
      backUrl={"/resource/board"}
    >
      <div className="mx-3 mb-10 md:mx-8">
        <div className="my-4 flex flex-col items-start md:flex-row md:items-center md:justify-between">
          <ButtonV2 href={`/resource/${props.id}/print`}>
            <CareIcon icon="l-file-alt" className="mr-2 text-lg" /> Approval
            Letter
          </ButtonV2>
        </div>
        {data.assigned_to_object && (
          <div className="relative rounded-lg bg-primary-200 shadow">
            <div className="mx-auto max-w-screen-xl p-3 sm:px-6 lg:px-8">
              <div className="pr-16 sm:px-16 sm:text-center">
                <p className="font-bold text-primary-800">
                  <span className="inline">
                    Assigned to: {formatName(data.assigned_to_object)} -{" "}
                    {data.assigned_to_object.user_type}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="mt-4 h-full rounded-lg border bg-white p-4 text-black shadow">
          <div className="mb-4 flex flex-col sm:flex-row sm:justify-between">
            <div className="text-xl font-semibold">{data.title || "--"}</div>
            <ButtonV2
              data-testid="update-status"
              className="mt-4 sm:mt-2"
              href={`/resource/${data.id}/update`}
            >
              Update Status/Details
            </ButtonV2>
          </div>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <div>
              <span className="font-semibold leading-relaxed">Status: </span>
              <span className="badge badge-pill badge-primary px-2 py-1">
                {data.status}
              </span>
            </div>
            <div>
              <span className="font-semibold leading-relaxed">Category: </span>
              {data.category || "--"}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Subcategory:{" "}
              </span>
              {data.sub_category || "--"}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Required Quantity:{" "}
              </span>
              {data.requested_quantity || "--"}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Contact person at the current facility:{" "}
              </span>
              {data.refering_facility_contact_name || "--"}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Approved Quantity:{" "}
              </span>
              {data.assigned_quantity}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Contact person number:{" "}
              </span>
              {data.refering_facility_contact_number ? (
                <a href={`tel:${data.refering_facility_contact_number}`}>
                  {data.refering_facility_contact_number}
                </a>
              ) : (
                "--"
              )}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                {" "}
                Is emergency:{" "}
              </span>
              <span className="badge badge-pill badge-danger px-2 py-1">
                {" "}
                {data.emergency ? "yes" : "no"}
              </span>
            </div>

            <div className="md:col-span-2 md:row-span-2">
              <div className="font-semibold leading-relaxed">Reason: </div>
              <div className="break-words">{data.reason || "--"}</div>
            </div>
          </div>
        </div>
        <h4 className="mt-8">Audit Log</h4>

        <div className="mt-2 flex justify-between rounded-lg bg-white p-2 px-4 text-center shadow">
          <div className="w-1/2 border-r-2 px-1">
            <div className="text-sm font-medium leading-5 text-black">
              Created
            </div>
            <div className="mt-1 text-sm leading-5 text-secondary-900">
              <div className="text-sm">
                {data.created_by_object && formatName(data.created_by_object)}
              </div>
              <div className="text-xs">
                {data.created_date && formatDateTime(data.created_date)}
              </div>
            </div>
          </div>
          <div className="w-1/2 px-1">
            <div className="text-sm font-medium leading-5 text-black">
              Last Edited
            </div>
            <div className="mt-1 text-sm leading-5 text-secondary-900">
              <div className="text-sm">
                {formatName(data.last_edited_by_object)}
              </div>
              <div className="text-xs">
                {data.modified_date && formatDateTime(data.modified_date)}
              </div>
            </div>
          </div>
        </div>
        <div
          className={classNames(
            "mt-8 grid grid-cols-1 gap-x-6 gap-y-12",
            data.assigned_facility_object ? "lg:grid-cols-3" : "lg:grid-cols-2",
          )}
        >
          <div>
            <h4>Origin Facility</h4>

            {showFacilityCard(data.origin_facility_object)}
          </div>
          <div>
            <h4>Resource Approving Facility</h4>

            {showFacilityCard(data.approving_facility_object)}
          </div>
          {data.assigned_facility_object && (
            <div>
              <h4>Request Fulfilling Facility</h4>

              {showFacilityCard(data.assigned_facility_object)}
            </div>
          )}
        </div>
        <div className="mt-20 w-full">
          <h4 className="mb-4">Comments</h4>
          <CommentSection id={props.id} />
        </div>
      </div>
    </Page>
  );
}
