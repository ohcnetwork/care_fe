import { useCallback, useEffect, useMemo, useState } from "react";
import { PrescriptionActions } from "../../Redux/actions";
import { useDispatch } from "react-redux";
import { MedicineAdministrationRecord, Prescription } from "./models";
import CareIcon from "../../CAREUI/icons/CareIcon";
import ButtonV2, { Cancel, Submit } from "../Common/components/ButtonV2";
import SlideOver from "../../CAREUI/interactive/SlideOver";
import MedicineAdministration from "./MedicineAdministration";
import DiscontinuePrescription from "./DiscontinuePrescription";
import AdministerMedicine from "./AdministerMedicine";
import DialogModal from "../Common/Dialog";
import PrescriptionDetailCard from "./PrescriptionDetailCard";
import { useTranslation } from "react-i18next";
import SubHeading from "../../CAREUI/display/SubHeading";
import dayjs from "../../Utils/dayjs";
import {
  classNames,
  formatDate,
  formatDateTime,
  formatTime,
} from "../../Utils/utils";
import useRangePagination from "../../Common/hooks/useRangePagination";
import EditPrescriptionForm from "./EditPrescriptionForm";

interface DateRange {
  start: Date;
  end: Date;
}

interface Props {
  prn: boolean;
  prescription_type?: Prescription["prescription_type"];
  consultation_id: string;
  readonly?: boolean;
}

interface State {
  prescriptions: Prescription[];
  administrationsTimeBounds: DateRange;
}

