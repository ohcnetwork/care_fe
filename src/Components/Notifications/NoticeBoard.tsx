import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { getNotifications } from "../../Redux/actions";
import moment from "moment";
import PageTitle from "../Common/PageTitle";
import { Card, CardContent } from "@material-ui/core";

export const NoticeBoard: any = () => {
  const dispatch: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
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

  let notices: any[] = [];
  if (data && data.length) {
    notices = data.map((item) => (
      <Card key={`usr_${item.id}`} className="my-4 mx-8 rounded-lg">
        <CardContent>
          <div className="">
            <div className="text-lg font-bold">{`Message From: ${item.caused_by.first_name} ${item.caused_by.last_name} - ${item.caused_by.user_type}`}</div>
            <div className="text-xs">
              On: {moment(item.created_date).format("lll")}
            </div>
            <div className="text-justify">{item.message}</div>
          </div>
        </CardContent>
      </Card>
    ));
  } else {
    notices.push(
      <Card key="no-notice" className="my-4 mx-8 rounded-lg">
        <CardContent>
          <div className="text-xl text-center semibold">
            No notices for you.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col">
      <PageTitle title="Notice Board" />
      {notices}
    </div>
  );
};
