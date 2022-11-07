import { Link } from "raviger";
import * as Notification from "../../Utils/Notifications";
import { useEffect } from "react";
export default function Error404() {
  useEffect(() => {
    Notification.closeAllNotifications();
  }, []);
  return (
    <div className="flex justify-center text-center items-center h-screen">
      <div className="text-center w-[500px]">
        <img
          src={`${process.env.PUBLIC_URL}/images/404.svg`}
          alt="Error 404"
          className="w-full"
        />
        <h1>Page Not Found</h1>
        <p>
          It appears that you have stumbled upon a page that either does not
          exist or has been moved to another URL. Make sure you have entered the
          correct link!
          <br />
          <br />
          <Link
            href="/"
            className="rounded-lg px-4 py-2 inline-block bg-primary-600 text-white hover:text-white hover:bg-primary-700"
          >
            Return to CARE
          </Link>
        </p>
      </div>
    </div>
  );
}
