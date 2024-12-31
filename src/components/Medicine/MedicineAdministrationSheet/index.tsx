import { useMemo, useState } from "react";

import SubHeading from "@/CAREUI/display/SubHeading";
import CareIcon from "@/CAREUI/icons/CareIcon";
import ScrollOverlay from "@/CAREUI/interactive/ScrollOverlay";

import ButtonV2 from "@/components/Common/ButtonV2";
import Loading from "@/components/Common/Loading";
import { useEncounter } from "@/components/Facility/ConsultationDetails/EncounterContext";
import MedicineAdministrationTable from "@/components/Medicine/MedicineAdministrationSheet/AdministrationTable";
import { computeActivityBounds } from "@/components/Medicine/MedicineAdministrationSheet/utils";

import useBreakpoints from "@/hooks/useBreakpoints";
import useRangePagination from "@/hooks/useRangePagination";
import useSlug from "@/hooks/useSlug";

import routes from "@/Utils/request/api";
import useTanStackQueryInstead from "@/Utils/request/useQuery";

interface Props {
  readonly?: boolean;
  isPrn: boolean;
}

const DEFAULT_BOUNDS = { start: new Date(), end: new Date() };

const MedicineAdministrationSheet = ({ readonly, isPrn }: Props) => {
  const encounterId = useSlug("encounter");
  const { patient } = useEncounter();

  const [showDiscontinued, setShowDiscontinued] = useState(false);

  const filters = {
    encounter: encounterId,
    is_prn: isPrn,
    limit: 100,
  };

  const activeMedicationRequests = useTanStackQueryInstead(
    routes.medicationRequest.list,
    {
      pathParams: { patientId: patient!.id },
      query: {
        ...filters,
        status: ["active", "on_hold"],
      },
    },
  );

  const discontinuedMedicationRequests = useTanStackQueryInstead(
    routes.medicationRequest.list,
    {
      pathParams: { patientId: patient!.id },
      query: {
        ...filters,
        status: ["completed", "ended", "stopped", "cancelled"],
      },
      prefetch: !showDiscontinued,
    },
  );

  const discontinuedCount = discontinuedMedicationRequests.data?.count;

  const { activityTimelineBounds, prescriptions } = useMemo(() => {
    const prescriptionList = [
      ...(activeMedicationRequests.data?.results.map((request) => ({
        ...request,
        discontinued: false,
      })) ?? []),
    ];

    if (showDiscontinued) {
      prescriptionList.push(
        ...(discontinuedMedicationRequests.data?.results.map((request) => ({
          ...request,
          discontinued: true,
        })) ?? []),
      );
    }

    return {
      prescriptions: prescriptionList.sort(
        (a, b) => +a.discontinued - +b.discontinued,
      ),
      activityTimelineBounds: prescriptionList
        ? computeActivityBounds(prescriptionList)
        : undefined,
    };
  }, [
    activeMedicationRequests.data,
    discontinuedMedicationRequests.data,
    showDiscontinued,
  ]);

  const daysPerPage = useBreakpoints({ default: 1, "2xl": 2 });
  const pagination = useRangePagination({
    bounds: activityTimelineBounds ?? DEFAULT_BOUNDS,
    perPage: daysPerPage * 24 * 60 * 60 * 1000,
    slots: (daysPerPage * 24) / 4, // Grouped by 4 hours
    defaultEnd: true,
  });

  return (
    <div>
      <SubHeading
        title={isPrn ? "PRN Prescriptions" : "Prescriptions"}
        // lastModified={
        //   prescriptions?.[0]?.last_administration?.created_date ??
        //   prescriptions?.[0]?.modified_date
        // }
        /**
         *  TODO: Wire this later
         *    - edit medication request
         *    - print prescription
         *    - bulk administer
         */
        // options={
        //   !readonly &&
        //   !!activeMedicationRequests.data?.results && (
        //     <>
        //       <AuthorizedForConsultationRelatedActions>
        //         <ButtonV2
        //           id="edit-prescription"
        //           variant="secondary"
        //           border
        //           href="prescriptions"
        //           className="w-full"
        //         >
        //           <CareIcon icon="l-pen" className="text-lg" />
        //           <span className="hidden lg:block">
        //             {t("edit_prescriptions")}
        //           </span>
        //           <span className="block lg:hidden">{t("edit")}</span>
        //         </ButtonV2>
        //         <BulkAdminister
        //           prescriptions={activeMedicationRequests.data.results}
        //           onDone={() => activeMedicationRequests.refetch()}
        //         />
        //       </AuthorizedForConsultationRelatedActions>
        //       <ButtonV2
        //         href="prescriptions/print"
        //         ghost
        //         border
        //         disabled={!activeMedicationRequests.data.results.length}
        //         className="w-full"
        //       >
        //         <CareIcon icon="l-print" className="text-lg" />
        //         Print
        //       </ButtonV2>
        //     </>
        //   )
        // }
      />
      <div className="rounded-lg border shadow">
        <ScrollOverlay
          overlay={
            <div className="flex items-center gap-2 pb-2">
              <span className="text-sm">Scroll to view more prescriptions</span>
              <CareIcon
                icon="l-arrow-down"
                className="animate-bounce text-2xl"
              />
            </div>
          }
          disableOverlay={
            activeMedicationRequests.loading ||
            !prescriptions?.length ||
            !(prescriptions?.length > 1)
          }
        >
          {activeMedicationRequests.loading ? (
            <div className="min-h-screen">
              <Loading />
            </div>
          ) : (
            <>
              {prescriptions?.length === 0 && <NoPrescriptions prn={isPrn} />}
              {!!prescriptions?.length && (
                <MedicineAdministrationTable
                  prescriptions={prescriptions}
                  pagination={pagination}
                  onRefetch={() => {
                    activeMedicationRequests.refetch();
                    discontinuedMedicationRequests.refetch();
                  }}
                  readonly={readonly || false}
                />
              )}
            </>
          )}
        </ScrollOverlay>
        {!!discontinuedCount && (
          <ButtonV2
            id="discontinued-medicine"
            variant="secondary"
            className="group sticky left-0 w-full rounded-b-lg rounded-t-none bg-secondary-100"
            disabled={
              activeMedicationRequests.loading ||
              discontinuedMedicationRequests.loading
            }
            onClick={() => setShowDiscontinued(!showDiscontinued)}
          >
            <span className="flex w-full items-center justify-start gap-1 text-xs transition-all duration-200 ease-in-out group-hover:gap-3 md:text-sm">
              <CareIcon
                icon={showDiscontinued ? "l-eye-slash" : "l-eye"}
                className="text-lg"
              />
              <span>
                {showDiscontinued ? "Hide" : "Show"}{" "}
                <strong>{discontinuedCount}</strong> discontinued
                prescription(s)
              </span>
            </span>
          </ButtonV2>
        )}
      </div>
    </div>
  );
};

const NoPrescriptions = ({ prn }: { prn: boolean }) => {
  return (
    <div className="my-16 flex w-full flex-col items-center justify-center gap-4 text-secondary-500">
      <CareIcon icon="l-tablets" className="text-5xl" />
      <h3 className="text-lg font-medium">
        {prn
          ? "No PRN Prescriptions Prescribed"
          : "No Prescriptions Prescribed"}
      </h3>
    </div>
  );
};

export default MedicineAdministrationSheet;
