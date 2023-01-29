import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { getNotifications } from "../../Redux/actions";
import PageTitle from "../Common/PageTitle";
import { Card, CardContent } from "@material-ui/core";
import Loading from "../Common/Loading";
import { formatDate } from "../../Utils/utils";

export const NoticeBoard: any = () => {
  const dispatch: any = useDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);

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
                  On: {formatDate(item.created_date)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  } else {
    notices = (
      <Card key="no-notice" className="my-4 rounded-lg">
        <CardContent>
          <div className="text-xl text-center semibold">
            No notices for you.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) return <Loading />;
  return (
    <div className="px-6">
      <PageTitle title="Notice Board" hideBack={true} breadcrumbs={false} />
      <div>{notices}</div>
    </div>
  );
};
