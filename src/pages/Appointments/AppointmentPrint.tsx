import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import PrintPreview from "@/CAREUI/misc/PrintPreview";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import { TokenCard } from "@/pages/Appointments/components/AppointmentTokenCard";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";

import { getPermissions } from "@/common/Permissions";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import { usePermissions } from "@/context/PermissionContext";
import {
  ChargeItemServiceResource,
  ChargeItemStatus,
} from "@/types/billing/chargeItem/chargeItem";
import chargeItemApi from "@/types/billing/chargeItem/chargeItemApi";
import scheduleApis from "@/types/scheduling/scheduleApi";
import query from "@/Utils/request/query";

interface Props {
  appointmentId: string;
}

export default function AppointmentPrint(props: Props) {
  const { t } = useTranslation();
  const { facility, facilityId } = useCurrentFacility();
  const { hasPermission } = usePermissions();

  const { canViewAppointments } = getPermissions(
    hasPermission,
    facility?.permissions ?? [],
  );

  const { data: appointment, isLoading } = useQuery({
    queryKey: ["appointment", props.appointmentId],
    queryFn: query(scheduleApis.appointments.retrieve, {
      pathParams: {
        facilityId,
        id: props.appointmentId,
      },
    }),
    enabled: canViewAppointments && !!facility,
  });

  // Get charge items for the appointment
  const { data: chargeItems } = useQuery({
    queryKey: ["chargeItems", facilityId, props.appointmentId],
    queryFn: query(chargeItemApi.listChargeItem, {
      pathParams: {
        facilityId: facilityId,
      },
      queryParams: {
        service_resource: ChargeItemServiceResource.appointment,
        service_resource_id: props.appointmentId,
      },
    }),
    enabled: !!facilityId && !!props.appointmentId,
  });

  // Auto-print when page loads and data is ready
  useEffect(() => {
    if (appointment && !isLoading) {
      const timer = setTimeout(() => {
        window.print();
      }, 1000); // Give time for content to render
      return () => clearTimeout(timer);
    }
  }, [appointment, isLoading]);

  if (isLoading || !appointment || !facility) {
    return (
      <PrintPreview title={t("appointment_details")} disabled>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="text-lg font-semibold">{t("loading")}</div>
            <div className="text-gray-600 mt-2">
              {t("loading_appointment_details")}
            </div>
          </div>
        </div>
      </PrintPreview>
    );
  }

  const hasChargeItems = chargeItems?.results && chargeItems.results.length > 0;

  return (
    <PrintPreview title={t("appointment_details")}>
      <div className="max-w-7xl mx-auto text-sm">
        {/* Header with Facility Name and Logo */}
        <div className="flex justify-between items-start mb-4 pb-2 border-b border-gray-200">
          <div className="text-left">
            <h1 className="text-2xl font-semibold">{facility.name}</h1>
            {facility.address && (
              <div className="text-gray-500 whitespace-pre-wrap break-words text-xs">
                {facility.address}
                {facility.phone_number && (
                  <p className="text-gray-500 text-xs">
                    {facility.phone_number}
                  </p>
                )}
              </div>
            )}
          </div>
          <img
            src={careConfig.mainLogo?.dark}
            alt="Care Logo"
            className="h-8 w-auto object-contain mb-2 sm:mb-0"
          />
        </div>

        {/* Token and Charge Items Side by Side */}
        <div className="flex space-x-2">
          {/* Token Card */}
          <div className="flex justify-center w-3/5">
            <TokenCard
              appointment={appointment}
              token={appointment.token ?? undefined}
              facility={facility}
              inPrintMode={true}
            />
          </div>

          {/* Charge Items */}
          {hasChargeItems && (
            <div className="flex justify-center w-2/5">
              <div className="p-2 border border-gray-200 bg-gray-100 w-full h-full rounded-md flex flex-col">
                <div className="flex flex-row items-center  justify-between px-1">
                  <p className="font-semibold text-sm">{t("charges")}</p>
                  <div className="flex items-center">
                    <Badge className="text-xs">
                      {chargeItems?.results?.every(
                        (item) => item.status === ChargeItemStatus.paid,
                      )
                        ? t("paid")
                        : chargeItems?.results?.some(
                              (item) => item.status === ChargeItemStatus.billed,
                            )
                          ? t("billed")
                          : t("billable")}
                    </Badge>
                  </div>
                </div>

                <div className="bg-white rounded-md p-3 shadow-md mt-2 h-full">
                  <div className="space-y-2 flex flex-col justify-between h-full">
                    <div className="space-y-4">
                      {chargeItems?.results?.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Label className="text-xs font-medium text-gray-700">
                                {item.title}
                              </Label>
                            </div>
                            <p className="text-xs text-gray-600">
                              {t("qty")}: {item.quantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">
                              ₹{item.total_price}
                            </p>
                            {item.paid_invoice && (
                              <p className="text-xs text-gray-600">
                                {item.paid_invoice.number}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div>
                      <Separator className="my-2" />

                      <div className="flex justify-between items-center font-semibold">
                        <Label className="text-sm">{t("total_amount")}</Label>
                        <p className="text-sm">
                          <MonetaryDisplay
                            amount={chargeItems?.results
                              ?.reduce(
                                (sum, item) =>
                                  sum + parseFloat(item.total_price || "0"),
                                0,
                              )
                              .toFixed(2)}
                          />
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        {appointment.note && (
          <div className="mb-4">
            <h3 className="font-semibold text-gray-800 mb-2 text-sm border-b border-gray-200 pb-1">
              {t("note")}
            </h3>
            <div className="text-xs whitespace-pre-wrap bg-gray-50 p-2 rounded">
              {appointment.note}
            </div>
          </div>
        )}

        <Separator className="my-4" />

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 flex justify-between items-center">
          <div>
            {t("generated_on")} {format(new Date(), "dd MMM yyyy 'at' h:mm a")}
          </div>
          <div>{facility.name}</div>
        </div>
      </div>
    </PrintPreview>
  );
}
