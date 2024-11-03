import { useTranslation } from "react-i18next";
import LinkededFacilities from "./LinkedFacilities";
import { UserModel } from "./models";
import userColumns from "../Common/UserColumns";

type Props = {
  userData: UserModel;
  username: string;
};

export default function LinkedFacilitiesTab(props: Props) {
  const { userData } = props;
  const { t } = useTranslation();

  if (!userData) {
    return;
  }

  return (
    <>
      <div className="mt-10 flex flex-col gap-y-12">
        {userColumns(
          t("linked_facilities"),
          t("linked_facilities_note"),
          LinkededFacilities,
          props,
        )}
      </div>
    </>
  );
}
