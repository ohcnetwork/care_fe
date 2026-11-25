import { useQueries, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import PrintLoading from "@/CAREUI/misc/PrintLoading";
import TypstPrintPreview from "@/CAREUI/misc/TypstPrintPreview";

import { getPermissions } from "@/common/Permissions";
import { usePermissions } from "@/context/PermissionContext";
import usePatientExtensionData from "@/hooks/usePatientExtensionData";
import { buildAppointmentPrintContent } from "@/pages/Appointments/appointmentPrintData";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { useQrCode } from "@/print/useQrCode";
import { ChargeItemServiceResource } from "@/types/billing/chargeItem/chargeItem";
import chargeItemApi from "@/types/billing/chargeItem/chargeItemApi";
import { InvoiceRead } from "@/types/billing/invoice/invoice";
import invoiceApi from "@/types/billing/invoice/invoiceApi";
import { PrintTemplateType } from "@/types/facility/printTemplate";
import scheduleApis from "@/types/scheduling/scheduleApi";
import query from "@/Utils/request/query";

const QR_CODE_PATH = "/assets/qr-code.svg";

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
  const { data: chargeItems, isFetching: isFetchingChargeItems } = useQuery({
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

  const invoiceIds = [
    ...new Set(
      chargeItems?.results
        ?.map((item) => item.paid_invoice?.id)
        .filter((id): id is string => !!id) ?? [],
    ),
  ];

  // Fetch each invoice individually to get full payment details
  const invoiceQueries = useQueries({
    queries: invoiceIds.map((invoiceId) => ({
      queryKey: ["appointmentInvoice", facilityId, invoiceId],
      queryFn: query(invoiceApi.retrieveInvoice, {
        pathParams: { facilityId, invoiceId },
      }),
      enabled: !!facilityId,
    })),
  });

  const invoices = invoiceQueries
    .map((q) => q.data)
    .filter((inv): inv is InvoiceRead => !!inv);

  const isFetching =
    isFetchingChargeItems || invoiceQueries.some((q) => q.isFetching);

  const patient = appointment?.patient;

  const extensionFields = usePatientExtensionData(
    patient?.extensions,
    "appointment_print",
  );

  const qrCode = useQrCode(patient?.id ?? "", QR_CODE_PATH, 80);

  if (isLoading || !appointment || !facility || isFetching || !qrCode.ready) {
    return (
      <>
        {qrCode.element}
        <PrintLoading />
      </>
    );
  }

  return (
    <>
      {qrCode.element}
      <TypstPrintPreview
        template="appointment"
        title={t("appointment_details")}
        content={buildAppointmentPrintContent({
          appointment,
          chargeItems: chargeItems?.results ?? [],
          invoices,
          extensionFields,
          qrCodePath: QR_CODE_PATH,
          t,
        })}
        facility={facility}
        templateSlug={PrintTemplateType.appointment}
        files={qrCode.files}
      />
    </>
  );
}
