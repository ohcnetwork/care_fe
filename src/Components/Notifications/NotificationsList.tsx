import { navigate } from "raviger";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  getNotifications,
  markNotificationAsRead,
  getUserPnconfig,
  updateUserPnconfig,
  getPublicKey,
} from "../../Redux/actions";
import { useSelector } from "react-redux";
import { CircularProgress } from "@material-ui/core";
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
import SlideOver from "../../CAREUI/interactive/SlideOver";
import ButtonV2 from "../Common/components/ButtonV2";
import SelectMenuV2 from "../Form/SelectMenuV2";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

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
        "relative py-5 px-4 lg:px-8 hover:bg-gray-200 focus:bg-gray-200 transition ease-in-out duration-200 rounded md:rounded-lg cursor-pointer",
        result.read_at && "text-gray-500"
      )}
    >
      <div className="flex justify-between">
        <div className="text-lg font-bold">
          {getNotificationTitle(result.event)}
        </div>
        <div>
          <i className={`${getNotificationIcon(result.event)} fa-2x `} />
        </div>
      </div>
      <div className="text-sm py-1">{result.message}</div>
      <div className="flex flex-col justify-end gap-2">
        <div className="text-xs text-right py-1 text-secondary-700">
          {formatDate(result.created_date)}
        </div>
        <div className="flex justify-end gap-2">
          <ButtonV2
            className={classNames(
              "font-semibold px-2 py-1 bg-white hover:bg-secondary-300",
              result.read_at && "invisible"
            )}
            variant="secondary"
            border
            ghost
            disabled={isMarkingAsRead}
            onClick={(event) => {
              event.stopPropagation();
              handleMarkAsRead();
            }}
          >
            <CareIcon
              className={
                isMarkingAsRead
                  ? "care-l-spinner animate-spin"
                  : "care-l-envelope-check"
              }
            />
            <span className="text-xs">{t("mark_as_read")}</span>
          </ButtonV2>
          <ButtonV2
            border
            ghost
            className="font-semibold px-2 py-1 bg-white hover:bg-secondary-300 flex-shrink-0"
          >
            <CareIcon className="care-l-envelope-open" />
            <span className="text-xs">{t("open")}</span>
          </ButtonV2>
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
  const [open, setOpen] = useState(false);
  const [reload, setReload] = useState(false);
  const [eventFilter, setEventFilter] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMarkingAllAsRead, setIsMarkingAllAsRead] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

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
          <CareIcon className="care-l-bell" />
          <span className="text-xs">{t("subscribe")}</span>
        </>
      );
    } else if (status === "SubscribedOnAnotherDevice") {
      return (
        <>
          <CareIcon className="care-l-bell" />
          <span className="text-xs">{t("subscribe_on_this_device")}</span>
        </>
      );
    } else {
      return (
        <>
          <CareIcon className="care-l-bell-slash" />
          <span className="text-xs">{t("unsubscribe")}</span>
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
                  msg: t("unsubscribe_failed"),
                });
              });
          })
          .catch(function (_e) {
            Error({ msg: t("subscription_error") });
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
  }, [dispatch, reload, open, offset, eventFilter, isSubscribed]);

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
            setShowNotifications={setOpen}
          />
        ))}
        {isLoading && (
          <div className="flex items-center justify-center">
            <CircularProgress color="primary" />
          </div>
        )}
        {totalCount > RESULT_LIMIT && offset < totalCount - RESULT_LIMIT && (
          <div className="mt-4 flex w-full justify-center py-5 px-4 lg:px-8">
            <ButtonV2
              className="w-full"
              disabled={isLoading}
              variant="secondary"
              shadow
              border
              onClick={() => setOffset((prev) => prev + RESULT_LIMIT)}
            >
              {isLoading ? t("loading") : t("load_more")}
            </ButtonV2>
          </div>
        )}
      </>
    );
  } else if (data && data.length === 0) {
    manageResults = (
      <div className="px-4 pt-3 lg:px-8">
        <h5> {t("no_results_found")} </h5>
      </div>
    );
  }

  const Item = shrinked ? ShrinkedSidebarItem : SidebarItem;

  return (
    <>
      <Item
        text={t("Notifications")}
        do={() => setOpen(!open)}
        icon={<CareIcon className="care-l-bell h-5" />}
        badgeCount={unreadCount}
      />
      <SlideOver
        open={open}
        setOpen={setOpen}
        slideFrom="right"
        title={t("Notifications")}
        dialogClass="md:w-[400px]"
        onCloseClick={onClickCB}
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap">
            <ButtonV2
              ghost
              variant="secondary"
              onClick={() => {
                setReload(!reload);
                setData([]);
                setUnreadCount(0);
                setOffset(0);
              }}
            >
              <CareIcon className="care-l-sync" />
              <span className="text-xs">{t("reload")}</span>
            </ButtonV2>
            <ButtonV2
              onClick={handleSubscribeClick}
              ghost
              variant="secondary"
              disabled={isSubscribing}
            >
              {isSubscribing && <Spinner />}
              {getButtonText()}
            </ButtonV2>
            <ButtonV2
              ghost
              variant="secondary"
              disabled={isMarkingAllAsRead}
              onClick={handleMarkAllAsRead}
            >
              <CareIcon
                className={
                  isMarkingAllAsRead
                    ? "care-l-spinner animate-spin"
                    : "care-l-envelope-check"
                }
              />
              <span className="text-xs">{t("mark_all_as_read")}</span>
            </ButtonV2>
          </div>

          <SelectMenuV2
            className="mb-2"
            placeholder={t("filter_by_category")}
            options={NOTIFICATION_EVENTS}
            value={eventFilter}
            optionLabel={(o) => o.text}
            optionValue={(o) => o.id}
            optionIcon={(o) => <i className={`${o.icon} `} />}
            onChange={(v) => setEventFilter(v || "")}
          />
        </div>

        <div>{manageResults}</div>
      </SlideOver>
    </>
  );
}
