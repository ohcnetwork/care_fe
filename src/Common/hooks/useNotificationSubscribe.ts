import { useState } from "react";
import * as Sentry from "@sentry/browser";
import { useTranslation } from "react-i18next";
import { Error } from "../../Utils/Notifications.js";
import useAuthUser from "../../Common/hooks/useAuthUser";
import request from "../../Utils/request/request";
import routes from "../../Redux/api";

type SubscriptionStatusType =
  | ""
  | "NotSubscribed"
  | "SubscribedOnThisDevice"
  | "SubscribedOnAnotherDevice";

export default function useNotificationSubscribe() {
  const { username } = useAuthUser();
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatusType>("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const { t } = useTranslation();

  const intialSubscriptionState = async () => {
    try {
      const { data } = await request(routes.getUserPnconfig, {
        pathParams: { username },
      });
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();
      if (!subscription && !data?.pf_endpoint) {
        setSubscriptionStatus("NotSubscribed");
      } else if (subscription?.endpoint === data?.pf_endpoint) {
        setSubscriptionStatus("SubscribedOnThisDevice");
      } else {
        setSubscriptionStatus("SubscribedOnAnotherDevice");
      }
    } catch (error) {
      Sentry.captureException(error);
    }
  };

  const handleSubscribeClick = () => {
    const status = subscriptionStatus;
    if (status === "NotSubscribed" || status === "SubscribedOnAnotherDevice") {
      subscribe();
    } else {
      unsubscribe();
    }
  };

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

                await request(routes.updateUserPnconfig, {
                  body: data,
                  pathParams: { username },
                });

                setSubscriptionStatus("NotSubscribed");
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
        Sentry.captureException(_e);
      });
  };

  async function subscribe() {
    setIsSubscribing(true);

    const { data: responseData } = await request(routes.getPublicKey);

    const public_key = responseData?.public_key;
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

    const { res } = await request(routes.updateUserPnconfig, {
      body: data,
      pathParams: { username },
    });

    if (res && res?.status >= 200 && res?.status <= 300) {
      setSubscriptionStatus("SubscribedOnThisDevice");
    }
    setIsSubscribing(false);
  }

  return {
    subscriptionStatus,
    isSubscribing,
    setSubscriptionStatus,
    setIsSubscribing,
    handleSubscribeClick,
    intialSubscriptionState,
    subscribe,
    unsubscribe,
  };
}
