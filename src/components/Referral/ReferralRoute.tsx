import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ReferralEndpoint } from "@/types/emr/referral/referral";

interface ReferralRouteProps {
  source: ReferralEndpoint | null;
  destination: ReferralEndpoint;
  labeled?: boolean;
  sourceAuthor?: string;
}

export function ReferralRoute({
  source,
  destination,
  labeled,
  sourceAuthor,
}: ReferralRouteProps) {
  const { t } = useTranslation();
  const endpoints = [
    {
      label: t("referral_from"),
      endpoint: source,
      fallback: t("referral_source_not_recorded"),
    },
    {
      label: t("referral_to"),
      endpoint: destination,
      fallback: t("referral_destination_not_recorded"),
    },
  ];

  return (
    <div
      role="group"
      aria-label={t("referral_from_to")}
      className="flex min-w-0 items-start gap-2 text-xs leading-relaxed"
    >
      {endpoints.map(({ label, endpoint, fallback }, index) => {
        const departments = endpoint?.departments ?? [];
        const name = departments.length
          ? departments.map((department) => department.name).join(", ")
          : endpoint?.organization?.name ||
            endpoint?.facility?.name ||
            endpoint?.external_name ||
            fallback;
        const facilityName = departments.length
          ? endpoint?.facility?.name
          : null;

        return (
          <div key={label} className="contents">
            {index > 0 && !labeled && (
              <ArrowRight
                aria-hidden="true"
                className="mt-0.5 size-3.5 shrink-0 text-cui-muted-foreground rtl:rotate-180"
              />
            )}
            <div
              role="group"
              aria-label={label}
              className="min-w-0 flex-1 whitespace-normal"
            >
              {labeled && (
                <p className="mb-1 text-xs text-cui-muted-foreground">
                  {label}
                </p>
              )}
              {labeled && index === 0 && sourceAuthor && (
                <p className="mb-0.5 text-sm font-semibold text-cui-foreground">
                  {sourceAuthor}
                </p>
              )}
              <p
                className={
                  labeled && (index === 1 || !sourceAuthor)
                    ? "wrap-anywhere text-sm font-semibold text-cui-foreground"
                    : "line-clamp-2 wrap-anywhere text-cui-foreground"
                }
                title={name}
              >
                {name}
              </p>
              {facilityName && (
                <p
                  className="line-clamp-2 wrap-anywhere text-cui-muted-foreground"
                  title={facilityName}
                >
                  {facilityName}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
