import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Avatar } from "@/components/Common/Avatar";
import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";

import routes from "@/Utils/request/api";
import useTanStackQueryInstead from "@/Utils/request/useQuery";
import { formatName, relativeTime } from "@/Utils/utils";

export const NoticeBoard = () => {
  const { t } = useTranslation();
  const { data, loading } = useTanStackQueryInstead(routes.getNotifications, {
    query: { offset: 0, event: "MESSAGE", medium_sent: "SYSTEM" },
  });
  let notices;
  if (data?.results.length) {
    notices = (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 mt-4">
        {data.results.map((item) => (
          <div
            key={`usr_${item.id}`}
            className="overflow-hidden rounded shadow-md my-1"
          >
            <div
              className="text-justify  text-lg flex mx-2 py-3 px-5"
              id="notification-message"
            >
              <CareIcon
                icon="l-facebook-messenger"
                className="text-lg mr-6 mt-1"
              />
              <span className="font-mono text-md leading-relaxed">
                {item.message}{" "}
              </span>
            </div>

            <div className="bg-gray-200 py-2 flex items-center ">
              <Avatar
                name={item.caused_by.username || ""}
                imageUrl={item.caused_by.read_profile_picture_url}
                aria-label={`${formatName(item.caused_by.username)}'s avatar`}
                className="border-0 border-b border-b-secondary-300 rounded-full h-10 w-10 ml-5"
              />
              <div className="text-md my-1 text-secondary-700  px-3">
                <div className="flex items-center">
                  {item.caused_by.first_name + " " + item.caused_by.last_name} -
                  {""}
                  <span className="font-bold text-primary-700 ml-2">
                    {item.caused_by.username}
                  </span>
                </div>
                <div className="text-xs text-secondary-900 font-medium ">
                  {relativeTime(item.created_date)}
                </div>
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
