import { format } from "date-fns";
import { useTranslation } from "react-i18next";

import useAuthUser from "@/hooks/useAuthUser";
import { formatName } from "@/Utils/utils";

interface PrintFooterProps {
  /**
   * Optional left side content. If not provided, shows "Prepared by: username" if showPreparedBy is true
   */
  leftContent?: React.ReactNode;
  /**
   * Optional right side content. If not provided, shows "Generated on: [date/time]"
   */
  rightContent?: React.ReactNode;
  /**
   * Show the prepared by user info on the left side (current logged in user)
   * @default false
   */
  showPreparedBy?: boolean;
  /**
   * Show the printed by user info on the left side (current logged in user)
   * @default false
   */
  showPrintedBy?: boolean;
  /**
   * Custom date format for the printed on timestamp
   * @default "PPP 'at' p" (e.g., "January 17, 2026 at 3:45 PM")
   */
  dateFormat?: string;
  /**
   * Additional CSS classes for the container
   */
  className?: string;
}

export function PrintFooter({
  leftContent,
  rightContent,
  showPreparedBy = false,
  showPrintedBy = false,
  dateFormat = "PPP 'at' p",
  className = "",
}: PrintFooterProps) {
  const { t } = useTranslation();
  const currentUser = useAuthUser();

  const preparedByContent = showPreparedBy ? (
    <span>
      <span className="font-semibold">{t("prepared_by")}: </span>
      <span>{formatName(currentUser)}</span>
    </span>
  ) : showPrintedBy ? (
    <span>
      <span className="font-semibold">{t("printed_by")} </span>
      <span>{formatName(currentUser)}</span>
    </span>
  ) : null;

  const generatedOnContent = (
    <span>
      <span className="font-semibold">{t("generated_on")} </span>
      <span>{format(new Date(), dateFormat)}</span>
    </span>
  );

  return (
    <div
      className={`mt-2 text-[10px] text-gray-500 flex justify-between flex-wrap ${className}`}
    >
      <p>{leftContent ?? preparedByContent}</p>
      <p>{rightContent ?? generatedOnContent}</p>
    </div>
  );
}

export default PrintFooter;
