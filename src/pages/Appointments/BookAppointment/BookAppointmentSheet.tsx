import { act, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { FilterTabs } from "@/components/ui/filter-tabs";

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
  const [activeTab, setActiveTab] = useState("search");

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="md:w-[90%] !max-w-none h-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("book_appointment")}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 mt-6">
          <FilterTabs
            value={activeTab}
            onValueChange={setActiveTab}
            options={[
              {value: "appointment", label: t("book_appointment")},
              {value: "encounter", label: t("bookings")}
            ]}
            showAllOption={false}
            className="w-full justify-evenly sm:justify-start border-b rounded-none bg-transparent p-0 h-auto overflow-x-auto"
          />
          {activeTab === "appointment" && (
            <div className="flex lg:flex-row gap-4 mt-2">
              <BookAppointmentDetails
                patientId={patientId}
                onSuccess={() => {
                  setIsOpen(false);
                  onSuccess?.();
                }}
              />
            </div>
          )}
          {activeTab === "encounter" && (
            <BookingsList
                patientId={patientId}
                facilityId={facilityId ?? ""}
              />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
