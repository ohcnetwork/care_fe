import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { getNotifications } from "../../Redux/actions";
import PageTitle from "../Common/PageTitle";
import { Card, CardContent } from "@material-ui/core";
import Loading from "../Common/Loading";
import { formatDate } from "../../Utils/utils";
import { useTranslation } from "react-i18next";
import CardActions from "@mui/material/CardActions";
import CardMedia from "@mui/material/CardMedia";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
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
        className="  ml-500 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-6 container d-flex align-items-center justify-content-center"
        style={{ marginLeft: "35%", marginTop: "45px" }}
      >
        <Card>
          <CardMedia
            component="img"
            alt="green iguana"
            height="140"
            image={bell}
          />
          <CardContent>
            <Typography gutterBottom variant="h5" component="div">
              You Dont Have Any Notices
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Did you know: We could render a fun fact about health here
            </Typography>
          </CardContent>
          <CardActions>
            <div style={{ marginLeft: "35%" }}>
              <Button size="large">
                <a href="/">Go Home</a>
              </Button>
            </div>
          </CardActions>
        </Card>
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
