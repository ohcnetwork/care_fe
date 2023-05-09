import { Prescription } from "./models";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { classNames } from "../../Utils/utils";
import ReadMore from "../Common/components/Readmore";
import ButtonV2 from "../Common/components/ButtonV2";
import {
  PRESCRIPTION_FREQUENCIES,
  PRESCRIPTION_ROUTES,
} from "./PrescriptionForm";

export default function PrescriptionDetailCard({
  prescription,
  ...props
}: {
  index: number;
  prescription: Prescription;
  readonly?: boolean;
  children?: React.ReactNode;
}) {
  const isNew = !prescription.id;

  const displayId = prescription.id?.slice(-5) || props.index;

  return (
    <div
      className={classNames(
        "flex border-2 border-dashed border-gray-500 border-spacing-2 p-3 rounded",
        prescription.discontinued && "bg-gray-200 opacity-80"
      )}
    >
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-4 items-center">
            <h3 className="text-lg font-semibold text-gray-700">
              {prescription.is_prn ? "PRN Prescription" : "Prescription"} #
              {displayId}
            </h3>
            {isNew && (
              <span className="bg-blue-500 text-white font-semibold text-xs px-2 py-1 rounded-full">
                NEW
              </span>
            )}
            {prescription.discontinued && (
              <span className="bg-gray-700 text-white font-semibold text-xs px-2 py-1 rounded-full">
                DISCONTINUED
              </span>
            )}
          </div>

          {!props.readonly && (
            <div className="flex gap-2 items-center">
              <ButtonV2
                disabled={prescription.discontinued}
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
              >
                <CareIcon className="care-l-ban text-base" />
                Discontinue
              </ButtonV2>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Detail className="flex-[5]" label="Medicine">
            {prescription.medicine}
          </Detail>
          <Detail className="flex-[2]" label="Route">
            {prescription.route && PRESCRIPTION_ROUTES[prescription.route].name}
          </Detail>
          <Detail className="flex-[2]" label="Dosage">
            {prescription.dosage}
          </Detail>
        </div>

        {prescription.is_prn ? (
          <div className="flex gap-2 items-center">
            <Detail className="flex-[4]" label="Indicator">
              {prescription.indicator}
            </Detail>
            <Detail className="flex-[3]" label="Max Dosage in 24 hrs.">
              {prescription.max_dosage}
            </Detail>
            <Detail
              className="flex-[3]"
              label="Min. time b/w consecutive doses"
            >
              {prescription.max_dosage}
            </Detail>
          </div>
        ) : (
          <div className="flex gap-2 items-center">
            <Detail className="flex-1" label="Frequency">
              {prescription.frequency &&
                PRESCRIPTION_FREQUENCIES[prescription.frequency].name}
            </Detail>
            <Detail className="flex-1" label="Days">
              {prescription.days}
            </Detail>
          </div>
        )}

        {prescription.notes && (
          <Detail label="Notes">
            <ReadMore text={prescription.notes} minChars={120} />
          </Detail>
        )}
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
