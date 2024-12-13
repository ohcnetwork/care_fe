import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import UserColumns from "@/components/Common/UserColumns";
import LinkedFacilities from "@/components/Users/LinkedFacilities";
import { UserModel } from "@/components/Users/models";

import useAuthUser from "@/hooks/useAuthUser";

import * as Notification from "@/Utils/Notifications";
import { editUserPermissions } from "@/Utils/permissions";

type Props = {
  userData: UserModel;
  username: string;
  refetchUserData?: () => void;
};

export default function LinkedFacilitiesTab(props: Props) {
  const { userData } = props;
  const { t } = useTranslation();
  const authUser = useAuthUser();
  const editPermissions = editUserPermissions(authUser, userData);

  if (!userData) {
    Notification.Error({ msg: t("username_userdetails_not_found") });
    return <></>;
  } else if (!editPermissions) {
    Notification.Error({ msg: t("no_permission_to_view_page") });
    navigate("/users");
  }

  return (
    <div className="mt-10 flex flex-col gap-y-12">
      <UserColumns
        heading={t("linked_facilities")}
        note={t("linked_facilities_note")}
        Child={LinkedFacilities}
        childProps={props}
      />
    </div>
  );
}
