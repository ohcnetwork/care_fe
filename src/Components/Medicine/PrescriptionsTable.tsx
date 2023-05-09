import { useCallback, useEffect, useMemo, useState } from "react";
import ResponsiveMedicineTable from "../Common/components/ResponsiveMedicineTables";
import { formatDate, relativeTime } from "../../Utils/utils";
import { PrescriptionActions } from "../../Redux/actions";
import { useDispatch } from "react-redux";
import { Prescription } from "./models";
import CareIcon from "../../CAREUI/icons/CareIcon";
import ButtonV2 from "../Common/components/ButtonV2";
import SlideOver from "../../CAREUI/interactive/SlideOver";
import MedicineAdministration from "./MedicineAdministration";
import DiscontinuePrescription from "./DiscontinuePrescription";

interface Props {
  is_prn?: boolean;
  consultation_id: string;
}

export default function PrescriptionsTable({
  is_prn = false,
  consultation_id,
}: Props) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>();
  const [showBulkAdminister, setShowBulkAdminister] = useState(false);
  const [showDiscontinueFor, setShowDiscontinueFor] = useState<Prescription>();
  const dispatch = useDispatch<any>();

  const { list, prescription } = useMemo(
    () => PrescriptionActions(consultation_id),
    [consultation_id]
  );

  const fetchPrescriptions = useCallback(() => {
    dispatch(list({ is_prn })).then((res: any) =>
      setPrescriptions(res.data.results)
    );
  }, [consultation_id]);

  useEffect(() => {
    fetchPrescriptions();
  }, [consultation_id]);

  const lastModified = prescriptions?.[0]?.modified_date;

  return (
    <div>
      {prescriptions && (
        <SlideOver
          title="Administer Medicines"
          dialogClass="md:w-[1200px]"
          open={showBulkAdminister}
          setOpen={setShowBulkAdminister}
        >
          <MedicineAdministration
            prescriptions={prescriptions}
            action={prescription}
            onDone={() => setShowBulkAdminister(false)}
          />
        </SlideOver>
      )}
      {showDiscontinueFor && (
        <DiscontinuePrescription
          prescription={showDiscontinueFor}
          actions={prescription(showDiscontinueFor.id!)}
          onClose={() => setShowDiscontinueFor(undefined)}
          key={showDiscontinueFor.id}
        />
      )}
      <div className="flex flex-wrap items-center justify-between mb-2">
        <div className="flex items-center font-semibold leading-relaxed text-gray-900">
          <span className="text-lg mr-3">
            {is_prn ? "PRN Prescriptions" : "Prescriptions"}
          </span>
          <div className="text-gray-600">
            <CareIcon className="care-l-history-alt pr-2" />
            <span className="text-xs">
              {lastModified && formatDate(lastModified)}
            </span>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <ButtonV2
            type="button"
            variant="secondary"
            border
            href="prescriptions"
          >
            <CareIcon className="care-l-pen" />
            Manage Prescriptions
          </ButtonV2>
          <ButtonV2
            type="button"
            ghost
            border
            onClick={() => setShowBulkAdminister(true)}
          >
            <CareIcon className="care-l-syringe text-lg" />
            Administer Medicines
          </ButtonV2>
        </div>
      </div>
      <div className="flex flex-col">
        <div className="-my-2 py-2 overflow-x-auto sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="align-middle inline-block min-w-full shadow overflow-hidden sm:rounded-lg border-b border-gray-200">
            <ResponsiveMedicineTable
              theads={
                is_prn
                  ? [
                      "Medicine",
                      "Route",
                      "Dosage",
                      "Indicator Event",
                      "Max. Dosage in 24 hrs",
                      "Min. time between 2 doses",
                      "Last Administered",
                    ]
                  : [
                      "Medicine",
                      "Route",
                      "Frequency",
                      "Dosage",
                      "Days",
                      "Notes",
                      "Last Administered",
                    ]
              }
              list={
                prescriptions?.map((obj) => ({
                  ...obj,
                  last_administered: obj.last_administered_on
                    ? relativeTime(obj.last_administered_on)
                    : "never",
                })) || []
              }
              objectKeys={
                is_prn
                  ? [
                      "medicine",
                      "route",
                      "dosage",
                      "indicator",
                      "max_dosage",
                      "min_hours_between_doses",
                      "last_administered",
                    ]
                  : [
                      "medicine",
                      "route",
                      "frequency",
                      "dosage",
                      "days",
                      "notes",
                      "last_administered",
                    ]
              }
              fieldsToDisplay={[2, 3]}
              actions={(med: Prescription) => {
                if (med.discontinued) {
                  return (
                    <div className="flex w-full gap-1 items-center justify-center font-medium text-gray-700">
                      <CareIcon className="care-l-ban" />
                      <span className="text-sm">Discontinued</span>
                    </div>
                  );
                }

                return (
                  <div className="flex gap-1">
                    <ButtonV2
                      type="button"
                      size="small"
                      variant="secondary"
                      ghost
                      border
                    >
                      <CareIcon className="care-l-syringe text-base" />
                      Administer
                    </ButtonV2>
                    <ButtonV2
                      type="button"
                      size="small"
                      variant="danger"
                      ghost
                      border
                      onClick={() => setShowDiscontinueFor(med)}
                    >
                      <CareIcon className="care-l-ban text-base" />
                      Discontinue
                    </ButtonV2>
                  </div>
                );
              }}
            />
            {prescriptions?.length === 0 && (
              <div className="flex items-center justify-center text-gray-600 py-2 text-semibold">
                No data found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
