import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import SubHeading from "@/CAREUI/display/SubHeading";
import CareIcon from "@/CAREUI/icons/CareIcon";
import ScrollOverlay from "@/CAREUI/interactive/ScrollOverlay";
import { AuthorizedForConsultationRelatedActions } from "@/CAREUI/misc/AuthorizedChild";

import ButtonV2 from "@/components/Common/ButtonV2";
import Loading from "@/components/Common/Loading";
import MedicineAdministrationTable from "@/components/Medicine/MedicineAdministrationSheet/AdministrationTable";
import BulkAdminister from "@/components/Medicine/MedicineAdministrationSheet/BulkAdminister";
import { computeActivityBounds } from "@/components/Medicine/MedicineAdministrationSheet/utils";
import MedicineRoutes from "@/components/Medicine/routes";

import useBreakpoints from "@/hooks/useBreakpoints";
import useRangePagination from "@/hooks/useRangePagination";
import useSlug from "@/hooks/useSlug";

import useQuery from "@/Utils/request/useQuery";

interface Props {
  readonly?: boolean;
  is_prn: boolean;
}

const DEFAULT_BOUNDS = { start: new Date(), end: new Date() };

const MedicineAdministrationSheet = ({ readonly, is_prn }: Props) => {
  const { t } = useTranslation();
  const consultation = useSlug("consultation");

  const [showDiscontinued, setShowDiscontinued] = useState(false);

  const filters = {
    dosage_type: is_prn ? "PRN" : "REGULAR,TITRATED",
    prescription_type: "REGULAR",
    limit: 100,
  };

  const { data, loading, refetch } = useQuery(
    MedicineRoutes.listPrescriptions,
    {
      pathParams: { consultation },
      query: { ...filters, discontinued: false },
    },
  );

  const discontinuedPrescriptions = useQuery(MedicineRoutes.listPrescriptions, {
    pathParams: { consultation },
    query: {
      ...filters,
      limit: 100,
      discontinued: true,
    },
    prefetch: !showDiscontinued,
  });

  const discontinuedCount = discontinuedPrescriptions.data?.count;

  const prescriptionList = [
    ...(data?.results ?? []),
    ...(showDiscontinued
      ? (discontinuedPrescriptions.data?.results ?? [])
      : []),
  ];

  const { activityTimelineBounds, prescriptions } = useMemo(
    () => ({
      prescriptions: prescriptionList.sort(
        (a, b) => +a.discontinued - +b.discontinued,
      ),
      activityTimelineBounds: prescriptionList
        ? computeActivityBounds(prescriptionList)
        : undefined,
    }),
    [prescriptionList],
  );

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
        title={is_prn ? "PRN Prescriptions" : "Prescriptions"}
        lastModified={
          prescriptions?.[0]?.last_administration?.created_date ??
          prescriptions?.[0]?.modified_date
        }
        options={
          !readonly &&
          !!data?.results && (
            <>
              <AuthorizedForConsultationRelatedActions>
                <ButtonV2
                  id="edit-prescription"
                  variant="secondary"
                  border
                  href="prescriptions"
                  className="w-full"
                >
                  <CareIcon icon="l-pen" className="text-lg" />
                  <span className="hidden lg:block">
                    {t("edit_prescriptions")}
                  </span>
                  <span className="block lg:hidden">{t("edit")}</span>
                </ButtonV2>
                <BulkAdminister
                  prescriptions={data.results}
                  onDone={() => refetch()}
                />
              </AuthorizedForConsultationRelatedActions>
              <ButtonV2
                href="prescriptions/print"
                ghost
                border
                disabled={!data.results.length}
                className="w-full"
              >
                <CareIcon icon="l-print" className="text-lg" />
                Print
              </ButtonV2>
            </>
          )
        }
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
            loading || !prescriptions?.length || !(prescriptions?.length > 1)
          }
        >
          {loading ? (
            <div className="min-h-screen">
              <Loading />
            </div>
          ) : (
            <>
              {prescriptions?.length === 0 && <NoPrescriptions prn={is_prn} />}
              {!!prescriptions?.length && (
                <MedicineAdministrationTable
                  prescriptions={prescriptions}
                  pagination={pagination}
                  onRefetch={() => {
                    refetch();
                    discontinuedPrescriptions.refetch();
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
            disabled={loading || discontinuedPrescriptions.loading}
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

export default MedicineAdministrationSheet;

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
