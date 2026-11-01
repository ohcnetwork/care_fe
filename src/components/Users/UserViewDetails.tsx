import { LucideIcon, Mail, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatPhoneNumberIntl } from "react-phone-number-input";

import { cn } from "@/lib/utils";
import { renderGeoOrganizations } from "@/types/organization/organization";
import { UserRead } from "@/types/user/user";

interface UserViewDetailsProps {
  user: UserRead;
}

const LabelValue = ({
  label,
  value,
  id,
  icon: Icon,
}: {
  label: string;
  value?: string | null;
  id?: string;
  icon?: LucideIcon;
}) => (
  <div className={cn("min-w-0 space-y-1.5", Icon && "relative pl-12")}>
    <dt className="text-xs text-soft-foreground">
      {Icon && (
        <span
          className="absolute left-0 top-0 flex size-9 items-center justify-center rounded-lg bg-soft-background text-soft-foreground"
          aria-hidden="true"
        >
          <Icon className="size-4" strokeWidth={1.5} />
        </span>
      )}
      {label}
    </dt>
    <dd
      id={id ? `view-${id}` : undefined}
      className={cn(
        "break-words text-sm font-medium leading-relaxed text-foreground",
        !value && "font-normal text-disabled-foreground",
      )}
    >
      {value || "—"}
    </dd>
  </div>
);

export const BasicInfoDetails = ({ user }: UserViewDetailsProps) => {
  const { t } = useTranslation();
  return (
    <dl className="grid grid-cols-2 gap-x-5 gap-y-5 ">
      <LabelValue
        id="first_name"
        label={t("first_name")}
        value={user.first_name}
      />
      <LabelValue
        id="last_name"
        label={t("last_name")}
        value={user.last_name}
      />
      {user.prefix && (
        <LabelValue id="prefix" label={t("prefix")} value={user.prefix} />
      )}
      {user.suffix && (
        <LabelValue id="suffix" label={t("suffix")} value={user.suffix} />
      )}
      <LabelValue
        id="gender"
        label={t("gender")}
        value={user.gender ? t(`GENDER__${user.gender}`) : null}
      />
    </dl>
  );
};

export const ContactInfoDetails = ({ user }: UserViewDetailsProps) => {
  const { t } = useTranslation();
  return (
    <dl className="space-y-6">
      <LabelValue
        id="email"
        label={t("email")}
        value={user.email}
        icon={Mail}
      />
      <LabelValue
        id="phone_number"
        label={t("phone_number")}
        value={
          user.phone_number &&
          (formatPhoneNumberIntl(user.phone_number) || user.phone_number)
        }
        icon={Phone}
      />
    </dl>
  );
};

export const GeoOrgDetails = ({ user }: UserViewDetailsProps) => (
  <dl className="grid grid-cols-2 gap-5">
    {user.geo_organization &&
      renderGeoOrganizations(user.geo_organization).map((detail) => (
        <LabelValue
          key={detail.label}
          label={detail.label}
          value={detail.value}
        />
      ))}
  </dl>
);
