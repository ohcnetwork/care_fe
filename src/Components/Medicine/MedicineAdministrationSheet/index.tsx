import { useTranslation } from "react-i18next";
import useSlug from "../../../Common/hooks/useSlug";
import useQuery from "../../../Utils/request/useQuery";
import MedicineRoutes from "../routes";
import { useEffect, useMemo, useRef, useState } from "react";
import { computeActivityBounds } from "./utils";
import useBreakpoints from "../../../Common/hooks/useBreakpoints";
import SubHeading from "../../../CAREUI/display/SubHeading";
import ButtonV2 from "../../Common/components/ButtonV2";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import BulkAdminister from "./BulkAdminister";
import useRangePagination from "../../../Common/hooks/useRangePagination";
import MedicineAdministrationTable from "./AdministrationTable";
import useIsScrollable from "../../../Common/hooks/useIsScrollable";
import { classNames } from "../../../Utils/utils";

interface Props {
  readonly?: boolean;
  is_prn: boolean;
}

const DEFAULT_BOUNDS = { start: new Date(), end: new Date() };

const MedicineAdministrationSheet = ({ readonly, is_prn }: Props) => {
  const { t } = useTranslation();
  const consultation = useSlug("consultation");

  const { isScrollable, ref } = useIsScrollable();

  const [showDiscontinued, setShowDiscontinued] = useState(false);

  const filters = { is_prn, prescription_type: "REGULAR", limit: 100 };

  const { data, refetch } = useQuery(MedicineRoutes.listPrescriptions, {
    pathParams: { consultation },
    query: { ...filters, discontinued: showDiscontinued ? undefined : false },
  });

  const discontinuedCount = useQuery(MedicineRoutes.listPrescriptions, {
    pathParams: { consultation },
    query: { ...filters, discontinued: true },
    prefetch: !showDiscontinued,
  }).data?.count;

  const { activityTimelineBounds, prescriptions } = useMemo(
    () => ({
      prescriptions: data?.results?.sort(
        (a, b) => +a.discontinued - +b.discontinued
      ),
      activityTimelineBounds: data
        ? computeActivityBounds(data.results)
        : undefined,
    }),
    [data]
  );

  const daysPerPage = useBreakpoints({ default: 1, "2xl": 2 });
  const pagination = useRangePagination({
    bounds: activityTimelineBounds ?? DEFAULT_BOUNDS,
    perPage: daysPerPage * 24 * 60 * 60 * 1000,
    slots: (daysPerPage * 24) / 4, // Grouped by 4 hours
    defaultEnd: true,
  });

  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (divRef.current) {
      const isScrollable =
        divRef.current.scrollHeight > divRef.current.clientHeight;

      console.log(`Is div scrollable? ${isScrollable ? "Yes" : "No"}`);
    }
  }, [prescriptions]);

  return (
    <div>
      <SubHeading
        title={is_prn ? "PRN Prescriptions" : "Prescriptions"}
        lastModified={
          prescriptions?.[0]?.last_administered_on ??
          prescriptions?.[0]?.modified_date
        }
        options={
          !readonly &&
          !!data?.results && (
            <>
              <ButtonV2
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
            </>
          )
        }
      />

      <div
        className="relative max-h-[80vh] overflow-auto rounded-lg border border-black/10 shadow md:max-h-[90vh]"
        ref={ref}
      >
        {prescriptions?.length === 0 && <NoPrescriptions prn={is_prn} />}

        {!!prescriptions?.length && (
          <MedicineAdministrationTable
            prescriptions={prescriptions}
            pagination={pagination}
            onRefetch={refetch}
          />
        )}

        {!showDiscontinued && !!discontinuedCount && (
          <ButtonV2
            variant="secondary"
            className="sticky left-0 z-10 w-full"
            ghost
            onClick={() => setShowDiscontinued(true)}
          >
            <span className="flex w-full justify-start gap-1 text-sm">
              <CareIcon icon="l-eye" className="text-lg" />
              <span>
                Show <strong>{discontinuedCount}</strong> other discontinued
                prescription(s)
              </span>
            </span>
          </ButtonV2>
        )}

        <div
          className={classNames(
            "sticky inset-x-0 bottom-0 z-10 flex items-end justify-center bg-gradient-to-t from-gray-900/90 to-transparent pb-2 text-white transition-all duration-500 ease-in-out",
            isScrollable ? "h-16 opacity-75" : "h-0 opacity-0"
          )}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">Scroll to view more prescriptions</span>
            <CareIcon icon="l-arrow-down" className="animate-bounce text-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicineAdministrationSheet;

const NoPrescriptions = ({ prn }: { prn: boolean }) => {
  return (
    <div className="my-16 flex w-full flex-col items-center justify-center gap-4 text-gray-500">
      <CareIcon icon="l-tablets" className="text-5xl" />
      <h3 className="text-lg font-medium">
        {prn
          ? "No PRN Prescriptions Prescribed"
          : "No Prescriptions Prescribed"}
      </h3>
    </div>
  );
};
