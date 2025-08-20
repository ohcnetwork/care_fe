import { useTranslation } from "react-i18next";
import { formatPhoneNumberIntl } from "react-phone-number-input";

import { TooltipComponent } from "@/components/ui/tooltip";

import {
  Organization,
  renderGeoOrganizations,
} from "@/types/organization/organization";
import { UserRead } from "@/types/user/user";

interface UserViewDetailsProps {
  user: UserRead;
}

const LabelValue = ({
  label,
  value,
  id,
}: {
  label: string;
  value?: string | null;
  id?: string;
}) => (
  <div className="flex flex-col gap-1">
    <p className="text-sm text-gray-500">{label}</p>
    <TooltipComponent content={value || "-"} side="bottom">
      <span id={`view-${id}`} className="text-sm truncate max-w-fit">
        {value || "-"}
      </span>
    </TooltipComponent>
  </div>
);

interface BadgeProps {
  text: string;
  bgColor?: string;
  textColor?: string;
  className?: string;
}

export const Badge = ({
  text,
  textColor = "text-black",
  className = "",
}: BadgeProps) => {
  return (
    <div className="relative mb-4">
      <div className="mt-1 h-1 w-6 bg-blue-600 mb-1" />
      <span
        className={`
          inline-flex items-center rounded-full text-base font-semibold
         ${textColor} ${className}
        `}
      >
        {text}
      </span>
    </div>
  );
};

export const BasicInfoDetails = ({ user }: UserViewDetailsProps) => {
  const { t } = useTranslation();

  return (
    <div className="pt-2 pb-5">
      <Badge text={t("basic_info")} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <LabelValue id="username" label={t("username")} value={user.username} />
        <LabelValue
          id="prefix"
          label={t("prefix")}
          value={user.prefix || "-"}
        />
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
        <LabelValue
          id="suffix"
          label={t("suffix")}
          value={user.suffix || "-"}
        />
        <LabelValue id="gender" label={t("gender")} value={user.gender} />
      </div>
    </div>
  );
};

export const ContactInfoDetails = ({ user }: UserViewDetailsProps) => {
  const { t } = useTranslation();

  return (
    <div className="pt-2 pb-5">
      <Badge text={t("contact_info")} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <LabelValue id="email" label={t("email")} value={user.email} />
        <LabelValue
          id="phone_number"
          label={t("phone_number")}
          value={user.phone_number && formatPhoneNumberIntl(user.phone_number)}
        />
      </div>
    </div>
  );
};

export const GeoOrgDetails = ({ user }: UserViewDetailsProps) => {
  const { t } = useTranslation();
  const geoOrganization =
    "geo_organization" in user
      ? (user.geo_organization as Organization)
      : undefined;

  if (!geoOrganization) {
    return <></>;
  }

  const geoOrganizationDetails = renderGeoOrganizations(geoOrganization);

  return (
    <div className="pt-2 pb-5">
      <Badge text={t("location")} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {geoOrganizationDetails.map((detail) => (
          <LabelValue
            key={detail.label}
            label={detail.label}
            value={detail.value}
          />
        ))}
      </div>
    </div>
  );
};
