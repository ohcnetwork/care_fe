import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import PrintPreview from "@/CAREUI/misc/PrintPreview";

import Loading from "@/components/Common/Loading";

import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";
import { formatDateTime } from "@/Utils/utils";

export default function ResourcePrintPreview(props: { id: string }) {
  const { t } = useTranslation();
  const { data, loading } = useQuery(routes.getResourceDetails, {
    pathParams: { id: props.id },
    onResponse: ({ res, data }) => {
      if (!res && !data) {
        navigate("/not-found");
      }
    },
  });

  if (loading || !data) {
    return <Loading />;
  }

  const ApprovalLetter = (data: any) => {
    return (
      <div id="section-to-print" className="print bg-white">
        <div className="mx-4 p-2 lg:mx-20">
          <div className="mt-6 text-center text-xl font-bold">
            APPROVAL LETTER
          </div>
          <div className="mt-6 text-right">
            <span className="font-semibold leading-relaxed">
              {" "}
              Date and Time:{" "}
            </span>
            {formatDateTime(data.created_date)}
          </div>
          <div className="mt-2 text-right">
            <span className="font-semibold leading-relaxed"> Unique Id: </span>
            {data.id}
          </div>

          <div className="mt-4">
            <div>To,</div>
          </div>
          <div className="mt-2">
            <div className="p-4 pt-0">
              <div>{data.origin_facility_object?.name || "--"}</div>
              <div>
                {data.origin_facility_object?.facility_type?.name || "--"}
              </div>
              <div>
                {data.origin_facility_object?.district_object?.name || "--"}
              </div>
              <div>
                {data.origin_facility_object?.local_body_object?.name || "--"}
              </div>
              <div>
                {data.origin_facility_object?.state_object?.name || "--"}
              </div>
            </div>
            {data.status === "REJECTED" ||
            data.status === "PENDING" ||
            data.status === "ON HOLD" ? (
              <div className="mt-4">
                <span className="leading-relaxed">
                  The request for resource (details below) placed by yourself is{" "}
                </span>
                <text className="font-semibold">{data.status}</text>
              </div>
            ) : data.status === "APPROVED" ? (
              <div className="mt-4">
                <span className="leading-relaxed">
                  The request for resource (details below) placed by yourself is{" "}
                </span>
                <text className="font-semibold">{data.status}</text>
              </div>
            ) : (
              <div className="mt-4">
                <span className="leading-relaxed">
                  The request for resource (details below) placed by yourself is{" "}
                </span>
                <text className="font-semibold">APPROVED</text>
                <span className="leading-relaxed">
                  and the status of request is{" "}
                </span>
                <text className="font-semibold">{data.status}</text>
              </div>
            )}
            <div className="mt-4">
              <span className="font-semibold leading-relaxed">
                Title of Request:{" "}
              </span>
              {data.title || "--"}
            </div>
            <div className="mt-1">
              <span className="font-semibold leading-relaxed">
                Description of Request:{" "}
              </span>
              {data.reason || "--"}
            </div>
            <div className="mt-4">
              <span className="font-semibold leading-relaxed">
                Quantity Requested:{" "}
              </span>
              {data.requested_quantity}
            </div>
            <div className="mt-2">
              <span className="font-semibold leading-relaxed">
                QUANTITY APPROVED:{" "}
              </span>
              {data.assigned_quantity}
            </div>
          </div>
          {data.assigned_facility_object ? (
            <div className="mt-4">
              The request will be fulfilled by{" "}
              {data.assigned_facility_object.facility_type?.name}, District{" "}
              {data.assigned_facility_object.district_type?.name}, LSG
              {data.assigned_facility_object.local_body_object?.name},
              {data.assigned_facility_object.state_object?.name}
            </div>
          ) : null}
          <div className="mt-10 flex">
            <div>
              <div className="font-semibold">APPROVED BY</div>
              <div className="mt-3">
                <div>
                  <div>{data.approving_facility_object?.name || "--"}</div>
                  <div className="mt-2">
                    {data.approving_facility_object?.facility_type?.name ||
                      "--"}
                  </div>
                  <div className="mt-2">
                    {data.approving_facility_object?.district_object?.name ||
                      "--"}
                  </div>
                  <div className="mt-2">
                    {data.approving_facility_object?.local_body_object?.name ||
                      "--"}
                  </div>
                  <div className="mt-2">
                    {data.approving_facility_object?.state_object?.name || "--"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <PrintPreview
      title={t("Resource details")}
      backUrl={`/resource/${props.id}`}
      crumbsReplacements={{ [props.id]: { name: data.title } }}
    >
      {ApprovalLetter(data)}
    </PrintPreview>
  );
}
