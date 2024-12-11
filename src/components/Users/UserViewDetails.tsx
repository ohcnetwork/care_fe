import { useTranslation } from "react-i18next";

import { UserModel } from "./models";

interface UserViewDetailsProps {
  user: UserModel;
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
    <span className="text-sm text-gray-500">{label}</span>
    <span id={`view-${id}`} className="text-sm">
      {value || "-"}
    </span>
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
          id="user_type"
          label={t("user_type")}
          value={user.user_type}
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
        <LabelValue id="gender" label={t("gender")} value={user.gender} />
        <LabelValue
          id="date_of_birth"
          label={t("date_of_birth")}
          value={
            user.date_of_birth
              ? new Date(user.date_of_birth).toLocaleDateString()
              : null
          }
        />
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
          value={user.phone_number}
        />
        <LabelValue
          id="whatsapp_number"
          label={t("whatsapp_number")}
          value={user.alt_phone_number}
        />
      </div>
    </div>
  );
};

export const ProfessionalInfoDetails = ({ user }: UserViewDetailsProps) => {
  const { t } = useTranslation();

  return (
    <div className="pt-2 pb-5">
      <Badge text={t("professional_info")} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {(user.user_type === "Doctor" || user.user_type === "Nurse") && (
          <LabelValue
            id="qualification"
            label={t("qualification")}
            value={user.qualification}
          />
        )}
        {user.user_type === "Doctor" && (
          <>
            <LabelValue
              id="years_of_experience"
              label={t("years_of_experience")}
              value={user.doctor_experience_commenced_on}
            />
            <LabelValue
              id="doctor_medical_council_registration"
              label={t("medical_council_registration")}
              value={user.doctor_medical_council_registration}
            />
          </>
        )}
        <LabelValue
          id="average_weekly_working_hours"
          label={t("average_weekly_working_hours")}
          value={user.weekly_working_hours?.toString()}
        />
        <LabelValue
          id="video_conference_link"
          label={t("video_conference_link")}
          value={user.video_connect_link}
        />
      </div>
    </div>
  );
};
