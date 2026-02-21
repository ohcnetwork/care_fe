import { useState } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import careConfig from "@careConfig";

import { LocationSelectorDialog } from "@/components/ui/sidebar/facility/location/location-switcher";

import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { buildEncounterUrl } from "@/pages/Encounters/utils/utils";
import { CreateInvoiceSheet } from "@/pages/Facility/billing/account/components/CreateInvoiceSheet";
import {
  AccountBillingStatus,
  AccountStatus,
} from "@/types/billing/account/Account";
import accountApi from "@/types/billing/account/accountApi";
import { ChargeItemRead } from "@/types/billing/chargeItem/chargeItem";
import { LocationRead } from "@/types/location/location";
import { getLocationPath } from "@/types/location/utils";
import query from "@/Utils/request/query";

import DispenseDrawer from "./DispenseDrawer";

export const DispenseButton = ({
  open,
  setOpen,
  facilityId,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  facilityId: string;
}) => {
  const [location, setLocation] = useState<LocationRead | undefined>(undefined);
  const [showDrawer, setShowDrawer] = useState(false);
  const [isInvoiceSheetOpen, setIsInvoiceSheetOpen] = useState(false);
  const [extractedChargeItems, setExtractedChargeItems] = useState<
    ChargeItemRead[]
  >([]);
  const [accountId, setAccountId] = useState<string | undefined>(undefined);
  const { selectedEncounter } = useEncounter();
  const queryClient = useQueryClient();

  const { refetch: refetchAccount } = useQuery({
    queryKey: ["accounts", selectedEncounter?.patient.id],
    queryFn: query(accountApi.listAccount, {
      pathParams: { facilityId },
      queryParams: {
        patient: selectedEncounter?.patient.id,
        status: AccountStatus.active,
        billing_status: AccountBillingStatus.open,
      },
    }),
    enabled: !!facilityId && !!selectedEncounter?.patient.id,
  });

  const handleLocationSelect = (selectedLocation: LocationRead) => {
    setLocation(selectedLocation);
    setOpen(false);
    setShowDrawer(true);
  };

  const resetInvoiceState = () => {
    setIsInvoiceSheetOpen(false);
    setAccountId(undefined);
    setLocation(undefined);
    setExtractedChargeItems([]);
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
            id: location.id,
            name: location.name,
            path: getLocationPath(location),
          }}
          onDispenseComplete={async (chargeItems: ChargeItemRead[]) => {
            setShowDrawer(false);

            queryClient.invalidateQueries({
              queryKey: [
                "dispenseOrders",
                selectedEncounter.patient.id,
                facilityId,
              ],
            });

            if (
              careConfig.enableAutoInvoiceAfterDispense &&
              chargeItems.length > 0
            ) {
              setExtractedChargeItems(chargeItems);
              const result = await refetchAccount();
              const fetchedAccountId = result.data?.results?.[0]?.id;

              if (fetchedAccountId) {
                setAccountId(fetchedAccountId);
                setIsInvoiceSheetOpen(true);
              }
            }
          }}
        />
      )}

      {selectedEncounter && accountId && (
        <CreateInvoiceSheet
          facilityId={facilityId}
          accountId={accountId}
          open={isInvoiceSheetOpen}
          onOpenChange={(open) => !open && resetInvoiceState()}
          preSelectedChargeItems={extractedChargeItems}
          onSuccess={resetInvoiceState}
          sourceUrl={buildEncounterUrl(
            selectedEncounter.patient.id,
            `/encounter/${selectedEncounter.id}/updates`,
            facilityId,
          )}
        />
      )}
    </>
  );
};
