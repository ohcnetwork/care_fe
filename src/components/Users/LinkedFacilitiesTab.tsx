import { useTranslation } from "react-i18next";

import userColumns from "@/components/Common/UserColumns";
import LinkedFacilities from "@/components/Users/LinkedFacilities";
import { UserModel } from "@/components/Users/models";

type Props = {
  userData: UserModel;
  username: string;
  refetchUserData?: () => void;
};

export default function LinkedFacilitiesTab(props: Props) {
  const { userData } = props;
  const { t } = useTranslation();

  if (!userData) {
    return <></>;
  }

  return (
    <div className="mt-10 flex flex-col gap-y-12">
      {userColumns(
        t("linked_facilities"),
        t("linked_facilities_note"),
        LinkedFacilities,
        props,
      )}
    </div>
  );
}