export default function PrescriptionAdministrationsTable({
  prn,
  consultation_id,
  readonly,
}: Props) {
  const dispatch = useDispatch<any>();
  const { t } = useTranslation();

  const [state, setState] = useState<State>();
  const [showDiscontinued, setShowDiscontinued] = useState(false);
  const [discontinuedCount, setDiscontinuedCount] = useState<number>();
  const pagination = useRangePagination({
    bounds: state?.administrationsTimeBounds ?? {
      start: new Date(),
      end: new Date(),
    },
    perPage: 24 * 60 * 60 * 1000,
    slots: 24,
    defaultEnd: true,
  });
  const [showBulkAdminister, setShowBulkAdminister] = useState(false);

  const { list, prescription } = useMemo(
    () => PrescriptionActions(consultation_id),
    [consultation_id]
  );

  const refetch = useCallback(async () => {
    const filters = {
      is_prn: prn,
      prescription_type: "REGULAR",
    };

    const res = await dispatch(
      list(showDiscontinued ? filters : { ...filters, discontinued: false })
    );

    setState({
      prescriptions: (res.data.results as Prescription[]).sort(
        (a, b) => (a.discontinued ? 1 : 0) - (b.discontinued ? 1 : 0)
      ),
      administrationsTimeBounds: getAdministrationBounds(res.data.results),
    });

    if (showDiscontinued === false) {
      const discontinuedRes = await dispatch(
        list({ ...filters, discontinued: true, limit: 0 })
      );
      setDiscontinuedCount(discontinuedRes.data.count);
    }
  }, [consultation_id, showDiscontinued, dispatch]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <div>
      {state?.prescriptions && (
        <SlideOver
          title={t("administer_medicines")}
          dialogClass="w-full max-w-sm sm:max-w-md md:max-w-[1300px]"
          open={showBulkAdminister}
          setOpen={setShowBulkAdminister}
        >
          <MedicineAdministration
            prescriptions={state.prescriptions}
            action={prescription}
            onDone={() => {
              setShowBulkAdminister(false);
              refetch();
            }}
          />
        </SlideOver>
      )}

      <SubHeading
        title={prn ? "PRN Prescriptions" : "Prescriptions"}
        lastModified={
          state?.prescriptions?.[0]?.last_administered_on ??
          state?.prescriptions?.[0]?.modified_date
        }
        options={
          !readonly && (
            <>
              <ButtonV2
                variant="secondary"
                border
                href="prescriptions"
                className="w-full"
              >
                <CareIcon className="care-l-pen text-lg" />
                <span className="hidden lg:block">
                  {t("edit_prescriptions")}
                </span>
                <span className="block lg:hidden">{t("edit")}</span>
              </ButtonV2>
              <ButtonV2
                ghost
                border
                onClick={() => setShowBulkAdminister(true)}
                className="w-full"
                disabled={
                  state === undefined || state.prescriptions.length === 0
                }
              >
                <CareIcon className="care-l-syringe text-lg" />
                <span className="hidden lg:block">
                  {t("administer_medicines")}
                </span>
                <span className="block lg:hidden">{t("administer")}</span>
              </ButtonV2>
            </>
          )
        }
      />

      <div className="relative overflow-x-auto rounded border border-white shadow">
        <table className="w-full  whitespace-nowrap rounded">
          <thead className="bg-white text-xs font-medium text-black">
            <tr>
              <th className="sticky left-0 z-10 bg-white py-3 pl-4 text-left">
                <div className="flex justify-between gap-2">
                  <span className="text-sm">{t("medicine")}</span>
                  <span className="hidden px-2 text-center text-xs leading-none lg:block">
                    <p>Dosage &</p>
                    <p>
                      {!state?.prescriptions[0]?.is_prn
                        ? "Frequency"
                        : "Indicator"}
                    </p>
                  </span>
                </div>
              </th>

              <th>
                <ButtonV2
                  size="small"
                  circle
                  ghost
                  border
                  className="mx-2 px-1"
                  variant="secondary"
                  disabled={!pagination.hasPrevious}
                  onClick={pagination.previous}
                  tooltip="Previous 24 hours"
                  tooltipClassName="tooltip-bottom -translate-x-1/2 text-xs"
                >
                  <CareIcon icon="l-angle-left-b" className="text-base" />
                </ButtonV2>
              </th>
              {state === undefined
                ? Array.from({ length: 24 }, (_, i) => i).map((i) => (
                    <th
                      className="tooltip py-2 text-center font-semibold leading-none text-gray-900"
                      key={i}
                    >
                      <p className="h-4 w-6 animate-pulse rounded bg-gray-500" />
                    </th>
                  ))
                : pagination.slots?.map(({ start, end }, index) => (
                    <th
                      className="tooltip px-0.5 py-2 text-center font-semibold leading-none text-gray-900"
                      key={index}
                    >
                      <p>{formatDateTime(start, "DD/MM")}</p>
                      <p>{formatDateTime(start, "HH:mm")}</p>

                      <span className="tooltip-text tooltip-top -translate-x-1/2 text-xs font-normal">
                        Administration(s) between
                        <br />
                        <strong>{formatTime(start)}</strong> and{" "}
                        <strong>{formatTime(end)}</strong>
                        <br />
                        on <strong>{formatDate(start)}</strong>
                      </span>
                    </th>
                  ))}
              <th>
                <ButtonV2
                  size="small"
                  circle
                  ghost
                  border
                  className="mx-2 px-1"
                  variant="secondary"
                  disabled={!pagination.hasNext}
                  onClick={pagination.next}
                  tooltip="Next 24 hours"
                  tooltipClassName="tooltip-bottom -translate-x-1/2 text-xs"
                >
                  <CareIcon icon="l-angle-right-b" className="text-base" />
                </ButtonV2>
              </th>

              <th className="py-3 pr-2 text-right"></th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {state?.prescriptions?.map((item) => (
              <PrescriptionRow
                key={item.id}
                prescription={item}
                intervals={pagination.slots!}
                actions={prescription(item.id ?? "")}
                refetch={refetch}
              />
            ))}
          </tbody>
        </table>

        {showDiscontinued === false && !!discontinuedCount && (
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

        {state?.prescriptions.length === 0 && (
          <div className="my-16 flex w-full flex-col items-center justify-center gap-4 text-gray-500">
            <CareIcon className="care-l-tablets text-5xl" />
            <h3 className="text-lg font-medium">
              {prn
                ? "No PRN Prescriptions Prescribed"
                : "No Prescriptions Prescribed"}
            </h3>
          </div>
        )}
      </div>
    </div>
  );
}

interface PrescriptionRowProps {
  prescription: Prescription;
  intervals: DateRange[];
  actions: ReturnType<ReturnType<typeof PrescriptionActions>["prescription"]>;
  refetch: () => void;
}

const PrescriptionRow = ({ prescription, ...props }: PrescriptionRowProps) => {
  const dispatch = useDispatch<any>();
  const { t } = useTranslation();
  // const [showActions, setShowActions] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showAdminister, setShowAdminister] = useState(false);
  const [showDiscontinue, setShowDiscontinue] = useState(false);
  const [administrations, setAdministrations] =
    useState<MedicineAdministrationRecord[]>();

  useEffect(() => {
    setAdministrations(undefined);

    const getAdministrations = async () => {
      const res = await dispatch(
        props.actions.listAdministrations({
          administered_date_after: formatDateTime(
            props.intervals[0].start,
            "YYYY-MM-DD"
          ),
          administered_date_before: formatDateTime(
            props.intervals[props.intervals.length - 1].end,
            "YYYY-MM-DD"
          ),
        })
      );

      setAdministrations(res.data.results);
    };

    getAdministrations();
  }, [prescription.id, dispatch, props.intervals]);

  return (
    <tr
      className={classNames(
        "group border-separate border border-gray-300 bg-gray-100 transition-all duration-200 ease-in-out hover:border-primary-300 hover:bg-primary-100"
      )}
    >
      {showDiscontinue && (
        <DiscontinuePrescription
          prescription={prescription}
          actions={props.actions}
          onClose={(success) => {
            setShowDiscontinue(false);
            if (success) {
              props.refetch();
            }
          }}
        />
      )}
      {showAdminister && (
        <AdministerMedicine
          prescription={prescription}
          actions={props.actions}
          onClose={(success) => {
            setShowAdminister(false);
            if (success) {
              props.refetch();
            }
          }}
        />
      )}
      {showDetails && (
        <DialogModal
          title={t("prescription_details")}
          onClose={() => setShowDetails(false)}
          className="w-full md:max-w-4xl"
          show
        >
          <div className="mt-4 flex flex-col gap-4">
            <PrescriptionDetailCard
              prescription={prescription}
              actions={props.actions}
              readonly
            />
            <div className="flex w-full flex-col items-center justify-end gap-2 md:flex-row">
              <Cancel
                onClick={() => setShowDetails(false)}
                label={t("close")}
              />
              <Submit
                disabled={
                  prescription.discontinued ||
                  prescription.prescription_type === "DISCHARGE"
                }
                variant="danger"
                onClick={() => setShowDiscontinue(true)}
              >
                <CareIcon className="care-l-ban text-lg" />
                {t("discontinue")}
              </Submit>
              <Submit
                disabled={
                  prescription.discontinued ||
                  prescription.prescription_type === "DISCHARGE"
                }
                variant="secondary"
                border
                onClick={() => {
                  setShowDetails(false);
                  setShowEdit(true);
                }}
              >
                <CareIcon icon="l-pen" className="text-lg" />
                {t("edit")}
              </Submit>
              <Submit
                disabled={
                  prescription.discontinued ||
                  prescription.prescription_type === "DISCHARGE"
                }
                onClick={() => setShowAdminister(true)}
              >
                <CareIcon className="care-l-syringe text-lg" />
                {t("administer")}
              </Submit>
            </div>
          </div>
        </DialogModal>
      )}
      {showEdit && (
        <DialogModal
          onClose={() => setShowEdit(false)}
          show={showEdit}
          title={`${t("edit")} ${t(
            prescription.is_prn ? "prn_prescription" : "prescription_medication"
          )}: ${
            prescription.medicine_object?.name ?? prescription.medicine_old
          }`}
          description={
            <div className="mt-2 flex w-full justify-start gap-2 text-warning-500">
              <CareIcon icon="l-info-circle" className="text-base" />
              <span>{t("edit_caution_note")}</span>
            </div>
          }
          className="w-full max-w-3xl lg:min-w-[600px]"
        >
          <EditPrescriptionForm
            initial={prescription}
            onDone={(success) => {
              setShowEdit(false);
              if (success) {
                props.refetch();
              }
            }}
          />
        </DialogModal>
      )}
      <td
        className="sticky left-0 z-10 cursor-pointer bg-gray-100 py-3 pl-4 text-left transition-all duration-200 ease-in-out group-hover:bg-primary-100"
        onClick={() => setShowDetails(true)}
      >
        <div className="flex flex-col gap-1 lg:flex-row lg:justify-between lg:gap-2">
          <div className="flex items-center gap-2">
            <span
              className={classNames(
                "text-sm font-semibold",
                prescription.discontinued ? "text-gray-700" : "text-gray-900"
              )}
            >
              {prescription.medicine_object?.name ?? prescription.medicine_old}
            </span>

            {prescription.discontinued && (
              <span className="hidden rounded-full border border-gray-500 bg-gray-200 px-1.5 text-xs font-medium text-gray-700 lg:block">
                {t("discontinued")}
              </span>
            )}

            {prescription.route && (
              <span className="hidden rounded-full border border-blue-500 bg-blue-100 px-1.5 text-xs font-medium text-blue-700 lg:block">
                {t(prescription.route)}
              </span>
            )}
          </div>

          <div className="flex gap-1 text-xs font-semibold text-gray-900 lg:flex-col lg:px-2 lg:text-center">
            <p>{prescription.dosage}</p>
            <p>
              {!prescription.is_prn
                ? t("PRESCRIPTION_FREQUENCY_" + prescription.frequency)
                : prescription.indicator}
            </p>
          </div>
        </div>
      </td>

      <td />
      {/* Administration Cells */}
      {props.intervals.map(({ start, end }, index) => (
        <td className="text-center" key={index}>
          {administrations === undefined ? (
            <CareIcon
              icon="l-spinner"
              className="animate-spin text-lg text-gray-500"
            />
          ) : (
            <AdministrationCell
              administrations={administrations}
              interval={{ start, end }}
              prescription={prescription}
            />
          )}
        </td>
      ))}
      <td />

      {/* Action Buttons */}
      <td className="space-x-1 pr-2 text-right">
        <ButtonV2
          type="button"
          size="small"
          disabled={prescription.discontinued}
          ghost
          border
          onClick={() => setShowAdminister(true)}
        >
          {t("administer")}
        </ButtonV2>
      </td>
    </tr>
  );
};

interface AdministrationCellProps {
  administrations: MedicineAdministrationRecord[];
  interval: DateRange;
  prescription: Prescription;
}

const AdministrationCell = ({
  administrations,
  interval: { start, end },
  prescription,
}: AdministrationCellProps) => {
  // Check if cell belongs to an administered prescription
  const administered = administrations.filter((administration) =>
    dayjs(administration.administered_date).isBetween(start, end)
  );

  if (administered.length) {
    return (
      <div className="tooltip">
        <div className="relative mx-auto max-w-min">
          <CareIcon
            icon="l-check-circle"
            className="text-xl text-primary-500"
          />
          {administered.length > 1 && (
            <span className="absolute -bottom-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 text-xs font-semibold text-white">
              {administered.length}
            </span>
          )}
        </div>
        <span className="tooltip-text tooltip-top -translate-x-1/2 text-xs">
          <p>
            Administered on{" "}
            <strong>{formatDateTime(administered[0].administered_date)}</strong>
          </p>
          <p>
            {administered.length > 1
              ? `Administered ${administered.length} times`
              : `Administered ${formatTime(administered[0].administered_date)}`}
          </p>
        </span>
      </div>
    );
  }

  // Check if cell belongs to a discontinued prescription
  if (
    prescription.discontinued &&
    dayjs(end).isAfter(prescription.discontinued_date)
  ) {
    if (!dayjs(prescription.discontinued_date).isBetween(start, end)) return;

    return (
      <div className="tooltip">
        <CareIcon
          icon="l-ban"
          className={classNames(
            "text-xl",
            dayjs(prescription.discontinued_date).isBetween(start, end)
              ? "text-danger-700"
              : "text-gray-400"
          )}
        />
        <span className="tooltip-text tooltip-top -translate-x-1/2 text-xs">
          <p>
            Discontinued on{" "}
            <strong>{formatDateTime(prescription.discontinued_date)}</strong>
          </p>
          <p>
            Reason:{" "}
            {prescription.discontinued_reason ? (
              <strong>{prescription.discontinued_reason}</strong>
            ) : (
              <span className="italic">Not specified</span>
            )}
          </p>
        </span>
      </div>
    );
  }

  // Check if cell belongs to after prescription.created_date
  if (dayjs(start).isAfter(prescription.created_date)) {
    return <CareIcon icon="l-minus-circle" className="text-xl text-gray-400" />;
  }

  // Check if prescription.created_date is between start and end
  // if (dayjs(prescription.created_date).isBetween(start, end)) {
  //   return (
  //     <div className="tooltip">
  //       <CareIcon icon="l-play-circle" className="text-xl text-gray-500" />
  //       <span className="tooltip-text tooltip-top -translate-x-1/2 text-xs">
  //         <p>
  //           Prescribed on{" "}
  //           <strong>{formatDateTime(prescription.created_date)}</strong>
  //         </p>
  //       </span>
  //     </div>
  //   );
  // }
};

function getAdministrationBounds(prescriptions: Prescription[]) {
  // get start by finding earliest of all presciption's created_date
  const start = new Date(
    prescriptions.reduce(
      (earliest, curr) =>
        earliest < curr.created_date ? earliest : curr.created_date,
      prescriptions[0]?.created_date ?? new Date()
    )
  );

  // get end by finding latest of all presciption's last_administered_on
  const end = new Date(
    prescriptions
      .filter((prescription) => prescription.last_administered_on)
      .reduce(
        (latest, curr) =>
          curr.last_administered_on && curr.last_administered_on > latest
            ? curr.last_administered_on
            : latest,
        prescriptions[0]?.created_date ?? new Date()
      )
  );

  // floor start to previous hour
  start.setMinutes(0, 0, 0);

  // ceil end to next hour
  end.setMinutes(0, 0, 0);
  end.setHours(end.getHours() + 1);

  return { start, end };
}
