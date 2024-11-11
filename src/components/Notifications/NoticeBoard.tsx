import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";

import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";
import { formatDateTime, formatName } from "@/Utils/utils";

export const NoticeBoard = () => {
  const { t } = useTranslation();
  const { data, loading } = useQuery(routes.getNotifications, {
    query: { offset: 0, event: "MESSAGE", medium_sent: "SYSTEM" },
  });

  let notices;

  if (data?.results.length) {
    notices = (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {data.results.map((item) => (
          <div
            key={`usr_${item.id}`}
            className="overflow-hidden rounded shadow-md"
          >
            <div className="px-6 py-4">
              <div className="text-justify text-lg" id="notification-message">
                {item.message}
              </div>
              <div className="text-md my-2 text-secondary-700">
                {formatName(item.caused_by)} -{" "}
                <span className="font-bold text-primary-700">
                  {item.caused_by.user_type}
                </span>
              </div>
              <div className="text-xs text-secondary-900">
                {t("on")}: {formatDateTime(item.created_date)}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  } else {
    notices = (
      <div className="m-auto flex max-w-xs items-center">
        <div className="my-36">
          <CareIcon icon="l-bell-slash" className="h-auto text-secondary-500" />
          <div className="m-auto mt-6 text-2xl text-secondary-500">
            No Notice Available
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <Loading />;
  return (
    <Page title={t("notice_board")} hideBack={true} breadcrumbs={false}>
      <div>{notices}</div>
    </Page>
  );
};
