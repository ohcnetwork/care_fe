import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import careConfig from "@careConfig";

import { LocationSelectorDialog } from "@/components/ui/sidebar/facility/location/location-switcher";

import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { buildEncounterUrl } from "@/pages/Encounters/utils/utils";
import { createAndIssueInvoice } from "@/pages/Facility/services/pharmacy/utils/createAndIssueInvoice";
import usePatientDefaultBillingAccount from "@/types/billing/account/hooks/useDefaultBillingAccount";
import { ChargeItemRead } from "@/types/billing/chargeItem/chargeItem";
import { InvoiceCreate } from "@/types/billing/invoice/invoice";
import { LocationRead } from "@/types/location/location";
import { getLocationPath } from "@/types/location/utils";

import DispenseDrawer from "./DispenseDrawer";

import { navigate } from "@/lib/router/navigate";

export const DispenseButton = ({
  open,
  setOpen,
  facilityId,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  facilityId: string;
}) => {
  const { t } = useTranslation();
  const [location, setLocation] = useState<LocationRead | undefined>(undefined);
  const [showDrawer, setShowDrawer] = useState(false);
  const { selectedEncounter } = useEncounter();
  const queryClient = useQueryClient();

  const { data: account, refetch: refetchAccount } =
    usePatientDefaultBillingAccount({
      patientId: selectedEncounter?.patient.id,
      facilityId,
    });

  const { mutate: issueInvoice } = useMutation({
    mutationFn: (data: Pick<InvoiceCreate, "account" | "charge_items">) =>
      createAndIssueInvoice(facilityId, data),
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success(t("invoice_issued_successfully"));
      if (!selectedEncounter) return;
      const sourceUrl = buildEncounterUrl(
        selectedEncounter.patient.id,
        `/encounter/${selectedEncounter.id}/updates`,
        facilityId,
      );
      navigate({
        href: `/facility/${facilityId}/billing/invoices/${invoice.id}?sourceUrl=${sourceUrl}`,
      });
    },
  });

  const handleLocationSelect = (selectedLocation: LocationRead) => {
    setLocation(selectedLocation);
    setOpen(false);
    setShowDrawer(true);
  };

  return (
    <>
      <LocationSelectorDialog
        facilityId={selectedEncounter?.facility.id || ""}
        location={location}
        setLocation={setLocation}
        open={open}
        setOpen={setOpen}
        navigateUrl={undefined}
        myLocations={true}
        onLocationSelect={handleLocationSelect}
      />

      {location && selectedEncounter && (
        <DispenseDrawer
          open={showDrawer}
          onOpenChange={(isOpen: boolean) => {
            setShowDrawer(isOpen);
            if (!isOpen) {
              setLocation(undefined);
            }
          }}
          patientId={selectedEncounter.patient.id}
          encounterId={selectedEncounter.id}
          selectedLocation={{
            ...location,
            path: getLocationPath(location),
          }}
          onDispenseComplete={async (chargeItems: ChargeItemRead[]) => {
            setShowDrawer(false);
            setLocation(undefined);

            if (
              careConfig.enableAutoInvoiceAfterDispense &&
              chargeItems.length > 0
            ) {
              const accountId =
                account?.id ?? (await refetchAccount()).data?.id;
              if (accountId) {
                issueInvoice({
                  account: accountId,
                  charge_items: chargeItems.map((item) => item.id),
                });
              }
            }
          }}
        />
      )}
    </>
  );
};
