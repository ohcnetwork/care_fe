import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { formatDateTime } from "@/Utils/utils";

interface TagExpiryProps {
  expiry?: string | null;
  expired?: boolean;
}

export function TagExpiry({ expiry, expired = false }: TagExpiryProps) {
  const { t } = useTranslation();
  const [now, setNow] = useState(() => Date.now());
  const expiryDate = expiry ? new Date(expiry) : null;
  const expiryTime = expiryDate?.getTime();

  useEffect(() => {
    if (
      expired ||
      expiryTime == null ||
      !Number.isFinite(expiryTime) ||
      expiryTime <= now
    ) {
      return;
    }

    const timeout = setTimeout(
      () => setNow(Date.now()),
      Math.min(Math.max(expiryTime - now + 1, 0), 60_000),
    );
    return () => clearTimeout(timeout);
  }, [expired, expiryTime, now]);

  if (!expiryDate || expiryTime == null || !Number.isFinite(expiryTime)) {
    return expired ? (
      <span className="border-l border-current/30 pl-1.5 whitespace-nowrap normal-case">
        {t("expired")}
      </span>
    ) : null;
  }

  const expiryLabel =
    expired || expiryTime <= now ? "tag_expired_on" : "tag_expires_on";
  const expiryDescription = t(expiryLabel, {
    date: formatDateTime(expiryDate, "DD MMM YYYY, hh:mm A"),
  });

  return (
    <time
      dateTime={expiry ?? undefined}
      title={expiryDescription}
      aria-label={expiryDescription}
      className="border-l border-current/30 pl-1.5 whitespace-nowrap normal-case"
    >
      {t(expiryLabel, {
        date: formatDateTime(expiryDate, "DD MMM"),
      })}
    </time>
  );
}
