import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import Page from "@/components/Common/Page";
import UserAddEditForm from "@/components/Users/UserAddEditForm";

const UserAdd = () => {
  const { t } = useTranslation();

  return (
    <Page
      title={t("Add User")}
      options={
        <Link
          href="https://school.ohc.network/targets/12953"
          className="inline-block rounded border border-secondary-600 bg-secondary-50 px-4 py-2 text-secondary-600 transition hover:bg-secondary-100"
          target="_blank"
        >
          <CareIcon icon="l-question-circle" className="text-lg" /> &nbsp;Need
          Help?
        </Link>
      }
      backUrl="/users"
    >
      <UserAddEditForm />
    </Page>
  );
};

export default UserAdd;
