import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Avatar } from "@/components/Common/Avatar";
import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";

import routes from "@/Utils/request/api";
import useTanStackQueryInstead from "@/Utils/request/useQuery";
import { formatName, relativeTime } from "@/Utils/utils";

import DialogModal from "../Common/Dialog";

export const NoticeBoard = () => {
  const { t } = useTranslation();
  const { data, loading } = useTanStackQueryInstead(routes.getNotifications, {
    query: { offset: 0, event: "MESSAGE", medium_sent: "SYSTEM" },
  });
  type Notice = {
    id: number;
    message: string;
    caused_by: {
      username: string;
      first_name: string;
      last_name: string;
      read_profile_picture_url: string;
    };
    created_date: string;
  };

  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  const formatMessage = (message: string): string => {
    const string_list: string[] = message.split("\n");
    if (string_list.length === 1) {
      return message;
    }
    const out = string_list.slice(1).map((word) => word + "</br>");
    return out.join("");
  };

  const Message: React.FC<{ message: string; classes: string }> = ({
    message,
    classes,
  }) => {
    const formattedMessage = formatMessage(message);

    return (
      <>
        <h1 className="font-semibold text-lg text-black mb-1 truncate hover:text-clip">
          {" "}
          {message.split("\n")[0]}
        </h1>
        <p
          className={classes}
          dangerouslySetInnerHTML={{ __html: formattedMessage }}
        />
      </>
    );
  };
  const handleViewDetails = (notice: Notice) => {
    setSelectedNotice(notice);
  };

  const handleCloseModal = () => {
    setSelectedNotice(null);
  };

  let notices;
  if (data?.results.length) {
    notices = (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-1 xl:grid-cols-2 mt-4">
        {data.results.map((item) => (
          <div
            key={`usr_${item.id}`}
            className="flex-col flex   justify-between overflow-hidden rounded shadow-md my-1 h-[33vh]"
          >
            <div
              className="flex-1 text-justify mx-2 py-3 px-5"
              id="notification-message"
            >
              <Message classes="truncate" message={item.message} />
            </div>
            <div className="h-1/4 flex justify-between items-center bg-gray-200 ">
              <div className="py-2 flex items-center ">
                <Avatar
                  name={item.caused_by.username || ""}
                  imageUrl={item.caused_by.read_profile_picture_url}
                  aria-label={`${formatName(item.caused_by.username)}'s avatar`}
                  className="border-0 border-b border-b-secondary-300 rounded-full h-10 w-10 ml-5"
                />
                <div className="text-md my-1 text-secondary-700  px-3">
                  <div className="flex font-bold items-center text-black">
                    {item.caused_by.first_name + " " + item.caused_by.last_name}{" "}
                    -{""}
                    <span className="font-oblique text-gray-500 font-medium ml-1">
                      {item.caused_by.username}
                    </span>
                  </div>
                  <div className="text-xs text-secondary-900 font-medium ">
                    {relativeTime(item.created_date)}
                  </div>
                </div>
              </div>
              <div className="col-span-1 mt-2 flex flex-col text-left border-2 border-gray-400 rounded-md mr-10">
                <button
                  onClick={() => handleViewDetails(item)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-secondary-300 bg-secondary-200 p-2 text-sm font-semibold text-inherit transition-all hover:bg-secondary-300"
                >
                  <CareIcon icon="l-eye" className="text-lg" />{" "}
                  {t("view_notice")}
                </button>
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
            {t("no_notice_available")}
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <Loading />;
  return (
    <Page title={t("notice_board")} hideBack={true} breadcrumbs={false}>
      <div>{notices}</div>
      {selectedNotice && (
        <DialogModal show={true} onClose={handleCloseModal} title={""}>
          <div className="m-0">
            <div className="flex justify-between w-full  items-center mb-4">
              <CareIcon
                className="bg-primary-200 font-light  p-2 mb-1 text-primary-600 rounded-lg w-10 h-10 "
                icon="l-envelope-open"
              />
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-secondary-400 text-gray-600 rounded-md flex items-center"
              >
                <CareIcon icon="l-times" className="mr-1" />
                {t("close")}
              </button>
            </div>
            <Message classes="" message={selectedNotice.message} />
            <div className="w-full py-2 flex items-center bg-gray-200 rounded-lg mt-4">
              <Avatar
                name={selectedNotice.caused_by.username || ""}
                imageUrl={selectedNotice.caused_by.read_profile_picture_url}
                aria-label={`${formatName(selectedNotice.caused_by.username)}'s avatar`}
                className="border-0 border-b border-b-secondary-300 rounded-full h-10 w-10 ml-5"
              />
              <div className="text-md my-1 text-secondary-700  px-3">
                <div className="flex font-bold items-center text-black">
                  {selectedNotice.caused_by.first_name +
                    " " +
                    selectedNotice.caused_by.last_name}{" "}
                  -{""}
                  <span className="font-oblique text-gray-500 font-medium ml-1">
                    {selectedNotice.caused_by.username}
                  </span>
                </div>
                <div className="text-xs text-secondary-900 font-medium ">
                  {relativeTime(selectedNotice.created_date)}
                </div>
              </div>
            </div>
          </div>
        </DialogModal>
      )}
    </Page>
  );
};
