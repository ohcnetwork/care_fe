import { Prescription } from "./models";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { classNames } from "../../Utils/utils";
import ReadMore from "../Common/components/Readmore";
import ButtonV2 from "../Common/components/ButtonV2";
import {
  PRESCRIPTION_FREQUENCIES,
  PRESCRIPTION_ROUTES,
} from "./CreatePrescriptionForm";
import { PrescriptionActions } from "../../Redux/actions";

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
  return (
    <div
      className={classNames(
        "flex flex-col md:flex-row border-2 p-3 rounded transition-all duration-200 ease-in-out",
        props.selected
          ? "border-primary-500"
          : "border-gray-500 border-dashed border-spacing-2",
        prescription.discontinued && "bg-gray-200 opacity-80"
      )}
    >
      <div className="flex-1 flex flex-col gap-2">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex gap-4 items-center">
              <h3
                className={classNames(
                  "text-lg font-bold transition-all duration-200 ease-in-out",
                  props.selected ? "text-black" : "text-gray-700"
                )}
              >
                {prescription.prescription_type === "DISCHARGE" && "Discharge "}
                {prescription.is_prn ? "PRN Prescription" : "Prescription"} #
                {prescription.id?.slice(-5)}
              </h3>
              {prescription.discontinued && (
                <span className="bg-gray-700 text-white font-semibold text-xs px-2 py-1 rounded-full">
                  DISCONTINUED
                </span>
              )}
            </div>

            {!props.readonly &&
              prescription.prescription_type !== "DISCHARGE" && (
                <div className="flex flex-col-reverse sm:flex-row gap-2 items-end">
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
                    Administer
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
                    Discontinue
                  </ButtonV2>
                </div>
              )}
          </div>
        </div>

        <div className="grid grid-cols-9 gap-2 items-center mt-2">
          <Detail className="col-span-9 md:col-span-5" label="Medicine">
            {prescription.medicine}
          </Detail>
          <Detail className="col-span-5 md:col-span-2" label="Route">
            {prescription.route && PRESCRIPTION_ROUTES[prescription.route].name}
          </Detail>
          <Detail className="col-span-4 md:col-span-2" label="Dosage">
            {prescription.dosage}
          </Detail>

          {prescription.is_prn ? (
            <>
              <Detail className="col-span-9 md:col-span-5" label="Indicator">
                {prescription.indicator}
              </Detail>
              <Detail
                className="col-span-4 md:col-span-2"
                label="Max dosage in 24 hrs."
              >
                {prescription.max_dosage}
              </Detail>
              <Detail
                className="col-span-5 md:col-span-2"
                label="Min. time b/w doses"
              >
                {prescription.max_dosage}
              </Detail>
            </>
          ) : (
            <>
              <Detail className="col-span-5" label="Frequency">
                {prescription.frequency &&
                  PRESCRIPTION_FREQUENCIES[prescription.frequency].name}
              </Detail>
              <Detail className="col-span-4" label="Days">
                {prescription.days}
              </Detail>
            </>
          )}

          {prescription.notes && (
            <Detail className="col-span-9" label="Notes">
              <ReadMore text={prescription.notes} minChars={120} />
            </Detail>
          )}

          {prescription.discontinued && (
            <Detail className="col-span-9" label="Reason for discontinuation">
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
  return (
    <div className={classNames("flex flex-col gap-1", props.className)}>
      <label className="text-sm font-medium text-gray-600">{props.label}</label>
      <div className="w-full cui-input-base">
        {props.children ? (
          <span className="font-medium">{props.children}</span>
        ) : (
          <span className="text-gray-500 italic">Not Specified</span>
        )}
      </div>
    </div>
  );
};
