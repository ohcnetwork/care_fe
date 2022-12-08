import { navigate } from "raviger";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  getNotifications,
  markNotificationAsRead,
  getUserPnconfig,
  updateUserPnconfig,
  getPublicKey,
} from "../../Redux/actions";
import { make as SlideOver } from "../Common/SlideOver.gen";
import { SelectField } from "../Common/HelperInputFields";
import { useSelector } from "react-redux";
import { Button, CircularProgress } from "@material-ui/core";
import Spinner from "../Common/Spinner";
import { NOTIFICATION_EVENTS } from "../../Common/constants";
import { Error } from "../../Utils/Notifications.js";
import { classNames } from "../../Utils/utils";
import CareIcon from "../../CAREUI/icons/CareIcon";

import * as Sentry from "@sentry/browser";
import { formatDate } from "../../Utils/utils";
import {
  ShrinkedSidebarItem,
  SidebarItem,
} from "../Common/Sidebar/SidebarItem";

const RESULT_LIMIT = 14;

interface NotificationTileProps {
  notification: any;
  onClickCB?: () => void;
  setShowNotifications: (show: boolean) => void;
}

const NotificationTile = ({
  notification,
  onClickCB,
  setShowNotifications,
}: NotificationTileProps) => {
  const dispatch: any = useDispatch();
  const [result, setResult] = useState(notification);
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);

  const handleMarkAsRead = async () => {
    setIsMarkingAsRead(true);
    await dispatch(markNotificationAsRead(result.id));
    setResult({ ...result, read_at: new Date() });
    setIsMarkingAsRead(false);
  };

  const resultUrl = (event: string, data: any) => {
    switch (event) {
      case "PATIENT_CREATED":
        return `/facility/${data.facility}/patient/${data.patient}`;
      case "PATIENT_UPDATED":
        return `/facility/${data.facility}/patient/${data.patient}`;
      case "PATIENT_CONSULTATION_CREATED":
        return `/facility/${data.facility}/patient/${data.patient}/consultation/${data.consultation}`;
      case "PATIENT_CONSULTATION_UPDATED":
        return `/facility/${data.facility}/patient/${data.patient}/consultation/${data.consultation}`;
      case "PATIENT_CONSULTATION_UPDATE_CREATED":
        return `/facility/${data.facility}/patient/${data.patient}/consultation/${data.consultation}/daily-rounds/${data.daily_round}`;
      case "PATIENT_CONSULTATION_UPDATE_UPDATED":
        return `/facility/${data.facility}/patient/${data.patient}/consultation/${data.consultation}/daily-rounds/${data.daily_round}`;
      case "INVESTIGATION_SESSION_CREATED":
        return `/facility/${data.facility}/patient/${data.patient}/consultation/${data.consultation}/investigation/${data.session}`;
      case "MESSAGE":
        return "/notice_board/";
      default:
        return "#";
    }
  };

  const getNotificationTitle = (id: string) =>
    NOTIFICATION_EVENTS.find((notification) => notification.id === id)?.text;
  const getNotificationIcon = (id: string) =>
    NOTIFICATION_EVENTS.find((notification) => notification.id === id)?.icon;
  return (
    <div
      onClick={() => {
        handleMarkAsRead();
        navigate(resultUrl(result.event, result.caused_objects));
        onClickCB && onClickCB();
        setShowNotifications(false);
      }}
      className={classNames(
        "relative py-5 px-4 lg:px-8 hover:bg-gray-200 focus:bg-gray-200 transition ease-in-out duration-150 cursor-pointer",
        result.read_at && "text-gray-500"
      )}
    >
      <div className="flex justify-between">
        <div className="text-lg font-bold">
          {getNotificationTitle(result.event)}
        </div>
        <div className="">
          <i className={`${getNotificationIcon(result.event)} fa-2x `} />
        </div>
      </div>
      <div className="text-sm py-1">{result.message}</div>
      <div className="flex justify-between items-end">
        <button
          className={`${
            result.read_at && "invisible"
          } h-min inline-flex items-center font-semibold p-2 md:py-1 bg-white hover:bg-gray-300 border rounded text-xs flex-shrink-0`}
          disabled={isMarkingAsRead}
          onClick={(event) => {
            event.stopPropagation();
            handleMarkAsRead();
          }}
        >
          {isMarkingAsRead ? (
            <Spinner />
          ) : (
            <i className="fa-solid fa-check mr-2 text-primary-500" />
          )}
          Mark as Read
        </button>
        <div>
          <div className="text-xs text-right py-1">
            {formatDate(result.created_date)}
          </div>
          <div className="mt-2 text-right min-h-min">
            <button className="inline-flex items-center font-semibold p-2 md:py-1 bg-white hover:bg-gray-300 text-black border rounded text-xs flex-shrink-0">
              <i className="fas fa-eye mr-2 text-primary-500" /> Visit Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface NotificationsListProps {
  shrinked: boolean;
  onClickCB?: () => void;
}

export default function NotificationsList({
  shrinked,
  onClickCB,
}: NotificationsListProps) {
  const rootState: any = useSelector((rootState) => rootState);
  const { currentUser } = rootState;
  const username = currentUser.data.username;
  const dispatch: any = useDispatch();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [reload, setReload] = useState(false);
  const [eventFilter, setEventFilter] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMarkingAllAsRead, setIsMarkingAllAsRead] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowNotifications(false);
      }
    }
    if (showNotifications) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showNotifications]);

  const intialSubscriptionState = async () => {
    try {
      const res = await dispatch(getUserPnconfig({ username: username }));
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();
      if (!subscription && !res?.data?.pf_endpoint) {
        setIsSubscribed("NotSubscribed");
      } else if (subscription?.endpoint === res?.data?.pf_endpoint) {
        setIsSubscribed("SubscribedOnThisDevice");
      } else {
        setIsSubscribed("SubscribedOnAnotherDevice");
      }
    } catch (error) {
      console.error(`Service worker error...Details: ${error}`);
      Sentry.captureException(error);
    }
  };

  const handleSubscribeClick = () => {
    const status = isSubscribed;
    if (status === "NotSubscribed" || status === "SubscribedOnAnotherDevice") {
      subscribe();
    } else {
      unsubscribe();
    }
  };

  const getButtonText = () => {
    const status = isSubscribed;
    if (status === "NotSubscribed") {
      return (
        <>
          {" "}
          <i className="fa-solid fa-bell mr-2"></i>Subscribe
        </>
      );
    } else if (status === "SubscribedOnAnotherDevice") {
      return (
        <>
          {" "}
          <i className="fa-solid fa-bell mr-2"></i>Subscribe On This Device
        </>
      );
    } else {
      return (
        <>
          {" "}
          <i className="fa-solid fa-bell-slash mr-2"></i>Unsubscribe
        </>
      );
    }
  };

  let manageResults: any = null;

  const unsubscribe = () => {
    navigator.serviceWorker.ready
      .then(function (reg) {
        setIsSubscribing(true);
        reg.pushManager
          .getSubscription()
          .then(function (subscription) {
            subscription
              ?.unsubscribe()
              .then(async function (_successful) {
                const data = {
                  pf_endpoint: "",
                  pf_p256dh: "",
                  pf_auth: "",
                };
                await dispatch(
                  updateUserPnconfig(data, { username: username })
                );

                setIsSubscribed("NotSubscribed");
                setIsSubscribing(false);
              })
              .catch(function (_e) {
                Error({
                  msg: "Unsubscribe failed.",
                });
              });
          })
          .catch(function (_e) {
            Error({ msg: "Subscription Error" });
          });
      })
      .catch(function (_e) {
        console.error(`Service worker error...Details: ${_e}`);
        Sentry.captureException(_e);
      });
  };

  async function subscribe() {
    setIsSubscribing(true);
    const response = await dispatch(getPublicKey());
    const public_key = response.data.public_key;
    const sw = await navigator.serviceWorker.ready;
    const push = await sw.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: public_key,
    });
    const p256dh = btoa(
      String.fromCharCode.apply(
        null,
        new Uint8Array(push.getKey("p256dh") as any) as any
      )
    );
    const auth = btoa(
      String.fromCharCode.apply(
        null,
        new Uint8Array(push.getKey("auth") as any) as any
      )
    );

    const data = {
      pf_endpoint: push.endpoint,
      pf_p256dh: p256dh,
      pf_auth: auth,
    };

    const res = await dispatch(
      updateUserPnconfig(data, { username: username })
    );

    if (res.status >= 200 && res.status <= 300) {
      setIsSubscribed("SubscribedOnThisDevice");
    } else {
      console.log("Error saving web push info.");
    }
    setIsSubscribing(false);
  }

  const handleMarkAllAsRead = async () => {
    setIsMarkingAllAsRead(true);
    await Promise.all(
      data.map(async (notification) => {
        return await dispatch(markNotificationAsRead(notification.id));
      })
    );
    setReload(!reload);
    setIsMarkingAllAsRead(false);
  };

  useEffect(() => {
    setIsLoading(true);
    dispatch(
      getNotifications({ offset, event: eventFilter, medium_sent: "SYSTEM" })
    )
      .then((res: any) => {
        if (res && res.data) {
          setData(res.data.results);
          setUnreadCount(
            res.data.results?.reduce(
              (acc: number, result: any) => acc + (result.read_at ? 0 : 1),
              0
            )
          );
          setTotalCount(res.data.count);
        }
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
        setOffset((prev) => prev - RESULT_LIMIT);
      });
    intialSubscriptionState();
  }, [dispatch, reload, showNotifications, offset, eventFilter, isSubscribed]);

  if (!offset && isLoading) {
    manageResults = (
      <div className="flex items-center justify-center">
        <CircularProgress color="primary" />
      </div>
    );
  } else if (data && data.length) {
    manageResults = (
      <>
        {data.map((result: any) => (
          <NotificationTile
            key={result.id}
            notification={result}
            onClickCB={onClickCB}
            setShowNotifications={setShowNotifications}
          />
        ))}
        {isLoading && (
          <div className="flex items-center justify-center">
            <CircularProgress color="primary" />
          </div>
        )}
        {totalCount > RESULT_LIMIT && offset < totalCount - RESULT_LIMIT && (
          <div className="mt-4 flex w-full justify-center py-5 px-4 lg:px-8">
            <Button
              disabled={isLoading}
              variant="contained"
              color="primary"
              fullWidth
              onClick={() => {
                setOffset((prev) => prev + RESULT_LIMIT);
              }}
            >
              {isLoading ? "Loading..." : "Load More"}
            </Button>
          </div>
        )}
      </>
    );
  } else if (data && data.length === 0) {
    manageResults = (
      <div className="px-4 pt-3 lg:px-8">
        <h5> No Results Found </h5>
      </div>
    );
  }

  const Item = shrinked ? ShrinkedSidebarItem : SidebarItem;

  return (
    <>
      <Item
        text="Notifications"
        do={() => setShowNotifications(!showNotifications)}
        icon={<CareIcon className="care-l-bell h-5" />}
        badgeCount={unreadCount}
      />
      <SlideOver show={showNotifications} setShow={setShowNotifications}>
        <div className="bg-white h-full">
          <div className="w-full bg-gray-100 border-b sticky top-0 z-30 px-4 pb-1 lg:px-8">
            <div className="flex flex-col pt-4 py-2">
              <div className="grid grid-cols-3">
                <div>
                  <button
                    onClick={(_) => {
                      setReload(!reload);
                      setData([]);
                      setUnreadCount(0);
                      setOffset(0);
                    }}
                    className="inline-flex items-center font-semibold p-2 md:py-1 bg-white hover:bg-gray-300 border rounded text-xs shrink-0"
                  >
                    <i className="fa-fw fas fa-sync cursor-pointer mr-2" />{" "}
                    Reload
                  </button>
                </div>
                <div>
                  <button
                    onClick={(_) => setShowNotifications(false)}
                    className="inline-flex items-center font-semibold p-2 md:py-1 bg-white hover:bg-gray-300 border rounded text-xs shrink-0"
                  >
                    <i className="fa-fw fas fa-times cursor-pointer mr-2" />{" "}
                    Close
                  </button>
                </div>
                <div>
                  <button
                    onClick={handleSubscribeClick}
                    className="inline-flex items-center font-semibold p-2 md:py-1 bg-white active:bg-gray-300 border rounded text-xs shrink-0"
                    disabled={isSubscribing}
                  >
                    {isSubscribing && <Spinner />}
                    {getButtonText()}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="font-bold text-xl mt-4">Notifications</div>
                <button
                  className="inline-flex items-center font-semibold mt-4 p-2 md:py-1 bg-white hover:bg-gray-300 border rounded text-xs flex-shrink-0"
                  disabled={isMarkingAllAsRead}
                  onClick={handleMarkAllAsRead}
                >
                  {isMarkingAllAsRead ? (
                    <Spinner />
                  ) : (
                    <i className="fa-solid fa-check-double mr-2 text-primary-500" />
                  )}
                  Mark All as Read
                </button>
              </div>
            </div>

            <div>
              <div className="w-2/3">
                <span className="text-sm font-semibold">
                  Filter by category
                </span>
                <SelectField
                  name="event_filter"
                  variant="outlined"
                  margin="dense"
                  value={eventFilter}
                  options={[
                    { id: "", text: "Show All" },
                    ...NOTIFICATION_EVENTS.map((i) => {
                      if (i.id === "MESSAGE") return { ...i, text: "Notices" };
                      return i;
                    }),
                  ]}
                  onChange={(e: any) => setEventFilter(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>{manageResults}</div>
        </div>
      </SlideOver>
    </>
  );
}
