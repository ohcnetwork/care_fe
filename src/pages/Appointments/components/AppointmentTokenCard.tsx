import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";

import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import { formatPatientAge } from "@/Utils/utils";
import { resourceTypeToResourcePathSlug } from "@/components/Schedule/useScheduleResource";
import TagBadge from "@/components/Tags/TagBadge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useShortcutSubContext } from "@/context/ShortcutContext";
import useBreakpoints from "@/hooks/useBreakpoints";
import { formatSlotTimeRange } from "@/pages/Appointments/utils";
import { PatientRead } from "@/types/emr/patient/patient";
import { FacilityRead } from "@/types/facility/facility";
import { PatientIdentifierUse } from "@/types/patient/patientIdentifierConfig/patientIdentifierConfig";
import {
  AppointmentRead,
  formatScheduleResourceName,
} from "@/types/scheduling/schedule";
import { TokenRead, renderTokenNumber } from "@/types/tokens/token/token";
import { formatDate } from "date-fns";
import { PrinterIcon } from "lucide-react";
import { Link } from "raviger";
import { formatPhoneNumberIntl } from "react-phone-number-input";

interface BaseProps {
  id?: string;
  facility?: FacilityRead;
  inPrintMode?: boolean;
}

type Props =
  | (BaseProps & { token: TokenRead; appointment?: AppointmentRead })
  | (BaseProps & { token?: TokenRead; appointment: AppointmentRead });

const TokenCard = ({
  id,
  token,
  facility,
  appointment,
  inPrintMode = false,
}: Props) => {
  const { t } = useTranslation();
  const isLargeScreen = useBreakpoints({ lg: true, default: false });
  useShortcutSubContext();

  // Get patient from token or appointment (one is always defined per Props type)
  const patient = token?.patient ?? appointment?.patient;
  // Get patient with identifiers (appointment.patient has more data)
  const patientWithIdentifiers = appointment?.patient as
    | PatientRead
    | undefined;
  const patientTags =
    patientWithIdentifiers?.instance_tags ?? patient?.instance_tags;

  const appointmentTags = appointment?.tags ?? [];

  return (
    <Card
      id={id}
      className="p-2 border border-gray-200 relative transition-all duration-300 ease-in-out print:scale-100 print:rotate-0 print:shadow-none print:hover:scale-100 print:hover:rotate-0 print:hover:shadow-none bg-gray-100"
    >
      <div className="flex flex-col px-1">
        {token && <p className="font-semibold">{renderTokenNumber(token)}</p>}
        {appointment && (
          <p className="font-semibold">
            {t("appointment")} {t(appointment.status)}
          </p>
        )}
        {appointment && (
          <p className="text-gray-700">
            {formatScheduleResourceName(appointment)}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2 bg-white rounded-md p-4 shadow-md mt-2 ">
        <div className="flex flex-row justify-between">
          <div className=" flex flex-col items-start justify-between">
            {patient && (
              <div>
                <Label className="text-gray-600 text-sm">
                  {t("patient_name")}:
                </Label>
                <p className="font-semibold wrap-break-word text-sm">
                  {patient.name || "--"}
                </p>
                <p className="pl-1 text-sm text-gray-600 font-medium">
                  {formatPatientAge(patient, true)},{" "}
                  {t(`GENDER__${patient.gender}`)}
                </p>
                {patientWithIdentifiers?.instance_identifiers
                  ?.filter(
                    (identifier) =>
                      identifier.config.config.use ===
                      PatientIdentifierUse.official,
                  )
                  .map((identifier) => (
                    <div key={identifier.config.id}>
                      <Label className="text-gray-600 text-sm">
                        {identifier.config.config.display}:
                      </Label>
                      <p className="font-semibold text-sm">
                        {identifier.value}
                      </p>
                    </div>
                  ))}
                {inPrintMode && patient.address?.trim() && (
                  <div>
                    <Label className="text-gray-600 text-sm">
                      {t("address")}:
                    </Label>
                    <p className="font-semibold text-sm whitespace-pre-wrap">
                      {patient.address}
                    </p>
                    <p className="font-semibold text-sm">
                      {formatPhoneNumberIntl(patient.phone_number) ||
                        patient.phone_number}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="space-y-2 flex-1 min-w-0">
                  {appointment && (
                    <>
                      <div>
                        <Label className="text-gray-600 text-sm">
                          {t(
                            `schedulable_resource__${appointment.resource_type}`,
                          )}
                          :
                        </Label>
                        <p className="font-semibold wrap-break-word text-sm">
                          {formatScheduleResourceName(appointment)}
                        </p>
                      </div>
                      <Separator />
                      <div>
                        <p className="text-sm font-semibold text-gray-600 flex gap-2">
                          <span className="text-sm font-semibold text-gray-600">
                            {formatDate(
                              appointment.token_slot.start_datetime,
                              "EEE, dd MMM",
                            )}
                          </span>
                          <span className="text-sm font-semibold text-gray-600">
                            {formatSlotTimeRange(appointment.token_slot)}
                          </span>
                        </p>
                        <div className="flex flex-wrap gap-1 my-2">
                          {patientTags?.map((tag) => (
                            <TagBadge
                              key={tag.id}
                              tag={tag}
                              hierarchyDisplay
                              className="text-xs"
                              variant="outline"
                            />
                          ))}
                          {appointmentTags?.map((tag) => (
                            <TagBadge
                              key={tag.id}
                              tag={tag}
                              hierarchyDisplay
                              className="text-xs"
                              variant="outline"
                            />
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {facility && (
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold tracking-tight wrap-break-word">
                      {facility.name}
                    </h3>
                    <div className="text-sm text-gray-600">
                      <span>{facility.pincode}</span>
                      <div className="whitespace-normal">{`Ph.: ${facility.phone_number}`}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            {token && (
              <div className="items-end">
                <Label className="text-gray-600 text-sm whitespace-nowrap justify-end">
                  {t("token_no")}
                </Label>
                <p className="text-2xl font-bold justify-end flex">
                  {renderTokenNumber(token)}
                </p>
              </div>
            )}
            <div>
              <QRCodeSVG
                size={isLargeScreen ? 96 : 60}
                value={patient?.id || ""}
                className="ml-2"
              />
            </div>
          </div>
        </div>
        {appointment && !inPrintMode && (
          <div>
            <Separator />
            <div className="pt-3 mx-4 flex gap-2 justify-between print:hidden">
              <Button
                variant="link"
                className="underline font-semibold text-base capitalize text-gray-950"
              >
                <Link
                  basePath="/"
                  href={`/facility/${appointment.facility.id}/${resourceTypeToResourcePathSlug[appointment.resource_type]}/${appointment.resource.id}/queues/${appointment.token?.queue.id}`}
                >
                  {t("queue_board")}
                </Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => print()}
                className="text-base text-gray-950 font-semibold"
              >
                <PrinterIcon className="size-4 mr-2" />
                {t("print_token")}
                <ShortcutBadge actionId="print-button" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export { TokenCard };
