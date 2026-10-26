import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useAppointmentReferral } from "@/components/Referral/useAppointmentReferral";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryParams } from "raviger";

import { BookAppointmentDetails } from "./BookAppointmentDetails";
import { BookingsList } from "./BookingsList";

interface Props {
  patientId: string;
  facilityId?: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
  defaultOpen?: boolean;
}

export default function BookAppointmentSheet({
  patientId,
  facilityId,
  trigger,
  onSuccess,
  defaultOpen,
}: Props) {
  const [qParams] = useQueryParams();
  const referralContext = useAppointmentReferral(patientId);
  const [isOpen, setIsOpen] = useState(
    defaultOpen || qParams.open_schedule === "true",
  );
  const { t } = useTranslation();

  useEffect(() => {
    if (defaultOpen) {
      setIsOpen(true);
    }
  }, [defaultOpen]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        aria-describedby={undefined}
        className="md:w-[90%] max-w-none! h-full overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>{t("book_appointment")}</SheetTitle>
        </SheetHeader>
        <Tabs defaultValue="appointment">
          <div className="max-w-full overflow-x-auto pb-1">
            <TabsList variant="line">
              <TabsTrigger value="appointment">
                {t("book_appointment")}
              </TabsTrigger>
              <TabsTrigger value="encounter">{t("bookings")}</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent
            value="appointment"
            className="flex lg:flex-row gap-4 mt-2"
          >
            <BookAppointmentDetails
              patientId={patientId}
              onSuccess={() => {
                setIsOpen(false);
                onSuccess?.();
              }}
            />
          </TabsContent>
          <TabsContent value="encounter">
            <BookingsList
              patientId={patientId}
              facilityId={facilityId ?? ""}
              appointmentQueryParams={referralContext.successQueryParams}
            />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
