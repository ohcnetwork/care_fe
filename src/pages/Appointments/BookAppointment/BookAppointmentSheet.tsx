import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { BookAppointmentDetails } from "./BookAppointmentDetails";
import { BookingsList } from "./BookingsList";

interface Props {
  patientId: string;
  facilityId?: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export default function BookAppointmentSheet({
  patientId,
  facilityId,
  trigger,
  onSuccess,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="md:w-[90%] !max-w-none h-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("book_appointment")}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 mt-6">
          <Tabs defaultValue="appointment">
            <TabsList className="w-full justify-evenly sm:justify-start border-b rounded-none bg-transparent p-0 h-auto overflow-x-auto">
              <TabsTrigger
                value="appointment"
                className="border-b-3 px-1.5 sm:px-2.5 py-2 text-gray-600 font-semibold hover:text-gray-900 data-[state=active]:border-b-primary-700 data-[state=active]:text-primary-800 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none"
              >
                {t("book_appointment")}
              </TabsTrigger>
              <TabsTrigger
                value="encounter"
                className="border-b-3 px-1.5 sm:px-2.5 py-2 text-gray-600 font-semibold hover:text-gray-900 data-[state=active]:border-b-primary-700 data-[state=active]:text-primary-800 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none"
              >
                {t("bookings")}
              </TabsTrigger>
            </TabsList>
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
              />
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
