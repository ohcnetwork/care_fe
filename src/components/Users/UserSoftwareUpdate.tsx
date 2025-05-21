import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";

import UpdatableApp, { checkForUpdate } from "@/components/Common/UpdatableApp";

export default function UserSoftwareUpdate() {
  const [updateStatus, setUpdateStatus] = useState({
    isChecking: false,
    isUpdateAvailable: false,
  });
  const { t } = useTranslation();

  const checkUpdates = async () => {
    setUpdateStatus({ ...updateStatus, isChecking: true });
    await new Promise((resolve) => setTimeout(resolve, 500));
    if ((await checkForUpdate()) != null) {
      setUpdateStatus({
        isUpdateAvailable: true,
        isChecking: false,
      });
    } else {
      setUpdateStatus({
        isUpdateAvailable: false,
        isChecking: false,
      });
      toast.success(t("no_update_available"));
    }
  };

  return (
    <>
      {updateStatus.isChecking ? (
        // While checking for updates
        <Button disabled>
          <div className="flex items-center gap-4">
            <CareIcon icon="l-sync" className="text-2xl animate-spin" />
            {t("checking_for_update")}
          </div>
        </Button>
      ) : updateStatus.isUpdateAvailable ? (
        // When an update is available
        <UpdatableApp
          silentlyAutoUpdate={false}
          onDismissUpdateToast={() => {
            setUpdateStatus({
              isUpdateAvailable: false,
              isChecking: false,
            });
          }}
        >
          <Button disabled>
            <div className="flex items-center gap-4">
              <CareIcon
                icon="l-exclamation"
                className="text-2xl text-warning"
              />
              {t("update_available")}
            </div>
          </Button>
        </UpdatableApp>
      ) : (
        // Default state to check for updates
        <Button variant="primary" onClick={checkUpdates}>
          <div className="flex items-center gap-4">
            <CareIcon icon="l-sync" className="text-xl" />
            {t("check_for_update")}
          </div>
        </Button>
      )}
    </>
  );
}
