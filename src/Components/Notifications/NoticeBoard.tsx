import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { getNotifications } from "../../Redux/actions";
import Page from "../Common/components/Page";
import Loading from "../Common/Loading";
import { formatDate } from "../../Utils/utils";
import { useTranslation } from "react-i18next";
import CareIcon from "../../CAREUI/icons/CareIcon";

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
          <div
            key={`usr_${item.id}`}
            className="rounded overflow-hidden shadow-md"
          >
            <div className="px-6 py-4">
              <div className="text-justify text-lg">{item.message}</div>
              <div className="text-gray-700 text-md mb-2 mt-2">
                {`${item.caused_by.first_name} ${item.caused_by.last_name}`} -{" "}
                <span className="text-primary-700 font-bold">
                  {item.caused_by.user_type}
                </span>
              </div>
              <div className="text-gray-900 text-xs">
                {t("on")}: {formatDate(item.created_date)}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  } else {
    notices = (
      <div className=" m-auto max-w-xs flex items-center ">
        <div className="my-36">
          <CareIcon className=" text-gray-500 h-auto care-l-bell-slash" />
          <div className=" m-auto text-gray-500 text-2xl mt-6">
            No Notice Available
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) return <Loading />;
  return (
    <Page title={t("Notice Board")} hideBack={true} breadcrumbs={false}>
      <div>{notices}</div>
    </Page>
  );
};
