import Asset from "./Asset.json";
import Auth from "./Auth.json";
import Bed from "./Bed.json";
import Common from "./Common.json";
import Consultation from "./Consultation.json";
import CoverImageEdit from "./CoverImageEdit.json";
import Diagnosis from "./Diagnosis.json";
import Entities from "./Entities.json";
import ErrorPages from "./ErrorPages.json";
import ExternalResult from "./ExternalResult.json";
import Facility from "./Facility.json";
import Hub from "./Hub.json";
import Medicine from "./Medicine.json";
import Notifications from "./Notifications.json";
import Resource from "./Resource.json";
import Shifting from "./Shifting.json";
import SortOptions from "./SortOptions.json";
import Users from "./Users.json";

export default {
  ...Auth,
  ...Asset,
  ...Common,
  ...Consultation,
  ...CoverImageEdit,
  ...Entities,
  ...ErrorPages,
  ...ExternalResult,
  ...Facility,
  ...Hub,
  ...Medicine,
  ...Diagnosis,
  ...Notifications,
  ...Resource,
  ...Shifting,
  ...Bed,
  ...Users,
  SortOptions,
};
