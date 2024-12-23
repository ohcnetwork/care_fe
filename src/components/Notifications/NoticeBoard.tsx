import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import React from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Avatar } from "@/components/Common/Avatar";
import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { formatName, relativeTime } from "@/Utils/utils";

import { NoticeData } from "./models";

export const NoticeBoard = () => {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: [
      routes.getNotifications.path,
      { offset: 0, event: "MESSAGE", medium_sent: "SYSTEM" },
    ],
    queryFn: query(routes.getNotifications, {
      queryParams: { offset: 0, event: "MESSAGE", medium_sent: "SYSTEM" },
    }),
    enabled: true,
    refetchOnWindowFocus: false,
  });
  console.log(data?.results);
  const [selectedNotice, setSelectedNotice] = useState<NoticeData | null>(null);

  const UserInfo: React.FC<NoticeData> = (notice) => (
    <div className="flex items-center bg-gray-200 rounded-lg">
      <Avatar
        name={notice.caused_by.username}
        imageUrl={notice.caused_by.read_profile_picture_url}
        aria-label={`${formatName(notice.caused_by)}'s avatar`}
        className="border-0 border-b border-b-secondary-300 rounded-full h-10 w-10 ml-5"
      />
      <div className="text-md my-1 text-secondary-700  px-3">
        <div className="flex font-bold items-center text-black">
          {formatName(notice.caused_by)}
          <span className="font-oblique text-gray-500 font-medium ml-2">
            {notice.caused_by.username}
          </span>
        </div>
        <div className="text-xs text-secondary-900 font-medium ">
          {relativeTime(notice.created_date)}
        </div>
      </div>
    </div>
  );
  const formatMessage = (message: string): React.ReactNode => {
    const lines = message.split("\n");
    return lines.slice(1).map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < lines.length - 1 && <br />}
      </React.Fragment>
    ));
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
          {message?.split("\n")[0]}
        </h1>
        <p className={classes}>{formattedMessage}</p>
      </>
    );
  };

  const NoticeDialog: React.FC<{ notice: NoticeData }> = ({ notice }) => {
    return (
      <>
        {" "}
        <DialogHeader>
          <div className="flex justify-between w-full  items-center mb-4">
            <CareIcon
              className="bg-primary-200 font-light text-lg p-2  text-primary-600 rounded-lg w-12 h-10 "
              icon="l-envelope-open"
            />
          </div>
        </DialogHeader>
        <Message classes="" message={notice.message} />
        <DialogFooter className="sm:justify-start w-full py-2 flex items-center bg-gray-200 rounded-lg mt-4">
          <UserInfo {...notice} />
        </DialogFooter>
      </>
    );
  };

  let notices;
  if (data?.results.length) {
    notices = (
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-1 xl:grid-cols-2 mt-4">
        {data.results.map((item) => (
          <div
            key={`usr_${item.id}`}
            className="flex-col flex  justify-between overflow-hidden rounded shadow-md my-1 h-[33vh]"
          >
            <div
              className="flex-1 text-justify mx-2 py-3 px-5 overflow-hidden  mb-3"
              id="notification-message"
            >
              <Message classes="truncate" message={item.message} />
            </div>
            <div className="h-1/4 flex justify-between items-center bg-gray-200 py-1">
              <UserInfo {...item} />
              <div className="flex flex-col text-left border-2 border-gray-400 rounded-md mr-10">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant={"ghost"}
                      onClick={() => setSelectedNotice(item)}
                      className="py-2 flex w-full items-center justify-center gap-2 rounded-lg  p-2 text-sm font-semibold text-inherit "
                    >
                      <CareIcon icon="l-eye" className="text-lg" />
                      {t("view_notice")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
                    {selectedNotice && <NoticeDialog notice={selectedNotice} />}
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        ))}
      </section>
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

  if (isLoading) return <Loading />;
  return (
    <Page title={t("notice_board")} hideBack={true} breadcrumbs={false}>
      <div>{notices}</div>
    </Page>
  );
};
