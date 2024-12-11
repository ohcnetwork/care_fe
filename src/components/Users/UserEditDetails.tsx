import { TFunction } from "i18next";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import UserAddEditForm from "@/components/Users/UserAddEditForm";
import {
  editBasicInfoFields,
  editContactInfoFields,
  editProfessionalInfoFields,
  editProfessionalInfoFieldsForNurseDoctor,
} from "@/components/Users/UserFormValidations";
import {
  BasicInfoDetails,
  ContactInfoDetails,
  ProfessionalInfoDetails,
} from "@/components/Users/UserViewDetails";
import { UserModel } from "@/components/Users/models";

interface UserEditDetailsProps {
  username: string;
  userData: UserModel;
  onSubmitSuccess?: () => void;
}

const ViewEditToggle = ({
  isEditing,
  setIsEditing,
  id,
  t,
}: {
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  id: string;
  t: TFunction;
}) => {
  return (
    <div className="mb-2 inline-flex rounded-lg bg-gray-100 p-1">
      <button
        onClick={() => setIsEditing(false)}
        className={`
            px-4 py-2 text-sm font-medium rounded-md transition-colors
            ${
              !isEditing
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }
          `}
        id={`${id}-view-button`}
      >
        {t("view")}
      </button>
      <button
        onClick={() => setIsEditing(true)}
        className={`
            px-4 py-2 text-sm font-medium rounded-md transition-colors
            ${
              isEditing
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }
          `}
        id={`${id}-edit-button`}
      >
        {t("edit")}
      </button>
    </div>
  );
};

export function UserBasicInfoView({
  username,
  userData,
  onSubmitSuccess,
}: UserEditDetailsProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div
      id="user-edit-form"
      className="overflow-visible px-4 py-5 sm:px-6 rounded-lg shadow sm:rounded-lg bg-white"
    >
      <ViewEditToggle
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        id="basic-info"
        t={t}
      />
      {isEditing ? (
        <UserAddEditForm
          username={username}
          includedFields={editBasicInfoFields}
          onSubmitSuccess={() => {
            setIsEditing(false);
            onSubmitSuccess?.();
          }}
        />
      ) : (
        <BasicInfoDetails user={userData} />
      )}
    </div>
  );
}

export function UserContactInfoView({
  username,
  userData,
  onSubmitSuccess,
}: UserEditDetailsProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div
      id="user-contact-form"
      className="overflow-visible px-4 py-5 sm:px-6 rounded-lg shadow sm:rounded-lg bg-white"
    >
      <ViewEditToggle
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        id="contact-info"
        t={t}
      />
      {isEditing ? (
        <UserAddEditForm
          username={username}
          includedFields={editContactInfoFields}
          onSubmitSuccess={() => {
            setIsEditing(false);
            onSubmitSuccess?.();
          }}
        />
      ) : (
        <ContactInfoDetails user={userData} />
      )}
    </div>
  );
}

export function UserProfessionalInfoView({
  username,
  userData,
  onSubmitSuccess,
}: UserEditDetailsProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const editFields =
    userData.user_type === "Doctor" || userData.user_type === "Nurse"
      ? editProfessionalInfoFieldsForNurseDoctor
      : editProfessionalInfoFields;

  return (
    <div
      id="user-professional-form"
      className="overflow-visible px-4 py-5 sm:px-6 rounded-lg shadow sm:rounded-lg bg-white"
    >
      <ViewEditToggle
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        id="professional-info"
        t={t}
      />
      {isEditing ? (
        <UserAddEditForm
          username={username}
          includedFields={editFields}
          onSubmitSuccess={() => {
            setIsEditing(false);
            onSubmitSuccess?.();
          }}
        />
      ) : (
        <ProfessionalInfoDetails user={userData} />
      )}
    </div>
  );
}
