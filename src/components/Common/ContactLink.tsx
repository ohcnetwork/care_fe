import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

type ContactLinkProps = (
  { mailto: string; tel?: undefined } | { mailto?: undefined; tel: string }
) & {
  /** Display text; defaults to the raw value. The href always uses the raw value. */
  label?: string;
  className?: string;
};

export default function ContactLink(props: ContactLinkProps) {
  const { t } = useTranslation();
  const label = props.label ?? props.tel ?? props.mailto;

  return (
    <div>
      <a
        href={props.tel ? `tel:${props.tel}` : `mailto:${props.mailto}`}
        className={cn(
          "text-primary hover:underline flex items-center gap-1",
          props.className,
        )}
        aria-label={
          props.tel
            ? t("contact_link_call", { number: label })
            : t("contact_link_email", { email: label })
        }
      >
        <CareIcon icon={props.tel ? "l-outgoing-call" : "l-envelope-alt"} />
        {label}
      </a>
    </div>
  );
}
