import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import Page from "@/components/Common/Page";
import UserAddEditForm from "@/components/Users/UserAddEditForm";
import { newUserFields } from "@/components/Users/UserFormValidations";

import { classNames } from "@/Utils/utils";

//Temporary: ABDM plug imports from UserAdd instead of UserAddEditForm
export const validateRule = (
  condition: boolean,
  content: JSX.Element | string,
  isInitialState: boolean = false,
) => {
  return (
    <div>
      {isInitialState ? (
        <CareIcon icon="l-circle" className="text-xl text-gray-500" />
      ) : condition ? (
        <CareIcon icon="l-check-circle" className="text-xl text-green-500" />
      ) : (
        <CareIcon icon="l-times-circle" className="text-xl text-red-500" />
      )}{" "}
      <span
        className={classNames(
          isInitialState
            ? "text-black"
            : condition
              ? "text-primary-500"
              : "text-red-500",
        )}
      >
        {content}
      </span>
    </div>
  );
};

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
      <UserAddEditForm includedFields={newUserFields} />
    </Page>
  );
};

export default UserAdd;
