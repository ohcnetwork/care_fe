import { useTranslation } from "react-i18next";

import { UserModel } from "./models";

interface UserViewDetailsProps {
  user: UserModel;
}

const LabelValue = ({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) => (
  <div className="flex flex-col gap-1">
    <span className="text-sm text-gray-500">{label}</span>
    <span className="text-sm">{value || "-"}</span>
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
  bgColor = "bg-green-600",
  textColor = "text-white",
  className = "",
}: BadgeProps) => {
  return (
    <span
      className={`
          inline-flex items-center rounded-full px-3 py-1 text-sm my-4
          ${bgColor} ${textColor} ${className}
        `.trim()}
    >
      {text}
    </span>
  );
};

export const UserViewDetails = ({ user }: UserViewDetailsProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-visible rounded-lg bg-white px-4 pt-2 pb-5 shadow sm:rounded-lg sm:px-6">
        <Badge text={t("basic_info")} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <LabelValue label={t("username")} value={user.username} />
          <LabelValue label={t("user_type")} value={user.user_type} />
          <LabelValue label={t("first_name")} value={user.first_name} />
          <LabelValue label={t("last_name")} value={user.last_name} />
          <LabelValue label={t("gender")} value={user.gender} />
          <LabelValue
            label={t("date_of_birth")}
            value={
              user.date_of_birth
                ? new Date(user.date_of_birth).toLocaleDateString()
                : null
            }
          />
        </div>
      </div>

      <div className="overflow-visible rounded-lg bg-white px-4 pt-2 pb-5 shadow sm:rounded-lg sm:px-6">
        <Badge text={t("contact_info")} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <LabelValue label={t("email")} value={user.email} />
          <LabelValue label={t("phone_number")} value={user.phone_number} />
          <LabelValue
            label={t("whatsapp_number")}
            value={user.alt_phone_number}
          />
        </div>
      </div>

      {(user.user_type === "Doctor" || user.user_type === "Nurse") && (
        <div className="overflow-visible rounded-lg bg-white pt-2 pb-5 shadow sm:rounded-lg sm:px-6">
          <Badge text={t("professional_info")} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <LabelValue label={t("qualification")} value={user.qualification} />
            {user.user_type === "Doctor" && (
              <>
                <LabelValue
                  label={t("years_of_experience")}
                  value={user.doctor_experience_commenced_on}
                />
                <LabelValue
                  label={t("medical_council_registration")}
                  value={user.doctor_medical_council_registration}
                />
              </>
            )}
            <LabelValue
              label={t("average_weekly_working_hours")}
              value={user.weekly_working_hours?.toString()}
            />
            <LabelValue
              label={t("video_conference_link")}
              value={user.video_connect_link}
            />
          </div>
        </div>
      )}
    </div>
  );
};
