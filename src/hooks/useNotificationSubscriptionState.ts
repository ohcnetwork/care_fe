import * as Sentry from "@sentry/browser";
import { useEffect, useState } from "react";

import useAuthUser from "@/hooks/useAuthUser";

import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";

export type NotificationSubscriptionState =
  | "unsubscribed"
  | "subscribed"
  | "subscribed_on_other_device"
  | "subscribed"
  | "pending"
  | "error";

/**
 * This is a temporary hook and will be removed in the future.
 *
 * This hook is used to get the initial notification subscription state of the user.
 * @returns NotificationSubscriptionState
 */
export default function useNotificationSubscriptionState(
  dependencies: any[] = [],
) {
  const { username } = useAuthUser();
  const [subscriptionState, setSubscriptionState] =
    useState<NotificationSubscriptionState>("pending");

  const getSubscriptionState = async () => {
    try {
      const res = await request(routes.getUserPnconfig, {
        pathParams: { username },
      });

      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();

      if (!subscription && !res.data?.pf_endpoint) {
        setSubscriptionState("unsubscribed");
      } else if (subscription?.endpoint !== res.data?.pf_endpoint) {
        setSubscriptionState("subscribed_on_other_device");
      } else {
        setSubscriptionState("subscribed");
      }
    } catch (error) {
      setSubscriptionState("error");
      Sentry.captureException(error);
    }
  };

  useEffect(() => {
    getSubscriptionState();
  }, [username, ...dependencies]);

  return subscriptionState;
}
