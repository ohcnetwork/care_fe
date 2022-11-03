import * as Notification from "../../Utils/Notifications";
import { useEffect } from "react";
import { handleSignOut } from "../../Utils/utils";
export default function SessionExpired() {
  useEffect(() => {
    Notification.closeAllNotifications();
  }, []);
  return (
    <div className="flex justify-center text-center items-center h-screen">
      <div className="text-center w-[500px]">
        <img
          src={`${process.env.PUBLIC_URL}/images/session_expired.svg`}
          alt="Session Expired"
          className="w-full"
        />
        <h1>Session Expired</h1>
        <p>
          It appears that your session has expired. This could be due to
          inactivity. Please login again to continue.
          <br />
          <br />
          <div
            onClick={() => {
              handleSignOut(false);
            }}
            className="rounded-lg px-4 py-2 inline-block bg-primary-600 text-white hover:text-white hover:bg-primary- cursor-pointer"
          >
            Return to Login
          </div>
        </p>
      </div>
    </div>
  );
}
