import { Prescription } from "./models";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { classNames } from "../../Utils/utils";
import ReadMore from "../Common/components/Readmore";
import ButtonV2 from "../Common/components/ButtonV2";
import { PrescriptionActions } from "../../Redux/actions";
import { useTranslation } from "react-i18next";

export default function PrescriptionDetailCard({
  prescription,
  ...props
}: {
  prescription: Prescription;
  readonly?: boolean;
  children?: React.ReactNode;
  actions: ReturnType<ReturnType<typeof PrescriptionActions>["prescription"]>;
  onDiscontinueClick?: () => void;
  onAdministerClick?: () => void;
  selected?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div
      className={classNames(
        "flex flex-col rounded border-2 p-3 transition-all duration-200 ease-in-out md:flex-row",
        props.selected
          ? "border-primary-500"
          : "border-spacing-2 border-dashed border-gray-500",
        prescription.discontinued && "bg-gray-200 opacity-80"
      )}
    >
      <div className="flex flex-1 flex-col gap-2">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3
                className={classNames(
                  "text-lg font-bold transition-all duration-200 ease-in-out",
                  props.selected ? "text-black" : "text-gray-700"
                )}
              >
                {prescription.prescription_type === "DISCHARGE" &&
                  `${t("discharge")} `}
                {t(prescription.is_prn ? "prn_prescription" : "prescription")}
                {` #${prescription.id?.slice(-5)}`}
              </h3>
              {prescription.discontinued && (
                <span className="rounded-full bg-gray-700 px-2 py-1 text-xs font-semibold uppercase text-white">
                  {t("discontinued")}
                </span>
              )}
            </div>

            {!props.readonly &&
              prescription.prescription_type !== "DISCHARGE" && (
                <div className="flex flex-col-reverse items-end gap-2 sm:flex-row">
                  <ButtonV2
                    disabled={prescription.discontinued}
                    onClick={props.onAdministerClick}
                    type="button"
                    size="small"
                    variant="secondary"
                    ghost
                    border
                  >
                    <CareIcon className="care-l-syringe text-base" />
                    {t("administer")}
                  </ButtonV2>
                  <ButtonV2
                    disabled={prescription.discontinued}
                    type="button"
                    size="small"
                    variant="danger"
                    ghost
                    border
                    onClick={props.onDiscontinueClick}
                  >
                    <CareIcon className="care-l-ban text-base" />
                    {t("discontinue")}
                  </ButtonV2>
                </div>
              )}
          </div>
        </div>

        <div className="mt-2 grid grid-cols-9 items-center gap-2">
          <Detail className="col-span-9 md:col-span-5" label={t("medicine")}>
            {prescription.medicine_object?.name ?? prescription.medicine_old}
          </Detail>
          <Detail className="col-span-5 md:col-span-2" label={t("route")}>
            {prescription.route &&
              t("PRESCRIPTION_ROUTE_" + prescription.route)}
          </Detail>
          <Detail className="col-span-4 md:col-span-2" label={t("dosage")}>
            {prescription.dosage}
          </Detail>

          {prescription.is_prn ? (
            <>
              <Detail
                className="col-span-9 md:col-span-5"
                label={t("indicator")}
              >
                {prescription.indicator}
              </Detail>
              <Detail
                className="col-span-4 md:col-span-2"
                label={t("max_dosage_24_hrs")}
              >
                {prescription.max_dosage}
              </Detail>
              <Detail
                className="col-span-5 md:col-span-2"
                label={t("min_time_bw_doses")}
              >
                {prescription.max_dosage}
              </Detail>
            </>
          ) : (
            <>
              <Detail className="col-span-5" label={t("frequency")}>
                {prescription.frequency &&
                  t(
                    "PRESCRIPTION_FREQUENCY_" +
                      prescription.frequency.toUpperCase()
                  )}
              </Detail>
              <Detail className="col-span-4" label={t("days")}>
                {prescription.days}
              </Detail>
            </>
          )}

          {prescription.notes && (
            <Detail className="col-span-9" label={t("notes")}>
              <ReadMore text={prescription.notes} minChars={120} />
            </Detail>
          )}

          {prescription.discontinued && (
            <Detail
              className="col-span-9"
              label={t("reason_for_discontinuation")}
            >
              {prescription.discontinued_reason}
            </Detail>
          )}
        </div>
      </div>

      {props.children}
    </div>
  );
}

const Detail = (props: {
  className?: string;
  label: string;
  children?: React.ReactNode;
}) => {
  const { t } = useTranslation();
  return (
    <div className={classNames("flex flex-col gap-1", props.className)}>
      <label className="text-sm font-medium text-gray-600">{props.label}</label>
      <div className="cui-input-base w-full">
        {props.children ? (
          <span className="font-medium">{props.children}</span>
        ) : (
          <span className="italic text-gray-500">{t("not_specified")}</span>
        )}
      </div>
    </div>
  );
};
