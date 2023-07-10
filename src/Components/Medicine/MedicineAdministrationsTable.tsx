import { useCallback, useEffect, useMemo, useState } from "react";
import ResponsiveMedicineTable from "../Common/components/ResponsiveMedicineTables";
import { formatDate } from "../../Utils/utils";
import { PrescriptionActions } from "../../Redux/actions";
import { useDispatch } from "react-redux";
import { MedicineAdministrationRecord } from "./models";
import CareIcon from "../../CAREUI/icons/CareIcon";
import RecordMeta from "../../CAREUI/display/RecordMeta";
import { useTranslation } from "react-i18next";

interface Props {
  consultation_id: string;
}

export default function MedicineAdministrationsTable({
  consultation_id,
}: Props) {
  const { t } = useTranslation();
  const dispatch = useDispatch<any>();
  const [items, setItems] = useState<MedicineAdministrationRecord[]>();

  const { listAdministrations } = useMemo(
    () => PrescriptionActions(consultation_id),
    [consultation_id]
  );

  const fetchItems = useCallback(() => {
    dispatch(listAdministrations()).then((res: any) =>
      setItems(res.data.results)
    );
  }, [consultation_id]);

  useEffect(() => {
    fetchItems();
  }, [consultation_id]);

  const lastModified = items?.[0]?.modified_date;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between mb-2">
        <div className="flex items-center font-semibold leading-relaxed text-gray-900">
          <span className="text-lg mr-3">
            {t("medicine_administration_history")}
          </span>
          <div className="text-gray-600">
            <CareIcon className="care-l-history-alt pr-2" />
            <span className="text-xs">
              {lastModified && formatDate(lastModified)}
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <div className="-my-2 py-2 overflow-x-auto sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="align-middle inline-block min-w-full shadow sm:rounded-lg border-b border-gray-200">
            <ResponsiveMedicineTable
              theads={["medicine", "notes", "administered_on"].map((_) => t(_))}
              list={
                items?.map((obj) => ({
                  ...obj,
                  medicine: obj.prescription?.medicine,
                  created_date__pretty: (
                    <span className="flex gap-1">
                      <RecordMeta time={obj.created_date} /> by{" "}
                      {obj.administered_by?.first_name}{" "}
                      {obj.administered_by?.last_name}
                    </span>
                  ),
                  ...obj,
                })) || []
              }
              objectKeys={["medicine", "notes", "created_date__pretty"]}
              fieldsToDisplay={[2, 3]}
            />
            {items?.length === 0 && (
              <div className="flex items-center justify-center text-gray-600 py-2 text-semibold">
                {t("no_data_found")}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
