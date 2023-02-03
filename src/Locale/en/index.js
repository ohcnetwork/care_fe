import Auth from "./Auth.json";
import Common from "./Common.json";
import Entities from "./Entities.json";
import Facility from "./Facility.json";
import ErrorPages from "./ErrorPages.json";
import Shifting from "./Shifting.json";
import Notifications from "./Notifications.json";

export default {
  ...Auth,
  ...Common,
  ...Entities,
  ...Facility,
  ...ErrorPages,
  ...Shifting,
  ...Notifications,
};
