import Auth from "./Auth.json";
import Common from "./Common.json";
import Entities from "./Entities.json";
import Facility from "./Facility.json";
import Hub from "./Hub.json";
import ErrorPages from "./ErrorPages.json";
import Shifting from "./Shifting.json";
import Notifications from "./Notifications.json";
import ExternalResult from "./ExternalResult.json";

export default {
  ...Auth,
  ...Common,
  ...Entities,
  ...Facility,
  ...Hub,
  ...ErrorPages,
  ...Shifting,
  ...Notifications,
  ...ExternalResult,
};
