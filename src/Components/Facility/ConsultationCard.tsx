import { navigate } from "raviger";
import { ConsultationModel } from "./models";
import { formatDateTime } from "../../Utils/utils";
import ButtonV2 from "../Common/components/ButtonV2";
import { NonReadOnlyUsers } from "../../Utils/AuthorizeFor";
import RelativeDateUserMention from "../Common/RelativeDateUserMention";
import useConfig from "../../Common/hooks/useConfig";

interface ConsultationProps {
  itemData: ConsultationModel;
  isLastConsultation?: boolean;
}

export const ConsultationCard = (props: ConsultationProps) => {
  const { itemData, isLastConsultation } = props;
  const { kasp_string } = useConfig();
  return (
    <div className="mt-4 block cursor-pointer rounded-lg border bg-white p-4 text-black shadow hover:border-primary-500">
      {itemData.is_kasp && (
        <div className="ml-3 mt-2 inline-flex items-center rounded-md bg-yellow-100 px-2.5 py-0.5 text-sm font-medium leading-5 text-yellow-800">
          {kasp_string}
        </div>
      )}

      <div className="ml-2 mt-2 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="sm:col-span-1">
          <div className="sm:col-span-1">
            <div className="text-sm font-semibold leading-5 text-zinc-400">
              Facility
            </div>
            <div className="mt-1 overflow-x-scroll whitespace-normal break-words text-sm font-medium leading-5">
              {itemData.facility_name}{" "}
              {itemData.is_telemedicine && (
                <span className="ml-2">(Telemedicine)</span>
              )}
            </div>
          </div>
        </div>
        <div className="sm:col-span-1">
          <div className="capitalize">
            <div className="sm:col-span-1">
              <div className="text-sm font-semibold leading-5 text-zinc-400">
                Suggestion{" "}
              </div>
              <div className="mt-1 overflow-x-scroll whitespace-normal break-words text-sm font-medium leading-5">
                {itemData.suggestion_text?.toLocaleLowerCase()}
              </div>
            </div>
          </div>
        </div>
        {itemData.kasp_enabled_date && (
          <div className="sm:col-span-1">
            <div className="sm:col-span-1">
              <div className="text-sm font-semibold leading-5 text-zinc-400">
                {kasp_string} Enabled date{" "}
              </div>
              <div className="mt-1 overflow-x-scroll whitespace-normal break-words text-sm font-medium leading-5">
                {itemData.kasp_enabled_date
                  ? formatDateTime(itemData.kasp_enabled_date)
                  : "-"}
              </div>
            </div>
          </div>
        )}
        {itemData.admitted && itemData.admission_date && (
          <div className="sm:col-span-1">
            <div className="sm:col-span-1">
              <div className="text-sm font-semibold leading-5 text-zinc-400">
                Admitted on
              </div>
              <div className="mt-1 overflow-x-scroll whitespace-normal break-words text-sm font-medium leading-5">
                {formatDateTime(itemData.admission_date)}
              </div>
            </div>
          </div>
        )}
        {!itemData.admitted && (
          <div className="sm:col-span-1">
            <div className="sm:col-span-1">
              <div className="text-sm font-semibold leading-5 text-zinc-400">
                Admitted{" "}
              </div>
              <div className="mt-1 overflow-x-scroll whitespace-normal break-words text-sm font-medium leading-5">
                No
              </div>
            </div>
          </div>
        )}
        {itemData.discharge_date && (
          <div className="sm:col-span-1">
            <div className="sm:col-span-1">
              <div className="text-sm font-semibold leading-5 text-zinc-400">
                Discharged on{" "}
              </div>
              <div className="mt-1 overflow-x-scroll whitespace-normal break-words text-sm font-medium leading-5">
                {formatDateTime(itemData.discharge_date)}
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="mt-8 flex flex-col">
        {
          <div className="flex flex-col items-center text-sm text-gray-700 md:flex-row">
            Created:{" "}
            <RelativeDateUserMention
              tooltipPosition="right"
              actionDate={itemData.created_date}
              user={itemData.created_by}
            />
          </div>
        }
        <div className="flex flex-col items-center text-sm text-gray-700 md:flex-row">
          Last Modified:{" "}
          <RelativeDateUserMention
            tooltipPosition="right"
            actionDate={itemData.modified_date}
            user={itemData.last_edited_by}
          />
        </div>
      </div>
      <div className="mt-4 flex w-full flex-col justify-between gap-1 md:flex-row">
        <ButtonV2
          className="h-auto whitespace-pre-wrap border border-gray-500 bg-white text-black hover:bg-gray-300"
          onClick={() =>
            navigate(
              `/facility/${itemData.facility}/patient/${itemData.patient}/consultation/${itemData.id}`
            )
          }
        >
          View Consultation / Consultation Updates
        </ButtonV2>
        <ButtonV2
          className="h-auto whitespace-pre-wrap border border-gray-500 bg-white text-black hover:bg-gray-300"
          onClick={() =>
            navigate(
              `/facility/${itemData.facility}/patient/${itemData.patient}/consultation/${itemData.id}/files/`
            )
          }
        >
          View / Upload Consultation Files
        </ButtonV2>
        {isLastConsultation && (
          <ButtonV2
            className="h-auto whitespace-pre-wrap border border-gray-500 bg-white text-black hover:bg-gray-300"
            onClick={() =>
              navigate(
                `/facility/${itemData.facility}/patient/${itemData.patient}/consultation/${itemData.id}/daily-rounds`
              )
            }
            authorizeFor={NonReadOnlyUsers}
          >
            Add Consultation Updates
          </ButtonV2>
        )}
      </div>
    </div>
  );
};
