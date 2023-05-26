import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { getNotifications } from "../../Redux/actions";
import PageTitle from "../Common/PageTitle";
import { Card, CardContent } from "@material-ui/core";
import Loading from "../Common/Loading";
import { formatDate } from "../../Utils/utils";
import { useTranslation } from "react-i18next";
import bell from "./Notificationbell.png";

export const NoticeBoard: any = () => {
  const dispatch: any = useDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    setIsLoading(true);
    dispatch(
      getNotifications({ offset: 0, event: "MESSAGE", medium_sent: "SYSTEM" })
    )
      .then((res: any) => {
        if (res && res.data) {
          setData(res.data.results);
        }
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [dispatch]);

  let notices;

  if (data && data.length) {
    notices = (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-6">
        {data.map((item) => (
          <Card key={`usr_${item.id}`} className="rounded w-full shadow">
            <CardContent>
              <div className="bg-white">
                <div className="text-justify text-lg">{item.message}</div>
                <div className="text-gray-700 text-md mt-2">
                  {`${item.caused_by.first_name} ${item.caused_by.last_name}`} -{" "}
                  <span className="text-primary-700 font-bold">
                    {item.caused_by.user_type}
                  </span>
                </div>
                <div className="text-xs text-gray-900">
                  {t("on")}: {formatDate(item.created_date)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  } else {
    notices = (
      <div
        className="max-w-sm rounded overflow-hidden shadow-lg "
        style={{ marginLeft: "35%", marginTop: "45px" }}
      >
        <img className="w-full" src={bell} alt="Sunset in the mountains"></img>
        <div className="px-6 py-4">
          <div className="font-bold text-xl mb-2">
            {" "}
            You Dont Have Any Notices
          </div>
          <p className="text-gray-700 text-base">
            Did you know: We could render a fun fact about health here
          </p>
        </div>
        <div className="px-6 pt-4 pb-2">
          <button
            className="bg-green-500 text-white hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full"
            style={{ marginLeft: "35%", color: "inherit" }}
          >
            <a href="/" style={{ color: "white" }}>
              Go Home
            </a>
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) return <Loading />;
  return (
    <div className="px-6">
      <PageTitle
        title={t("Notice Board")}
        hideBack={true}
        breadcrumbs={false}
      />
      <div>{notices}</div>
    </div>
  );
};
