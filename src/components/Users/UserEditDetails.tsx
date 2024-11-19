import { useState } from "react";
import { useTranslation } from "react-i18next";

import UserAddEditForm from "@/components/Users/UserAddEditForm";
import {
  editBasicInfoFields,
  editContactInfoFields,
  editProfessionalInfoFields,
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
  onSubmitSuccess: () => void;
}

export function UserBasicInfoView({
  username,
  userData,
  onSubmitSuccess,
}: UserEditDetailsProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);

  const ViewEditToggle = ({
    isEditing,
    setIsEditing,
  }: {
    isEditing: boolean;
    setIsEditing: (value: boolean) => void;
  }) => (
    <div className="mb-4 inline-flex rounded-lg bg-gray-100 p-1">
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
      >
        {t("edit")}
      </button>
    </div>
  );

  return (
    <div
      id="user-edit-form"
      className="overflow-visible px-4 py-5 sm:px-6 rounded-lg shadow sm:rounded-lg bg-white"
    >
      <ViewEditToggle isEditing={isEditing} setIsEditing={setIsEditing} />
      {isEditing ? (
        <UserAddEditForm
          username={username}
          includedFields={editBasicInfoFields}
          onSubmitSuccess={() => {
            setIsEditing(false);
            onSubmitSuccess();
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

  const ViewEditToggle = ({
    isEditing,
    setIsEditing,
  }: {
    isEditing: boolean;
    setIsEditing: (value: boolean) => void;
  }) => (
    <div className="mb-4 inline-flex rounded-lg bg-gray-100 p-1">
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
      >
        {t("edit")}
      </button>
    </div>
  );

  return (
    <div
      id="user-contact-form"
      className="overflow-visible px-4 py-5 sm:px-6 rounded-lg shadow sm:rounded-lg bg-white"
    >
      <ViewEditToggle isEditing={isEditing} setIsEditing={setIsEditing} />
      {isEditing ? (
        <UserAddEditForm
          username={username}
          includedFields={editContactInfoFields}
          onSubmitSuccess={() => {
            setIsEditing(false);
            onSubmitSuccess();
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

  // Only render if user is Doctor or Nurse
  if (userData.user_type !== "Doctor" && userData.user_type !== "Nurse") {
    return null;
  }

  const ViewEditToggle = ({
    isEditing,
    setIsEditing,
  }: {
    isEditing: boolean;
    setIsEditing: (value: boolean) => void;
  }) => (
    <div className="mb-4 inline-flex rounded-lg bg-gray-100 p-1">
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
      >
        {t("edit")}
      </button>
    </div>
  );

  return (
    <div
      id="user-professional-form"
      className="overflow-visible px-4 py-5 sm:px-6 rounded-lg shadow sm:rounded-lg bg-white"
    >
      <ViewEditToggle isEditing={isEditing} setIsEditing={setIsEditing} />
      {isEditing ? (
        <UserAddEditForm
          username={username}
          includedFields={editProfessionalInfoFields}
          onSubmitSuccess={() => {
            setIsEditing(false);
            onSubmitSuccess();
          }}
        />
      ) : (
        <ProfessionalInfoDetails user={userData} />
      )}
    </div>
  );
}

export default function UserEditDetails({
  username,
  userData,
  onSubmitSuccess,
}: UserEditDetailsProps) {
  return (
    <div className="flex flex-col gap-6">
      <UserBasicInfoView
        username={username}
        userData={userData}
        onSubmitSuccess={onSubmitSuccess}
      />
      <UserContactInfoView
        username={username}
        userData={userData}
        onSubmitSuccess={onSubmitSuccess}
      />
      <UserProfessionalInfoView
        username={username}
        userData={userData}
        onSubmitSuccess={onSubmitSuccess}
      />
    </div>
  );
}
