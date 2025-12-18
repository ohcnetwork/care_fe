import { navigate, usePathParams } from "raviger";
import { useTranslation } from "react-i18next";

export function SyncToast({
  message,
  toastId,
  dismiss,
}: {
  message: string;
  toastId: string | number;
  dismiss: (id: string | number) => void;
}) {
  const { t } = useTranslation();
  const { facilityId } = usePathParams("/facility/:facilityId/*") ?? {};
  const showButton = Boolean(facilityId);

  return (
    <div className="flex items-center justify-between rounded border border-green-300 bg-green-100 px-4 py-3">
      {/* Message */}
      <p className="text-sm font-medium">{message}</p>

      {/* Button */}
      {showButton && (
        <button
          onClick={() => {
            navigate(`/facility/${facilityId}/settings/sync-status`);
            dismiss(toastId);
          }}
          className="ml-3 text-sm cursor-pointer text-green-500 font-medium underline underline-offset-4 hover:text-green-800 hover:underline"
        >
          {t("check_sync_status")}
        </button>
      )}
    </div>
  );
}
