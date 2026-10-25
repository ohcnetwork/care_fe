import { useQuery } from "@tanstack/react-query";
import { CalendarPlus, Loader2 } from "lucide-react";
import { Link, useQueryParams } from "raviger";
import { useTranslation } from "react-i18next";

import { getPermissions } from "@/common/Permissions";
import { Button, buttonVariants } from "@/components/careui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePermissions } from "@/context/PermissionContext";
import { ReferralRetrieve } from "@/types/emr/referral/referral";
import facilityApi from "@/types/facility/facilityApi";
import query from "@/Utils/request/query";
import { HTTPError } from "@/Utils/request/types";

import { useReferralFacilities } from "./ReferralResourcePicker";

export function ReferralAppointmentAction({
  referral,
}: {
  referral: ReferralRetrieve;
}) {
  const { t } = useTranslation();
  const [{ sourceUrl }] = useQueryParams<{ sourceUrl?: string }>();
  const facilities = useReferralFacilities(referral);
  const { hasPermission } = usePermissions();
  const destinationId = referral.destination.facility?.id;
  const facility = useQuery({
    queryKey: ["facility", destinationId],
    queryFn: query(facilityApi.get, {
      pathParams: { facilityId: destinationId ?? "" },
      silent: true,
    }),
    enabled: !!destinationId,
    retry: false,
  });
  const { canWriteAppointment } = getPermissions(
    hasPermission,
    facility.data?.permissions ?? [],
  );
  const getBookingUrl = (facilityId: string) => {
    const params = new URLSearchParams({
      open_schedule: "true",
      referralId: referral.id,
    });
    if (typeof sourceUrl === "string")
      params.set("referralSourceUrl", sourceUrl);
    return `/facility/${facilityId}/patient/${referral.patient}/appointments?${params}`;
  };

  if (referral.destination.facility) {
    if (facility.isPending)
      return (
        <span
          role="status"
          className="flex items-center gap-2 text-xs text-cui-muted-foreground"
        >
          <Loader2 className="size-3.5 animate-spin" />
          {t("loading")}
        </span>
      );
    const denied =
      facility.error instanceof HTTPError &&
      [403, 404].includes(facility.error.status);
    if (facility.isError && !denied)
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={() => void facility.refetch()}
        >
          {t("referral_check_booking_access")}
        </Button>
      );
    if (denied || !canWriteAppointment)
      return (
        <p className="max-w-sm text-xs text-cui-muted-foreground">
          {t("referral_booking_receiver_help", {
            facility: referral.destination.facility.name,
          })}
        </p>
      );
    return (
      <Link
        href={getBookingUrl(referral.destination.facility.id)}
        className={buttonVariants({ size: "sm", variant: "outline" })}
      >
        <CalendarPlus className="size-4" />
        {t("referral_book_appointment")}
      </Link>
    );
  }

  if (!facilities.length) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline">
          <CalendarPlus className="size-4" />
          {t("referral_book_appointment")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {facilities.map((facility) => (
          <DropdownMenuItem key={facility.id} asChild>
            <Link href={getBookingUrl(facility.id)}>{facility.name}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
