import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";

import { resourceTypeToResourcePathSlug } from "@/components/Schedule/useScheduleResource";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import { formatPatientAge } from "@/Utils/utils";
import { Separator } from "@/components/ui/separator";
import useBreakpoints from "@/hooks/useBreakpoints";
import { cn } from "@/lib/utils";
import { FacilityRead } from "@/types/facility/facility";
import {
  formatScheduleResourceName,
  SchedulableResourceType,
} from "@/types/scheduling/schedule";
import { renderTokenNumber, TokenRetrieve } from "@/types/tokens/token/token";
import { PrinterIcon } from "lucide-react";
import { Link } from "raviger";

interface Props {
  id?: string;
  token: TokenRetrieve;
  facility: FacilityRead;
  className?: string;
  tokenActions?: boolean;
  showlogo?: boolean;
}

const TokenCard = ({
  id,
  token,
  facility,
  className,
  tokenActions = true,
  showlogo = true,
}: Props) => {
  const { t } = useTranslation();
  const isLargeScreen = useBreakpoints({ lg: true, default: false });

  const printToken = (tokenId: string) => {
    const printSection = document.getElementById(`print-token-${tokenId}`);

    if (printSection) {
      const style = document.createElement("style");
      style.textContent = `
        @media print {
          body * { visibility: hidden; }
          #print-token-${tokenId}, #print-token-${tokenId} * { visibility: visible; }
          #print-token-${tokenId} { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100% !important; 
          }
        }
      `;
      document.head.appendChild(style);
      window.print();
      document.head.removeChild(style);
    }
  };

  return (
    <Card
      id={id}
      className={cn(
        "p-3 pt-0 border border-gray-300 relative hover:scale-101 hover:shadow-md transition-all duration-300 ease-in-out print:scale-100 print:rotate-0 print:shadow-none print:hover:scale-100 print:hover:rotate-0 print:hover:shadow-none",
        className,
      )}
    >
      {showlogo && (
        <div className="absolute inset-0 opacity-[0.1] pointer-events-none bg-[url('/images/care_logo_gray.svg')] bg-center bg-no-repeat bg-[length:40%_auto] lg:bg-[length:60%_auto]" />
      )}

      <div className="relative z-10">
        <div className="flex flex-row items-start justify-between gap-4">
          <div className="pt-2 items-start gap-4">
            <div>
              {token.patient && (
                <div className="flex-1 min-w-0">
                  <Label className="text-sm font-normal text-gray-600">
                    {t("patient_name")}:
                  </Label>
                  <p className="font-semibold break-words">
                    {token.patient.name}
                  </p>
                  <p className="text-sm text-gray-700 font-medium">
                    {`${formatPatientAge(token.patient, true)}, ${t(`GENDER__${token.patient.gender}`)}`}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2">
              <Label className="text-sm font-normal text-gray-600">
                {t(`schedulable_resource__${token.resource_type}`)}:
              </Label>
              <p className="text-sm font-semibold break-words">
                {formatScheduleResourceName(token)}
              </p>
              {token.resource_type === SchedulableResourceType.Location &&
                token.resource.description && (
                  <p className="text-xs text-gray-600 break-words">
                    {token.resource.description}
                  </p>
                )}
              {token.resource_type ===
                SchedulableResourceType.HealthcareService &&
                token.resource.extra_details && (
                  <p className="text-xs text-gray-600 break-words">
                    {token.resource.extra_details}
                  </p>
                )}
            </div>
            <Separator className="my-2.5" />
            <div className="flex-1 min-w-0">
              <div className="text-lg font-bold tracking-tight break-words">
                {facility.name}
              </div>
              <div className="text-sm text-gray-600">
                <span>{facility.address}</span>
                <div className="whitespace-normal">{`Ph.: ${facility.phone_number}`}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 items-end">
            <div className="flex items-end justify-between gap-4">
              <div className="flex-shrink-0">
                <div className="text-sm whitespace-nowrap text-center bg-gray-100 px-2 py-2 font-medium rounded-b-md text-gray-500 border">
                  <p>{token.category.name}</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-600">
                {token.queue.date}
              </p>
            </div>

            <div className="mt-4 flex-col items-end justify-between gap-4">
              <div className="mt-2">
                <div>
                  <Label className="text-sm font-normal text-gray-600 justify-end">
                    {t("token_no")}
                  </Label>
                  <div className="flex text-2xl font-bold leading-none justify-end">
                    {renderTokenNumber(token)}
                  </div>
                </div>
              </div>
              <div className="mt-2">
                <QRCodeSVG
                  size={isLargeScreen ? 96 : 60}
                  value={JSON.stringify({
                    tokenId: token.id,
                    queueId: token.queue.id,
                  })}
                />
              </div>
            </div>
          </div>
        </div>
        {tokenActions && (
          <div>
            <Separator className="my-3 print:hidden" />
            <div className="flex items-center justify-between">
              <Button
                variant="link"
                asChild
                className="underline font-semibold text-base capitalize text-gray-950"
              >
                <Link
                  href={`/facility/${facility.id}/${resourceTypeToResourcePathSlug[token.resource_type]}/${token.resource.id}/queues/${token.queue.id}`}
                >
                  {t("queue_board")}
                </Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => printToken(token.id)}
                className="text-base text-gray-950 font-semibold"
              >
                <PrinterIcon className="size-4 mr-2" />
                {t("print")}
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
