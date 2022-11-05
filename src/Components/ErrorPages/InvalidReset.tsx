import * as Notification from "../../Utils/Notifications";
import { useEffect } from "react";
import { Link } from "raviger";

export default function InvalidReset() {
  useEffect(() => {
    Notification.closeAllNotifications();
  }, []);
  return (
    <div className="flex justify-center text-center items-center h-screen">
      <div className="text-center w-[500px]">
        <img
          src={`${process.env.PUBLIC_URL}/images/invalid_reset.svg`}
          alt="Session Expired"
          className="w-full"
        />
        <h1>Invalid password reset link</h1>
        <p>
          It appears that the password reset link you have used is either
          invalid or expired. Please request a new password reset link.
          <br />
          <br />
          <Link
            href="/forgot-password"
            className="rounded-lg px-4 py-2 inline-block bg-primary-600 text-white hover:text-white hover:bg-primary- cursor-pointer"
          >
            Return to Password Reset
          </Link>
        </p>
      </div>
    </div>
  );
}
